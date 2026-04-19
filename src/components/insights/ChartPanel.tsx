import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, AreaChart, Area } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { sumByLineItem, calcNWCExCash, calcReportedEBITDA } from "@/lib/calculations";
import { signedAdjustmentTotal } from "@/lib/adjustmentSignUtils";
import type { DealData } from "@/lib/workbook-types";
import type { WizardReportData } from "@/lib/wizardReportBuilder";

interface ChartPanelProps {
  dealData: DealData;
  wizardData: Record<string, unknown>;
  wizardReports: Record<string, WizardReportData>;
}

// --- Helpers for aging/concentration parsing ---
type AgingEntry = { name?: string; current?: number; days1to30?: number; days31to60?: number; days61to90?: number; days90plus?: number; total?: number };
type AgingPeriod = { periodId: string; entries: AgingEntry[] };
type ConcentrationEntity = { name?: string; yearlyRevenue?: Record<string, number>; yearlySpend?: Record<string, number> };

function parseAgingTrend(periodData: AgingPeriod[]) {
  return [...periodData]
    .sort((a, b) => a.periodId.localeCompare(b.periodId))
    .map((p) => {
      let totalBalance = 0;
      let total90plus = 0;
      for (const e of p.entries) {
        const entryTotal = (e.current ?? 0) + (e.days1to30 ?? 0) + (e.days31to60 ?? 0) + (e.days61to90 ?? 0) + (e.days90plus ?? 0);
        totalBalance += e.total ?? entryTotal;
        total90plus += e.days90plus ?? 0;
      }
      const pct90plus = totalBalance > 0 ? Math.round((total90plus / totalBalance) * 100) : 0;
      // Format period label: "as_of_2024-01" → "Jan 2024"
      const label = p.periodId.replace(/^as_of_/, "").replace(/(\d{4})-(\d{2})/, (_, y, m) => {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${months[parseInt(m, 10) - 1] || m} ${y}`;
      });
      return { period: label, totalBalance, pct90plus };
    })
    .filter(d => d.totalBalance !== 0);
}

function parseConcentrationTrend(entities: ConcentrationEntity[], key: "yearlyRevenue" | "yearlySpend") {
  const yearMap: Record<string, number[]> = {};
  for (const e of entities) {
    const yearly = e[key];
    if (!yearly) continue;
    for (const [year, amount] of Object.entries(yearly)) {
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(amount);
    }
  }
  return Object.entries(yearMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, amounts]) => {
      const sorted = [...amounts].sort((a, b) => b - a);
      const total = sorted.reduce((s, v) => s + v, 0);
      if (total === 0) return null;
      const top1 = Math.round((sorted[0] / total) * 100);
      const top5 = Math.round((sorted.slice(0, 5).reduce((s, v) => s + v, 0) / total) * 100);
      return { year, top1, top5 };
    })
    .filter(Boolean) as Array<{ year: string; top1: number; top5: number }>;
}

export const ChartPanel = ({ dealData, wizardData, wizardReports }: ChartPanelProps) => {
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;

  // Build revenue/EBITDA trend data from real trial balance per period
  const periodData = periods.map((p) => {
    const rev = sumByLineItem(trialBalance, "Revenue", p.id);
    return {
      name: p.shortLabel,
      revenue: Math.abs(rev),
      ebitda: -calcReportedEBITDA(trialBalance, p.id, dealData.addbacks),
    };
  }).filter(d => d.revenue !== 0 || d.ebitda !== 0);

  // Build EBITDA bridge from DD adjustments
  const ddAdj = wizardData.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = (ddAdj?.adjustments || []) as Array<{ description?: string; label?: string; name?: string; amount?: number; periodValues?: Record<string, number> }>;
  
  // Scope EBITDA bridge to latest fiscal year to match MetricsOverview
  const latestFY = deal.fiscalYears[deal.fiscalYears.length - 1];
  const bridgePeriodIds = latestFY?.periods.map(p => p.id) || periods.map(p => p.id);
  const totalEbitda = bridgePeriodIds.reduce(
    (sum, pid) => sum + (-calcReportedEBITDA(trialBalance, pid, dealData.addbacks)), 0
  );

  const bridgeData = [
    { name: "Reported EBITDA", value: totalEbitda, fill: "hsl(var(--primary))" },
    ...adjustments.slice(0, 5).map(adj => {
      const adjTotal = signedAdjustmentTotal(adj);
      return {
        name: (adj.description || adj.label || adj.name || "Adjustment").substring(0, 15),
        value: adjTotal,
        fill: adjTotal >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))",
      };
    }),
    ...(adjustments.length > 0 ? [{
      name: "Adjusted EBITDA",
      value: totalEbitda + adjustments.reduce((sum, adj) => sum + signedAdjustmentTotal(adj), 0),
      fill: "hsl(var(--primary))",
    }] : []),
  ];

  // NWC trend
  const nwcData = periods.map((p) => {
    const nwc = calcNWCExCash(trialBalance, p.id);
    return { period: p.shortLabel, nwc };
  }).filter(d => d.nwc !== 0);

  const nwcValues = nwcData.map(d => d.nwc);
  const nwcAvg = nwcValues.length > 0 ? nwcValues.reduce((a, b) => a + b, 0) / nwcValues.length : 0;

  // AR / AP aging trends
  const arAging = wizardData.arAging as { periodData?: AgingPeriod[] } | undefined;
  const apAging = wizardData.apAging as { periodData?: AgingPeriod[] } | undefined;
  const arTrend = arAging?.periodData ? parseAgingTrend(arAging.periodData) : [];
  const apTrend = apAging?.periodData ? parseAgingTrend(apAging.periodData) : [];

  // Concentration trends
  const topCustomers = wizardData.topCustomers as { customers?: ConcentrationEntity[] } | undefined;
  const topVendors = wizardData.topVendors as { vendors?: ConcentrationEntity[] } | undefined;
  const custConc = topCustomers?.customers ? parseConcentrationTrend(topCustomers.customers, "yearlyRevenue") : [];
  const vendorConc = topVendors?.vendors ? parseConcentrationTrend(topVendors.vendors, "yearlySpend") : [];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    ebitda: { label: "EBITDA", color: "hsl(var(--chart-2))" },
    nwc: { label: "Net Working Capital", color: "hsl(var(--chart-3))" },
  };

  const hasNwcData = nwcData.length > 0;
  const hasPeriodData = periodData.length > 0;
  const hasBridgeData = bridgeData.length > 1;

  const emptyState = (msg: string) => (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center px-4">
      {msg}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Financial Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="mb-4 h-auto flex-wrap">
            <TabsTrigger value="trend">Revenue & EBITDA</TabsTrigger>
            <TabsTrigger value="bridge">EBITDA Bridge</TabsTrigger>
            <TabsTrigger value="nwc">NWC Trend</TabsTrigger>
            <TabsTrigger value="arAging">AR Aging</TabsTrigger>
            <TabsTrigger value="apAging">AP Aging</TabsTrigger>
            <TabsTrigger value="custConc">Cust. Conc.</TabsTrigger>
            <TabsTrigger value="vendorConc">Vendor Conc.</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trend" className="h-[300px]">
            {hasPeriodData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="ebitda" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState("No period data available")}
          </TabsContent>
          
          <TabsContent value="bridge" className="h-[300px]">
            {hasBridgeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bridgeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : emptyState("No adjustment data available")}
          </TabsContent>

          <TabsContent value="nwc" className="h-[300px]">
            {hasNwcData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nwcData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "NWC"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <ReferenceLine 
                    y={nwcAvg} 
                    stroke="hsl(var(--chart-4))" 
                    strokeDasharray="5 5" 
                    label={{ value: "Avg", position: "right", className: "text-xs fill-chart-4" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="nwc" 
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : emptyState("Complete NWC Analysis to see working capital trends")}
          </TabsContent>

          {/* AR Aging Trend */}
          <TabsContent value="arAging" className="h-[300px]">
            {arTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={arTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "pct90plus" ? `${value}%` : `$${value.toLocaleString()}`,
                      name === "pct90plus" ? "90+ Days %" : "Total AR",
                    ]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalBalance" name="Total AR" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="pct90plus" name="90+ Days %" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState("Sync QuickBooks or upload multiple periods to see AR aging trends")}
          </TabsContent>

          {/* AP Aging Trend */}
          <TabsContent value="apAging" className="h-[300px]">
            {apTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={apTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "pct90plus" ? `${value}%` : `$${value.toLocaleString()}`,
                      name === "pct90plus" ? "90+ Days %" : "Total AP",
                    ]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalBalance" name="Total AP" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="pct90plus" name="90+ Days %" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState("Sync QuickBooks or upload multiple periods to see AP aging trends")}
          </TabsContent>

          {/* Customer Concentration Trend */}
          <TabsContent value="custConc" className="h-[300px]">
            {custConc.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={custConc}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="top1" name="Top Customer %" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="top5" name="Top 5 Customers %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState("Sync QuickBooks or upload customer data to see concentration trends")}
          </TabsContent>

          {/* Vendor Concentration Trend */}
          <TabsContent value="vendorConc" className="h-[300px]">
            {vendorConc.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendorConc}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="top1" name="Top Vendor %" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="top5" name="Top 5 Vendors %" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState("Sync QuickBooks or upload vendor data to see concentration trends")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
