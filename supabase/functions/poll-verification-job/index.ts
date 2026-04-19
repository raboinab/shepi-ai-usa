import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STATUS_MAP: Record<string, string> = {
  verified: "validated",
  partial_match: "partial",
  not_found: "insufficient",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { jobId, adjustmentId, projectId } = body;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Missing jobId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discoveryUrl = Deno.env.get("DISCOVERY_SERVICE_URL");
    const discoveryKey = Deno.env.get("DISCOVERY_SERVICE_KEY");

    if (!discoveryUrl || !discoveryKey) {
      return new Response(
        JSON.stringify({ error: "Discovery service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`${discoveryUrl}/api/v1/jobs/${jobId}`, {
      method: "GET",
      headers: {
        "x-service-key": discoveryKey,
        "x-supabase-url": supabaseUrl,
        "x-supabase-key": serviceRoleKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Poll job ${jobId} returned ${response.status}: ${errText}`);
      return new Response(
        JSON.stringify({ error: `Job status error: ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    // When completed, persist to adjustment_proofs
    if (result.status === "completed" && result.detector_summary && adjustmentId && projectId) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      try {
        const ds = result.detector_summary;
        const mappedStatus = STATUS_MAP[ds.status] || "pending";
        const scoreMap: Record<string, number> = { verified: 90, partial_match: 60, not_found: 20 };
        const score = scoreMap[ds.status] ?? 30;

        // ── Enriched key_findings ──
        // Start with the AI summary if available, then add matching transaction descriptions
        const keyFindings: string[] = [];
        if (ds.summary && typeof ds.summary === "string" && ds.summary.trim()) {
          keyFindings.push(ds.summary.trim());
        }
        const matchingTxns = ds.matching_transactions || [];
        for (const t of matchingTxns.slice(0, 5)) {
          const desc = t.description || t.account_name || (t.amount != null ? `$${t.amount}` : null);
          if (desc) keyFindings.push(desc);
        }

        // ── Enriched red_flags ──
        // Include contradictions AND high-severity data gaps
        const redFlags: string[] = [];
        const contradictions = ds.contradictions || [];
        for (const c of contradictions) {
          if (c.description) redFlags.push(c.description);
        }
        const dataGaps = ds.data_gaps || [];
        for (const g of dataGaps) {
          if (g.severity === "high" && g.description) {
            redFlags.push(`[Data Gap] ${g.description}`);
          }
        }

        // ── Structured ai_analysis ──
        const aiAnalysis: Record<string, unknown> = {
          summary: ds.summary || null,
          methodology_audit: ds.methodology_audit || null,
          cross_source_validation: ds.cross_source_validation || null,
          data_gaps: dataGaps,
          comprehensive_accounts: ds.comprehensive_accounts || null,
          match_count: matchingTxns.length,
          total_matched_amount: matchingTxns.reduce(
            (s: number, t: { amount?: number }) => s + (Math.abs(t.amount ?? 0)), 0
          ),
          contradiction_count: contradictions.length,
          data_gap_count: dataGaps.length,
        };

        // adjustment_proofs has a PARTIAL unique index (WHERE verification_type <> 'document_attachment'),
        // which Postgres ON CONFLICT cannot target. Use manual query-then-update/insert.
        const { data: existingProof } = await supabaseAdmin
          .from("adjustment_proofs")
          .select("id")
          .eq("adjustment_id", adjustmentId)
          .eq("verification_type", "ai_verification")
          .maybeSingle();

        const proofPayload = {
          adjustment_id: adjustmentId,
          verification_type: "ai_verification",
          project_id: projectId,
          user_id: user.id,
          validation_status: mappedStatus,
          validation_score: score,
          traceability_data: ds,
          ai_analysis: aiAnalysis,
          key_findings: keyFindings,
          red_flags: redFlags,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: writeError } = existingProof
          ? await supabaseAdmin.from("adjustment_proofs").update(proofPayload).eq("id", existingProof.id)
          : await supabaseAdmin.from("adjustment_proofs").insert(proofPayload);

        if (writeError) {
          console.error("[poll] Failed to persist proof:", writeError.message);
        } else {
          console.log("[poll] Persisted proof for adjustment:", adjustmentId, existingProof ? "(updated)" : "(inserted)");
        }
      } catch (persistErr) {
        console.error("[poll] Persist error:", persistErr);
      }
    }

    return new Response(
      JSON.stringify({
        status: result.status,
        progress_percent: result.progress_percent ?? 0,
        error_message: result.error_message ?? null,
        detector_summary: result.status === "completed" ? result.detector_summary : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("poll-verification-job error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
