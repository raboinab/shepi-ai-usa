/**
 * Web Worker: builds a full QoE PDF report using pdf-lib.
 * Runs off the main thread — no UI blocking, no CPU time limits.
 *
 * Receives: { type: "build", payload: PDFReportData }
 * Posts:    { type: "progress", page, total } during build
 *           { type: "done", pdf: Uint8Array } on success
 *           { type: "error", message: string } on failure
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { GridData, GridRow } from "@/lib/workbook-types";

// ── Types (mirrors server pdf-builder.ts) ──────────────────────────────

export interface ReportMeta {
  companyName: string;
  projectName: string;
  clientName: string;
  industry: string;
  transactionType: string;
  reportDate: string;
  fiscalYearEnd: string;
  serviceTier?: 'diy' | 'done_for_you';
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
  /** Traceability fields */
  source?: "ai_discovery" | "manual";
  detectorType?: string;
  supportTier?: number | null;
  supportTierLabel?: string | null;
  aiRationale?: string | null;
  keySignals?: string[];
  evidenceTransactions?: Array<{ date: string; description: string; amount: number; matchQuality: string }>;
  verificationStatus?: string;
  verificationScore?: number | null;
  keyFindings?: string[];
  redFlags?: string[];
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

export interface CIMInsights {
  businessOverview?: string;
  productsServices?: string[];
  keyRisks?: string[];
  growthDrivers?: string[];
}

export interface DocSourceItem {
  label: string;
  tier: "required" | "recommended" | "optional";
  status: "provided" | "not_provided" | "na";
  uploadDate?: string;
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
  cimInsights?: CIMInsights;
  documentSources?: DocSourceItem[];
  grids: Record<string, GridData>;
  /** Enriched adjustments for traceability appendix */
  traceabilityAdjustments?: DDAdjustment[];
}

// ── Brand Colors ────────────────────────────────────────────────────────
const C = {
  darkBlue: rgb(0.149, 0.290, 0.400),
  midBlue: rgb(0.227, 0.427, 0.549),
  teal: rgb(0.290, 0.498, 0.639),
  gold: rgb(0.769, 0.671, 0.557),
  white: rgb(1, 1, 1),
  offWhite: rgb(0.961, 0.949, 0.925),
  lightGray: rgb(0.886, 0.831, 0.745),
  midGray: rgb(0.424, 0.459, 0.490),
  darkGray: rgb(0.204, 0.227, 0.251),
  black: rgb(0, 0, 0),
  green: rgb(0.157, 0.655, 0.271),
  red: rgb(0.863, 0.208, 0.271),
  amber: rgb(1, 0.757, 0.027),
};

const PW = 792;
const PH = 612;
const PAD = 36;
const HEADER_H = 48;
const FOOTER_H = 30;
const CONTENT_Y_TOP = PH - PAD - HEADER_H - 8;
const CONTENT_Y_BOT = PAD + FOOTER_H + 4;
const CONTENT_W = PW - PAD * 2;

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
  page.drawRectangle({ x: 0, y: PH - HEADER_H, width: PW, height: HEADER_H, color: C.darkBlue });
  page.drawRectangle({ x: 0, y: PH - HEADER_H - 3, width: PW, height: 3, color: C.teal });
  page.drawText(safeText(sectionTitle || meta.companyName), {
    x: PAD, y: PH - HEADER_H + 16, size: 14, font: boldFont, color: C.white,
  });
  page.drawText("CONFIDENTIAL", {
    x: PW - PAD - 80, y: PH - HEADER_H + 18, size: 8, font, color: C.teal,
  });
}

function drawFooter(page: PDFPage, font: PDFFont, meta: ReportMeta, pageNum: number, totalPages: number) {
  page.drawRectangle({ x: PAD, y: PAD + FOOTER_H, width: CONTENT_W, height: 1, color: C.lightGray });
  const tierStamp = meta.serviceTier === 'done_for_you'
    ? "Professional Analysis · Not an Audit or Attestation"
    : "AI-Assisted Analysis · Not an Audit or Attestation";
  page.drawText(safeText(`${meta.companyName} - Quality of Earnings Report   |   ${tierStamp}`), {
    x: PAD, y: PAD + 10, size: 7, font, color: C.midGray,
  });
  const pageStr = `${pageNum} / ${totalPages}`;
  page.drawText(pageStr, {
    x: PW - PAD - 40, y: PAD + 10, size: 8, font, color: C.midGray,
  });
  page.drawRectangle({ x: PW - PAD - 60, y: PAD + 13, width: 16, height: 2, color: C.teal });
}

// ── Slide Builders ──────────────────────────────────────────────────────

function addCoverPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta): PDFPage {
  const page = doc.addPage([PW, PH]);
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C.darkBlue });
  page.drawRectangle({ x: 0, y: PH * 0.48, width: PW, height: 4, color: C.teal });
  page.drawRectangle({ x: 0, y: PH - 6, width: 120, height: 6, color: C.gold });

  page.drawText("Quality of Earnings", {
    x: PAD + 20, y: PH * 0.62, size: 32, font: boldFont, color: C.white,
  });
  page.drawText("Analysis Report", {
    x: PAD + 20, y: PH * 0.62 - 40, size: 32, font: boldFont, color: C.white,
  });
  page.drawText(safeText(meta.companyName), {
    x: PAD + 20, y: PH * 0.48 - 30, size: 18, font: boldFont, color: C.gold,
  });

  const infoY = PH * 0.32;
  const isDiy = meta.serviceTier !== 'done_for_you';
  const infoItems = [
    `Prepared for: ${meta.clientName || meta.companyName}`,
    `Date: ${meta.reportDate}`,
    `Industry: ${meta.industry || "N/A"}`,
    `Transaction: ${meta.transactionType || "N/A"}`,
    `Fiscal Year End: ${meta.fiscalYearEnd || "N/A"}`,
    ...(isDiy ? ["Generated using shepi — an AI-assisted analysis platform"] : []),
  ];
  infoItems.forEach((item, i) => {
    page.drawText(safeText(item), { x: PAD + 20, y: infoY - i * 18, size: 10, font, color: C.offWhite });
  });

  page.drawText("CONFIDENTIAL", {
    x: PW - PAD - 80, y: PAD + 10, size: 8, font, color: C.teal,
  });

  return page;
}

function addDividerPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, subtitle: string, sectionNum: string, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: PH * 0.52, width: 80, height: 4, color: C.teal });
  page.drawText(sectionNum, { x: PAD, y: PH * 0.68, size: 48, font: boldFont, color: C.gold });
  page.drawText(safeText(title), { x: PAD, y: PH * 0.52 - 30, size: 28, font: boldFont, color: C.white });
  page.drawText(safeText(subtitle), { x: PAD, y: PH * 0.52 - 58, size: 12, font, color: C.offWhite });
  drawFooter(page, font, meta, pageNum, totalPages);
  return page;
}

