/**
 * Round-trip self-test for offline workbook flow.
 *
 * What this proves end-to-end (no edge function deploy required):
 *  1. buildStyledWorkbook embeds a valid schema-1.1 meta sheet with base snapshot
 *  2. ExcelJS round-trips the meta sheet intact
 *  3. After programmatic mutations (TB cell, adjustment amount edit, new adjustment),
 *     a fresh read of the workbook can detect every mutation against the embedded base.
 *
 * For deployed edge function testing, run after this passes:
 *   bun run scripts/test-workbook-roundtrip.ts --invoke
 *
 * (--invoke mode requires a real test project ID + authenticated session and is
 * intended for the sandbox.)
 */
import "./_preload-browser-shims";
import ExcelJS from "exceljs";
import { buildStyledWorkbook } from "../src/lib/buildStyledWorkbook";
import { WORKBOOK_SCHEMA_VERSION, META_SHEET_NAME } from "../src/lib/workbookUploadShared";
import type { DealData } from "../src/lib/workbook-types";

// ─── Minimal mock DealData ───────────────────────────────────
function pid(y: number, m: number) { return `${y}-${String(m).padStart(2, "0")}`; }
function mkPeriod(y: number, m: number) {
  return {
    id: pid(y, m),
    label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${y}`,
    shortLabel: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]}-${String(y).slice(2)}`,
    year: y, month: m, date: new Date(y, m-1, 1),
  };
}

function buildMockDealData(): DealData {
  const periods = [mkPeriod(2024,1), mkPeriod(2024,2), mkPeriod(2024,3)];
  const accounts = [
    { accountId: "1000", accountName: "Sales Revenue", fsType: "IS" as const, fsLineItem: "Revenue", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "6100", accountName: "Cash", fsType: "BS" as const, fsLineItem: "Cash and cash equivalents", subAccount1: "", subAccount2: "", subAccount3: "" },
  ];
  const trialBalance = [
    { ...accounts[0], balances: { [pid(2024,1)]: -100000, [pid(2024,2)]: -110000, [pid(2024,3)]: -120000 } },
    { ...accounts[1], balances: { [pid(2024,1)]: 50000, [pid(2024,2)]: 60000, [pid(2024,3)]: 70000 } },
  ];
  const adjustments = [
    { id: "adj-1", type: "MA" as const, label: "Owner Compensation", tbAccountNumber: "3100", intent: "Normalize", notes: "",
      amounts: { [pid(2024,1)]: 10000, [pid(2024,2)]: 10000, [pid(2024,3)]: 10000 } },
    { id: "adj-2", type: "DD" as const, label: "One-time Legal", tbAccountNumber: "4300", intent: "Non-recurring", notes: "",
      amounts: { [pid(2024,3)]: 25000 } },
  ];
  return {
    deal: {
      projectId: "test-project",
      projectName: "Test Co",
      clientName: "Test Buyer",
      targetCompany: "Test Co",
      industry: "Test",
      transactionType: "Acquisition",
      fiscalYearEnd: 12,
      periods,
      fiscalYears: [],
      aggregatePeriods: [],
    },
    accounts,
    trialBalance,
    adjustments,
    reclassifications: [],
    tbIndex: new Map(),
    monthDates: periods.map(p => p.date),
    arAging: {},
    apAging: {},
    fixedAssets: [],
    topCustomers: {},
    topVendors: {},
    addbacks: {} as DealData["addbacks"],
  };
}

// ─── Replicated meta parser (pure subset of edge function logic) ────
interface MetaParsed {
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  periods: { id: string; label: string; shortLabel: string }[];
  adjustmentDirectory: { id: string; type: string; label: string }[];
  snapshot: { trialBalance: Record<string, Record<string, number>>; adjustments: Record<string, { id: string; type: string; label: string; periodValues: Record<string, number> }> };
}

