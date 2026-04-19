/**
 * Server-side PDF export edge function.
 * Receives dealData + metadata from client, computes grids, builds PDF with pdf-lib.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildPDFReport } from "../_shared/pdf-builder.ts";
import type { PDFReportData, ReportMeta, AttentionItem, ExecSummary, DDAdjustment, FinancialRatio, FlaggedItem, GLFinding } from "../_shared/pdf-builder.ts";
import type { DealData, TrialBalanceEntry } from "../_shared/workbook/workbook-types.ts";
import * as calc from "../_shared/workbook/calculations.ts";
import * as gridBuilders from "../_shared/workbook/workbook-grid-builders.ts";
import type { GridData } from "../_shared/workbook/workbook-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripMd(s: string): string {
  return s.replace(/\*\*/g, "").replace(/[#>~`_]/g, "").replace(/\s{2,}/g, " ")
    .replace(/[—–−]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}

function extractFindings(data: unknown): GLFinding[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const findings = (d.findings || d.anomalies || d.issues || d.results) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(findings)) return [];
  return findings.slice(0, 10).map((f) => ({
    title: String(f.title || f.name || f.finding || "Finding"),
    description: String(f.description || f.detail || f.explanation || ""),
    severity: String(f.severity || f.priority || "medium"),
    category: String(f.category || f.type || ""),
  }));
}

/** Rebuild DealData from serialized JSON (Maps don't survive JSON) */
function hydrateDealData(raw: Record<string, unknown>): DealData {
  const deal = raw.deal as DealData["deal"];
  // Rehydrate period dates
  if (deal.periods) {
    for (const p of deal.periods) {
      if (typeof p.date === "string") p.date = new Date(p.date);
    }
  }
  if (deal.fiscalYears) {
    for (const fy of deal.fiscalYears) {
      for (const p of fy.periods) {
        if (typeof p.date === "string") p.date = new Date(p.date);
      }
    }
  }

  const tb = (raw.trialBalance || []) as TrialBalanceEntry[];
  const tbIndex = calc.buildTbIndex(tb);

  return {
    deal,
    accounts: (raw.accounts || []) as DealData["accounts"],
    trialBalance: tb,
    adjustments: (raw.adjustments || []) as DealData["adjustments"],
    reclassifications: (raw.reclassifications || []) as DealData["reclassifications"],
    tbIndex,
    monthDates: ((raw.monthDates || []) as string[]).map(d => new Date(d)),
    arAging: (raw.arAging || {}) as DealData["arAging"],
    apAging: (raw.apAging || {}) as DealData["apAging"],
    fixedAssets: (raw.fixedAssets || []) as DealData["fixedAssets"],
    topCustomers: (raw.topCustomers || {}) as DealData["topCustomers"],
    topVendors: (raw.topVendors || {}) as DealData["topVendors"],
    addbacks: (raw.addbacks || {}) as DealData["addbacks"],
    supplementary: raw.supplementary as DealData["supplementary"],
  };
}

/** Compute executive summary KPIs */
function computeExecSummary(dealData: DealData): ExecSummary {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const activePeriods = dealData.deal.periods.filter(p => !p.isStub);
  if (activePeriods.length === 0 || tb.length === 0) return {};

  const ltmPids = activePeriods.slice(-12).map(p => p.id);
  const revenue = -ltmPids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0);
  const grossProfit = -ltmPids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0);
  const netIncome = -ltmPids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0);
  const reportedEBITDA = -ltmPids.reduce((s, p) => s + calc.calcReportedEBITDA(tb, p, ab), 0);
  const totalAdjustments = -ltmPids.reduce((s, p) => s + calc.calcAdjustmentTotal(adj, "all", p), 0);
  const adjustedEBITDA = -ltmPids.reduce((s, p) => s + calc.calcAdjustedEBITDA(tb, adj, p, ab), 0);

  const adjEntries = Array.isArray(adj) ? adj : Object.values(adj);
  let adjustmentCount = adjEntries.filter((a: unknown) => {
    if (!a) return false;
    const entry = a as Record<string, unknown>;
    const pv = (entry.periodValues || entry.proposed_period_values || entry.amounts || {}) as Record<string, number>;
    const total = Object.values(pv).reduce((s: number, v) => s + (typeof v === "number" ? v : 0), 0);
    return total !== 0;
  }).length;

  if (adjustmentCount === 0 && totalAdjustments !== 0) adjustmentCount = -1;

  return { revenue, grossProfit, netIncome, reportedEBITDA, totalAdjustments, adjustedEBITDA, adjustmentCount };
}

