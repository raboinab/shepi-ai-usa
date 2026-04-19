// Creates auth users in the target project preserving UUIDs.
// Calls POST {MIGRATION_TARGET_URL}/auth/v1/admin/users for each user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL");
    const targetKey = Deno.env.get("MIGRATION_TARGET_SERVICE_ROLE_KEY");
    if (!targetUrl || !targetKey) return errorResponse("MIGRATION_TARGET_URL or MIGRATION_TARGET_SERVICE_ROLE_KEY not configured", 500);

    const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
    const admin = createClient(auth.supabaseUrl, auth.serviceRoleKey);

    // List source users
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return errorResponse(error.message);
      if (!data?.users?.length) break;
      allUsers.push(...data.users);
      if (data.users.length < 200) break;
      page++;
    }

    const isExistsErr = (msg: string, status?: number) =>
      /already|exists|duplicate|registered/i.test(msg) || status === 409 || status === 422;

    const results: Array<{ id: string; email: string | undefined; status: string; error?: string; error_code?: string; http_status?: number }> = [];
    for (const u of allUsers) {
      try {
        // Pre-flight: does this UUID already exist on target?
        const { data: existing } = await target.auth.admin.getUserById(u.id);
        if (existing?.user) {
          const sameEmail = (existing.user.email ?? "") === (u.email ?? "");
          results.push({
            id: u.id,
            email: u.email,
            status: sameEmail ? "exists" : "exists_uuid_mismatch",
          });
          continue;
        }

        // Build payload — strip app_metadata (provider/providers managed by identities)
        // Mark as migration import so target triggers can skip side-effects (notifications, emails)
        const payload: any = {
          id: u.id,
          email: u.email ?? undefined,
          phone: u.phone ?? undefined,
          email_confirm: !!u.email_confirmed_at,
          phone_confirm: !!u.phone_confirmed_at,
          user_metadata: { ...(u.user_metadata ?? {}), __migration_import: true },
        };

        const { error } = await target.auth.admin.createUser(payload);
        if (error) {
          const anyErr = error as any;
          const status = anyErr?.status as number | undefined;
          const code = anyErr?.code as string | undefined;
          if (isExistsErr(error.message, status)) {
            results.push({ id: u.id, email: u.email, status: "exists", error: error.message, http_status: status, error_code: code });
          } else {
            results.push({ id: u.id, email: u.email, status: "error", error: error.message, http_status: status, error_code: code });
          }
        } else {
          results.push({ id: u.id, email: u.email, status: "created" });
        }
      } catch (e) {
        results.push({ id: u.id, email: u.email, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === "created").length,
      exists: results.filter((r) => r.status === "exists" || r.status === "exists_uuid_mismatch").length,
      errors: results.filter((r) => r.status === "error").length,
    };
    return jsonResponse({ summary, results });
  } catch (e) {
    console.error("migrate-push-auth error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
