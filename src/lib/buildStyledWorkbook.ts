/**
 * Build a fully styled ExcelJS workbook from DealData.
 * Shared by the in-app export and the demo script — produces the same Navy Trust look.
 *
 * Uses ExcelJS (full cell styling: fills, borders, number formats, fonts, frozen panes).
 */
import ExcelJS from "exceljs";
import type { DealData, GridData, GridRow } from "./workbook-types";
import { WORKBOOK_TABS } from "./workbook-tabs";
import { TAB_GRID_BUILDERS, buildProofOfCashGrid, buildDataSourcesGrid } from "./workbook-grid-builders";
import type { ProofOfCashBankData } from "./workbook-grid-builders";
import type { DocSourceItem } from "./workbook-grid-builders/buildDataSourcesGrid";

// Navy Trust palette — keep in lockstep with src/lib/pdf/theme.ts
const NAVY = "FF0F1B3D";
const MID = "FF264A66";
const GOLD = "FFC9A84C";
const SAND = "FFE2D4BE";
const CREAM = "FFF5F2EC";
const ZEBRA = "FFFAF7F1";
const RULE_SOFT = "FFE8E2D5";

const FMT_CURRENCY = '_($* #,##0_);[Red]_($* (#,##0);_($* "-"_);_(@_)';
const FMT_CURRENCY_DEC = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* "-"??_);_(@_)';
const FMT_NUMBER = '#,##0;[Red](#,##0);"-"';
const FMT_PERCENT = '0.0%;[Red](0.0%);"\\-"';
const FMT_MULTIPLE = '0.00"x"';

function safeSheetName(label: string, used: Set<string>): string {
  let name = label.substring(0, 31).replace(/[/\\*?:[]]/g, "");
  const base = name;
  let n = 1;
  while (used.has(name)) name = `${base.substring(0, 28)}_${n++}`;
  used.add(name);
  return name;
}

function numberFormatFor(format: string | undefined): string | undefined {
  if (format === "percent") return FMT_PERCENT;
  if (format === "currency") return FMT_CURRENCY;
  if (format === "multiple") return FMT_MULTIPLE;
  if (format === "number") return FMT_NUMBER;
  return undefined;
}

/**
 * Write a single GridData onto an ExcelJS worksheet with full styling.
 */
