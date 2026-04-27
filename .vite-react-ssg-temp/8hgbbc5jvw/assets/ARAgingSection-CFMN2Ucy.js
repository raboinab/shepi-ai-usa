import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, f as CardContent, b as CardHeader, d as CardTitle } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { Clock, AlertTriangle, Users, Percent } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { A as AGING_BUCKETS, a as AR_AGING_CONTRACT } from "./workbookContract-nsx9wSa8.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { useMemo, useState, useEffect } from "react";
import { a as useAutoLoadArAging } from "./useAutoLoadProcessedData-BXrIGnhs.js";
import "vite-react-ssg";
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
import "@radix-ui/react-select";
const createDefaultEntry = (id) => ({
  id,
  customer: "",
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90plus: 0,
  total: 0
});
const createDefaultPeriodData = (periodId) => ({
  periodId,
  entries: Array.from({ length: AR_AGING_CONTRACT.maxCustomersPerPeriod }, (_, i) => createDefaultEntry(i + 1))
});
const defaultData = {
  periodData: [],
  badDebtReserve: 0
};
const formatAsOfPeriod = (periodId) => {
  const match = periodId.match(/as_of_(\d{4})-(\d{2})/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1);
    return `As of ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }
  return periodId;
};
const ARAgingSection = ({ projectId, data, updateData, periods = [] }) => {
  const arData = { ...defaultData, ...data };
  useAutoLoadArAging({
    projectId,
    data: arData,
    updateData
  });
  const syncedPeriodIds = useMemo(() => {
    return arData.periodData.map((p) => p.periodId).filter((id) => id.startsWith("as_of_"));
  }, [arData.periodData]);
  const allPeriodOptions = useMemo(() => {
    const projectOptions = periods.map((p) => ({ id: p.id, label: p.label }));
    const syncedOptions = syncedPeriodIds.map((id) => ({ id, label: formatAsOfPeriod(id) }));
    return [...projectOptions, ...syncedOptions];
  }, [periods, syncedPeriodIds]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  useEffect(() => {
    if (syncedPeriodIds.length > 0) {
      const latestSynced = syncedPeriodIds[syncedPeriodIds.length - 1];
      if (!selectedPeriodId || !selectedPeriodId.startsWith("as_of_") && latestSynced) {
        setSelectedPeriodId(latestSynced);
      }
    } else if (!selectedPeriodId && periods.length > 0) {
      setSelectedPeriodId(periods[periods.length - 1].id);
    }
  }, [syncedPeriodIds, periods, selectedPeriodId]);
  const initializePeriodData = () => {
    const existingPeriodIds = new Set(arData.periodData.map((p) => p.periodId));
    const newPeriodData = [...arData.periodData];
    periods.forEach((period) => {
      if (!existingPeriodIds.has(period.id)) {
        newPeriodData.push(createDefaultPeriodData(period.id));
      }
    });
    return newPeriodData;
  };
  const periodDataWithDefaults = initializePeriodData();
  const currentPeriodData = periodDataWithDefaults.find((p) => p.periodId === selectedPeriodId) || (selectedPeriodId ? createDefaultPeriodData(selectedPeriodId) : null);
  const columns = [
    { key: "customer", label: "Customer Name", type: "text" },
    { key: "current", label: "Current", type: "currency" },
    { key: "days1to30", label: "1-30 Days", type: "currency" },
    { key: "days31to60", label: "31-60 Days", type: "currency" },
    { key: "days61to90", label: "61-90 Days", type: "currency" },
    { key: "days90plus", label: "90+ Days", type: "currency" },
    { key: "total", label: "Total", type: "currency", editable: false }
  ];
  const calculateTotals = (entries) => {
    const entriesWithTotals2 = entries.map((entry) => ({
      ...entry,
      total: entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus
    }));
    const totalAR2 = entriesWithTotals2.reduce((sum, e) => sum + e.total, 0);
    const currentAR2 = entriesWithTotals2.reduce((sum, e) => sum + e.current, 0);
    const overdueAR2 = totalAR2 - currentAR2;
    return { entriesWithTotals: entriesWithTotals2, totalAR: totalAR2, currentAR: currentAR2, overdueAR: overdueAR2 };
  };
  const { entriesWithTotals, totalAR, overdueAR } = currentPeriodData ? calculateTotals(currentPeriodData.entries) : { entriesWithTotals: [], totalAR: 0, overdueAR: 0 };
  const overduePercentage = totalAR ? (overdueAR / totalAR * 100).toFixed(1) : "0";
  const chartData = AGING_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    amount: entriesWithTotals.reduce((sum, e) => sum + (e[bucket.key] || 0), 0)
  }));
  const topCustomers = [...entriesWithTotals].filter((e) => e.customer && e.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const topCustomerTotal = topCustomers.reduce((sum, c) => sum + c.total, 0);
  const concentration = totalAR ? (topCustomerTotal / totalAR * 100).toFixed(1) : "0";
  const handleDataChange = (newEntries) => {
    if (!selectedPeriodId) return;
    const updatedPeriodData = periodDataWithDefaults.map((pd) => {
      if (pd.periodId === selectedPeriodId) {
        return { ...pd, entries: newEntries };
      }
      return pd;
    });
    if (!updatedPeriodData.find((p) => p.periodId === selectedPeriodId)) {
      updatedPeriodData.push({
        periodId: selectedPeriodId,
        entries: newEntries
      });
    }
    updateData({
      ...arData,
      periodData: updatedPeriodData
    });
  };
  const getSelectedPeriodLabel = () => {
    const projectPeriod = periods.find((p) => p.id === selectedPeriodId);
    if (projectPeriod) return projectPeriod.label;
    if (selectedPeriodId.startsWith("as_of_")) return formatAsOfPeriod(selectedPeriodId);
    return "Select Period";
  };
  if (periods.length === 0 && syncedPeriodIds.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "AR Aging" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze accounts receivable aging by period" })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Please configure periods in the Company Information section first, or sync data from QuickBooks." }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "AR Aging" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze accounts receivable aging and customer concentration" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: selectedPeriodId, onValueChange: setSelectedPeriodId, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-48", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select period" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: allPeriodOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.id, children: option.label }, option.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total AR", value: totalAR, icon: Clock }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Overdue AR", value: overdueAR, icon: AlertTriangle, subtitle: `${overduePercentage}% of total` }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 5 Concentration", value: `${concentration}%`, icon: Users }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Bad Debt Reserve", value: arData.badDebtReserve, icon: Percent })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
          "AR Aging - ",
          getSelectedPeriodLabel()
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns,
              data: entriesWithTotals,
              onDataChange: handleDataChange,
              allowAddRow: entriesWithTotals.length < AR_AGING_CONTRACT.maxCustomersPerPeriod,
              allowDeleteRow: false
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Accounts Receivable" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              totalAR.toLocaleString()
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Aging Distribution" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "bucket" }),
          /* @__PURE__ */ jsx(YAxis, { tickFormatter: (value) => `$${(value / 1e3).toFixed(0)}K` }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => [`$${value.toLocaleString()}`, "Amount"] }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "amount", fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
        ] }) }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top Customers by AR Balance" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: topCustomers.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-2", children: topCustomers.map((customer, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-muted-foreground", children: [
            "#",
            index + 1
          ] }),
          /* @__PURE__ */ jsx("span", { children: customer.customer })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            "$",
            customer.total.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            totalAR ? (customer.total / totalAR * 100).toFixed(1) : 0,
            "% of total"
          ] })
        ] })
      ] }, customer.id)) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-4", children: "Enter customer data to see top customers" }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Bad Debt Analysis" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Bad Debt Reserve" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: arData.badDebtReserve || "",
              onChange: (e) => updateData({ ...arData, badDebtReserve: parseFloat(e.target.value) || 0 }),
              className: "w-full mt-1 p-2 border rounded-md bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Reserve as % of AR" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
            totalAR ? (arData.badDebtReserve / totalAR * 100).toFixed(2) : 0,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Net AR" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
            "$",
            (totalAR - arData.badDebtReserve).toLocaleString()
          ] })
        ] })
      ] }) })
    ] })
  ] });
};
export {
  ARAgingSection
};
