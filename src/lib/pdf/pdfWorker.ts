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

export interface NarrativeCallout { label: string; text: string }
export interface NarrativeParagraph { topic: string; observation: string; recommendation?: string }
export interface NarrativeContent {
  bullets?: string[];
  callouts?: NarrativeCallout[];
  paragraphs?: NarrativeParagraph[];
}

export interface MonthlyRevenuePoint { month: string; revenue: number }

export interface BusinessOverview {
  description?: string;
  productsServices?: string[];
  customerProfile?: string;
  growthDrivers?: string[];
  keyRisks?: string[];
  founded?: string;
  headquarters?: string;
  employeeCount?: string;
  ownershipType?: string;
}

export interface PLReconciliation {
  /** Owner / broker / SIM stated EBITDA before adjustments */
  brokerEBITDA?: number;
  brokerLabel?: string;
  /** Reconciling items between broker figure and Shepi reported EBITDA */
  reconcilingItems?: Array<{ label: string; amount: number }>;
  reportedEBITDA: number;
  /** Adjustments from reported -> adjusted */
  adjustments: Array<{ label: string; amount: number; category?: string }>;
  adjustedEBITDA: number;
  revenue?: number;
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
  /** AI-generated narrative content keyed by slide_key (qoe, revenue_detail, ...) */
  narratives?: Record<string, NarrativeContent>;
  /** Monthly revenue series for seasonality / MoM charts */
  monthlyRevenue?: MonthlyRevenuePoint[];
  /** Structured P&L reconciliation (broker -> reported -> adjusted) */
  plReconciliation?: PLReconciliation;
  /** Business overview pulled from intake (preferred over cimInsights) */
  businessOverview?: BusinessOverview;
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
      const lines = wrapTextLines(stripMd(desc), 100, 2);
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
function wrapTextLines(s: string, maxChars: number, maxLines: number): string[] {
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

function cleanFlagLabel(s: string): string {
  return safeText(String(s || "")).replace(/[_-]+/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function addFlaggedTransactionsPages(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  items: FlaggedItem[], startPageNum: number, totalPages: number): PDFPage[] {
  const pages: PDFPage[] = [];
  if (!items || items.length === 0) return pages;

  const groups = new Map<string, FlaggedItem[]>();
  for (const it of items) {
    const cat = cleanFlagLabel(it.flag_category || "Other");
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(it);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);

  const highCount = items.filter(i => (i.flag_category || "").toLowerCase().includes("risk") || (i.confidence_score || 0) >= 0.9).length;
  const totalAmount = items.reduce((s, i) => s + Math.abs(i.amount || 0), 0);

  const kpis = [
    { label: "TOTAL FLAGGED", value: String(items.length) },
    { label: "HIGH PRIORITY", value: String(highCount) },
    { label: "AGGREGATE $", value: fmtCurrency(totalAmount) },
    { label: "CATEGORIES", value: String(sortedGroups.length) },
  ];

  const cap = Math.min(items.length, 50);
  const ROWS_PER_PAGE = 22;
  let drawnIdx = 0;
  let pageIdx = 0;
  let groupCursor = 0;
  let inGroupCursor = 0;
  let groupHeaderDrawn = false;

  while (drawnIdx < cap) {
    const page = doc.addPage([PW, PH]);
    pages.push(page);
    drawHeader(page, font, boldFont, "AI Analysis", meta);
    drawFooter(page, font, meta, startPageNum + pageIdx, totalPages);
    let y = CONTENT_Y_TOP - 4;

    if (pageIdx === 0) {
      page.drawText("AI-Flagged Transactions", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
      page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
      y -= 22;
      const stripH = 36;
      const cardW = (CONTENT_W - 18) / kpis.length;
      kpis.forEach((k, i) => {
        const cx = PAD + i * (cardW + 6);
        page.drawRectangle({ x: cx, y: y - stripH, width: cardW, height: stripH, color: C.darkBlue });
        page.drawRectangle({ x: cx, y: y - 3, width: cardW, height: 3, color: C.teal });
        page.drawText(k.label, { x: cx + 8, y: y - 16, size: 6.5, font, color: C.lightGray });
        page.drawText(k.value, { x: cx + 8, y: y - 30, size: 13, font: boldFont, color: C.white });
      });
      y -= stripH + 14;
    } else {
      page.drawText(`AI-Flagged Transactions (continued)`, { x: PAD, y, size: 12, font: boldFont, color: C.darkBlue });
      y -= 22;
    }

    const colW = { desc: 280, acct: 140, amt: 70, type: 90, date: 60, conf: 50 };
    page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 14, color: C.darkBlue });
    let hx = PAD + 4;
    const hdrs: Array<[string, number]> = [
      ["Description / Reason", colW.desc],
      ["Account", colW.acct],
      ["Amount", colW.amt],
      ["Issue Type", colW.type],
      ["Date", colW.date],
      ["Conf.", colW.conf],
    ];
    hdrs.forEach(([h, w]) => {
      page.drawText(h, { x: hx, y: y - 11, size: 6.5, font: boldFont, color: C.white });
      hx += w;
    });
    y -= 16;

    let r = 0;
    while (r < ROWS_PER_PAGE && drawnIdx < cap && groupCursor < sortedGroups.length) {
      const [catName, list] = sortedGroups[groupCursor];
      if (!groupHeaderDrawn) {
        if (y < CONTENT_Y_BOT + 26) break;
        const subtotal = list.reduce((s, i) => s + Math.abs(i.amount || 0), 0);
        page.drawRectangle({ x: PAD, y: y - 12, width: CONTENT_W, height: 12, color: rgb(0.93, 0.91, 0.87) });
        page.drawText(`${catName}  (${list.length})`, { x: PAD + 6, y: y - 9, size: 7.5, font: boldFont, color: C.darkBlue });
        page.drawText(fmtCurrency(subtotal), { x: PAD + colW.desc + colW.acct, y: y - 9, size: 7.5, font: boldFont, color: C.darkBlue });
        y -= 14;
        r++;
        groupHeaderDrawn = true;
      }
      while (inGroupCursor < list.length && r < ROWS_PER_PAGE && drawnIdx < cap) {
        if (y < CONTENT_Y_BOT + 14) break;
        const it = list[inGroupCursor];
        if (r % 2 === 1) page.drawRectangle({ x: PAD, y: y - 12, width: CONTENT_W, height: 12, color: C.offWhite });
        let cx = PAD + 6;
        page.drawText(truncate(safeText(it.description), 60), { x: cx, y: y - 9, size: 6.5, font, color: C.darkGray }); cx += colW.desc;
        page.drawText(truncate(safeText(it.account_name), 26), { x: cx, y: y - 9, size: 6.5, font, color: C.darkGray }); cx += colW.acct;
        page.drawText(fmtCurrency(it.amount), { x: cx, y: y - 9, size: 6.5, font: boldFont, color: C.darkBlue }); cx += colW.amt;
        page.drawText(truncate(cleanFlagLabel(it.flag_type), 16), { x: cx, y: y - 9, size: 6.5, font, color: C.midGray }); cx += colW.type;
        page.drawText(safeText(it.transaction_date || ""), { x: cx, y: y - 9, size: 6.5, font, color: C.midGray }); cx += colW.date;
        const conf = it.confidence_score ? `${Math.round(it.confidence_score * 100)}%` : "-";
        const confColor = (it.confidence_score || 0) >= 0.9 ? C.red : (it.confidence_score || 0) >= 0.75 ? C.amber : C.midGray;
        page.drawText(conf, { x: cx, y: y - 9, size: 6.5, font: boldFont, color: confColor });
        y -= 12;
        inGroupCursor++;
        drawnIdx++;
        r++;
      }
      if (inGroupCursor >= list.length) {
        groupCursor++;
        inGroupCursor = 0;
        groupHeaderDrawn = false;
        y -= 4;
      } else {
        break;
      }
    }

    if (drawnIdx >= cap && items.length > cap) {
      page.drawText(`+ ${items.length - cap} additional flagged transactions available in the workbook.`, {
        x: PAD, y: Math.max(y - 6, CONTENT_Y_BOT + 4), size: 7, font, color: C.midGray,
      });
    }
    pageIdx++;
  }

  return pages;
}

function addPLReconciliationPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  recon: PLReconciliation, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Quality of Earnings", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("P&L Reconciliation Bridge", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 8;
  page.drawText("Owner / Broker stated EBITDA reconciled to Shepi reported and Shepi adjusted EBITDA.", {
    x: PAD, y: y - 14, size: 8, font, color: C.midGray,
  });
  y -= 30;

  const labelX = PAD + 8;
  const amtX = PW - PAD - 200;
  const pctX = PW - PAD - 70;
  page.drawRectangle({ x: PAD, y: y - 16, width: CONTENT_W, height: 16, color: C.darkBlue });
  page.drawText("Item", { x: labelX, y: y - 12, size: 7.5, font: boldFont, color: C.white });
  page.drawText("Amount ($)", { x: amtX, y: y - 12, size: 7.5, font: boldFont, color: C.white });
  page.drawText("% Revenue", { x: pctX, y: y - 12, size: 7.5, font: boldFont, color: C.white });
  y -= 20;

  const revenue = recon.revenue || 0;
  const pct = (n: number) => revenue > 0 ? `${((n / revenue) * 100).toFixed(1)}%` : "-";

  const drawRow = (label: string, amount: number | undefined, opts: { bold?: boolean; rule?: boolean; muted?: boolean; indent?: number } = {}) => {
    if (y < CONTENT_Y_BOT + 16) return;
    if (opts.rule) {
      page.drawRectangle({ x: PAD, y: y + 2, width: CONTENT_W, height: 1, color: C.teal });
      y -= 4;
    }
    if (opts.bold) {
      page.drawRectangle({ x: PAD, y: y - 14, width: CONTENT_W, height: 14, color: rgb(0.93, 0.91, 0.87) });
    }
    const f = opts.bold ? boldFont : font;
    const color = opts.muted ? C.midGray : opts.bold ? C.darkBlue : C.darkGray;
    const indent = (opts.indent || 0) * 12;
    page.drawText(safeText(label), { x: labelX + indent, y: y - 10, size: opts.bold ? 9 : 8, font: f, color });
    if (amount !== undefined) {
      const amtColor = amount < 0 ? C.red : opts.bold ? C.darkBlue : C.darkGray;
      page.drawText(fmtCurrency(amount), { x: amtX, y: y - 10, size: opts.bold ? 9 : 8, font: f, color: amtColor });
      page.drawText(pct(amount), { x: pctX, y: y - 10, size: 8, font, color: C.midGray });
    }
    y -= opts.bold ? 16 : 14;
  };

  if (recon.brokerEBITDA !== undefined && recon.brokerEBITDA !== null) {
    drawRow(recon.brokerLabel || "Owner / Broker Stated EBITDA", recon.brokerEBITDA, { bold: true });
    if (recon.reconcilingItems && recon.reconcilingItems.length > 0) {
      page.drawText("Reconciling items (per Shepi GL review):", { x: labelX, y: y - 8, size: 7, font, color: C.midGray });
      y -= 14;
      for (const it of recon.reconcilingItems) {
        drawRow(it.label, it.amount, { indent: 1 });
      }
    }
    drawRow("Shepi Reported EBITDA (per books)", recon.reportedEBITDA, { bold: true, rule: true });
  } else {
    drawRow("Shepi Reported EBITDA (per books)", recon.reportedEBITDA, { bold: true });
  }

  if (recon.adjustments.length > 0) {
    y -= 6;
    page.drawText("Normalizing adjustments:", { x: labelX, y: y - 8, size: 7, font, color: C.midGray });
    y -= 14;
    for (const adj of recon.adjustments) {
      drawRow(adj.label, adj.amount, { indent: 1 });
    }
  }
  drawRow("Shepi Adjusted EBITDA", recon.adjustedEBITDA, { bold: true, rule: true });

  return page;
}

function addSeasonalityPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  monthly: MonthlyRevenuePoint[], pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Income Statement", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Revenue Seasonality & Month-over-Month Trend", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 24;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sumByMonth = new Array(12).fill(0);
  const cntByMonth = new Array(12).fill(0);
  for (const p of monthly) {
    const d = new Date(p.month + (p.month.length === 7 ? "-01" : ""));
    if (isNaN(d.getTime())) continue;
    const m = d.getMonth();
    sumByMonth[m] += p.revenue;
    cntByMonth[m] += 1;
  }
  const avgByMonth = sumByMonth.map((s, i) => cntByMonth[i] > 0 ? s / cntByMonth[i] : 0);
  const annualAvg = avgByMonth.reduce((a, b) => a + b, 0) / 12;

  const chartW = CONTENT_W;
  const chart1H = 180;
  const chart1Top = y;
  const chart1Bottom = chart1Top - chart1H;
  page.drawText("Seasonality - Avg Revenue by Calendar Month", { x: PAD, y: chart1Top - 12, size: 9, font: boldFont, color: C.darkGray });
  const innerTop = chart1Top - 26;
  const innerBottom = chart1Bottom + 18;
  const innerH = innerTop - innerBottom;
  const maxV = Math.max(...avgByMonth, 1);
  const slot = (chartW - 24) / 12;
  const barW = slot * 0.7;

  page.drawLine({ start: { x: PAD + 24, y: innerBottom }, end: { x: PAD + chartW, y: innerBottom }, thickness: 0.5, color: C.midGray });

  const refY = innerBottom + (annualAvg / maxV) * innerH;
  page.drawLine({ start: { x: PAD + 24, y: refY }, end: { x: PAD + chartW, y: refY }, thickness: 0.6, color: C.gold, dashArray: [3, 2] });
  page.drawText(`Annual avg: ${fmtCurrency(annualAvg)}`, { x: PAD + chartW - 130, y: refY + 3, size: 6.5, font, color: C.gold });

  for (let i = 0; i < 12; i++) {
    const v = avgByMonth[i];
    const h = (v / maxV) * innerH;
    const x = PAD + 24 + i * slot + (slot - barW) / 2;
    page.drawRectangle({ x, y: innerBottom, width: barW, height: h, color: C.teal });
    page.drawText(MONTHS[i], { x: x - 2, y: innerBottom - 10, size: 6.5, font, color: C.midGray });
  }

  y = chart1Bottom - 16;

  const chart2H = 160;
  const chart2Top = y;
  const chart2Bottom = chart2Top - chart2H;
  page.drawText("Month-over-Month Revenue Growth (%)", { x: PAD, y: chart2Top - 12, size: 9, font: boldFont, color: C.darkGray });

  const sorted = [...monthly].sort((a, b) => a.month.localeCompare(b.month));
  const mom: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].revenue;
    const cur = sorted[i].revenue;
    mom.push(prev > 0 ? (cur - prev) / prev : 0);
  }
  if (mom.length === 0) {
    page.drawText("Not enough data for MoM analysis.", { x: PAD, y: chart2Top - 30, size: 8, font, color: C.midGray });
    return page;
  }

  const innerTop2 = chart2Top - 22;
  const innerBottom2 = chart2Bottom + 18;
  const innerH2 = innerTop2 - innerBottom2;
  const zeroY = innerBottom2 + innerH2 / 2;
  const maxAbs = Math.max(0.05, ...mom.map(Math.abs));
  const halfH = innerH2 / 2;

  const slot2 = (chartW - 24) / mom.length;
  const barW2 = Math.max(1, slot2 * 0.7);

  page.drawLine({ start: { x: PAD + 24, y: zeroY }, end: { x: PAD + chartW, y: zeroY }, thickness: 0.6, color: C.midGray });

  for (let i = 0; i < mom.length; i++) {
    const v = mom[i];
    const h = Math.abs(v / maxAbs) * halfH;
    const x = PAD + 24 + i * slot2 + (slot2 - barW2) / 2;
    if (v >= 0) {
      page.drawRectangle({ x, y: zeroY, width: barW2, height: h, color: C.teal });
    } else {
      page.drawRectangle({ x, y: zeroY - h, width: barW2, height: h, color: C.red });
    }
  }

  const labelIdxs = mom.length >= 6 ? [0, Math.floor(mom.length / 2), mom.length - 1] : [0, mom.length - 1];
  for (const idx of labelIdxs) {
    const x = PAD + 24 + idx * slot2;
    const lbl = sorted[idx + 1].month;
    page.drawText(lbl, { x, y: innerBottom2 - 10, size: 6, font, color: C.midGray });
  }
  page.drawText(`+${(maxAbs * 100).toFixed(0)}%`, { x: PAD, y: innerTop2 - 4, size: 6, font, color: C.midGray });
  page.drawText(`-${(maxAbs * 100).toFixed(0)}%`, { x: PAD, y: innerBottom2, size: 6, font, color: C.midGray });
  page.drawText("0%", { x: PAD, y: zeroY - 3, size: 6, font, color: C.midGray });

  return page;
}

