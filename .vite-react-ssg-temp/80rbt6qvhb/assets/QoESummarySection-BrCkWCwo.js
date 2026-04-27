import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { DollarSign, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line } from "recharts";
import { c as computeQoEMetrics } from "./InsightsView-BkA7fJjp.js";
import { ag as reclassAwareReportedEBITDA, $ as reclassAwareAdjustedEBITDA } from "./sanitizeWizardData-nrsUY-BP.js";
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
const QoESummarySection = ({ dealData }) => {
  const metrics = computeQoEMetrics(dealData);
  const ebitdaComparison = [
    { name: "Reported", value: metrics.reportedEBITDA },
    { name: "Adjustments", value: metrics.totalAdjustments },
    { name: "Adjusted", value: metrics.adjustedEBITDA }
  ];
  const trendData = (() => {
    if (!dealData) {
      return [{ period: "LTM", reported: metrics.reportedEBITDA, adjusted: metrics.adjustedEBITDA }];
    }
    const tb = dealData.trialBalance;
    const ab = dealData.addbacks;
    const adj = dealData.adjustments;
    const rc = dealData.reclassifications ?? [];
    return dealData.deal.fiscalYears.map((fy) => {
      const fyPids = fy.periods.map((p) => p.id);
      const reported = reclassAwareReportedEBITDA(tb, rc, fyPids, ab);
      const adjusted = reclassAwareAdjustedEBITDA(tb, rc, adj, fyPids, ab);
      return { period: fy.label, reported, adjusted };
    });
  })();
  const adjustmentPct = metrics.reportedEBITDA ? `${(metrics.totalAdjustments / metrics.reportedEBITDA * 100).toFixed(1)}%` : "N/A";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "QoE Summary" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Overview of quality of earnings analysis and key metrics" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Reported EBITDA",
          value: metrics.reportedEBITDA,
          icon: DollarSign,
          subtitle: "As stated in financials"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Total Adjustments",
          value: metrics.totalAdjustments,
          icon: FileText,
          trend: metrics.totalAdjustments > 0 ? "up" : metrics.totalAdjustments < 0 ? "down" : "neutral",
          trendValue: `${metrics.adjustmentCount >= 0 ? metrics.adjustmentCount : "—"} items`
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Adjusted EBITDA",
          value: metrics.adjustedEBITDA,
          icon: TrendingUp,
          subtitle: "Normalized earnings"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Adjustment %",
          value: adjustmentPct,
          icon: AlertTriangle,
          subtitle: "Impact on EBITDA"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "EBITDA Bridge" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: ebitdaComparison, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "name" }),
          /* @__PURE__ */ jsx(YAxis, { tickFormatter: (value) => `$${(value / 1e3).toFixed(0)}K` }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => [`$${value.toLocaleString()}`, "Amount"] }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
        ] }) }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "EBITDA Trend" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: trendData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "period" }),
          /* @__PURE__ */ jsx(YAxis, { tickFormatter: (value) => `$${(value / 1e3).toFixed(0)}K` }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => [`$${value.toLocaleString()}`, ""] }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "reported", stroke: "hsl(var(--muted-foreground))", name: "Reported" }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "adjusted", stroke: "hsl(var(--primary))", strokeWidth: 2, name: "Adjusted" })
        ] }) }) }) })
      ] })
    ] })
  ] });
};
export {
  QoESummarySection
};