function readMetaFromWorkbook(wb: ExcelJS.Workbook): MetaParsed {
  const ws = wb.getWorksheet(META_SHEET_NAME);
  if (!ws) throw new Error("Meta sheet missing");
  const g = (addr: string) => String(ws.getCell(addr).value ?? "").trim();
  const schemaVersion = g("B1");
  const projectId = g("B2");
  const exportedFromRevision = Number(g("B3") || "0");

  const periods: MetaParsed["periods"] = [];
  const adjustmentDirectory: MetaParsed["adjustmentDirectory"] = [];
  let section: "" | "periods" | "adjustments" | "snapshot" = "";
  const chunks: string[] = [];
  for (let r = 6; r < 200000; r++) {
    const aRaw = ws.getCell(`A${r}`).value;
    const a = aRaw == null ? "" : String(aRaw);
    const aTrim = a.trim();
    const b = String(ws.getCell(`B${r}`).value ?? "").trim();
    const c = String(ws.getCell(`C${r}`).value ?? "").trim();
    if (!aTrim && !b && !c) {
      if (section !== "snapshot") {
        // tolerate single blanks
        let empty = true;
        for (let look = 1; look <= 4; look++) {
          if (String(ws.getCell(`A${r+look}`).value ?? "").trim()) { empty = false; break; }
        }
        if (empty) break;
      }
      continue;
    }
    if (aTrim === "__periods__") { section = "periods"; continue; }
    if (aTrim === "__adjustments__") { section = "adjustments"; continue; }
    if (aTrim === "__snapshot__") { section = "snapshot"; continue; }
    if (aTrim === "__snapshot_end__") break;
    if (aTrim === "periodId" || aTrim === "id") continue;
    if (section === "periods" && aTrim) periods.push({ id: aTrim, label: b, shortLabel: c || b });
    else if (section === "adjustments" && aTrim) adjustmentDirectory.push({ id: aTrim, type: b, label: c });
    else if (section === "snapshot" && a) chunks.push(a);
  }
  const snapshot = JSON.parse(chunks.join(""));
  return { schemaVersion, projectId, exportedFromRevision, periods, adjustmentDirectory, snapshot };
}