/** Build DD adjustments list */
function buildDDAdjustments(dealData: DealData): DDAdjustment[] {
  const adjustments = dealData.adjustments || {};
  const items: DDAdjustment[] = [];
  const entries = Array.isArray(adjustments) ? adjustments : Object.values(adjustments);

  for (const adj of entries) {
    if (!adj) continue;
    const a = adj as Record<string, unknown>;
    const pv = (a.periodValues || a.proposed_period_values || a.amounts || {}) as Record<string, number>;
    const total = Object.values(pv).reduce((s: number, v) => s + (typeof v === "number" ? v : 0), 0);
    const hasAmount = total !== 0;
    const hasDescription = !!((a.description as string)?.trim());
    if (!hasAmount && !hasDescription) continue;
    const title = (a.title as string) || (a.description as string) || (a.label as string) || "";
    const isUUID = /^[0-9a-f]{8}-/i.test(title) || !title.trim();

    items.push({
      title: isUUID ? "Untitled Adjustment" : title,
      description: (a.description as string) || (a.notes as string) || "",
      block: (a.block as string) || (a.type as string) || "DD",
      adjustmentClass: (a.adjustmentClass as string) || (a.adjustment_class as string) || "",
      amount: total,
      status: (a.status as string) || "accepted",
    });
  }
  return items;
}

