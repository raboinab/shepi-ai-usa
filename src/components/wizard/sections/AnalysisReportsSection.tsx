import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, BarChart3, Percent } from "lucide-react";
import type { DealData } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";

interface RawDataReport {
  rawData?: string[][];
  syncedAt?: string;
}

interface AnalysisReportsSectionProps {
  dealData: DealData | null;
  nwcReportData: RawDataReport;
}

export const AnalysisReportsSection = ({ dealData, nwcReportData }: AnalysisReportsSectionProps) => {
  const tb = dealData?.trialBalance || [];
  const lastPeriod = dealData?.deal.periods[dealData.deal.periods.length - 1];
  const pid = lastPeriod?.id || "";

  // Annualized values across the latest fiscal year — used for ALL Income Statement metrics.
  // The single-month `pid` often has no IS activity (in-progress month), so we always sum FY periods
  // for revenue/COGS/EBITDA/etc. to keep the Common Size P&L and ratios meaningful.
  const latestFY = dealData?.deal.fiscalYears?.[dealData.deal.fiscalYears.length - 1];
  const fyPeriodIds = latestFY?.periods.map((p: { id: string }) => p.id) || (pid ? [pid] : []);
  const sumFY = (fn: (id: string) => number) =>
    fyPeriodIds.reduce((sum: number, id: string) => sum + fn(id), 0);

  // Negate credit-type items for display
  const totalRevenue = -sumFY(id => calc.calcRevenue(tb, id));
  const totalCOGS = sumFY(id => calc.calcCOGS(tb, id));
  const grossProfit = -sumFY(id => calc.calcGrossProfit(tb, id));
  const totalOpEx = sumFY(id => calc.calcOpEx(tb, id) + calc.calcPayroll(tb, id));
  const totalOtherExp = sumFY(id => calc.calcOtherExpense(tb, id));
  const netIncome = -sumFY(id => calc.calcNetIncome(tb, id));

  // Aliases used in ratios further down
  const annualNetIncome = netIncome;
  const annualRevenue = totalRevenue;
  const annualCOGS = totalCOGS;
  const annualEBITDA = -sumFY(id => calc.calcEBITDA(tb, id));
  const annualInterestExpense = sumFY(id => calc.calcInterestExpense(tb, id));
  const annualOperatingIncome = -sumFY(id => calc.calcOperatingIncome(tb, id));

  // BS metrics — use canonical helpers to stay consistent with Balance Sheet dashboard
  const cashAndEquiv = calc.sumByLineItem(tb, "Cash and cash equivalents", pid);
  const ar = calc.sumByLineItem(tb, "Accounts receivable", pid);
  const currentAssets = calc.calcTotalCurrentAssets(tb, pid);
  const totalAssets = calc.calcTotalAssets(tb, pid);

  // Liabilities/equity are negative credits in TB — use Math.abs for display-positive ratios
  const totalCurrentLiabilities = Math.abs(calc.calcTotalCurrentLiabilities(tb, pid));
  const totalLiabilities = Math.abs(calc.calcTotalLiabilities(tb, pid));
  const totalEquity = Math.abs(calc.calcTotalEquity(tb, pid));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Efficiency ratios
  const ap = Math.abs(calc.sumByLineItem(tb, "Current liabilities", pid));
  const dso = annualRevenue > 0 ? (ar / (annualRevenue / 365)) : 0;
  const dpo = annualCOGS > 0 ? (ap / (annualCOGS / 365)) : 0;
  const assetTurnover = totalAssets > 0 ? annualRevenue / totalAssets : 0;

  // Ratios (all values are now display-positive; IS-based ratios use annual figures)
  const currentRatio = totalCurrentLiabilities > 0 ? currentAssets / totalCurrentLiabilities : 0;
  const quickRatio = totalCurrentLiabilities > 0 ? (cashAndEquiv + ar) / totalCurrentLiabilities : 0;
  const debtToEquity = totalEquity !== 0 ? totalLiabilities / Math.abs(totalEquity) : 0;
  const grossMargin = annualRevenue > 0 ? grossProfit / annualRevenue : 0;
  const operatingMargin = annualRevenue > 0 ? annualOperatingIncome / annualRevenue : 0;
  const ebitdaMargin = annualRevenue > 0 ? annualEBITDA / annualRevenue : 0;
  const netMargin = annualRevenue > 0 ? netIncome / annualRevenue : 0;
  const roa = totalAssets > 0 ? annualNetIncome / totalAssets : 0;
  const roe = totalEquity !== 0 ? annualNetIncome / Math.abs(totalEquity) : 0;
  const interestCoverage = annualInterestExpense > 0 ? annualEBITDA / annualInterestExpense : 0;

  const hasData = tb.length > 0;

  // Common size P&L items (display-positive values, annualized)
  const plItems = [
    { label: "Revenue", amount: totalRevenue, isSection: true },
    { label: "Cost of Goods Sold", amount: totalCOGS, isSection: false },
    { label: "Gross Profit", amount: grossProfit, isSection: false, isSubtotal: true },
    { label: "Operating Expenses", amount: totalOpEx, isSection: false },
    { label: "Other Income/Expense", amount: totalOtherExp, isSection: false },
    { label: "Net Income", amount: netIncome, isSection: false, isTotal: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Analysis Reports</h2>
        <p className="text-muted-foreground">Detailed analytical reports and financial ratios</p>
      </div>

      <Tabs defaultValue="nwc" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nwc" className="gap-2">
            <PieChart className="w-4 h-4" />
            NWC Detail
          </TabsTrigger>
          <TabsTrigger value="common" className="gap-2">
            <Percent className="w-4 h-4" />
            P&L (% Sales)
          </TabsTrigger>
          <TabsTrigger value="ratios" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Financial Ratios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nwc" className="mt-6">
          <SpreadsheetReportViewer
            rawData={nwcReportData?.rawData || []}
            title="Net Working Capital Analysis"
            syncedAt={nwcReportData?.syncedAt}
            skipEmptyRows
          />
        </TabsContent>

        <TabsContent value="common" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Size Income Statement (% of Sales)</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Line Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plItems.map((item, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          item.isTotal ? "font-bold bg-primary/10 border-t-2" :
                          item.isSubtotal ? "font-semibold border-t" :
                          item.isSection ? "bg-muted/50 font-medium" : ""
                        }
                      >
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">
                          {totalRevenue > 0 ? formatPercent(item.amount / totalRevenue) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Enter trial balance data to see common size analysis.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liquidity Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ratio</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Interpretation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Current Ratio</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? `${currentRatio.toFixed(2)}x` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (currentRatio >= 1.5 ? "Strong" : currentRatio >= 1 ? "Adequate" : "Weak") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Quick Ratio</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? `${quickRatio.toFixed(2)}x` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (quickRatio >= 1 ? "Strong" : quickRatio >= 0.5 ? "Adequate" : "Weak") : "—"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profitability Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ratio</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Interpretation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Gross Margin</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(grossMargin) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">Industry dependent</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Net Margin</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(netMargin) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (netMargin >= 0.1 ? "Strong" : netMargin >= 0.05 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Return on Assets (Annual)</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(roa) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (roa >= 0.05 ? "Strong" : roa >= 0.02 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Operating Margin (Annual)</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(operatingMargin) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (operatingMargin >= 0.15 ? "Strong" : operatingMargin >= 0.05 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">EBITDA Margin (Annual)</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(ebitdaMargin) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (ebitdaMargin >= 0.2 ? "Strong" : ebitdaMargin >= 0.1 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Return on Equity (Annual)</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(roe) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (roe >= 0.15 ? "Strong" : roe >= 0.1 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficiency Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ratio</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Interpretation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Days Sales Outstanding</TableCell>
                      <TableCell className="text-right font-mono">{hasData && dso > 0 ? `${dso.toFixed(0)} days` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData && dso > 0 ? (dso <= 30 ? "Excellent" : dso <= 45 ? "Good" : dso <= 60 ? "Average" : "Slow collections") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Days Payable Outstanding</TableCell>
                      <TableCell className="text-right font-mono">{hasData && dpo > 0 ? `${dpo.toFixed(0)} days` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData && dpo > 0 ? (dpo <= 30 ? "Paying quickly" : dpo <= 45 ? "Normal" : "Extended terms") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Asset Turnover</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? `${assetTurnover.toFixed(2)}x` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (assetTurnover >= 2 ? "Efficient" : assetTurnover >= 1 ? "Average" : "Asset-heavy") : "—"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leverage Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ratio</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Interpretation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Debt to Equity</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? `${debtToEquity.toFixed(2)}x` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (debtToEquity <= 1 ? "Conservative" : debtToEquity <= 2 ? "Moderate" : "Aggressive") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Interest Coverage</TableCell>
                      <TableCell className="text-right font-mono">{hasData && interestCoverage > 0 ? `${interestCoverage.toFixed(1)}x` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData && interestCoverage > 0 ? (interestCoverage >= 3 ? "Strong" : interestCoverage >= 1.5 ? "Adequate" : "Risky") : "—"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
