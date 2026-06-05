/**
 * parse-workbook-upload
 *
 * Accepts a base64-encoded XLSX file exported from shepi, validates the hidden
 * `__shepi_meta` sheet, detects revision drift, and returns a structured diff
 * payload describing what changed in the editable input tabs.
 *
 * Phase 1: parses the DD Adjustments I/II sheets — extracts amount edits per
 * adjustment id (matched via the meta sheet's id list). TB and supplementary
 * tab parsing land in Phase 2.
 *
 * Does NOT write to the database; that is the commit-workbook-upload function.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_SCHEMA_VERSIONS = new Set(["1.0"]);

interface MetaSheet {
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  exportedAt: string;
  periods: { id: string; label: string }[];
  accounts: { id: string; name: string }[];
  adjustments: { id: string; type: string; label: string }[];
}

interface AdjustmentDiff {
  id: string;
  label: string;
  type: string;
  changes: { periodId: string; oldValue: number | null; newValue: number }[];
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ParseResult {
  ok: true;
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  currentRevision: number;
  revisionDrifted: boolean;
  summary: {
    adjustmentsChanged: number;
    adjustmentsAdded: number;
    adjustmentsDeleted: number;
    tbCellsChanged: number; // Phase 2
    supplementaryChanged: number; // Phase 2
  };
  adjustmentDiffs: AdjustmentDiff[];
  warnings: string[];
}

interface ParseError {
  ok: false;
  error: string;
  details?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseMetaSheet(wb: XLSX.WorkBook): MetaSheet | { error: string } {
  const ws = wb.Sheets["__shepi_meta"];
  if (!ws) return { error: "Workbook is missing the hidden __shepi_meta sheet — was it exported from shepi?" };

  const get = (addr: string): string => {
    const cell = ws[addr];
    if (!cell) return "";
    return String(cell.v ?? "").trim();
  };

  if (get("A1") !== "shepiWorkbook") return { error: "Meta sheet header invalid." };
  const schemaVersion = get("B1");
  const projectId = get("B2");
  const exportedFromRevision = Number(get("B3") || "0");
  const exportedAt = get("B4");

  if (!SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)) {
    return { error: `Unsupported schema version "${schemaVersion}". Please re-export the workbook.` };
  }
  if (!projectId) return { error: "Meta sheet is missing projectId." };

  // Scan from row 6 onward for section markers
  const periods: MetaSheet["periods"] = [];
  const accounts: MetaSheet["accounts"] = [];
  const adjustments: MetaSheet["adjustments"] = [];

  let section: "" | "periods" | "accounts" | "adjustments" = "";
  for (let r = 6; r < 100000; r++) {
    const a = ws[`A${r}`];
    const b = ws[`B${r}`];
    const c = ws[`C${r}`];
    if (!a && !b && !c) {
      // blank row — continue but break if many in a row
      if (r > 20 && !ws[`A${r + 1}`] && !ws[`A${r + 2}`] && !ws[`A${r + 3}`]) break;
      continue;
    }
    const aVal = String(a?.v ?? "").trim();
    if (aVal === "__periods__") { section = "periods"; continue; }
    if (aVal === "__accounts__") { section = "accounts"; continue; }
    if (aVal === "__adjustments__") { section = "adjustments"; continue; }
    if (aVal === "periodId" || aVal === "accountId" || aVal === "id") continue; // header row

    const bVal = String(b?.v ?? "").trim();
    const cVal = String(c?.v ?? "").trim();
    if (section === "periods" && aVal) periods.push({ id: aVal, label: bVal });
    else if (section === "accounts" && aVal) accounts.push({ id: aVal, name: bVal });
    else if (section === "adjustments" && aVal) adjustments.push({ id: aVal, type: bVal, label: cVal });
  }

  return { schemaVersion, projectId, exportedFromRevision, exportedAt, periods, accounts, adjustments };
}

/**
 * Parse DD Adjustment sheets (Management Adjustments + DD/PF Adjustments).
 * Returns map of adjustment id -> { periodId -> new amount }.
 * The Excel grid has frozen meta columns then aggregate-period columns then per-period columns.
 * We match adjustment rows by scanning the "Adj #" / Description column — but the meta sheet's
 * adjustment ID is the source of truth, embedded only via row position. To make this robust,
 * we match by the (label, type, acctNo) tuple back to the meta list.
 */
