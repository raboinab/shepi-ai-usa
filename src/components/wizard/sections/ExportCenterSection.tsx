import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Download, FileSpreadsheet, Share2, ArrowRight, PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getExportReadiness } from "@/lib/dataCompleteness";
import { exportWorkbookXlsx } from "@/lib/exportWorkbookXlsx";
import { buildClientPDF } from "@/lib/pdf/buildClientPDF";
import type { PDFReportData, ReportMeta, AttentionItem, ExecSummary, DDAdjustment, FinancialRatio, FlaggedItem, GLFinding, CIMInsights } from "@/lib/pdf/pdfWorker";
import type { WizardReportData } from "@/lib/wizardReportBuilder";
import type { DealData } from "@/lib/workbook-types";
import type { GridData } from "@/lib/workbook-types";
import { supabase } from "@/integrations/supabase/client";
import * as calc from "@/lib/calculations";
import * as rh from "@/lib/reclassHelpers";
import { computeQoEMetrics } from "@/lib/qoeMetrics";
import * as gridBuilders from "@/lib/workbook-grid-builders";
import { trackEvent } from "@/lib/analytics";


interface ExportCenterData {
  completedSections: string[];
  notes: string;
}

interface ExportCenterSectionProps {
  data: ExportCenterData;
  updateData: (data: ExportCenterData) => void;
  wizardData: Record<string, unknown>;
  projectId?: string;
  projectName?: string;
  computedReports?: Record<string, WizardReportData>;
  dealData?: DealData;
  onNavigateToInsights?: () => void;
  isDemo?: boolean;
}

