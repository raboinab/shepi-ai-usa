import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent, FileWarning, CheckCircle, HardHat } from "lucide-react";
import { computeQoEMetrics } from "@/lib/qoeMetrics";
import { computeWIPAggregates } from "@/lib/workbook-grid-builders/buildWIPScheduleGrid";
import type { DealData } from "@/lib/workbook-types";

interface MetricsOverviewProps {
  dealData: DealData;
  wizardData: Record<string, unknown>;
}

// Reusable helper: extract latest year value with yearlyRevenue/yearlySpend fallback
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

// Count high-risk indicators from wizard data instead of hardcoding 0
const countRedFlags = (wizardData: Record<string, unknown>): { count: number; details: string[] } => {
  const flags: string[] = [];

  // Customer concentration > 40%
  const topCustomers = wizardData.topCustomers as { customers?: Array<Record<string, unknown>>; totalRevenue?: number } | undefined;
  if (topCustomers?.customers?.length) {
    const customerRevenue = topCustomers.customers.reduce((sum, c) => sum + getLatestValue(c, "yearlyRevenue"), 0);
    const totalRevenue = topCustomers.totalRevenue || customerRevenue || 1;
    const top1Pct = (getLatestValue(topCustomers.customers[0], "yearlyRevenue") / totalRevenue) * 100;
    if (top1Pct > 40) flags.push("Customer concentration");
  }

  // Vendor concentration > 40%
  const topVendors = wizardData.topVendors as { vendors?: Array<Record<string, unknown>>; totalSpend?: number } | undefined;
  if (topVendors?.vendors?.length) {
    const vendorSpend = topVendors.vendors.reduce((sum, v) => sum + getLatestValue(v, "yearlySpend"), 0);
    const totalSpend = topVendors.totalSpend || vendorSpend || 1;
    const top1Pct = (getLatestValue(topVendors.vendors[0], "yearlySpend") / totalSpend) * 100;
    if (top1Pct > 40) flags.push("Vendor concentration");
  }

  // AR 90+ days > 40%
  const arAging = wizardData.arAging as { periodData?: Array<Record<string, unknown>> } | undefined;
  const latestAR = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = latestAR?.entries as Array<Record<string, number>> | undefined;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => {
      const computed = (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0);
      return sum + Math.abs(e.total || computed);
    }, 0);
    if (arTotal > 0 && (arOver90 / arTotal) * 100 > 40) flags.push("AR quality");
  }

  // Probable contingent liabilities
  const supplementary = wizardData.supplementary as { contingentLiabilities?: { items?: Array<{ probability?: string }> } } | undefined;
  const probableCount = supplementary?.contingentLiabilities?.items?.filter(c => c.probability === "Probable").length || 0;
  if (probableCount > 0) flags.push("Contingent liabilities");

  // Change of control provisions
  const materialContracts = wizardData.materialContracts as { contracts?: Array<{ hasCoC?: boolean; cocDetails?: string }> } | undefined;
  const cocCount = materialContracts?.contracts?.filter(c => c.hasCoC || c.cocDetails)?.length || 0;
  if (cocCount > 0) flags.push("CoC provisions");

  return { count: flags.length, details: flags };
};

export const MetricsOverview = ({ dealData, wizardData }: MetricsOverviewProps) => {
  // Use centralized QoE metrics (LTM scope, dealData.adjustments)
  const qoe = computeQoEMetrics(dealData);

  const revenue = qoe.revenue;
  const grossProfit = qoe.grossProfit;
  const grossMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : undefined;
  const ebitda = qoe.reportedEBITDA;
  const totalAdjustments = qoe.totalAdjustments;
  const adjustedEbitda = qoe.adjustedEBITDA;
  const adjustmentCount = qoe.adjustmentCount;

  // Red flags from wizard data
  const { count: redFlagCount, details: redFlagDetails } = countRedFlags(wizardData);

  // WIP aggregates
  const wipAgg = computeWIPAggregates(dealData);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === 0) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return "—";
    return `${value.toFixed(1)}%`;
  };

  const hasRevenue = revenue !== 0;

  const metrics: Array<{
    label: string;
    value: string;
    icon: typeof DollarSign;
    subtext?: string;
  }> = [
    {
      label: "LTM Revenue",
      value: formatCurrency(hasRevenue ? revenue : undefined),
      icon: DollarSign,
    },
    {
      label: "Adjusted EBITDA",
      value: formatCurrency(adjustedEbitda),
      icon: TrendingUp,
      subtext: ebitda !== 0 ? `Reported: ${formatCurrency(ebitda)}` : undefined,
    },
    {
      label: "Gross Margin",
      value: formatPercent(hasRevenue ? grossMargin : undefined),
      icon: Percent,
    },
    {
      label: "Total Adjustments",
      value: formatCurrency(totalAdjustments || undefined),
      icon: totalAdjustments >= 0 ? TrendingUp : TrendingDown,
      subtext: `${adjustmentCount >= 0 ? adjustmentCount : '?'} items`,
    },
    {
      label: "Adjustment Count",
      value: `${adjustmentCount >= 0 ? adjustmentCount : '—'}`,
      icon: CheckCircle,
    },
    {
      label: "Red Flags",
      value: String(redFlagCount),
      icon: FileWarning,
      subtext: redFlagCount > 0 ? redFlagDetails.slice(0, 2).join(", ") : "No issues detected",
    },
  ];

  // Add WIP metric when data exists
  if (wipAgg) {
    metrics.push({
      label: "Net Over/(Under) Billing",
      value: formatCurrency(wipAgg.netOverUnder),
      icon: HardHat,
      subtext: `${wipAgg.jobCount} jobs tracked`,
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <metric.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{metric.label}</span>
            </div>
            <div className="text-xl font-bold">{metric.value}</div>
            {metric.subtext && (
              <div className="text-xs text-muted-foreground mt-1">{metric.subtext}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
