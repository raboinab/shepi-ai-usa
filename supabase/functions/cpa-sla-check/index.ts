// Daily cron entrypoint — invoked by pg_cron via pg_net.
// Delegates to cpa-notify with event_type='sla_check'.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cpa-notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ event_type: "sla_check" }),
  });
  const body = await res.text();
  return new Response(body, { status: res.status });
});