/** Compute financial ratios */
function computeRatios(dealData: DealData): FinancialRatio[] {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const activePeriods = dealData.deal.periods.filter(p => !p.isStub);
  if (activePeriods.length === 0 || tb.length === 0) return [];

  const ltmPids = activePeriods.slice(-12).map(p => p.id);
  const lastPid = activePeriods[activePeriods.length - 1].id;
  const revenue = -ltmPids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0);
  const grossProfit = -ltmPids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0);
  const opIncome = -ltmPids.reduce((s, p) => s + calc.calcOperatingIncome(tb, p), 0);
  const netIncome = -ltmPids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0);
  const adjustedEBITDA = -ltmPids.reduce((s, p) => s + calc.calcAdjustedEBITDA(tb, adj, p, ab), 0);
  const totalAssets = calc.calcTotalAssets(tb, lastPid);
  const totalEquity = calc.calcTotalEquity(tb, lastPid);
  const currentAssets = calc.calcTotalCurrentAssets(tb, lastPid);
  const currentLiab = calc.calcTotalCurrentLiabilities(tb, lastPid);
  const totalLiab = calc.calcTotalLiabilities(tb, lastPid);
  const ar = calc.sumByLineItem(tb, "Accounts receivable", lastPid);
  const ap = calc.sumByLineItem(tb, "Accounts payable", lastPid);

  const fmtPct = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${(n * 100).toFixed(1)}%`;
  const fmtX = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${n.toFixed(2)}x`;
  const fmtDays = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${Math.round(n)} days`;

  const ratios: FinancialRatio[] = [];
  ratios.push({ name: "Gross Margin", value: fmtPct(revenue > 0 ? grossProfit / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "Operating Margin", value: fmtPct(revenue > 0 ? opIncome / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "EBITDA Margin", value: fmtPct(revenue > 0 ? adjustedEBITDA / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "Net Profit Margin", value: fmtPct(revenue > 0 ? netIncome / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "ROA", value: fmtPct(totalAssets > 0 ? netIncome / totalAssets : NaN), category: "Profitability" });
  ratios.push({ name: "ROE", value: fmtPct(Math.abs(totalEquity) > 0 ? netIncome / Math.abs(totalEquity) : NaN), category: "Profitability" });
  const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : NaN;
  ratios.push({ name: "Current Ratio", value: fmtX(currentRatio), category: "Liquidity" });
  const dso = revenue > 0 ? (Math.abs(ar) / revenue) * 365 : NaN;
  const cogs = ltmPids.reduce((s, p) => s + calc.calcCOGS(tb, p), 0);
  const dpo = cogs > 1000 ? (Math.abs(ap) / cogs) * 365 : NaN;
  ratios.push({ name: "DSO", value: fmtDays(dso), category: "Efficiency" });
  ratios.push({ name: "DPO", value: fmtDays(dpo), category: "Efficiency" });
  ratios.push({ name: "Asset Turnover", value: fmtX(totalAssets > 0 ? revenue / totalAssets : NaN), category: "Efficiency" });
  ratios.push({ name: "Debt/Equity", value: fmtX(Math.abs(totalEquity) > 0 ? Math.abs(totalLiab) / Math.abs(totalEquity) : NaN), category: "Leverage" });

  return ratios;
}

/** Safely build a grid, returning null on error */
function safeGrid(fn: () => GridData): GridData | null {
  try {
    const g = fn();
    if (!g || !g.rows || g.rows.length === 0) return null;
    return g;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { metadata, dealDataJson, projectId } = body as {
      metadata: ReportMeta;
      dealDataJson: Record<string, unknown>;
      projectId: string;
    };

    if (!metadata || !dealDataJson) {
      return new Response(JSON.stringify({ error: "Missing metadata or dealDataJson" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hydrate deal data (rebuild Maps, parse dates)
    const dealData = hydrateDealData(dealDataJson);

    // Fetch supplementary data from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let attentionItems: AttentionItem[] = [];
    let flaggedItems: FlaggedItem[] = [];
    let glFindings: GLFinding[] = [];
    let jeFindings: GLFinding[] = [];

    if (projectId) {
      const [
        { data: hypotheses },
        { data: proposals },
        { data: flagged },
        { data: glData },
        { data: jeData },
      ] = await Promise.all([
        supabase.from("hypotheses")
          .select("hypothesis_claim, category, severity, status, estimated_ebitda_impact")
          .eq("project_id", projectId).in("status", ["proposed", "confirmed"])
          .order("estimated_ebitda_impact", { ascending: true }).limit(6),
        supabase.from("adjustment_proposals")
          .select("title, description, review_priority, block, status")
          .eq("project_id", projectId).in("status", ["new", "accepted"])
          .order("internal_score", { ascending: false }).limit(10),
        supabase.from("flagged_transactions")
          .select("description, account_name, amount, flag_type, flag_category, confidence_score, transaction_date")
          .eq("project_id", projectId).order("confidence_score", { ascending: false }).limit(20),
        supabase.from("processed_data")
          .select("data").eq("project_id", projectId).eq("data_type", "gl_analysis").maybeSingle(),
        supabase.from("processed_data")
          .select("data").eq("project_id", projectId).eq("data_type", "je_analysis").maybeSingle(),
      ]);

      // Build attention items
      const categoryRationale: Record<string, string> = {
        revenue: "Revenue adjustments directly affect top-line earnings and normalized EBITDA.",
        expense: "Expense normalization impacts reported margins and go-forward cost structure.",
        compensation: "Compensation adjustments reflect the difference between current and market-rate staffing costs.",
        "related-party": "Non-arm's-length terms may not persist post-transaction, affecting normalized earnings.",
        "working-capital": "Abnormal working capital levels create peg adjustments that affect enterprise value.",
      };
      const blockFollowUp: Record<string, string> = {
        dd: "Requires independent verification with supporting documentation.",
        ma: "Confirm assumptions and rationale with management.",
        qoe: "Validate against source financial records and general ledger.",
      };

      for (const h of hypotheses || []) {
        const cat = (h.category || "").toLowerCase();
        attentionItems.push({
          title: stripMd(h.hypothesis_claim || h.category || "Finding"),
          severity: h.severity === "high" ? "high" : h.severity === "medium" ? "medium" : "low",
          ebitdaImpact: h.estimated_ebitda_impact ?? undefined,
          rationale: categoryRationale[cat] || "This finding may affect reported EBITDA and warrants further analysis.",
          followUp: "Validate with supporting documentation and confirm with management.",
        });
      }

      // Inject persisted WIP analysis findings from dealData
      const wipFindings = (dealDataJson?.wipAnalysis as { findings?: Array<{ category: string; severity: "high" | "medium" | "low"; title: string; narrative: string; estimatedImpact: number }> } | undefined)?.findings ?? [];
      const sevRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const sortedWip = [...wipFindings].sort((a, b) => {
        const s = (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3);
        return s !== 0 ? s : Math.abs(b.estimatedImpact || 0) - Math.abs(a.estimatedImpact || 0);
      });
      for (const w of sortedWip) {
        if (attentionItems.length >= 6) break;
        attentionItems.push({
          title: stripMd(w.title),
          severity: w.severity,
          ebitdaImpact: w.estimatedImpact || undefined,
          rationale: stripMd(w.narrative).substring(0, 200),
          followUp: "Confirm with project controller and reconcile to mapped TB balances.",
        });
      }

      for (const p of proposals || []) {
        if (attentionItems.length >= 6) break;
        const block = (p.block || "").toLowerCase();
        attentionItems.push({
          title: stripMd(p.title),
          description: stripMd((p.description || "").substring(0, 140)),
          rationale: p.description ? stripMd(p.description.substring(0, 140)) : undefined,
          followUp: blockFollowUp[block] || "Review supporting detail and confirm adjustment basis.",
          severity: p.review_priority === "high" ? "high" : p.review_priority === "low" ? "low" : "medium",
        });
      }

      flaggedItems = (flagged || []) as FlaggedItem[];
      glFindings = extractFindings(glData?.data);
      jeFindings = extractFindings(jeData?.data);
    }

    // Compute grids from deal data
    const grids: Record<string, GridData> = {};

    const gridMap: Array<{ key: string; fn: () => GridData }> = [
      { key: "qoeAnalysis", fn: () => gridBuilders.buildQoEAnalysisGrid(dealData) },
      { key: "incomeStatement", fn: () => gridBuilders.buildIncomeStatementGrid(dealData) },
      { key: "isDetailed", fn: () => gridBuilders.buildISDetailedGrid(dealData) },
      { key: "salesDetail", fn: () => gridBuilders.buildSalesGrid(dealData) },
      { key: "cogsDetail", fn: () => gridBuilders.buildCOGSGrid(dealData) },
      { key: "opexDetail", fn: () => gridBuilders.buildOpExGrid(dealData) },
      { key: "otherExpense", fn: () => gridBuilders.buildOtherExpenseGrid(dealData) },
      { key: "payroll", fn: () => gridBuilders.buildPayrollGrid(dealData) },
      { key: "balanceSheet", fn: () => gridBuilders.buildBalanceSheetGrid(dealData) },
      { key: "bsDetailed", fn: () => gridBuilders.buildBSDetailedGrid(dealData) },
      { key: "arAging", fn: () => gridBuilders.buildARAgingGrid(dealData) },
      { key: "apAging", fn: () => gridBuilders.buildAPAgingGrid(dealData) },
      { key: "fixedAssets", fn: () => gridBuilders.buildFixedAssetsGrid(dealData) },
      { key: "workingCapital", fn: () => gridBuilders.buildWorkingCapitalGrid(dealData) },
      { key: "nwcAnalysis", fn: () => gridBuilders.buildNWCAnalysisGrid(dealData) },
      { key: "freeCashFlow", fn: () => gridBuilders.buildFreeCashFlowGrid(dealData) },
      { key: "proofOfCash", fn: () => gridBuilders.buildProofOfCashGrid(dealData) },
      { key: "topCustomers", fn: () => gridBuilders.buildTopCustomersGrid(dealData) },
      { key: "topVendors", fn: () => gridBuilders.buildTopVendorsGrid(dealData) },
    ];

    for (const { key, fn } of gridMap) {
      const g = safeGrid(fn);
      if (g) grids[key] = g;
    }

    // Build PDF
    const reportData: PDFReportData = {
      metadata,
      attentionItems: attentionItems.length > 0 ? attentionItems : undefined,
      execSummary: computeExecSummary(dealData),
      ddAdjustments: buildDDAdjustments(dealData),
      financialRatios: computeRatios(dealData),
      flaggedItems: flaggedItems.length > 0 ? flaggedItems : undefined,
      glFindings: glFindings.length > 0 ? glFindings : undefined,
      jeFindings: jeFindings.length > 0 ? jeFindings : undefined,
      grids,
    };

    const pdfBytes = await buildPDFReport(reportData);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${metadata.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_QoE_Report.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return new Response(JSON.stringify({ error: err.message || "PDF generation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
