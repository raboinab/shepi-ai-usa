// Shared DDL builder — emits full public schema as a single SQL string.
// Used by both dump-schema (for download) and migrate-push-schema (regenerate mode).
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

export interface SchemaDdlResult {
  preamble: string; // Runs OUTSIDE the main transaction (enum CREATE/ADD VALUE)
  ddl: string;      // Runs INSIDE the main transaction
}

export async function buildSchemaDdl(
  sourceDbUrl: string,
  oldSupabaseUrl: string,
  targetSupabaseUrl: string,
): Promise<string> {
  const result = await buildSchemaDdlSplit(sourceDbUrl, oldSupabaseUrl, targetSupabaseUrl);
  // Backward-compat: concatenated form (used by dump-schema for download).
  return result.preamble + "\n" + result.ddl;
}

export async function buildSchemaDdlSplit(
  sourceDbUrl: string,
  oldSupabaseUrl: string,
  targetSupabaseUrl: string,
): Promise<SchemaDdlResult> {
  const sql = postgres(sourceDbUrl, { max: 1, prepare: false });
  const preamble: string[] = [];
  const ddl: string[] = [];
  try {
    ddl.push("-- Auto-generated schema dump from Lovable Cloud");
    ddl.push(`-- Generated: ${new Date().toISOString()}`);
    ddl.push("-- Target: " + (targetSupabaseUrl || "<unset>"));
    ddl.push("");

    // Preamble: extensions + enum reconciliation. MUST run outside the main
    // transaction because Postgres forbids using a newly-added enum value in
    // the same transaction it was added (e.g. policies referencing 'cpa').
    preamble.push("-- Preamble: run before main DDL transaction");
    preamble.push("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
    preamble.push("CREATE EXTENSION IF NOT EXISTS vector;");

    const enums = await sql`
      SELECT t.typname,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `;
    for (const e of enums) {
      const rawLabels = e.labels as string[];
      const labels = rawLabels.map((l) => `'${l.replace(/'/g, "''")}'`).join(", ");
      const addValueStmts = rawLabels
        .map((l) => `ALTER TYPE public.${e.typname} ADD VALUE IF NOT EXISTS '${l.replace(/'/g, "''")}';`)
        .join(" ");
      preamble.push(
        `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${e.typname}' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.${e.typname} AS ENUM (${labels});
  ELSE
    ${addValueStmts}
  END IF;
END $$;`,
      );
    }
    ddl.push("");

    // Tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    for (const { table_name } of tables) {
      const cols = await sql`
        SELECT column_name, data_type, udt_name, is_nullable, column_default,
               character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table_name}
        ORDER BY ordinal_position
      `;
      const colDefs: string[] = [];
      for (const c of cols) {
        let typ = c.data_type as string;
        if (typ === "USER-DEFINED" || typ === "ARRAY") typ = c.udt_name as string;
        if ((c.data_type as string) === "ARRAY" && typ.startsWith("_")) {
          typ = typ.slice(1);
        }
        if (typ === "character varying" && c.character_maximum_length) typ = `varchar(${c.character_maximum_length})`;
        const arr = (c.data_type as string) === "ARRAY" ? "[]" : "";
        let line = `  "${c.column_name}" ${typ}${arr}`;
        if (c.column_default) line += ` DEFAULT ${c.column_default}`;
        if (c.is_nullable === "NO") line += " NOT NULL";
        colDefs.push(line);
      }
      const pk = await sql`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ${"public." + table_name}::regclass AND i.indisprimary
      `;
      if (pk.length > 0) {
        colDefs.push(`  PRIMARY KEY (${pk.map((p) => `"${p.attname}"`).join(", ")})`);
      }
      ddl.push(`CREATE TABLE IF NOT EXISTS public.${table_name} (\n${colDefs.join(",\n")}\n);`);
      ddl.push(`ALTER TABLE public.${table_name} ENABLE ROW LEVEL SECURITY;`);
      // Reconcile existing tables: ensure every column exists (handles partial prior runs)
      for (const c of cols) {
        let typ = c.data_type as string;
        if (typ === "USER-DEFINED" || typ === "ARRAY") typ = c.udt_name as string;
        if ((c.data_type as string) === "ARRAY" && typ.startsWith("_")) typ = typ.slice(1);
        if (typ === "character varying" && c.character_maximum_length) typ = `varchar(${c.character_maximum_length})`;
        const arr = (c.data_type as string) === "ARRAY" ? "[]" : "";
        let alter = `ALTER TABLE public.${table_name} ADD COLUMN IF NOT EXISTS "${c.column_name}" ${typ}${arr}`;
        if (c.column_default) alter += ` DEFAULT ${c.column_default}`;
        ddl.push(alter + ";");
      }
      ddl.push("");
    }

    // Indexes (non-PK)
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `;
    for (const i of indexes) {
      const indexDef = (i.indexdef as string).replace(
        /^CREATE( UNIQUE)? INDEX /i,
        "CREATE$1 INDEX IF NOT EXISTS ",
      );
      ddl.push(`${indexDef};`);
    }
    ddl.push("");

    // Functions
    const fns = await sql`
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prokind = 'f'
      ORDER BY p.proname
    `;
    for (const f of fns) {
      let def = f.def as string;
      if (oldSupabaseUrl && targetSupabaseUrl) {
        def = def.replaceAll(oldSupabaseUrl, targetSupabaseUrl);
      }
      ddl.push(def + ";");
      ddl.push("");
    }

    // Triggers
    const triggers = await sql`
      SELECT tgname, pg_get_triggerdef(t.oid) AS def
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND NOT t.tgisinternal
      ORDER BY tgname
    `;
    for (const t of triggers) {
      // Make trigger creation idempotent: extract table name and drop first
      const def = t.def as string;
      const m = /CREATE\s+(?:CONSTRAINT\s+)?TRIGGER\s+\S+\s+(?:BEFORE|AFTER|INSTEAD\s+OF)\s+.*?\s+ON\s+(\S+)/is.exec(def);
      if (m) {
        ddl.push(`DROP TRIGGER IF EXISTS ${t.tgname} ON ${m[1]};`);
      }
      ddl.push(`${def};`);
    }
    ddl.push("");

    // RLS policies
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    for (const p of policies) {
      const roles = (p.roles as string[]).join(", ");
      ddl.push(`DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename};`);
      let stmt = `CREATE POLICY "${p.policyname}" ON public.${p.tablename}`;
      stmt += ` AS ${p.permissive}`;
      stmt += ` FOR ${p.cmd}`;
      stmt += ` TO ${roles}`;
      if (p.qual) stmt += ` USING (${p.qual})`;
      if (p.with_check) stmt += ` WITH CHECK (${p.with_check})`;
      ddl.push(stmt + ";");
    }
    ddl.push("");

    // Foreign keys
    const fks = await sql`
      SELECT conname, conrelid::regclass AS tbl, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass::text
    `;
    for (const fk of fks) {
      ddl.push(`ALTER TABLE ${fk.tbl} DROP CONSTRAINT IF EXISTS ${fk.conname};`);
      ddl.push(`ALTER TABLE ${fk.tbl} ADD CONSTRAINT ${fk.conname} ${fk.def};`);
    }
  } finally {
    await sql.end();
  }
  return { preamble: preamble.join("\n"), ddl: ddl.join("\n") };
}
