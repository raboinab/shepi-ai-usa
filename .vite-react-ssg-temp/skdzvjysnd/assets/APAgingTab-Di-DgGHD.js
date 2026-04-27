import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import "@tanstack/react-virtual";
import "./sanitizeWizardData-nrsUY-BP.js";
import "../main.mjs";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
function formatAgingPeriodLabel(key) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const match = key.match(/(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = months[parseInt(match[2], 10) - 1] || match[2];
    const prefix = key.startsWith("as_of_") ? "As of " : "";
    return `${prefix}${month} ${year}`;
  }
  return key;
}
function APAgingTab({ dealData }) {
  const gridData = useMemo(() => {
    const columns = [
      { key: "label", label: "Vendor", width: 200, frozen: true, format: "text" },
      { key: "current", label: "Current", width: 90, format: "currency" },
      { key: "d30", label: "1-30", width: 90, format: "currency" },
      { key: "d60", label: "31-60", width: 90, format: "currency" },
      { key: "d90", label: "61-90", width: 90, format: "currency" },
      { key: "d90p", label: "90+", width: 90, format: "currency" },
      { key: "total", label: "Total", width: 100, format: "currency" }
    ];
    const rows = [];
    const agingPeriods = Object.keys(dealData.apAging).sort();
    if (agingPeriods.length === 0) {
      rows.push({ id: "empty", type: "data", cells: { label: "No data", current: null, d30: null, d60: null, d90: null, d90p: null, total: null } });
    } else {
      for (const periodKey of agingPeriods) {
        const entries = dealData.apAging[periodKey];
        const label = formatAgingPeriodLabel(periodKey);
        rows.push({ id: `hdr-${periodKey}`, type: "section-header", label, cells: { label } });
        for (const [i, e] of entries.entries()) {
          rows.push({ id: `ap-${periodKey}-${i}`, type: "data", editable: true, cells: { label: e.name, current: e.current, d30: e.days1to30, d60: e.days31to60, d90: e.days61to90, d90p: e.days90plus, total: e.total } });
        }
        if (entries.length === 0) {
          rows.push({ id: `empty-${periodKey}`, type: "data", cells: { label: "No data", current: null, d30: null, d60: null, d90: null, d90p: null, total: null } });
        } else {
          const totals = entries.reduce(
            (acc, e) => ({
              current: acc.current + e.current,
              d30: acc.d30 + e.days1to30,
              d60: acc.d60 + e.days31to60,
              d90: acc.d90 + e.days61to90,
              d90p: acc.d90p + e.days90plus,
              total: acc.total + e.total
            }),
            { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, total: 0 }
          );
          rows.push({ id: `total-${periodKey}`, type: "total", cells: { label: "Total AP", ...totals } });
        }
        rows.push({ id: `sp-${periodKey}`, type: "spacer", cells: {} });
      }
    }
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  APAgingTab
};
