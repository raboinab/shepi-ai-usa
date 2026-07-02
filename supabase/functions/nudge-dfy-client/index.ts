import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT_HOURS = 48;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const body = await req.json().catch(() => ({}));
    const { project_id, sent_by_system, custom_message } = body;
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey);

    // Auth: require either service-role (system trigger) or a valid user.
    // Do NOT allow arbitrary callers to set sent_by_system=true; only
    // service-role callers can bypass user identification.
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace("Bearer ", "");
    const isService = bearer && bearer === serviceKey;

    let senderUserId: string | null = null;
    if (!isService) {
      if (!bearer) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: { user }, error: authErr } = await admin.auth.getUser(bearer);
      senderUserId = user?.id ?? null;
      if (authErr || !senderUserId) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Verify caller is the accepted CPA on this project
      const { data: claim } = await admin
        .from("cpa_engagement_claims")
        .select("id, status")
        .eq("project_id", project_id)
        .eq("cpa_user_id", senderUserId)
        .eq("status", "accepted")
        .maybeSingle();
      if (!claim) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Effective flag: only trust sent_by_system if service-role caller
    const effectiveSentBySystem = isService ? !!sent_by_system : false;

    // Rate limit (48h)
    const cutoff = new Date(Date.now() - RATE_LIMIT_HOURS * 3600 * 1000).toISOString();
    const { data: recent } = await admin
      .from("cpa_nudges")
      .select("id, created_at")
      .eq("project_id", project_id)
      .gte("created_at", cutoff)
      .limit(1);
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({
        error: `A nudge was already sent in the last ${RATE_LIMIT_HOURS}h. Please wait.`,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load project + owner + claim
    const { data: project } = await admin
      .from("projects")
      .select("id, name, target_company, user_id, service_tier")
      .eq("id", project_id)
      .maybeSingle();
    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: claim } = await admin
      .from("cpa_claims")
      .select("id, cpa_user_id")
      .eq("project_id", project_id)
      .order("claimed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Compute missing required docs
    const { data: requirements } = await admin
      .from("project_document_requirements")
      .select("id, requirement_key, label, tier, marked_na")
      .eq("project_id", project_id)
      .eq("tier", "required")
      .eq("marked_na", false);

    const { data: docs } = await admin
      .from("documents")
      .select("account_type")
      .eq("project_id", project_id);
    const uploaded = new Set((docs ?? []).map(d => d.account_type).filter(Boolean));

    const { data: reviews } = await admin
      .from("project_document_reviews")
      .select("requirement_id, status")
      .eq("project_id", project_id);
    const reviewMap = new Map((reviews ?? []).map(r => [r.requirement_id, r.status]));

    const missing = (requirements ?? []).filter(r => {
      if (!uploaded.has(r.requirement_key)) return true;
      if (reviewMap.get(r.id) === "rejected") return true;
      return false;
    });

    if (missing.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: false, reason: "No missing required documents" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client email
    const { data: ownerUser } = await admin.auth.admin.getUserById(project.user_id);
    const clientEmail = ownerUser?.user?.email;
    const clientName = (ownerUser?.user?.user_metadata as any)?.full_name || clientEmail?.split("@")[0] || "there";

    if (!clientEmail) {
      return new Response(JSON.stringify({ error: "Could not resolve client email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectLabel = project.target_company || project.name || "your project";
    const missingList = missing.map(m => `<li>${m.label}</li>`).join("");
    const intro = effectiveSentBySystem
      ? `It's been a few days since your CPA reviewer was assigned to ${projectLabel}, and we're still waiting on some required documents to begin the analysis.`
      : `Your assigned CPA reviewer just sent a reminder — they need the following documents before they can begin the analysis on ${projectLabel}.`;

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #4a7c94;">Hi ${clientName},</h2>
        <p>${intro}</p>
        ${custom_message ? `<blockquote style="border-left: 3px solid #4a7c94; margin: 16px 0; padding: 8px 16px; color: #444; background: #f5f8fa;">${custom_message}</blockquote>` : ""}
        <p><strong>Missing required documents:</strong></p>
        <ul style="line-height: 1.7;">${missingList}</ul>
        <p style="margin: 24px 0;">
          <a href="https://shepi.ai/project/${project_id}"
             style="display:inline-block; background:#4a7c94; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:600;">
            Upload Documents →
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">The CPA review cannot start until all required documents are uploaded. Reply to this email if you have questions.</p>
        <p style="color: #999; font-size: 12px;">— The shepi Team</p>
      </div>
    `;

    let emailId: string | null = null;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "shepi <hello@shepi.ai>",
          to: [clientEmail],
          reply_to: "hello@shepi.ai",
          subject: `Action needed: documents for ${projectLabel}`,
          html,
        }),
      });
      const result = await res.json().catch(() => ({}));
      emailId = result?.id ?? null;
    }

    // In-app notification for client
    await admin.from("cpa_notifications").insert({
      user_id: project.user_id,
      event_type: "doc_intake_nudge",
      title: "Your CPA reviewer needs more documents",
      body: `${missing.length} required document${missing.length === 1 ? "" : "s"} still needed for ${projectLabel}.`,
      link: `/project/${project_id}`,
      payload: { project_id, missing_keys: missing.map(m => m.requirement_key) },
    });

    // Log nudge
    await admin.from("cpa_nudges").insert({
      claim_id: claim?.id ?? null,
      project_id,
      sent_by_user_id: senderUserId,
      sent_by_system: effectiveSentBySystem,
      missing_keys: missing.map(m => m.requirement_key),
      email_id: emailId,
      message: custom_message ?? null,
    });

    return new Response(JSON.stringify({ ok: true, sent: true, email_id: emailId, missing: missing.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[nudge-dfy-client] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
