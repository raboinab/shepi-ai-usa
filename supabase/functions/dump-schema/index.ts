// Dumps full DDL of public schema by delegating to the shared builder.
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";
import { buildSchemaDdl } from "../_shared/build-schema-ddl.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return errorResponse("SUPABASE_DB_URL not configured", "config");

    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL") ?? "";
    const oldUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const schemaSql = await buildSchemaDdl(dbUrl, oldUrl, targetUrl);
    return jsonResponse({ schema_sql: schemaSql, size: schemaSql.length });
  } catch (e) {
    console.error("dump-schema error", e);
    return errorResponse(e instanceof Error ? e.message : String(e), "build_ddl");
  }
});
