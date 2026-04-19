// Step 8 — Read-only migration verification.
// Cross-checks source vs target across: public schema (tables/cols/rows/indexes/FKs/triggers/enums/functions/policies),
// auth users, storage buckets+objects, edge functions, and secret names.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const SOURCE_REF = "sqwohcvobfnymsbzlfqr";

function refFromUrl(u: string | undefined): string | null {
  if (!u) return null;
  const m = u.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

async function introspect(sql: ReturnType<typeof postgres>) {
  const tables = await sql.unsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name
  `);
  const columns = await sql.unsafe(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns WHERE table_schema='public'
    ORDER BY table_name, ordinal_position
  `);
  const indexes = await sql.unsafe(`
    SELECT tablename AS table_name, COUNT(*)::int AS n FROM pg_indexes
    WHERE schemaname='public' GROUP BY tablename
  `);
  const fks = await sql.unsafe(`
    SELECT conrelid::regclass::text AS table_name, COUNT(*)::int AS n
    FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace
    GROUP BY conrelid
  `);
  const triggers = await sql.unsafe(`
    SELECT event_object_table AS table_name, COUNT(*)::int AS n
    FROM information_schema.triggers WHERE trigger_schema='public'
    GROUP BY event_object_table
  `);
  const policies = await sql.unsafe(`
    SELECT tablename AS table_name, COUNT(*)::int AS n FROM pg_policies
    WHERE schemaname='public' GROUP BY tablename
  `);
  const enums = await sql.unsafe(`
    SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
    FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
    JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'
    GROUP BY t.typname ORDER BY t.typname
  `);
  const functions = await sql.unsafe(`
    SELECT p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' ORDER BY p.proname, args
  `);
  return { tables, columns, indexes, fks, triggers, policies, enums, functions };
}

async function rowCount(sql: ReturnType<typeof postgres>, table: string): Promise<number | null> {
  try {
    const r = await sql.unsafe(`SELECT count(*)::bigint AS n FROM public."${table}"`);
    return Number(r[0].n);
  } catch { return null; }
}

async function listAllUsers(client: ReturnType<typeof createClient>) {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    if (!data?.users?.length) break;
    all.push(...data.users);
    if (data.users.length < 200) break;
    page++;
  }
  return all;
}

async function listBucketObjects(client: ReturnType<typeof createClient>, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  async function walk(prefix: string) {
    let offset = 0;
    while (true) {
      const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000, offset });
      if (error || !data) return;
      for (const obj of data) {
        const full = prefix ? `${prefix}/${obj.name}` : obj.name;
        if (obj.id === null || obj.metadata === null) await walk(full);
        else keys.push(full);
      }
      if (data.length < 1000) break;
      offset += data.length;
    }
  }
  await walk("");
  return keys;
}

