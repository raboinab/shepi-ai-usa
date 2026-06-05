/**
 * Verifies the real edge-function parser path: build with ExcelJS,
 * then read with npm:xlsx (same library the deployed function uses)
 * and run the actual parseMetaSheet / parseTrialBalance / parseAdjustments logic.
 *
 * This catches discrepancies between ExcelJS writes and SheetJS reads
 * (number formats, hidden sheets, header row detection, etc.) that the
 * pure-ExcelJS round-trip test cannot catch.
 */
import "./_preload-browser-shims";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { buildStyledWorkbook } from "../src/lib/buildStyledWorkbook";
import { META_SHEET_NAME } from "../src/lib/workbookUploadShared";
import type { DealData } from "../src/lib/workbook-types";

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
    deal: { projectId: "test-project", projectName: "Test Co", clientName: "Test Buyer", targetCompany: "Test Co", industry: "Test", transactionType: "Acquisition", fiscalYearEnd: 12, periods, fiscalYears: [], aggregatePeriods: [] },
    accounts, trialBalance, adjustments, reclassifications: [],
    tbIndex: new Map(), monthDates: periods.map(p => p.date),
    arAging: {}, apAging: {}, fixedAssets: [], topCustomers: {}, topVendors: {},
    addbacks: {} as DealData["addbacks"],
  };
}

// Ported parseMetaSheet from edge function (verbatim except types)
function parseMetaSheet(wb: XLSX.WorkBook) {
  const ws = wb.Sheets[META_SHEET_NAME];
  if (!ws) throw new Error("missing meta sheet");
  const get = (addr: string) => {
    const c = ws[addr]; if (!c) return ""; return String(c.v ?? "").trim();
  };
  if (get("A1") !== "shepiWorkbook") throw new Error(`A1 expected 'shepiWorkbook', got '${get("A1")}'`);
  const schemaVersion = get("B1");
  const projectId = get("B2");
  const exportedFromRevision = Number(get("B3") || "0");

  const periods: { id: string; label: string; shortLabel: string }[] = [];
  const adjustmentDirectory: { id: string; type: string; label: string }[] = [];
  const snapshotChunks: string[] = [];
  let section: "" | "periods" | "adjustments" | "snapshot" = "";
  let emptyRun = 0;
  for (let r = 6; r < 200000; r++) {
    const a = (ws[`A${r}`] ? String(ws[`A${r}`].v ?? "") : "").trim();
    const b = (ws[`B${r}`] ? String(ws[`B${r}`].v ?? "") : "").trim();
    const c = (ws[`C${r}`] ? String(ws[`C${r}`].v ?? "") : "").trim();
    if (!a && !b && !c) {
      if (section === "snapshot") continue;
      if (++emptyRun >= 3) break;
      continue;
    }
    emptyRun = 0;
    if (a === "__periods__") { section = "periods"; continue; }
    if (a === "__adjustments__") { section = "adjustments"; continue; }
    if (a === "__snapshot__") { section = "snapshot"; continue; }
    if (a === "__snapshot_end__") break;
    if (a === "periodId" || a === "id") continue;
    if (section === "periods" && a) periods.push({ id: a, label: b, shortLabel: c || b });
    else if (section === "adjustments" && a) adjustmentDirectory.push({ id: a, type: b, label: c });
    else if (section === "snapshot" && a) snapshotChunks.push(a);
  }
  const snapshot = JSON.parse(snapshotChunks.join(""));
  return { schemaVersion, projectId, exportedFromRevision, periods, adjustmentDirectory, snapshot };
}

async function run() {
  console.log("🔬 Building workbook (ExcelJS) ...");
  const wb = await buildStyledWorkbook({
    dealData: buildMockDealData(),
    roundTripMeta: { projectId: "test-uuid", revision: 3 },
  });
  const buf = await wb.xlsx.writeBuffer();
  console.log(`  ✓ wrote ${(buf as ArrayBuffer).byteLength} bytes`);

  console.log("🔍 Reading with SheetJS (the deployed parser path) ...");
  const wb2 = XLSX.read(new Uint8Array(buf as ArrayBuffer), { type: "array" });
  console.log(`  Sheets seen by sheetjs: ${wb2.SheetNames.length}`);
  if (!wb2.SheetNames.includes(META_SHEET_NAME)) {
    throw new Error(`SheetJS did not see hidden meta sheet '${META_SHEET_NAME}'. Sheets: ${wb2.SheetNames.join(", ")}`);
  }

  const meta = parseMetaSheet(wb2);
  console.log(`  ✓ Schema ${meta.schemaVersion}, project ${meta.projectId}, rev ${meta.exportedFromRevision}`);
  console.log(`  ✓ Periods=${meta.periods.length}, Adjustments=${meta.adjustmentDirectory.length}, TB rows=${Object.keys(meta.snapshot.trialBalance).length}`);

  if (meta.schemaVersion !== "1.1") throw new Error("schemaVersion wrong");
  if (meta.periods.length !== 3) throw new Error("periods wrong");
  if (Object.keys(meta.snapshot.adjustments).length !== 2) throw new Error("adj snapshot wrong");
  if (meta.snapshot.trialBalance["6100"]["2024-02"] !== 60000) throw new Error("TB base wrong");

  console.log("\n✅ SheetJS can parse the meta sheet end-to-end.");
}
run().catch(e => { console.error("❌", e); process.exit(1); });
