/**
 * End-to-end test of the deployed parser logic using the same library
 * (SheetJS) the edge function uses. Validates TB edits, adjustment changes,
 * adjustment additions, and adjustment deletions all round-trip correctly.
 */
import "./_preload-browser-shims";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { buildStyledWorkbook } from "../src/lib/buildStyledWorkbook";
import { META_SHEET_NAME } from "../src/lib/workbookUploadShared";
import type { DealData } from "../src/lib/workbook-types";

function pid(y: number, m: number) { return `${y}-${String(m).padStart(2, "0")}`; }
function mkPeriod(y: number, m: number) {
  return { id: pid(y, m), label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${y}`,
    shortLabel: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]}-${String(y).slice(2)}`,
    year: y, month: m, date: new Date(y, m-1, 1) };
}
function buildMock(): DealData {
  const periods = [mkPeriod(2024,1), mkPeriod(2024,2), mkPeriod(2024,3)];
  const accounts = [
    { accountId: "1000", accountName: "Sales Revenue", fsType: "IS" as const, fsLineItem: "Revenue", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "6100", accountName: "Cash", fsType: "BS" as const, fsLineItem: "Cash and cash equivalents", subAccount1: "", subAccount2: "", subAccount3: "" },
  ];
  return {
    deal: { projectId: "test", projectName: "Test Co", clientName: "Buyer", targetCompany: "Test Co", industry: "X", transactionType: "Acq", fiscalYearEnd: 12, periods, fiscalYears: [], aggregatePeriods: [] },
    accounts,
    trialBalance: [
      { ...accounts[0], balances: { [pid(2024,1)]: -100000, [pid(2024,2)]: -110000, [pid(2024,3)]: -120000 } },
      { ...accounts[1], balances: { [pid(2024,1)]: 50000, [pid(2024,2)]: 60000, [pid(2024,3)]: 70000 } },
    ],
    adjustments: [
      { id: "adj-1", type: "MA", label: "Owner Compensation", tbAccountNumber: "3100", intent: "Normalize", notes: "",
        amounts: { [pid(2024,1)]: 10000, [pid(2024,2)]: 10000, [pid(2024,3)]: 10000 } },
      { id: "adj-2", type: "DD", label: "One-time Legal", tbAccountNumber: "4300", intent: "Non-recurring", notes: "",
        amounts: { [pid(2024,3)]: 25000 } },
    ],
    reclassifications: [], tbIndex: new Map(), monthDates: periods.map(p => p.date),
    arAging: {}, apAging: {},
    fixedAssets: [
      { description: "Forklift #1", category: "Equipment", acquisitionDate: "2022-05-15", cost: 30000, accumulatedDepreciation: 12000, netBookValue: 18000 },
      { description: "Delivery Van", category: "Vehicles", acquisitionDate: "2021-08-01", cost: 45000, accumulatedDepreciation: 22000, netBookValue: 23000 },
    ],
    topCustomers: {}, topVendors: {},
    addbacks: {} as DealData["addbacks"],
  };
}

// ─── Verbatim port of the edge-function parser ───
const SUPPORTED = new Set(["1.1"]);
function parseMeta(wb: XLSX.WorkBook) {
  const ws = wb.Sheets[META_SHEET_NAME]; if (!ws) throw new Error("no meta");
  const g = (a: string) => { const c = ws[a]; return c ? String(c.v ?? "").trim() : ""; };
  if (g("A1") !== "shepiWorkbook") throw new Error("bad meta header");
  const schemaVersion = g("B1"); if (!SUPPORTED.has(schemaVersion)) throw new Error("bad schema");
  const projectId = g("B2"); const exportedFromRevision = Number(g("B3") || "0");
  const periods: { id: string; label: string; shortLabel: string }[] = [];
  const adjustmentDirectory: { id: string; type: string; label: string }[] = [];
  const chunks: string[] = []; let section: "" | "periods" | "adjustments" | "snapshot" = ""; let empty = 0;
  for (let r = 6; r < 200000; r++) {
    const a = (ws[`A${r}`] ? String(ws[`A${r}`].v ?? "") : "").trim();
    const b = (ws[`B${r}`] ? String(ws[`B${r}`].v ?? "") : "").trim();
    const c = (ws[`C${r}`] ? String(ws[`C${r}`].v ?? "") : "").trim();
    if (!a && !b && !c) { if (section === "snapshot") continue; if (++empty >= 3) break; continue; }
    empty = 0;
    if (a === "__periods__") { section = "periods"; continue; }
    if (a === "__adjustments__") { section = "adjustments"; continue; }
    if (a === "__snapshot__") { section = "snapshot"; continue; }
    if (a === "__snapshot_end__") break;
    if (a === "periodId" || a === "id") continue;
    if (section === "periods" && a) periods.push({ id: a, label: b, shortLabel: c || b });
    else if (section === "adjustments" && a) adjustmentDirectory.push({ id: a, type: b, label: c });
    else if (section === "snapshot" && a) chunks.push(a);
  }
  return { schemaVersion, projectId, exportedFromRevision, periods, adjustmentDirectory, snapshot: JSON.parse(chunks.join("")) };
}

