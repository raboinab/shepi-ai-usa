// Pushes a chunk of rows from a single public table from this project to the
// target project's DB. Client loops with offset/limit to migrate everything.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const REDACTED: Record<string, string[]> = {
  // Embeddings are large but we DO want them; bearer tokens are sensitive but
  // we keep them since the same project owns them. Override here if needed.
};

// Per-table hard cap on rows fetched per invocation. Protects against OOM
// when rows have huge jsonb payloads (e.g. processed_data) or large vectors.
const CHUNK_OVERRIDES: Record<string, number> = {
  processed_data: 1,
  project_data_chunks: 25,
  rag_chunks: 50,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const targetUrl = Deno.env.get("MIGRATION_TARGET_DB_URL");
    const sourceUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!targetUrl) return errorResponse("MIGRATION_TARGET_DB_URL not configured", 500);
    if (!sourceUrl) return errorResponse("SUPABASE_DB_URL not configured", 500);

    const body = await req.json().catch(() => ({}));
    const table: string = body.table ?? "";
    const offset: number = Number(body.offset ?? 0);
    const requestedLimit = Math.min(Number(body.limit ?? 500), 2000);
    const truncate: boolean = !!body.truncate;
    if (!/^[a-z_][a-z0-9_]*$/i.test(table)) return errorResponse("invalid table name", 400);

    const cap = CHUNK_OVERRIDES[table];
    const effectiveLimit = cap != null ? Math.min(requestedLimit, cap) : requestedLimit;

    const src = postgres(sourceUrl, { max: 1, prepare: false, ssl: "require" });
    const tgt = postgres(targetUrl, { max: 1, prepare: false, ssl: "require" });

    try {
      // Get total once (when offset = 0)
      let total: number | null = null;
      if (offset === 0) {
        const c = await src.unsafe(`SELECT count(*)::int AS n FROM public.${table}`);
        total = c[0].n;
        if (truncate) {
          await tgt.unsafe(`TRUNCATE public.${table} CASCADE`);
        }
      }

      const orderBy = table === "processed_data" ? "id" : "1";
      const rows = await src.unsafe(
        `SELECT * FROM public.${table} ORDER BY ${orderBy} LIMIT ${effectiveLimit} OFFSET ${offset}`
      );

      if (rows.length === 0) {
        await src.end();
        await tgt.end();
        return jsonResponse({ table, inserted: 0, offset, done: true, total });
      }

      const cols = Object.keys(rows[0]);
      const redacted = REDACTED[table] ?? [];
      const useCols = cols.filter((c) => !redacted.includes(c));

      // (batch insert SQL is built inside insertBatch below for halve-and-retry support)

      const colList = useCols.map((c) => `"${c}"`).join(", ");

      // Try full batch; on failure, halve and retry sub-batches once.
      const insertBatch = async (batchRows: any[]): Promise<{ inserted: number; errors: string[] }> => {
        if (batchRows.length === 0) return { inserted: 0, errors: [] };
        const ph: string[] = [];
        const vals: unknown[] = [];
        let pn = 1;
        for (const r of batchRows) {
          const rowPh: string[] = [];
          for (const c of useCols) {
            rowPh.push(`$${pn++}`);
            vals.push((r as any)[c]);
          }
          ph.push(`(${rowPh.join(", ")})`);
        }
        const sql = `INSERT INTO public.${table} (${colList}) VALUES ${ph.join(", ")} ON CONFLICT DO NOTHING`;
        try {
          await tgt.unsafe(sql, vals as any);
          return { inserted: batchRows.length, errors: [] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (batchRows.length === 1) {
            console.error(`row insert failed for ${table}:`, msg);
            return { inserted: 0, errors: [msg] };
          }
          // Halve and retry
          const mid = Math.floor(batchRows.length / 2);
          const a = await insertBatch(batchRows.slice(0, mid));
          const b = await insertBatch(batchRows.slice(mid));
          return { inserted: a.inserted + b.inserted, errors: [...a.errors, ...b.errors] };
        }
      };

      const { inserted, errors } = await insertBatch(rows);

      await src.end();
      await tgt.end();
      return jsonResponse({
        table,
        inserted,
        skipped: rows.length - inserted,
        errors: errors.slice(0, 10),
        offset,
        next_offset: offset + rows.length,
        done: rows.length < effectiveLimit,
        total,
      });
    } catch (e) {
      await src.end().catch(() => {});
      await tgt.end().catch(() => {});
      throw e;
    }
  } catch (e) {
    console.error("migrate-push-data error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
