import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";
import { assessEbitdaMargin } from "@/lib/industryConfig";
import { sumByLineItem, calcReportedEBITDA } from "@/lib/calculations";
import { signedAdjustmentTotal } from "@/lib/adjustmentSignUtils";
import { computeWIPAggregates } from "@/lib/workbook-grid-builders/buildWIPScheduleGrid";
import type { DealData } from "@/lib/workbook-types";

interface QuickInsightsProps {
  dealData: DealData;
  wizardData: Record<string, unknown>;
  industry?: string;
}

interface Insight {
  type: "info" | "warning" | "success" | "tip";
  title: string;
  description: string;
}

// Shared helper: extract latest year value with yearlyRevenue/yearlySpend fallback
const getLatestValue = (item: Record<string, unknown>, keyedField: string): number => {
  const direct = item.currentYear;
  if (typeof direct === "number" && direct !== 0) return direct;
  const keyed = item[keyedField] as Record<string, number> | undefined;
  if (keyed && typeof keyed === "object") {
    const years = Object.keys(keyed).sort();
    if (years.length > 0) return keyed[years[years.length - 1]] || 0;
  }
  return 0;
};

export const QuickInsights = ({ dealData, wizardData, industry }: QuickInsightsProps) => {
  // User-entered data from wizardData
  const topCustomers = wizardData.topCustomers as { customers?: Array<Record<string, unknown>>; totalRevenue?: number } | undefined;
  const topVendors = wizardData.topVendors as { vendors?: Array<Record<string, unknown>>; totalSpend?: number } | undefined;
  const arAging = wizardData.arAging as { periodData?: Array<Record<string, unknown>> } | undefined;
  const supplementary = wizardData.supplementary as {
    debtSchedule?: { items?: Array<{ lender?: string; balance?: number; maturityDate?: string }> };
    leaseObligations?: { items?: Array<{ expirationDate?: string }> };
    contingentLiabilities?: { items?: Array<{ probability?: string; estimatedAmount?: number }> };
  } | undefined;
  const materialContracts = wizardData.materialContracts as { contracts?: Array<{ hasCoC?: boolean; cocDetails?: string; expirationDate?: string; counterparty?: string }> } | undefined;

  // Computed metrics from DealData
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;
  const latestFY = deal.fiscalYears[deal.fiscalYears.length - 1];
  const latestPeriodIds = latestFY?.periods.map(p => p.id) || periods.map(p => p.id);

  const revenue = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Revenue", pid), 0);
  const ebitda = latestPeriodIds.reduce(
    (sum, pid) => sum + calcReportedEBITDA(trialBalance, pid, dealData.addbacks), 0
  );

  const insights: Insight[] = [];
  const today = new Date();

  // ===== CUSTOMER CONCENTRATION (with yearlyRevenue fallback) =====
  const customerRevenue = topCustomers?.customers?.reduce((sum, c) => sum + getLatestValue(c, "yearlyRevenue"), 0) || 0;
  const totalRevenue = topCustomers?.totalRevenue || customerRevenue || 1;
  const top1CustomerVal = topCustomers?.customers?.[0] ? getLatestValue(topCustomers.customers[0], "yearlyRevenue") : 0;
  const top1CustomerPct = top1CustomerVal ? (top1CustomerVal / totalRevenue) * 100 : 0;
  const top5CustomerPct = topCustomers?.customers?.slice(0, 5).reduce((sum, c) => sum + (getLatestValue(c, "yearlyRevenue") / totalRevenue) * 100, 0) || 0;

  if (top1CustomerPct > 30) {
    const name = (topCustomers?.customers?.[0]?.name as string) || "Unknown";
    insights.push({
      type: "warning",
      title: "High Customer Concentration",
      description: `Top customer (${name}) represents ${top1CustomerPct.toFixed(0)}% of revenue. Consider diversification risk.`,
    });
  } else if (top5CustomerPct > 60) {
    insights.push({
      type: "warning",
      title: "Customer Concentration Risk",
      description: `Top 5 customers represent ${top5CustomerPct.toFixed(0)}% of revenue. Moderate concentration risk.`,
    });
  }

  // ===== VENDOR CONCENTRATION (with yearlySpend fallback) =====
  const vendorSpend = topVendors?.vendors?.reduce((sum, v) => sum + getLatestValue(v, "yearlySpend"), 0) || 0;
  const totalSpend = topVendors?.totalSpend || vendorSpend || 1;
  const top1VendorVal = topVendors?.vendors?.[0] ? getLatestValue(topVendors.vendors[0], "yearlySpend") : 0;
  const top1VendorPct = top1VendorVal ? (top1VendorVal / totalSpend) * 100 : 0;

  if (top1VendorPct > 40) {
    const name = (topVendors?.vendors?.[0]?.name as string) || "Unknown";
    insights.push({
      type: "warning",
      title: "Vendor Dependency Risk",
      description: `Top vendor (${name}) represents ${top1VendorPct.toFixed(0)}% of spend. Supply chain risk.`,
    });
  }

  // ===== AR AGING (iterate entries[] like RiskIndicators) =====
  const latestARPeriod = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = (latestARPeriod as Record<string, unknown> | undefined)?.entries as Array<Record<string, number>> | undefined;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => {
      const computed = (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0);
      return sum + Math.abs(e.total || computed);
    }, 0);
    const over90Pct = arTotal > 0 ? (arOver90 / arTotal) * 100 : 0;
    const over60 = arEntries.reduce((sum, e) => sum + Math.abs(e.days61to90 || 0) + Math.abs(e.days90plus || 0), 0);
    const over60Pct = arTotal > 0 ? (over60 / arTotal) * 100 : 0;

    if (over90Pct > 15) {
      insights.push({ type: "warning", title: "AR Quality Concern", description: `${over90Pct.toFixed(0)}% of receivables are over 90 days old. Review for bad debt exposure.` });
    } else if (over60Pct > 25) {
      insights.push({ type: "info", title: "AR Aging Alert", description: `${over60Pct.toFixed(0)}% of receivables are over 60 days. Monitor collection efforts.` });
    }
  }

  // ===== DEBT MATURITY =====
  const debtItems = supplementary?.debtSchedule?.items || [];
  const upcomingMaturities = debtItems
    .filter(d => d.maturityDate && d.balance)
    .map(d => ({ ...d, date: parseISO(d.maturityDate!) }))
    .filter(d => differenceInMonths(d.date, today) <= 12 && d.date > today);

  if (upcomingMaturities.length > 0) {
    const totalMaturing = upcomingMaturities.reduce((sum, d) => sum + (d.balance || 0), 0);
    insights.push({ type: "warning", title: "Debt Maturities Approaching", description: `$${(totalMaturing / 1000000).toFixed(1)}M in debt matures within 12 months across ${upcomingMaturities.length} facility(ies).` });
  }

  // ===== MATERIAL CONTRACTS COC =====
  const cocContracts = materialContracts?.contracts?.filter(c => c.hasCoC || c.cocDetails) || [];
  if (cocContracts.length > 0) {
    insights.push({ type: "warning", title: "Change of Control Provisions", description: `${cocContracts.length} material contract(s) have change of control provisions that may affect the transaction.` });
  }

  // ===== CONTRACT EXPIRATIONS =====
  const expiringContracts = materialContracts?.contracts
    ?.filter(c => c.expirationDate)
    ?.map(c => ({ ...c, date: parseISO(c.expirationDate!) }))
    ?.filter(c => differenceInMonths(c.date, today) <= 6 && c.date > today) || [];

  if (expiringContracts.length > 0) {
    insights.push({ type: "info", title: "Contracts Expiring Soon", description: `${expiringContracts.length} material contract(s) expire within 6 months. Review renewal terms.` });
  }

  // ===== CONTINGENT LIABILITIES =====
  const probableContingent = supplementary?.contingentLiabilities?.items?.filter(c => c.probability === "Probable") || [];
  if (probableContingent.length > 0) {
    const totalProbable = probableContingent.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
    insights.push({ type: "warning", title: "Probable Contingent Liabilities", description: `${probableContingent.length} probable contingency(ies) with estimated exposure of $${(totalProbable / 1000).toFixed(0)}K.` });
  }

  // ===== COMPUTED METRICS (Revenue, EBITDA) =====
  const absRevenue = Math.abs(revenue);
  if (absRevenue > 0 && insights.length < 8) {
    insights.push({ type: "info", title: "LTM Revenue", description: `Total revenue of $${(absRevenue / 1000000).toFixed(1)}M recorded for the latest fiscal year.` });
  }

  // DD Adjustments insight
  const ddAdj = wizardData.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = (ddAdj?.adjustments || []) as Array<{ amount?: number; periodValues?: Record<string, number> }>;
  if (adjustments.length > 0 && insights.length < 8) {
    const totalAdj = adjustments.reduce((sum, adj) => sum + signedAdjustmentTotal(adj), 0);
    const adjustmentPercent = absRevenue ? ((totalAdj / absRevenue) * 100).toFixed(1) : "N/A";
    insights.push({
      type: totalAdj >= 0 ? "success" : "warning",
      title: "Net Adjustments Impact",
      description: `${adjustments.length} adjustments totaling $${(totalAdj / 1000).toFixed(0)}K (${adjustmentPercent}% of revenue).`,
    });
  }

  // Bug 1 fix: negate raw TB ebitda for correct display margin
  if (ebitda !== 0 && absRevenue > 0 && insights.length < 8) {
    const margin = (-ebitda / absRevenue) * 100;
    const { assessment, rangeText, confidence } = industry 
      ? assessEbitdaMargin(industry, margin)
      : { assessment: margin > 15 ? "above" : margin > 10 ? "within" : "below" as const, rangeText: "vs general benchmarks", confidence: "low" };
    
    const confidenceNote = confidence === "high" ? "" : " (typical range)";
    
    insights.push({
      type: assessment === "above" ? "success" : assessment === "within" ? "info" : "warning",
      title: "EBITDA Margin",
      description: `Current EBITDA margin is ${margin.toFixed(1)}%, ${assessment} ${rangeText}${confidenceNote}.`,
    });
  }

  // ===== WIP INSIGHTS =====
  const wipAgg = computeWIPAggregates(dealData);
  if (wipAgg && insights.length < 10) {
    if (Math.abs(wipAgg.netOverUnder) > 0) {
      const label = wipAgg.netOverUnder > 0 ? "over-billed" : "under-billed";
      insights.push({
        type: wipAgg.netOverUnder > 0 ? "warning" : "info",
        title: `Net ${label.charAt(0).toUpperCase() + label.slice(1)}`,
        description: `Net ${label} position of $${(Math.abs(wipAgg.netOverUnder) / 1000).toFixed(0)}K across ${wipAgg.jobCount} jobs.`,
      });
    }
    if (wipAgg.nearCompleteCount > 0) {
      insights.push({ type: "info", title: "Jobs Near Completion", description: `${wipAgg.nearCompleteCount} job(s) are >90% complete. Review for final billing and close-out.` });
    }
    if (wipAgg.concentrationPct > 25) {
      insights.push({ type: "warning", title: "Job Concentration Risk", description: `Largest job (${wipAgg.highConcentrationJob.jobName}) is ${wipAgg.concentrationPct.toFixed(0)}% of total contract value.` });
    }
  }

  // Default insight
  if (insights.length === 0) {
    insights.push({ type: "info", title: "Getting Started", description: "Complete the wizard sections to generate financial insights and risk indicators." });
  }

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "success": return <TrendingUp className="w-4 h-4" />;
      case "tip": return <Lightbulb className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getColors = (type: Insight["type"]) => {
    switch (type) {
      case "warning": return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "success": return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "tip": return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Quick Insights
          {insights.length > 1 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({insights.filter(i => i.type === "warning").length} alerts)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${getColors(insight.type)}`}
              >
                <div className="flex items-center gap-2 font-medium text-sm mb-1">
                  {getIcon(insight.type)}
                  {insight.title}
                </div>
                <p className="text-sm opacity-90">{insight.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