function addTablePage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, grid: GridData, pageNum: number, totalPages: number, sectionTitle?: string): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, sectionTitle || title, meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText(safeText(title), { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 24;

  const cols = grid.columns;
  const rows = grid.rows;
  if (cols.length === 0 || rows.length === 0) {
    page.drawText("No data available", { x: PAD, y: y - 20, size: 10, font, color: C.midGray });
    return page;
  }

  const maxCols = Math.min(cols.length, 14);
  const labelW = Math.min(180, CONTENT_W * 0.28);
  const dataCols = maxCols - 1;
  const dataColW = dataCols > 0 ? (CONTENT_W - labelW) / dataCols : 0;

  const headerH = 16;
  page.drawRectangle({ x: PAD, y: y - headerH, width: CONTENT_W, height: headerH, color: C.darkBlue });
  for (let c = 0; c < maxCols; c++) {
    const col = cols[c];
    const cx = c === 0 ? PAD + 4 : PAD + labelW + (c - 1) * dataColW + 4;
    const maxW = c === 0 ? labelW - 8 : dataColW - 8;
    const label = truncate(col.label || col.key, Math.floor(maxW / 4.5));
    page.drawText(label, { x: cx, y: y - headerH + 4, size: 6.5, font: boldFont, color: C.white });
  }
  y -= headerH + 2;

  const rowH = 13;
  const maxRows = Math.floor((y - CONTENT_Y_BOT) / rowH);
  const displayRows = rows.slice(0, maxRows);

  for (let r = 0; r < displayRows.length; r++) {
    const row = displayRows[r];
    const ry = y - r * rowH;
    if (ry < CONTENT_Y_BOT) break;

    if (r % 2 === 1) {
      page.drawRectangle({ x: PAD, y: ry - rowH, width: CONTENT_W, height: rowH, color: C.offWhite });
    }

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
        // Check if column is a percentage column
        const colKey = (col.key || "").toLowerCase();
        const colLabel = (col.label || "").toLowerCase();
        const isPercent = (col as unknown as Record<string,unknown>).format === "percent" 
          || colKey.includes("pct") || colKey.includes("percent") || colKey.includes("margin")
          || colLabel.includes("%") || colLabel.includes("pct") || colLabel.includes("percent");
        if (isPercent) {
          // Values stored as decimals (0.15 = 15%) or whole numbers
          const pctVal = Math.abs(cellVal as number) < 1 ? (cellVal as number) * 100 : cellVal as number;
          text = isNaN(pctVal) ? "-" : `${pctVal.toFixed(1)}%`;
        } else {
          text = fmtCurrency(cellVal);
        }
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
    page.drawRectangle({ x: PAD, y: y - cardH, width: CONTENT_W, height: 0.5, color: C.lightGray });
    const sev = sevMeta[item.severity || "medium"] || sevMeta.medium;
    page.drawRectangle({ x: PAD, y: y - cardH, width: 5, height: cardH, color: sev.color });

    const titleX = PAD + 14;
    const innerW = CONTENT_W - 14 - 8;

    // Reserve right column for impact + severity tag
    const hasImpact = !!(item.ebitdaImpact && item.ebitdaImpact !== 0);
    const rightColW = 130;
    const titleW = innerW - rightColW;

    page.drawText(truncate(stripMd(item.title), 80), {
      x: titleX, y: y - 16, size: 11, font: boldFont, color: C.darkBlue, maxWidth: titleW,
    });

    if (hasImpact) {
      const impactStr = `EBITDA ${item.ebitdaImpact! < 0 ? "v" : "^"} ${fmtCurrency(item.ebitdaImpact)}`;
      const impactColor = item.ebitdaImpact! < 0 ? C.red : C.teal;
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
  page.drawText("QoE Executive Summary - LTM Metrics", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 36;

  const kpis = [
    { label: "Revenue", value: fmtCurrency(summary.revenue) },
    { label: "Gross Profit", value: fmtCurrency(summary.grossProfit) },
    { label: "Net Income", value: fmtCurrency(summary.netIncome) },
    { label: "Reported EBITDA", value: fmtCurrency(summary.reportedEBITDA) },
    { label: "Total QoE Adjustments", value: fmtCurrency(summary.totalAdjustments) },
    { label: "Adjusted EBITDA", value: fmtCurrency(summary.adjustedEBITDA) },
  ];

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

  // Sort by absolute amount, descending
  const sorted = [...adjustments].sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0));
  const total = sorted.reduce((s, a) => s + (a.amount || 0), 0);
  const verifiedCount = sorted.filter(a => a.verificationStatus && a.verificationStatus !== "pending").length;

  // Summary band
  const bandH = 36;
  page.drawRectangle({ x: PAD, y: y - bandH, width: CONTENT_W, height: bandH, color: C.darkBlue });
  const stats = [
    { label: "ADJUSTMENTS", value: String(sorted.length) },
    { label: "NET IMPACT", value: fmtCurrency(total) },
    { label: "VERIFIED", value: `${verifiedCount} / ${sorted.length}` },
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
    const titleW = CONTENT_W - 12 - amountW - 12;

    page.drawText(truncate(stripMd(adj.title), 70), {
      x: titleX, y: y - 14, size: 10, font: boldFont, color: C.darkBlue, maxWidth: titleW,
    });

    // Block + category meta line
    const metaParts: string[] = [(adj.block || "DD").toUpperCase()];
    if (adj.adjustmentClass) metaParts.push(adj.adjustmentClass.replace(/[_-]+/g, " "));
    if (adj.verificationStatus && adj.verificationStatus !== "pending") metaParts.push(adj.verificationStatus.toUpperCase());
    page.drawText(safeText(metaParts.join("  ·  ")), {
      x: titleX, y: y - 28, size: 7, font, color: C.midGray,
    });

    // Reason (if any)
    if (adj.description) {
      page.drawText(truncate(stripMd(adj.description), 70), {
        x: titleX + 220, y: y - 28, size: 7, font, color: C.darkGray, maxWidth: titleW - 220,
      });
    }

    // Amount badge
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
  page.drawText("Key Financial Ratios - LTM", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
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
      page.drawText(`* ${truncate(stripMd(f.title), 80)}`, { x: PAD + 8, y, size: 8, font: boldFont, color: C.darkGray });
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

// ── Front-Matter Pages ──────────────────────────────────────────────────

function addOverviewPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Overview", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Engagement Overview", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 24;

  // Left narrative
  const narrative = `This Quality of Earnings report provides an independent analysis of the historical financial performance and condition of ${safeText(meta.companyName)}. The analysis covers the key financial metrics, adjustments to reported earnings, and assessment of the sustainability of earnings.`;
  const words = narrative.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (test.length * 4.5 > CONTENT_W * 0.55) {
      page.drawText(line, { x: PAD, y, size: 9, font, color: C.midGray });
      y -= 14;
      line = w;
    } else { line = test; }
  }
  if (line) { page.drawText(line, { x: PAD, y, size: 9, font, color: C.midGray }); y -= 20; }

  // Details card
  const cardX = PAD;
  const cardW = CONTENT_W;
  const details = [
    ["Target Company", meta.companyName],
    ["Client", meta.clientName || "-"],
    ["Industry", meta.industry || "-"],
    ["Transaction Type", meta.transactionType || "-"],
    ["Fiscal Year End", meta.fiscalYearEnd || "-"],
    ["Report Date", meta.reportDate],
  ];
  y -= 8;
  page.drawRectangle({ x: cardX, y: y - details.length * 22 - 16, width: cardW, height: details.length * 22 + 16, color: C.darkBlue });
  page.drawText("COMPANY DETAILS", { x: cardX + 16, y: y - 16, size: 8, font: boldFont, color: C.teal });
  let dy = y - 36;
  for (const [label, value] of details) {
    page.drawText(safeText(label), { x: cardX + 16, y: dy, size: 8, font, color: rgb(1, 1, 1) });
    page.drawText(safeText(value), { x: cardX + cardW - 200, y: dy, size: 8, font: boldFont, color: C.white });
    dy -= 22;
  }

  return page;
}

function addCIMOverviewPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  cim: CIMInsights, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Business Overview", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Business Overview", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 24;

  const overview = cim.businessOverview || `Overview information for ${meta.companyName} will be populated from CIM analysis.`;
  const words = safeText(overview).split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (test.length * 4.5 > CONTENT_W - 20) {
      page.drawText(line, { x: PAD, y, size: 9, font, color: C.midGray });
      y -= 13;
      line = w;
    } else { line = test; }
  }
  if (line) { page.drawText(line, { x: PAD, y, size: 9, font, color: C.midGray }); y -= 20; }

  const drawBulletList = (title: string, items: string[], dotColor: typeof C.teal) => {
    if (items.length === 0 || y < CONTENT_Y_BOT + 40) return;
    page.drawText(safeText(title), { x: PAD, y, size: 9, font: boldFont, color: C.darkBlue });
    y -= 16;
    for (const item of items.slice(0, 6)) {
      if (y < CONTENT_Y_BOT + 16) break;
      page.drawCircle({ x: PAD + 6, y: y + 3, size: 3, color: dotColor });
      page.drawText(truncate(safeText(item), 100), { x: PAD + 16, y, size: 8, font, color: C.darkGray });
      y -= 14;
    }
    y -= 8;
  };

  drawBulletList("Products & Services", cim.productsServices || [], C.teal);
  drawBulletList("Growth Drivers", cim.growthDrivers || [], C.green);
  drawBulletList("Key Risks", cim.keyRisks || [], C.red);

  return page;
}

function addDisclaimerPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Disclaimer", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Important Disclaimers", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 28;

  const isDiy = meta.serviceTier !== 'done_for_you';
  const paragraphs = [
    `This Quality of Earnings report has been prepared solely for the use of the intended recipient in connection with the proposed transaction involving ${safeText(meta.companyName)}. This report is confidential and may not be distributed to any third party without prior written consent.`,
    "The analysis presented herein is based on financial information provided by the Company and its representatives. We have not independently verified the accuracy or completeness of such information. Our procedures do not constitute an audit, review, or compilation of financial statements in accordance with generally accepted auditing standards.",
    "This report is not intended to be, and should not be, relied upon for tax, legal, or investment advice. The recipient should consult with their own professional advisors regarding tax, legal, and financial matters related to the proposed transaction.",
    "Forward-looking statements and projections contained in this report are based on assumptions and estimates that are inherently uncertain. Actual results may differ materially from those projected. We make no representation or warranty regarding the achievability of any projected results.",
    "Our analysis includes adjustments to reported earnings that reflect our professional judgment regarding the nature, frequency, and sustainability of certain items. These adjustments are presented for informational purposes and may differ from adjustments that would be determined by other parties.",
    "The scope and reliability of this analysis are directly dependent on the documents and data provided. Sections of this report may be limited or omitted where supporting documentation was not available. A complete list of documents provided is included in the Data Sources appendix.",
    ...(isDiy ? [
      "This report was generated using AI-assisted analytical tools. It has not been prepared, reviewed, or certified by a licensed Certified Public Accountant (CPA), auditor, or other credentialed financial professional. The methodologies employed are automated and pattern-based.",
      "Analysis Methodology: Financial data was uploaded by the report preparer and processed using automated normalization, trend analysis, and adjustment identification algorithms. AI models were used to suggest potential adjustments, which were reviewed and accepted or modified by the preparer. All figures in this report reflect the preparer's final selections.",
    ] : []),
    "If this report is shared with or relied upon by any third party, including but not limited to lenders, investors, or regulatory bodies, such reliance is at the sole risk of the recipient. The preparer and the platform provider accept no liability for any decisions made or actions taken by third parties based on the contents of this report.",
  ];

  for (const para of paragraphs) {
    if (y < CONTENT_Y_BOT + 30) break;
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (test.length * 4.2 > CONTENT_W - 20) {
        page.drawText(line, { x: PAD, y, size: 8, font, color: C.darkGray });
        y -= 12;
        line = w;
      } else { line = test; }
    }
    if (line) { page.drawText(line, { x: PAD, y, size: 8, font, color: C.darkGray }); y -= 18; }
  }
  return page;
}

function addDataSourcesPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  sources: DocSourceItem[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Data Sources", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Data Sources & Document Coverage", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 28;

  const tiers: Array<{ key: string; label: string; color: typeof C.red }> = [
    { key: "required", label: "REQUIRED", color: C.red },
    { key: "recommended", label: "RECOMMENDED", color: C.amber },
    { key: "optional", label: "OPTIONAL", color: C.midGray },
  ];

  for (const tier of tiers) {
    const items = sources.filter(s => s.tier === tier.key);
    if (items.length === 0) continue;
    if (y < CONTENT_Y_BOT + 40) break;

    page.drawText(tier.label, { x: PAD, y, size: 9, font: boldFont, color: tier.color });
    y -= 16;

    for (const item of items) {
      if (y < CONTENT_Y_BOT + 16) break;
      const icon = item.status === "provided" ? "[x]" : item.status === "na" ? " - " : "[ ]";
      const iconColor = item.status === "provided" ? C.green : item.status === "na" ? C.midGray : C.red;
      const statusText = item.status === "provided"
        ? `Provided${item.uploadDate ? ` (${item.uploadDate})` : ""}`
        : item.status === "na" ? "N/A" : "Not Provided";

      page.drawText(icon, { x: PAD + 4, y, size: 8, font: boldFont, color: iconColor });
      page.drawText(safeText(item.label), { x: PAD + 28, y, size: 8, font, color: C.darkGray });
      page.drawText(safeText(statusText), { x: PAD + 380, y, size: 8, font: boldFont, color: iconColor });
      y -= 14;
    }
    y -= 6;
  }

  const reqItems = sources.filter(s => s.tier === "required");
  const reqMissing = reqItems.filter(s => s.status === "not_provided").length;
  if (reqMissing > 0 && y > CONTENT_Y_BOT + 30) {
    page.drawRectangle({ x: PAD, y: y - 18, width: CONTENT_W, height: 18, color: rgb(0.996, 0.953, 0.78) });
    page.drawRectangle({ x: PAD, y: y - 18, width: 3, height: 18, color: C.amber });
    page.drawText(`${reqMissing} of ${reqItems.length} required document(s) not provided. Analysis scope limited accordingly.`, {
      x: PAD + 10, y: y - 13, size: 7.5, font, color: C.darkGray,
    });
    y -= 24;
  }

  if (y > CONTENT_Y_BOT + 16) {
    page.drawText("The completeness of this analysis is limited to the data sources listed above.", {
      x: PAD, y, size: 7, font, color: C.midGray,
    });
  }

  return page;
}


function addKeyTermsPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Key Terms & Definitions", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Key Terms & Definitions", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 28;

  const terms = [
    ["FY", "Fiscal Year - the 12-month accounting period used by the Company"],
    ["LTM", "Last Twelve Months - trailing 12-month period ending on the most recent reporting date"],
    ["EBITDA", "Earnings Before Interest, Taxes, Depreciation, and Amortization"],
    ["Adjusted EBITDA", "EBITDA adjusted for non-recurring, non-operational, and owner-related items"],
    ["QoE", "Quality of Earnings - analysis of the sustainability and accuracy of reported earnings"],
    ["COGS", "Cost of Goods Sold - direct costs attributable to production of goods or services"],
    ["SG&A", "Selling, General & Administrative - operating expenses not directly tied to production"],
    ["NWC", "Net Working Capital - current assets minus current liabilities, excluding cash and debt"],
    ["DSO", "Days Sales Outstanding - average number of days to collect receivables"],
    ["DPO", "Days Payable Outstanding - average number of days to pay suppliers"],
  ];

  const termColW = 120;
  // Header row
  page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 14, color: C.darkBlue });
  page.drawText("TERM", { x: PAD + 4, y: y - 11, size: 7, font: boldFont, color: C.white });
  page.drawText("DEFINITION", { x: PAD + termColW + 4, y: y - 11, size: 7, font: boldFont, color: C.white });
  y -= 18;

  for (let i = 0; i < terms.length; i++) {
    if (y < CONTENT_Y_BOT + 16) break;
    if (i % 2 === 1) page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 14, color: C.offWhite });
    page.drawText(safeText(terms[i][0]), { x: PAD + 4, y: y - 10, size: 7.5, font: boldFont, color: C.darkBlue });
    page.drawText(safeText(terms[i][1]), { x: PAD + termColW + 4, y: y - 10, size: 7, font, color: C.darkGray });
    y -= 15;
  }

  return page;
}

function addTOCPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  sections: Array<{ num: string; title: string; page: number }>,
  pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Table of Contents", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Table of Contents", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 32;

  page.drawText(`This report presents a comprehensive Quality of Earnings analysis for ${safeText(meta.companyName)}.`, {
    x: PAD, y, size: 9, font, color: C.midGray,
  });
  y -= 28;

  for (const s of sections) {
    if (y < CONTENT_Y_BOT + 16) break;
    page.drawRectangle({ x: PAD, y: y - 18, width: CONTENT_W, height: 1, color: C.lightGray });
    page.drawText(safeText(s.num), { x: PAD, y: y - 14, size: 10, font: boldFont, color: C.teal });
    page.drawText(safeText(s.title), { x: PAD + 40, y: y - 14, size: 10, font: boldFont, color: C.darkBlue });
    page.drawText(String(s.page), { x: PW - PAD - 20, y: y - 14, size: 9, font, color: C.midGray });
    y -= 24;
  }

  return page;
}

