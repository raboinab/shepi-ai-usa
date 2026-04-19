import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { TrendingUp, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { sumByLineItem } from "@/lib/calculations";
import type { DealData } from "@/lib/workbook-types";

interface QoESummaryData {
  reportedEBITDA: number;
  adjustments: { description: string; amount: number; category: string }[];
}

interface QoESummarySectionProps {
  data: QoESummaryData;
  updateData: (data: QoESummaryData) => void;
  dealData?: DealData | null;
}

const defaultData: QoESummaryData = {
  reportedEBITDA: 0,
  adjustments: [],
};

export const QoESummarySection = ({ data, dealData }: QoESummarySectionProps) => {
  const summaryData = { ...defaultData, ...data };

  const totalAdjustments = summaryData.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const adjustedEBITDA = summaryData.reportedEBITDA + totalAdjustments;
  const adjustmentCount = summaryData.adjustments.length;

  const ebitdaComparison = [
    { name: "Reported", value: summaryData.reportedEBITDA },
    { name: "Adjustments", value: totalAdjustments },
    { name: "Adjusted", value: adjustedEBITDA },
  ];

  // Build real per-FY trend data from DealData when available
  const trendData = (() => {
    if (!dealData) {
      return [
        { period: "Current", reported: summaryData.reportedEBITDA || 0, adjusted: adjustedEBITDA || 0 },
      ];
    }
    const tb = dealData.trialBalance;
    return dealData.deal.fiscalYears.map(fy => {
      const fyPeriodIds = fy.periods.map(p => p.id);
      // Sum all IS line items across FY periods for Net Income (= EBITDA when no addbacks)
      const revRaw = fyPeriodIds.reduce((sum, pid) => sum + sumByLineItem(tb, "Revenue", pid), 0);
      const cogs = fyPeriodIds.reduce((sum, pid) => sum + sumByLineItem(tb, "Cost of Goods Sold", pid), 0);
      const opex = fyPeriodIds.reduce((sum, pid) => sum + sumByLineItem(tb, "Operating expenses", pid), 0);
      const otherExp = fyPeriodIds.reduce((sum, pid) => sum + sumByLineItem(tb, "Other expense (income)", pid), 0);
      const reported = -(revRaw + cogs + opex + otherExp);
      return {
        period: fy.label,
        reported,
        adjusted: reported + totalAdjustments, // Apply same adjustments for now
      };
    });
  })();

  const adjustmentsByCategory = summaryData.adjustments.reduce((acc, adj) => {
    acc[adj.category] = (acc[adj.category] || 0) + adj.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">QoE Summary</h2>
        <p className="text-muted-foreground">Overview of quality of earnings analysis and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Reported EBITDA"
          value={summaryData.reportedEBITDA}
          icon={DollarSign}
          subtitle="As stated in financials"
        />
        <SummaryCard
          title="Total Adjustments"
          value={totalAdjustments}
          icon={FileText}
          trend={totalAdjustments > 0 ? "up" : totalAdjustments < 0 ? "down" : "neutral"}
          trendValue={`${adjustmentCount} items`}
        />
        <SummaryCard
          title="Adjusted EBITDA"
          value={adjustedEBITDA}
          icon={TrendingUp}
          subtitle="Normalized earnings"
        />
        <SummaryCard
          title="Adjustment %"
          value={summaryData.reportedEBITDA ? `${((totalAdjustments / summaryData.reportedEBITDA) * 100).toFixed(1)}%` : "N/A"}
          icon={AlertTriangle}
          subtitle="Impact on EBITDA"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>EBITDA Bridge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ebitdaComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EBITDA Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                  <Line type="monotone" dataKey="reported" stroke="hsl(var(--muted-foreground))" name="Reported" />
                  <Line type="monotone" dataKey="adjusted" stroke="hsl(var(--primary))" strokeWidth={2} name="Adjusted" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjustments by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(adjustmentsByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(adjustmentsByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{category}</span>
                  <span className={amount > 0 ? "text-green-600" : "text-red-600"}>
                    {amount > 0 ? "+" : ""}${amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No adjustments recorded yet. Add adjustments in the Due Diligence Adjustments section.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
