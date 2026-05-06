/**
 * Generate the static demo QoE PDF used by the Export Center preview dialog.
 *
 * Uses the REAL pdf-lib report builder (`buildPDFReport`) + mock deal data,
 * so structurally the demo file matches the post-signup deliverable. After
 * the report is built, every page is overlaid with a faint "DEMO — NOT FOR
 * DISTRIBUTION" diagonal watermark.
 *
 * Run: bun run scripts/generate-demo-pdf.ts
 * Output: public/demo/acme-sample-qoe.pdf
 */
import "./_preload-browser-shims";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import { createMockDealData } from "../src/lib/mockDeal";
import { TAB_GRID_BUILDERS } from "../src/lib/workbook-grid-builders";
import { computeQoEMetrics } from "../src/lib/qoeMetrics";
import * as calc from "../src/lib/calculations";
import * as rh from "../src/lib/reclassHelpers";
import { buildPDFReport, type PDFReportData, type ReportMeta, type ExecSummary, type DDAdjustment, type FinancialRatio, type AttentionItem, type FlaggedItem, type GLFinding } from "../src/lib/pdf/pdfWorker";
import { buildMonthlyRevenue, buildPLReconciliation } from "../src/lib/pdf/exportNormalize";
import { NARRATIVE_SLIDES, serializeGrid, serializeAttentionItems, type NarrativeContent } from "../src/lib/pdf/narratives";
import type { GridData, DealData } from "../src/lib/workbook-types";

const OUT = resolve("public/demo/acme-sample-qoe.pdf");

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "$" + abs.toFixed(0);
  return n < 0 ? `(${formatted})` : formatted;
}

function buildExecSummary(dealData: DealData): ExecSummary {
  const m = computeQoEMetrics(dealData);
  return {
    revenue: m.revenue,
    grossProfit: m.grossProfit,
    netIncome: m.netIncome,
    reportedEBITDA: m.reportedEBITDA,
    totalAdjustments: m.totalAdjustments,
    adjustedEBITDA: m.adjustedEBITDA,
    adjustmentCount: m.adjustmentCount,
  };
}

