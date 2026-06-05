/**
 * parse-workbook-upload
 *
 * Validates a re-uploaded shepi XLSX, extracts the embedded base snapshot
 * from the hidden __shepi_meta sheet, then re-parses the Trial Balance and
 * DD Adjustments tabs to compute the user's offline edits (mine).
 *
 * Returns base + mine. The committer uses both to do a three-way merge
 * against the current DB state.
 *
 * Schema 1.1 — older exports (1.0) are rejected with a re-export message.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_SCHEMA_VERSIONS = new Set(["1.1"]);
const META_SHEET_NAME = "__shepi_meta";

interface BaseAdjustment {
  id: string;
  type: string;
  label: string;
  tbAccountNumber?: string;
  intent?: string;
  notes?: string;
  periodValues: Record<string, number>;
}

interface WorkbookBaseSnapshot {
  trialBalance: Record<string, Record<string, number>>;
  adjustments: Record<string, BaseAdjustment>;
}

interface MetaSheet {
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  exportedAt: string;
  periods: { id: string; label: string; shortLabel: string }[];
  adjustmentDirectory: { id: string; type: string; label: string }[];
  snapshot: WorkbookBaseSnapshot;
}

interface MineEdits {
  trialBalance: Record<string, Record<string, number>>;
  adjustmentsChanged: Record<string, Record<string, number>>;
  adjustmentsDeleted: string[];
  adjustmentsAdded: BaseAdjustment[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseMetaSheet(wb: XLSX.WorkBook): MetaSheet | { error: string } {
  const ws = wb.Sheets[META_SHEET_NAME];
  if (!ws) return { error: "Workbook is missing the hidden __shepi_meta sheet — was it exported from shepi?" };

  const get = (addr: string): string => {
    const cell = ws[addr];
    if (!cell) return "";
    return String(cell.v ?? "").trim();
  };

  if (get("A1") !== "shepiWorkbook") return { error: "Meta sheet header invalid." };
  const schemaVersion = get("B1");
  if (!SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)) {
    return {
      error: `Unsupported workbook schema "${schemaVersion}". Please re-export the workbook from shepi and try again.`,
    };
  }

  const projectId = get("B2");
  const exportedFromRevision = Number(get("B3") || "0");
  const exportedAt = get("B4");
  if (!projectId) return { error: "Meta sheet is missing projectId." };

  const periods: MetaSheet["periods"] = [];
  const adjustmentDirectory: MetaSheet["adjustmentDirectory"] = [];
  let section: "" | "periods" | "adjustments" | "snapshot" = "";
  const snapshotChunks: string[] = [];

  // Walk rows until we hit a snapshot_end sentinel or 3 consecutive empties
  let emptyRun = 0;
  for (let r = 6; r < 200000; r++) {
    const aRaw = ws[`A${r}`];
    const a = aRaw ? String(aRaw.v ?? "") : "";
    const aTrim = a.trim();
    const b = ws[`B${r}`] ? String(ws[`B${r}`].v ?? "").trim() : "";
    const c = ws[`C${r}`] ? String(ws[`C${r}`].v ?? "").trim() : "";

    if (!aTrim && !b && !c) {
      emptyRun++;
      if (emptyRun >= 5 && section !== "snapshot") break;
      continue;
    }
    emptyRun = 0;

    if (aTrim === "__periods__") { section = "periods"; continue; }
    if (aTrim === "__adjustments__") { section = "adjustments"; continue; }
    if (aTrim === "__snapshot__") { section = "snapshot"; continue; }
    if (aTrim === "__snapshot_end__") break;
    if (aTrim === "periodId" || aTrim === "accountId" || aTrim === "id") continue;

    if (section === "periods" && aTrim) {
      periods.push({ id: aTrim, label: b });
    } else if (section === "adjustments" && aTrim) {
      adjustmentDirectory.push({ id: aTrim, type: b, label: c });
    } else if (section === "snapshot" && a) {
      // Preserve original (untrimmed) content — JSON may have leading spaces
      snapshotChunks.push(a);
    }
  }

  let snapshot: WorkbookBaseSnapshot;
  try {
    const json = snapshotChunks.join("");
    if (!json) {
      return { error: "Workbook is missing an embedded base snapshot. Please re-export and try again." };
    }
    snapshot = JSON.parse(json);
    if (!snapshot.trialBalance) snapshot.trialBalance = {};
    if (!snapshot.adjustments) snapshot.adjustments = {};
  } catch (err) {
    return { error: `Could not parse embedded base snapshot: ${String(err)}` };
  }

  return { schemaVersion, projectId, exportedFromRevision, exportedAt, periods, adjustmentDirectory, snapshot };
}

function rowsOf(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

function parseTrialBalance(
  wb: XLSX.WorkBook,
  meta: MetaSheet,
): { tbEdits: Record<string, Record<string, number>>; warnings: string[] } {
  const tbEdits: Record<string, Record<string, number>> = {};
  const warnings: string[] = [];
  const ws = wb.Sheets["Trial Balance"];
  if (!ws) {
    warnings.push("Trial Balance sheet not found — skipping TB edits.");
    return { tbEdits, warnings };
  }
  const rows = rowsOf(ws);
  if (rows.length < 2) return { tbEdits, warnings };

  const headers = rows[0].map(h => String(h ?? "").trim());
  // Locate account id column ("Acct #") and the per-period columns
  const acctIdIdx = headers.findIndex(h => /acct\s*#|account\s*id/i.test(h));
  if (acctIdIdx < 0) {
    warnings.push("Could not find Account ID column in Trial Balance.");
    return { tbEdits, warnings };
  }

  const periodIdSet = new Set(meta.periods.map(p => p.id));
  const periodLabelToId = new Map(meta.periods.map(p => [p.label.toLowerCase().trim(), p.id]));
  // Also match short labels (e.g. "Jan-24") — pull from the snapshot's accounts as fallback
  const periodColIdx: { idx: number; periodId: string }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (periodIdSet.has(h)) {
      periodColIdx.push({ idx: i, periodId: h });
    } else {
      const id = periodLabelToId.get(h.toLowerCase());
      if (id) periodColIdx.push({ idx: i, periodId: id });
    }
  }
  if (periodColIdx.length === 0) {
    warnings.push("No period columns matched in Trial Balance.");
    return { tbEdits, warnings };
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const acctId = String(row[acctIdIdx] ?? "").trim();
    if (!acctId) continue;
    const baseRow = meta.snapshot.trialBalance[acctId];
    if (!baseRow) continue; // unknown account — skip (TB add not supported this phase)

    const cellChanges: Record<string, number> = {};
    for (const { idx, periodId } of periodColIdx) {
      const v = row[idx];
      if (v == null || v === "") continue;
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      const baseVal = baseRow[periodId] ?? 0;
      if (Math.abs(baseVal - n) > 0.005) {
        cellChanges[periodId] = n;
      }
    }
    if (Object.keys(cellChanges).length > 0) {
      tbEdits[acctId] = cellChanges;
    }
  }

  return { tbEdits, warnings };
}

function parseAdjustments(
  wb: XLSX.WorkBook,
  meta: MetaSheet,
): {
  changed: Record<string, Record<string, number>>;
  deleted: string[];
  added: BaseAdjustment[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const changed: Record<string, Record<string, number>> = {};
  const added: BaseAdjustment[] = [];
  const seenIds = new Set<string>();

  const periodIdSet = new Set(meta.periods.map(p => p.id));
  const periodLabelToId = new Map(meta.periods.map(p => [p.label.toLowerCase().trim(), p.id]));

  // Build a label+type → id map from the directory (for matching unchanged rows)
  const dirByKey = new Map<string, { id: string; type: string; label: string }>();
  for (const d of meta.adjustmentDirectory) {
    dirByKey.set(`${d.type}::${d.label.toLowerCase().trim()}`, d);
  }

  for (const sheetName of ["DD Adjustments I", "DD Adjustments II"]) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = rowsOf(ws);
    if (rows.length < 2) continue;

    // Find header row
    let headerRow = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      if (String(rows[r]?.[0] ?? "").toLowerCase().trim() === "description") {
        headerRow = r;
        break;
      }
    }
    if (headerRow < 0) {
      warnings.push(`Could not find header row in "${sheetName}"`);
      continue;
    }

    const headers = rows[headerRow].map(h => String(h ?? "").trim());
    const labelIdx = headers.findIndex(h => h.toLowerCase() === "description");
    const typeIdx = headers.findIndex(h => h.toLowerCase() === "type");
    const acctIdx = headers.findIndex(h => /acct|account/i.test(h));
    const notesIdx = headers.findIndex(h => /note|intent/i.test(h));

    const periodColIdx: { idx: number; periodId: string }[] = [];
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (periodIdSet.has(h)) periodColIdx.push({ idx: i, periodId: h });
      else {
        const id = periodLabelToId.get(h.toLowerCase());
        if (id) periodColIdx.push({ idx: i, periodId: id });
      }
    }

    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const label = String(row[labelIdx] ?? "").trim();
      const type = String(row[typeIdx] ?? "").trim();
      if (!label || !type) continue;
      // Skip total/subtotal rows
      if (/^(total|subtotal)/i.test(label)) continue;

      const key = `${type}::${label.toLowerCase()}`;
      const dirHit = dirByKey.get(key);

      const newAmounts: Record<string, number> = {};
      for (const { idx, periodId } of periodColIdx) {
        const v = row[idx];
        if (v == null || v === "") continue;
        const n = Number(v);
        if (Number.isFinite(n) && n !== 0) newAmounts[periodId] = n;
      }

      if (dirHit) {
        // Existing adjustment — diff vs base
        seenIds.add(dirHit.id);
        const baseAdj = meta.snapshot.adjustments[dirHit.id];
        const basePeriodValues = baseAdj?.periodValues ?? {};
        const cellChanges: Record<string, number> = {};
        // Check changes + clears (period had value, now zero/blank)
        const allPeriods = new Set([...Object.keys(basePeriodValues), ...Object.keys(newAmounts)]);
        for (const pid of allPeriods) {
          const oldV = basePeriodValues[pid] ?? 0;
          const newV = newAmounts[pid] ?? 0;
          if (Math.abs(oldV - newV) > 0.005) cellChanges[pid] = newV;
        }
        if (Object.keys(cellChanges).length > 0) changed[dirHit.id] = cellChanges;
      } else {
        // New adjustment added in Excel
        added.push({
          id: `new-${crypto.randomUUID()}`,
          type,
          label,
          tbAccountNumber: acctIdx >= 0 ? String(row[acctIdx] ?? "").trim() || undefined : undefined,
          notes: notesIdx >= 0 ? String(row[notesIdx] ?? "").trim() || undefined : undefined,
          periodValues: newAmounts,
        });
      }
    }
  }

  // Anything in the directory not seen in the workbook = deleted
  const deleted: string[] = [];
  for (const d of meta.adjustmentDirectory) {
    if (!seenIds.has(d.id)) deleted.push(d.id);
  }

  return { changed, deleted, added, warnings };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => null) as { fileBase64?: string } | null;
    if (!body?.fileBase64) {
      return jsonResponse({ ok: false, error: "Missing fileBase64" }, 400);
    }

    let buf: Uint8Array;
    try {
      const bin = atob(body.fileBase64);
      buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    } catch {
      return jsonResponse({ ok: false, error: "Invalid base64 payload" }, 400);
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "array" });
    } catch (err) {
      return jsonResponse({ ok: false, error: "Could not read XLSX", details: String(err) }, 400);
    }

    const metaOrErr = parseMetaSheet(wb);
    if ("error" in metaOrErr) return jsonResponse({ ok: false, error: metaOrErr.error }, 400);
    const meta = metaOrErr;

    const { data: projectRow, error: projectErr } = await supabase
      .from("projects")
      .select("id, revision, wizard_data")
      .eq("id", meta.projectId)
      .maybeSingle();

    if (projectErr || !projectRow) {
      return jsonResponse({
        ok: false,
        error: "You don't have access to this project, or it no longer exists.",
      }, 403);
    }

    const currentRevision = (projectRow.revision as number | null) ?? 0;
    const revisionDrifted = currentRevision !== meta.exportedFromRevision;

    const { tbEdits, warnings: tbWarnings } = parseTrialBalance(wb, meta);
    const { changed, deleted, added, warnings: adjWarnings } = parseAdjustments(wb, meta);

    // Soft warnings for tabs we know about but don't round-trip this phase
    const deferredTabsSeen: string[] = [];
    for (const t of [
      "AR Aging",
      "AP Aging",
      "Fixed Assets",
      "Top Customers by Year",
      "Top Vendors by Year",
      "Due Diligence Information",
      "Reclassifications",
    ]) {
      if (wb.Sheets[t]) deferredTabsSeen.push(t);
    }

    const mine: MineEdits = {
      trialBalance: tbEdits,
      adjustmentsChanged: changed,
      adjustmentsDeleted: deleted,
      adjustmentsAdded: added,
    };

    const tbCellsChanged = Object.values(tbEdits).reduce((s, m) => s + Object.keys(m).length, 0);

    return jsonResponse({
      ok: true,
      schemaVersion: meta.schemaVersion,
      projectId: meta.projectId,
      exportedFromRevision: meta.exportedFromRevision,
      currentRevision,
      revisionDrifted,
      mine,
      base: meta.snapshot,
      summary: {
        tbCellsChanged,
        adjustmentsChanged: Object.keys(changed).length,
        adjustmentsAdded: added.length,
        adjustmentsDeleted: deleted.length,
        deferredTabsSeen,
      },
      warnings: [...tbWarnings, ...adjWarnings],
    }, 200);
  } catch (err) {
    console.error("parse-workbook-upload error:", err);
    return jsonResponse({ ok: false, error: "Server error", details: String(err) }, 500);
  }
});
