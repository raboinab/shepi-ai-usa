import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { Building2, TrendingUp, Percent, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { d as useAutoLoadVendors } from "./useAutoLoadProcessedData-BXrIGnhs.js";
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
import "./table-CVoj8f5R.js";
import "./input-CSM87NBF.js";
function normalizeVendorData(rawData) {
  let detectedYears = [];
  const vendors = (rawData.vendors || []).map((v, idx) => {
    if ("currentYear" in v && typeof v.currentYear === "number") {
      return {
        id: v.id || idx + 1,
        rank: idx + 1,
        name: v.name || "",
        currentYear: v.currentYear,
        priorYear: v.priorYear || 0,
        percentOfTotal: v.percentOfTotal || 0,
        isRelatedParty: v.isRelatedParty || false
      };
    }
    const yearlySpend = v.yearlySpend || {};
    const years = Object.keys(yearlySpend).sort().reverse();
    if (years.length > 0 && detectedYears.length === 0) {
      detectedYears = years.slice(0, 2);
    }
    return {
      id: v.id || idx + 1,
      rank: idx + 1,
      name: v.name || "",
      currentYear: yearlySpend[years[0]] || 0,
      priorYear: yearlySpend[years[1]] || 0,
      percentOfTotal: -1,
      // sentinel: compute after we know totalSpend
      isRelatedParty: v.isRelatedParty || false
    };
  });
  const totalSpendVal = rawData.totalSpend || vendors.reduce((s, v) => s + v.currentYear, 0) || 1;
  vendors.forEach((v) => {
    if (v.percentOfTotal === -1) {
      v.percentOfTotal = parseFloat((v.currentYear / totalSpendVal * 100).toFixed(1));
    }
  });
  while (vendors.length < 10) {
    vendors.push({
      id: vendors.length + 1,
      rank: vendors.length + 1,
      name: "",
      currentYear: 0,
      priorYear: 0,
      percentOfTotal: 0,
      isRelatedParty: false
    });
  }
  return {
    vendors,
    totalSpend: rawData.totalSpend || 0,
    yearLabels: {
      current: detectedYears[0] || "Current Year",
      prior: detectedYears[1] || "Prior Year"
    }
  };
}
const TopVendorsSection = ({ projectId, data, updateData }) => {
  useAutoLoadVendors({
    projectId,
    data,
    updateData
  });
  const { vendors, totalSpend, yearLabels } = normalizeVendorData(data);
  const columns = [
    { key: "rank", label: "#", type: "number", editable: false, width: "50px" },
    { key: "name", label: "Vendor Name", type: "text" },
    { key: "currentYear", label: yearLabels.current, type: "currency" },
    { key: "priorYear", label: yearLabels.prior, type: "currency" },
    { key: "percentOfTotal", label: "% of Total", type: "number" }
  ];
  const topVendorSpend = vendors.reduce((sum, v) => sum + (v.currentYear || 0), 0);
  const top1Spend = vendors[0]?.currentYear || 0;
  const top5Spend = vendors.slice(0, 5).reduce((sum, v) => sum + (v.currentYear || 0), 0);
  const top1Concentration = totalSpend ? (top1Spend / totalSpend * 100).toFixed(1) : "0";
  const top5Concentration = totalSpend ? (top5Spend / totalSpend * 100).toFixed(1) : "0";
  const top10Concentration = totalSpend ? (topVendorSpend / totalSpend * 100).toFixed(1) : "0";
  const relatedPartyVendors = vendors.filter((v) => v.isRelatedParty);
  const relatedPartySpend = relatedPartyVendors.reduce((sum, v) => sum + (v.currentYear || 0), 0);
  const chartData = vendors.filter((v) => v.currentYear > 0).slice(0, 5).map((v) => ({
    name: v.name || `Vendor ${v.rank}`,
    current: v.currentYear,
    prior: v.priorYear
  }));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Top Vendors by Year" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze vendor concentration and related party transactions" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top Vendor", value: `${top1Concentration}%`, icon: Building2, subtitle: "of total spend" }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 5 Concentration", value: `${top5Concentration}%`, icon: TrendingUp }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 10 Concentration", value: `${top10Concentration}%`, icon: Percent }),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Related Party Spend",
          value: relatedPartySpend,
          icon: AlertTriangle,
          subtitle: `${relatedPartyVendors.length} vendors`
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Total Vendor Spend (for % calculation)" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: totalSpend || "",
          onChange: (e) => updateData({ ...data, totalSpend: parseFloat(e.target.value) || 0 }),
          placeholder: "Enter total vendor spend for percentage calculations",
          className: "w-full md:w-1/3 p-2 border rounded-md"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          "Top 10 Vendors",
          relatedPartyVendors.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
            relatedPartyVendors.length,
            " Related Party"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns,
              data: vendors,
              onDataChange: (newVendors) => updateData({ ...data, vendors: newVendors }),
              allowAddRow: false,
              allowDeleteRow: false
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-4", children: "Flag related party vendors by updating the vendor data with isRelatedParty: true" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top 5 Vendor Comparison" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-80", children: chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, layout: "vertical", children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: (value) => `$${(value / 1e3).toFixed(0)}K` }),
          /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 100 }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => `$${value.toLocaleString()}` }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "prior", fill: "hsl(var(--muted-foreground))", name: "Prior Year" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "current", fill: "hsl(var(--primary))", name: "Current Year" })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: "Enter vendor data to see comparison" }) }) })
      ] })
    ] })
  ] });
};
export {
  TopVendorsSection
};
