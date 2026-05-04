/**
 * Generate the static demo workbook used by the Export Center preview dialog.
 *
 * Uses the REAL grid builders + mock deal data, so structurally the demo
 * file matches what users get post-signup (same 28 tabs, same layout).
 *
 * Run: bunx tsx scripts/generate-demo-workbook.ts
 *      (or: bun run scripts/generate-demo-workbook.ts)
 *
 * Output: public/demo/acme-sample-workbook.xlsx
 */
// Some transitively-imported modules touch the supabase browser client even
// though we never call it. Shim browser globals so the imports succeed in Node.
// @ts-expect-error - shim for browser-only globals
globalThis.localStorage = globalThis.localStorage || {
  getItem: () => null, setItem: () => {}, removeItem: () => {},
  clear: () => {}, key: () => null, length: 0,
};

import * as XLSX from "xlsx";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { createMockDealData } from "../src/lib/mockDeal";
import { WORKBOOK_TABS } from "../src/lib/workbook-tabs";
import { TAB_GRID_BUILDERS } from "../src/lib/workbook-grid-builders";
import { gridDataToRawData } from "../src/lib/gridToRawData";
import type { GridData, GridRow } from "../src/lib/workbook-types";

const OUT = resolve("public/demo/acme-sample-workbook.xlsx");

function safeSheetName(label: string, used: Set<string>): string {
  let name = label.substring(0, 31).replace(/[/\\*?:[\]]/g, "");
  const base = name;
  let n = 1;
  while (used.has(name)) name = `${base.substring(0, 28)}_${n++}`;
  used.add(name);
  return name;
}

function applyFormatting(ws: XLSX.WorkSheet, gridData: GridData, rawData: string[][]) {
  if (rawData.length === 0) return;
  const colCount = rawData[0].length;
  const rowCount = rawData.length;

  ws["!cols"] = gridData.columns.map((col) => ({
    wch: Math.max(Math.ceil((col.width || 100) / 7), 8),
  }));
  ws["!freeze"] = { xSplit: gridData.frozenColumns || 0, ySplit: 1 };

  const nonNumeric = new Set<number>();
  gridData.columns.forEach((col, i) => {
    if (col.format === "text") nonNumeric.add(i);
  });

  const rowFormats: (string | undefined)[] = [undefined];
  for (const row of gridData.rows) {
    if ((row as GridRow).type === "spacer") continue;
    rowFormats.push((row as GridRow).format);
  }

  for (let r = 1; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (nonNumeric.has(c)) continue;
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (!cell) continue;
      const raw = rawData[r][c];
      if (!raw || raw === "—" || raw === "n/a" || raw === "n/q") continue;

      const colFormat = gridData.columns[c]?.format;
      const effFormat = rowFormats[r] || colFormat;

      if (raw === "-") {
        cell.t = "n";
        cell.v = 0;
        cell.z = effFormat === "percent" ? "0.0%" : "#,##0";
        continue;
      }

      const cleaned = raw
        .replace(/[$,%\s()]/g, (m) => (m === "(" ? "-" : m === ")" ? "" : ""))
        .replace(/,/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && isFinite(num)) {
        cell.t = "n";
        if (effFormat === "percent") {
          cell.v = num / 100;
          cell.z = "0.0%";
        } else if (effFormat === "currency") {
          cell.v = num;
          cell.z = "#,##0";
        } else {
          cell.v = num;
        }
      }
    }
  }
}

function buildDemoCoverSheet(): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["DEMO PREVIEW — NOT FOR DISTRIBUTION"],
    [""],
    ["Company:", "Acme Industrial Supply Co."],
    ["Period:", "Jan 2022 – Dec 2024 (TTM through Dec 2024)"],
    ["Source:", "Synthetic demo data — does not represent a real company"],
    [""],
    ["This workbook is a sample produced from mock data using Shepi's real export pipeline."],
    ["Every tab below is structurally identical to what you receive when you run shepi.ai on your own deal."],
    [""],
    ["Sign up at shepi.ai to generate your own QoE workbook."],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 16 }, { wch: 80 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  return ws;
}

async function main() {
  mkdirSync(resolve("public/demo"), { recursive: true });
  const dealData = createMockDealData();

  const wb = XLSX.utils.book_new();
  const used = new Set<string>();

  // Cover sheet first
  XLSX.utils.book_append_sheet(wb, buildDemoCoverSheet(), safeSheetName("DEMO", used));

  // Tabs (same order as WORKBOOK_TABS, with DD Adjustments inserted)
  const tabsToExport: { id: string; label: string }[] = [];
  for (const tab of WORKBOOK_TABS) {
    if (tab.id === "qoe-analysis") {
      tabsToExport.push(tab);
      tabsToExport.push({ id: "dd-adjustments-1", label: "DD Adjustments I" });
      tabsToExport.push({ id: "dd-adjustments-2", label: "DD Adjustments II" });
    } else {
      tabsToExport.push(tab);
    }
  }

  let built = 0;
  let skipped = 0;
  for (const tab of tabsToExport) {
    try {
      // Skip tabs that need projectId (Proof of Cash, Data Sources)
      if (tab.id === "proof-of-cash" || tab.id === "data-sources") {
        skipped++;
        continue;
      }
      const builder = TAB_GRID_BUILDERS[tab.id];
      if (!builder) {
        skipped++;
        continue;
      }
      const gridData = builder(dealData);
      if (gridData.columns.length === 0) {
        skipped++;
        continue;
      }
      const rawData = gridDataToRawData(gridData);
      if (rawData.length === 0) {
        skipped++;
        continue;
      }
      const ws = XLSX.utils.aoa_to_sheet(rawData);
      applyFormatting(ws, gridData, rawData);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName(tab.label, used));
      built++;
    } catch (err) {
      console.warn(`  ! Failed tab "${tab.label}":`, (err as Error).message);
      skipped++;
    }
  }

  XLSX.writeFile(wb, OUT);
  console.log(`✓ ${OUT}  (${built} tabs built, ${skipped} skipped)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
