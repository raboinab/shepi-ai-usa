// Shared auth helpers for edge functions.
// Verifies the caller's JWT and (optionally) that they have access to a project.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export type AuthedUser = { id: string; email?: string | null };

export type AuthResult =
  | { ok: true; user: AuthedUser; token: string }
  | { ok: false; response: Response };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: jsonError(401, "Unauthorized") };
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { ok: false, response: jsonError(401, "Unauthorized") };

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, response: jsonError(401, "Invalid or expired token") };
  }
  return { ok: true, user: { id: data.user.id, email: data.user.email }, token };
}

export async function requireProjectAccess(
  req: Request,
  projectId: string | null | undefined,
): Promise<AuthResult> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;
  if (!projectId) {
    return { ok: false, response: jsonError(400, "project_id required") };
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin.rpc("has_project_access", {
    _user_id: auth.user.id,
    _project_id: projectId,
  });
  if (error || data !== true) {
    return { ok: false, response: jsonError(403, "Forbidden") };
  }
  return auth;
}

// Constant-time-ish equality for cron secret comparison.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Accepts either the service-role key (pg_cron / server-to-server) or a
// dedicated CRON_SECRET env var. Rejects everything else.
export function requireCron(req: Request): AuthResult {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  if (
    token &&
    (timingSafeEqual(token, SERVICE_ROLE_KEY) ||
      (cronSecret && timingSafeEqual(token, cronSecret)))
  ) {
    return { ok: true, user: { id: "cron" }, token };
  }
  return { ok: false, response: jsonError(401, "Unauthorized") };
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
