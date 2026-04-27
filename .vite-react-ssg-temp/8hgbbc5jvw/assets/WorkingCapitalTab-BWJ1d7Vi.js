import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, O as calcNWCExCash, aA as reclassAwareRevenueRaw, aH as bsEndingBalanceCells, aI as negatedBsEndingBalanceCells, N as sumByLineItem, a1 as calcTotalCurrentAssets, a2 as calcTotalCurrentLiabilities, a0 as calcNetWorkingCapital } from "./sanitizeWizardData-nrsUY-BP.js";
import "@tanstack/react-virtual";
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
function WorkingCapitalTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const rc = dealData.reclassifications ?? [];
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
    const columns = buildStandardColumns(dealData, "Working Capital Summary", { labelWidth: 280 });
    const rows = [
      { id: "hdr-ca", type: "section-header", label: "Current Assets", cells: { label: "Current Assets" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc((p) => sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc((p) => sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc((p) => calcTotalCurrentAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "hdr-cl", type: "section-header", label: "Current Liabilities", cells: { label: "Current Liabilities" } },
      // Liabilities: credit = negative in TB → negate for positive display
      { id: "cl", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc((p) => sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc((p) => calcTotalCurrentLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },
      // NWC = CA - CL. In TB: CA (positive) - (-CL_raw) = CA + CL_raw. calcNetWorkingCapital returns CA + CL_raw (since CL_raw is negative).
      // For display: we want CA - displayed_CL. displayed_CL = -CL_raw, so NWC_display = CA - (-CL_raw) = CA + CL_raw = calcNetWorkingCapital. Already correct.
      { id: "nwc", type: "total", cells: { label: "Net Working Capital", ...bc((p) => calcNetWorkingCapital(tb, p)) } },
      { id: "nwc-ex", type: "subtotal", cells: { label: "NWC ex. Cash", ...bc((p) => calcNWCExCash(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },
      // NWC as % of Revenue
      // Use ending-balance NWC / annualized revenue to avoid summing a stock variable
      { id: "hdr-pct", type: "section-header", label: "NWC as % of Revenue", cells: { label: "NWC as % of Revenue" } },
      {
        id: "nwc-pct",
        type: "data",
        format: "percent",
        cells: {
          label: "NWC ex. Cash / Revenue",
          ...(() => {
            const { periods, aggregatePeriods } = dealData.deal;
            const cells = {};
            for (const p of periods) {
              const nwc = calcNWCExCash(tb, p.id);
              const annualRev = Math.abs(reclassAwareRevenueRaw(tb, rc, p.id)) * 12;
              cells[p.id] = annualRev === 0 ? NaN : nwc / annualRev;
            }
            for (const ap of aggregatePeriods) {
              const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
              const nwc = lastPid ? calcNWCExCash(tb, lastPid) : 0;
              const annualRev = Math.abs(
                ap.monthPeriodIds.reduce((s, pid) => s + reclassAwareRevenueRaw(tb, rc, pid), 0)
              );
              cells[ap.id] = annualRev === 0 ? NaN : nwc / annualRev;
            }
            return cells;
          })()
        }
      }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  WorkingCapitalTab
};
