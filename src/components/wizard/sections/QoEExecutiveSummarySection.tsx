import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { TrendingUp, DollarSign, BarChart3, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DealData } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { computeQoEMetrics } from "@/lib/qoeMetrics";
import { computeSign, type LedgerIntent } from "@/lib/qoeAdjustmentTaxonomy";

interface QoEExecutiveSummaryProps {
  dealData: DealData | null;
  wizardData: Record<string, unknown>;
  project?: {
    target_company?: string | null;
    client_name?: string | null;
    industry?: string | null;
    transaction_type?: string | null;
  };
}

export const QoEExecutiveSummarySection = ({ dealData, wizardData, project }: QoEExecutiveSummaryProps) => {
  const metrics = computeQoEMetrics(dealData);

  // BS totals (use last period for point-in-time)
  const tb = dealData?.trialBalance || [];
  const lastPeriodId = dealData?.deal.periods[dealData.deal.periods.length - 1]?.id || "";
  const totalAssets = ["Cash and cash equivalents", "Accounts receivable", "Other current assets", "Fixed assets", "Other assets"]
    .reduce((sum, li) => sum + calc.sumByLineItem(tb, li, lastPeriodId), 0);

  // DD Adjustments from wizard_data for bridge detail
  const ddAdj = (wizardData.ddAdjustments as { adjustments?: { amount?: number; status?: string; type?: string; description?: string; block?: string; intent?: string; periodValues?: Record<string, number> }[] }) || {};
  const adjustments = ddAdj.adjustments || [];

  // EBITDA Bridge data using detail from DD adjustments but totals from shared metrics
  const bridgeData = [
    { name: "Reported EBITDA", value: metrics.reportedEBITDA, color: "hsl(var(--muted-foreground))" },
    ...adjustments.slice(0, 4).map((adj, idx) => {
      const adjAmount = Object.values(adj.periodValues || {}).reduce((s, v) => s + (Number(v) || 0), 0) * computeSign((adj.intent || "other") as LedgerIntent);
      return {
        name: (adj.description || `Adjustment ${idx + 1}`).substring(0, 20),
        value: adjAmount,
        color: adjAmount >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))",
      };
    }),
    { name: "Adjusted EBITDA", value: metrics.adjustedEBITDA, color: "hsl(var(--primary))" },
  ];

  // Key findings
  const keyFindings = adjustments.slice(0, 5).map((adj) => {
    const amount = Object.values(adj.periodValues || {}).reduce((s, v) => s + (Number(v) || 0), 0) * computeSign((adj.intent || "other") as LedgerIntent);
    return {
      description: adj.description || "Adjustment",
      amount,
      type: adj.block || adj.type || "DD",
    };
  });

  const latestFY = dealData?.deal.fiscalYears[dealData.deal.fiscalYears.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">QoE Executive Summary</h2>
        <p className="text-muted-foreground">High-level overview of the Quality of Earnings analysis</p>
      </div>

      {/* Company Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Engagement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Target Company</p>
              <p className="font-medium">{project?.target_company || "Not specified"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Client</p>
              <p className="font-medium">{project?.client_name || "Not specified"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Industry</p>
              <p className="font-medium">{project?.industry || "Not specified"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Transaction Type</p>
              <p className="font-medium">
                {project?.transaction_type
                  ? project.transaction_type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-")
                  : "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics — sourced from shared computeQoEMetrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Revenue"
          value={metrics.revenue}
          icon={DollarSign}
          subtitle={latestFY ? `LTM` : "No periods"}
        />
        <SummaryCard
          title="Adjusted EBITDA"
          value={metrics.adjustedEBITDA}
          icon={TrendingUp}
          subtitle="Post-adjustments"
        />
        <SummaryCard
          title="Net Adjustments"
          value={metrics.totalAdjustments}
          icon={BarChart3}
          subtitle={`${metrics.adjustmentCount >= 0 ? metrics.adjustmentCount : "—"} total`}
        />
        <SummaryCard
          title="Total Assets"
          value={totalAssets}
          icon={Building2}
          subtitle="Balance Sheet"
        />
      </div>

      {/* EBITDA Bridge Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">EBITDA Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          {bridgeData.length > 2 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bridgeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} className="text-xs" />
                <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {bridgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Complete DD Adjustments to view EBITDA Bridge
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Findings & Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          {keyFindings.length > 0 ? (
            <div className="space-y-3">
              {keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{finding.description}</p>
                    <p className="text-sm text-muted-foreground">{finding.type}</p>
                  </div>
                  <span className={`font-bold ${finding.amount >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {finding.amount >= 0 ? "+" : ""}${Math.abs(finding.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No adjustments recorded yet. Complete the DD Adjustments section to see key findings.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
