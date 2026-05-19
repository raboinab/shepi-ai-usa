import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { C as Card, f as CardContent } from "../main.mjs";
import { FileSpreadsheet } from "lucide-react";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-CTLKkWnG.js";
import { g as getReportDashboard, R as ReportDashboardHeader } from "./reportDashboardMetrics-Ck_ocelc.js";
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
import "./table-BHTmwZ8v.js";
import "./scroll-area-DLvncVK9.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "./SummaryCard-B0tuxRGa.js";
import "recharts";
import "./sanitizeWizardData-Dv9tWNGG.js";
import "./InsightsView-C9eH5gNO.js";
import "react-resizable-panels";
import "./tabs-CJYPrMmK.js";
import "@radix-ui/react-tabs";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-RFtselAh.js";
import "./spinner-Cl42thGn.js";
import "react-markdown";
import "./progress-Y5q1JT93.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
const IncomeStatementSection = ({
  data,
  periods = [],
  fiscalYearEnd = 12,
  dealData
}) => {
  const hasRawData = data?.rawData && data.rawData.length > 0;
  const regularPeriods = periods.filter((p) => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;
  const dashboard = useMemo(() => {
    if (!dealData) return null;
    return getReportDashboard("incomeStatement", dealData);
  }, [dealData]);
  if (!hasPeriods) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Income Statement" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Revenue, expenses, and profitability metrics by period" })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "Please configure periods in the Company Info section first." }) }) })
    ] });
  }
  if (!hasRawData) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Income Statement" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Revenue, expenses, and profitability metrics by period" })
      ] }),
      dashboard && /* @__PURE__ */ jsx(ReportDashboardHeader, { config: dashboard }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No data available" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: "Sync data from your spreadsheet to view the Income Statement report." })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Income Statement" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Revenue, expenses, and profitability metrics by period" })
    ] }),
    dashboard && /* @__PURE__ */ jsx(ReportDashboardHeader, { config: dashboard }),
    /* @__PURE__ */ jsx(
      SpreadsheetReportViewer,
      {
        rawData: data.rawData,
        title: "Income Statement",
        syncedAt: data.syncedAt,
        skipEmptyRows: true
      }
    )
  ] });
};
export {
  IncomeStatementSection
};
