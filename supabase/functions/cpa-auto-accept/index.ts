// Hourly cron entrypoint — invoked by pg_cron via pg_net.
// Flips cpa_claims rows from "proposed" -> "accepted" when the client has
// not explicitly accepted within 48 hours. Idempotent: the WHERE filter
// excludes already-accepted/withdrawn rows.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const cutoff = new Date(Date.now() - FORTY_EIGHT_HOURS_MS).toISOString();

    const { data: eligible, error: selErr } = await supabase
      .from("cpa_claims")
      .select("id, project_id, cpa_user_id")
      .eq("status", "proposed")
      .is("withdrawn_at", null)
      .lt("claimed_at", cutoff);

    if (selErr) throw selErr;
    if (!eligible || eligible.length === 0) {
      return new Response(JSON.stringify({ accepted: 0 }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ids = eligible.map((c) => c.id);
    const now = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("cpa_claims")
      .update({
        status: "accepted",
        accepted_at: now,
        // accepted_by_user_id left NULL -> indicates auto-acceptance
      })
      .in("id", ids)
      .eq("status", "proposed"); // race guard
    if (updErr) throw updErr;

    // Project owner lookup for client-side notifications.
    const { data: owners } = await supabase
      .from("projects")
      .select("id, user_id")
      .in("id", eligible.map((c) => c.project_id));
    const ownerMap = new Map((owners || []).map((p) => [p.id, p.user_id as string]));

    const notifications: Array<Record<string, unknown>> = [];
    for (const c of eligible) {
      notifications.push({
        user_id: c.cpa_user_id,
        event_type: "claim_auto_accepted",
        title: "Engagement auto-confirmed",
        body: "Client did not respond within 48h. You may begin review.",
        link: `/cpa/engagements/${c.project_id}`,
        payload: { claim_id: c.id, project_id: c.project_id },
      });
      const ownerId = ownerMap.get(c.project_id);
      if (ownerId) {
        notifications.push({
          user_id: ownerId,
          event_type: "claim_auto_accepted_client",
          title: "Your CPA reviewer was auto-confirmed",
          body: "48 hours elapsed without action — your CPA is now starting review.",
          link: `/project/${c.project_id}`,
          payload: { claim_id: c.id, project_id: c.project_id },
        });
      }
    }
    if (notifications.length) {
      const { error: notErr } = await supabase
        .from("cpa_notifications")
        .insert(notifications);
      if (notErr) console.error("[cpa-auto-accept] notify error", notErr);
    }

    console.log(`[cpa-auto-accept] accepted ${eligible.length} claims`);
    return new Response(JSON.stringify({ accepted: eligible.length }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[cpa-auto-accept] failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
