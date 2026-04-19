// Patches target-DB triggers so migrated auth users don't fail signup side-effects.
// Connects directly to MIGRATION_TARGET_DB_URL via postgres client (bypasses SQL editor parsing).
import postgres from "https://deno.land/x/postgresjs/mod.js";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const HANDLE_NEW_USER_SQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
`;

const NOTIFY_NEW_SIGNUP_SQL = `
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  user_email TEXT;
  user_meta JSONB;
  is_import BOOLEAN := false;
  request_id BIGINT;
BEGIN
  SELECT u.email, u.raw_user_meta_data
  INTO user_email, user_meta
  FROM auth.users u
  WHERE u.id = NEW.user_id;

  is_import := COALESCE((user_meta ->> '__migration_import')::boolean, false);

  IF is_import THEN
    RAISE LOG 'notify_new_signup: skipped migration import user_id=%', NEW.user_id;
    RETURN NEW;
  END IF;

  BEGIN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/notify-admin',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'event_type', 'signup',
        'user_email', COALESCE(user_email, 'unknown'),
        'user_name', COALESCE(NEW.full_name, 'Unknown')
      )
    ) INTO request_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_new_signup: notification failed (non-fatal) user_id=%, err=%', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const targetDbUrl = Deno.env.get("MIGRATION_TARGET_DB_URL");
    if (!targetDbUrl) return errorResponse("MIGRATION_TARGET_DB_URL not configured", "config");

    const sql = postgres(targetDbUrl, { max: 1, idle_timeout: 5, connect_timeout: 15, prepare: false, ssl: 'require' });

    const applied: Array<{ name: string; ok: boolean; error?: string }> = [];
    try {
      try {
        await sql.unsafe(HANDLE_NEW_USER_SQL);
        applied.push({ name: "handle_new_user", ok: true });
      } catch (e) {
        applied.push({ name: "handle_new_user", ok: false, error: e instanceof Error ? e.message : String(e) });
      }

      try {
        await sql.unsafe(NOTIFY_NEW_SIGNUP_SQL);
        applied.push({ name: "notify_new_signup", ok: true });
      } catch (e) {
        applied.push({ name: "notify_new_signup", ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      await sql.end({ timeout: 5 });
    }

    const allOk = applied.every((a) => a.ok);
    if (!allOk) {
      const firstErr = applied.find((a) => !a.ok);
      return errorResponse(`Patch failed: ${firstErr?.name}: ${firstErr?.error}`, "patch");
    }
    return jsonResponse({ applied });
  } catch (e) {
    console.error("migrate-patch-target-triggers error", e);
    return errorResponse(e instanceof Error ? e.message : String(e), "exception");
  }
});
