import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, AlertTriangle, Sparkles, UserMinus, RotateCw } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, AreaChart,
} from "recharts";
import type { ParsedMonthlySummary, MonthlyEntityType } from "@/lib/parsers/parseMonthlySummary";

interface Props {
  projectId: string;
  entityType: MonthlyEntityType;
}

const fmt = (n: number) =>
  n === 0 ? "—" : `$${Math.round(n).toLocaleString()}`;

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

type Status = "new" | "returning" | "lost" | "one-time" | "inactive";

interface EnrichedRow {
  name: string;
  monthly: Record<string, number>;
  total: number;
  firstMonth: string | null;
  lastMonth: string | null;
  activeMonths: number;
  status: Status;
}

function enrich(parsed: ParsedMonthlySummary): EnrichedRow[] {
  const months = parsed.months;
  const lastIdx = months.length - 1;
  return parsed.rows.map((r) => {
    let first: number | null = null;
    let last: number | null = null;
    let active = 0;
    months.forEach((ym, i) => {
      if (Math.abs(r.monthly[ym] ?? 0) > 0.01) {
        if (first === null) first = i;
        last = i;
        active++;
      }
    });
    let status: Status = "inactive";
    if (first !== null && last !== null) {
      const monthsSinceLast = lastIdx - last;
      if (active === 1) status = "one-time";
      else if (monthsSinceLast > 3) status = "lost";
      else if (lastIdx - (first as number) <= 3) status = "new";
      else status = "returning";
    }
    return {
      name: r.name,
      monthly: r.monthly,
      total: r.total,
      firstMonth: first !== null ? months[first] : null,
      lastMonth: last !== null ? months[last] : null,
      activeMonths: active,
      status,
    };
  });
}

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-green-600",
  returning: "bg-blue-600",
  lost: "bg-red-600",
  "one-time": "bg-amber-600",
  inactive: "bg-muted",
};