function writeGridToSheet(ws: ExcelJS.Worksheet, gridData: GridData): void {
  const { columns, rows, frozenColumns = 0 } = gridData;
  if (columns.length === 0) return;

  // Column widths + default font
  ws.columns = columns.map((col) => ({
    width: Math.max(Math.ceil((col.width || 100) / 7), 10),
  }));

  // ---- Header row ----
  const headerRow = ws.addRow(columns.map((c) => c.label));
  headerRow.height = 26;
  headerRow.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = {
      horizontal: col?.format === "text" || colNumber === 1 ? "left" : "right",
      vertical: "middle",
      wrapText: false,
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: GOLD } },
    };
  });

  // ---- Data rows ----
  let excelRowIdx = 2; // row 1 is header
  let dataRowCounter = 0;

  for (const row of rows as GridRow[]) {
    if (row.type === "spacer") {
      const r = ws.addRow([]);
      r.height = 8;
      excelRowIdx++;
      continue;
    }

    const isDataRow = row.type === "data";
    const isZebra = isDataRow && dataRowCounter % 2 === 1;
    if (isDataRow) dataRowCounter++;

    const values = columns.map((col) => {
      const v = row.cells[col.key];
      if (v === null || v === undefined || v === "") return null;
      return v;
    });
    const r = ws.addRow(values);
    r.height = row.type === "section-header" ? 22 : row.type === "total" || row.type === "subtotal" ? 20 : 18;

    const effectiveRowFormat = row.format;

    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columns[colNumber - 1];
      const isFirstCol = colNumber === 1;
      const isText = col?.format === "text" || isFirstCol;
      const cellFormat = effectiveRowFormat || col?.format;

      // Number formatting
      if (!isText && typeof cell.value === "number") {
        let fmt: string | undefined = numberFormatFor(cellFormat);
        // Heuristic: percent values stored as 0..1 keep as-is; if stored as 12.3 percent treat as 0.123
        if (cellFormat === "percent" && typeof cell.value === "number" && Math.abs(cell.value) > 1.5) {
          cell.value = (cell.value as number) / 100;
        }
        if (fmt) cell.numFmt = fmt;
      } else if (!isText && cell.value == null) {
        // empty numeric cell
        cell.value = null;
      }

      // Base font
      cell.font = {
        name: "Calibri",
        size: 11,
        color: { argb: "FF1A1A1A" },
      };
      cell.alignment = {
        horizontal: isText ? "left" : "right",
        vertical: "middle",
        indent: isText && row.indent ? row.indent : 0,
      };

      // Row-type styling
      if (row.type === "section-header") {
        cell.font = { ...cell.font, bold: true, color: { argb: NAVY }, size: 12 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SAND } };
      } else if (row.type === "total") {
        cell.font = { ...cell.font, bold: true, color: { argb: NAVY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SAND } };
        cell.border = {
          top: { style: "thin", color: { argb: NAVY } },
          bottom: { style: "double", color: { argb: NAVY } },
        };
      } else if (row.type === "subtotal") {
        cell.font = { ...cell.font, bold: true, color: { argb: NAVY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
        cell.border = {
          top: { style: "thin", color: { argb: MID } },
        };
      } else if (row.type === "check") {
        cell.font = { ...cell.font, italic: true, color: { argb: "FF5A5550" }, size: 10 };
      } else if (isZebra) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }

      // First-column serif emphasis for headers/totals
      if (isFirstCol && (row.type === "section-header" || row.type === "total")) {
        cell.font = { ...cell.font, name: "Cambria" };
      }

      // Soft horizontal rule under every data row
      if (row.type === "data" && !cell.border) {
        cell.border = { bottom: { style: "hair", color: { argb: RULE_SOFT } } };
      }
    });

    excelRowIdx++;
  }


  // ---- Freeze panes (header + frozen cols) ----
  ws.views = [
    {
      state: "frozen",
      xSplit: frozenColumns,
      ySplit: 1,
      activeCell: "A2",
    },
  ];

  // ---- Print setup ----
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
    printTitlesRow: "1:1",
  };
  ws.headerFooter = {
    oddFooter: "&L&\"Cambria,Italic\"&9Confidential — Shepi QoE&R&9Page &P of &N",
  };
}

/**
 * Build the cover sheet — branded landing page inside the workbook.
 */