function rowsOf(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

function parseTB(wb: XLSX.WorkBook, meta: ReturnType<typeof parseMeta>) {
  const out: Record<string, Record<string, number>> = {};
  const ws = wb.Sheets["Trial Balance"]; if (!ws) return out;
  const rows = rowsOf(ws); const headers = rows[0].map(h => String(h ?? "").trim());
  const acctIdx = headers.findIndex(h => /acct\s*#|account\s*id/i.test(h));
  const pidSet = new Set(meta.periods.map(p => p.id));
  const lbl = new Map<string, string>(); for (const p of meta.periods) { lbl.set(p.label.toLowerCase(), p.id); if (p.shortLabel) lbl.set(p.shortLabel.toLowerCase(), p.id); }
  const cols: { idx: number; pid: string }[] = [];
  headers.forEach((h, i) => { if (pidSet.has(h)) cols.push({ idx: i, pid: h }); else { const id = lbl.get(h.toLowerCase()); if (id) cols.push({ idx: i, pid: id }); } });
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (!row) continue;
    const aid = String(row[acctIdx] ?? "").trim(); if (!aid) continue;
    const base = meta.snapshot.trialBalance[aid]; if (!base) continue;
    const ch: Record<string, number> = {};
    for (const { idx, pid: p } of cols) { const v = row[idx]; if (v == null || v === "") continue; const n = Number(v); if (!Number.isFinite(n)) continue; if (Math.abs((base[p] ?? 0) - n) > 0.005) ch[p] = n; }
    if (Object.keys(ch).length) out[aid] = ch;
  }
  return out;
}

function parseAdj(wb: XLSX.WorkBook, meta: ReturnType<typeof parseMeta>) {
  const changed: Record<string, Record<string, number>> = {};
  const added: { type: string; label: string; periodValues: Record<string, number> }[] = [];
  const seen = new Set<string>();
  const pidSet = new Set(meta.periods.map(p => p.id));
  const lbl = new Map<string, string>(); for (const p of meta.periods) { lbl.set(p.label.toLowerCase(), p.id); if (p.shortLabel) lbl.set(p.shortLabel.toLowerCase(), p.id); }
  const dir = new Map(meta.adjustmentDirectory.map(d => [`${d.type}::${d.label.toLowerCase()}`, d]));

  for (const sn of ["DD Adjustments I", "DD Adjustments II"]) {
    const ws = wb.Sheets[sn]; if (!ws) continue;
    const rows = rowsOf(ws);
    let hr = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) if (String(rows[r]?.[0] ?? "").toLowerCase().trim() === "description") { hr = r; break; }
    if (hr < 0) continue;
    const headers = rows[hr].map(h => String(h ?? "").trim());
    const labelIdx = headers.findIndex(h => h.toLowerCase() === "description");
    const typeIdx = headers.findIndex(h => h.toLowerCase() === "type");
    const cols: { idx: number; pid: string }[] = [];
    headers.forEach((h, i) => { if (pidSet.has(h)) cols.push({ idx: i, pid: h }); else { const id = lbl.get(h.toLowerCase()); if (id) cols.push({ idx: i, pid: id }); } });
    for (let r = hr + 1; r < rows.length; r++) {
      const row = rows[r]; if (!row) continue;
      const label = String(row[labelIdx] ?? "").trim();
      const type = String(row[typeIdx] ?? "").trim();
      if (!label || !type || /^(total|subtotal)/i.test(label)) continue;
      const k = `${type}::${label.toLowerCase()}`;
      const hit = dir.get(k);
      const newAmts: Record<string, number> = {};
      for (const { idx, pid: p } of cols) { const v = row[idx]; if (v == null || v === "") continue; const n = Number(v); if (Number.isFinite(n) && n !== 0) newAmts[p] = n; }
      if (hit) {
        seen.add(hit.id);
        const base = meta.snapshot.adjustments[hit.id]?.periodValues ?? {};
        const ch: Record<string, number> = {};
        for (const p of new Set([...Object.keys(base), ...Object.keys(newAmts)])) {
          const o = base[p] ?? 0; const n = newAmts[p] ?? 0;
          if (Math.abs(o - n) > 0.005) ch[p] = n;
        }
        if (Object.keys(ch).length) changed[hit.id] = ch;
      } else {
        added.push({ type, label, periodValues: newAmts });
      }
    }
  }
  const deleted = meta.adjustmentDirectory.filter(d => !seen.has(d.id)).map(d => d.id);
  return { changed, deleted, added };
}