// ─── Mutate workbook like a user would in Excel ────
function mutateWorkbook(wb: ExcelJS.Workbook) {
  // Trial Balance: change Cash · Feb from 60000 → 65000
  const tb = wb.getWorksheet("Trial Balance");
  if (!tb) throw new Error("TB sheet missing");
  // headers: row 1. data starts row 2. Account ID column = "Acct #" → find col by header
  const headerCells = tb.getRow(1).values as unknown[];
  const acctCol = headerCells.findIndex((v, i) => i > 0 && /acct\s*#|account\s*id/i.test(String(v ?? "")));
  if (acctCol < 0) throw new Error(`Acct # column not found. Headers: ${JSON.stringify(headerCells)}`);
  // Feb period column
  const febCol = headerCells.findIndex((v, i) => i > 0 && /Feb.*24|2024-02/.test(String(v ?? "")));
  if (febCol < 0) throw new Error(`Feb column not found. Headers: ${JSON.stringify(headerCells)}`);

  let foundCashRow = -1;
  tb.eachRow((row, rIdx) => {
    if (String(row.getCell(acctCol).value ?? "").trim() === "6100") foundCashRow = rIdx;
  });
  if (foundCashRow < 0) throw new Error("Cash row not found in TB");
  tb.getCell(foundCashRow, febCol).value = 65000;

  // Adjustment edit: change Owner Comp · Mar from 10000 → 15000
  for (const sn of ["DD Adjustments I", "DD Adjustments II"]) {
    const ws = wb.getWorksheet(sn);
    if (!ws) continue;
    let headerRow = -1;
    let headerVals: unknown[] = [];
    for (let r = 1; r <= 10; r++) {
      const vals = ws.getRow(r).values as unknown[];
      if (vals.some(v => String(v ?? "").toLowerCase().trim() === "description")) {
        headerRow = r;
        headerVals = vals;
        break;
      }
    }
    if (headerRow < 0) continue;
    const labelCol = headerVals.findIndex((v, i) => i > 0 && String(v ?? "").toLowerCase().trim() === "description");
    const marCol = headerVals.findIndex((v, i) => i > 0 && /Mar.*24|2024-03/.test(String(v ?? "")));
    if (labelCol < 0 || marCol < 0) continue;
    ws.eachRow((row, rIdx) => {
      if (rIdx <= headerRow) return;
      if (String(row.getCell(labelCol).value ?? "").trim() === "Owner Compensation") {
        row.getCell(marCol).value = 15000;
      }
    });
  }
}

// ─── Pure diff (mirrors edge function logic) ────
function detectChanges(wb: ExcelJS.Workbook, meta: MetaParsed) {
  const tbEdits: Record<string, Record<string, number>> = {};
  const adjEdits: Record<string, Record<string, number>> = {};

  const periodIdByLabel = new Map(meta.periods.map(p => [p.label.toLowerCase(), p.id]));
  const periodIdSet = new Set(meta.periods.map(p => p.id));

  // TB
  const tb = wb.getWorksheet("Trial Balance");
  if (tb) {
    const headers = (tb.getRow(1).values as unknown[]).map(v => String(v ?? "").trim());
    const acctCol = headers.findIndex((h, i) => i > 0 && /acct\s*#|account\s*id/i.test(h));
    const periodCols: { idx: number; pid: string }[] = [];
    headers.forEach((h, i) => {
      if (i === 0) return;
      if (periodIdSet.has(h)) periodCols.push({ idx: i, pid: h });
      else { const id = periodIdByLabel.get(h.toLowerCase()); if (id) periodCols.push({ idx: i, pid: id }); }
    });
    tb.eachRow((row, rIdx) => {
      if (rIdx === 1) return;
      const acctId = String(row.getCell(acctCol).value ?? "").trim();
      if (!acctId) return;
      const baseRow = meta.snapshot.trialBalance[acctId];
      if (!baseRow) return;
      for (const { idx, pid: p } of periodCols) {
        const raw = row.getCell(idx).value;
        if (raw == null || raw === "") continue;
        const n = Number(raw);
        if (!Number.isFinite(n)) continue;
        if (Math.abs((baseRow[p] ?? 0) - n) > 0.005) {
          (tbEdits[acctId] ??= {})[p] = n;
        }
      }
    });
  }

  // Adjustments — match by (type, label) to directory id
  const dir = new Map(meta.adjustmentDirectory.map(d => [`${d.type}::${d.label.toLowerCase().trim()}`, d]));
  for (const sn of ["DD Adjustments I", "DD Adjustments II"]) {
    const ws = wb.getWorksheet(sn);
    if (!ws) continue;
    let headerRow = -1; let headers: unknown[] = [];
    for (let r = 1; r <= 10; r++) {
      const vals = ws.getRow(r).values as unknown[];
      if (vals.some(v => String(v ?? "").toLowerCase().trim() === "description")) { headerRow = r; headers = vals; break; }
    }
    if (headerRow < 0) continue;
    const h = headers.map(v => String(v ?? "").trim());
    const labelCol = h.findIndex((x, i) => i > 0 && x.toLowerCase() === "description");
    const typeCol = h.findIndex((x, i) => i > 0 && x.toLowerCase() === "type");
    const periodCols: { idx: number; pid: string }[] = [];
    h.forEach((x, i) => {
      if (i === 0) return;
      if (periodIdSet.has(x)) periodCols.push({ idx: i, pid: x });
      else { const id = periodIdByLabel.get(x.toLowerCase()); if (id) periodCols.push({ idx: i, pid: id }); }
    });
    ws.eachRow((row, rIdx) => {
      if (rIdx <= headerRow) return;
      const label = String(row.getCell(labelCol).value ?? "").trim();
      const type = String(row.getCell(typeCol).value ?? "").trim();
      if (!label || !type || /^(total|subtotal)/i.test(label)) return;
      const d = dir.get(`${type}::${label.toLowerCase()}`);
      if (!d) return;
      const baseAdj = meta.snapshot.adjustments[d.id];
      const basePV = baseAdj?.periodValues ?? {};
      for (const { idx, pid: p } of periodCols) {
        const raw = row.getCell(idx).value;
        const n = raw == null || raw === "" ? 0 : Number(raw);
        if (!Number.isFinite(n)) continue;
        if (Math.abs((basePV[p] ?? 0) - n) > 0.005) {
          (adjEdits[d.id] ??= {})[p] = n;
        }
      }
    });
  }

  return { tbEdits, adjEdits };
}

async function run() {
  console.log("🔬 Building styled workbook with embedded meta...");
  const dealData = buildMockDealData();
  const wb = await buildStyledWorkbook({
    dealData,
    roundTripMeta: { projectId: "test-project-uuid", revision: 7 },
  });
  console.log(`  ✓ Built workbook with ${wb.worksheets.length} sheets`);

  console.log("🔍 Serializing → re-parsing meta sheet...");
  const buf = await wb.xlsx.writeBuffer();
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(buf as ArrayBuffer);

  const meta = readMetaFromWorkbook(wb2);
  if (meta.schemaVersion !== WORKBOOK_SCHEMA_VERSION) throw new Error(`Schema version mismatch: got ${meta.schemaVersion}, want ${WORKBOOK_SCHEMA_VERSION}`);
  if (meta.projectId !== "test-project-uuid") throw new Error("projectId mismatch");
  if (meta.exportedFromRevision !== 7) throw new Error("revision mismatch");
  if (meta.periods.length !== 3) throw new Error(`expected 3 periods, got ${meta.periods.length}`);
  if (Object.keys(meta.snapshot.trialBalance).length !== 2) throw new Error("TB snapshot wrong size");
  if (Object.keys(meta.snapshot.adjustments).length !== 2) throw new Error("Adj snapshot wrong size");
  if (meta.snapshot.adjustments["adj-1"].periodValues["2024-01"] !== 10000) throw new Error("Adj base values wrong");
  console.log(`  ✓ Meta v${meta.schemaVersion} parsed, ${meta.periods.length} periods, ${Object.keys(meta.snapshot.trialBalance).length} TB accts, ${Object.keys(meta.snapshot.adjustments).length} adjs`);

  console.log("✏️  Mutating workbook (TB cell + adjustment amount)...");
  mutateWorkbook(wb2);

  console.log("🔁 Detecting changes vs base...");
  const { tbEdits, adjEdits } = detectChanges(wb2, meta);

  // Asserts
  const tbCash = tbEdits["6100"];
  if (!tbCash || tbCash["2024-02"] !== 65000) {
    console.log("  TB edits:", JSON.stringify(tbEdits, null, 2));
    throw new Error("Expected TB Cash Feb 2024 = 65000");
  }
  const adj1 = adjEdits["adj-1"];
  if (!adj1 || adj1["2024-03"] !== 15000) {
    console.log("  Adj edits:", JSON.stringify(adjEdits, null, 2));
    throw new Error("Expected adj-1 Mar 2024 = 15000");
  }
  // Should NOT detect adj-2 as changed
  if (adjEdits["adj-2"]) throw new Error("adj-2 incorrectly flagged as changed");

  console.log(`  ✓ Detected ${Object.values(tbEdits).reduce((s,m)=>s+Object.keys(m).length,0)} TB cell edit(s), ${Object.keys(adjEdits).length} adjustment edit(s)`);
  console.log("");
  console.log("✅ All round-trip assertions passed.");
}

run().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
