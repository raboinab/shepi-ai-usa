import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar } from "recharts";
import { AlertCircle, FolderOpen, Banknote, Calculator, Target, PenTool, FileText, ArrowUpDown, Receipt, Percent, Package, Layers, AlertTriangle, CheckCircle2, Scale, Shield, CreditCard, Building2, Wallet, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { $ as reclassAwareAdjustedEBITDA, O as calcNWCExCash, N as sumByLineItem, a0 as calcNetWorkingCapital, a1 as calcTotalCurrentAssets, a2 as calcTotalCurrentLiabilities, a3 as reclassAwareOtherExpense, a4 as reclassAwareRevenue, a5 as reclassAwareOpEx, a6 as reclassAwareOperatingIncome, a7 as reclassAwareCOGS, a8 as reclassAwareGrossProfit, a9 as getSubAccounts, aa as bsCheckPasses, ab as calcTotalAssets, ac as calcTotalLiabilitiesAndEquity, ad as calcTotalLiabilities, ae as calcTotalEquity, af as reclassAwareNetIncome } from "./sanitizeWizardData-nrsUY-BP.js";
import { c as computeQoEMetrics } from "./InsightsView-BkA7fJjp.js";
const ICON_MAP = {
  TrendingUp,
  DollarSign,
  BarChart3,
  Wallet,
  Building2,
  CreditCard,
  Shield,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  Percent,
  Receipt,
  ArrowUpDown,
  FileText,
  PenTool,
  Target,
  Calculator,
  Banknote,
  FolderOpen,
  AlertCircle
};
const ReportDashboardHeader = ({ config }) => {
  const { cards, chart } = config;
  const gridCols = cards.length <= 2 ? "md:grid-cols-2" : cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: `grid grid-cols-1 ${gridCols} gap-3`, children: cards.map((card, i) => /* @__PURE__ */ jsx(
      SummaryCard,
      {
        title: card.title,
        value: card.value,
        subtitle: card.subtitle,
        icon: ICON_MAP[card.iconName],
        isCurrency: card.isCurrency !== false,
        trend: card.trend,
        trendValue: card.trendValue
      },
      i
    )) }),
    chart && chart.data.length > 1 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: chart.label }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "pb-4", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, children: chart.type === "line" ? /* @__PURE__ */ jsxs(LineChart, { data: chart.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tick: { fontSize: 11 }, className: "text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            tick: { fontSize: 11 },
            className: "text-muted-foreground",
            tickFormatter: (v) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
          }
        ),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value),
            contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" },
            labelStyle: { color: "hsl(var(--popover-foreground))" }
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: chart.dataKey,
            stroke: "hsl(var(--primary))",
            strokeWidth: 2,
            dot: { fill: "hsl(var(--primary))", r: 3 }
          }
        )
      ] }) : /* @__PURE__ */ jsxs(BarChart, { data: chart.data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tick: { fontSize: 11 }, className: "text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            tick: { fontSize: 11 },
            className: "text-muted-foreground",
            tickFormatter: (v) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
          }
        ),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value),
            contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" },
            labelStyle: { color: "hsl(var(--popover-foreground))" }
          }
        ),
        /* @__PURE__ */ jsx(Bar, { dataKey: chart.dataKey, fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
      ] }) }) })
    ] })
  ] });
};
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const pct = (n) => isNaN(n) ? "N/A" : `${(n * 100).toFixed(1)}%`;
function buildFYTrend(dd, metricFn) {
  return dd.deal.fiscalYears.map((fy) => {
    const pids = fy.periods.map((p) => p.id);
    return { label: fy.label, value: metricFn(dd.trialBalance, dd.reclassifications, pids) };
  });
}
function getReportDashboard(reportType, dd) {
  if (!dd || dd.trialBalance.length === 0) return null;
  const tb = dd.trialBalance;
  const adj = dd.adjustments;
  const ab = dd.addbacks;
  const rc = dd.reclassifications ?? [];
  const activePeriods = dd.deal.periods.filter((p) => !p.isStub);
  if (activePeriods.length === 0) return null;
  const ltmPids = activePeriods.slice(-12).map((p) => p.id);
  const lastPid = activePeriods[activePeriods.length - 1].id;
  switch (reportType) {
    case "incomeStatement":
    case "incomeStatementDetailed": {
      const revenue = reclassAwareRevenue(tb, rc, ltmPids);
      const grossProfit = reclassAwareGrossProfit(tb, rc, ltmPids);
      const opIncome = reclassAwareOperatingIncome(tb, rc, ltmPids);
      const netIncome = reclassAwareNetIncome(tb, rc, ltmPids);
      const grossMargin = revenue > 0 ? grossProfit / revenue : NaN;
      return {
        cards: [
          { title: "LTM Revenue", value: revenue, iconName: "TrendingUp", isCurrency: true },
          { title: "Gross Profit", value: grossProfit, iconName: "DollarSign", isCurrency: true, subtitle: `Margin: ${pct(grossMargin)}` },
          { title: "Operating Income", value: opIncome, iconName: "BarChart3", isCurrency: true },
          { title: "Net Income", value: netIncome, iconName: "Wallet", isCurrency: true }
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => reclassAwareRevenue(t, r, pids)),
          dataKey: "value",
          label: "Revenue"
        }
      };
    }
    case "balanceSheet":
    case "balanceSheetDetailed": {
      const totalAssets = calcTotalAssets(tb, lastPid);
      const totalLiab = calcTotalLiabilities(tb, lastPid);
      const equity = calcTotalEquity(tb, lastPid);
      const currentAssets = calcTotalCurrentAssets(tb, lastPid);
      const currentLiab = calcTotalCurrentLiabilities(tb, lastPid);
      const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : 0;
      return {
        cards: [
          { title: "Total Assets", value: totalAssets, iconName: "Building2", isCurrency: true },
          { title: "Total Liabilities", value: Math.abs(totalLiab), iconName: "CreditCard", isCurrency: true },
          { title: "Total Equity", value: Math.abs(equity), iconName: "Shield", isCurrency: true },
          { title: "Current Ratio", value: `${currentRatio.toFixed(2)}x`, iconName: "Scale", isCurrency: false }
        ]
      };
    }
    case "isbsReconciliation": {
      const bsCheck = bsCheckPasses(tb, lastPid);
      const totalAssets = calcTotalAssets(tb, lastPid);
      const totalLE = calcTotalLiabilitiesAndEquity(tb, lastPid);
      const variance = Math.abs(totalAssets + totalLE);
      return {
        cards: [
          { title: "BS Check", value: bsCheck ? "✓ Balanced" : "✗ Imbalanced", iconName: "CheckCircle2", isCurrency: false },
          { title: "Total Assets", value: totalAssets, iconName: "Building2", isCurrency: true },
          { title: "Liabilities + Equity", value: Math.abs(totalLE), iconName: "Scale", isCurrency: true },
          { title: "Variance", value: variance, iconName: "AlertTriangle", isCurrency: true }
        ]
      };
    }
    case "salesDetail": {
      const revenue = reclassAwareRevenue(tb, rc, ltmPids);
      const subAccounts = getSubAccounts(tb, "Revenue");
      return {
        cards: [
          { title: "LTM Revenue", value: revenue, iconName: "TrendingUp", isCurrency: true },
          { title: "Revenue Streams", value: subAccounts.length || "—", iconName: "Layers", isCurrency: false }
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => reclassAwareRevenue(t, r, pids)),
          dataKey: "value",
          label: "Revenue"
        }
      };
    }
    case "cogsDetail": {
      const revenue = reclassAwareRevenue(tb, rc, ltmPids);
      const cogs = reclassAwareCOGS(tb, rc, ltmPids);
      const grossProfit = reclassAwareGrossProfit(tb, rc, ltmPids);
      const grossMargin = revenue > 0 ? grossProfit / revenue : NaN;
      return {
        cards: [
          { title: "LTM COGS", value: cogs, iconName: "Package", isCurrency: true },
          { title: "Gross Profit", value: grossProfit, iconName: "DollarSign", isCurrency: true },
          { title: "Gross Margin", value: pct(grossMargin), iconName: "Percent", isCurrency: false }
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => reclassAwareCOGS(t, r, pids)),
          dataKey: "value",
          label: "COGS"
        }
      };
    }
    case "operatingExpenses": {
      const revenue = reclassAwareRevenue(tb, rc, ltmPids);
      const opex = reclassAwareOpEx(tb, rc, ltmPids);
      const opexRatio = revenue > 0 ? opex / revenue : NaN;
      const opIncome = reclassAwareOperatingIncome(tb, rc, ltmPids);
      const opMargin = revenue > 0 ? opIncome / revenue : NaN;
      return {
        cards: [
          { title: "LTM OpEx", value: opex, iconName: "Receipt", isCurrency: true },
          { title: "OpEx / Revenue", value: pct(opexRatio), iconName: "Percent", isCurrency: false },
          { title: "Operating Income", value: opIncome, iconName: "TrendingUp", isCurrency: true },
          { title: "Operating Margin", value: pct(opMargin), iconName: "BarChart3", isCurrency: false }
        ]
      };
    }
    case "otherExpenseIncome": {
      const otherExp = reclassAwareOtherExpense(tb, rc, ltmPids);
      return {
        cards: [
          { title: "LTM Other Expense (Income)", value: otherExp, iconName: "ArrowUpDown", isCurrency: true }
        ]
      };
    }
    case "qoeAnalysis": {
      const metrics = computeQoEMetrics(dd);
      const adjCount = metrics.adjustmentCount;
      return {
        cards: [
          { title: "Reported EBITDA", value: metrics.reportedEBITDA, iconName: "FileText", isCurrency: true },
          { title: "Total Adjustments", value: metrics.totalAdjustments, iconName: "PenTool", isCurrency: true, subtitle: `${adjCount} adjustment${adjCount !== 1 ? "s" : ""}` },
          { title: "Adjusted EBITDA", value: metrics.adjustedEBITDA, iconName: "Target", isCurrency: true }
        ],
        chart: {
          type: "bar",
          data: [
            { label: "Reported", value: metrics.reportedEBITDA },
            { label: "Adjustments", value: metrics.totalAdjustments },
            { label: "Adjusted", value: metrics.adjustedEBITDA }
          ],
          dataKey: "value",
          label: "EBITDA Bridge"
        }
      };
    }
    case "workingCapital": {
      const nwc = calcNetWorkingCapital(tb, lastPid);
      const nwcExCash = calcNWCExCash(tb, lastPid);
      const currentAssets = calcTotalCurrentAssets(tb, lastPid);
      const currentLiab = calcTotalCurrentLiabilities(tb, lastPid);
      const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : 0;
      return {
        cards: [
          { title: "Net Working Capital", value: nwc, iconName: "Wallet", isCurrency: true },
          { title: "NWC (ex. Cash)", value: nwcExCash, iconName: "Calculator", isCurrency: true },
          { title: "Current Ratio", value: `${currentRatio.toFixed(2)}x`, iconName: "Scale", isCurrency: false }
        ],
        chart: {
          type: "bar",
          data: activePeriods.slice(-12).map((p) => ({
            label: p.shortLabel,
            value: calcNWCExCash(tb, p.id)
          })),
          dataKey: "value",
          label: "NWC (ex. Cash)"
        }
      };
    }
    case "cashAnalysis": {
      const cashBalance = sumByLineItem(tb, "Cash and cash equivalents", lastPid);
      const priorPid = activePeriods.length >= 2 ? activePeriods[activePeriods.length - 2].id : lastPid;
      const priorCash = sumByLineItem(tb, "Cash and cash equivalents", priorPid);
      const cashChange = cashBalance - priorCash;
      return {
        cards: [
          { title: "Cash Balance", value: cashBalance, iconName: "Banknote", isCurrency: true },
          { title: "Cash Change (MoM)", value: cashChange, iconName: "ArrowUpDown", isCurrency: true, trend: cashChange > 0 ? "up" : cashChange < 0 ? "down" : "neutral", trendValue: fmt(Math.abs(cashChange)) }
        ],
        chart: {
          type: "line",
          data: activePeriods.slice(-12).map((p) => ({
            label: p.shortLabel,
            value: sumByLineItem(tb, "Cash and cash equivalents", p.id)
          })),
          dataKey: "value",
          label: "Cash Balance"
        }
      };
    }
    case "otherCurrentAssets": {
      const oca = sumByLineItem(tb, "Other current assets", lastPid);
      const ar = sumByLineItem(tb, "Accounts receivable", lastPid);
      return {
        cards: [
          { title: "Other Current Assets", value: oca, iconName: "FolderOpen", isCurrency: true },
          { title: "Accounts Receivable", value: ar, iconName: "FileText", isCurrency: true }
        ]
      };
    }
    case "otherCurrentLiabilities": {
      const ocl = sumByLineItem(tb, "Other current liabilities", lastPid);
      const cl = sumByLineItem(tb, "Current liabilities", lastPid);
      return {
        cards: [
          { title: "Other Current Liabilities", value: Math.abs(ocl), iconName: "AlertCircle", isCurrency: true },
          { title: "Current Liabilities", value: Math.abs(cl), iconName: "CreditCard", isCurrency: true }
        ]
      };
    }
    case "freeCashFlow": {
      const adjEBITDA = reclassAwareAdjustedEBITDA(tb, rc, adj, ltmPids, ab);
      const nwcStart = calcNWCExCash(tb, ltmPids[0]);
      const nwcEnd = calcNWCExCash(tb, ltmPids[ltmPids.length - 1]);
      const nwcDelta = nwcEnd - nwcStart;
      return {
        cards: [
          { title: "Adj. EBITDA (LTM)", value: adjEBITDA, iconName: "TrendingUp", isCurrency: true },
          { title: "NWC Change", value: nwcDelta, iconName: "ArrowUpDown", isCurrency: true }
        ]
      };
    }
    default:
      return null;
  }
}
export {
  ReportDashboardHeader as R,
  getReportDashboard as g
};
