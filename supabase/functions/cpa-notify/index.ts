// Unified CPA notifications dispatcher.
// Fanouts in-app cpa_notifications rows + Resend emails for the relevant
// event types. Called by Postgres triggers via pg_net (server-to-server),
// so verify_jwt=false is set in supabase/config.toml.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("CPA_ADMIN_EMAIL") || "team@shepi.ai";
const APP_URL = Deno.env.get("APP_URL") || "https://shepi.ai";
const FROM = "Shepi <notifications@shepi.ai>";
const FUNCTION_NAME = "cpa-notify";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type Recipient = { user_id: string; email: string | null };

type SendCtx = {
  event_type: string;
  related_project_id?: string | null;
  related_user_id?: string | null;
};

async function logSend(row: {
  to_email: string;
  event_type: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error?: string | null;
  resend_id?: string | null;
  related_project_id?: string | null;
  related_user_id?: string | null;
}) {
  try {
    await supabase.from("email_send_log").insert({ ...row, function_name: FUNCTION_NAME });
  } catch (e) {
    console.error("[cpa-notify] email_send_log insert failed", e);
  }
}

async function sendEmail(to: string, subject: string, html: string, ctx: SendCtx = { event_type: "unknown" }) {
  if (!RESEND_API_KEY) {
    console.log("[cpa-notify] email skipped — missing RESEND_API_KEY", { to, subject });
    await logSend({ to_email: to, event_type: ctx.event_type, subject, status: "skipped", error: "RESEND_API_KEY missing", related_project_id: ctx.related_project_id, related_user_id: ctx.related_user_id });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[cpa-notify] resend error", res.status, body);
      await logSend({ to_email: to, event_type: ctx.event_type, subject, status: "failed", error: `HTTP ${res.status}: ${JSON.stringify(body)}`, related_project_id: ctx.related_project_id, related_user_id: ctx.related_user_id });
      return;
    }
    await logSend({ to_email: to, event_type: ctx.event_type, subject, status: "sent", resend_id: body?.id ?? null, related_project_id: ctx.related_project_id, related_user_id: ctx.related_user_id });
  } catch (e) {
    console.error("[cpa-notify] resend exception", e);
    await logSend({ to_email: to, event_type: ctx.event_type, subject, status: "failed", error: String(e), related_project_id: ctx.related_project_id, related_user_id: ctx.related_user_id });
  }
}

async function insertNotification(
  user_id: string,
  event_type: string,
  title: string,
  body: string,
  link: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from("cpa_notifications").insert({
    user_id, event_type, title, body, link, payload,
  });
  if (error) console.error("[cpa-notify] insert notification error", error);
}

async function getEmail(user_id: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(user_id);
  return data?.user?.email ?? null;
}

async function getProject(project_id: string) {
  const { data } = await supabase
    .from("projects")
    .select("id, user_id, name, target_company, client_name, industry, transaction_type, service_tier")
    .eq("id", project_id)
    .maybeSingle();
  return data;
}

// ---------- handlers ----------

async function handleDfyProjectPosted(p: any) {
  const project = await getProject(p.project_id);
  if (!project) return;

  // Match active CPAs: states_served + industries OR no filter set
  const { data: cpas } = await supabase
    .from("cpa_profiles")
    .select("user_id, email, full_name, industries")
    .eq("active", true);

  const matches: Recipient[] = (cpas ?? [])
    .filter((c: any) => {
      if (!c.industries || c.industries.length === 0) return true;
      if (!project.industry) return true;
      return c.industries.includes(project.industry);
    })
    .map((c: any) => ({ user_id: c.user_id, email: c.email }));

  const title = `New DFY engagement available`;
  const body = `${project.target_company || project.name} (${project.industry || "industry n/a"}) is ready to be claimed.`;
  const link = `/cpa/queue`;

  for (const r of matches) {
    await insertNotification(r.user_id, "dfy_project_posted", title, body, link, { project_id: project.id });
    if (r.email) {
      await sendEmail(
        r.email,
        `[Shepi] ${title}: ${project.target_company || project.name}`,
        `<div style="font-family:sans-serif;max-width:520px">
          <h2>New engagement in your queue</h2>
          <p><strong>${project.target_company || project.name}</strong> — ${project.industry || "industry n/a"}</p>
          <p>${project.client_name ? `Client: ${project.client_name}<br/>` : ""}Transaction: ${project.transaction_type || "n/a"}</p>
          <p><a href="${APP_URL}${link}">Open the queue</a> to claim it.</p>
        </div>`,
        { event_type: "dfy_project_posted", related_project_id: project.id, related_user_id: r.user_id },
      );
    }
  }
}

