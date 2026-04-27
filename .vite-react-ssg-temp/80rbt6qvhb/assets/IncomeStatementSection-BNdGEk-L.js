import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { C as Card, f as CardContent } from "../main.mjs";
import { FileSpreadsheet } from "lucide-react";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-BBrix0D8.js";
import { g as getReportDashboard, R as ReportDashboardHeader } from "./reportDashboardMetrics-CCrfX0F0.js";
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
import "./SummaryCard-D2BKAjm6.js";
import "recharts";
import "./sanitizeWizardData-nrsUY-BP.js";
import "./InsightsView-BkA7fJjp.js";
import "react-resizable-panels";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-CSM87NBF.js";
import "./spinner-DXdBpr08.js";
import "react-markdown";
import "./progress-DNO9VJ6D.js";
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
