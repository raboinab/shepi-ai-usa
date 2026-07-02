// One-off backfill: re-parses Customer/Vendor Concentration uploads with
// monthly columns and inserts the matching sales_by_customer_monthly /
// expenses_by_vendor_monthly processed_data rows.
//
// POST { documentIds: string[] }
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EntityType = "customer" | "vendor";

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
function parseMonthHeader(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = s.trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mo = MONTHS[m[1]];
  if (!mo) return null;
  return `${m[2]}-${String(mo).padStart(2, "0")}`;
}
function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const c = v.replace(/[,$\s]/g, "").replace(/^\((.*)\)$/, "-$1");
    const n = Number(c);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function endOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(last).padStart(2, "0")}`;
}

function parseRows(rows: unknown[][]) {
  let headerIdx = -1;
  let entityType: EntityType = "customer";
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const a = rows[i]?.[0];
    if (typeof a !== "string") continue;
    const v = a.trim().toLowerCase();
    if (v === "customer") { headerIdx = i; entityType = "customer"; break; }
    if (v === "vendor")   { headerIdx = i; entityType = "vendor";   break; }
  }
  if (headerIdx < 0) throw new Error('No "Customer"/"Vendor" header row.');

  const header = rows[headerIdx];
  const months: string[] = [];
  const monthColIdx: number[] = [];
  let totalColIdx = -1;
  for (let c = 1; c < header.length; c++) {
    const h = header[c];
    if (typeof h === "string" && h.trim().toLowerCase() === "total") { totalColIdx = c; continue; }
    const ym = parseMonthHeader(h);
    if (ym) { months.push(ym); monthColIdx.push(c); }
  }
  if (months.length === 0) throw new Error("No monthly columns detected.");
  months.sort();

  const entityRows: { name: string; monthly: Record<string, number>; total: number }[] = [];
  let grandTotal = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const nameRaw = row[0];
    if (typeof nameRaw === "string" && /^accrual\s+basis/i.test(nameRaw.trim())) continue;
    let name = (nameRaw == null ? "" : String(nameRaw)).trim();
    if (name.toLowerCase() === "total") {
      grandTotal = totalColIdx >= 0 ? toNumber(row[totalColIdx]) : monthColIdx.reduce((s, c) => s + toNumber(row[c]), 0);
      continue;
    }
    if (!name) {
      const hasValue = monthColIdx.some((c) => toNumber(row[c]) !== 0) || (totalColIdx >= 0 && toNumber(row[totalColIdx]) !== 0);
      if (!hasValue) continue;
      name = entityType === "customer" ? "(Unassigned customer)" : "(Unassigned vendor)";
    }
    const monthly: Record<string, number> = {};
    let total = 0;
    for (let k = 0; k < months.length; k++) {
      const v = toNumber(row[monthColIdx[k]]);
      monthly[months[k]] = v;
      total += v;
    }
    if (totalColIdx >= 0) {
      const t = toNumber(row[totalColIdx]);
      if (Number.isFinite(t)) total = t;
    }
    entityRows.push({ name, monthly, total });
  }
  if (grandTotal === 0) grandTotal = entityRows.reduce((s, r) => s + r.total, 0);

  return {
    entityType,
    periodStart: `${months[0]}-01`,
    periodEnd: endOfMonth(months[months.length - 1]),
    months,
    rows: entityRows,
    grandTotal,
    source: "xlsx" as const,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: require authenticated user (verify each doc's project access below)
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.replace('Bearer ', '');
  if (!bearer) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(bearer);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body: { documentIds: string[] };
  try { body = await req.json(); } catch { body = { documentIds: [] }; }
  const ids = body.documentIds || [];
  const results: Record<string, unknown>[] = [];

  for (const docId of ids) {
    const log = (msg: string, extra?: unknown) => {
      console.log(`[${docId}] ${msg}`, extra ?? "");
    };
    try {
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .select("id, name, file_path, project_id, user_id, parsed_summary")
        .eq("id", docId)
        .maybeSingle();
      if (docErr || !doc) { results.push({ docId, error: docErr?.message || "not found" }); continue; }

      const { data: hasAccess } = await supabase.rpc('has_project_access', { _user_id: user.id, _project_id: doc.project_id });
      if (hasAccess !== true) { results.push({ docId, error: 'Forbidden' }); continue; }

      const { data: blob, error: dlErr } = await supabase.storage.from("documents").download(doc.file_path);
      if (dlErr || !blob) { results.push({ docId, error: dlErr?.message || "download failed" }); continue; }
      const buf = await blob.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", raw: false, cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });

      const parsed = parseRows(rows);
      const dataType = parsed.entityType === "customer"
        ? "sales_by_customer_monthly"
        : "expenses_by_vendor_monthly";

      const { data: existing } = await supabase
        .from("processed_data")
        .select("id")
        .eq("project_id", doc.project_id)
        .eq("data_type", dataType)
        .eq("source_document_id", doc.id)
        .limit(1);
      if (existing && existing.length > 0) {
        results.push({ docId, dataType, skipped: true, existingId: existing[0].id });
        continue;
      }

      const { error: insErr } = await supabase.from("processed_data").insert({
        project_id: doc.project_id,
        user_id: doc.user_id,
        source_type: "qbtojson",
        data_type: dataType,
        source_document_id: doc.id,
        period_start: parsed.periodStart,
        period_end: parsed.periodEnd,
        data: parsed,
        record_count: parsed.rows.length,
        validation_status: "pending",
      });
      if (insErr) { results.push({ docId, error: insErr.message }); continue; }

      results.push({
        docId,
        dataType,
        inserted: true,
        months: parsed.months.length,
        entities: parsed.rows.length,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
      });
      log("inserted", { dataType, months: parsed.months.length });
    } catch (e) {
      results.push({ docId, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