function parseAdjustmentSheets(
  wb: XLSX.WorkBook,
  meta: MetaSheet,
): { amounts: Map<string, Map<string, number>>; warnings: string[] } {
  const amounts = new Map<string, Map<string, number>>();
  const warnings: string[] = [];

  const periodIdSet = new Set(meta.periods.map(p => p.id));
  const adjByKey = new Map<string, { id: string; label: string; type: string }>();
  for (const a of meta.adjustments) {
    adjByKey.set(`${a.type}::${a.label.toLowerCase().trim()}`, a);
  }

  const sheetNames = ["DD Adjustments I", "DD Adjustments II"];
  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (rows.length < 2) continue;

    // Find header row — has "Description" in column 0
    let headerRow = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      if (String(rows[r]?.[0] ?? "").toLowerCase().trim() === "description") {
        headerRow = r;
        break;
      }
    }
    if (headerRow < 0) {
      warnings.push(`Could not find header row in sheet "${sheetName}"`);
      continue;
    }

    const headers = rows[headerRow].map(h => String(h ?? "").trim());
    // Map period-bearing column indices: header label must match a period.shortLabel OR aggregate label.
    // Simpler: any column whose header appears in the meta period labels is a per-period column.
    // For aggregates we skip (they are calculated and would over-write per-period edits).
    const periodLabelToId = new Map(meta.periods.map(p => [p.label.toLowerCase(), p.id]));
    const periodColIdx: { idx: number; periodId: string }[] = [];
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase();
      // Try direct period id match first (in case the sheet uses ids), then label
      if (periodIdSet.has(headers[i])) {
        periodColIdx.push({ idx: i, periodId: headers[i] });
      } else if (periodLabelToId.has(h)) {
        periodColIdx.push({ idx: i, periodId: periodLabelToId.get(h)! });
      }
    }

    // Column indices for matching
    const labelIdx = headers.findIndex(h => h.toLowerCase() === "description");
    const typeIdx = headers.findIndex(h => h.toLowerCase() === "type");

    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const label = String(row[labelIdx] ?? "").trim();
      const type = String(row[typeIdx] ?? "").trim();
      if (!label || !type) continue;

      const key = `${type}::${label.toLowerCase()}`;
      const adj = adjByKey.get(key);
      if (!adj) {
        // Could be a new adjustment added in Excel — Phase 2.
        continue;
      }

      const periodMap = amounts.get(adj.id) ?? new Map<string, number>();
      for (const { idx, periodId } of periodColIdx) {
        const v = row[idx];
        if (v == null || v === "") continue;
        const n = Number(v);
        if (Number.isFinite(n)) periodMap.set(periodId, n);
      }
      if (periodMap.size > 0) amounts.set(adj.id, periodMap);
    }
  }

  return { amounts, warnings };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, error: "Unauthorized" } satisfies ParseError, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ ok: false, error: "Unauthorized" } satisfies ParseError, 401);
    }

    const body = await req.json().catch(() => null) as { fileBase64?: string } | null;
    if (!body?.fileBase64) {
      return jsonResponse({ ok: false, error: "Missing fileBase64 in request body" } satisfies ParseError, 400);
    }

    // Decode base64
    let buf: Uint8Array;
    try {
      const bin = atob(body.fileBase64);
      buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    } catch {
      return jsonResponse({ ok: false, error: "Invalid base64 file payload" } satisfies ParseError, 400);
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "array" });
    } catch (err) {
      return jsonResponse({
        ok: false,
        error: "Could not read the uploaded file as an XLSX workbook",
        details: String(err),
      } satisfies ParseError, 400);
    }

    const metaOrErr = parseMetaSheet(wb);
    if ("error" in metaOrErr) {
      return jsonResponse({ ok: false, error: metaOrErr.error } satisfies ParseError, 400);
    }
    const meta = metaOrErr;

    // Verify user has access to this project
    const { data: projectRow, error: projectErr } = await supabase
      .from("projects")
      .select("id, revision, wizard_data")
      .eq("id", meta.projectId)
      .maybeSingle();

    if (projectErr || !projectRow) {
      return jsonResponse({
        ok: false,
        error: "You don't have access to the project this workbook belongs to, or it no longer exists.",
      } satisfies ParseError, 403);
    }

    const currentRevision = (projectRow.revision as number | null) ?? 0;
    const revisionDrifted = currentRevision !== meta.exportedFromRevision;

    // Parse adjustments
    const { amounts: newAmounts, warnings } = parseAdjustmentSheets(wb, meta);

    // Diff against current DB values
    const wd = (projectRow.wizard_data as Record<string, unknown>) || {};
    const ddAdj = wd.ddAdjustments as Record<string, unknown> | undefined;
    const existingAdjustments = (ddAdj?.adjustments ?? wd.adjustments ?? []) as Array<Record<string, unknown>>;
    const existingById = new Map<string, Record<string, unknown>>();
    for (const a of existingAdjustments) {
      if (a?.id) existingById.set(String(a.id), a);
    }

    const adjustmentDiffs: AdjustmentDiff[] = [];
    for (const [adjId, periodMap] of newAmounts.entries()) {
      const existing = existingById.get(adjId);
      const existingPeriodValues = (existing?.periodValues ?? existing?.periodAmounts ?? existing?.amounts) as Record<string, unknown> | undefined;
      const changes: AdjustmentDiff["changes"] = [];
      for (const [periodId, newValue] of periodMap.entries()) {
        const oldRaw = existingPeriodValues?.[periodId];
        const oldNum = oldRaw == null ? null : Number(oldRaw);
        const oldValue = Number.isFinite(oldNum as number) ? (oldNum as number) : null;
        // Tolerance to ignore float noise
        if (oldValue === null || Math.abs(oldValue - newValue) > 0.005) {
          changes.push({ periodId, oldValue, newValue });
        }
      }
      if (changes.length > 0) {
        const metaAdj = meta.adjustments.find(a => a.id === adjId);
        adjustmentDiffs.push({
          id: adjId,
          label: metaAdj?.label || String(existing?.description ?? existing?.label ?? adjId),
          type: metaAdj?.type || String(existing?.block ?? existing?.type ?? ""),
          changes,
        });
      }
    }

    const result: ParseResult = {
      ok: true,
      schemaVersion: meta.schemaVersion,
      projectId: meta.projectId,
      exportedFromRevision: meta.exportedFromRevision,
      currentRevision,
      revisionDrifted,
      summary: {
        adjustmentsChanged: adjustmentDiffs.length,
        adjustmentsAdded: 0, // Phase 2
        adjustmentsDeleted: 0, // Phase 2
        tbCellsChanged: 0, // Phase 2
        supplementaryChanged: 0, // Phase 2
      },
      adjustmentDiffs,
      warnings,
    };

    return jsonResponse(result, 200);
  } catch (err) {
    console.error("parse-workbook-upload error:", err);
    return jsonResponse({
      ok: false,
      error: "Server error while parsing the workbook",
      details: String(err),
    } satisfies ParseError, 500);
  }
});
