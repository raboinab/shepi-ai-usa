/**
 * Server-side PDF layout engine using pdf-lib.
 * Produces a slide-deck style diligence report (landscape 1920x1080 mapped to PDF points).
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import type { GridData, GridRow } from "./workbook/workbook-types.ts";

// ── Brand Colors (RGB 0-1) ──────────────────────────────────────────────
const C = {
  darkBlue: rgb(0.149, 0.290, 0.400),   // #264A66
  midBlue: rgb(0.227, 0.427, 0.549),    // #3A6D8C
  teal: rgb(0.290, 0.498, 0.639),       // #4A7FA3
  gold: rgb(0.769, 0.671, 0.557),       // #C4AB8E
  white: rgb(1, 1, 1),
  offWhite: rgb(0.961, 0.949, 0.925),   // #F5F2EC
  lightGray: rgb(0.886, 0.831, 0.745),  // #E2D4BE
  midGray: rgb(0.424, 0.459, 0.490),    // #6c757d
  darkGray: rgb(0.204, 0.227, 0.251),   // #343a40
  black: rgb(0, 0, 0),
  green: rgb(0.157, 0.655, 0.271),
  red: rgb(0.863, 0.208, 0.271),
  amber: rgb(1, 0.757, 0.027),
};

// Landscape letter: 792 x 612 points
const PW = 792;
const PH = 612;
const PAD = 36;
const HEADER_H = 48;
const FOOTER_H = 30;
const CONTENT_Y_TOP = PH - PAD - HEADER_H - 8;
const CONTENT_Y_BOT = PAD + FOOTER_H + 4;
const CONTENT_W = PW - PAD * 2;
const CONTENT_H = CONTENT_Y_TOP - CONTENT_Y_BOT;

export interface ReportMeta {
  companyName: string;
  projectName: string;
  clientName: string;
  industry: string;
  transactionType: string;
  reportDate: string;
  fiscalYearEnd: string;
}

export interface AttentionItem {
  title: string;
  description?: string;
  rationale?: string;
  followUp?: string;
  severity?: string;
  ebitdaImpact?: number;
}

export interface ExecSummary {
  revenue?: number;
  grossProfit?: number;
  netIncome?: number;
  reportedEBITDA?: number;
  totalAdjustments?: number;
  adjustedEBITDA?: number;
  adjustmentCount?: number;
}

export interface DDAdjustment {
  title: string;
  description?: string;
  block?: string;
  adjustmentClass?: string;
  amount?: number;
  status?: string;
}

export interface FinancialRatio {
  name: string;
  value: string;
  category: string;
}

export interface FlaggedItem {
  description: string;
  account_name: string;
  amount: number;
  flag_type: string;
  flag_category: string;
  confidence_score: number;
  transaction_date: string;
}

export interface GLFinding {
  title: string;
  description: string;
  severity?: string;
  category?: string;
}

export interface PDFReportData {
  metadata: ReportMeta;
  attentionItems?: AttentionItem[];
  execSummary?: ExecSummary;
  ddAdjustments?: DDAdjustment[];
  financialRatios?: FinancialRatio[];
  flaggedItems?: FlaggedItem[];
  glFindings?: GLFinding[];
  jeFindings?: GLFinding[];
  grids: Record<string, GridData>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "$" + abs.toFixed(0);
  return n < 0 ? `(${formatted})` : formatted;
}

function sanitizeWinAnsi(s: string): string {
  return s
    .replace(/↑/g, "^")
    .replace(/↓/g, "v")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/…/g, "...")
    .replace(/[●•]/g, "*")
    .replace(/[✓✔]/g, "[x]")
    .replace(/[✗✘]/g, "[ ]")
    .replace(/[★☆]/g, "*")
    .replace(/[—–−]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

/** Sanitize any value for safe WinAnsi drawText rendering */
function safeText(s: unknown): string {
  return sanitizeWinAnsi(String(s ?? ""));
}

function truncate(s: string, max: number): string {
  const safe = sanitizeWinAnsi(s);
  if (safe.length <= max) return safe;
  return safe.substring(0, max - 3) + "...";
}

