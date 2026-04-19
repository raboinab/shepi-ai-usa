// Hash-preserving auth migration. Connects directly to the source DB
// (SUPABASE_DB_URL) and target DB (MIGRATION_TARGET_DB_URL) and copies
// auth.users + auth.identities verbatim — preserving encrypted_password
// so users can sign in on the new project with their existing password.
//
// Idempotent: ON CONFLICT (id) DO NOTHING for users, and
// ON CONFLICT (provider, provider_id) DO NOTHING for identities.
//
// Run AFTER migrate-push-auth (or instead of it). Safe to re-run.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const USER_COLS = [
  "instance_id", "id", "aud", "role", "email", "encrypted_password",
  "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
  "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
  "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
  "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
  "phone_change", "phone_change_token", "phone_change_sent_at", "confirmed_at",
  "email_change_token_current", "email_change_confirm_status", "banned_until",
  "reauthentication_token", "reauthentication_sent_at", "is_sso_user",
  "deleted_at", "is_anonymous",
];

const IDENTITY_COLS = [
  "provider_id", "user_id", "identity_data", "provider",
  "last_sign_in_at", "created_at", "updated_at", "email", "id",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const sourceUrl = Deno.env.get("SUPABASE_DB_URL");
    const targetUrl = Deno.env.get("MIGRATION_TARGET_DB_URL");
    if (!sourceUrl) return errorResponse("SUPABASE_DB_URL not configured", "config");
    if (!targetUrl) return errorResponse("MIGRATION_TARGET_DB_URL not configured", "config");

    const src = postgres(sourceUrl, { max: 1, prepare: false, ssl: "require" });
    const tgt = postgres(targetUrl, { max: 1, prepare: false, ssl: "require" });

    const summary = {
      source_users: 0,
      source_identities: 0,
      users_inserted: 0,
      users_existing: 0,
      users_failed: 0,
      identities_inserted: 0,
      identities_existing: 0,
      identities_failed: 0,
    };
    const errors: Array<{ kind: string; id?: string; email?: string; error: string }> = [];

    try {
      // ---------- Users ----------
      const userColList = USER_COLS.map((c) => `"${c}"`).join(", ");
      const users = await src.unsafe(`SELECT ${userColList} FROM auth.users ORDER BY created_at`);
      summary.source_users = users.length;

      for (const u of users) {
        const placeholders = USER_COLS.map((_, i) => `$${i + 1}`).join(", ");
        const vals = USER_COLS.map((c) => (u as any)[c]);
        const sql = `INSERT INTO auth.users (${userColList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING RETURNING id`;
        try {
          const res = await tgt.unsafe(sql, vals as any);
          if (res.length > 0) summary.users_inserted++;
          else summary.users_existing++;
        } catch (e) {
          summary.users_failed++;
          errors.push({ kind: "user", id: (u as any).id, email: (u as any).email, error: e instanceof Error ? e.message : String(e) });
        }
      }

      // ---------- Identities ----------
      const idColList = IDENTITY_COLS.map((c) => `"${c}"`).join(", ");
      const identities = await src.unsafe(`SELECT ${idColList} FROM auth.identities ORDER BY created_at`);
      summary.source_identities = identities.length;

      for (const ident of identities) {
        const placeholders = IDENTITY_COLS.map((_, i) => `$${i + 1}`).join(", ");
        const vals = IDENTITY_COLS.map((c) => (ident as any)[c]);
        const sql = `INSERT INTO auth.identities (${idColList}) VALUES (${placeholders}) ON CONFLICT (provider, provider_id) DO NOTHING RETURNING id`;
        try {
          const res = await tgt.unsafe(sql, vals as any);
          if (res.length > 0) summary.identities_inserted++;
          else summary.identities_existing++;
        } catch (e) {
          summary.identities_failed++;
          errors.push({ kind: "identity", id: (ident as any).id, email: (ident as any).email, error: e instanceof Error ? e.message : String(e) });
        }
      }

      await src.end();
      await tgt.end();

      return jsonResponse({ summary, errors: errors.slice(0, 25) });
    } catch (e) {
      await src.end().catch(() => {});
      await tgt.end().catch(() => {});
      throw e;
    }
  } catch (e) {
    console.error("migrate-push-auth-hashes error", e);
    return errorResponse(e instanceof Error ? e.message : String(e), "exception");
  }
});