// ── Adjustment Traceability Appendix ─────────────────────────────────────

function addTraceabilityPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  adjustments: DDAdjustment[], startIdx: number, totalAdj: number, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Adjustment Traceability", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText(`Adjustment Traceability - Items ${startIdx}-${Math.min(startIdx + adjustments.length - 1, totalAdj)} of ${totalAdj}`, {
    x: PAD, y, size: 12, font: boldFont, color: C.darkBlue,
  });
  y -= 22;

  const TIER_LABELS: Record<number, string> = {
    0: "Independently Corroborated",
    1: "Multiple Source Support",
    2: "Single Source Verified",
    3: "Analytical Support Only",
    4: "Management Asserted",
  };

  for (const adj of adjustments) {
    if (y < CONTENT_Y_BOT + 80) break;

    // Adjustment header bar
    page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 16, color: C.darkBlue });
    page.drawText(truncate(stripMd(adj.title), 70), { x: PAD + 4, y: y - 11, size: 8, font: boldFont, color: C.white });
    const amtStr = fmtCurrency(adj.amount);
    page.drawText(amtStr, { x: PW - PAD - 80, y: y - 11, size: 8, font: boldFont, color: C.white });
    y -= 20;

    // Source & Support Tier
    const sourceLabel = adj.source === "ai_discovery" ? `AI Discovery (${safeText(adj.detectorType || "")})` : "Manual Entry";
    page.drawText(`Source: ${sourceLabel}`, { x: PAD + 4, y, size: 7, font: boldFont, color: C.midBlue });
    if (adj.supportTier != null) {
      const tierLabel = TIER_LABELS[adj.supportTier] || `Tier ${adj.supportTier}`;
      page.drawText(`Support: ${tierLabel} (T${adj.supportTier})`, { x: PAD + 260, y, size: 7, font, color: C.midGray });
    }
    const blockLabel = (adj.block || "DD").toUpperCase();
    page.drawText(`Block: ${blockLabel}`, { x: PAD + 520, y, size: 7, font, color: C.midGray });
    y -= 14;

    // AI Rationale
    if (adj.aiRationale) {
      page.drawText("Rationale:", { x: PAD + 4, y, size: 7, font: boldFont, color: C.darkGray });
      y -= 11;
      const ratLines = wrapText(stripMd(adj.aiRationale), 120);
      for (const line of ratLines.slice(0, 3)) {
        page.drawText(line, { x: PAD + 12, y, size: 6.5, font, color: C.darkGray });
        y -= 10;
      }
    }

    // Key Signals
    if (adj.keySignals && adj.keySignals.length > 0) {
      page.drawText("Key Signals:", { x: PAD + 4, y, size: 7, font: boldFont, color: C.darkGray });
      y -= 11;
      for (const sig of adj.keySignals.slice(0, 4)) {
        page.drawText(`  * ${truncate(stripMd(sig), 100)}`, { x: PAD + 12, y, size: 6.5, font, color: C.midGray });
        y -= 10;
      }
    }

    // Evidence Transactions
    if (adj.evidenceTransactions && adj.evidenceTransactions.length > 0) {
      page.drawText("Supporting Evidence:", { x: PAD + 4, y, size: 7, font: boldFont, color: C.darkGray });
      y -= 12;
      // Mini table header
      page.drawRectangle({ x: PAD + 8, y: y - 10, width: CONTENT_W - 16, height: 10, color: C.offWhite });
      page.drawText("Date", { x: PAD + 12, y: y - 8, size: 6, font: boldFont, color: C.midGray });
      page.drawText("Description", { x: PAD + 80, y: y - 8, size: 6, font: boldFont, color: C.midGray });
      page.drawText("Amount", { x: PAD + 400, y: y - 8, size: 6, font: boldFont, color: C.midGray });
      page.drawText("Quality", { x: PAD + 500, y: y - 8, size: 6, font: boldFont, color: C.midGray });
      y -= 14;
      for (const ev of adj.evidenceTransactions.slice(0, 5)) {
        page.drawText(safeText(ev.date || ""), { x: PAD + 12, y, size: 6, font, color: C.darkGray });
        page.drawText(truncate(stripMd(ev.description || ""), 55), { x: PAD + 80, y, size: 6, font, color: C.darkGray });
        page.drawText(fmtCurrency(ev.amount), { x: PAD + 400, y, size: 6, font, color: C.darkGray });
        page.drawText(safeText(ev.matchQuality || ""), { x: PAD + 500, y, size: 6, font, color: C.midGray });
        y -= 10;
      }
    }

    // Verification Result
    if (adj.verificationStatus && adj.verificationStatus !== "pending") {
      const vColor = adj.verificationStatus === "validated" || adj.verificationStatus === "supported" ? C.green
        : adj.verificationStatus === "contradictory" || adj.verificationStatus === "insufficient" ? C.red : C.amber;
      const vLabel = `${safeText(adj.verificationStatus)} ${adj.verificationScore != null ? `(${adj.verificationScore})` : ""}`;
      page.drawText(`Verification: ${vLabel}`, { x: PAD + 4, y, size: 7, font: boldFont, color: vColor });
      y -= 11;
      if (adj.keyFindings && adj.keyFindings.length > 0) {
        for (const f of adj.keyFindings.slice(0, 2)) {
          page.drawText(`  - ${truncate(stripMd(f), 100)}`, { x: PAD + 12, y, size: 6.5, font, color: C.midGray });
          y -= 10;
        }
      }
      if (adj.redFlags && adj.redFlags.length > 0) {
        page.drawText(`Red Flags: ${adj.redFlags.map(f => truncate(stripMd(f), 40)).join("; ")}`, {
          x: PAD + 12, y, size: 6.5, font, color: C.red,
        });
        y -= 10;
      }
    }

    y -= 10; // spacing between adjustments
  }

  return page;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Main Builder ────────────────────────────────────────────────────────