function stripMd(s: string): string {
  return sanitizeWinAnsi(
    s.replace(/\*\*/g, "").replace(/[#>~`_]/g, "").replace(/\s{2,}/g, " ").trim()
  );
}

// ── Page Drawing Primitives ─────────────────────────────────────────────

function drawHeader(page: PDFPage, font: PDFFont, boldFont: PDFFont, sectionTitle: string, meta: ReportMeta) {
  // Dark blue header bar
  page.drawRectangle({ x: 0, y: PH - HEADER_H, width: PW, height: HEADER_H, color: C.darkBlue });
  // Teal accent line
  page.drawRectangle({ x: 0, y: PH - HEADER_H - 3, width: PW, height: 3, color: C.teal });
  // Section title
  page.drawText(safeText(sectionTitle || meta.companyName), {
    x: PAD, y: PH - HEADER_H + 16, size: 14, font: boldFont, color: C.white,
  });
  page.drawText("CONFIDENTIAL", {
    x: PW - PAD - 80, y: PH - HEADER_H + 18, size: 8, font, color: C.teal,
  });
}

function drawFooter(page: PDFPage, font: PDFFont, meta: ReportMeta, pageNum: number, totalPages: number) {
  // Border line
  page.drawRectangle({ x: PAD, y: PAD + FOOTER_H, width: CONTENT_W, height: 1, color: C.lightGray });
  // Company name
  page.drawText(safeText(`${meta.companyName} - Quality of Earnings Report`), {
    x: PAD, y: PAD + 10, size: 7, font, color: C.midGray,
  });
  // Page number
  const pageStr = `${pageNum} / ${totalPages}`;
  page.drawText(pageStr, {
    x: PW - PAD - 40, y: PAD + 10, size: 8, font, color: C.midGray,
  });
  // Teal accent dash
  page.drawRectangle({ x: PW - PAD - 60, y: PAD + 13, width: 16, height: 2, color: C.teal });
}

// ── Slide Builders ──────────────────────────────────────────────────────

function addCoverPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta): PDFPage {
  const page = doc.addPage([PW, PH]);
  // Full dark blue background
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C.darkBlue });
  // Teal accent bar
  page.drawRectangle({ x: 0, y: PH * 0.48, width: PW, height: 4, color: C.teal });
  // Gold corner accent
  page.drawRectangle({ x: 0, y: PH - 6, width: 120, height: 6, color: C.gold });

  // Title
  page.drawText("Quality of Earnings", {
    x: PAD + 20, y: PH * 0.62, size: 32, font: boldFont, color: C.white,
  });
  page.drawText("Analysis Report", {
    x: PAD + 20, y: PH * 0.62 - 40, size: 32, font: boldFont, color: C.white,
  });

  // Company name
  page.drawText(safeText(meta.companyName), {
    x: PAD + 20, y: PH * 0.48 - 30, size: 18, font: boldFont, color: C.gold,
  });

  // Info block
  const infoY = PH * 0.32;
  const infoItems = [
    `Prepared for: ${meta.clientName || meta.companyName}`,
    `Date: ${meta.reportDate}`,
    `Industry: ${meta.industry || "N/A"}`,
    `Transaction: ${meta.transactionType || "N/A"}`,
    `Fiscal Year End: ${meta.fiscalYearEnd || "N/A"}`,
  ];
  infoItems.forEach((item, i) => {
    page.drawText(safeText(item), { x: PAD + 20, y: infoY - i * 18, size: 10, font, color: C.offWhite });
  });

  // Confidential footer
  page.drawText("CONFIDENTIAL", {
    x: PW - PAD - 80, y: PAD + 10, size: 8, font, color: C.teal,
  });

  return page;
}

function addDividerPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, subtitle: string, sectionNum: string, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C.darkBlue });
  // Teal accent
  page.drawRectangle({ x: PAD, y: PH * 0.52, width: 80, height: 4, color: C.teal });
  // Section number
  page.drawText(sectionNum, {
    x: PAD, y: PH * 0.68, size: 48, font: boldFont, color: C.gold,
  });
  // Title
  page.drawText(safeText(title), {
    x: PAD, y: PH * 0.52 - 30, size: 28, font: boldFont, color: C.white,
  });
  page.drawText(safeText(subtitle), {
    x: PAD, y: PH * 0.52 - 58, size: 12, font, color: C.offWhite,
  });
  drawFooter(page, font, meta, pageNum, totalPages);
  return page;
}

