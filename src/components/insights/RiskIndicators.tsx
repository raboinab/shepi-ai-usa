import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Building, Clock, TrendingDown, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealData } from "@/lib/workbook-types";
import { computeWIPAggregates } from "@/lib/workbook-grid-builders/buildWIPScheduleGrid";

interface RiskIndicatorsProps {
  wizardData: Record<string, unknown>;
  dealData?: DealData;
}

interface RiskLevel {
  level: "low" | "medium" | "high";
  label: string;
}

const getRiskLevel = (percentage: number): RiskLevel => {
  if (percentage > 40) return { level: "high", label: "High" };
  if (percentage > 20) return { level: "medium", label: "Medium" };
  return { level: "low", label: "Low" };
};

const getRiskColors = (level: RiskLevel["level"]) => {
  switch (level) {
    case "high": return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium": return "bg-chart-1/10 text-chart-1 border-chart-1/20";
    case "low": return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  }
};

const getProgressColors = (level: RiskLevel["level"]) => {
  switch (level) {
    case "high": return "bg-destructive";
    case "medium": return "bg-chart-1";
    case "low": return "bg-chart-2";
  }
};

// Extract latest year value from yearlyRevenue/yearlySpend keyed objects, falling back to currentYear
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

export const RiskIndicators = ({ wizardData, dealData }: RiskIndicatorsProps) => {
  // Customer concentration
  const topCustomers = wizardData.topCustomers as { customers?: Array<Record<string, unknown>>; totalRevenue?: number } | undefined;
  const customerRevenue = topCustomers?.customers?.reduce((sum, c) => sum + getLatestValue(c, "yearlyRevenue"), 0) || 0;
  const totalRevenue = topCustomers?.totalRevenue || customerRevenue || 1;
  const top1CustomerVal = topCustomers?.customers?.[0] ? getLatestValue(topCustomers.customers[0], "yearlyRevenue") : 0;
  const top1CustomerPct = top1CustomerVal ? (top1CustomerVal / totalRevenue) * 100 : 0;
  const top5CustomerPct = topCustomers?.customers?.slice(0, 5).reduce((sum, c) => sum + (getLatestValue(c, "yearlyRevenue") / totalRevenue) * 100, 0) || 0;

  // Vendor concentration
  const topVendors = wizardData.topVendors as { vendors?: Array<Record<string, unknown>>; totalSpend?: number } | undefined;
  const vendorSpend = topVendors?.vendors?.reduce((sum, v) => sum + getLatestValue(v, "yearlySpend"), 0) || 0;
  const totalSpend = topVendors?.totalSpend || vendorSpend || 1;
  const top1VendorVal = topVendors?.vendors?.[0] ? getLatestValue(topVendors.vendors[0], "yearlySpend") : 0;
  const top1VendorPct = top1VendorVal ? (top1VendorVal / totalSpend) * 100 : 0;

  // AR Aging quality — aggregate from entries[] array
  const arAging = wizardData.arAging as { periodData?: Array<{ over90?: number; total?: number; entries?: Array<{ days90plus?: number; total?: number; current?: number; days1to30?: number; days31to60?: number; days61to90?: number }> }> } | undefined;
  const latestAR = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = (latestAR as Record<string, unknown>)?.entries as Array<Record<string, number>> | undefined;
  let arOver90Pct = 0;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => sum + Math.abs(e.total || (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0)), 0);
    arOver90Pct = arTotal > 0 ? (arOver90 / arTotal) * 100 : 0;
  } else if (latestAR?.total) {
    arOver90Pct = ((latestAR.over90 || 0) / latestAR.total) * 100;
  }

  // Debt metrics — support both flat-array and { items: [...] } shapes
  type DebtEntry = { balance?: number; maturityDate?: string };
  const supplementary = wizardData.supplementary as { debtSchedule?: { items?: DebtEntry[] } | DebtEntry[] } | undefined;
  const rawDebt = supplementary?.debtSchedule;
  const debtItems: DebtEntry[] = Array.isArray(rawDebt) ? rawDebt : (rawDebt?.items || []);
  const totalDebt = debtItems.reduce((sum, d) => sum + (d.balance || 0), 0);
  
  // Find nearest maturity
  const today = new Date();
  const nearestMaturity = debtItems
    .filter(d => d.maturityDate)
    .map(d => ({ ...d, date: new Date(d.maturityDate!) }))
    .filter(d => d.date > today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  
  const monthsToMaturity = nearestMaturity 
    ? Math.round((nearestMaturity.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  // Material contracts with CoC provisions
  const materialContracts = wizardData.materialContracts as { contracts?: Array<{ hasCoC?: boolean; cocDetails?: string; changeOfControl?: string }> } | undefined;
  const cocCount = materialContracts?.contracts?.filter(c => c.hasCoC || c.cocDetails || (c.changeOfControl && c.changeOfControl !== "None"))?.length || 0;
  const totalContracts = materialContracts?.contracts?.length || 0;

  const customerRisk = getRiskLevel(top1CustomerPct);
  const vendorRisk = getRiskLevel(top1VendorPct);
  const arRisk = getRiskLevel(arOver90Pct);

  // WIP aggregates
  const wipAgg = dealData ? computeWIPAggregates(dealData) : null;

  const hasData = top1CustomerPct > 0 || top1VendorPct > 0 || arOver90Pct > 0 || totalDebt > 0 || totalContracts > 0 || !!wipAgg;

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            Complete Customer, Vendor, AR Aging, or Debt sections to see risk indicators
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Risk Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Customer Concentration */}
          <div className={cn("p-3 rounded-lg border", getRiskColors(customerRisk.level))}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Customer Concentration</span>
            </div>
            <div className="text-2xl font-bold">{top1CustomerPct.toFixed(0)}%</div>
            <div className="text-xs opacity-80">Top customer share</div>
            <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", getProgressColors(customerRisk.level))}
                style={{ width: `${Math.min(top1CustomerPct, 100)}%` }}
              />
            </div>
            <div className="text-xs mt-1 opacity-70">Top 5: {top5CustomerPct.toFixed(0)}%</div>
          </div>

          {/* Vendor Concentration */}
          <div className={cn("p-3 rounded-lg border", getRiskColors(vendorRisk.level))}>
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4" />
              <span className="text-xs font-medium">Vendor Concentration</span>
            </div>
            <div className="text-2xl font-bold">{top1VendorPct.toFixed(0)}%</div>
            <div className="text-xs opacity-80">Top vendor share</div>
            <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", getProgressColors(vendorRisk.level))}
                style={{ width: `${Math.min(top1VendorPct, 100)}%` }}
              />
            </div>
          </div>

          {/* AR Quality */}
          <div className={cn("p-3 rounded-lg border", getRiskColors(arRisk.level))}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">AR Quality</span>
            </div>
            <div className="text-2xl font-bold">{arOver90Pct.toFixed(0)}%</div>
            <div className="text-xs opacity-80">Over 90 days</div>
            <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", getProgressColors(arRisk.level))}
                style={{ width: `${Math.min(arOver90Pct, 100)}%` }}
              />
            </div>
          </div>

          {/* Debt & Obligations */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Debt Overview</span>
            </div>
            <div className="text-2xl font-bold">
              ${totalDebt > 0 ? (totalDebt / 1000000).toFixed(1) : "0"}M
            </div>
            <div className="text-xs text-muted-foreground">Total debt</div>
            {monthsToMaturity !== null && (
              <div className={cn(
                "text-xs mt-2 font-medium",
                monthsToMaturity <= 6 ? "text-destructive" : monthsToMaturity <= 12 ? "text-chart-1" : "text-muted-foreground"
              )}>
                Next maturity: {monthsToMaturity}mo
              </div>
            )}
            {cocCount > 0 && (
              <div className="text-xs mt-1 text-chart-1">
                {cocCount} contracts with CoC
              </div>
            )}
          </div>

          {/* WIP Risk (when data exists) */}
          {wipAgg && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <HardHat className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">WIP Analysis</span>
              </div>
              <div className="text-2xl font-bold">
                ${Math.abs(wipAgg.netOverUnder) > 0 ? (wipAgg.netOverUnder / 1000).toFixed(0) : "0"}K
              </div>
              <div className="text-xs text-muted-foreground">Net over/(under)</div>
              {wipAgg.concentrationPct > 40 && (
                <div className="text-xs mt-2 font-medium text-destructive">
                  Job concentration: {wipAgg.concentrationPct.toFixed(0)}%
                </div>
              )}
              {wipAgg.totalOverBilled > 0 && (
                <div className="text-xs mt-1 text-chart-1">
                  Over-billing: ${(wipAgg.totalOverBilled / 1000).toFixed(0)}K
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