function buildDDAdjustments(dealData: DealData): DDAdjustment[] {
  const adjustments = dealData.adjustments || [];
  const entries = Array.isArray(adjustments) ? adjustments : Object.values(adjustments);
  const items: DDAdjustment[] = [];
  for (const adj of entries) {
    if (!adj) continue;
    const a = adj as Record<string, unknown>;
    const pv = (a.periodValues || a.proposed_period_values || a.amounts || {}) as Record<string, number>;
    const total = Object.values(pv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    if (total === 0) continue;
    const title = (a.title as string) || (a.description as string) || (a.label as string) || "Untitled Adjustment";
    items.push({
      title,
      description: (a.description as string) || `${title} — ${fmtCurrency(total)}`,
      block: (a.block as string) || (a.type as string) || "DD",
      adjustmentClass: (a.adjustmentClass as string) || (a.adjustment_class as string) || "",
      amount: total,
      status: (a.status as string) || "accepted",
      source: (a.type as string) === "MA" ? "manual" : "ai_discovery",
    });
  }
  return items;
}

function buildRatios(dealData: DealData): FinancialRatio[] {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const periods = dealData.deal.periods.filter((p) => !p.isStub);
  if (periods.length === 0 || tb.length === 0) return [];

  const ltm = periods.slice(-12).map((p) => p.id);
  const last = periods[periods.length - 1].id;
  const rc = dealData.reclassifications ?? [];
  const revenue = rh.reclassAwareRevenue(tb, rc, ltm);
  const grossProfit = rh.reclassAwareGrossProfit(tb, rc, ltm);
  const opIncome = rh.reclassAwareOperatingIncome(tb, rc, ltm);
  const netIncome = rh.reclassAwareNetIncome(tb, rc, ltm);
  const adjEBITDA = rh.reclassAwareAdjustedEBITDA(tb, rc, adj, ltm, ab);
  const totalAssets = calc.calcTotalAssets(tb, last);
  const totalEquity = calc.calcTotalEquity(tb, last);
  const currentAssets = calc.calcTotalCurrentAssets(tb, last);
  const currentLiab = calc.calcTotalCurrentLiabilities(tb, last);
  const totalLiab = calc.calcTotalLiabilities(tb, last);
  const ar = calc.sumByLineItem(tb, "Accounts receivable", last);
  const ap = calc.sumByLineItem(tb, "Accounts payable", last);

  const fmtPct = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${(n * 100).toFixed(1)}%`;
  const fmtX = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${n.toFixed(2)}x`;
  const fmtDays = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${Math.round(n)} days`;

  const out: FinancialRatio[] = [];
  out.push({ name: "Gross Margin", value: fmtPct(revenue > 0 ? grossProfit / revenue : NaN), category: "Profitability" });
  out.push({ name: "Operating Margin", value: fmtPct(revenue > 0 ? opIncome / revenue : NaN), category: "Profitability" });
  out.push({ name: "EBITDA Margin", value: fmtPct(revenue > 0 ? adjEBITDA / revenue : NaN), category: "Profitability" });
  out.push({ name: "Net Profit Margin", value: fmtPct(revenue > 0 ? netIncome / revenue : NaN), category: "Profitability" });
  out.push({ name: "ROA", value: fmtPct(totalAssets > 0 ? netIncome / totalAssets : NaN), category: "Profitability" });
  out.push({ name: "ROE", value: fmtPct(Math.abs(totalEquity) > 0 ? netIncome / Math.abs(totalEquity) : NaN), category: "Profitability" });
  out.push({ name: "Current Ratio", value: fmtX(Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : NaN), category: "Liquidity" });
  const dso = revenue > 0 ? (Math.abs(ar) / revenue) * 365 : NaN;
  const cogs = ltm.reduce((s, p) => s + calc.calcCOGS(tb, p), 0);
  const dpo = cogs > 1000 ? (Math.abs(ap) / cogs) * 365 : NaN;
  out.push({ name: "DSO", value: fmtDays(dso), category: "Efficiency" });
  out.push({ name: "DPO", value: fmtDays(dpo), category: "Efficiency" });
  out.push({ name: "Asset Turnover", value: fmtX(totalAssets > 0 ? revenue / totalAssets : NaN), category: "Efficiency" });
  out.push({ name: "Debt/Equity", value: fmtX(Math.abs(totalEquity) > 0 ? Math.abs(totalLiab) / Math.abs(totalEquity) : NaN), category: "Leverage" });
  return out;
}

function buildAttentionItems(dealData: DealData): AttentionItem[] {
  const items: AttentionItem[] = [];
  const dd = buildDDAdjustments(dealData);
  for (const a of dd.slice(0, 4)) {
    items.push({
      title: a.title,
      description: a.description,
      severity: Math.abs(a.amount || 0) > 100000 ? "high" : "medium",
      ebitdaImpact: a.amount,
      followUp: "Review supporting documentation and confirm classification with management.",
    });
  }
  return items;
}

function buildFlaggedItems(): FlaggedItem[] {
  return [
    { description: "Owner personal expense — golf club membership", account_name: "Travel & Entertainment", amount: 8500, flag_type: "adjustment_candidate", flag_category: "adjustment_candidate", confidence_score: 0.92, transaction_date: "2024-06-15" },
    { description: "Related-party rent payment above market", account_name: "Rent Expense", amount: 24000, flag_type: "related_party", flag_category: "adjustment_candidate", confidence_score: 0.88, transaction_date: "2024-09-01" },
    { description: "One-time legal settlement", account_name: "Legal & Professional Fees", amount: 45000, flag_type: "adjustment_candidate", flag_category: "adjustment_candidate", confidence_score: 0.95, transaction_date: "2024-03-22" },
    { description: "Unusual round-dollar journal entry", account_name: "Other Income", amount: 50000, flag_type: "unusual_transaction", flag_category: "risk_flag", confidence_score: 0.81, transaction_date: "2024-12-31" },
  ];
}

function buildGLFindings(): GLFinding[] {
  return [
    { title: "Manual journal entries concentrated near period-end", description: "12 manual entries totaling $187K were posted in the final 5 days of Q4 2024, materially above the trailing-period average.", severity: "medium", category: "Period-End Activity" },
    { title: "Round-dollar transactions above threshold", description: "9 transactions of exactly $10,000 or $25,000 were identified across operating expense accounts. Review supporting documentation.", severity: "low", category: "Pattern Detection" },
    { title: "Reversing entries lacking documentation", description: "3 reversing journal entries totaling $62K had no narrative or attached support.", severity: "medium", category: "Documentation Gap" },
  ];
}

async function applyWatermark(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = "DEMO  ·  NOT FOR DISTRIBUTION";
  const fontSize = 28;
  const color = rgb(0.78, 0.78, 0.82);
  const opacity = 0.18;

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    // Tile at 30deg across the page
    for (let y = -200; y < height + 200; y += 130) {
      for (let x = -200; x < width + 200; x += 380) {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(30),
        });
      }
    }
  }
  return await doc.save();
}

async function fetchNarratives(
  grids: Record<string, GridData>,
  attentionItems: AttentionItem[],
): Promise<Record<string, NarrativeContent>> {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !ANON_KEY) {
    console.warn("  ! SUPABASE_URL or anon key missing — skipping narratives");
    return {};
  }

  const out: Record<string, NarrativeContent> = {};
  for (const slide of NARRATIVE_SLIDES) {
    let rawData = "";
    if (slide.key === "attention_areas") {
      rawData = serializeAttentionItems(attentionItems);
    } else if (slide.gridKeys) {
      rawData = slide.gridKeys
        .map((k) => serializeGrid(k, grids[k]))
        .filter(Boolean)
        .join("\n\n");
    }
    if (!rawData) {
      console.log(`  · ${slide.key}: no source data, skipping`);
      continue;
    }
    try {
      console.log(`  · narrating ${slide.key}...`);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-narrative`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ANON_KEY}`,
          "apikey": ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "00000000-0000-0000-0000-000000000000",
          slideKey: slide.key,
          slideTitle: slide.title,
          rawData,
          style: slide.style,
          skipPersist: true,
        }),
      });
      if (!res.ok) {
        console.warn(`    ! ${slide.key} ${res.status}: ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const json = await res.json() as { content: NarrativeContent };
      out[slide.key] = json.content;
    } catch (err) {
      console.warn(`    ! ${slide.key} threw:`, (err as Error).message);
    }
  }
  return out;
}