async function mgmtGet(token: string, path: string): Promise<any> {
  const r = await fetch(`https://api.supabase.com${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`mgmt ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const sourceDbUrl = Deno.env.get("SUPABASE_DB_URL");
    const targetDbUrl = Deno.env.get("MIGRATION_TARGET_DB_URL");
    const sourceUrl = Deno.env.get("SUPABASE_URL")!;
    const sourceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL");
    const targetKey = Deno.env.get("MIGRATION_TARGET_SERVICE_ROLE_KEY");
    const mgmtToken = Deno.env.get("MIGRATION_MANAGEMENT_TOKEN");

    if (!sourceDbUrl || !targetDbUrl) return errorResponse("DB URLs not configured");
    if (!targetUrl || !targetKey) return errorResponse("MIGRATION_TARGET_URL/KEY not configured");

    const src = postgres(sourceDbUrl, { max: 1, prepare: false, ssl: "require" });
    const tgt = postgres(targetDbUrl, { max: 1, prepare: false, ssl: "require" });

    const report: any = { ok: true, summary: {}, schema: {}, auth: {}, storage: {}, edgeFunctions: {}, secrets: {} };

    try {
      // ----- Schema -----
      const [s, t] = await Promise.all([introspect(src), introspect(tgt)]);
      const sTables = new Set(s.tables.map((r: any) => r.table_name));
      const tTables = new Set(t.tables.map((r: any) => r.table_name));
      const missingTables = [...sTables].filter((x) => !tTables.has(x));
      const extraTables = [...tTables].filter((x) => !sTables.has(x));

      const colKey = (r: any) => `${r.table_name}.${r.column_name}`;
      const sColMap = new Map(s.columns.map((r: any) => [colKey(r), r]));
      const tColMap = new Map(t.columns.map((r: any) => [colKey(r), r]));
      const colMismatches: any[] = [];
      for (const [k, sc] of sColMap) {
        const tc: any = tColMap.get(k);
        if (!tc) colMismatches.push({ column: k, issue: "missing_in_target" });
        else if (tc.data_type !== (sc as any).data_type)
          colMismatches.push({ column: k, source: (sc as any).data_type, target: tc.data_type });
      }

      const idxBy = (rows: any[]) => Object.fromEntries(rows.map((r) => [r.table_name, r.n]));
      const sIdx = idxBy(s.indexes), tIdx = idxBy(t.indexes);
      const sFk = idxBy(s.fks), tFk = idxBy(t.fks);
      const sTrg = idxBy(s.triggers), tTrg = idxBy(t.triggers);
      const sPol = idxBy(s.policies), tPol = idxBy(t.policies);

      const tableRows: any[] = [];
      let rowDeltaTotal = 0;
      for (const tbl of [...sTables].sort()) {
        const [sc, tc] = await Promise.all([rowCount(src, tbl), rowCount(tgt, tbl)]);
        const delta = (sc ?? 0) - (tc ?? 0);
        rowDeltaTotal += Math.abs(delta);
        tableRows.push({
          name: tbl,
          sourceRows: sc, targetRows: tc, delta,
          sourceIndexes: sIdx[tbl] ?? 0, targetIndexes: tIdx[tbl] ?? 0,
          sourceFks: sFk[tbl] ?? 0, targetFks: tFk[tbl] ?? 0,
          sourceTriggers: sTrg[tbl] ?? 0, targetTriggers: tTrg[tbl] ?? 0,
          sourcePolicies: sPol[tbl] ?? 0, targetPolicies: tPol[tbl] ?? 0,
        });
      }

      const sEnums = new Map(s.enums.map((r: any) => [r.name, r.values]));
      const tEnums = new Map(t.enums.map((r: any) => [r.name, r.values]));
      const enumIssues: any[] = [];
      for (const [name, vals] of sEnums) {
        const tv = tEnums.get(name);
        if (!tv) enumIssues.push({ name, issue: "missing_in_target" });
        else if (JSON.stringify(vals) !== JSON.stringify(tv))
          enumIssues.push({ name, source: vals, target: tv });
      }

      const fnKey = (r: any) => `${r.name}(${r.args})`;
      const sFns = new Set(s.functions.map(fnKey));
      const tFns = new Set(t.functions.map(fnKey));
      const missingFns = [...sFns].filter((x) => !tFns.has(x));

      report.schema = {
        tables: tableRows, missingTables, extraTables, colMismatches,
        enumIssues, missingFunctions: missingFns,
        sourceTableCount: sTables.size, targetTableCount: tTables.size,
      };
      report.summary.tablesMatched = sTables.size - missingTables.length;
      report.summary.rowDeltaTotal = rowDeltaTotal;
    } finally {
      await src.end(); await tgt.end();
    }

    // ----- Auth -----
    try {
      const sAuth = createClient(sourceUrl, sourceKey, { auth: { persistSession: false } });
      const tAuth = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
      const [sUsers, tUsers] = await Promise.all([listAllUsers(sAuth), listAllUsers(tAuth)]);
      const tById = new Map(tUsers.map((u) => [u.id, u]));
      const tByEmail = new Map(tUsers.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u]));
      const missing: any[] = []; const emailConflicts: any[] = [];
      for (const u of sUsers) {
        const match = tById.get(u.id);
        if (!match) {
          missing.push({ id: u.id, email: u.email });
          if (u.email) {
            const collide = tByEmail.get(u.email.toLowerCase());
            if (collide && collide.id !== u.id)
              emailConflicts.push({ email: u.email, sourceId: u.id, targetId: collide.id });
          }
        }
      }
      report.auth = {
        sourceCount: sUsers.length, targetCount: tUsers.length,
        missingCount: missing.length, missingSample: missing.slice(0, 10),
        emailConflicts,
      };
      report.summary.usersMissing = missing.length;
    } catch (e) {
      report.auth = { error: e instanceof Error ? e.message : String(e) };
    }

    // ----- Storage -----
    try {
      const sStore = createClient(sourceUrl, sourceKey, { auth: { persistSession: false } });
      const tStore = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
      const [sBR, tBR] = await Promise.all([sStore.storage.listBuckets(), tStore.storage.listBuckets()]);
      const sBuckets = sBR.data ?? []; const tBuckets = tBR.data ?? [];
      const tByName = new Map(tBuckets.map((b) => [b.name, b]));
      const buckets: any[] = [];
      let bucketsMatched = 0;
      for (const b of sBuckets) {
        const tb = tByName.get(b.name);
        if (!tb) { buckets.push({ name: b.name, issue: "missing_in_target" }); continue; }
        const [sk, tk] = await Promise.all([listBucketObjects(sStore, b.name), listBucketObjects(tStore, b.name)]);
        const tSet = new Set(tk);
        const missingKeys = sk.filter((k) => !tSet.has(k));
        if (missingKeys.length === 0) bucketsMatched++;
        buckets.push({
          name: b.name, sourceObjects: sk.length, targetObjects: tk.length,
          missingCount: missingKeys.length, missingSample: missingKeys.slice(0, 20),
          publicMatch: b.public === tb.public,
        });
      }
      report.storage = { buckets };
      report.summary.bucketsMatched = bucketsMatched;
    } catch (e) {
      report.storage = { error: e instanceof Error ? e.message : String(e) };
    }

    // ----- Edge functions + secret names (Management API) -----
    const targetRef = refFromUrl(targetUrl);
    if (!mgmtToken) {
      report.edgeFunctions = { warning: "MIGRATION_MANAGEMENT_TOKEN not set — skipped" };
      report.secrets = { warning: "MIGRATION_MANAGEMENT_TOKEN not set — skipped" };
    } else if (!targetRef) {
      report.edgeFunctions = { warning: "Could not derive target project ref from MIGRATION_TARGET_URL" };
    } else {
      try {
        const [sFns, tFns] = await Promise.all([
          mgmtGet(mgmtToken, `/v1/projects/${SOURCE_REF}/functions`),
          mgmtGet(mgmtToken, `/v1/projects/${targetRef}/functions`),
        ]);
        const tBySlug = new Map((tFns as any[]).map((f) => [f.slug, f]));
        const missing = (sFns as any[]).filter((f) => !tBySlug.has(f.slug)).map((f) => f.slug);
        const versionMismatches = (sFns as any[])
          .filter((f) => tBySlug.has(f.slug) && tBySlug.get(f.slug).version !== f.version)
          .map((f) => ({ slug: f.slug, source: f.version, target: tBySlug.get(f.slug).version }));
        report.edgeFunctions = {
          sourceCount: (sFns as any[]).length, targetCount: (tFns as any[]).length,
          missing, versionMismatches,
          source: (sFns as any[]).map((f) => f.slug).sort(),
          target: (tFns as any[]).map((f) => f.slug).sort(),
        };
        report.summary.functionsMissing = missing.length;
      } catch (e) {
        report.edgeFunctions = { error: e instanceof Error ? e.message : String(e) };
      }
      try {
        const [sSec, tSec] = await Promise.all([
          mgmtGet(mgmtToken, `/v1/projects/${SOURCE_REF}/secrets`),
          mgmtGet(mgmtToken, `/v1/projects/${targetRef}/secrets`),
        ]);
        const tNames = new Set((tSec as any[]).map((x) => x.name));
        const sNames = (sSec as any[]).map((x) => x.name);
        const missing = sNames.filter((n) => !tNames.has(n));
        report.secrets = {
          sourceCount: sNames.length, targetCount: (tSec as any[]).length,
          missing, sourceNames: sNames.sort(), targetNames: [...tNames].sort(),
        };
        report.summary.secretsMissing = missing.length;
      } catch (e) {
        report.secrets = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    return jsonResponse(report);
  } catch (e) {
    console.error("migrate-verify error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
