import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { Building2, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import { N as sumByLineItem, M as computeSign } from "./sanitizeWizardData-nrsUY-BP.js";
import { c as computeQoEMetrics } from "./InsightsView-BkA7fJjp.js";
import "vite-react-ssg";
import "react";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "react-resizable-panels";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "./badge-BbLwm7hH.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "./table-CVoj8f5R.js";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-CSM87NBF.js";
import "./spinner-DXdBpr08.js";
import "react-markdown";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
const QoEExecutiveSummarySection = ({ dealData, wizardData, project }) => {
  const metrics = computeQoEMetrics(dealData);
  const tb = dealData?.trialBalance || [];
  const lastPeriodId = dealData?.deal.periods[dealData.deal.periods.length - 1]?.id || "";
  const totalAssets = ["Cash and cash equivalents", "Accounts receivable", "Other current assets", "Fixed assets", "Other assets"].reduce((sum, li) => sum + sumByLineItem(tb, li, lastPeriodId), 0);
  const ddAdj = wizardData.ddAdjustments || {};
  const adjustments = ddAdj.adjustments || [];
  const bridgeData = [
    { name: "Reported EBITDA", value: metrics.reportedEBITDA, color: "hsl(var(--muted-foreground))" },
    ...adjustments.slice(0, 4).map((adj, idx) => {
      const adjAmount = Object.values(adj.periodValues || {}).reduce((s, v) => s + (Number(v) || 0), 0) * computeSign(adj.intent || "other");
      return {
        name: (adj.description || `Adjustment ${idx + 1}`).substring(0, 20),
        value: adjAmount,
        color: adjAmount >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"
      };
    }),
    { name: "Adjusted EBITDA", value: metrics.adjustedEBITDA, color: "hsl(var(--primary))" }
  ];
  const keyFindings = adjustments.slice(0, 5).map((adj) => {
    const amount = Object.values(adj.periodValues || {}).reduce((s, v) => s + (Number(v) || 0), 0) * computeSign(adj.intent || "other");
    return {
      description: adj.description || "Adjustment",
      amount,
      type: adj.block || adj.type || "DD"
    };
  });
  const latestFY = dealData?.deal.fiscalYears[dealData.deal.fiscalYears.length - 1];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "QoE Executive Summary" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "High-level overview of the Quality of Earnings analysis" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Building2, { className: "w-5 h-5" }),
        "Engagement Overview"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Target Company" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: project?.target_company || "Not specified" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Client" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: project?.client_name || "Not specified" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Industry" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: project?.industry || "Not specified" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Transaction Type" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: project?.transaction_type ? project.transaction_type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") : "Not specified" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Revenue",
          value: metrics.revenue,
          icon: DollarSign,
          subtitle: latestFY ? `LTM` : "No periods"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Adjusted EBITDA",
          value: metrics.adjustedEBITDA,
          icon: TrendingUp,
          subtitle: "Post-adjustments"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Net Adjustments",
          value: metrics.totalAdjustments,
          icon: BarChart3,
          subtitle: `${metrics.adjustmentCount >= 0 ? metrics.adjustmentCount : "—"} total`
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Total Assets",
          value: totalAssets,
          icon: Building2,
          subtitle: "Balance Sheet"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "EBITDA Bridge" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: bridgeData.length > 2 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: bridgeData, layout: "vertical", children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: (v) => `$${(v / 1e3).toFixed(0)}K`, className: "text-xs" }),
        /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 120, className: "text-xs" }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value) => [`$${value.toLocaleString()}`, "Amount"],
            contentStyle: { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
          }
        ),
        /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0], children: bridgeData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`)) })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: "Complete DD Adjustments to view EBITDA Bridge" }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Key Findings & Adjustments" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: keyFindings.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: keyFindings.map((finding, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: finding.description }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: finding.type })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `font-bold ${finding.amount >= 0 ? "text-green-600" : "text-destructive"}`, children: [
          finding.amount >= 0 ? "+" : "",
          "$",
          Math.abs(finding.amount).toLocaleString()
        ] })
      ] }, idx)) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-8", children: "No adjustments recorded yet. Complete the DD Adjustments section to see key findings." }) })
    ] })
  ] });
};
export {
  QoEExecutiveSummarySection
};