async function buildPDFReport(data: PDFReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const meta = data.metadata;

  type PageFn = (pageNum: number, totalPages: number) => PDFPage;
  const pageFns: Array<{ fn: PageFn; section?: string }> = [];

  // Cover
  pageFns.push({ fn: () => addCoverPage(doc, font, boldFont, meta) });

  // TOC placeholder — we'll come back and fill the page number after we know totals
  const tocIndex = pageFns.length;
  pageFns.push({ fn: () => doc.addPage([PW, PH]), section: "TOC_PLACEHOLDER" });

  // Overview
  pageFns.push({ fn: (pn, tp) => addOverviewPage(doc, font, boldFont, meta, pn, tp) });

  // CIM / Business Overview
  if (data.cimInsights) {
    pageFns.push({ fn: (pn, tp) => addCIMOverviewPage(doc, font, boldFont, meta, data.cimInsights!, pn, tp) });
  }

  // Disclaimer
  pageFns.push({ fn: (pn, tp) => addDisclaimerPage(doc, font, boldFont, meta, pn, tp) });

  // Data Sources
  if (data.documentSources && data.documentSources.length > 0) {
    pageFns.push({ fn: (pn, tp) => addDataSourcesPage(doc, font, boldFont, meta, data.documentSources!, pn, tp) });
  }

  // Key Terms
  pageFns.push({ fn: (pn, tp) => addKeyTermsPage(doc, font, boldFont, meta, pn, tp) });

  // Attention Areas
  const attentionPageIndex = pageFns.length;
  if (data.attentionItems && data.attentionItems.length > 0) {
    pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "Attention Areas", "Key Findings & Risk Assessment", "I", pn, tp), section: "Attention Areas" });
    pageFns.push({ fn: (pn, tp) => addAttentionAreasPage(doc, font, boldFont, meta, data.attentionItems!, pn, tp) });
  }

  // QoE Section
  const qoePageIndex = pageFns.length;
  pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "Quality of Earnings Analysis", "EBITDA Bridge & Adjustment Detail", "II", pn, tp), section: "Quality of Earnings" });

  if (data.execSummary && Object.keys(data.execSummary).length > 0) {
    pageFns.push({ fn: (pn, tp) => addExecSummaryPage(doc, font, boldFont, meta, data.execSummary!, pn, tp) });
  }

  if (data.grids.qoeAnalysis) {
    pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "QoE / EBITDA Bridge", data.grids.qoeAnalysis, pn, tp, "Quality of Earnings") });
  }

  if (data.ddAdjustments && data.ddAdjustments.length > 0) {
    pageFns.push({ fn: (pn, tp) => addDDAdjustmentsPage(doc, font, boldFont, meta, data.ddAdjustments!, pn, tp) });
  }

  // DD Adjustments grid pages
  if (data.grids.ddAdjustments1 && data.grids.ddAdjustments1.rows.length > 0) {
    pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "DD Adjustments - Detail I", data.grids.ddAdjustments1, pn, tp, "Quality of Earnings") });
  }
  if (data.grids.ddAdjustments2 && data.grids.ddAdjustments2.rows.length > 0) {
    pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "DD Adjustments - Detail II", data.grids.ddAdjustments2, pn, tp, "Quality of Earnings") });
  }

  // Adjustment Traceability Appendix pages
  const traceAdj = data.traceabilityAdjustments ?? data.ddAdjustments ?? [];
  const traceableItems = traceAdj.filter(a => a.source || a.aiRationale || a.verificationStatus);
  if (traceableItems.length > 0) {
    const ITEMS_PER_PAGE = 3;
    for (let i = 0; i < traceableItems.length; i += ITEMS_PER_PAGE) {
      const chunk = traceableItems.slice(i, i + ITEMS_PER_PAGE);
      pageFns.push({ fn: (pn, tp) => addTraceabilityPage(doc, font, boldFont, meta, chunk, i + 1, traceableItems.length, pn, tp) });
    }
  }

  if (data.financialRatios && data.financialRatios.length > 0) {
    pageFns.push({ fn: (pn, tp) => addFinancialRatiosPage(doc, font, boldFont, meta, data.financialRatios!, pn, tp) });
  }

  // Income Statement Section
  const isPageIndex = pageFns.length;
  pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "Income Statement Analysis", "Revenue, COGS & Operating Expenses", "III", pn, tp), section: "Income Statement" });

  const isGrids = [
    { key: "incomeStatement", title: "Income Statement" },
    { key: "isDetailed", title: "Income Statement - Detailed" },
    { key: "salesDetail", title: "Revenue Detail" },
    { key: "cogsDetail", title: "COGS Detail" },
    { key: "opexDetail", title: "Operating Expenses" },
    { key: "otherExpense", title: "Other Expense / Income" },
    { key: "payroll", title: "Payroll Analysis" },
  ];

  for (const g of isGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Income Statement") });
    }
  }

  // Balance Sheet Section
  const bsPageIndex = pageFns.length;
  pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "Balance Sheet Analysis", "Assets, Liabilities & Working Capital", "IV", pn, tp), section: "Balance Sheet" });

  const bsGrids = [
    { key: "balanceSheet", title: "Balance Sheet" },
    { key: "bsDetailed", title: "Balance Sheet - Detailed" },
    { key: "arAging", title: "AR Aging" },
    { key: "apAging", title: "AP Aging" },
    { key: "fixedAssets", title: "Fixed Assets" },
    { key: "workingCapital", title: "Working Capital" },
    { key: "nwcAnalysis", title: "Net Working Capital Analysis" },
    { key: "freeCashFlow", title: "Free Cash Flow" },
  ];

  for (const g of bsGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Balance Sheet") });
    }
  }

  // Supplementary Section
  const suppPageIndex = pageFns.length;
  pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "Supplementary Analysis", "Proof of Cash, Concentration & AI Findings", "V", pn, tp), section: "Supplementary" });

  const suppGrids = [
    { key: "proofOfCash", title: "Proof of Cash" },
    { key: "topCustomers", title: "Customer Concentration" },
    { key: "topVendors", title: "Vendor Concentration" },
  ];

  for (const g of suppGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      pageFns.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Supplementary") });
    }
  }

  // AI Analysis Section
  if ((data.flaggedItems && data.flaggedItems.length > 0) ||
      (data.glFindings && data.glFindings.length > 0) ||
      (data.jeFindings && data.jeFindings.length > 0)) {
    pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, "AI-Powered Analysis", "Flagged Transactions & Pattern Detection", "VI", pn, tp), section: "AI Analysis" });

    if (data.flaggedItems && data.flaggedItems.length > 0) {
      pageFns.push({ fn: (pn, tp) => addFlaggedTransactionsPage(doc, font, boldFont, meta, data.flaggedItems!, pn, tp) });
    }
    if ((data.glFindings && data.glFindings.length > 0) || (data.jeFindings && data.jeFindings.length > 0)) {
      pageFns.push({ fn: (pn, tp) => addGLAnalysisPage(doc, font, boldFont, meta, data.glFindings || [], data.jeFindings || [], pn, tp) });
    }
  }

  // Build TOC sections with page numbers
  const tocSections: Array<{ num: string; title: string; page: number }> = [];
  if (data.attentionItems && data.attentionItems.length > 0) {
    tocSections.push({ num: "I", title: "Attention Areas", page: attentionPageIndex + 1 });
  }
  tocSections.push({ num: "II", title: "Quality of Earnings Analysis", page: qoePageIndex + 1 });
  tocSections.push({ num: "III", title: "Income Statement Analysis", page: isPageIndex + 1 });
  tocSections.push({ num: "IV", title: "Balance Sheet Analysis", page: bsPageIndex + 1 });
  tocSections.push({ num: "V", title: "Supplementary Analysis", page: suppPageIndex + 1 });

  // Now replace the TOC placeholder
  pageFns[tocIndex] = { fn: (pn, tp) => addTOCPage(doc, font, boldFont, meta, tocSections, pn, tp) };

  // Execute all page functions
  const totalPages = pageFns.length;
  for (let i = 0; i < pageFns.length; i++) {
    try {
      pageFns[i].fn(i + 1, totalPages);
    } catch (e) {
      console.warn(`PDF page ${i + 1} failed, skipping:`, e);
    }
    self.postMessage({ type: "progress", page: i + 1, total: totalPages });
  }

  return await doc.save();
}

// ── Worker Message Handler ──────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  if (e.data?.type !== "build") return;

  try {
    const reportData = e.data.payload as PDFReportData;
    const pdfBytes = await buildPDFReport(reportData);
    self.postMessage({ type: "done", pdf: pdfBytes }, [pdfBytes.buffer] as any);
  } catch (err) {
    self.postMessage({ type: "error", message: (err as Error).message || "PDF build failed" });
  }
};