export const CustomerVendorMonthlyPanel = ({ projectId, entityType }: Props) => {
  const [parsed, setParsed] = useState<ParsedMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState<number>(10);
  const dataType = entityType === "customer" ? "sales_by_customer_monthly" : "expenses_by_vendor_monthly";
  const label = entityType === "customer" ? "Customers" : "Vendors";
  const verb = entityType === "customer" ? "Revenue" : "Spend";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("processed_data")
        .select("data, created_at")
        .eq("project_id", projectId)
        .eq("data_type", dataType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setParsed(null);
      } else {
        setParsed(data.data as unknown as ParsedMonthlySummary);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId, dataType]);

  const enriched = useMemo(() => parsed ? enrich(parsed) : [], [parsed]);
  const sortedByTotal = useMemo(
    () => [...enriched].sort((a, b) => Math.abs(b.total) - Math.abs(a.total)),
    [enriched]
  );

  const monthlyTotals = useMemo(() => {
    if (!parsed) return [];
    return parsed.months.map((ym) => {
      const total = enriched.reduce((s, r) => s + (r.monthly[ym] ?? 0), 0);
      return { month: ym, label: monthLabel(ym), total };
    });
  }, [parsed, enriched]);

  // Stacked area data: top 5 entities + Other
  const stackedTrend = useMemo(() => {
    if (!parsed) return { keys: [] as string[], data: [] as Record<string, number | string>[] };
    const top5 = sortedByTotal.slice(0, 5);
    const top5Names = new Set(top5.map((r) => r.name));
    const data = parsed.months.map((ym) => {
      const row: Record<string, number | string> = { month: monthLabel(ym) };
      let other = 0;
      enriched.forEach((r) => {
        if (top5Names.has(r.name)) {
          row[r.name] = r.monthly[ym] ?? 0;
        } else {
          other += r.monthly[ym] ?? 0;
        }
      });
      row["Other"] = other;
      return row;
    });
    return { keys: [...top5.map((r) => r.name), "Other"], data };
  }, [parsed, enriched, sortedByTotal]);

  // New / Returning / Lost per month
  const churnTrend = useMemo(() => {
    if (!parsed) return [];
    const months = parsed.months;
    return months.map((ym, i) => {
      let nu = 0, ret = 0, lost = 0;
      enriched.forEach((r) => {
        if (r.firstMonth === ym) nu++;
        else if (Math.abs(r.monthly[ym] ?? 0) > 0.01) ret++;
        if (r.lastMonth === ym && i < months.length - 1) lost++;
      });
      return { month: monthLabel(ym), New: nu, Returning: ret, Lost: -lost };
    });
  }, [parsed, enriched]);

  // Concentration drift
  const driftTrend = useMemo(() => {
    if (!parsed) return [];
    return parsed.months.map((ym) => {
      const monthRows = enriched
        .map((r) => Math.abs(r.monthly[ym] ?? 0))
        .sort((a, b) => b - a);
      const tot = monthRows.reduce((s, v) => s + v, 0);
      const top5 = monthRows.slice(0, 5).reduce((s, v) => s + v, 0);
      const top10 = monthRows.slice(0, 10).reduce((s, v) => s + v, 0);
      return {
        month: monthLabel(ym),
        "Top 5 %": tot ? +((top5 / tot) * 100).toFixed(1) : 0,
        "Top 10 %": tot ? +((top10 / tot) * 100).toFixed(1) : 0,
      };
    });
  }, [parsed, enriched]);

  const statusCounts = useMemo(() => {
    const c: Record<Status, number> = { new: 0, returning: 0, lost: 0, "one-time": 0, inactive: 0 };
    enriched.forEach((r) => { c[r.status]++; });
    return c;
  }, [enriched]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!parsed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Monthly Trends &amp; Churn — {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a QuickBooks <strong>{entityType === "customer" ? '"Sales by Customer Summary"' : '"Expenses by Vendor Summary"'}</strong> export
            with monthly columns to see {entityType === "customer" ? "revenue" : "spend"} trends, cohorts, and churn over time.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            In QuickBooks: Reports → {entityType === "customer" ? "Sales by Customer Summary" : "Expenses by Vendor Summary"} → Customize → Columns: <em>Months</em> → Export to Excel.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Then upload it in Documents under <em>"{entityType === "customer" ? "Sales by Customer (Monthly Columns)" : "Expenses by Vendor (Monthly Columns)"}"</em>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const heatRows = sortedByTotal.slice(0, topN);
  const maxAbs = Math.max(1, ...heatRows.flatMap((r) => parsed.months.map((m) => Math.abs(r.monthly[m] ?? 0))));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Monthly Trends &amp; Churn — {label}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {parsed.months[0]} → {parsed.months[parsed.months.length - 1]} · {parsed.rows.length} {label.toLowerCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <SummaryStat icon={Sparkles} label="New" value={statusCounts.new} color="text-green-600" />
          <SummaryStat icon={RotateCw} label="Returning" value={statusCounts.returning} color="text-blue-600" />
          <SummaryStat icon={UserMinus} label="Lost" value={statusCounts.lost} color="text-red-600" />
          <SummaryStat icon={AlertTriangle} label="One-time" value={statusCounts["one-time"]} color="text-amber-600" />
          <SummaryStat icon={Users} label="Total" value={enriched.length} color="text-foreground" />
        </div>

        <Tabs defaultValue="heatmap" className="w-full">
          <TabsList>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="churn">New / Lost</TabsTrigger>
            <TabsTrigger value="cohort">Cohort</TabsTrigger>
            <TabsTrigger value="drift">Concentration drift</TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Top</span>
              <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
                <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100, enriched.length].filter((n, i, a) => a.indexOf(n) === i).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">by total {verb.toLowerCase()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background text-left px-2 py-1 z-10 border-b">{label.slice(0, -1)}</th>
                    {parsed.months.map((m) => (
                      <th key={m} className="px-1 py-1 text-[10px] text-muted-foreground border-b min-w-[44px]">
                        {monthLabel(m).split(" ")[0]}<br /><span className="opacity-60">{monthLabel(m).split(" ")[1]}</span>
                      </th>
                    ))}
                    <th className="px-2 py-1 text-right border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {heatRows.map((r) => (
                    <tr key={r.name}>
                      <td className="sticky left-0 bg-background px-2 py-1 z-10 border-b font-medium max-w-[200px] truncate">{r.name}</td>
                      {parsed.months.map((m) => {
                        const v = r.monthly[m] ?? 0;
                        const intensity = Math.min(1, Math.abs(v) / maxAbs);
                        const isNeg = v < 0;
                        const bg = v === 0
                          ? "transparent"
                          : isNeg
                            ? `hsl(0 70% ${95 - intensity * 35}%)`
                            : `hsl(var(--primary) / ${0.05 + intensity * 0.85})`;
                        return (
                          <td key={m} className="px-1 py-1 border-b text-center" style={{ background: bg }} title={`${monthLabel(m)}: ${fmt(v)}`}>
                            {v === 0 ? "" : Math.round(v / 1000) + "k"}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-right border-b font-semibold">{fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="trend">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stackedTrend.data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {stackedTrend.keys.map((k, i) => (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stackId="1"
                      stroke={`hsl(${(i * 67) % 360} 70% 45%)`}
                      fill={`hsl(${(i * 67) % 360} 70% 55% / 0.7)`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="churn">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => Math.abs(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="New" stackId="a" fill="hsl(142 70% 45%)" />
                  <Bar dataKey="Returning" stackId="a" fill="hsl(217 70% 55%)" />
                  <Bar dataKey="Lost" fill="hsl(0 70% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lost = last active month (excluding the final period in the file). New = first active month.
            </p>
          </TabsContent>

          <TabsContent value="cohort">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="text-xs w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2">{label.slice(0, -1)}</th>
                    <th className="text-left px-2 py-2">Status</th>
                    <th className="text-left px-2 py-2">First</th>
                    <th className="text-left px-2 py-2">Last</th>
                    <th className="text-right px-2 py-2">Active mo.</th>
                    <th className="text-right px-2 py-2">Total {verb.toLowerCase()}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByTotal.map((r) => (
                    <tr key={r.name} className="border-b">
                      <td className="px-2 py-1 font-medium">{r.name}</td>
                      <td className="px-2 py-1">
                        <Badge className={STATUS_COLORS[r.status] + " text-white"}>{r.status}</Badge>
                      </td>
                      <td className="px-2 py-1 text-muted-foreground">{r.firstMonth ?? "—"}</td>
                      <td className="px-2 py-1 text-muted-foreground">{r.lastMonth ?? "—"}</td>
                      <td className="px-2 py-1 text-right">{r.activeMonths}</td>
                      <td className="px-2 py-1 text-right font-semibold">{fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="drift">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Top 5 %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Top 10 %" stroke="hsl(217 70% 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share of monthly {verb.toLowerCase()} held by the top 5 / top 10 {label.toLowerCase()}.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const SummaryStat = ({
  icon: Icon, label, value, color,
}: { icon: typeof Users; label: string; value: number; color: string }) => (
  <div className="border rounded-lg p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className={`h-4 w-4 ${color}`} />
      {label}
    </div>
    <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
  </div>
);