function buildCoverSheet(ws: ExcelJS.Worksheet, dealData: DealData): void {
  ws.columns = [{ width: 4 }, { width: 22 }, { width: 70 }, { width: 4 }];

  // Background fill for the visible area
  for (let r = 1; r <= 28; r++) {
    for (let c = 1; c <= 4; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    }
  }

  // Brand mark
  ws.mergeCells("B3:C3");
  const brand = ws.getCell("B3");
  brand.value = "SHEPI · QUALITY OF EARNINGS";
  brand.font = { name: "Calibri", size: 10, bold: true, color: { argb: GOLD } };
  brand.alignment = { horizontal: "left", vertical: "middle" };

  // Gold rule (row 5)
  for (let c = 2; c <= 3; c++) {
    const cell = ws.getCell(5, c);
    cell.border = { bottom: { style: "medium", color: { argb: GOLD } } };
  }

  // Eyebrow
  ws.mergeCells("B8:C8");
  const eye = ws.getCell("B8");
  eye.value = `DILIGENCE WORKBOOK · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  eye.font = { name: "Calibri", size: 10, color: { argb: GOLD } };
  eye.alignment = { horizontal: "left", vertical: "middle" };

  // Company name — serif
  ws.mergeCells("B10:C12");
  const name = ws.getCell("B10");
  name.value = dealData.deal.targetCompany || dealData.deal.projectName || "Target Company";
  name.font = { name: "Cambria", size: 48, bold: false, color: { argb: "FFFFFFFF" } };
  name.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(10).height = 40;
  ws.getRow(11).height = 40;
  ws.getRow(12).height = 12;

  // Prepared for
  if (dealData.deal.clientName) {
    ws.mergeCells("B14:C14");
    const pf = ws.getCell("B14");
    pf.value = `Prepared for ${dealData.deal.clientName}`;
    pf.font = { name: "Calibri", size: 13, color: { argb: "FFE0E0E0" } };
    pf.alignment = { horizontal: "left", vertical: "middle" };
  }

  // Footer disclaimer
  ws.mergeCells("B26:C26");
  const disc = ws.getCell("B26");
  disc.value =
    "Generated using shepi — an AI-assisted analysis platform. This workbook is not an audit, review, or attestation engagement.";
  disc.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FFB8B8B8" } };
  disc.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

  // Confidential
  ws.mergeCells("B28:C28");
  const conf = ws.getCell("B28");
  conf.value = "CONFIDENTIAL";
  conf.font = { name: "Calibri", size: 10, bold: true, color: { argb: GOLD } };
  conf.alignment = { horizontal: "right", vertical: "middle" };

  ws.views = [{ state: "normal", showGridLines: false, showRowColHeaders: false }];
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 },
  };
}

/**
 * Build the TOC sheet with hyperlinks into each tab.
 */
function buildTOCSheet(ws: ExcelJS.Worksheet, sheets: { id: string; label: string; sheetName: string }[]): void {
  ws.columns = [{ width: 4 }, { width: 8 }, { width: 50 }, { width: 4 }];

  ws.getRow(1).height = 18;
  ws.mergeCells("B2:C2");
  const eye = ws.getCell("B2");
  eye.value = "TABLE OF CONTENTS";
  eye.font = { name: "Calibri", size: 10, bold: true, color: { argb: GOLD } };
  eye.alignment = { horizontal: "left", vertical: "middle" };

  ws.mergeCells("B3:C3");
  const title = ws.getCell("B3");
  title.value = "Workbook Contents";
  title.font = { name: "Cambria", size: 24, color: { argb: NAVY } };
  title.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(3).height = 32;

  // Gold rule
  for (let c = 2; c <= 3; c++) {
    ws.getCell(4, c).border = { bottom: { style: "medium", color: { argb: GOLD } } };
  }

  sheets.forEach((s, i) => {
    const rowIdx = 6 + i;
    const numCell = ws.getCell(rowIdx, 2);
    const linkCell = ws.getCell(rowIdx, 3);

    numCell.value = String(i + 1).padStart(2, "0");
    numCell.font = { name: "Cambria", size: 11, italic: true, color: { argb: GOLD } };
    numCell.alignment = { horizontal: "left", vertical: "middle" };

    linkCell.value = {
      text: s.label,
      hyperlink: `#'${s.sheetName}'!A1`,
    };
    linkCell.font = { name: "Calibri", size: 11, color: { argb: NAVY }, underline: false };
    linkCell.alignment = { horizontal: "left", vertical: "middle" };

    // Subtle row rule
    [numCell, linkCell].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: RULE_SOFT } } };
    });

    ws.getRow(rowIdx).height = 18;
  });

  ws.views = [{ state: "normal", showGridLines: false }];
}

export interface BuildOptions {
  dealData: DealData;
  pocBankData?: ProofOfCashBankData;
  docSources?: DocSourceItem[];
  /** Optional cover/title overrides */
  watermark?: string;
  /** Round-trip metadata: project id and current revision counter */
  roundTripMeta?: { projectId: string; revision: number };
}

/** Schema version for the round-trip meta sheet. Bump when input-tab shape changes. */
export const WORKBOOK_SCHEMA_VERSION = "1.0";

/** Hidden meta sheet name. The leading "_" + lowercase keeps it out of typical TOCs. */
export const META_SHEET_NAME = "__shepi_meta";


/**
 * Build the full styled workbook in memory. Caller saves it.
 */