async function handleClaimEvent(p: any, status: "created" | "changed") {
  const project = await getProject(p.project_id);
  if (!project) return;

  // CPA name
  const { data: cpa } = await supabase
    .from("cpa_profiles")
    .select("full_name, email")
    .eq("user_id", p.cpa_user_id)
    .maybeSingle();
  const cpaName = cpa?.full_name || "Your CPA reviewer";

  // Notify project owner (client)
  if (project.user_id) {
    const ownerEmail = await getEmail(project.user_id);
    const title =
      status === "created"
        ? `${cpaName} was assigned to your engagement`
        : `Engagement status updated: ${p.status}`;
    const body =
      status === "created"
        ? `${cpaName} has claimed ${project.target_company || project.name} and will begin review shortly.`
        : `Status moved from ${p.previous_status || "—"} to ${p.status} for ${project.target_company || project.name}.`;
    const link = `/projects/${project.id}`;
    await insertNotification(project.user_id, `claim_${status}`, title, body, link, {
      project_id: project.id, claim_id: p.claim_id, status: p.status,
    });
    if (ownerEmail) {
      await sendEmail(
        ownerEmail,
        `[Shepi] ${title}`,
        `<div style="font-family:sans-serif;max-width:520px">
          <h2>${title}</h2>
          <p>${body}</p>
          <p><a href="${APP_URL}${link}">Open project</a></p>
        </div>`,
        { event_type: `claim_${status}`, related_project_id: project.id, related_user_id: project.user_id },
      );
    }
  }

  // Notify admin on any claim event
  await sendEmail(
    ADMIN_EMAIL,
    `[Shepi] CPA claim ${status}: ${project.target_company || project.name}`,
    `<div style="font-family:sans-serif;max-width:520px">
      <p><strong>CPA:</strong> ${cpaName} (${cpa?.email || "no email"})</p>
      <p><strong>Project:</strong> ${project.target_company || project.name}</p>
      <p><strong>Status:</strong> ${p.previous_status ? `${p.previous_status} → ` : ""}${p.status}</p>
    </div>`,
    { event_type: `admin_claim_${status}`, related_project_id: project.id },
  );
}

