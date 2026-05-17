import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * POST /api/public/hooks/cpa-auto-accept
 *
 * Idempotent: flips cpa_claims rows from "proposed" -> "accepted" when the
 * client has not explicitly accepted within 48 hours. Designed to be called
 * hourly by pg_cron. No auth required because the action itself is benign
 * and the WHERE filter is tight.
 */
export const Route = createFileRoute("/api/public/hooks/cpa-auto-accept")({
  server: {
    handlers: {
      POST: async () => {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        // Pull eligible claims first so we can write notifications too.
        const { data: eligible, error: selErr } = await supabaseAdmin
          .from("cpa_claims")
          .select("id, project_id, cpa_user_id")
          .eq("status", "proposed")
          .is("withdrawn_at", null)
          .lt("claimed_at", cutoff);

        if (selErr) {
          console.error("[cpa-auto-accept] select failed", selErr);
          return Response.json(
            { error: selErr.message },
            { status: 500 },
          );
        }

        if (!eligible || eligible.length === 0) {
          return Response.json({ accepted: 0 });
        }

        const ids = eligible.map((c) => c.id);
        const now = new Date().toISOString();

        const { error: updErr } = await supabaseAdmin
          .from("cpa_claims")
          .update({
            status: "accepted",
            accepted_at: now,
            // accepted_by_user_id stays NULL -> "auto-accepted" marker
          })
          .in("id", ids)
          .eq("status", "proposed"); // race guard

        if (updErr) {
          console.error("[cpa-auto-accept] update failed", updErr);
          return Response.json(
            { error: updErr.message },
            { status: 500 },
          );
        }

        // Notify CPAs + project owners. Don't fail the cron on notification errors.
        const ownerLookup = await supabaseAdmin
          .from("projects")
          .select("id, user_id")
          .in(
            "id",
            eligible.map((c) => c.project_id),
          );
        const ownerMap = new Map(
          (ownerLookup.data || []).map((p) => [p.id, p.user_id as string]),
        );

        const notifications: Array<{
          user_id: string;
          event_type: string;
          title: string;
          body: string;
          link: string;
          payload: Record<string, unknown>;
        }> = [];
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
              body: "48h elapsed without action — your CPA is now starting review.",
              link: `/project/${c.project_id}`,
              payload: { claim_id: c.id, project_id: c.project_id },
            });
          }
        }
        if (notifications.length) {
          const { error: notErr } = await supabaseAdmin
            .from("cpa_notifications")
            .insert(notifications);
          if (notErr) console.error("[cpa-auto-accept] notify failed", notErr);
        }

        console.log(`[cpa-auto-accept] accepted ${eligible.length} claims`);
        return Response.json({ accepted: eligible.length });
      },
    },
  },
});
