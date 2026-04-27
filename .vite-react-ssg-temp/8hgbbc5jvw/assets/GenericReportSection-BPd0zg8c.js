import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, f as CardContent } from "../main.mjs";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-BBrix0D8.js";
import { g as getReportDashboard, R as ReportDashboardHeader } from "./reportDashboardMetrics-CCrfX0F0.js";
import { FileSpreadsheet } from "lucide-react";
import { useMemo } from "react";
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
const GenericReportSection = ({
  title,
  description,
  data,
  emptyMessage = "This report requires trial balance data. Complete the Core Data Entry steps to populate this report.",
  dealData,
  reportType
}) => {
  const reportData = data;
  const hasRawData = reportData?.rawData && reportData.rawData.length > 0;
  const dashboard = useMemo(() => {
    if (!dealData || !reportType) return null;
    return getReportDashboard(reportType, dealData);
  }, [dealData, reportType]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: description })
    ] }),
    dashboard && /* @__PURE__ */ jsx(ReportDashboardHeader, { config: dashboard }),
    hasRawData ? /* @__PURE__ */ jsx(
      SpreadsheetReportViewer,
      {
        rawData: reportData.rawData,
        syncedAt: reportData.syncedAt
      }
    ) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-12 h-12 text-muted-foreground/50 mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: emptyMessage }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/70 mt-2", children: "Enter your Chart of Accounts and Trial Balance to generate this report automatically." })
    ] }) })
  ] });
};
export {
  GenericReportSection
};
