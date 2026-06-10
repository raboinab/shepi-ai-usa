import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { TrendingUp, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { computeQoEMetrics } from "@/lib/qoeMetrics";
import * as calc from "@/lib/calculations";
import * as rh from "@/lib/reclassHelpers";
import { EBITDA_CATEGORIES, isCrossLineReclass } from "@/lib/reclassHelpers";
import type { DealData } from "@/lib/workbook-types";

interface QoESummarySectionProps {
  dealData?: DealData | null;
}

export const QoESummarySection = ({ dealData }: QoESummarySectionProps) => {
  const metrics = computeQoEMetrics(dealData);

  // Compute the EBITDA delta caused by cross-line reclasses over the LTM scope.
  // Display-positive: positive => reclasses increased EBITDA, negative => reduced it.
  const reclassEbitdaImpact = (() => {
    if (!dealData) return 0;
    const rc = dealData.reclassifications ?? [];
    if (rc.length === 0) return 0;
    let raw = 0;
    for (const pid of metrics.ltmPeriodIds) {
      for (const cat of EBITDA_CATEGORIES) {
        raw += calc.sumReclassImpact(rc, cat, pid);
      }
    }
    // TB convention: negate for display-positive EBITDA
    return -raw;
  })();

  const crossLineCount = (dealData?.reclassifications ?? []).filter(isCrossLineReclass).length;
  const reportedEBITDAPre = metrics.reportedEBITDA - reclassEbitdaImpact;

  const ebitdaComparison = reclassEbitdaImpact !== 0
    ? [
        { name: "Reported (pre-reclass)", value: reportedEBITDAPre },
        { name: "Reclass impact", value: reclassEbitdaImpact },
        { name: "Adjustments", value: metrics.totalAdjustments },
        { name: "Adjusted", value: metrics.adjustedEBITDA },
      ]
    : [
        { name: "Reported", value: metrics.reportedEBITDA },
        { name: "Adjustments", value: metrics.totalAdjustments },
        { name: "Adjusted", value: metrics.adjustedEBITDA },
      ];

  // Build per-FY trend data
  const trendData = (() => {
    if (!dealData) {
      return [{ period: "LTM", reported: metrics.reportedEBITDA, adjusted: metrics.adjustedEBITDA }];
    }
    const tb = dealData.trialBalance;
    const ab = dealData.addbacks;
    const adj = dealData.adjustments;
    const rc = dealData.reclassifications ?? [];
    return dealData.deal.fiscalYears.map(fy => {
      const fyPids = fy.periods.map(p => p.id);
      const reported = rh.reclassAwareReportedEBITDA(tb, rc, fyPids, ab);
      const adjusted = rh.reclassAwareAdjustedEBITDA(tb, rc, adj, fyPids, ab);
      return { period: fy.label, reported, adjusted };
    });
  })();

  const adjustmentPct = metrics.reportedEBITDA
    ? `${((metrics.totalAdjustments / metrics.reportedEBITDA) * 100).toFixed(1)}%`
    : "N/A";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const reportedSubtitle = reclassEbitdaImpact !== 0
    ? `${reclassEbitdaImpact >= 0 ? "+" : ""}${fmt(reclassEbitdaImpact)} from ${crossLineCount} cross-line reclass${crossLineCount === 1 ? "" : "es"}`
    : "As stated in financials";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">QoE Summary</h2>
        <p className="text-muted-foreground">Overview of quality of earnings analysis and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Reported EBITDA"
          value={metrics.reportedEBITDA}
          icon={DollarSign}
          subtitle={reportedSubtitle}
        />
        <SummaryCard
          title="Total Adjustments"
          value={metrics.totalAdjustments}
          icon={FileText}
          trend={metrics.totalAdjustments > 0 ? "up" : metrics.totalAdjustments < 0 ? "down" : "neutral"}
          trendValue={`${metrics.adjustmentCount >= 0 ? metrics.adjustmentCount : "—"} items`}
        />
        <SummaryCard
          title="Adjusted EBITDA"
          value={metrics.adjustedEBITDA}
          icon={TrendingUp}
          subtitle="Normalized earnings"
        />
        <SummaryCard
          title="Adjustment %"
          value={adjustmentPct}
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
    </div>
  );
};