async function main() {
  mkdirSync(resolve("public/demo"), { recursive: true });
  const dealData = createMockDealData();

  const grids: Record<string, GridData> = {};
  for (const [tabId, builder] of Object.entries(TAB_GRID_BUILDERS)) {
    if (tabId === "proof-of-cash" || tabId === "data-sources") continue;
    try {
      grids[tabId] = builder(dealData);
    } catch (err) {
      console.warn(`  ! grid "${tabId}":`, (err as Error).message);
      grids[tabId] = { columns: [], rows: [], frozenColumns: 0 };
    }
  }

  const metadata: ReportMeta = {
    companyName: "Acme Industrial Supply Co.",
    projectName: "Acme QoE — Demo Preview",
    clientName: "Sample Buyer LP",
    industry: "Industrial Distribution",
    transactionType: "Buy-Side Quality of Earnings",
    reportDate: "12.31.2024",
    fiscalYearEnd: "December",
    serviceTier: "diy",
  };

  const attentionItems = buildAttentionItems(dealData);
  const narratives = await fetchNarratives(grids, attentionItems);

  const reportData: PDFReportData = {
    metadata,
    attentionItems,
    execSummary: buildExecSummary(dealData),
    ddAdjustments: buildDDAdjustments(dealData),
    financialRatios: buildRatios(dealData),
    flaggedItems: buildFlaggedItems(),
    glFindings: buildGLFindings(),
    jeFindings: [],
    grids,
    narratives,
    monthlyRevenue: buildMonthlyRevenue(dealData),
    plReconciliation: buildPLReconciliation(dealData),
    businessOverview: {
      description: "Acme Industrial Supply Co. is a regional distributor of MRO (maintenance, repair, operations) consumables, fasteners, and safety equipment serving manufacturing and construction customers across the Midwest. Founded in 2008, the company operates from a single 60,000 sq ft warehouse with a fleet of 12 delivery vehicles and a counter-sales showroom.",
      productsServices: [
        "Industrial fasteners & hardware (38% of revenue)",
        "Safety equipment & PPE (24%)",
        "MRO consumables — adhesives, lubricants, abrasives (22%)",
        "Cutting tools & abrasives (16%)",
      ],
      customerProfile: "B2B only. ~340 active accounts; top 10 customers represent 31% of revenue. Average order $1,850. Net 30 terms standard.",
      growthDrivers: [
        "Reshoring of manufacturing in primary metro markets",
        "Vendor-managed inventory program with three top-10 accounts",
        "E-commerce launch (2024) currently 4% of orders, growing 12% MoM",
      ],
      keyRisks: [
        "Customer concentration: largest account 8.4% of revenue",
        "One key salesperson controls ~22% of book; no formal non-compete",
        "Inventory turns at 4.1x vs. industry median 5.8x",
      ],
      founded: "2008",
      headquarters: "Cleveland, OH",
      employeeCount: "47 FTE",
      ownershipType: "S-Corporation, single owner",
    },
  };

  console.log("Building report from real pdf-lib pipeline...");
  const baseBytes = await buildPDFReport(reportData);
  console.log(`  ✓ ${baseBytes.byteLength.toLocaleString()} bytes`);

  console.log("Overlaying demo watermark...");
  const finalBytes = await applyWatermark(baseBytes);

  writeFileSync(OUT, finalBytes);
  console.log(`✓ ${OUT}  (${finalBytes.byteLength.toLocaleString()} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