async function handleChatMessage(p: any) {
  // Find the CPA claim for this project
  const { data: claim } = await supabase
    .from("cpa_claims")
    .select("cpa_user_id")
    .eq("project_id", p.project_id)
    .maybeSingle();
  if (!claim) return;

  const project = await getProject(p.project_id);
  if (!project) return;

  // Recipient = the other party
  let recipient_user_id: string;
  if (p.sender_user_id === claim.cpa_user_id) {
    if (!project.user_id) return;
    recipient_user_id = project.user_id;
  } else {
    recipient_user_id = claim.cpa_user_id;
  }

  // Always create in-app notification
  const title = `New message on ${project.target_company || project.name}`;
  const link = `/projects/${project.id}/chat`;
  await insertNotification(
    recipient_user_id, "chat_message", title, p.preview || "", link,
    { project_id: project.id, message_id: p.message_id },
  );

  // Debounce email: 1h per recipient+project via nudge_log
  const nudgeType = `chat:${project.id}`;
  const { data: recent } = await supabase
    .from("nudge_log")
    .select("id")
    .eq("user_id", recipient_user_id)
    .eq("nudge_type", nudgeType)
    .gte("sent_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(1);
  if (recent && recent.length > 0) return;

  const email = await getEmail(recipient_user_id);
  if (!email) return;
  await sendEmail(
    email,
    `[Shepi] ${title}`,
    `<div style="font-family:sans-serif;max-width:520px">
      <h2>${title}</h2>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#444">${(p.preview || "").replace(/</g, "&lt;")}</blockquote>
      <p><a href="${APP_URL}${link}">Reply in Shepi</a></p>
      <p style="color:#888;font-size:12px">You'll receive at most one email per hour per project.</p>
    </div>`,
    { event_type: "chat_message", related_project_id: project.id, related_user_id: recipient_user_id },
  );
  await supabase.from("nudge_log").insert({
    user_id: recipient_user_id, nudge_type: nudgeType,
  });
}

async function handleSlaCheck() {
  // in_progress claims older than 5 business days (approximated as 7 calendar days)
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from("cpa_claims")
    .select("id, project_id, cpa_user_id, claimed_at, status")
    .eq("status", "in_progress")
    .lt("claimed_at", cutoff);

  if (!stale || stale.length === 0) return { stale: 0 };

  const lines: string[] = [];
  for (const claim of stale) {
    const project = await getProject(claim.project_id);
    const { data: cpa } = await supabase
      .from("cpa_profiles")
      .select("full_name, email")
      .eq("user_id", claim.cpa_user_id)
      .maybeSingle();
    const ageDays = Math.floor(
      (Date.now() - new Date(claim.claimed_at).getTime()) / (24 * 60 * 60 * 1000),
    );
    lines.push(
      `<li>${project?.target_company || project?.name || claim.project_id} — ${cpa?.full_name || "CPA"} (${cpa?.email || "?"}) — ${ageDays}d open</li>`,
    );
    // Per-CPA nudge
    await insertNotification(
      claim.cpa_user_id, "sla_warning",
      `Engagement open ${ageDays} days`,
      `${project?.target_company || project?.name || "Project"} has been in progress for ${ageDays} days.`,
      `/cpa/engagements`, { project_id: claim.project_id, claim_id: claim.id, age_days: ageDays },
    );
    if (cpa?.email) {
      await sendEmail(
        cpa.email,
        `[Shepi] Engagement open ${ageDays} days — ${project?.target_company || project?.name}`,
        `<div style="font-family:sans-serif;max-width:520px">
          <h2>SLA reminder</h2>
          <p>Your engagement <strong>${project?.target_company || project?.name}</strong> has been in progress for ${ageDays} days. If you've completed your review, please mark it complete.</p>
          <p><a href="${APP_URL}/cpa/engagements">Open engagements</a></p>
        </div>`,
        { event_type: "sla_warning", related_project_id: claim.project_id, related_user_id: claim.cpa_user_id },
      );
    }
  }

  await sendEmail(
    ADMIN_EMAIL,
    `[Shepi] Daily CPA SLA report — ${stale.length} engagement(s) over 7 days`,
    `<div style="font-family:sans-serif;max-width:560px">
      <h2>Engagements over SLA</h2>
      <ul>${lines.join("")}</ul>
    </div>`,
    { event_type: "sla_report_admin" },
  );

  return { stale: stale.length };
}

// ---------- entrypoint ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const payload = await req.json();
    const event = payload.event_type;
    console.log("[cpa-notify] event", event, payload);

    switch (event) {
      case "dfy_project_posted":
        await handleDfyProjectPosted(payload);
        break;
      case "claim_created":
        await handleClaimEvent(payload, "created");
        break;
      case "claim_status_changed":
        await handleClaimEvent(payload, "changed");
        break;
      case "chat_message":
        await handleChatMessage(payload);
        break;
      case "sla_check":
        await handleSlaCheck();
        break;
      default:
        return new Response(JSON.stringify({ error: "unknown event_type" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[cpa-notify] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