function stripMd(s: string): string {
  return s.replace(/\*\*/g, "").replace(/[#>~`_]/g, "").replace(/\s{2,}/g, " ")
    .replace(/[—–−]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}

/**
 * Strip markdown field-value metadata blocks and internal system text
 * from proposal descriptions to extract only human-readable narrative.
 */
function cleanProposalDescription(desc: string): string {
  if (!desc) return "";
  // Remove lines like "**Category:** value", "**Direction:** value", etc.
  let cleaned = desc.replace(/\*\*[A-Za-z\s/&]+:\*\*\s*[^\n]*/g, "");
  // Remove "Verification:" lines (internal QA metadata)
  cleaned = cleaned.replace(/Verification:.*$/gm, "");
  // Remove "Category:" "Direction:" "Reported GL Amount:" without markdown
  cleaned = cleaned.replace(/^(Category|Direction|Reported GL Amount|Proposed Adjustment|Evidence Strength|Review Priority|Adjustment Class|Block|Status|Score|Intent|Template):.*$/gim, "");
  // Remove leftover markdown artifacts
  cleaned = stripMd(cleaned);
  // Collapse whitespace
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}

/**
 * Map internal flag_type snake_case tags to human-readable labels.
 */
function humanizeFlagType(flagType: string): string {
  const map: Record<string, string> = {
    reclass_interest_in_opex: "Interest Reclassification",
    reclass_cogs_opex_boundary: "COGS / OpEx Classification",
    reclass_current_vs_noncurrent: "Current vs. Non-Current Classification",
    reclass_debt_classification: "Debt Classification",
    reclass_gain_loss_in_revenue: "Gain/Loss in Revenue",
    reclass_other: "Other Reclassification",
    adjustment_candidate: "Adjustment Candidate",
    unusual_transaction: "Unusual Transaction",
    related_party: "Related-Party Transaction",
    timing_issue: "Timing Issue",
  };
  if (map[flagType]) return map[flagType];
  // Fallback: title-case the snake_case string
  return flagType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Map internal flag_category to human-readable label.
 */
function humanizeFlagCategory(cat: string): string {
  const map: Record<string, string> = {
    adjustment_candidate: "Adjustment Candidate",
    reclassification: "Reclassification",
    risk_flag: "Risk Flag",
  };
  if (map[cat]) return map[cat];
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "$" + abs.toFixed(0);
  return n < 0 ? `(${formatted})` : formatted;
}

function safeGrid(fn: () => GridData): GridData | null {
  try {
    const g = fn();
    if (!g || !g.rows || g.rows.length === 0) return null;
    return g;
  } catch {
    return null;
  }
}

function computeExecSummary(dealData: DealData): ExecSummary {
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

function buildDDAdjustments(
  dealData: DealData,
  proofMap?: Map<string, { validation_status: string; validation_score: number | null; key_findings: string[]; red_flags: string[]; matchCount: number }>,
  proposalMap?: Map<string, { source: "ai_discovery" | "manual"; detectorType?: string; supportTier?: number | null; supportTierLabel?: string | null; aiRationale?: string | null; keySignals?: string[] }>,
  evidenceByProposal?: Map<string, Array<{ date: string; description: string; amount: number; matchQuality: string }>>,
): DDAdjustment[] {
  const adjustments = dealData.adjustments || {};
  const items: DDAdjustment[] = [];
  const entries = Array.isArray(adjustments) ? adjustments : Object.values(adjustments);

  for (const adj of entries) {
    if (!adj) continue;
    const a = adj as Record<string, unknown>;
    const adjId = a.id as string;
    const pv = (a.periodValues || a.proposed_period_values || a.amounts || {}) as Record<string, number>;
    const total = Object.values(pv).reduce((s: number, v) => s + (typeof v === "number" ? v : 0), 0);
    if (total === 0) continue;
    const title = (a.title as string) || (a.description as string) || (a.label as string) || "";
    const isUUID = /^[0-9a-f]{8}-/i.test(title) || !title.trim();

    const rawDesc = (a.description as string) || (a.notes as string) || "";
    const cleanedDesc = cleanProposalDescription(rawDesc);

    // Look up traceability data — proofs keyed by adjustment_id, proposals/evidence keyed by title
    const proof = adjId ? proofMap?.get(adjId) : undefined;
    const proposal = title ? proposalMap?.get(title) : undefined;
    const evidence = title ? evidenceByProposal?.get(title) : undefined;

    items.push({
      title: isUUID ? "Untitled Adjustment" : stripMd(title),
      description: cleanedDesc || `${isUUID ? "Adjustment" : stripMd(title)} - ${fmtCurrency(total)}`,
      block: (a.block as string) || (a.type as string) || "DD",
      adjustmentClass: (a.adjustmentClass as string) || (a.adjustment_class as string) || "",
      amount: total,
      status: (a.status as string) || "accepted",
      // Traceability fields
      source: proposal ? proposal.source : ((a.type as string) === "MA" ? "manual" : undefined),
      detectorType: proposal?.detectorType,
      supportTier: proposal?.supportTier,
      supportTierLabel: proposal?.supportTierLabel,
      aiRationale: proposal?.aiRationale,
      keySignals: proposal?.keySignals,
      evidenceTransactions: evidence?.slice(0, 5),
      verificationStatus: proof?.validation_status,
      verificationScore: proof?.validation_score,
      keyFindings: proof?.key_findings,
      redFlags: proof?.red_flags,
    });
  }
  return items;
}

function computeRatios(dealData: DealData): FinancialRatio[] {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const activePeriods = dealData.deal.periods.filter(p => !p.isStub);
  if (activePeriods.length === 0 || tb.length === 0) return [];

  const ltmPids = activePeriods.slice(-12).map(p => p.id);
  const lastPid = activePeriods[activePeriods.length - 1].id;
  const rc = dealData.reclassifications ?? [];
  const revenue = rh.reclassAwareRevenue(tb, rc, ltmPids);
  const grossProfit = rh.reclassAwareGrossProfit(tb, rc, ltmPids);
  const opIncome = rh.reclassAwareOperatingIncome(tb, rc, ltmPids);
  const netIncome = rh.reclassAwareNetIncome(tb, rc, ltmPids);
  const adjustedEBITDA = rh.reclassAwareAdjustedEBITDA(tb, rc, adj, ltmPids, ab);
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

export const ExportCenterSection = ({ data, updateData, wizardData, projectId, projectName, computedReports, dealData, onNavigateToInsights, isDemo }: ExportCenterSectionProps) => {
  const exportData = { completedSections: [], notes: "", ...data };
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ page: 0, total: 0 });

  const { coreStatus, readyCount, totalCore, isReady } = getExportReadiness(wizardData, computedReports);
  const coreDataStatus = coreStatus as Record<string, boolean>;

  const handleExportPDF = async () => {
    if (isDemo) {
      trackEvent("demo_export_blocked", { format: "pdf" });
      toast.info("This is a preview — sign up to export your own QoE report", {
        description: "Create an account to generate PDF and Excel deliverables.",
      });
      return;
    }
    if (isGenerating || !dealData) return;
    trackEvent("workbook_exported", { format: "pdf" });
    setIsGenerating(true);
    setPdfProgress({ page: 0, total: 0 });

    try {
      const now = new Date();
      const reportDate = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${now.getFullYear()}`;
      const resolvedProjectId = projectId || dealData?.deal?.projectId;

      const metadata: ReportMeta = {
        companyName: projectName || "Company",
        projectName: projectName || "Project",
        clientName: (wizardData?.projectSetup as Record<string, unknown>)?.clientName as string || "",
        industry: (wizardData?.projectSetup as Record<string, unknown>)?.industry as string || "",
        transactionType: (wizardData?.projectSetup as Record<string, unknown>)?.transactionType as string || "",
        reportDate,
        fiscalYearEnd: (wizardData?.projectSetup as Record<string, unknown>)?.fiscalYearEnd as string || "December",
      };

      toast.info("Generating PDF report...", { description: "Building in the background — you can keep working." });

      // Fetch supplementary data from DB in parallel
      let attentionItems: AttentionItem[] = [];
      let flaggedItems: FlaggedItem[] = [];
      let glFindings: GLFinding[] = [];
      let jeFindings: GLFinding[] = [];
      let proofMap = new Map<string, { validation_status: string; validation_score: number | null; key_findings: string[]; red_flags: string[]; matchCount: number }>();
      let proposalMap = new Map<string, { source: "ai_discovery" | "manual"; detectorType?: string; supportTier?: number | null; supportTierLabel?: string | null; aiRationale?: string | null; keySignals?: string[] }>();
      let evidenceByProposal = new Map<string, Array<{ date: string; description: string; amount: number; matchQuality: string }>>();

      if (resolvedProjectId) {
        const [
          { data: hypotheses },
          { data: proposals },
          { data: flagged },
          { data: glData },
          { data: jeData },
          { data: payrollData },
        ] = await Promise.all([
          supabase.from("hypotheses")
            .select("hypothesis_claim, category, severity, status, estimated_ebitda_impact")
            .eq("project_id", resolvedProjectId).in("status", ["proposed", "confirmed"])
            .order("estimated_ebitda_impact", { ascending: true }).limit(6),
          supabase.from("adjustment_proposals")
            .select("title, description, review_priority, block, status")
            .eq("project_id", resolvedProjectId).in("status", ["new", "accepted"])
            .order("internal_score", { ascending: false }).limit(10),
          supabase.from("flagged_transactions")
            .select("description, account_name, amount, flag_type, flag_category, confidence_score, transaction_date")
            .eq("project_id", resolvedProjectId).order("confidence_score", { ascending: false }).limit(20),
          supabase.from("processed_data")
            .select("data").eq("project_id", resolvedProjectId).eq("data_type", "gl_analysis").maybeSingle(),
          supabase.from("processed_data")
            .select("data").eq("project_id", resolvedProjectId).eq("data_type", "je_analysis").maybeSingle(),
          supabase.from("processed_data")
            .select("data").eq("project_id", resolvedProjectId).eq("data_type", "payroll").maybeSingle(),
        ]);

        // Fetch traceability data: proofs, accepted proposals with full metadata, and evidence
        const [
          { data: proofRows },
          { data: acceptedProposals },
        ] = await Promise.all([
          supabase.from("adjustment_proofs")
            .select("adjustment_id, validation_status, validation_score, key_findings, red_flags, traceability_data, ai_analysis")
            .eq("project_id", resolvedProjectId),
          supabase.from("adjustment_proposals")
            .select("id, title, description, detector_type, support_tier, support_tier_label, ai_rationale, ai_key_signals, block, adjustment_class, proposed_amount, status")
            .eq("project_id", resolvedProjectId).in("status", ["accepted", "accepted_with_edits"]),
        ]);

        // Build proof map
        for (const r of proofRows ?? []) {
          const ai = (r.ai_analysis as Record<string, unknown>) ?? {};
          const td = (r.traceability_data as Record<string, unknown>) ?? {};
          const matchingTxns = (td.matching_transactions as unknown[]) ?? [];
          proofMap.set(r.adjustment_id, {
            validation_status: r.validation_status,
            validation_score: r.validation_score,
            key_findings: (r.key_findings as string[]) ?? [],
            red_flags: (r.red_flags as string[]) ?? [],
            matchCount: (ai.match_count as number) ?? matchingTxns.length,
          });
        }

        // Build proposal map keyed by title (since accepted proposals become adjustments with title as description)
        const proposalIds: string[] = [];
        const proposalByTitle = new Map<string, (typeof acceptedProposals extends (infer T)[] | null ? T : never)>();
        for (const p of acceptedProposals ?? []) {
          const signals = Array.isArray(p.ai_key_signals) ? (p.ai_key_signals as string[]) : [];
          proposalMap.set(p.title, {
            source: "ai_discovery",
            detectorType: p.detector_type,
            supportTier: p.support_tier,
            supportTierLabel: p.support_tier_label,
            aiRationale: p.ai_rationale,
            keySignals: signals,
          });
          proposalByTitle.set(p.title, p);
          proposalIds.push(p.id);
        }

        // Fetch evidence for accepted proposals
        if (proposalIds.length > 0) {
          const { data: evidenceRows } = await supabase.from("proposal_evidence")
            .select("proposal_id, txn_date, description, amount, match_quality")
            .in("proposal_id", proposalIds)
            .order("amount", { ascending: false })
            .limit(500);
          for (const ev of evidenceRows ?? []) {
            const list = evidenceByProposal.get(ev.proposal_id) ?? [];
            list.push({ date: ev.txn_date ?? "", description: ev.description ?? "", amount: ev.amount ?? 0, matchQuality: ev.match_quality ?? "" });
            evidenceByProposal.set(ev.proposal_id, list);
          }
        }

        // Re-key evidence by title (for matching in buildDDAdjustments)
        const evidenceByTitle = new Map<string, Array<{ date: string; description: string; amount: number; matchQuality: string }>>();
        for (const [proposalId, evList] of evidenceByProposal) {
          const proposal = (acceptedProposals ?? []).find(p => p.id === proposalId);
          if (proposal) evidenceByTitle.set(proposal.title, evList);
        }
        // Replace evidenceByProposal with title-keyed version for buildDDAdjustments
        evidenceByProposal = evidenceByTitle;

        // Inject payroll fallback into dealData if TB payroll is empty
        if (payrollData?.data && dealData) {
          const extracted = (payrollData.data as Record<string, unknown>)?.extractedData as Record<string, unknown> | undefined;
          if (extracted) {
            dealData = {
              ...dealData,
              payrollFallback: {
                salaryWages: (extracted.salaryWages as Array<{ name: string; monthlyValues: Record<string, number> }>) || [],
                ownerCompensation: (extracted.ownerCompensation as Array<{ name: string; monthlyValues: Record<string, number> }>) || [],
                payrollTaxes: (extracted.payrollTaxes as Array<{ name: string; monthlyValues: Record<string, number> }>) || [],
                benefits: (extracted.benefits as Array<{ name: string; monthlyValues: Record<string, number> }>) || [],
              },
            };
          }
        }

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

        // Inject persisted WIP analysis findings (sorted by severity then |impact|)
        const wipFindings = dealData?.wipAnalysis?.findings ?? [];
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
          const cleanedDesc = cleanProposalDescription(p.description || "");
          const narrativeDesc = cleanedDesc || `Adjustment identified for review: ${stripMd(p.title)}`;
          attentionItems.push({
            title: stripMd(p.title),
            description: narrativeDesc.substring(0, 140),
            rationale: narrativeDesc.substring(0, 140),
            followUp: blockFollowUp[block] || "Review supporting detail and confirm adjustment basis.",
            severity: p.review_priority === "high" ? "high" : p.review_priority === "low" ? "low" : "medium",
          });
        }

        flaggedItems = (flagged || []).map((f: Record<string, unknown>) => ({
          ...f,
          flag_type: humanizeFlagType(String(f.flag_type || "")),
          flag_category: humanizeFlagCategory(String(f.flag_category || "")),
        })) as FlaggedItem[];
        glFindings = extractFindings(glData?.data);
        jeFindings = extractFindings(jeData?.data);
      }

      // Build grids client-side
      const grids: Record<string, GridData> = {};
      const gridMap: Array<{ key: string; fn: () => GridData }> = [
        { key: "qoeAnalysis", fn: () => gridBuilders.buildQoEAnalysisGrid(dealData) },
        { key: "ddAdjustments1", fn: () => gridBuilders.buildDDAdjustmentsGrid(dealData, 1, proofMap, proposalMap) },
        { key: "ddAdjustments2", fn: () => gridBuilders.buildDDAdjustmentsGrid(dealData, 2, proofMap, proposalMap) },
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

      // Extract CIM insights if available
      let cimInsights: CIMInsights | undefined;
      if (computedReports) {
        for (const report of Object.values(computedReports)) {
          const ci = (report as unknown as Record<string, unknown>)?.cimInsights as CIMInsights | undefined;
          if (ci && (ci.businessOverview || (ci.productsServices && ci.productsServices.length > 0))) {
            cimInsights = ci;
            break;
          }
        }
      }

      // Build report data payload
      const enrichedAdjustments = buildDDAdjustments(dealData, proofMap, proposalMap, evidenceByProposal);
      const reportData: PDFReportData = {
        metadata,
        attentionItems: attentionItems.length > 0 ? attentionItems : undefined,
        execSummary: computeExecSummary(dealData),
        ddAdjustments: enrichedAdjustments,
        financialRatios: computeRatios(dealData),
        flaggedItems: flaggedItems.length > 0 ? flaggedItems : undefined,
        glFindings: glFindings.length > 0 ? glFindings : undefined,
        jeFindings: jeFindings.length > 0 ? jeFindings : undefined,
        cimInsights,
        grids,
        traceabilityAdjustments: enrichedAdjustments,
      };

      // Build PDF in Web Worker (background thread)
      const blob = await buildClientPDF(reportData, (p) => {
        setPdfProgress({ page: p.page, total: p.total });
      });

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(projectName || "Company").replace(/[^a-zA-Z0-9]/g, "_")}_QoE_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF report generated successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsGenerating(false);
      setPdfProgress({ page: 0, total: 0 });
    }
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState({ current: 0, total: 0, label: "" });

  const handleExportExcel = async () => {
    if (isDemo) {
      trackEvent("demo_export_blocked", { format: "xlsx" });
      toast.info("This is a preview — sign up to export your own QoE report", {
        description: "Create an account to generate PDF and Excel deliverables.",
      });
      return;
    }
    if (!dealData) {
      toast.info("Excel export requires workbook data", { description: "No deal data available for export." });
      return;
    }
    if (isExportingExcel) return;
    trackEvent("workbook_exported", { format: "xlsx" });
    setIsExportingExcel(true);
    setExcelProgress({ current: 0, total: 0, label: "Preparing..." });

    try {
      await exportWorkbookXlsx({
        dealData,
        onProgress: (current, total, label) => {
          setExcelProgress({ current, total, label });
        },
      });
      toast.success("Excel workbook exported successfully!");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel workbook", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsExportingExcel(false);
      setExcelProgress({ current: 0, total: 0, label: "" });
    }
  };


  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const pdfButtonLabel = isGenerating
    ? pdfProgress.total > 0
      ? `Page ${pdfProgress.page}/${pdfProgress.total}`
      : "Preparing..."
    : "PDF Report";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold">Export Center</h2>
        <p className="text-muted-foreground">Export your QoE deliverables</p>
      </div>

      {/* Completion Celebration */}
      {isReady && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-12 h-12 text-primary" />
                <PartyPopper className="w-6 h-6 text-amber-500 absolute -top-1 -right-1" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              QoE Analysis Complete!
            </h3>
            <p className="text-muted-foreground">
              All core sections have data. Your Quality of Earnings analysis is ready for export.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simple Readiness Check */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isReady ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Ready to Export</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{totalCore - readyCount} core sections missing data</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={onNavigateToInsights}>
              View full status in Insights
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick status indicators */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            <Badge variant={coreDataStatus.incomeStatement ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.incomeStatement ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              Income Statement
            </Badge>
            <Badge variant={coreDataStatus.balanceSheet ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.balanceSheet ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              Balance Sheet
            </Badge>
            <Badge variant={coreDataStatus.qoeAnalysis ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.qoeAnalysis ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              QoE Analysis
            </Badge>
            <Badge variant={coreDataStatus.ddAdjustments ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.ddAdjustments ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              DD Adjustments
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={exportData.notes}
            onChange={(e) => updateData({ ...exportData, notes: e.target.value })}
            placeholder="Add any final notes, observations, or recommendations for this QoE engagement..."
            className="w-full h-32 p-3 border border-border rounded-lg resize-none bg-background"
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isGenerating || !dealData}
              className="h-20 flex flex-col gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {pdfButtonLabel}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel || !dealData}
              className="h-20 flex flex-col gap-2"
            >
              {isExportingExcel ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isExportingExcel ? `Tab ${excelProgress.current}/${excelProgress.total}` : "Excel Workbook"}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyShareLink}
              className="h-20 flex flex-col gap-2"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Copy Share Link</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