function addBusinessOverviewPage(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  bo: BusinessOverview, pageNum: number, totalPages: number): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, "Business Overview", meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText("Business Overview", { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  page.drawRectangle({ x: PAD, y: y - 8, width: 50, height: 3, color: C.teal });
  y -= 24;

  const facts: Array<[string, string]> = [];
  if (bo.founded) facts.push(["FOUNDED", bo.founded]);
  if (bo.headquarters) facts.push(["HQ", bo.headquarters]);
  if (bo.employeeCount) facts.push(["EMPLOYEES", bo.employeeCount]);
  if (bo.ownershipType) facts.push(["OWNERSHIP", bo.ownershipType]);
  if (meta.industry) facts.push(["INDUSTRY", meta.industry]);

  if (facts.length > 0) {
    const stripH = 38;
    const cardW = (CONTENT_W - (facts.length - 1) * 6) / facts.length;
    facts.forEach((f, i) => {
      const cx = PAD + i * (cardW + 6);
      page.drawRectangle({ x: cx, y: y - stripH, width: cardW, height: stripH, color: C.offWhite });
      page.drawRectangle({ x: cx, y: y - 3, width: cardW, height: 3, color: C.teal });
      page.drawText(f[0], { x: cx + 8, y: y - 16, size: 6.5, font: boldFont, color: C.midGray });
      page.drawText(truncate(safeText(f[1]), 22), { x: cx + 8, y: y - 30, size: 10, font: boldFont, color: C.darkBlue });
    });
    y -= stripH + 16;
  }

  if (bo.description) {
    page.drawText("About the Business", { x: PAD, y, size: 9, font: boldFont, color: C.teal });
    y -= 14;
    const lines = wrapTextLines(stripMd(bo.description), 130, 8);
    for (const ln of lines) {
      if (y < CONTENT_Y_BOT + 16) break;
      page.drawText(ln, { x: PAD, y, size: 9, font, color: C.darkGray });
      y -= 12;
    }
    y -= 10;
  }

  const colW = (CONTENT_W - 16) / 2;
  const startY = y;
  let leftY = startY;
  let rightY = startY;

  const drawCol = (xStart: number, startYC: number, title: string, items: string[] | undefined, dotColor: ReturnType<typeof rgb>): number => {
    if (!items || items.length === 0) return startYC;
    let yc = startYC;
    page.drawText(title, { x: xStart, y: yc, size: 9, font: boldFont, color: C.darkBlue });
    yc -= 14;
    for (const it of items.slice(0, 6)) {
      if (yc < CONTENT_Y_BOT + 16) break;
      page.drawCircle({ x: xStart + 4, y: yc + 3, size: 1.8, color: dotColor });
      const lns = wrapTextLines(stripMd(it), 60, 2);
      lns.forEach((ln, i) => {
        page.drawText(ln, { x: xStart + 12, y: yc - i * 11, size: 8, font, color: C.darkGray });
      });
      yc -= lns.length * 11 + 4;
    }
    return yc - 8;
  };

  leftY = drawCol(PAD, leftY, "Products & Services", bo.productsServices, C.teal);
  leftY = drawCol(PAD, leftY, "Growth Drivers", bo.growthDrivers, C.green);
  rightY = drawCol(PAD + colW + 16, rightY, "Customer Profile", bo.customerProfile ? [bo.customerProfile] : undefined, C.midBlue);
  rightY = drawCol(PAD + colW + 16, rightY, "Key Risks", bo.keyRisks, C.red);

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

/** Render an AI narrative slide (Kyle-style bullets + bold-label callouts, or AKB-style paragraphs). */
function addNarrativeSlide(doc: PDFDocument, font: PDFFont, boldFont: PDFFont, meta: ReportMeta,
  title: string, narrative: NarrativeContent, pageNum: number, totalPages: number, sectionTitle?: string): PDFPage {
  const page = doc.addPage([PW, PH]);
  drawHeader(page, font, boldFont, sectionTitle || title, meta);
  drawFooter(page, font, meta, pageNum, totalPages);

  let y = CONTENT_Y_TOP - 4;
  page.drawText(`${safeText(title)} - Analyst Commentary`, { x: PAD, y, size: 14, font: boldFont, color: C.darkBlue });
  y -= 8;
  page.drawRectangle({ x: PAD, y: y - 3, width: 36, height: 2.5, color: C.teal });
  y -= 22;

  const maxChars = Math.floor((CONTENT_W - 24) / 4.5);

  // Bullets
  if (narrative.bullets && narrative.bullets.length > 0) {
    for (const b of narrative.bullets) {
      if (y < CONTENT_Y_BOT + 30) break;
      page.drawCircle({ x: PAD + 4, y: y - 4, size: 1.6, color: C.teal });
      const lines = wrapTextLines(stripMd(b), maxChars, 4);
      lines.forEach((ln, i) => {
        page.drawText(ln, { x: PAD + 14, y: y - i * 12, size: 9, font, color: C.darkGray });
      });
      y -= lines.length * 12 + 6;
    }
    y -= 8;
  }

  // Callouts (bold label + body, teal label color like AKB/Kyle)
  if (narrative.callouts && narrative.callouts.length > 0) {
    for (const c of narrative.callouts) {
      if (y < CONTENT_Y_BOT + 36) break;
      const cardH = 36;
      page.drawRectangle({ x: PAD, y: y - cardH, width: CONTENT_W, height: cardH, color: C.offWhite });
      page.drawRectangle({ x: PAD, y: y - cardH, width: 3, height: cardH, color: C.teal });
      page.drawText(safeText(c.label).toUpperCase(), {
        x: PAD + 10, y: y - 14, size: 8.5, font: boldFont, color: C.teal,
      });
      const lines = wrapTextLines(stripMd(c.text), maxChars - 4, 2);
      lines.forEach((ln, i) => {
        page.drawText(ln, { x: PAD + 10, y: y - 24 - i * 11, size: 8.5, font, color: C.darkGray });
      });
      y -= cardH + 6;
    }
    y -= 6;
  }

  // Paragraphs (AKB style: topic / observation / recommendation)
  if (narrative.paragraphs && narrative.paragraphs.length > 0) {
    for (const p of narrative.paragraphs) {
      if (y < CONTENT_Y_BOT + 50) break;
      page.drawText(safeText(p.topic), { x: PAD, y, size: 10.5, font: boldFont, color: C.darkBlue });
      y -= 14;
      const obsLines = wrapTextLines(stripMd(p.observation), maxChars, 8);
      obsLines.forEach((ln, i) => {
        if (y - i * 11 < CONTENT_Y_BOT + 10) return;
        page.drawText(ln, { x: PAD, y: y - i * 11, size: 8.5, font, color: C.darkGray });
      });
      y -= obsLines.length * 11 + 4;
      if (p.recommendation) {
        page.drawText("Recommendation:", { x: PAD, y, size: 8.5, font: boldFont, color: C.teal });
        y -= 12;
        const recLines = wrapTextLines(stripMd(p.recommendation), maxChars, 5);
        recLines.forEach((ln, i) => {
          if (y - i * 11 < CONTENT_Y_BOT + 10) return;
          page.drawText(ln, { x: PAD, y: y - i * 11, size: 8.5, font, color: C.darkGray });
        });
        y -= recLines.length * 11 + 10;
      } else {
        y -= 6;
      }
    }
  }

  return page;
}

export async function buildPDFReport(data: PDFReportData): Promise<Uint8Array> {
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

  // Business Overview (prefer rich intake; fallback to legacy CIM page)
  if (data.businessOverview) {
    pageFns.push({ fn: (pn, tp) => addBusinessOverviewPage(doc, font, boldFont, meta, data.businessOverview!, pn, tp) });
  } else if (data.cimInsights) {
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

  // Helpers to push a narrative page if AI content exists for a slide_key
  const N = (data.narratives || {}) as Record<string, NarrativeContent>;
  const hasNarrative = (k: string) => {
    const n = N[k];
    return !!n && ((n.bullets && n.bullets.length > 0) || (n.callouts && n.callouts.length > 0) || (n.paragraphs && n.paragraphs.length > 0));
  };
  const pushNarrative = (out: Array<{ fn: PageFn; section?: string }>, k: string, title: string, section?: string) => {
    if (!hasNarrative(k)) return;
    out.push({ fn: (pn, tp) => addNarrativeSlide(doc, font, boldFont, meta, title, N[k], pn, tp, section) });
  };

  // Section helper: build a section's pages then conditionally prepend divider.
  type Section = { num: string; title: string; subtitle: string };
  const buildSection = (s: Section, pages: Array<{ fn: PageFn; section?: string }>): { startIndex: number; pushed: boolean } => {
    if (pages.length === 0) return { startIndex: -1, pushed: false };
    const startIndex = pageFns.length;
    pageFns.push({ fn: (pn, tp) => addDividerPage(doc, font, boldFont, meta, s.title, s.subtitle, s.num, pn, tp), section: s.title });
    for (const p of pages) pageFns.push(p);
    return { startIndex, pushed: true };
  };

  // ── Section I: Attention Areas ──
  const attentionPages: Array<{ fn: PageFn; section?: string }> = [];
  if (data.attentionItems && data.attentionItems.length > 0) {
    attentionPages.push({ fn: (pn, tp) => addAttentionAreasPage(doc, font, boldFont, meta, data.attentionItems!, pn, tp) });
    pushNarrative(attentionPages, "attention_areas", "Attention Areas", "Attention Areas");
  }
  const sec1 = buildSection({ num: "I", title: "Attention Areas", subtitle: "Key Findings & Risk Assessment" }, attentionPages);

  // ── Section II: Quality of Earnings ──
  const qoePages: Array<{ fn: PageFn; section?: string }> = [];
  if (data.execSummary && Object.keys(data.execSummary).length > 0) {
    qoePages.push({ fn: (pn, tp) => addExecSummaryPage(doc, font, boldFont, meta, data.execSummary!, pn, tp) });
  }
  if (data.grids.qoeAnalysis) {
    qoePages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "QoE / EBITDA Bridge", data.grids.qoeAnalysis, pn, tp, "Quality of Earnings") });
    pushNarrative(qoePages, "qoe", "QoE / EBITDA Bridge", "Quality of Earnings");
  }
  if (data.plReconciliation) {
    qoePages.push({ fn: (pn, tp) => addPLReconciliationPage(doc, font, boldFont, meta, data.plReconciliation!, pn, tp) });
  }
  if (data.ddAdjustments && data.ddAdjustments.length > 0) {
    qoePages.push({ fn: (pn, tp) => addDDAdjustmentsPage(doc, font, boldFont, meta, data.ddAdjustments!, pn, tp) });
  }
  if (data.grids.ddAdjustments1 && data.grids.ddAdjustments1.rows.length > 0) {
    qoePages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "DD Adjustments - Detail I", data.grids.ddAdjustments1, pn, tp, "Quality of Earnings") });
  }
  if (data.grids.ddAdjustments2 && data.grids.ddAdjustments2.rows.length > 0) {
    qoePages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, "DD Adjustments - Detail II", data.grids.ddAdjustments2, pn, tp, "Quality of Earnings") });
  }
  // Adjustment Traceability Appendix
  const traceAdj = data.traceabilityAdjustments ?? data.ddAdjustments ?? [];
  const traceableItems = traceAdj.filter(a => a.source || a.aiRationale || a.verificationStatus);
  if (traceableItems.length > 0) {
    const ITEMS_PER_PAGE = 3;
    for (let i = 0; i < traceableItems.length; i += ITEMS_PER_PAGE) {
      const chunk = traceableItems.slice(i, i + ITEMS_PER_PAGE);
      qoePages.push({ fn: (pn, tp) => addTraceabilityPage(doc, font, boldFont, meta, chunk, i + 1, traceableItems.length, pn, tp) });
    }
  }
  if (data.financialRatios && data.financialRatios.length > 0) {
    qoePages.push({ fn: (pn, tp) => addFinancialRatiosPage(doc, font, boldFont, meta, data.financialRatios!, pn, tp) });
  }
  const sec2 = buildSection({ num: "II", title: "Quality of Earnings Analysis", subtitle: "EBITDA Bridge & Adjustment Detail" }, qoePages);

  // ── Section III: Income Statement ──
  const isPages: Array<{ fn: PageFn; section?: string }> = [];
  const isGrids = [
    { key: "incomeStatement", title: "Income Statement", narrativeKey: "" },
    { key: "isDetailed", title: "Income Statement - Detailed", narrativeKey: "" },
    { key: "salesDetail", title: "Revenue Detail", narrativeKey: "revenue_detail" },
    { key: "cogsDetail", title: "COGS Detail", narrativeKey: "cogs_detail" },
    { key: "opexDetail", title: "Operating Expenses", narrativeKey: "opex_detail" },
    { key: "otherExpense", title: "Other Expense / Income", narrativeKey: "" },
    { key: "payroll", title: "Payroll Analysis", narrativeKey: "" },
  ];
  for (const g of isGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      isPages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Income Statement") });
      if (g.narrativeKey) pushNarrative(isPages, g.narrativeKey, g.title, "Income Statement");
      // Insert seasonality + MoM right after Revenue Detail
      if (g.key === "salesDetail" && data.monthlyRevenue && data.monthlyRevenue.length >= 6) {
        isPages.push({ fn: (pn, tp) => addSeasonalityPage(doc, font, boldFont, meta, data.monthlyRevenue!, pn, tp) });
      }
    }
  }
  // Fallback: if no salesDetail grid but we have monthly data, still render charts
  if (!data.grids.salesDetail && data.monthlyRevenue && data.monthlyRevenue.length >= 6) {
    isPages.push({ fn: (pn, tp) => addSeasonalityPage(doc, font, boldFont, meta, data.monthlyRevenue!, pn, tp) });
  }
  const sec3 = buildSection({ num: "III", title: "Income Statement Analysis", subtitle: "Revenue, COGS & Operating Expenses" }, isPages);

  // ── Section IV: Balance Sheet ──
  const bsPages: Array<{ fn: PageFn; section?: string }> = [];
  const bsGrids = [
    { key: "balanceSheet", title: "Balance Sheet", narrativeKey: "" },
    { key: "bsDetailed", title: "Balance Sheet - Detailed", narrativeKey: "" },
    { key: "arAging", title: "AR Aging", narrativeKey: "" },
    { key: "apAging", title: "AP Aging", narrativeKey: "" },
    { key: "fixedAssets", title: "Fixed Assets", narrativeKey: "" },
    { key: "workingCapital", title: "Working Capital", narrativeKey: "working_capital" },
    { key: "nwcAnalysis", title: "Net Working Capital Analysis", narrativeKey: "" },
    { key: "freeCashFlow", title: "Free Cash Flow", narrativeKey: "free_cash_flow" },
  ];
  for (const g of bsGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      bsPages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Balance Sheet") });
      if (g.narrativeKey) pushNarrative(bsPages, g.narrativeKey, g.title, "Balance Sheet");
    }
  }
  const sec4 = buildSection({ num: "IV", title: "Balance Sheet Analysis", subtitle: "Assets, Liabilities & Working Capital" }, bsPages);

  // ── Section V: Supplementary ──
  const suppPages: Array<{ fn: PageFn; section?: string }> = [];
  const suppGrids = [
    { key: "proofOfCash", title: "Proof of Cash" },
    { key: "topCustomers", title: "Customer Concentration" },
    { key: "topVendors", title: "Vendor Concentration" },
  ];
  for (const g of suppGrids) {
    if (data.grids[g.key] && data.grids[g.key].rows.length > 0) {
      suppPages.push({ fn: (pn, tp) => addTablePage(doc, font, boldFont, meta, g.title, data.grids[g.key], pn, tp, "Supplementary") });
    }
  }
  const sec5 = buildSection({ num: "V", title: "Supplementary Analysis", subtitle: "Proof of Cash, Concentration & AI Findings" }, suppPages);

  // ── Section VI: AI Analysis (multi-page flagged transactions) ──
  const aiPages: Array<{ fn: PageFn; section?: string }> = [];
  if (data.flaggedItems && data.flaggedItems.length > 0) {
    // Pre-compute how many pages flagged transactions will use (~22 rows + group headers per page)
    // Use a placeholder fn that builds all flagged pages in one shot when invoked.
    // Trick: build them as one fn per "slot" — but we don't know count without rendering.
    // Estimate: up to 50 rows / 22 rows-per-page => 1-3 pages.
    const flaggedCount = Math.min(data.flaggedItems.length, 50);
    const groupCount = new Set(data.flaggedItems.map(i => (i.flag_category || "Other"))).size;
    const estPages = Math.max(1, Math.ceil((flaggedCount + groupCount) / 22));
    for (let pi = 0; pi < estPages; pi++) {
      const slotIdx = pi;
      aiPages.push({
        fn: (pn, tp) => {
          // Only the first slot actually renders; subsequent slots are no-ops if already drawn.
          // But we need a real page object. Workaround: use a closure with a shared rendered flag.
          throw new Error("__flagged_slot_" + slotIdx);
        },
      });
    }
  }
  if ((data.glFindings && data.glFindings.length > 0) || (data.jeFindings && data.jeFindings.length > 0)) {
    aiPages.push({ fn: (pn, tp) => addGLAnalysisPage(doc, font, boldFont, meta, data.glFindings || [], data.jeFindings || [], pn, tp) });
  }
  const sec6 = buildSection({ num: "VI", title: "AI-Powered Analysis", subtitle: "Flagged Transactions & Pattern Detection" }, aiPages);

  // Build TOC sections with page numbers
  const tocSections: Array<{ num: string; title: string; page: number }> = [];
  if (sec1.pushed) tocSections.push({ num: "I", title: "Attention Areas", page: sec1.startIndex + 1 });
  if (sec2.pushed) tocSections.push({ num: "II", title: "Quality of Earnings Analysis", page: sec2.startIndex + 1 });
  if (sec3.pushed) tocSections.push({ num: "III", title: "Income Statement Analysis", page: sec3.startIndex + 1 });
  if (sec4.pushed) tocSections.push({ num: "IV", title: "Balance Sheet Analysis", page: sec4.startIndex + 1 });
  if (sec5.pushed) tocSections.push({ num: "V", title: "Supplementary Analysis", page: sec5.startIndex + 1 });
  if (sec6.pushed) tocSections.push({ num: "VI", title: "AI-Powered Analysis", page: sec6.startIndex + 1 });

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

if (typeof self !== "undefined" && typeof (self as unknown as { postMessage?: unknown }).postMessage === "function") {
  self.onmessage = async (e: MessageEvent) => {
    if (e.data?.type !== "build") return;

    try {
      const reportData = e.data.payload as PDFReportData;
      const pdfBytes = await buildPDFReport(reportData);
      (self as unknown as { postMessage: (msg: unknown, transfer: ArrayBufferLike[]) => void })
        .postMessage({ type: "done", pdf: pdfBytes }, [pdfBytes.buffer]);
    } catch (err) {
      self.postMessage({ type: "error", message: (err as Error).message || "PDF build failed" });
    }
  };
}
