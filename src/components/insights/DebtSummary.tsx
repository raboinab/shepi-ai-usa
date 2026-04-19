import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Calendar, Percent, FileText, Scale, AlertCircle } from "lucide-react";
import { format, parseISO, differenceInMonths } from "date-fns";

interface DebtSummaryProps {
  wizardData: Record<string, unknown>;
}

interface DebtItem {
  lender?: string;
  balance?: number;
  interestRate?: number;
  maturityDate?: string;
}

interface LeaseObligation {
  description?: string;
  annualPayment?: number;
  leaseType?: string;
  expirationDate?: string;
}

interface ContingentLiability {
  description?: string;
  estimatedAmount?: number;
  probability?: string;
}

export const DebtSummary = ({ wizardData }: DebtSummaryProps) => {
  const supplementary = wizardData.supplementary as {
    debtSchedule?: { items?: DebtItem[] } | DebtItem[];
    leaseObligations?: { items?: LeaseObligation[] } | LeaseObligation[];
    contingentLiabilities?: { items?: ContingentLiability[] } | ContingentLiability[];
  } | undefined;

  // Support both flat-array and { items: [...] } shapes
  const toArray = <T,>(val: { items?: T[] } | T[] | undefined): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.items || [];
  };

  const debtItems = toArray<DebtItem>(supplementary?.debtSchedule);
  const leaseItems = toArray<LeaseObligation>(supplementary?.leaseObligations);
  const contingentItems = toArray<ContingentLiability>(supplementary?.contingentLiabilities);

  // Debt calculations
  const totalDebt = debtItems.reduce((sum, d) => sum + (d.balance || 0), 0);
  const weightedRateSum = debtItems.reduce((sum, d) => sum + (d.balance || 0) * (d.interestRate || 0), 0);
  const avgRate = totalDebt > 0 ? weightedRateSum / totalDebt : 0;
  const lenderCount = debtItems.filter(d => d.lender && d.balance).length;

  // Nearest maturity
  const today = new Date();
  const maturities = debtItems
    .filter(d => d.maturityDate && d.balance)
    .map(d => ({
      lender: d.lender || "Unknown",
      balance: d.balance || 0,
      date: parseISO(d.maturityDate!)
    }))
    .filter(d => d.date > today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const nearestMaturity = maturities[0];
  const monthsToMaturity = nearestMaturity ? differenceInMonths(nearestMaturity.date, today) : null;

  // Lease calculations
  const totalAnnualLease = leaseItems.reduce((sum, l) => sum + (l.annualPayment || 0), 0);
  const operatingLeases = leaseItems.filter(l => l.leaseType === "Operating");
  const financeLeases = leaseItems.filter(l => l.leaseType === "Finance");

  // Contingent calculations
  const totalContingent = contingentItems.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const probableCount = contingentItems.filter(c => c.probability === "Probable").length;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const hasData = totalDebt > 0 || totalAnnualLease > 0 || totalContingent > 0;

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Debt & Obligations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Complete the Supplementary section to see debt and obligations summary
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Debt & Obligations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debt Summary */}
        {totalDebt > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="w-4 h-4" />
              Debt Schedule
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Total Debt</div>
                <div className="text-lg font-bold">{formatCurrency(totalDebt)}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Avg Rate
                </div>
                <div className="text-lg font-bold">{avgRate.toFixed(2)}%</div>
              </div>
            </div>
            {nearestMaturity && (
              <div className={`flex items-center gap-2 text-xs ${monthsToMaturity && monthsToMaturity <= 12 ? "text-chart-1" : "text-muted-foreground"}`}>
                <Calendar className="w-3 h-3" />
                Next: {nearestMaturity.lender} ({format(nearestMaturity.date, "MMM yyyy")})
              </div>
            )}
            <div className="text-xs text-muted-foreground">{lenderCount} lender{lenderCount !== 1 ? "s" : ""}</div>
          </div>
        )}

        {/* Lease Summary */}
        {totalAnnualLease > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" />
              Lease Obligations
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Annual Payments</div>
                <div className="text-lg font-bold">{formatCurrency(totalAnnualLease)}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Lease Count</div>
                <div className="text-lg font-bold">{leaseItems.length}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {operatingLeases.length} operating, {financeLeases.length} finance
            </div>
          </div>
        )}

        {/* Contingent Summary */}
        {totalContingent > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Scale className="w-4 h-4" />
              Contingent Liabilities
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Total Exposure</div>
                <div className="text-lg font-bold">{formatCurrency(totalContingent)}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Count</div>
                <div className="text-lg font-bold">{contingentItems.length}</div>
              </div>
            </div>
            {probableCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-chart-1">
                <AlertCircle className="w-3 h-3" />
                {probableCount} probable item{probableCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
