// Shared admin auth helper for migration edge functions.
// All responses use HTTP 200 with `{ ok: boolean }` payload so supabase-js
// never swallows the body on non-2xx.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export async function requireAdmin(req: Request): Promise<
  | { ok: true; userId: string; supabaseUrl: string; serviceRoleKey: string }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false, response: errorResponse("Unauthorized", "auth") };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Bypass: management token (used from sandbox/CI). Matches MIGRATION_MANAGEMENT_TOKEN.
  const mgmtToken = Deno.env.get("MIGRATION_MANAGEMENT_TOKEN");
  const presented = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (mgmtToken && presented === mgmtToken) {
    return { ok: true, userId: "migration-management", supabaseUrl, serviceRoleKey };
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  if (userError || !user) {
    return { ok: false, response: errorResponse("Invalid token", "auth") };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: isAdmin } = await adminClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return { ok: false, response: errorResponse("Admin only", "auth") };
  }

  return { ok: true, userId: user.id, supabaseUrl, serviceRoleKey };
}

export function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Errors return HTTP 200 so supabase-js exposes the body.
export function errorResponse(message: string, stage = "unknown"): Response {
  return new Response(JSON.stringify({ ok: false, error: message, stage }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
