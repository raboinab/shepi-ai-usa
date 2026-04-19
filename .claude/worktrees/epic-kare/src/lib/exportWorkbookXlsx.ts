/**
 * Excel workbook export — assembles a multi-tab .xlsx from DealData.
 * Uses SheetJS (xlsx) for client-side workbook generation.
 */
import * as XLSX from "xlsx";
import type { DealData, GridData, GridRow, GridColumn } from "./workbook-types";
import { WORKBOOK_TABS } from "./workbook-tabs";
import { TAB_GRID_BUILDERS } from "./workbook-grid-builders";
import { gridDataToRawData } from "./gridToRawData";

interface ExportOptions {
  dealData: DealData;
  filename?: string;
  onProgress?: (current: number, total: number, label: string) => void;
}

/**
 * Truncate sheet name to 31 chars (Excel limit) and ensure uniqueness.
 */
function safeSheetName(label: string, usedNames: Set<string>): string {
  let name = label.substring(0, 31);
  // Remove invalid characters
  name = name.replace(/[/\\*?:[\]]/g, "");
  let base = name;
  let counter = 1;
  while (usedNames.has(name)) {
    name = `${base.substring(0, 28)}_${counter++}`;
  }
  usedNames.add(name);
  return name;
}

/**
 * Apply basic formatting to a worksheet based on GridData metadata.
 */
function applyFormatting(ws: XLSX.WorkSheet, gridData: GridData, rawData: string[][]): void {
  if (rawData.length === 0) return;

  const colCount = rawData[0].length;
  const rowCount = rawData.length;

  // Set column widths
  ws["!cols"] = gridData.columns.map(col => ({
    wch: Math.max(Math.ceil((col.width || 100) / 7), 8),
  }));

  // Freeze panes: freeze first row (header) + frozen columns
  const frozenCols = gridData.frozenColumns || 0;
  ws["!freeze"] = { xSplit: frozenCols, ySplit: 1 };

  // Bold header row and section headers/totals
  // SheetJS community edition doesn't support cell styles, but we set the freeze pane
  // For number formatting, parse numeric cells back to numbers
  const nonNumericColIndices = new Set<number>();
  gridData.columns.forEach((col, i) => {
    if (col.format === "text") nonNumericColIndices.add(i);
  });

  // Build a row-type map from gridData (skip spacers already filtered in gridDataToRawData)
  const rowTypes: (GridRow["type"] | "header")[] = ["header"]; // first row is header
  for (const row of gridData.rows) {
    if (row.type === "spacer") continue;
    rowTypes.push(row.type);
  }

  const rowFormats: (string | undefined)[] = [undefined]; // header has no row format
  for (const row of gridData.rows) {
    if (row.type === "spacer") continue;
    rowFormats.push(row.format);
  }

  // Re-parse values: convert formatted strings back to numbers for proper Excel handling
  for (let r = 1; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (nonNumericColIndices.has(c)) continue;
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      const raw = rawData[r][c];
      if (!raw || raw === "—" || raw === "n/a" || raw === "n/q") continue;

      // Handle zero-value dashes: formatCurrency(0) returns "-" (hyphen)
      if (raw === "-") {
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        cell.t = "n";
        cell.v = 0;
        cell.z = effectiveFormat === "percent" ? "0.0%" : "#,##0";
        continue;
      }

      // Try to parse the formatted value back to a number
      const cleaned = raw.replace(/[$,%\s()]/g, match => match === "(" ? "-" : match === ")" ? "" : "").replace(/,/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && isFinite(num)) {
        cell.t = "n";
        // If it was a percent display, store as decimal
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        if (effectiveFormat === "percent") {
          cell.v = num / 100; // gridDataToRawData formats as "12.3%" → parse gives 12.3 → store 0.123
          cell.z = "0.0%";
        } else if (effectiveFormat === "currency") {
          cell.v = num;
          cell.z = "#,##0";
        } else {
          cell.v = num;
        }
      }
    }
  }
}

/**
 * Export the full workbook as an .xlsx file.
 */
export async function exportWorkbookXlsx({ dealData, filename, onProgress }: ExportOptions): Promise<void> {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  // Collect all tabs to export (including DD Adjustments 1 & 2 which aren't in WORKBOOK_TABS)
  const tabsToExport: { id: string; label: string }[] = [];
  for (const tab of WORKBOOK_TABS) {
    if (tab.id === "qoe-analysis") {
      // Insert DD Adjustments tabs after QoE
      tabsToExport.push(tab);
      tabsToExport.push({ id: "dd-adjustments-1", label: "DD Adjustments I" });
      tabsToExport.push({ id: "dd-adjustments-2", label: "DD Adjustments II" });
    } else {
      tabsToExport.push(tab);
    }
  }

  const total = tabsToExport.length;

  for (let i = 0; i < tabsToExport.length; i++) {
    const tab = tabsToExport[i];
    const builder = TAB_GRID_BUILDERS[tab.id];
    
    onProgress?.(i + 1, total, tab.label);

    if (!builder) continue;

    try {
      const gridData = builder(dealData);
      if (gridData.columns.length === 0) continue;

      const rawData = gridDataToRawData(gridData);
      if (rawData.length === 0) continue;

      const ws = XLSX.utils.aoa_to_sheet(rawData);
      applyFormatting(ws, gridData, rawData);

      const sheetName = safeSheetName(tab.label, usedNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } catch (err) {
      console.warn(`Failed to build tab "${tab.label}":`, err);
    }

    // Yield to keep UI responsive
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Generate filename
  const companyName = dealData.deal.targetCompany || dealData.deal.projectName || "Company";
  const safeName = companyName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
  const outputFilename = filename || `${safeName}_QoE_Workbook.xlsx`;

  // Write and download
  XLSX.writeFile(wb, outputFilename);
}
