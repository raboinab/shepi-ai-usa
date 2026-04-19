import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "./SummaryCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { DashboardConfig } from "@/lib/reportDashboardMetrics";
import {
  TrendingUp, DollarSign, BarChart3, Wallet, Building2, CreditCard, Shield,
  Scale, CheckCircle2, AlertTriangle, Layers, Package, Percent, Receipt,
  ArrowUpDown, FileText, PenTool, Target, Calculator, Banknote, FolderOpen,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp, DollarSign, BarChart3, Wallet, Building2, CreditCard, Shield,
  Scale, CheckCircle2, AlertTriangle, Layers, Package, Percent, Receipt,
  ArrowUpDown, FileText, PenTool, Target, Calculator, Banknote, FolderOpen,
  AlertCircle,
};

interface ReportDashboardHeaderProps {
  config: DashboardConfig;
}

export const ReportDashboardHeader = ({ config }: ReportDashboardHeaderProps) => {
  const { cards, chart } = config;
  const gridCols = cards.length <= 2 ? "md:grid-cols-2" : cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
        {cards.map((card, i) => (
          <SummaryCard
            key={i}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={ICON_MAP[card.iconName]}
            isCurrency={card.isCurrency !== false}
            trend={card.trend}
            trendValue={card.trendValue}
          />
        ))}
      </div>

      {/* Optional Chart */}
      {chart && chart.data.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{chart.label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={200}>
              {chart.type === "line" ? (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)
                    }
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chart.dataKey}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)
                    }
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Bar dataKey={chart.dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
