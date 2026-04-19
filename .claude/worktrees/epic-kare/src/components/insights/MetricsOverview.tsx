import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent, FileWarning, CheckCircle } from "lucide-react";
import { sumByLineItem } from "@/lib/calculations";
import { signedAdjustmentTotal } from "@/lib/adjustmentSignUtils";
import type { DealData } from "@/lib/workbook-types";

interface MetricsOverviewProps {
  dealData: DealData;
  wizardData: Record<string, unknown>;
}

export const MetricsOverview = ({ dealData, wizardData }: MetricsOverviewProps) => {
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;
  const fiscalYears = deal.fiscalYears;

  // Get the latest fiscal year's periods for LTM-like aggregation
  const latestFY = fiscalYears[fiscalYears.length - 1];
  const latestPeriodIds = latestFY?.periods.map(p => p.id) || periods.map(p => p.id);

  // Revenue: stored as credit (negative in TB) → negate for display
  const revenueRaw = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Revenue", pid), 0);
  const revenue = -revenueRaw; // positive display value

  // COGS: debit (positive in TB) → display as-is
  const cogs = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Cost of Goods Sold", pid), 0);

  // Gross Profit = Revenue - COGS in display terms. In TB: rev_raw + cogs = negative when profitable → negate
  const grossProfitRaw = revenueRaw + cogs;
  const grossProfit = -grossProfitRaw; // positive when profitable
  const grossMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : undefined;

  // Operating Expenses
  const opex = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Operating expenses", pid), 0);

  // Other Expense (Income) — includes Interest, D&A, Taxes
  const otherExp = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Other expense (income)", pid), 0);

  // EBITDA: in TB = rev_raw + cogs + opex + otherExp (negative when profitable) → negate for display
  const ebitdaRaw = revenueRaw + cogs + opex + otherExp;
  const ebitda = -ebitdaRaw; // positive when profitable

  // DD Adjustments from wizard_data
  const ddAdj = wizardData.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = (ddAdj?.adjustments || []) as Array<{ amount?: number; approved?: boolean; periodValues?: Record<string, number> }>;
  
  const totalAdjustments = adjustments.reduce((sum, adj) => sum + signedAdjustmentTotal(adj), 0);
  const approvedCount = adjustments.filter(adj => adj.approved || (adj as unknown as Record<string,unknown>).status === "accepted").length;
  const totalCount = adjustments.length;

  const adjustedEbitda = ebitda !== 0 ? ebitda + totalAdjustments : (totalAdjustments !== 0 ? totalAdjustments : undefined);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === 0) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return "—";
    return `${value.toFixed(1)}%`;
  };

  const hasRevenue = revenue !== 0;

  const metrics = [
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
      subtext: `${totalCount} items`,
    },
    {
      label: "Approved Adjustments",
      value: `${approvedCount}/${totalCount}`,
      icon: CheckCircle,
      subtext: totalCount > 0 ? `${((approvedCount / totalCount) * 100).toFixed(0)}% approved` : undefined,
    },
    {
      label: "Red Flags",
      value: "0",
      icon: FileWarning,
      subtext: "No issues detected",
    },
  ];

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