function addTablePage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, grid: GridData, pageNum: number, totalPages: number, sectionTitle?: string): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, sectionTitle || title, meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  // Title
  let y = CONTENT_Y_TOP - 4;
  page.drawText(safeText(title), { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 24;

  // Table
  const cols = grid.columns;
  const rows = grid.rows;
  if (cols.length === 0 || rows.length === 0) {
    page.drawText("No data available", { x: PAD, y: y - 20, size: 10, font, color: C.midGray });
    return page;
  }

  // Calculate column widths — first column (label) gets more space
  const maxCols = Math.min(cols.length, 14); // limit columns for readability
  const labelW = Math.min(180, CONTENT_W * 0.28);
  const dataCols = maxCols - 1;
  const dataColW = dataCols > 0 ? (CONTENT_W - labelW) / dataCols : 0;

  // Header row
  const headerH = 16;
  page.drawRectangle({ x: PAD, y: y - headerH, width: CONTENT_W, height: headerH, color: C.darkBlue });
  for (let c = 0; c < maxCols; c++) {
    const col = cols[c];
    const cx = c === 0 ? PAD + 4 : PAD + labelW + (c - 1) * dataColW + 4;
    const maxW = c === 0 ? labelW - 8 : dataColW - 8;
    const label = truncate(col.label || col.key, Math.floor(maxW / 4.5));
    page.drawText(label, {
      x: cx, y: y - headerH + 4, size: 6.5, font: boldFont, color: C.white,
    });
  }
  y -= headerH + 2;

  // Data rows
  const rowH = 13;
  const maxRows = Math.floor((y - CONTENT_Y_BOT) / rowH);
  const displayRows = rows.slice(0, maxRows);

  for (let r = 0; r < displayRows.length; r++) {
    const row = displayRows[r];
    const ry = y - r * rowH;
    if (ry < CONTENT_Y_BOT) break;

    // Alternating stripe
    if (r % 2 === 1) {
      page.drawRectangle({ x: PAD, y: ry - rowH, width: CONTENT_W, height: rowH, color: C.offWhite });
    }

    // Highlight totals/subtotals
    const isBold = row.type === "total" || row.type === "subtotal" || row.type === "check";
    if (row.type === "total") {
      page.drawRectangle({ x: PAD, y: ry - rowH, width: CONTENT_W, height: rowH, color: rgb(0.93, 0.91, 0.87) });
    }

    const rowFont = isBold ? boldFont : font;
    const fontSize = 6.5;

    for (let c = 0; c < maxCols; c++) {
      const col = cols[c];
      const cx = c === 0 ? PAD + 4 + (row.indent || 0) * 8 : PAD + labelW + (c - 1) * dataColW + 4;
      const maxW = c === 0 ? labelW - 8 - (row.indent || 0) * 8 : dataColW - 8;
      let cellVal = row.cells?.[col.key];
      if (cellVal === null || cellVal === undefined) cellVal = "";
      let text = String(cellVal);
      if (c > 0 && typeof cellVal === "number") {
        text = fmtCurrency(cellVal);
      }
      text = truncate(safeText(text), Math.floor(maxW / 3.8));
      const textColor = isBold ? C.darkGray : C.black;
      page.drawText(text, { x: cx, y: ry - rowH + 3, size: fontSize, font: rowFont, color: textColor });
    }
  }

  if (rows.length > maxRows) {
    page.drawText(`(${rows.length - maxRows} additional rows not shown)`, {
      x: PAD, y: CONTENT_Y_BOT - 2, size: 7, font, color: C.midGray,
    });
  }

  return page;
}

function addNarrativePage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, items: Array<{ label: string; value: string }>,
  pageNum: number, totalPages: number, sectionTitle?: string): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, sectionTitle || title, meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText(safeText(title), { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 28;

  for (const item of items) {
    if (y < CONTENT_Y_BOT + 30) break;
    page.drawText(safeText(item.label), { x: PAD, y, size: 9, font: boldFont, color: C.darkBlue });
    y -= 14;
    const words = safeText(item.value).split(" ");
    let line = "";
    const maxLineW = CONTENT_W - 20;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (test.length * 4.5 > maxLineW) {
        page.drawText(line, { x: PAD + 8, y, size: 8, font, color: C.darkGray });
        y -= 12;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: PAD + 8, y, size: 8, font, color: C.darkGray });
      y -= 16;
    }
  }

  return page;
}

function addAttentionAreasPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  items: AttentionItem[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Attention Areas", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Key Findings & Risk Assessment", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 8;
  page.drawRectangle({ x: PAD, y: y - 3, width: 36, height: 2.5, color: C.teal });
  y -= 18;

  const sevMeta: Record<string, { color: ReturnType<typeof rgb>; label: string }> = {
    high:   { color: C.red,   label: "HIGH PRIORITY" },
    medium: { color: C.amber, label: "MEDIUM PRIORITY" },
    low:    { color: C.green, label: "LOW PRIORITY" },
    info:   { color: C.teal,  label: "INFORMATIONAL" },
  };

  for (const item of items.slice(0, 6)) {
    if (y < CONTENT_Y_BOT + 78) break;
    const cardH = 78;
    page.drawRectangle({ x: PAD, y: y - cardH, width: CONTENT_W, height: cardH, color: C.offWhite });
    const sev = sevMeta[item.severity || "medium"] || sevMeta.medium;
    page.drawRectangle({ x: PAD, y: y - cardH, width: 5, height: cardH, color: sev.color });

    const titleX = PAD + 14;
    const rightColW = 130;

    page.drawText(truncate(stripMd(item.title), 80), {
      x: titleX, y: y - 16, size: 11, font: boldFont, color: C.darkBlue,
    });

    if (item.ebitdaImpact && item.ebitdaImpact !== 0) {
      const impactStr = `EBITDA ${item.ebitdaImpact < 0 ? "v" : "^"} ${fmtCurrency(item.ebitdaImpact)}`;
      const impactColor = item.ebitdaImpact < 0 ? C.red : C.teal;
      page.drawText(impactStr, {
        x: PW - PAD - rightColW, y: y - 16, size: 9, font: boldFont, color: impactColor,
      });
    }

    page.drawText(sev.label, {
      x: PW - PAD - rightColW, y: y - 30, size: 7, font: boldFont, color: sev.color,
    });

    const desc = item.rationale || item.description || "";
    if (desc) {
      const lines = wrapText(stripMd(desc), 100, 2);
      lines.forEach((ln, i) => {
        page.drawText(ln, { x: titleX, y: y - 32 - i * 11, size: 8, font, color: C.darkGray });
      });
    }
    if (item.followUp) {
      page.drawText(`Next: ${truncate(stripMd(item.followUp), 105)}`, {
        x: titleX, y: y - 64, size: 7.5, font, color: C.midGray,
      });
    }

    y -= cardH + 8;
  }

  return page;
}

/** Soft text-wrap helper for pdf-lib (char-budget based, deliberately conservative). */
function wrapText(s: string, maxChars: number, maxLines: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,;:.\-]+$/, "") + "...";
  }
  return lines;
}

function addExecSummaryPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  summary: ExecSummary, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Executive Summary", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("QoE Executive Summary — LTM Metrics", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 36;

  const kpis: Array<{ label: string; value: string }> = [
    { label: "Revenue", value: fmtCurrency(summary.revenue) },
    { label: "Gross Profit", value: fmtCurrency(summary.grossProfit) },
    { label: "Net Income", value: fmtCurrency(summary.netIncome) },
    { label: "Reported EBITDA", value: fmtCurrency(summary.reportedEBITDA) },
    { label: "Total QoE Adjustments", value: fmtCurrency(summary.totalAdjustments) },
    { label: "Adjusted EBITDA", value: fmtCurrency(summary.adjustedEBITDA) },
  ];

  // KPI cards in 2x3 grid
  const cardW = (CONTENT_W - 20) / 3;
  const cardH = 70;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = PAD + col * (cardW + 10);
    const cy = y - row * (cardH + 12);
    page.drawRectangle({ x: cx, y: cy - cardH, width: cardW, height: cardH, color: C.offWhite });
    page.drawRectangle({ x: cx, y: cy - 3, width: cardW, height: 3, color: C.teal });
    page.drawText(safeText(kpi.label), { x: cx + 10, y: cy - 22, size: 8, font, color: C.midGray });
    page.drawText(safeText(kpi.value), { x: cx + 10, y: cy - 42, size: 16, font: boldFont, color: C.darkBlue });
  });

  // Adjustment count
  y -= 2 * (cardH + 12) + 20;
  const countText = summary.adjustmentCount === -1
    ? "Adjustments applied"
    : `${summary.adjustmentCount || 0} adjustment(s) identified`;
  page.drawText(safeText(countText), { x: PAD, y, size: 10, font, color: C.darkGray });

  return page;
}

function addDDAdjustmentsPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  adjustments: DDAdjustment[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "DD Adjustments", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Due Diligence Adjustments", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 8;
  page.drawRectangle({ x: PAD, y: y - 3, width: 36, height: 2.5, color: C.teal });
  y -= 18;

  const sorted = [...adjustments].sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0));
  const total = sorted.reduce((s, a) => s + (a.amount || 0), 0);

  // Summary band
  const bandH = 36;
  page.drawRectangle({ x: PAD, y: y - bandH, width: CONTENT_W, height: bandH, color: C.darkBlue });
  const stats = [
    { label: "ADJUSTMENTS", value: String(sorted.length) },
    { label: "NET IMPACT", value: fmtCurrency(total) },
  ];
  const statW = CONTENT_W / stats.length;
  stats.forEach((st, i) => {
    const sx = PAD + i * statW + 12;
    page.drawText(st.label, { x: sx, y: y - 13, size: 6.5, font, color: C.lightGray });
    page.drawText(safeText(st.value), { x: sx, y: y - 28, size: 12, font: boldFont, color: C.white });
  });
  y -= bandH + 12;

  const blockTone: Record<string, ReturnType<typeof rgb>> = {
    MA: C.gold, DD: C.teal, PF: C.midBlue,
  };

  for (const adj of sorted.slice(0, 9)) {
    if (y < CONTENT_Y_BOT + 38) break;
    const cardH = 38;
    page.drawRectangle({ x: PAD, y: y - cardH, width: CONTENT_W, height: cardH, color: C.offWhite });
    const tone = blockTone[(adj.block || "DD").toUpperCase()] || C.teal;
    page.drawRectangle({ x: PAD, y: y - cardH, width: 4, height: cardH, color: tone });

    const titleX = PAD + 12;
    const amountW = 90;

    page.drawText(truncate(stripMd(adj.title), 70), {
      x: titleX, y: y - 14, size: 10, font: boldFont, color: C.darkBlue,
    });

    const metaParts: string[] = [(adj.block || "DD").toUpperCase()];
    if (adj.adjustmentClass) metaParts.push(adj.adjustmentClass.replace(/[_-]+/g, " "));
    page.drawText(safeText(metaParts.join("  ·  ")), {
      x: titleX, y: y - 28, size: 7, font, color: C.midGray,
    });

    if (adj.description) {
      page.drawText(truncate(stripMd(adj.description), 70), {
        x: titleX + 220, y: y - 28, size: 7, font, color: C.darkGray,
      });
    }

    const isNeg = (adj.amount || 0) < 0;
    page.drawText(fmtCurrency(adj.amount), {
      x: PW - PAD - amountW, y: y - 22, size: 13, font: boldFont, color: isNeg ? C.red : C.darkBlue,
    });

    y -= cardH + 6;
  }

  if (sorted.length > 9 && y > CONTENT_Y_BOT + 14) {
    page.drawText(`... and ${sorted.length - 9} additional adjustment(s) detailed in the workbook.`, {
      x: PAD, y: y - 8, size: 8, font, color: C.midGray,
    });
  }

  return page;
}

function addFinancialRatiosPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  ratios: FinancialRatio[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Financial Ratios", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Key Financial Ratios — LTM", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 28;

  let lastCat = "";
  for (const ratio of ratios) {
    if (y < CONTENT_Y_BOT + 16) break;
    if (ratio.category !== lastCat) {
      lastCat = ratio.category;
      page.drawText(safeText(ratio.category), { x: PAD, y, size: 9, font: boldFont, color: C.teal });
      y -= 16;
    }
    page.drawText(safeText(ratio.name), { x: PAD + 12, y, size: 8, font, color: C.darkGray });
    page.drawText(safeText(ratio.value), { x: PAD + 280, y, size: 8, font: boldFont, color: C.darkBlue });
    y -= 14;
  }

  return page;
}

function addFlaggedTransactionsPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  items: FlaggedItem[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "AI Analysis", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Flagged Transactions", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 22;

  // Header
  const cols = [180, 100, 80, 100, 100, CONTENT_W - 560];
  const hdrs = ["Description", "Account", "Amount", "Flag Type", "Date", "Category"];
  page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 14, color: C.darkBlue });
  let hx = PAD + 4;
  hdrs.forEach((h, i) => {
    page.drawText(h, { x: hx, y: y - 11, size: 6.5, font: boldFont, color: C.white });
    hx += cols[i];
  });
  y -= 18;

  for (let r = 0; r < Math.min(items.length, 18); r++) {
    if (y < CONTENT_Y_BOT + 16) break;
    const item = items[r];
    if (r % 2 === 1) page.drawRectangle({ x: PAD, y: y - 13, width: CONTENT_W, height: 13, color: C.offWhite });
    let cx = PAD + 4;
    page.drawText(truncate(safeText(item.description), 35), { x: cx, y: y - 10, size: 6.5, font, color: C.darkGray }); cx += cols[0];
    page.drawText(truncate(safeText(item.account_name), 18), { x: cx, y: y - 10, size: 6.5, font, color: C.darkGray }); cx += cols[1];
    page.drawText(safeText(fmtCurrency(item.amount)), { x: cx, y: y - 10, size: 6.5, font: boldFont, color: C.darkBlue }); cx += cols[2];
    page.drawText(truncate(safeText(item.flag_type), 18), { x: cx, y: y - 10, size: 6.5, font, color: C.midGray }); cx += cols[3];
    page.drawText(safeText(item.transaction_date || ""), { x: cx, y: y - 10, size: 6.5, font, color: C.midGray }); cx += cols[4];
    page.drawText(truncate(safeText(item.flag_category), 18), { x: cx, y: y - 10, size: 6.5, font, color: C.midGray });
    y -= 14;
  }

  return page;
}

function addGLAnalysisPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  glFindings: GLFinding[], jeFindings: GLFinding[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "AI Analysis", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("GL / Journal Entry Analysis", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 28;

  const drawFindings = (label: string, findings: GLFinding[]) => {
    if (findings.length === 0) return;
    page.drawText(label, { x: PAD, y, size: 10, font: boldFont, color: C.teal });
    y -= 18;
    for (const f of findings.slice(0, 6)) {
      if (y < CONTENT_Y_BOT + 30) break;
      page.drawText(`• ${truncate(stripMd(f.title), 80)}`, { x: PAD + 8, y, size: 8, font: boldFont, color: C.darkGray });
      y -= 12;
      if (f.description) {
        page.drawText(truncate(stripMd(f.description), 110), { x: PAD + 16, y, size: 7, font, color: C.midGray });
        y -= 14;
      }
    }
    y -= 8;
  };

  drawFindings("General Ledger Findings", glFindings);
  drawFindings("Journal Entry Findings", jeFindings);

  return page;
}

// ── Main Builder ────────────────────────────────────────────────────────

export async function buildPDFReport(data: PDFReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const meta = data.metadata;

  // We'll collect pages then update total count
  type PageFn = (pageNum: number, totalPages: number) => PDFPage;
  const pageFns: PageFn[] = [];

  // ── Cover ──
  pageFns.push(() => addCoverPage(doc, font, boldFont, meta));

  // ── Attention Areas ──
  if (data.attentionItems && data.attentionItems.length > 0) {
    pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "Attention Areas", "Key Findings & Risk Assessment", "I", pn, tp));
    pageFns.push((pn, tp) => addAttentionAreasPage(doc, font, boldFont, meta, data.attentionItems!, pn, tp));
  }

  // ── QoE Section ──
  pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "Quality of Earnings Analysis", "EBITDA Bridge & Adjustment Detail", "II", pn, tp));

  if (data.execSummary && Object.keys(data.execSummary).length > 0) {
    pageFns.push((pn, tp) => addExecSummaryPage(doc, font, boldFont, meta, data.execSummary!, pn, tp));
  }

  if (data.grids.qoeAnalysis) {
    pageFns.push((pn, tp) => addTablePage(doc, font, boldFont, meta, "QoE / EBITDA Bridge", data.grids.qoeAnalysis, pn, tp, "Quality of Earnings"));
  }

  if (data.ddAdjustments && data.ddAdjustments.length > 0) {
    pageFns.push((pn, tp) => addDDAdjustmentsPage(doc, font, boldFont, meta, data.ddAdjustments!, pn, tp));
  }

  if (data.financialRatios && data.financialRatios.length > 0) {
    pageFns.push((pn, tp) => addFinancialRatiosPage(doc, font, boldFont, meta, data.financialRatios!, pn, tp));
  }

  // ── Income Statement Section ──
  pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "Income Statement Analysis", "Revenue, COGS & Operating Expenses", "III", pn, tp));

  const isGrids: Array<{ key: string; title: string }> = [
    { key: "incomeStatement", title: "Income Statement" },
    { key: "isDetailed", title: "Income Statement — Detailed" },
    { key: "salesDetail", title: "Revenue Detail" },
    { key: "cogsDetail", title: "COGS Detail" },
    { key: "opexDetail", title: "Operating Expenses" },
    { key: "otherExpense", title: "Other Expense / Income" },
    { key: "payroll", title: "Payroll Analysis" },
  ];

  for (const g of isGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push((pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Income Statement"));
    }
  }

  // ── Balance Sheet Section ──
  pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "Balance Sheet Analysis", "Assets, Liabilities & Working Capital", "IV", pn, tp));

  const bsGrids: Array<{ key: string; title: string }> = [
    { key: "balanceSheet", title: "Balance Sheet" },
    { key: "bsDetailed", title: "Balance Sheet — Detailed" },
    { key: "arAging", title: "AR Aging" },
    { key: "apAging", title: "AP Aging" },
    { key: "fixedAssets", title: "Fixed Assets" },
    { key: "workingCapital", title: "Working Capital" },
    { key: "nwcAnalysis", title: "Net Working Capital Analysis" },
    { key: "freeCashFlow", title: "Free Cash Flow" },
  ];

  for (const g of bsGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push((pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Balance Sheet"));
    }
  }

  // ── Supplementary Section ──
  pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "Supplementary Analysis", "Proof of Cash, Concentration & AI Findings", "V", pn, tp));

  const suppGrids: Array<{ key: string; title: string }> = [
    { key: "proofOfCash", title: "Proof of Cash" },
    { key: "topCustomers", title: "Customer Concentration" },
    { key: "topVendors", title: "Vendor Concentration" },
  ];

  for (const g of suppGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push((pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Supplementary"));
    }
  }

  // ── AI Analysis Section ──
  if ((data.flaggedItems && data.flaggedItems.length > 0) ||
      (data.glFindings && data.glFindings.length > 0) ||
      (data.jeFindings && data.jeFindings.length > 0)) {
    pageFns.push((pn, tp) => addDividerPage(doc, font, boldFont, meta, "AI-Powered Analysis", "Flagged Transactions & Pattern Detection", "VI", pn, tp));

    if (data.flaggedItems && data.flaggedItems.length > 0) {
      pageFns.push((pn, tp) => addFlaggedTransactionsPage(doc, font, boldFont, meta, data.flaggedItems!, pn, tp));
    }
    if ((data.glFindings && data.glFindings.length > 0) || (data.jeFindings && data.jeFindings.length > 0)) {
      pageFns.push((pn, tp) => addGLAnalysisPage(doc, font, boldFont, meta, data.glFindings || [], data.jeFindings || [], pn, tp));
    }
  }

  // Execute all page functions with correct numbering
  const totalPages = pageFns.length;
  for (let i = 0; i < pageFns.length; i++) {
    pageFns[i](i + 1, totalPages);
  }

  return await doc.save();
}