export async function buildStyledWorkbook(opts: BuildOptions): Promise<ExcelJS.Workbook> {
  const { dealData, pocBankData, docSources, watermark, roundTripMeta } = opts;


  const wb = new ExcelJS.Workbook();
  wb.creator = "Shepi";
  wb.company = "Shepi";
  wb.title = `Quality of Earnings — ${dealData.deal.targetCompany || dealData.deal.projectName || "Company"}`;
  wb.created = new Date();

  // --- Cover ---
  const cover = wb.addWorksheet("Cover", {
    properties: { tabColor: { argb: GOLD } },
  });
  buildCoverSheet(cover, dealData);
  if (watermark) {
    const wm = cover.getCell("B22");
    wm.value = watermark;
    wm.font = { name: "Calibri", size: 11, bold: true, color: { argb: GOLD } };
  }

  // --- Build the tab list ---
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

  const usedNames = new Set<string>(["Cover", "Contents"]);
  const sheetsBuilt: { id: string; label: string; sheetName: string }[] = [];

  // Color-code tabs by section
  const tabColorFor = (id: string): string => {
    if (id.startsWith("dd-adjustments") || id === "qoe-analysis") return GOLD;
    if (id.includes("working-capital") || id === "nwc-analysis" || id === "proof-of-cash" || id === "free-cash-flow")
      return SAND;
    if (id.startsWith("top-") || id === "wip-schedule" || id === "data-sources") return MID;
    return NAVY;
  };

  for (const tab of tabsToExport) {
    let gridData: GridData;
    try {
      if (tab.id === "proof-of-cash") {
        if (!pocBankData) continue;
        gridData = buildProofOfCashGrid(dealData, pocBankData);
      } else if (tab.id === "data-sources") {
        if (!docSources || docSources.length === 0) continue;
        gridData = buildDataSourcesGrid(docSources);
      } else {
        const builder = TAB_GRID_BUILDERS[tab.id];
        if (!builder) continue;
        gridData = builder(dealData);
      }
      if (!gridData || gridData.columns.length === 0) continue;

      const sheetName = safeSheetName(tab.label, usedNames);
      const ws = wb.addWorksheet(sheetName, {
        properties: { tabColor: { argb: tabColorFor(tab.id) } },
      });
      writeGridToSheet(ws, gridData);
      sheetsBuilt.push({ id: tab.id, label: tab.label, sheetName });
    } catch (err) {
      console.warn(`Failed to build tab "${tab.label}":`, err);
    }
  }

  // --- Table of contents (appended at end; ExcelJS preserves insertion order) ---
  const toc = wb.addWorksheet("Contents", {
    properties: { tabColor: { argb: GOLD } },
  });
  buildTOCSheet(toc, sheetsBuilt);

  // --- Hidden meta sheet for offline round-trip (must come LAST) ---
  if (roundTripMeta) {
    writeMetaSheet(wb, dealData, roundTripMeta);
  }

  return wb;
}

/**
 * Hidden machine-readable sheet used by the offline round-trip upload flow.
 * Stores project id, schema version, source revision, plus stable row keys
 * for every input tab so we can match rows on re-import even if the user
 * inserts/reorders rows in Excel.
 */
function writeMetaSheet(
  wb: ExcelJS.Workbook,
  dealData: DealData,
  meta: { projectId: string; revision: number }
): void {
  const ws = wb.addWorksheet(META_SHEET_NAME, { state: "hidden" });

  // Header block — single-cell key/value pairs the parser reads by address
  ws.getCell("A1").value = "shepiWorkbook";
  ws.getCell("B1").value = WORKBOOK_SCHEMA_VERSION;
  ws.getCell("A2").value = "projectId";
  ws.getCell("B2").value = meta.projectId;
  ws.getCell("A3").value = "exportedFromRevision";
  ws.getCell("B3").value = meta.revision;
  ws.getCell("A4").value = "exportedAt";
  ws.getCell("B4").value = new Date().toISOString();

  // Section 1: period keys (id, label) so the parser can map column headers back to period ids
  let row = 6;
  ws.getCell(`A${row}`).value = "__periods__";
  row++;
  ws.getCell(`A${row}`).value = "periodId";
  ws.getCell(`B${row}`).value = "label";
  row++;
  for (const p of dealData.deal.periods) {
    ws.getCell(`A${row}`).value = p.id;
    ws.getCell(`B${row}`).value = p.label;
    row++;
  }

  // Section 2: account keys (accountId, accountName) — used to match TB rows
  row += 1;
  ws.getCell(`A${row}`).value = "__accounts__";
  row++;
  ws.getCell(`A${row}`).value = "accountId";
  ws.getCell(`B${row}`).value = "accountName";
  row++;
  for (const a of dealData.accounts) {
    ws.getCell(`A${row}`).value = a.accountId;
    ws.getCell(`B${row}`).value = a.accountName;
    row++;
  }

  // Section 3: adjustment ids (id, label, type) — used to match adjustment rows
  row += 1;
  ws.getCell(`A${row}`).value = "__adjustments__";
  row++;
  ws.getCell(`A${row}`).value = "id";
  ws.getCell(`B${row}`).value = "type";
  ws.getCell(`C${row}`).value = "label";
  row++;
  for (const adj of dealData.adjustments) {
    ws.getCell(`A${row}`).value = adj.id;
    ws.getCell(`B${row}`).value = adj.type;
    ws.getCell(`C${row}`).value = adj.label;
    row++;
  }

  ws.state = "hidden";
}

