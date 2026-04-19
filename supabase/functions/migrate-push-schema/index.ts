// Executes schema SQL against MIGRATION_TARGET_DB_URL.
// Two modes:
//   - mode: "regenerate" (default) — builds DDL server-side from SUPABASE_DB_URL.
//   - schema_sql: "..."             — uses the provided SQL string (bundle workflow).
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";
import { buildSchemaDdl, buildSchemaDdlSplit } from "../_shared/build-schema-ddl.ts";

/**
 * Splits a DDL blob into individual statements, respecting dollar-quoted
 * blocks ($$...$$ or $tag$...$tag$) and line/block comments.
 */
function splitDdl(ddl: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  let dollarTag: string | null = null; // e.g. "$$", "$function$"
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;

  while (i < ddl.length) {
    const ch = ddl[i];
    const next = ddl[i + 1];

    // Inside dollar-quoted block: only look for the matching closing tag
    if (dollarTag) {
      if (ch === "$" && ddl.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += ch;
      i++;
      continue;
    }

    if (inLineComment) {
      buf += ch;
      if (ch === "\n") inLineComment = false;
      i++;
      continue;
    }

    if (inBlockComment) {
      buf += ch;
      if (ch === "*" && next === "/") {
        buf += next;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i++;
      continue;
    }

    if (inSingleQuote) {
      buf += ch;
      if (ch === "'" && next === "'") {
        buf += next;
        i += 2;
        continue;
      }
      if (ch === "'") inSingleQuote = false;
      i++;
      continue;
    }

    // Detect dollar-quote opening: $tag$ where tag is [A-Za-z0-9_]*
    if (ch === "$") {
      const m = /^\$([A-Za-z0-9_]*)\$/.exec(ddl.slice(i));
      if (m) {
        dollarTag = m[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (ch === "-" && next === "-") {
      inLineComment = true;
      buf += ch;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      buf += ch + next;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      buf += ch;
      i++;
      continue;
    }

    if (ch === ";") {
      const stmt = buf.trim();
      if (stmt.length > 0) out.push(stmt);
      buf = "";
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  const tail = buf.trim();
  if (tail.length > 0) out.push(tail);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const targetUrl = Deno.env.get("MIGRATION_TARGET_DB_URL");
    if (!targetUrl) return errorResponse("MIGRATION_TARGET_DB_URL not configured", "config");

    // Guard: Edge Functions can only reach the Supabase pooler hostname.
    // Direct db.<ref>.supabase.co is blocked by the edge runtime egress policy.
    // Pooler in transaction mode (6543) breaks multi-statement DDL.
    if (/db\.[a-z0-9]+\.supabase\.co/i.test(targetUrl)) {
      return errorResponse(
        "Direct DB connections (db.<ref>.supabase.co) are blocked by the Edge Functions network. Update MIGRATION_TARGET_DB_URL to the session-mode pooler URL: postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres",
        "pooler_guard",
      );
    }
    if (/pooler\.supabase\.com:6543/i.test(targetUrl) || /:6543\b/.test(targetUrl)) {
      return errorResponse(
        "DDL push requires the session-mode pooler (port 5432), not the transaction pooler (6543). Update MIGRATION_TARGET_DB_URL to use aws-0-<region>.pooler.supabase.com:5432.",
        "pooler_guard",
      );
    }

    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode ?? (body.schema_sql ? "explicit" : "regenerate");

    let preambleSql = "";
    let schemaSql: string = body.schema_sql ?? "";
    if (mode === "regenerate") {
      const sourceDbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!sourceDbUrl) return errorResponse("SUPABASE_DB_URL not configured", "config");
      const targetSupabaseUrl = Deno.env.get("MIGRATION_TARGET_URL") ?? "";
      const oldSupabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      console.log(`[push-schema] regenerate: building DDL from source @ ${Date.now() - t0}ms`);
      const split = await buildSchemaDdlSplit(sourceDbUrl, oldSupabaseUrl, targetSupabaseUrl);
      preambleSql = split.preamble;
      schemaSql = split.ddl;
      console.log(`[push-schema] DDL built: preamble=${preambleSql.length}b, main=${schemaSql.length}b @ ${Date.now() - t0}ms`);
    }

    if (!schemaSql || schemaSql.length < 10) {
      return errorResponse("schema_sql is empty", "build_ddl");
    }

    const preambleStatements = preambleSql ? splitDdl(preambleSql) : [];
    const statements = splitDdl(schemaSql);
    console.log(`[push-schema] split: ${preambleStatements.length} preamble + ${statements.length} main @ ${Date.now() - t0}ms`);

    console.log(`[push-schema] connecting to target @ ${Date.now() - t0}ms`);
    const sql = postgres(targetUrl, {
      max: 1,
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 30,
      max_lifetime: 60 * 5,
      ssl: "require",
    });

    let lastIndex = -1;
    let lastPreview = "";
    try {
      // Apply preamble (enums, extensions) OUTSIDE the transaction so newly-added
      // enum values become visible to subsequent CREATE POLICY statements.
      if (preambleStatements.length > 0) {
        console.log(`[push-schema] applying ${preambleStatements.length} preamble stmts (autocommit) @ ${Date.now() - t0}ms`);
        for (let idx = 0; idx < preambleStatements.length; idx++) {
          lastIndex = idx;
          lastPreview = `[preamble] ${preambleStatements[idx].replace(/\s+/g, " ").slice(0, 120)}`;
          await sql.unsafe(preambleStatements[idx]);
        }
      }

      console.log(`[push-schema] BEGIN tx @ ${Date.now() - t0}ms`);
      await sql.begin(async (tx) => {
        for (let idx = 0; idx < statements.length; idx++) {
          lastIndex = idx;
          lastPreview = statements[idx].replace(/\s+/g, " ").slice(0, 120);
          await tx.unsafe(statements[idx]);
          if (idx % 25 === 0) {
            console.log(`[push-schema] applied ${idx + 1}/${statements.length} @ ${Date.now() - t0}ms`);
          }
        }
      });
      console.log(`[push-schema] COMMIT @ ${Date.now() - t0}ms`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sql.end({ timeout: 5 }).catch(() => {});
      console.error(
        `[push-schema] apply_ddl failed at stmt #${lastIndex + 1}: ${lastPreview} :: ${msg}`,
      );
      return errorResponse(
        `Schema push failed at statement ${lastIndex + 1}: ${msg}\n--- statement preview ---\n${lastPreview}`,
        "apply_ddl",
      );
    }
    console.log(`[push-schema] verifying tables @ ${Date.now() - t0}ms`);
    const tables = await sql`
      SELECT count(*)::int AS n FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    await sql.end({ timeout: 5 });
    console.log(`[push-schema] done @ ${Date.now() - t0}ms — ${tables[0].n} tables`);
    return jsonResponse({
      tables_in_target: tables[0].n,
      ddl_bytes: schemaSql.length,
      statements_applied: statements.length,
      elapsed_ms: Date.now() - t0,
      mode,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("migrate-push-schema error", msg);
    return errorResponse(msg, "unhandled");
  }
});