// ─── Mutate workbook like a real user editing in Excel ───
function mutate(wb: ExcelJS.Workbook) {
  // (1) TB: Cash · Feb 60000 → 65000
  const tb = wb.getWorksheet("Trial Balance")!;
  const hdr = tb.getRow(1).values as unknown[];
  const acctCol = hdr.findIndex((v, i) => i > 0 && /acct\s*#|account\s*id/i.test(String(v ?? "")));
  const febCol = hdr.findIndex((v, i) => i > 0 && /Feb.*24|2024-02/.test(String(v ?? "")));
  tb.eachRow((row, idx) => { if (idx > 1 && String(row.getCell(acctCol).value ?? "").trim() === "6100") row.getCell(febCol).value = 65000; });

  // (2) Adj edit Owner Comp Mar 10k → 15k, (3) DELETE One-time Legal, (4) ADD new MA adjustment
  for (const sn of ["DD Adjustments I", "DD Adjustments II"]) {
    const ws = wb.getWorksheet(sn); if (!ws) continue;
    let hr = -1; let hv: unknown[] = [];
    for (let r = 1; r <= 10; r++) { const v = ws.getRow(r).values as unknown[]; if (v.some(x => String(x ?? "").toLowerCase().trim() === "description")) { hr = r; hv = v; break; } }
    if (hr < 0) continue;
    const labelCol = hv.findIndex((v, i) => i > 0 && String(v ?? "").toLowerCase().trim() === "description");
    const typeCol = hv.findIndex((v, i) => i > 0 && String(v ?? "").toLowerCase().trim() === "type");
    const marCol = hv.findIndex((v, i) => i > 0 && /Mar.*24|2024-03/.test(String(v ?? "")));
    const janCol = hv.findIndex((v, i) => i > 0 && /Jan.*24|2024-01/.test(String(v ?? "")));

    // Edit + Delete (clear row contents)
    const rowsToClear: number[] = [];
    ws.eachRow((row, idx) => {
      if (idx <= hr) return;
      const label = String(row.getCell(labelCol).value ?? "").trim();
      if (label === "Owner Compensation" && marCol > 0) row.getCell(marCol).value = 15000;
      if (label === "One-time Legal") rowsToClear.push(idx);
    });
    for (const r of rowsToClear) {
      const row = ws.getRow(r);
      row.eachCell({ includeEmpty: true }, c => { c.value = null; });
    }

    // Add a new row below existing data (only in DD Adjustments I for simplicity)
    if (sn === "DD Adjustments I" && labelCol > 0 && typeCol > 0 && janCol > 0) {
      // find last non-empty row
      let last = hr;
      ws.eachRow((row, idx) => {
        if (idx > hr && String(row.getCell(labelCol).value ?? "").trim()) last = Math.max(last, idx);
      });
      const newRow = ws.getRow(last + 1);
      newRow.getCell(labelCol).value = "Travel Personalized";
      newRow.getCell(typeCol).value = "MA";
      newRow.getCell(janCol).value = 5000;
    }
  }
}

async function run() {
  console.log("Building workbook…");
  const wb = await buildStyledWorkbook({ dealData: buildMock(), roundTripMeta: { projectId: "test-uuid", revision: 1 } });
  console.log("Mutating (TB edit, adj edit, adj delete, adj add)…");
  mutate(wb);
  const buf = await wb.xlsx.writeBuffer();

  console.log("Reading with SheetJS + deployed parser logic…");
  const wb2 = XLSX.read(new Uint8Array(buf as ArrayBuffer), { type: "array" });
  const meta = parseMeta(wb2);
  const tbEdits = parseTB(wb2, meta);
  const { changed, deleted, added } = parseAdj(wb2, meta);

  console.log("\nResults:");
  console.log("  TB edits:", JSON.stringify(tbEdits));
  console.log("  Changed:", JSON.stringify(changed));
  console.log("  Deleted:", JSON.stringify(deleted));
  console.log("  Added:", JSON.stringify(added));

  const fail = (m: string) => { throw new Error("❌ " + m); };
  if (tbEdits["6100"]?.["2024-02"] !== 65000) fail("TB Cash Feb edit not detected");
  if (changed["adj-1"]?.["2024-03"] !== 15000) fail("Owner Comp Mar edit not detected");
  if (!deleted.includes("adj-2")) fail("One-time Legal deletion not detected");
  if (!added.some(a => a.label === "Travel Personalized" && a.type === "MA" && a.periodValues["2024-01"] === 5000)) fail("New adjustment not detected");

  console.log("\n✅ All parser branches verified against SheetJS.");
}
run().catch(e => { console.error(e); process.exit(1); });
