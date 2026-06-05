/**
 * One-off backfill: re-parse Customer/Vendor Concentration uploads with
 * parseMonthlySummary and insert the matching sales_by_customer_monthly /
 * expenses_by_vendor_monthly processed_data rows so the Monthly Trends &
 * Churn panel populates.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     bun run scripts/backfill-monthly-summary.ts <documentId> [<documentId> ...]
 */
import { createClient } from "@supabase/supabase-js";
import { parseMonthlySummaryRows } from "../src/lib/parsers/parseMonthlySummary";
import * as XLSX from "xlsx";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const docIds = process.argv.slice(2);
if (docIds.length === 0) {
  console.error("Usage: bun run scripts/backfill-monthly-summary.ts <documentId> [...]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function pickMonthlyType(parsedEntityType: "customer" | "vendor"): string {
  return parsedEntityType === "customer"
    ? "sales_by_customer_monthly"
    : "expenses_by_vendor_monthly";
}

for (const docId of docIds) {
  console.log(`\n=== ${docId} ===`);
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id, name, file_path, project_id, user_id, parsed_summary")
    .eq("id", docId)
    .maybeSingle();
  if (docErr || !doc) {
    console.error("doc fetch failed:", docErr);
    continue;
  }
  console.log(`name=${doc.name}`);
  console.log(`file_path=${doc.file_path}`);

  const { data: blob, error: dlErr } = await supabase.storage
    .from("documents")
    .download(doc.file_path);
  if (dlErr || !blob) {
    console.error("download failed:", dlErr);
    continue;
  }
  const buf = await blob.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", raw: false, cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: null,
  });

  let parsed;
  try {
    parsed = parseMonthlySummaryRows(rows, "xlsx");
  } catch (e) {
    console.error("parse failed:", (e as Error).message);
    continue;
  }
  const dataType = pickMonthlyType(parsed.entityType);
  console.log(
    `parsed: entityType=${parsed.entityType}, months=${parsed.months.length}, rows=${parsed.rows.length}, grand=${parsed.grandTotal}`
  );

  // Skip if a row already exists for this document.
  const { data: existing } = await supabase
    .from("processed_data")
    .select("id")
    .eq("project_id", doc.project_id)
    .eq("data_type", dataType)
    .eq("source_document_id", doc.id)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log(`already present (id=${existing[0].id}), skipping insert.`);
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
  if (insErr) {
    console.error("insert failed:", insErr);
    continue;
  }
  console.log(`✅ inserted ${dataType} for ${doc.name}`);
}

console.log("\nDone.");
