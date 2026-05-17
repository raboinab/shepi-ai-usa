// On-demand probe: confirms the Vercel AI Gateway key has ZDR enforced.
// Returns { ok: true } when ZDR is verified, or { ok: false, error } otherwise.
// Safe to call from the dashboard, a health check, or a deploy hook.

import { ensureZdrEnabled, resetZdrCache } from "../_shared/zdrGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // Always re-probe so this endpoint never reports a stale cached success.
  resetZdrCache();
  try {
    await ensureZdrEnabled();
    return new Response(JSON.stringify({ ok: true, message: "ZDR verified on Vercel AI Gateway key." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
