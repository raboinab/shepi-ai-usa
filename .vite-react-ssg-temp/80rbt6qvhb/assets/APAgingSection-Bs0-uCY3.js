import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, f as CardContent, b as CardHeader, d as CardTitle } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { Clock, AlertTriangle, Building2, Percent } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { A as AGING_BUCKETS, b as AP_AGING_CONTRACT } from "./workbookContract-nsx9wSa8.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { useMemo, useState, useEffect } from "react";
import { b as useAutoLoadApAging } from "./useAutoLoadProcessedData-BXrIGnhs.js";
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
  vendor: "",
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90plus: 0,
  total: 0
});
const createDefaultPeriodData = (periodId) => ({
  periodId,
  entries: Array.from({ length: AP_AGING_CONTRACT.maxVendorsPerPeriod }, (_, i) => createDefaultEntry(i + 1))
});
const defaultData = {
  periodData: [],
  summary: {
    totalAP: 0,
    currentAP: 0,
    overdueAP: 0
  }
};
const formatAsOfPeriod = (periodId) => {
  const match = periodId.match(/as_of_(\d{4})-(\d{2})/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1);
    return `As of ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }
  return periodId;
};
const APAgingSection = ({ projectId, data, updateData, periods = [] }) => {
  const apData = { ...defaultData, ...data };
  useAutoLoadApAging({
    projectId,
    data: apData,
    updateData
  });
  const syncedPeriodIds = useMemo(() => {
    return apData.periodData.map((p) => p.periodId).filter((id) => id.startsWith("as_of_"));
  }, [apData.periodData]);
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
    const existingPeriodIds = new Set(apData.periodData.map((p) => p.periodId));
    const newPeriodData = [...apData.periodData];
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
    { key: "vendor", label: "Vendor Name", type: "text" },
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
    const totalAP2 = entriesWithTotals2.reduce((sum, e) => sum + e.total, 0);
    const currentAP2 = entriesWithTotals2.reduce((sum, e) => sum + e.current, 0);
    const overdueAP2 = totalAP2 - currentAP2;
    return { entriesWithTotals: entriesWithTotals2, totalAP: totalAP2, currentAP: currentAP2, overdueAP: overdueAP2 };
  };
  const { entriesWithTotals, totalAP, currentAP, overdueAP } = currentPeriodData ? calculateTotals(currentPeriodData.entries) : { entriesWithTotals: [], totalAP: 0, currentAP: 0, overdueAP: 0 };
  const overduePercentage = totalAP ? (overdueAP / totalAP * 100).toFixed(1) : "0";
  const chartData = AGING_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    amount: entriesWithTotals.reduce((sum, e) => sum + (e[bucket.key] || 0), 0)
  }));
  const topVendors = [...entriesWithTotals].filter((e) => e.vendor && e.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const topVendorTotal = topVendors.reduce((sum, v) => sum + v.total, 0);
  const concentration = totalAP ? (topVendorTotal / totalAP * 100).toFixed(1) : "0";
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
      ...apData,
      periodData: updatedPeriodData,
      summary: { totalAP, currentAP, overdueAP }
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
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "AP Aging" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze accounts payable aging by period" })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Please configure periods in the Company Information section first, or sync data from QuickBooks." }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "AP Aging" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze accounts payable aging and vendor concentration" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: selectedPeriodId, onValueChange: setSelectedPeriodId, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-48", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select period" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: allPeriodOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.id, children: option.label }, option.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total AP", value: totalAP, icon: Clock }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Overdue AP", value: overdueAP, icon: AlertTriangle, subtitle: `${overduePercentage}% of total` }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Top 5 Concentration", value: `${concentration}%`, icon: Building2 }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Current AP", value: currentAP, icon: Percent, subtitle: "Not yet due" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
          "AP Aging - ",
          getSelectedPeriodLabel()
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns,
              data: entriesWithTotals,
              onDataChange: handleDataChange,
              allowAddRow: entriesWithTotals.length < AP_AGING_CONTRACT.maxVendorsPerPeriod,
              allowDeleteRow: false
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Accounts Payable" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              totalAP.toLocaleString()
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
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top Vendors by AP Balance" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: topVendors.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-2", children: topVendors.map((vendor, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-muted-foreground", children: [
            "#",
            index + 1
          ] }),
          /* @__PURE__ */ jsx("span", { children: vendor.vendor })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            "$",
            vendor.total.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            totalAP ? (vendor.total / totalAP * 100).toFixed(1) : 0,
            "% of total"
          ] })
        ] })
      ] }, vendor.id)) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-4", children: "Enter vendor data to see top vendors" }) })
    ] })
  ] });
};
export {
  APAgingSection
};
