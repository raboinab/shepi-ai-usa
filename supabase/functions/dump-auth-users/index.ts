// Lists all auth.users with metadata for migration to a new project.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const admin = createClient(auth.supabaseUrl, auth.serviceRoleKey);
    const all: Array<Record<string, unknown>> = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return errorResponse(error.message);
      if (!data?.users?.length) break;
      for (const u of data.users) {
        all.push({
          id: u.id,
          email: u.email,
          phone: u.phone,
          email_confirmed_at: u.email_confirmed_at,
          phone_confirmed_at: u.phone_confirmed_at,
          last_sign_in_at: u.last_sign_in_at,
          created_at: u.created_at,
          user_metadata: u.user_metadata,
          app_metadata: u.app_metadata,
          identities: (u.identities ?? []).map((i: any) => ({
            provider: i.provider,
            identity_data: i.identity_data,
          })),
        });
      }
      if (data.users.length < perPage) break;
      page++;
    }

    return jsonResponse({ users: all, count: all.length });
  } catch (e) {
    console.error("dump-auth-users error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
