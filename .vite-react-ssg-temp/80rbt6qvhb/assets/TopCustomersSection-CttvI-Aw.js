import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { Users, TrendingUp, Percent, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { c as useAutoLoadCustomers } from "./useAutoLoadProcessedData-BXrIGnhs.js";
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
function normalizeCustomerData(rawData) {
  let detectedYears = [];
  const customers = (rawData.customers || []).map((c, idx) => {
    if ("currentYear" in c && typeof c.currentYear === "number") {
      return {
        id: c.id || idx + 1,
        rank: idx + 1,
        name: c.name || "",
        currentYear: c.currentYear,
        priorYear: c.priorYear || 0,
        percentOfTotal: c.percentOfTotal || 0
      };
    }
    const yearlyRevenue = c.yearlyRevenue || {};
    const years = Object.keys(yearlyRevenue).sort().reverse();
    if (years.length > 0 && detectedYears.length === 0) {
      detectedYears = years.slice(0, 2);
    }
    return {
      id: c.id || idx + 1,
      rank: idx + 1,
      name: c.name || "",
      currentYear: yearlyRevenue[years[0]] || 0,
      priorYear: yearlyRevenue[years[1]] || 0,
      percentOfTotal: -1
      // sentinel: compute after we know totalRevenue
    };
  });
  const totalRev = rawData.totalRevenue || customers.reduce((s, c) => s + c.currentYear, 0) || 1;
  customers.forEach((c) => {
    if (c.percentOfTotal === -1) {
      c.percentOfTotal = parseFloat((c.currentYear / totalRev * 100).toFixed(1));
    }
  });
  while (customers.length < 10) {
    customers.push({
      id: customers.length + 1,
      rank: customers.length + 1,
      name: "",
      currentYear: 0,
      priorYear: 0,
      percentOfTotal: 0
    });
  }
  return {
    customers,
    totalRevenue: rawData.totalRevenue || 0,
    yearLabels: {
      current: detectedYears[0] || "Current Year",
      prior: detectedYears[1] || "Prior Year"
    }
  };
}
const TopCustomersSection = ({ projectId, data, updateData }) => {
  useAutoLoadCustomers({
    projectId,
    data,
    updateData
  });
  const { customers, totalRevenue, yearLabels } = normalizeCustomerData(data);
  const columns = [
    { key: "rank", label: "#", type: "number", editable: false, width: "50px" },
    { key: "name", label: "Customer Name", type: "text" },
    { key: "currentYear", label: yearLabels.current, type: "currency" },
    { key: "priorYear", label: yearLabels.prior, type: "currency" },
    { key: "percentOfTotal", label: "% of Total", type: "number" }
  ];
  const topCustomerRevenue = customers.reduce((sum, c) => sum + (c.currentYear || 0), 0);
  const top1Revenue = customers[0]?.currentYear || 0;
  const top5Revenue = customers.slice(0, 5).reduce((sum, c) => sum + (c.currentYear || 0), 0);
  const top1Concentration = totalRevenue ? (top1Revenue / totalRevenue * 100).toFixed(1) : "0";
  const top5Concentration = totalRevenue ? (top5Revenue / totalRevenue * 100).toFixed(1) : "0";
  const top10Concentration = totalRevenue ? (topCustomerRevenue / totalRevenue * 100).toFixed(1) : "0";
  const chartData = customers.filter((c) => c.currentYear > 0).slice(0, 5).map((c) => ({
    name: c.name || `Customer ${c.rank}`,
    current: c.currentYear,
    prior: c.priorYear
  }));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Top Customers by Year" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze customer concentration and revenue trends" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top Customer", value: `${top1Concentration}%`, icon: Users, subtitle: "of total revenue" }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 5 Concentration", value: `${top5Concentration}%`, icon: TrendingUp }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 10 Concentration", value: `${top10Concentration}%`, icon: Percent }),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Concentration Risk",
          value: parseFloat(top1Concentration) > 20 ? "High" : parseFloat(top1Concentration) > 10 ? "Medium" : "Low",
          icon: AlertTriangle
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Total Revenue (for % calculation)" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: totalRevenue || "",
          onChange: (e) => updateData({ ...data, totalRevenue: parseFloat(e.target.value) || 0 }),
          placeholder: "Enter total revenue for percentage calculations",
          className: "w-full md:w-1/3 p-2 border rounded-md"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top 10 Customers" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns,
            data: customers,
            onDataChange: (newCustomers) => updateData({ ...data, customers: newCustomers }),
            allowAddRow: false,
            allowDeleteRow: false
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top 5 Customer Comparison" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-80", children: chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, layout: "vertical", children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: (value) => `$${(value / 1e3).toFixed(0)}K` }),
          /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 100 }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => `$${value.toLocaleString()}` }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "prior", fill: "hsl(var(--muted-foreground))", name: "Prior Year" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "current", fill: "hsl(var(--primary))", name: "Current Year" })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: "Enter customer data to see comparison" }) }) })
      ] })
    ] })
  ] });
};
export {
  TopCustomersSection
};
