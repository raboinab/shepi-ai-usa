import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { GripVertical, DollarSign, TrendingUp, Percent, TrendingDown, CheckCircle, FileWarning, HardHat, XCircle, Lightbulb, Info, AlertTriangle, Database, FileSpreadsheet, Wallet, BookOpen, Users, Building, Clock, Package, FileText, Briefcase, Scale, Bot, Trash2, PanelRightClose, Sparkles, User, Loader2, Send, Calendar, AlertCircle, ChevronUp, ChevronDown, Circle } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { m as cn, C as Card, f as CardContent, b as CardHeader, d as CardTitle, B as Button, s as supabase } from "../main.mjs";
import { d as buildTopVendorsGrid, e as buildTopCustomersGrid, f as buildFixedAssetsGrid, h as buildAPAgingGrid, i as buildARAgingGrid, j as buildPayrollGrid, k as buildISBSReconciliationGrid, m as buildFreeCashFlowGrid, n as buildOtherCurrentLiabilitiesGrid, o as buildOtherCurrentAssetsGrid, q as buildCashGrid, r as buildNWCAnalysisGrid, t as buildWorkingCapitalGrid, v as buildQoEAnalysisGrid, w as buildOtherExpenseGrid, x as buildOpExGrid, y as buildCOGSGrid, z as buildSalesGrid, A as buildBSDetailedGrid, B as buildBalanceSheetGrid, C as buildISDetailedGrid, D as buildIncomeStatementGrid, E as gridDataToRawData, F as calcRevenue, G as calcGrossProfit, H as calcNetIncome, I as calcReportedEBITDA, J as calcAdjustedEBITDA, K as sumReclassImpact, L as computeWIPAggregates, M as computeSign, N as sumByLineItem, O as calcNWCExCash, P as assessEbitdaMargin, u as useChatHistory, c as getIndustryContext, s as sanitizeWizardData, p as projectToDealData } from "./sanitizeWizardData-nrsUY-BP.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar, AreaChart, ReferenceLine, Area } from "recharts";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { parseISO, differenceInMonths, formatDistanceToNow, format } from "date-fns";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";
import { I as Input } from "./input-CSM87NBF.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
const REPORT_BUILDERS = {
  incomeStatement: buildIncomeStatementGrid,
  incomeStatementDetailed: buildISDetailedGrid,
  balanceSheet: buildBalanceSheetGrid,
  balanceSheetDetailed: buildBSDetailedGrid,
  salesDetail: buildSalesGrid,
  cogsDetail: buildCOGSGrid,
  operatingExpenses: buildOpExGrid,
  otherExpenseIncome: buildOtherExpenseGrid,
  qoeAnalysis: buildQoEAnalysisGrid,
  workingCapital: buildWorkingCapitalGrid,
  nwcAnalysis: buildNWCAnalysisGrid,
  cashAnalysis: buildCashGrid,
  otherCurrentAssets: buildOtherCurrentAssetsGrid,
  otherCurrentLiabilities: buildOtherCurrentLiabilitiesGrid,
  freeCashFlow: buildFreeCashFlowGrid,
  isbsReconciliation: buildISBSReconciliationGrid,
  payroll: buildPayrollGrid,
  arAging: buildARAgingGrid,
  apAging: buildAPAgingGrid,
  fixedAssets: buildFixedAssetsGrid,
  topCustomers: buildTopCustomersGrid,
  topVendors: buildTopVendorsGrid
};
function buildWizardReports(dealData) {
  const result = {};
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const [key, builder] of Object.entries(REPORT_BUILDERS)) {
    try {
      const gridData = builder(dealData);
      result[key] = {
        rawData: gridDataToRawData(gridData),
        syncedAt: now
      };
    } catch (e) {
      console.warn(`Failed to build wizard report "${key}":`, e);
      result[key] = { rawData: [] };
    }
  }
  return result;
}
const ResizablePanelGroup = ({ className, ...props }) => /* @__PURE__ */ jsx(
  ResizablePrimitive.PanelGroup,
  {
    className: cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className),
    ...props
  }
);
const ResizablePanel = ResizablePrimitive.Panel;
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  ResizablePrimitive.PanelResizeHandle,
  {
    className: cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    ),
    ...props,
    children: withHandle && /* @__PURE__ */ jsx("div", { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border", children: /* @__PURE__ */ jsx(GripVertical, { className: "h-2.5 w-2.5" }) })
  }
);
const EMPTY = {
  revenue: 0,
  grossProfit: 0,
  netIncome: 0,
  reportedEBITDA: 0,
  totalAdjustments: 0,
  adjustedEBITDA: 0,
  adjustmentCount: 0,
  ltmPeriodIds: []
};
function computeQoEMetrics(dealData) {
  if (!dealData) return EMPTY;
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const rc = dealData.reclassifications ?? [];
  const activePeriods = dealData.deal.periods.filter((p) => !p.isStub);
  if (activePeriods.length === 0 || tb.length === 0) return EMPTY;
  const ltmPids = activePeriods.slice(-12).map((p) => p.id);
  let revenue = -ltmPids.reduce((s, p) => s + calcRevenue(tb, p), 0);
  let grossProfit = -ltmPids.reduce((s, p) => s + calcGrossProfit(tb, p), 0);
  let netIncome = -ltmPids.reduce((s, p) => s + calcNetIncome(tb, p), 0);
  let reportedEBITDA = -ltmPids.reduce((s, p) => s + calcReportedEBITDA(tb, p, ab), 0);
  let adjustedEBITDA = -ltmPids.reduce((s, p) => s + calcAdjustedEBITDA(tb, adj, p, ab), 0);
  if (rc.length > 0) {
    for (const pid of ltmPids) {
      const revReclass = sumReclassImpact(rc, "Revenue", pid);
      const cogsReclass = sumReclassImpact(rc, "Cost of Goods Sold", pid);
      const opexReclass = sumReclassImpact(rc, "Operating expenses", pid);
      const payrollReclass = sumReclassImpact(rc, "Payroll & Related", pid);
      const otherReclass = sumReclassImpact(rc, "Other expense (income)", pid);
      revenue += -revReclass;
      grossProfit += -(revReclass + cogsReclass);
      const totalISReclass = revReclass + cogsReclass + opexReclass + payrollReclass + otherReclass;
      netIncome += -totalISReclass;
      reportedEBITDA += -totalISReclass;
      adjustedEBITDA += -totalISReclass;
    }
  }
  const totalAdjustments = adjustedEBITDA - reportedEBITDA;
  const adjEntries = Array.isArray(adj) ? adj : Object.values(adj);
  let adjustmentCount = adjEntries.filter((a) => {
    if (!a) return false;
    const entry = a;
    const pv = entry.periodValues || entry.proposed_period_values || entry.amounts || {};
    const total = Object.values(pv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    return total !== 0;
  }).length;
  if (adjustmentCount === 0 && totalAdjustments !== 0) adjustmentCount = -1;
  return { revenue, grossProfit, netIncome, reportedEBITDA, totalAdjustments, adjustedEBITDA, adjustmentCount, ltmPeriodIds: ltmPids };
}
const getLatestValue$2 = (item, keyedField) => {
  const direct = item.currentYear;
  if (typeof direct === "number" && direct !== 0) return direct;
  const keyed = item[keyedField];
  if (keyed && typeof keyed === "object") {
    const years = Object.keys(keyed).sort();
    if (years.length > 0) return keyed[years[years.length - 1]] || 0;
  }
  return 0;
};
const countRedFlags = (wizardData) => {
  const flags = [];
  const topCustomers = wizardData.topCustomers;
  if (topCustomers?.customers?.length) {
    const customerRevenue = topCustomers.customers.reduce((sum, c) => sum + getLatestValue$2(c, "yearlyRevenue"), 0);
    const totalRevenue = topCustomers.totalRevenue || customerRevenue || 1;
    const top1Pct = getLatestValue$2(topCustomers.customers[0], "yearlyRevenue") / totalRevenue * 100;
    if (top1Pct > 40) flags.push("Customer concentration");
  }
  const topVendors = wizardData.topVendors;
  if (topVendors?.vendors?.length) {
    const vendorSpend = topVendors.vendors.reduce((sum, v) => sum + getLatestValue$2(v, "yearlySpend"), 0);
    const totalSpend = topVendors.totalSpend || vendorSpend || 1;
    const top1Pct = getLatestValue$2(topVendors.vendors[0], "yearlySpend") / totalSpend * 100;
    if (top1Pct > 40) flags.push("Vendor concentration");
  }
  const arAging = wizardData.arAging;
  const latestAR = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = latestAR?.entries;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => {
      const computed = (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0);
      return sum + Math.abs(e.total || computed);
    }, 0);
    if (arTotal > 0 && arOver90 / arTotal * 100 > 40) flags.push("AR quality");
  }
  const supplementary = wizardData.supplementary;
  const probableCount = supplementary?.contingentLiabilities?.items?.filter((c) => c.probability === "Probable").length || 0;
  if (probableCount > 0) flags.push("Contingent liabilities");
  const materialContracts = wizardData.materialContracts;
  const cocCount = materialContracts?.contracts?.filter((c) => c.hasCoC || c.cocDetails)?.length || 0;
  if (cocCount > 0) flags.push("CoC provisions");
  return { count: flags.length, details: flags };
};
const MetricsOverview = ({ dealData, wizardData }) => {
  const qoe = computeQoEMetrics(dealData);
  const revenue = qoe.revenue;
  const grossProfit = qoe.grossProfit;
  const grossMargin = revenue !== 0 ? grossProfit / revenue * 100 : void 0;
  const ebitda = qoe.reportedEBITDA;
  const totalAdjustments = qoe.totalAdjustments;
  const adjustedEbitda = qoe.adjustedEBITDA;
  const adjustmentCount = qoe.adjustmentCount;
  const { count: redFlagCount, details: redFlagDetails } = countRedFlags(wizardData);
  const wipAgg = computeWIPAggregates(dealData);
  const formatCurrency = (value) => {
    if (value === void 0 || value === 0) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };
  const formatPercent = (value) => {
    if (value === void 0) return "—";
    return `${value.toFixed(1)}%`;
  };
  const hasRevenue = revenue !== 0;
  const metrics = [
    {
      label: "LTM Revenue",
      value: formatCurrency(hasRevenue ? revenue : void 0),
      icon: DollarSign
    },
    {
      label: "Adjusted EBITDA",
      value: formatCurrency(adjustedEbitda),
      icon: TrendingUp,
      subtext: ebitda !== 0 ? `Reported: ${formatCurrency(ebitda)}` : void 0
    },
    {
      label: "Gross Margin",
      value: formatPercent(hasRevenue ? grossMargin : void 0),
      icon: Percent
    },
    {
      label: "Total Adjustments",
      value: formatCurrency(totalAdjustments || void 0),
      icon: totalAdjustments >= 0 ? TrendingUp : TrendingDown,
      subtext: `${adjustmentCount >= 0 ? adjustmentCount : "?"} items`
    },
    {
      label: "Adjustment Count",
      value: `${adjustmentCount >= 0 ? adjustmentCount : "—"}`,
      icon: CheckCircle
    },
    {
      label: "Red Flags",
      value: String(redFlagCount),
      icon: FileWarning,
      subtext: redFlagCount > 0 ? redFlagDetails.slice(0, 2).join(", ") : "No issues detected"
    }
  ];
  if (wipAgg) {
    metrics.push({
      label: "Net Over/(Under) Billing",
      value: formatCurrency(wipAgg.netOverUnder),
      icon: HardHat,
      subtext: `${wipAgg.jobCount} jobs tracked`
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", children: metrics.map((metric) => /* @__PURE__ */ jsx(Card, { className: "bg-card", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground mb-2", children: [
      /* @__PURE__ */ jsx(metric.icon, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: metric.label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-xl font-bold", children: metric.value }),
    metric.subtext && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: metric.subtext })
  ] }) }, metric.label)) });
};
function signedAdjustmentTotal(adj) {
  const sign = computeSign(adj.intent || "remove_expense");
  const raw = adj.periodValues ? Object.values(adj.periodValues).reduce((s, v) => s + (Number(v) || 0), 0) : adj.amount || 0;
  return raw * sign;
}
function parseAgingTrend(periodData) {
  return [...periodData].sort((a, b) => a.periodId.localeCompare(b.periodId)).map((p) => {
    let totalBalance = 0;
    let total90plus = 0;
    for (const e of p.entries) {
      const entryTotal = (e.current ?? 0) + (e.days1to30 ?? 0) + (e.days31to60 ?? 0) + (e.days61to90 ?? 0) + (e.days90plus ?? 0);
      totalBalance += e.total ?? entryTotal;
      total90plus += e.days90plus ?? 0;
    }
    const pct90plus = totalBalance > 0 ? Math.round(total90plus / totalBalance * 100) : 0;
    const label = p.periodId.replace(/^as_of_/, "").replace(/(\d{4})-(\d{2})/, (_, y, m) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(m, 10) - 1] || m} ${y}`;
    });
    return { period: label, totalBalance, pct90plus };
  }).filter((d) => d.totalBalance !== 0);
}
function parseConcentrationTrend(entities, key) {
  const yearMap = {};
  for (const e of entities) {
    const yearly = e[key];
    if (!yearly) continue;
    for (const [year, amount] of Object.entries(yearly)) {
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(amount);
    }
  }
  return Object.entries(yearMap).sort(([a], [b]) => a.localeCompare(b)).map(([year, amounts]) => {
    const sorted = [...amounts].sort((a, b) => b - a);
    const total = sorted.reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    const top1 = Math.round(sorted[0] / total * 100);
    const top5 = Math.round(sorted.slice(0, 5).reduce((s, v) => s + v, 0) / total * 100);
    return { year, top1, top5 };
  }).filter(Boolean);
}
const ChartPanel = ({ dealData, wizardData, wizardReports }) => {
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;
  const periodData = periods.map((p) => {
    const rev = sumByLineItem(trialBalance, "Revenue", p.id);
    return {
      name: p.shortLabel,
      revenue: Math.abs(rev),
      ebitda: -calcReportedEBITDA(trialBalance, p.id, dealData.addbacks)
    };
  }).filter((d) => d.revenue !== 0 || d.ebitda !== 0);
  const ddAdj = wizardData.ddAdjustments;
  const adjustments = ddAdj?.adjustments || [];
  const latestFY = deal.fiscalYears[deal.fiscalYears.length - 1];
  const bridgePeriodIds = latestFY?.periods.map((p) => p.id) || periods.map((p) => p.id);
  const totalEbitda = bridgePeriodIds.reduce(
    (sum, pid) => sum + -calcReportedEBITDA(trialBalance, pid, dealData.addbacks),
    0
  );
  const bridgeData = [
    { name: "Reported EBITDA", value: totalEbitda, fill: "hsl(var(--primary))" },
    ...adjustments.slice(0, 5).map((adj) => {
      const adjTotal = signedAdjustmentTotal(adj);
      return {
        name: (adj.description || adj.label || adj.name || "Adjustment").substring(0, 15),
        value: adjTotal,
        fill: adjTotal >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"
      };
    }),
    ...adjustments.length > 0 ? [{
      name: "Adjusted EBITDA",
      value: totalEbitda + adjustments.reduce((sum, adj) => sum + signedAdjustmentTotal(adj), 0),
      fill: "hsl(var(--primary))"
    }] : []
  ];
  const nwcData = periods.map((p) => {
    const nwc = calcNWCExCash(trialBalance, p.id);
    return { period: p.shortLabel, nwc };
  }).filter((d) => d.nwc !== 0);
  const nwcValues = nwcData.map((d) => d.nwc);
  const nwcAvg = nwcValues.length > 0 ? nwcValues.reduce((a, b) => a + b, 0) / nwcValues.length : 0;
  const arAging = wizardData.arAging;
  const apAging = wizardData.apAging;
  const arTrend = arAging?.periodData ? parseAgingTrend(arAging.periodData) : [];
  const apTrend = apAging?.periodData ? parseAgingTrend(apAging.periodData) : [];
  const topCustomers = wizardData.topCustomers;
  const topVendors = wizardData.topVendors;
  const custConc = topCustomers?.customers ? parseConcentrationTrend(topCustomers.customers, "yearlyRevenue") : [];
  const vendorConc = topVendors?.vendors ? parseConcentrationTrend(topVendors.vendors, "yearlySpend") : [];
  const hasNwcData = nwcData.length > 0;
  const hasPeriodData = periodData.length > 0;
  const hasBridgeData = bridgeData.length > 1;
  const emptyState = (msg) => /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground text-sm text-center px-4", children: msg });
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Financial Trends" }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "trend", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-4 h-auto flex-wrap", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "trend", children: "Revenue & EBITDA" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "bridge", children: "EBITDA Bridge" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "nwc", children: "NWC Trend" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "arAging", children: "AR Aging" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "apAging", children: "AP Aging" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "custConc", children: "Cust. Conc." }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "vendorConc", children: "Vendor Conc." })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "trend", className: "h-[300px]", children: hasPeriodData ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: periodData, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "name", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { className: "text-xs", tickFormatter: (value) => `$${(value / 1e6).toFixed(1)}M` }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => [`$${value.toLocaleString()}`, ""],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { r: 4 } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "ebitda", stroke: "hsl(var(--chart-2))", strokeWidth: 2, dot: { r: 4 } })
      ] }) }) : emptyState("No period data available") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "bridge", className: "h-[300px]", children: hasBridgeData ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: bridgeData, layout: "vertical", children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: (value) => `$${(value / 1e6).toFixed(1)}M`, className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 120, className: "text-xs" }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => [`$${value.toLocaleString()}`, "Amount"],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0] })
      ] }) }) : emptyState("No adjustment data available") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "nwc", className: "h-[300px]", children: hasNwcData ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: nwcData, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "period", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { className: "text-xs", tickFormatter: (value) => `$${(value / 1e6).toFixed(1)}M` }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => [`$${value.toLocaleString()}`, "NWC"],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(
          ReferenceLine,
          {
            y: nwcAvg,
            stroke: "hsl(var(--chart-4))",
            strokeDasharray: "5 5",
            label: { value: "Avg", position: "right", className: "text-xs fill-chart-4" }
          }
        ),
        /* @__PURE__ */ jsx(
          Area,
          {
            type: "monotone",
            dataKey: "nwc",
            stroke: "hsl(var(--chart-3))",
            fill: "hsl(var(--chart-3))",
            fillOpacity: 0.3,
            strokeWidth: 2
          }
        )
      ] }) }) : emptyState("Complete NWC Analysis to see working capital trends") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "arAging", className: "h-[300px]", children: arTrend.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: arTrend, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "period", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "left", className: "text-xs", tickFormatter: (v) => `$${(v / 1e6).toFixed(1)}M` }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "right", orientation: "right", className: "text-xs", tickFormatter: (v) => `${v}%` }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value, name) => [
              name === "pct90plus" ? `${value}%` : `$${value.toLocaleString()}`,
              name === "pct90plus" ? "90+ Days %" : "Total AR"
            ],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "totalBalance", name: "Total AR", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { r: 3 } }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "pct90plus", name: "90+ Days %", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: { r: 3 }, strokeDasharray: "5 5" })
      ] }) }) : emptyState("Sync QuickBooks or upload multiple periods to see AR aging trends") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "apAging", className: "h-[300px]", children: apTrend.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: apTrend, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "period", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "left", className: "text-xs", tickFormatter: (v) => `$${(v / 1e6).toFixed(1)}M` }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "right", orientation: "right", className: "text-xs", tickFormatter: (v) => `${v}%` }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value, name) => [
              name === "pct90plus" ? `${value}%` : `$${value.toLocaleString()}`,
              name === "pct90plus" ? "90+ Days %" : "Total AP"
            ],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "totalBalance", name: "Total AP", stroke: "hsl(var(--chart-3))", strokeWidth: 2, dot: { r: 3 } }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "pct90plus", name: "90+ Days %", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: { r: 3 }, strokeDasharray: "5 5" })
      ] }) }) : emptyState("Sync QuickBooks or upload multiple periods to see AP aging trends") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "custConc", className: "h-[300px]", children: custConc.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: custConc, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "year", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { className: "text-xs", tickFormatter: (v) => `${v}%`, domain: [0, 100] }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value, name) => [`${value}%`, name],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "top1", name: "Top Customer %", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: { r: 3 } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "top5", name: "Top 5 Customers %", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { r: 3 } })
      ] }) }) : emptyState("Sync QuickBooks or upload customer data to see concentration trends") }),
      /* @__PURE__ */ jsx(TabsContent, { value: "vendorConc", className: "h-[300px]", children: vendorConc.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: vendorConc, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "year", className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { className: "text-xs", tickFormatter: (v) => `${v}%`, domain: [0, 100] }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value, name) => [`${value}%`, name],
            contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "top1", name: "Top Vendor %", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: { r: 3 } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "top5", name: "Top 5 Vendors %", stroke: "hsl(var(--chart-3))", strokeWidth: 2, dot: { r: 3 } })
      ] }) }) : emptyState("Sync QuickBooks or upload vendor data to see concentration trends") })
    ] }) })
  ] });
};
const AdjustmentsSummary = ({ wizardData }) => {
  const ddAdj = wizardData.ddAdjustments;
  const adjustments = ddAdj?.adjustments || [];
  const withTotals = adjustments.map((adj) => ({
    ...adj,
    totalAmount: signedAdjustmentTotal(adj)
  }));
  const sortedAdjustments = [...withTotals].sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount)).slice(0, 8);
  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };
  return /* @__PURE__ */ jsxs(Card, { className: "h-full", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center justify-between", children: [
      "Top Adjustments",
      /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "font-normal", children: [
        adjustments.length,
        " total"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ScrollArea, { className: "h-[280px]", children: sortedAdjustments.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: sortedAdjustments.map((adj, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-full ${adj.totalAmount >= 0 ? "bg-chart-2/20 text-chart-2" : "bg-chart-1/20 text-chart-1"}`, children: adj.totalAmount >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: adj.description || adj.label || adj.name || "Adjustment" }),
              (adj.block || adj.category) && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs mt-1", children: adj.block || adj.category })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("div", { className: `font-semibold ${adj.totalAmount >= 0 ? "text-chart-2" : "text-chart-1"}`, children: formatCurrency(adj.totalAmount) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-1", children: [
              adj.approved ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 text-chart-2" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 text-muted-foreground" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: adj.approved ? "Approved" : "Pending" })
            ] })
          ] })
        ]
      },
      index
    )) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: "No adjustments recorded yet" }) }) })
  ] });
};
const getLatestValue$1 = (item, keyedField) => {
  const direct = item.currentYear;
  if (typeof direct === "number" && direct !== 0) return direct;
  const keyed = item[keyedField];
  if (keyed && typeof keyed === "object") {
    const years = Object.keys(keyed).sort();
    if (years.length > 0) return keyed[years[years.length - 1]] || 0;
  }
  return 0;
};
const QuickInsights = ({ dealData, wizardData, industry }) => {
  const topCustomers = wizardData.topCustomers;
  const topVendors = wizardData.topVendors;
  const arAging = wizardData.arAging;
  const supplementary = wizardData.supplementary;
  const materialContracts = wizardData.materialContracts;
  const { trialBalance, deal } = dealData;
  const periods = deal.periods;
  const latestFY = deal.fiscalYears[deal.fiscalYears.length - 1];
  const latestPeriodIds = latestFY?.periods.map((p) => p.id) || periods.map((p) => p.id);
  const revenue = latestPeriodIds.reduce((sum, pid) => sum + sumByLineItem(trialBalance, "Revenue", pid), 0);
  const ebitda = latestPeriodIds.reduce(
    (sum, pid) => sum + calcReportedEBITDA(trialBalance, pid, dealData.addbacks),
    0
  );
  const insights = [];
  const today = /* @__PURE__ */ new Date();
  const customerRevenue = topCustomers?.customers?.reduce((sum, c) => sum + getLatestValue$1(c, "yearlyRevenue"), 0) || 0;
  const totalRevenue = topCustomers?.totalRevenue || customerRevenue || 1;
  const top1CustomerVal = topCustomers?.customers?.[0] ? getLatestValue$1(topCustomers.customers[0], "yearlyRevenue") : 0;
  const top1CustomerPct = top1CustomerVal ? top1CustomerVal / totalRevenue * 100 : 0;
  const top5CustomerPct = topCustomers?.customers?.slice(0, 5).reduce((sum, c) => sum + getLatestValue$1(c, "yearlyRevenue") / totalRevenue * 100, 0) || 0;
  if (top1CustomerPct > 30) {
    const name = topCustomers?.customers?.[0]?.name || "Unknown";
    insights.push({
      type: "warning",
      title: "High Customer Concentration",
      description: `Top customer (${name}) represents ${top1CustomerPct.toFixed(0)}% of revenue. Consider diversification risk.`
    });
  } else if (top5CustomerPct > 60) {
    insights.push({
      type: "warning",
      title: "Customer Concentration Risk",
      description: `Top 5 customers represent ${top5CustomerPct.toFixed(0)}% of revenue. Moderate concentration risk.`
    });
  }
  const vendorSpend = topVendors?.vendors?.reduce((sum, v) => sum + getLatestValue$1(v, "yearlySpend"), 0) || 0;
  const totalSpend = topVendors?.totalSpend || vendorSpend || 1;
  const top1VendorVal = topVendors?.vendors?.[0] ? getLatestValue$1(topVendors.vendors[0], "yearlySpend") : 0;
  const top1VendorPct = top1VendorVal ? top1VendorVal / totalSpend * 100 : 0;
  if (top1VendorPct > 40) {
    const name = topVendors?.vendors?.[0]?.name || "Unknown";
    insights.push({
      type: "warning",
      title: "Vendor Dependency Risk",
      description: `Top vendor (${name}) represents ${top1VendorPct.toFixed(0)}% of spend. Supply chain risk.`
    });
  }
  const latestARPeriod = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = latestARPeriod?.entries;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => {
      const computed = (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0);
      return sum + Math.abs(e.total || computed);
    }, 0);
    const over90Pct = arTotal > 0 ? arOver90 / arTotal * 100 : 0;
    const over60 = arEntries.reduce((sum, e) => sum + Math.abs(e.days61to90 || 0) + Math.abs(e.days90plus || 0), 0);
    const over60Pct = arTotal > 0 ? over60 / arTotal * 100 : 0;
    if (over90Pct > 15) {
      insights.push({ type: "warning", title: "AR Quality Concern", description: `${over90Pct.toFixed(0)}% of receivables are over 90 days old. Review for bad debt exposure.` });
    } else if (over60Pct > 25) {
      insights.push({ type: "info", title: "AR Aging Alert", description: `${over60Pct.toFixed(0)}% of receivables are over 60 days. Monitor collection efforts.` });
    }
  }
  const debtItems = supplementary?.debtSchedule?.items || [];
  const upcomingMaturities = debtItems.filter((d) => d.maturityDate && d.balance).map((d) => ({ ...d, date: parseISO(d.maturityDate) })).filter((d) => differenceInMonths(d.date, today) <= 12 && d.date > today);
  if (upcomingMaturities.length > 0) {
    const totalMaturing = upcomingMaturities.reduce((sum, d) => sum + (d.balance || 0), 0);
    insights.push({ type: "warning", title: "Debt Maturities Approaching", description: `$${(totalMaturing / 1e6).toFixed(1)}M in debt matures within 12 months across ${upcomingMaturities.length} facility(ies).` });
  }
  const cocContracts = materialContracts?.contracts?.filter((c) => c.hasCoC || c.cocDetails) || [];
  if (cocContracts.length > 0) {
    insights.push({ type: "warning", title: "Change of Control Provisions", description: `${cocContracts.length} material contract(s) have change of control provisions that may affect the transaction.` });
  }
  const expiringContracts = materialContracts?.contracts?.filter((c) => c.expirationDate)?.map((c) => ({ ...c, date: parseISO(c.expirationDate) }))?.filter((c) => differenceInMonths(c.date, today) <= 6 && c.date > today) || [];
  if (expiringContracts.length > 0) {
    insights.push({ type: "info", title: "Contracts Expiring Soon", description: `${expiringContracts.length} material contract(s) expire within 6 months. Review renewal terms.` });
  }
  const probableContingent = supplementary?.contingentLiabilities?.items?.filter((c) => c.probability === "Probable") || [];
  if (probableContingent.length > 0) {
    const totalProbable = probableContingent.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
    insights.push({ type: "warning", title: "Probable Contingent Liabilities", description: `${probableContingent.length} probable contingency(ies) with estimated exposure of $${(totalProbable / 1e3).toFixed(0)}K.` });
  }
  const absRevenue = Math.abs(revenue);
  if (absRevenue > 0 && insights.length < 8) {
    insights.push({ type: "info", title: "LTM Revenue", description: `Total revenue of $${(absRevenue / 1e6).toFixed(1)}M recorded for the latest fiscal year.` });
  }
  const ddAdj = wizardData.ddAdjustments;
  const adjustments = ddAdj?.adjustments || [];
  if (adjustments.length > 0 && insights.length < 8) {
    const totalAdj = adjustments.reduce((sum, adj) => sum + signedAdjustmentTotal(adj), 0);
    const adjustmentPercent = absRevenue ? (totalAdj / absRevenue * 100).toFixed(1) : "N/A";
    insights.push({
      type: totalAdj >= 0 ? "success" : "warning",
      title: "Net Adjustments Impact",
      description: `${adjustments.length} adjustments totaling $${(totalAdj / 1e3).toFixed(0)}K (${adjustmentPercent}% of revenue).`
    });
  }
  if (ebitda !== 0 && absRevenue > 0 && insights.length < 8) {
    const margin = -ebitda / absRevenue * 100;
    const { assessment, rangeText, confidence } = industry ? assessEbitdaMargin(industry, margin) : { assessment: margin > 15 ? "above" : margin > 10 ? "within" : "below", rangeText: "vs general benchmarks", confidence: "low" };
    const confidenceNote = confidence === "high" ? "" : " (typical range)";
    insights.push({
      type: assessment === "above" ? "success" : assessment === "within" ? "info" : "warning",
      title: "EBITDA Margin",
      description: `Current EBITDA margin is ${margin.toFixed(1)}%, ${assessment} ${rangeText}${confidenceNote}.`
    });
  }
  const wipAgg = computeWIPAggregates(dealData);
  if (wipAgg && insights.length < 10) {
    if (Math.abs(wipAgg.netOverUnder) > 0) {
      const label = wipAgg.netOverUnder > 0 ? "over-billed" : "under-billed";
      insights.push({
        type: wipAgg.netOverUnder > 0 ? "warning" : "info",
        title: `Net ${label.charAt(0).toUpperCase() + label.slice(1)}`,
        description: `Net ${label} position of $${(Math.abs(wipAgg.netOverUnder) / 1e3).toFixed(0)}K across ${wipAgg.jobCount} jobs.`
      });
    }
    if (wipAgg.nearCompleteCount > 0) {
      insights.push({ type: "info", title: "Jobs Near Completion", description: `${wipAgg.nearCompleteCount} job(s) are >90% complete. Review for final billing and close-out.` });
    }
    if (wipAgg.concentrationPct > 25) {
      insights.push({ type: "warning", title: "Job Concentration Risk", description: `Largest job (${wipAgg.highConcentrationJob.jobName}) is ${wipAgg.concentrationPct.toFixed(0)}% of total contract value.` });
    }
  }
  if (insights.length === 0) {
    insights.push({ type: "info", title: "Getting Started", description: "Complete the wizard sections to generate financial insights and risk indicators." });
  }
  const getIcon = (type) => {
    switch (type) {
      case "warning":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" });
      case "success":
        return /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" });
      case "tip":
        return /* @__PURE__ */ jsx(Lightbulb, { className: "w-4 h-4" });
      default:
        return /* @__PURE__ */ jsx(Info, { className: "w-4 h-4" });
    }
  };
  const getColors = (type) => {
    switch (type) {
      case "warning":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "success":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "tip":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };
  return /* @__PURE__ */ jsxs(Card, { className: "h-full", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Lightbulb, { className: "w-5 h-5" }),
      "Quick Insights",
      insights.length > 1 && /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
        "(",
        insights.filter((i) => i.type === "warning").length,
        " alerts)"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ScrollArea, { className: "h-[280px]", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: insights.map((insight, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `p-3 rounded-lg border ${getColors(insight.type)}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-medium text-sm mb-1", children: [
            getIcon(insight.type),
            insight.title
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm opacity-90", children: insight.description })
        ]
      },
      index
    )) }) }) })
  ] });
};
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsx(TogglePrimitive.Root, { ref, className: cn(toggleVariants({ variant, size, className })), ...props }));
Toggle.displayName = TogglePrimitive.Root.displayName;
const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default"
});
const ToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => /* @__PURE__ */ jsx(ToggleGroupPrimitive.Root, { ref, className: cn("flex items-center justify-center gap-1", className), ...props, children: /* @__PURE__ */ jsx(ToggleGroupContext.Provider, { value: { variant, size }, children }) }));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
const ToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  return /* @__PURE__ */ jsx(
    ToggleGroupPrimitive.Item,
    {
      ref,
      className: cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        className
      ),
      ...props,
      children
    }
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
const DataExplorer = ({ wizardData, wizardReports }) => {
  const supplementary = wizardData.supplementary;
  const sections = [
    { key: "incomeStatement", label: "Income Statement", icon: FileSpreadsheet, reportKey: "incomeStatement" },
    { key: "balanceSheet", label: "Balance Sheet", icon: Wallet, reportKey: "balanceSheet" },
    { key: "qoeAnalysis", label: "QoE Adjustments", icon: Database, reportKey: "qoeAnalysis" },
    { key: "journalEntries", label: "Journal Entries", icon: BookOpen },
    { key: "topCustomers", label: "Top Customers", icon: Users },
    { key: "topVendors", label: "Top Vendors", icon: Building },
    { key: "arAging", label: "AR Aging", icon: Clock },
    { key: "apAging", label: "AP Aging", icon: Clock },
    { key: "fixedAssets", label: "Fixed Assets", icon: Package },
    { key: "materialContracts", label: "Material Contracts", icon: FileText },
    { key: "debtSchedule", label: "Debt Schedule", icon: Wallet },
    { key: "leaseObligations", label: "Leases", icon: Briefcase },
    { key: "contingentLiabilities", label: "Contingent", icon: Scale }
  ];
  const formatValue = (value) => {
    if (value === null || value === void 0) return "—";
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };
  const RawDataGrid = ({ rawData }) => {
    const [periodView, setPeriodView] = useState("summary");
    if (rawData.length < 2) {
      return /* @__PURE__ */ jsx("div", { className: "h-[200px] flex items-center justify-center text-muted-foreground", children: "No data available" });
    }
    const headers = rawData[0];
    const rows = rawData.slice(1);
    const summaryIndices = [0];
    const monthlyIndices = [0];
    headers.forEach((h, i) => {
      if (i === 0) return;
      if (/^(FY|LTM|YTD)/.test(h)) summaryIndices.push(i);
      else monthlyIndices.push(i);
    });
    const visibleIndices = periodView === "summary" ? summaryIndices : periodView === "monthly" ? monthlyIndices : headers.map((_, i) => i);
    const classifyRow = (row) => {
      const label = (row[0] ?? "").trim();
      const isAllCaps = label.length > 2 && label === label.toUpperCase() && /[A-Z]/.test(label);
      const valuesEmpty = row.slice(1).every((c) => !c || c === "—" || c === "-");
      if (isAllCaps && valuesEmpty) return "section";
      if (/^(Total|TOTAL)/.test(label)) return "total";
      return "data";
    };
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(ToggleGroup, { type: "single", value: periodView, onValueChange: (v) => v && setPeriodView(v), size: "sm", children: [
        /* @__PURE__ */ jsx(ToggleGroupItem, { value: "summary", className: "text-xs", children: "Summary" }),
        /* @__PURE__ */ jsx(ToggleGroupItem, { value: "monthly", className: "text-xs", children: "Monthly" }),
        /* @__PURE__ */ jsx(ToggleGroupItem, { value: "all", className: "text-xs", children: "All" })
      ] }),
      /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[400px]", children: [
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsx(TableRow, { children: visibleIndices.map((i) => /* @__PURE__ */ jsx(
            TableHead,
            {
              className: `text-xs whitespace-nowrap ${i === 0 ? "sticky left-0 bg-background z-10" : "text-right"}`,
              children: headers[i]
            },
            i
          )) }) }),
          /* @__PURE__ */ jsx(TableBody, { children: rows.slice(0, 50).map((row, ri) => {
            const rowType = classifyRow(row);
            const rowClass = rowType === "section" ? "bg-muted/60 font-bold" : rowType === "total" ? "font-semibold border-t border-border" : "";
            return /* @__PURE__ */ jsx(TableRow, { className: rowClass, children: visibleIndices.map((ci) => {
              const cell = row[ci] ?? "";
              const isLabelCol = ci === 0;
              let display;
              if (isLabelCol) {
                display = cell || "";
              } else if (rowType === "section") {
                display = "";
              } else {
                display = cell || "—";
              }
              return /* @__PURE__ */ jsx(
                TableCell,
                {
                  className: `text-sm whitespace-nowrap ${isLabelCol ? "sticky left-0 bg-background z-10 font-medium" : "text-right"}`,
                  children: display
                },
                ci
              );
            }) }, ri);
          }) })
        ] }),
        rows.length > 50 && /* @__PURE__ */ jsxs("div", { className: "text-center py-2 text-sm text-muted-foreground", children: [
          "And ",
          rows.length - 50,
          " more rows..."
        ] })
      ] })
    ] });
  };
  const getDataForSection = (sectionKey) => {
    if (["debtSchedule", "leaseObligations", "contingentLiabilities"].includes(sectionKey)) {
      const subData = supplementary?.[sectionKey];
      return subData?.items || [];
    }
    return wizardData[sectionKey];
  };
  const normalizeConcentrationItems = (items, totalAmount, entityKey) => {
    const amountField = entityKey === "customers" ? "yearlyRevenue" : "yearlySpend";
    return items.map((item, idx) => {
      const name = item.name || `#${idx + 1}`;
      let currentYear = 0;
      let priorYear = 0;
      if (typeof item.currentYear === "number") {
        currentYear = item.currentYear;
        priorYear = item.priorYear || 0;
      } else if (item[amountField] && typeof item[amountField] === "object") {
        const yearly = item[amountField];
        const years = Object.keys(yearly).sort().reverse();
        currentYear = yearly[years[0]] || 0;
        priorYear = yearly[years[1]] || 0;
      }
      const pctOfTotal = totalAmount ? currentYear / totalAmount * 100 : 0;
      const yoyChange = priorYear ? (currentYear - priorYear) / priorYear * 100 : 0;
      const isRelatedParty = !!item.isRelatedParty;
      return { name, currentYear, priorYear, pctOfTotal, yoyChange, isRelatedParty };
    });
  };
  const renderConcentrationTable = (items, sectionKey, totalAmount) => {
    const entityKey = sectionKey === "topCustomers" ? "customers" : "vendors";
    const normalized = normalizeConcentrationItems(items, totalAmount, entityKey);
    const sorted = normalized.sort((a, b) => b.currentYear - a.currentYear);
    const top1Pct = sorted[0]?.pctOfTotal || 0;
    const top5Pct = sorted.slice(0, 5).reduce((s, i) => s + i.pctOfTotal, 0);
    const top10Pct = sorted.slice(0, 10).reduce((s, i) => s + i.pctOfTotal, 0);
    const relatedCount = sorted.filter((i) => i.isRelatedParty).length;
    const formatPct = (v) => `${v.toFixed(1)}%`;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 px-1", children: [
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          "Top 1: ",
          formatPct(top1Pct)
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          "Top 5: ",
          formatPct(top5Pct)
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          "Top 10: ",
          formatPct(top10Pct)
        ] }),
        totalAmount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs", children: [
          "Total: ",
          formatValue(totalAmount)
        ] }),
        relatedCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "text-xs", children: [
          relatedCount,
          " Related Party"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[220px]", children: [
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs w-8", children: "#" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Name" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Current Year" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Prior Year" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "% of Total" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "YoY Chg" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: sorted.slice(0, 15).map((item, index) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground", children: index + 1 }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-sm font-medium", children: [
              item.name,
              item.isRelatedParty && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-2 text-[10px] px-1", children: "RP" })
            ] }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: formatValue(item.currentYear) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: formatValue(item.priorYear) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: formatPct(item.pctOfTotal) }),
            /* @__PURE__ */ jsx(TableCell, { className: `text-sm text-right ${item.yoyChange > 0 ? "text-green-600" : item.yoyChange < 0 ? "text-red-600" : ""}`, children: item.priorYear ? `${item.yoyChange > 0 ? "+" : ""}${item.yoyChange.toFixed(1)}%` : "—" })
          ] }, index)) })
        ] }),
        sorted.length > 15 && /* @__PURE__ */ jsxs("div", { className: "text-center py-2 text-sm text-muted-foreground", children: [
          "And ",
          sorted.length - 15,
          " more..."
        ] })
      ] })
    ] });
  };
  const renderArrayData = (items, sectionKey) => {
    if (items.length === 0) {
      return /* @__PURE__ */ jsx("div", { className: "h-[200px] flex items-center justify-center text-muted-foreground", children: "No items recorded" });
    }
    const firstItem = items[0];
    let columns = Object.keys(firstItem).filter((k) => !k.startsWith("_") && k !== "id");
    const priorityColumns = {
      arAging: ["name", "current", "days1to30", "days31to60", "days61to90", "days90plus", "total"],
      apAging: ["name", "current", "days1to30", "days31to60", "days61to90", "days90plus", "total"],
      fixedAssets: ["description", "category", "originalCost", "accumulatedDepreciation", "netBookValue"],
      materialContracts: ["counterparty", "type", "contractValue", "expirationDate", "hasCoC"],
      debtSchedule: ["lender", "balance", "interestRate", "maturityDate"],
      leaseObligations: ["description", "leaseType", "annualPayment", "expirationDate"],
      contingentLiabilities: ["description", "estimatedAmount", "probability"]
    };
    if (priorityColumns[sectionKey]) {
      columns = priorityColumns[sectionKey].filter((c) => columns.includes(c));
    }
    columns = columns.slice(0, 6);
    return /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[250px]", children: [
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsx(TableRow, { children: columns.map((col) => /* @__PURE__ */ jsx(TableHead, { className: "capitalize text-xs", children: col.replace(/([A-Z])/g, " $1").trim() }, col)) }) }),
        /* @__PURE__ */ jsx(TableBody, { children: items.slice(0, 10).map((item, index) => /* @__PURE__ */ jsx(TableRow, { children: columns.map((col) => /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: col === "hasCoC" ? item[col] ? /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "text-xs", children: "Yes" }) : /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: "No" }) : formatValue(item[col]) }, col)) }, index)) })
      ] }),
      items.length > 10 && /* @__PURE__ */ jsxs("div", { className: "text-center py-2 text-sm text-muted-foreground", children: [
        "And ",
        items.length - 10,
        " more items..."
      ] })
    ] });
  };
  const renderSectionData = (sectionKey, reportKey) => {
    if (reportKey && wizardReports?.[reportKey]?.rawData && wizardReports[reportKey].rawData.length > 1) {
      return /* @__PURE__ */ jsx(RawDataGrid, { rawData: wizardReports[reportKey].rawData });
    }
    if (sectionKey === "journalEntries") {
      const jeData = wizardData.journalEntries;
      const entries2 = jeData?.entries || [];
      if (entries2.length === 0) return /* @__PURE__ */ jsx("div", { className: "h-[200px] flex items-center justify-center text-muted-foreground", children: "No journal entries available" });
      const flatLines = entries2.flatMap((e) => e.lines.map((l) => ({ date: e.txnDate, jeId: e.id, account: l.accountName, debit: l.postingType === "DEBIT" ? l.amount : 0, credit: l.postingType === "CREDIT" ? l.amount : 0 })));
      return /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[400px]", children: [
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Date" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "JE #" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Account" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Debit" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Credit" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: flatLines.slice(0, 100).map((line, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: line.date }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm font-mono", children: line.jeId }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: line.account }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: line.debit ? formatValue(line.debit) : "" }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: line.credit ? formatValue(line.credit) : "" })
          ] }, i)) })
        ] }),
        flatLines.length > 100 && /* @__PURE__ */ jsxs("div", { className: "text-center py-2 text-sm text-muted-foreground", children: [
          "Showing 100 of ",
          flatLines.length,
          " lines..."
        ] })
      ] });
    }
    const data = getDataForSection(sectionKey);
    if (!data || Array.isArray(data) && data.length === 0 || typeof data === "object" && Object.keys(data).length === 0) {
      return /* @__PURE__ */ jsx("div", { className: "h-[200px] flex items-center justify-center text-muted-foreground", children: "No data available for this section" });
    }
    if (typeof data === "object" && !Array.isArray(data)) {
      const objData = data;
      if ((sectionKey === "arAging" || sectionKey === "apAging") && objData.periodData && Array.isArray(objData.periodData)) {
        const allEntries = objData.periodData.flatMap(
          (p) => (p.entries || []).map((e) => ({ ...e, period: p.periodId }))
        );
        if (allEntries.length > 0) return renderArrayData(allEntries, sectionKey);
      }
      if (objData.periodData && Array.isArray(objData.periodData)) return renderArrayData(objData.periodData, sectionKey);
      if (objData.adjustments && Array.isArray(objData.adjustments)) return renderArrayData(objData.adjustments, sectionKey);
      if (sectionKey === "topCustomers" && objData.customers && Array.isArray(objData.customers)) {
        return renderConcentrationTable(objData.customers, sectionKey, objData.totalRevenue || 0);
      }
      if (sectionKey === "topVendors" && objData.vendors && Array.isArray(objData.vendors)) {
        return renderConcentrationTable(objData.vendors, sectionKey, objData.totalSpend || 0);
      }
      if (objData.assets && Array.isArray(objData.assets)) return renderArrayData(objData.assets, sectionKey);
      if (objData.contracts && Array.isArray(objData.contracts)) return renderArrayData(objData.contracts, sectionKey);
    }
    if (Array.isArray(data)) return renderArrayData(data, sectionKey);
    const entries = Object.entries(data).filter(([key]) => !key.startsWith("_") && key !== "rawData");
    return /* @__PURE__ */ jsx(ScrollArea, { className: "h-[250px]", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Field" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: entries.slice(0, 15).map(([key, value]) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium capitalize", children: key.replace(/([A-Z])/g, " $1").trim() }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: typeof value === "object" && value !== null ? /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Object" }) : formatValue(value) })
      ] }, key)) })
    ] }) });
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Database, { className: "w-5 h-5" }),
      "Data Explorer"
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "incomeStatement", children: [
      /* @__PURE__ */ jsx(ScrollArea, { className: "w-full", children: /* @__PURE__ */ jsx(TabsList, { className: "mb-4 flex-wrap h-auto gap-1 w-max", children: sections.map((section) => /* @__PURE__ */ jsxs(TabsTrigger, { value: section.key, className: "gap-1.5 text-xs", children: [
        /* @__PURE__ */ jsx(section.icon, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ jsx("span", { className: "hidden lg:inline", children: section.label })
      ] }, section.key)) }) }),
      sections.map((section) => /* @__PURE__ */ jsx(TabsContent, { value: section.key, children: renderSectionData(section.key, section.reportKey) }, section.key))
    ] }) })
  ] });
};
const SUGGESTED_PROMPTS = [
  "Summarize the QoE findings",
  "What are the largest adjustments?",
  "Analyze the revenue trend",
  "Identify any red flags",
  "Explain the EBITDA bridge"
];
const AIAnalyst = ({ project, onCollapse }) => {
  const {
    messages: savedMessages,
    isLoading: isLoadingHistory,
    isAuthReady,
    saveMessages,
    clearHistory,
    hasHistory,
    oldestMessageDate
  } = useChatHistory({
    projectId: project.id,
    contextType: "insights"
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cimInsights, setCimInsights] = useState(null);
  const scrollRef = useRef(null);
  useEffect(() => {
    const fetchCimInsights = async () => {
      try {
        const { data, error } = await supabase.from("processed_data").select("data").eq("project_id", project.id).eq("data_type", "cim_insights").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!error && data?.data) {
          setCimInsights(data.data);
        }
      } catch (error) {
        console.error("Error fetching CIM insights:", error);
      }
    };
    fetchCimInsights();
  }, [project.id]);
  useEffect(() => {
    const checkAndTriggerIndexing = async () => {
      try {
        const { count: chunkCount } = await supabase.from("project_data_chunks").select("*", { count: "exact", head: true }).eq("project_id", project.id);
        if (chunkCount && chunkCount > 0) return;
        const { count: pdCount } = await supabase.from("processed_data").select("*", { count: "exact", head: true }).eq("project_id", project.id);
        if (!pdCount || pdCount === 0) return;
        console.log(`[AIAnalyst] No RAG chunks found but ${pdCount} processed_data records exist — triggering indexing`);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        fetch(
          `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/functions/v1/embed-project-data`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              project_id: project.id,
              data_types: null
              // all types
            })
          }
        ).then((res) => {
          if (res.ok) console.log("[AIAnalyst] RAG indexing triggered successfully");
          else console.error("[AIAnalyst] RAG indexing failed:", res.status);
        }).catch((err) => console.error("[AIAnalyst] RAG indexing error:", err));
      } catch (error) {
        console.error("[AIAnalyst] Error checking RAG index:", error);
      }
    };
    checkAndTriggerIndexing();
  }, [project.id]);
  useEffect(() => {
    if (!isLoadingHistory && isAuthReady) {
      if (savedMessages.length > 0) {
        setMessages(savedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      } else {
        setMessages([]);
      }
    }
  }, [isLoadingHistory, isAuthReady, savedMessages]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText.trim()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/functions/v1/insights-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68"}`
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content
            })),
            wizardData: sanitizeWizardData(project.wizard_data),
            projectInfo: {
              id: project.id,
              name: project.name,
              targetCompany: project.target_company,
              industry: project.industry,
              ...project.industry ? (() => {
                const ctx = getIndustryContext(project.industry);
                return { industryTraitsJson: ctx.traitsJson, industryNarrative: ctx.narrative };
              })() : {},
              periods: project.periods
            },
            // For Insights view, use the project's current section if available
            currentSection: project.current_phase && project.current_section ? {
              phase: project.current_phase,
              section: project.current_section,
              sectionName: "Insights Dashboard"
            } : void 0,
            cimInsights: cimInsights || void 0
          })
        }
      );
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Usage limit reached. Please add credits to continue.");
        }
        throw new Error("Failed to get response");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" }
      ]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(
                (prev) => prev.map(
                  (m) => m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
          }
        }
      }
      if (assistantContent) {
        await saveMessages(userMessage.content, assistantContent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleClearChat = async () => {
    const success = await clearHistory();
    if (success) {
      setMessages([]);
      toast.success("Chat history cleared");
    } else {
      toast.error("Failed to clear chat history");
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col bg-card border-l", children: [
    /* @__PURE__ */ jsx("div", { className: "p-4 border-b", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "AI Analyst" }),
          hasHistory && oldestMessageDate ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Conversation from ",
            formatDistanceToNow(oldestMessageDate, { addSuffix: true })
          ] }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Ask questions about your QoE analysis" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        hasHistory && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: handleClearChat,
            title: "Clear chat history",
            children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
          }
        ),
        onCollapse && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: onCollapse, title: "Collapse panel", children: /* @__PURE__ */ jsx(PanelRightClose, { className: "h-4 w-4" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(ScrollArea, { className: "flex-1 p-4", ref: scrollRef, children: [
      isLoadingHistory && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-8 text-muted-foreground gap-2", children: [
        /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Loading conversation..." })
      ] }),
      isAuthReady && !isLoadingHistory && messages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-12 h-12 text-muted-foreground mx-auto mb-4" }),
          /* @__PURE__ */ jsx("h4", { className: "font-medium mb-2", children: "Start a conversation" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "Ask me anything about your Quality of Earnings analysis" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase", children: "Suggested questions" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: SUGGESTED_PROMPTS.map((prompt) => /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: "cursor-pointer hover:bg-accent transition-colors",
              onClick: () => sendMessage(prompt),
              children: prompt
            },
            prompt
          )) })
        ] })
      ] }) : messages.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        messages.map((message) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`,
            children: [
              message.role === "assistant" && /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-primary/10 h-fit", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
              /* @__PURE__ */ jsx(
                Card,
                {
                  className: `max-w-[90%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border-l-2 border-primary/30"}`,
                  children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: message.role === "assistant" ? /* @__PURE__ */ jsx("div", { className: "text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5 [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-3 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-3 [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-2 [&>table]:text-xs [&>blockquote]:border-l-2 [&>blockquote]:border-muted-foreground/30 [&>blockquote]:pl-3 [&>blockquote]:text-muted-foreground", children: /* @__PURE__ */ jsx(ReactMarkdown, { children: message.content }) }) : /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap", children: message.content }) })
                }
              ),
              message.role === "user" && /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-primary h-fit", children: /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-primary-foreground" }) })
            ]
          },
          message.id
        )),
        isLoading && messages[messages.length - 1]?.role === "user" && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-start", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-primary/10 h-fit", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
          /* @__PURE__ */ jsx(Card, { className: "bg-muted", children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) }) })
        ] })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "p-4 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          placeholder: "Ask about your analysis...",
          disabled: isLoading,
          className: "flex-1"
        }
      ),
      /* @__PURE__ */ jsx(Button, { type: "submit", size: "icon", disabled: isLoading || !input.trim(), children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }) })
    ] }) })
  ] });
};
const getRiskLevel = (percentage) => {
  if (percentage > 40) return { level: "high", label: "High" };
  if (percentage > 20) return { level: "medium", label: "Medium" };
  return { level: "low", label: "Low" };
};
const getRiskColors = (level) => {
  switch (level) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-chart-1/10 text-chart-1 border-chart-1/20";
    case "low":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  }
};
const getProgressColors = (level) => {
  switch (level) {
    case "high":
      return "bg-destructive";
    case "medium":
      return "bg-chart-1";
    case "low":
      return "bg-chart-2";
  }
};
const getLatestValue = (item, keyedField) => {
  const direct = item.currentYear;
  if (typeof direct === "number" && direct !== 0) return direct;
  const keyed = item[keyedField];
  if (keyed && typeof keyed === "object") {
    const years = Object.keys(keyed).sort();
    if (years.length > 0) return keyed[years[years.length - 1]] || 0;
  }
  return 0;
};
const RiskIndicators = ({ wizardData, dealData }) => {
  const topCustomers = wizardData.topCustomers;
  const customerRevenue = topCustomers?.customers?.reduce((sum, c) => sum + getLatestValue(c, "yearlyRevenue"), 0) || 0;
  const totalRevenue = topCustomers?.totalRevenue || customerRevenue || 1;
  const top1CustomerVal = topCustomers?.customers?.[0] ? getLatestValue(topCustomers.customers[0], "yearlyRevenue") : 0;
  const top1CustomerPct = top1CustomerVal ? top1CustomerVal / totalRevenue * 100 : 0;
  const top5CustomerPct = topCustomers?.customers?.slice(0, 5).reduce((sum, c) => sum + getLatestValue(c, "yearlyRevenue") / totalRevenue * 100, 0) || 0;
  const topVendors = wizardData.topVendors;
  const vendorSpend = topVendors?.vendors?.reduce((sum, v) => sum + getLatestValue(v, "yearlySpend"), 0) || 0;
  const totalSpend = topVendors?.totalSpend || vendorSpend || 1;
  const top1VendorVal = topVendors?.vendors?.[0] ? getLatestValue(topVendors.vendors[0], "yearlySpend") : 0;
  const top1VendorPct = top1VendorVal ? top1VendorVal / totalSpend * 100 : 0;
  const arAging = wizardData.arAging;
  const latestAR = arAging?.periodData?.[arAging.periodData.length - 1];
  const arEntries = latestAR?.entries;
  let arOver90Pct = 0;
  if (arEntries && Array.isArray(arEntries)) {
    const arOver90 = arEntries.reduce((sum, e) => sum + Math.abs(e.days90plus || 0), 0);
    const arTotal = arEntries.reduce((sum, e) => sum + Math.abs(e.total || (e.current || 0) + (e.days1to30 || 0) + (e.days31to60 || 0) + (e.days61to90 || 0) + (e.days90plus || 0)), 0);
    arOver90Pct = arTotal > 0 ? arOver90 / arTotal * 100 : 0;
  } else if (latestAR?.total) {
    arOver90Pct = (latestAR.over90 || 0) / latestAR.total * 100;
  }
  const supplementary = wizardData.supplementary;
  const rawDebt = supplementary?.debtSchedule;
  const debtItems = Array.isArray(rawDebt) ? rawDebt : rawDebt?.items || [];
  const totalDebt = debtItems.reduce((sum, d) => sum + (d.balance || 0), 0);
  const today = /* @__PURE__ */ new Date();
  const nearestMaturity = debtItems.filter((d) => d.maturityDate).map((d) => ({ ...d, date: new Date(d.maturityDate) })).filter((d) => d.date > today).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const monthsToMaturity = nearestMaturity ? Math.round((nearestMaturity.date.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24 * 30)) : null;
  const materialContracts = wizardData.materialContracts;
  const cocCount = materialContracts?.contracts?.filter((c) => c.hasCoC || c.cocDetails || c.changeOfControl && c.changeOfControl !== "None")?.length || 0;
  const totalContracts = materialContracts?.contracts?.length || 0;
  const customerRisk = getRiskLevel(top1CustomerPct);
  const vendorRisk = getRiskLevel(top1VendorPct);
  const arRisk = getRiskLevel(arOver90Pct);
  const wipAgg = dealData ? computeWIPAggregates(dealData) : null;
  const hasData = top1CustomerPct > 0 || top1VendorPct > 0 || arOver90Pct > 0 || totalDebt > 0 || totalContracts > 0 || !!wipAgg;
  if (!hasData) {
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
        "Risk Indicators"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-4", children: "Complete Customer, Vendor, AR Aging, or Debt sections to see risk indicators" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
      "Risk Indicators"
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: cn("p-3 rounded-lg border", getRiskColors(customerRisk.level)), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: "Customer Concentration" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
          top1CustomerPct.toFixed(0),
          "%"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80", children: "Top customer share" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn("h-full rounded-full transition-all", getProgressColors(customerRisk.level)),
            style: { width: `${Math.min(top1CustomerPct, 100)}%` }
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs mt-1 opacity-70", children: [
          "Top 5: ",
          top5CustomerPct.toFixed(0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn("p-3 rounded-lg border", getRiskColors(vendorRisk.level)), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(Building, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: "Vendor Concentration" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
          top1VendorPct.toFixed(0),
          "%"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80", children: "Top vendor share" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn("h-full rounded-full transition-all", getProgressColors(vendorRisk.level)),
            style: { width: `${Math.min(top1VendorPct, 100)}%` }
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn("p-3 rounded-lg border", getRiskColors(arRisk.level)), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: "AR Quality" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
          arOver90Pct.toFixed(0),
          "%"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80", children: "Over 90 days" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn("h-full rounded-full transition-all", getProgressColors(arRisk.level)),
            style: { width: `${Math.min(arOver90Pct, 100)}%` }
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border bg-muted/30", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(TrendingDown, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Debt Overview" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
          "$",
          totalDebt > 0 ? (totalDebt / 1e6).toFixed(1) : "0",
          "M"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total debt" }),
        monthsToMaturity !== null && /* @__PURE__ */ jsxs("div", { className: cn(
          "text-xs mt-2 font-medium",
          monthsToMaturity <= 6 ? "text-destructive" : monthsToMaturity <= 12 ? "text-chart-1" : "text-muted-foreground"
        ), children: [
          "Next maturity: ",
          monthsToMaturity,
          "mo"
        ] }),
        cocCount > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs mt-1 text-chart-1", children: [
          cocCount,
          " contracts with CoC"
        ] })
      ] }),
      wipAgg && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border bg-muted/30", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(HardHat, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "WIP Analysis" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
          "$",
          Math.abs(wipAgg.netOverUnder) > 0 ? (wipAgg.netOverUnder / 1e3).toFixed(0) : "0",
          "K"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Net over/(under)" }),
        wipAgg.concentrationPct > 40 && /* @__PURE__ */ jsxs("div", { className: "text-xs mt-2 font-medium text-destructive", children: [
          "Job concentration: ",
          wipAgg.concentrationPct.toFixed(0),
          "%"
        ] }),
        wipAgg.totalOverBilled > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs mt-1 text-chart-1", children: [
          "Over-billing: $",
          (wipAgg.totalOverBilled / 1e3).toFixed(0),
          "K"
        ] })
      ] })
    ] }) })
  ] });
};
const DebtSummary = ({ wizardData }) => {
  const supplementary = wizardData.supplementary;
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.items || [];
  };
  const debtItems = toArray(supplementary?.debtSchedule);
  const leaseItems = toArray(supplementary?.leaseObligations);
  const contingentItems = toArray(supplementary?.contingentLiabilities);
  const totalDebt = debtItems.reduce((sum, d) => sum + (d.balance || 0), 0);
  const weightedRateSum = debtItems.reduce((sum, d) => sum + (d.balance || 0) * (d.interestRate || 0), 0);
  const avgRate = totalDebt > 0 ? weightedRateSum / totalDebt : 0;
  const lenderCount = debtItems.filter((d) => d.lender && d.balance).length;
  const today = /* @__PURE__ */ new Date();
  const maturities = debtItems.filter((d) => d.maturityDate && d.balance).map((d) => ({
    lender: d.lender || "Unknown",
    balance: d.balance || 0,
    date: parseISO(d.maturityDate)
  })).filter((d) => d.date > today).sort((a, b) => a.date.getTime() - b.date.getTime());
  const nearestMaturity = maturities[0];
  const monthsToMaturity = nearestMaturity ? differenceInMonths(nearestMaturity.date, today) : null;
  const totalAnnualLease = leaseItems.reduce((sum, l) => sum + (l.annualPayment || 0), 0);
  const operatingLeases = leaseItems.filter((l) => l.leaseType === "Operating");
  const financeLeases = leaseItems.filter((l) => l.leaseType === "Finance");
  const totalContingent = contingentItems.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const probableCount = contingentItems.filter((c) => c.probability === "Probable").length;
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  const hasData = totalDebt > 0 || totalAnnualLease > 0 || totalContingent > 0;
  if (!hasData) {
    return /* @__PURE__ */ jsxs(Card, { className: "h-full", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Wallet, { className: "w-5 h-5" }),
        "Debt & Obligations"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-8", children: "Complete the Supplementary section to see debt and obligations summary" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { className: "h-full", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Wallet, { className: "w-5 h-5" }),
      "Debt & Obligations"
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      totalDebt > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4" }),
          "Debt Schedule"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total Debt" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: formatCurrency(totalDebt) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Percent, { className: "w-3 h-3" }),
              "Avg Rate"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold", children: [
              avgRate.toFixed(2),
              "%"
            ] })
          ] })
        ] }),
        nearestMaturity && /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 text-xs ${monthsToMaturity && monthsToMaturity <= 12 ? "text-chart-1" : "text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
          "Next: ",
          nearestMaturity.lender,
          " (",
          format(nearestMaturity.date, "MMM yyyy"),
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          lenderCount,
          " lender",
          lenderCount !== 1 ? "s" : ""
        ] })
      ] }),
      totalAnnualLease > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
          "Lease Obligations"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Annual Payments" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: formatCurrency(totalAnnualLease) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Lease Count" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: leaseItems.length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          operatingLeases.length,
          " operating, ",
          financeLeases.length,
          " finance"
        ] })
      ] }),
      totalContingent > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4" }),
          "Contingent Liabilities"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total Exposure" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: formatCurrency(totalContingent) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Count" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: contingentItems.length })
          ] })
        ] }),
        probableCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-chart-1", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
          probableCount,
          " probable item",
          probableCount !== 1 ? "s" : ""
        ] })
      ] })
    ] })
  ] });
};
const checkHasData = (data) => {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") {
    const obj = data;
    if (obj.rawData && Array.isArray(obj.rawData) && obj.rawData.length > 0) return true;
    if (obj.items && Array.isArray(obj.items) && obj.items.length > 0) return true;
    if (obj.customers && Array.isArray(obj.customers) && obj.customers.length > 0) return true;
    if (obj.vendors && Array.isArray(obj.vendors) && obj.vendors.length > 0) return true;
    if (obj.contracts && Array.isArray(obj.contracts) && obj.contracts.length > 0) return true;
    if (obj.assets && Array.isArray(obj.assets) && obj.assets.length > 0) return true;
    if (obj.adjustments && Array.isArray(obj.adjustments) && obj.adjustments.length > 0) return true;
    if (obj.periodData && Array.isArray(obj.periodData) && obj.periodData.length > 0) return true;
    if (obj.employees && Array.isArray(obj.employees) && obj.employees.length > 0) return true;
    if (obj.accounts && Array.isArray(obj.accounts) && obj.accounts.length > 0) return true;
    if (obj.entries && Array.isArray(obj.entries) && obj.entries.length > 0) return true;
    if (obj.rows && Array.isArray(obj.rows) && obj.rows.length > 0) return true;
    const keys = Object.keys(obj).filter((k) => !k.startsWith("_"));
    return keys.length > 0 && keys.some((k) => obj[k] !== null && obj[k] !== void 0);
  }
  return false;
};
const COMPLETION_SECTIONS = [
  // Core Data (matches Phase 2)
  { key: "chartOfAccounts", label: "Chart of Accounts", category: "Core Data", wizardDataKey: "chartOfAccounts" },
  { key: "trialBalance", label: "Trial Balance", category: "Core Data", wizardDataKey: "trialBalance" },
  { key: "generalLedger", label: "General Ledger", category: "Core Data", wizardDataKey: "generalLedger" },
  // Adjustments (matches Phase 3 Adjustments subgroup)
  { key: "ddAdjustments", label: "DD Adjustments", category: "Adjustments", wizardDataKey: "ddAdjustments" },
  { key: "reclassifications", label: "Reclassifications", category: "Adjustments", wizardDataKey: "reclassifications" },
  { key: "journalEntries", label: "Journal Entries", category: "Adjustments", wizardDataKey: "journalEntries" },
  // Schedules (matches Phase 3 Schedules subgroup)
  { key: "arAging", label: "AR Aging", category: "Schedules", wizardDataKey: "arAging" },
  { key: "apAging", label: "AP Aging", category: "Schedules", wizardDataKey: "apAging" },
  { key: "fixedAssets", label: "Fixed Assets", category: "Schedules", wizardDataKey: "fixedAssets" },
  { key: "inventory", label: "Inventory", category: "Schedules", wizardDataKey: "inventory" },
  { key: "payroll", label: "Payroll", category: "Schedules", wizardDataKey: "payroll" },
  { key: "materialContracts", label: "Material Contracts", category: "Schedules", wizardDataKey: "materialContracts" },
  // Supplementary (nested under wizard_data.supplementary)
  { key: "debtSchedule", label: "Debt Schedule", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "debtSchedule" },
  { key: "leaseObligations", label: "Lease Obligations", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "leaseObligations" },
  { key: "contingentLiabilities", label: "Contingent Liabilities", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "contingentLiabilities" },
  // Analysis (matches Phase 4)
  { key: "topCustomers", label: "Top Customers", category: "Analysis", wizardDataKey: "topCustomers" },
  { key: "topVendors", label: "Top Vendors", category: "Analysis", wizardDataKey: "topVendors" },
  // Reports (matches Phase 5 Financial Statements)
  { key: "incomeStatement", label: "Income Statement", category: "Reports", wizardDataKey: "incomeStatement" },
  { key: "balanceSheet", label: "Balance Sheet", category: "Reports", wizardDataKey: "balanceSheet" },
  { key: "cashFlow", label: "Cash Flow Statement", category: "Reports", wizardDataKey: "cashFlow" },
  // QoE (matches Phase 5 QoE Reports)
  { key: "qoeAnalysis", label: "QoE Analysis", category: "QoE", wizardDataKey: "qoeAnalysis" },
  { key: "qoeSummary", label: "QoE Summary", category: "QoE", wizardDataKey: "qoeSummary" },
  // Working Capital (matches Phase 5 Working Capital)
  { key: "nwcAnalysis", label: "NWC Analysis", category: "Working Capital", wizardDataKey: "nwcAnalysis" },
  { key: "freeCashFlow", label: "Free Cash Flow", category: "Working Capital", wizardDataKey: "freeCashFlow" },
  // Supporting (matches Phase 5 Supporting)
  { key: "proofOfCash", label: "Proof of Cash", category: "Supporting", wizardDataKey: "proofOfCash" }
];
function getSectionStatus(wizardData, section) {
  if (section.nestedKey) {
    const parent = wizardData[section.wizardDataKey];
    return checkHasData(parent?.[section.nestedKey]);
  }
  return checkHasData(wizardData[section.wizardDataKey]);
}
function getAllSectionStatuses(wizardData) {
  return COMPLETION_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    category: section.category,
    hasData: getSectionStatus(wizardData, section)
  }));
}
function getCategories() {
  return [...new Set(COMPLETION_SECTIONS.map((s) => s.category))];
}
const CORE_EXPORT_SECTIONS = ["incomeStatement", "balanceSheet", "qoeAnalysis", "ddAdjustments"];
function getExportReadiness(wizardData, computedReports) {
  const coreStatus = CORE_EXPORT_SECTIONS.reduce((acc, key) => {
    if (computedReports?.[key]?.rawData && computedReports[key].rawData.length > 0) {
      acc[key] = true;
    } else {
      acc[key] = checkHasData(wizardData[key]);
    }
    return acc;
  }, {});
  const readyCount = Object.values(coreStatus).filter(Boolean).length;
  const totalCore = CORE_EXPORT_SECTIONS.length;
  return {
    coreStatus,
    readyCount,
    totalCore,
    isReady: readyCount === totalCore
  };
}
const WIZARD_KEY_TO_DATA_TYPE = {
  journalEntries: ["journal_entries"],
  arAging: ["ar_aging", "accounts_receivable"],
  apAging: ["ap_aging", "accounts_payable"],
  topCustomers: ["customer_concentration"],
  topVendors: ["vendor_concentration"],
  incomeStatement: ["income_statement"],
  balanceSheet: ["balance_sheet"],
  trialBalance: ["trial_balance"],
  chartOfAccounts: ["chart_of_accounts"],
  generalLedger: ["general_ledger"],
  fixedAssets: ["fixed_assets"],
  inventory: ["inventory"],
  payroll: ["payroll"],
  cashFlow: ["cash_flow"]
};
const CompletenessTracker = ({ wizardData, computedReports, projectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [processedDataTypes, setProcessedDataTypes] = useState(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (!projectId) return;
    const fetchTypes = async () => {
      const { data } = await supabase.from("processed_data").select("data_type").eq("project_id", projectId);
      if (data) {
        setProcessedDataTypes(new Set(data.map((r) => r.data_type)));
      }
    };
    fetchTypes();
  }, [projectId]);
  const sections = getAllSectionStatuses(wizardData).map((section) => {
    if (!section.hasData && computedReports) {
      const reportData = computedReports[section.key];
      if (reportData?.rawData && reportData.rawData.length > 1) {
        return { ...section, hasData: true };
      }
    }
    if (!section.hasData) {
      const mappedTypes = WIZARD_KEY_TO_DATA_TYPE[section.key];
      if (mappedTypes?.some((t) => processedDataTypes.has(t))) {
        return { ...section, hasData: true };
      }
    }
    return section;
  });
  const completedCount = sections.filter((s) => s.hasData).length;
  const progressPercent = completedCount / sections.length * 100;
  const categories = getCategories();
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(Collapsible, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsx(CardHeader, { className: "pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5" }),
        "Data Completeness"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
          completedCount,
          "/",
          sections.length,
          " sections"
        ] }),
        isOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
      /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-2 mb-2" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-3", children: [
        progressPercent.toFixed(0),
        "% complete"
      ] }),
      /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-4 pt-2 border-t", children: categories.map((category) => {
        const categorySections = sections.filter((s) => s.category === category);
        const categoryComplete = categorySections.filter((s) => s.hasData).length;
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: category }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              categoryComplete,
              "/",
              categorySections.length
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-1", children: categorySections.map((section) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                section.hasData ? "text-chart-2 bg-chart-2/10" : "text-muted-foreground bg-muted/30"
              ),
              children: [
                section.hasData ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Circle, { className: "w-3 h-3" }),
                section.label
              ]
            },
            section.key
          )) })
        ] }, category);
      }) }) })
    ] })
  ] }) });
};
const InsightsView = ({ project }) => {
  const wizardData = project.wizard_data || {};
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);
  const { dealData, wizardReports } = useMemo(() => {
    const data = projectToDealData(project);
    const reports = buildWizardReports(data);
    return { dealData: data, wizardReports: reports };
  }, [project.id, project.wizard_data, project.periods]);
  return /* @__PURE__ */ jsxs("div", { className: "h-full flex overflow-hidden", children: [
    /* @__PURE__ */ jsxs(ResizablePanelGroup, { direction: "horizontal", className: "flex-1", children: [
      /* @__PURE__ */ jsx(ResizablePanel, { defaultSize: isAIPanelCollapsed ? 100 : 70, minSize: 50, children: /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsx(MetricsOverview, { dealData, wizardData }),
        /* @__PURE__ */ jsx(RiskIndicators, { wizardData, dealData }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "xl:col-span-2", children: /* @__PURE__ */ jsx(ChartPanel, { dealData, wizardData, wizardReports }) }),
          /* @__PURE__ */ jsx("div", { className: "xl:col-span-1", children: /* @__PURE__ */ jsx(DebtSummary, { wizardData }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(AdjustmentsSummary, { wizardData }),
          /* @__PURE__ */ jsx(QuickInsights, { dealData, wizardData, industry: project.industry || void 0 })
        ] }),
        /* @__PURE__ */ jsx(DataExplorer, { wizardData, wizardReports }),
        /* @__PURE__ */ jsx(CompletenessTracker, { wizardData, computedReports: wizardReports, projectId: project.id })
      ] }) }) }),
      !isAIPanelCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(ResizableHandle, { withHandle: true }),
        /* @__PURE__ */ jsx(ResizablePanel, { defaultSize: 30, minSize: 20, children: /* @__PURE__ */ jsx(AIAnalyst, { project, onCollapse: () => setIsAIPanelCollapsed(true) }) })
      ] })
    ] }),
    isAIPanelCollapsed && /* @__PURE__ */ jsxs("div", { className: "w-12 border-l bg-card flex flex-col items-center py-4", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => setIsAIPanelCollapsed(false),
          className: "h-10 w-10",
          title: "Open AI Analyst",
          children: /* @__PURE__ */ jsx(Bot, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mt-2 [writing-mode:vertical-rl] rotate-180", children: "AI Analyst" })
    ] })
  ] });
};
export {
  InsightsView as I,
  ToggleGroup as T,
  ToggleGroupItem as a,
  buildWizardReports as b,
  computeQoEMetrics as c,
  getExportReadiness as g
};
