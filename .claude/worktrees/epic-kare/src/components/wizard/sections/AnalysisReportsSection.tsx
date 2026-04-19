import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, BarChart3, Percent } from "lucide-react";
import type { DealData } from "@/lib/workbook-types";
import { sumByLineItem } from "@/lib/calculations";
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

  // IS metrics
  const totalRevenue = Math.abs(sumByLineItem(tb, "Revenue", pid));
  const totalCOGS = sumByLineItem(tb, "Cost of Goods Sold", pid);
  const totalOpEx = sumByLineItem(tb, "Operating expenses", pid);
  const totalOtherExp = sumByLineItem(tb, "Other expense (income)", pid);
  const grossProfit = totalRevenue - totalCOGS;
  const netIncome = grossProfit - totalOpEx - totalOtherExp;

  // BS metrics
  const cashAndEquiv = sumByLineItem(tb, "Cash and cash equivalents", pid);
  const ar = sumByLineItem(tb, "Accounts receivable", pid);
  const otherCA = sumByLineItem(tb, "Other current assets", pid);
  const fixedAssets = sumByLineItem(tb, "Fixed assets", pid);
  const otherAssets = sumByLineItem(tb, "Other assets", pid);
  const currentAssets = cashAndEquiv + ar + otherCA;
  const totalAssets = currentAssets + fixedAssets + otherAssets;

  const currentLiab = sumByLineItem(tb, "Current liabilities", pid);
  const otherCL = sumByLineItem(tb, "Other current liabilities", pid);
  const ltLiab = sumByLineItem(tb, "Long term liabilities", pid);
  const totalCurrentLiabilities = currentLiab + otherCL;
  const totalLiabilities = totalCurrentLiabilities + ltLiab;
  const totalEquity = sumByLineItem(tb, "Equity", pid);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Ratios
  const currentRatio = totalCurrentLiabilities > 0 ? currentAssets / totalCurrentLiabilities : 0;
  const quickRatio = totalCurrentLiabilities > 0 ? (cashAndEquiv + ar) / totalCurrentLiabilities : 0;
  const debtToEquity = totalEquity !== 0 ? totalLiabilities / Math.abs(totalEquity) : 0;
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
  const netMargin = totalRevenue > 0 ? netIncome / totalRevenue : 0;
  const roa = totalAssets > 0 ? netIncome / totalAssets : 0;
  const roe = totalEquity !== 0 ? netIncome / Math.abs(totalEquity) : 0;

  const hasData = tb.length > 0;

  // Common size P&L items
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
                      <TableCell className="font-medium">Return on Assets (ROA)</TableCell>
                      <TableCell className="text-right font-mono">{hasData ? formatPercent(roa) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hasData ? (roa >= 0.05 ? "Strong" : roa >= 0.02 ? "Average" : "Below average") : "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Return on Equity (ROE)</TableCell>
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
