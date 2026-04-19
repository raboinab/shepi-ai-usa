import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, AreaChart, Area } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { sumByLineItem, calcNWCExCash } from "@/lib/calculations";
import { signedAdjustmentTotal } from "@/lib/adjustmentSignUtils";
import type { DealData } from "@/lib/workbook-types";
import type { WizardReportData } from "@/lib/wizardReportBuilder";

interface ChartPanelProps {
  dealData: DealData;
  wizardData: Record<string, unknown>;
  wizardReports: Record<string, WizardReportData>;
}

export const ChartPanel = ({ dealData, wizardData, wizardReports }: ChartPanelProps) => {
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;

  // Build revenue/EBITDA trend data from real trial balance per period
  // Revenue is stored as credit (negative in TB) → negate for display. EBITDA same.
  const periodData = periods.map((p) => {
    const rev = sumByLineItem(trialBalance, "Revenue", p.id);
    const cogs = sumByLineItem(trialBalance, "Cost of Goods Sold", p.id);
    const opex = sumByLineItem(trialBalance, "Operating expenses", p.id);
    const otherExp = sumByLineItem(trialBalance, "Other expense (income)", p.id);
    return {
      name: p.shortLabel,
      revenue: Math.abs(rev),
      ebitda: -(rev + cogs + opex + otherExp), // negate: credit-heavy sum is negative when profitable
    };
  }).filter(d => d.revenue !== 0 || d.ebitda !== 0);

  // Build EBITDA bridge from DD adjustments
  const ddAdj = wizardData.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = (ddAdj?.adjustments || []) as Array<{ description?: string; label?: string; name?: string; amount?: number; periodValues?: Record<string, number> }>;
  
  // Compute total EBITDA across all periods (negated for positive display)
  const totalEbitda = periods.reduce((sum, p) => {
    const rev = sumByLineItem(trialBalance, "Revenue", p.id);
    const cogs = sumByLineItem(trialBalance, "Cost of Goods Sold", p.id);
    const opex = sumByLineItem(trialBalance, "Operating expenses", p.id);
    const otherExp = sumByLineItem(trialBalance, "Other expense (income)", p.id);
    return sum + (-(rev + cogs + opex + otherExp));
  }, 0);

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

  // Build NWC trend data directly from trial balance (like revenue/EBITDA above)
  const nwcData = periods.map((p) => {
    const nwc = calcNWCExCash(trialBalance, p.id);
    return { period: p.shortLabel, nwc };
  }).filter(d => d.nwc !== 0);

  const nwcValues = nwcData.map(d => d.nwc);
  const nwcAvg = nwcValues.length > 0 ? nwcValues.reduce((a, b) => a + b, 0) / nwcValues.length : 0;

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    ebitda: { label: "EBITDA", color: "hsl(var(--chart-2))" },
    nwc: { label: "Net Working Capital", color: "hsl(var(--chart-3))" },
  };

  const hasNwcData = nwcData.length > 0;
  const hasPeriodData = periodData.length > 0;
  const hasBridgeData = bridgeData.length > 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Financial Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Revenue & EBITDA</TabsTrigger>
            <TabsTrigger value="bridge">EBITDA Bridge</TabsTrigger>
            <TabsTrigger value="nwc">NWC Trend</TabsTrigger>
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
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No period data available
              </div>
            )}
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
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No adjustment data available
              </div>
            )}
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
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Complete NWC Analysis to see working capital trends
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
