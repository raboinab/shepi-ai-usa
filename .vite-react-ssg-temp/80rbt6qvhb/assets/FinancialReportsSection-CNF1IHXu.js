import { jsxs, jsx } from "react/jsx-runtime";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { TrendingUp, FileSpreadsheet, Wallet } from "lucide-react";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-BBrix0D8.js";
import "react";
import "@radix-ui/react-tabs";
import "../main.mjs";
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
import "./badge-BbLwm7hH.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
const FinancialReportsSection = ({
  incomeStatementData,
  balanceSheetData,
  cashFlowData
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Financial Reports" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Detailed financial statements from your QoE analysis" })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "pl", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "pl", className: "gap-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" }),
          "P&L Detail"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "bs", className: "gap-2", children: [
          /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-4 h-4" }),
          "Balance Sheet Detail"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "cf", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4" }),
          "Cash Flow Detail"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "pl", className: "mt-6", children: /* @__PURE__ */ jsx(
        SpreadsheetReportViewer,
        {
          rawData: incomeStatementData?.rawData || [],
          title: "Income Statement",
          syncedAt: incomeStatementData?.syncedAt,
          skipEmptyRows: true
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "bs", className: "mt-6", children: /* @__PURE__ */ jsx(
        SpreadsheetReportViewer,
        {
          rawData: balanceSheetData?.rawData || [],
          title: "Balance Sheet",
          syncedAt: balanceSheetData?.syncedAt,
          skipEmptyRows: true
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "cf", className: "mt-6", children: /* @__PURE__ */ jsx(
        SpreadsheetReportViewer,
        {
          rawData: cashFlowData?.rawData || [],
          title: "Free Cash Flow",
          syncedAt: cashFlowData?.syncedAt,
          skipEmptyRows: true
        }
      ) })
    ] })
  ] });
};
export {
  FinancialReportsSection
};
