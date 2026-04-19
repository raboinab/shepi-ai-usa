import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const { project_id } = body;

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "Missing project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to insert job (so it works with RLS)
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auto-expire stale jobs older than 30 minutes
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: expiredJobs } = await serviceClient
      .from("analysis_jobs")
      .update({ status: "failed", error_message: "Auto-expired: stale after 30 minutes" })
      .eq("project_id", project_id)
      .in("status", ["queued", "running"])
      .lt("requested_at", staleThreshold)
      .select("id");

    if (expiredJobs && expiredJobs.length > 0) {
      console.log(`[trigger-discovery] Auto-expired ${expiredJobs.length} stale jobs for project ${project_id}`);
    }

    // Check for existing active discovery job before creating a new one
    const { data: activeJobs, error: activeJobErr } = await serviceClient
      .from("analysis_jobs")
      .select("id, status, progress_percent")
      .eq("project_id", project_id)
      .in("status", ["queued", "running"])
      .in("job_type", ["full_discovery", "discovery"])
      .order("requested_at", { ascending: false })
      .limit(1);

    if (!activeJobErr && activeJobs && activeJobs.length > 0) {
      const existing = activeJobs[0];
      console.log(`[trigger-discovery] Active job ${existing.id} already exists for project ${project_id} (status: ${existing.status})`);
      return new Response(
        JSON.stringify({ job_id: existing.id, status: "already_running" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert job row
    const { data: job, error: insertError } = await serviceClient
      .from("analysis_jobs")
      .insert({
        project_id,
        user_id: userId,
        job_type: "full_discovery",
        status: "queued",
        config_json: {},
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create analysis job:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create job", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the Python discovery service
    const discoveryUrl = Deno.env.get("DISCOVERY_SERVICE_URL");
    const discoveryKey = Deno.env.get("DISCOVERY_SERVICE_KEY");

    if (discoveryUrl && discoveryKey) {
      try {
        // Pre-fetch GL row count so the service can adapt its chunking strategy
        let glRowCount = 0;
        try {
          const { data: glMeta } = await serviceClient.rpc("fetch_processed_data_ids", {
            _project_id: project_id,
            _data_type: "general_ledger",
          });
          glRowCount = glMeta?.length ?? 0;
          console.log(`[trigger-discovery] GL row count for project ${project_id}: ${glRowCount}`);
        } catch (glErr) {
          console.warn("[trigger-discovery] Could not fetch GL row count:", glErr);
        }

        const response = await fetch(`${discoveryUrl}/api/v1/jobs/discovery`, {
          method: "POST",
          headers: {
            "x-service-key": discoveryKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id,
            job_id: job.id,
            db_url: Deno.env.get("SUPABASE_DB_URL"),
            supabase_url: Deno.env.get("SUPABASE_URL"),
            supabase_service_role_key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
            // Hints for adaptive chunking of large JSONB rows
            data_hints: {
              use_chunked_gl_fetch: true,
              gl_row_count: glRowCount,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Discovery service returned ${response.status}: ${errText}`);
          // Update job to failed
          await serviceClient
            .from("analysis_jobs")
            .update({ status: "failed", error_message: `Service error: ${response.status}` })
            .eq("id", job.id);

          return new Response(
            JSON.stringify({ error: "Discovery service error", job_id: job.id }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        await response.text(); // consume body
      } catch (fetchErr) {
        console.error("Failed to reach discovery service:", fetchErr);
        await serviceClient
          .from("analysis_jobs")
          .update({ status: "failed", error_message: "Could not reach discovery service" })
          .eq("id", job.id);

        return new Response(
          JSON.stringify({ error: "Discovery service unreachable", job_id: job.id }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("DISCOVERY_SERVICE_URL or DISCOVERY_SERVICE_KEY not configured");
    }

    console.log(`[trigger-discovery] Job ${job.id} queued for project ${project_id}`);

    return new Response(
      JSON.stringify({ job_id: job.id, status: "queued" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("trigger-discovery error:", error);
    console.error("Full error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
