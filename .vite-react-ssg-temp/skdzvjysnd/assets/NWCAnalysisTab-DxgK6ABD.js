import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, O as calcNWCExCash, ay as marginCells, a0 as calcNetWorkingCapital, a1 as calcTotalCurrentAssets, a2 as calcTotalCurrentLiabilities, aH as bsEndingBalanceCells, aI as negatedBsEndingBalanceCells, N as sumByLineItem, F as calcRevenue, aj as calcCOGS } from "./sanitizeWizardData-nrsUY-BP.js";
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
function NWCAnalysisTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
    const columns = buildStandardColumns(dealData, "NWC Analysis", { labelWidth: 280 });
    const rows = [
      // Net working capital - reported to adjusted
      { id: "hdr-nwc", type: "section-header", label: "Net working capital - reported to adjusted", cells: { label: "Net working capital - reported to adjusted" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc((p) => sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc((p) => sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc((p) => calcTotalCurrentAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      // Liabilities: negate for display
      { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc((p) => sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc((p) => calcTotalCurrentLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },
      // NWC: CA + CL_raw (CL_raw is negative) = CA - |CL| which is the correct NWC number
      { id: "nwc-reported", type: "total", cells: { label: "Net working capital", ...bc((p) => calcNetWorkingCapital(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },
      // Normal NWC adjustments (remove cash from NWC)
      { id: "hdr-adj", type: "section-header", label: "Normal NWC adjustments", cells: { label: "Normal NWC adjustments" } },
      { id: "adj-cash", type: "data", indent: 1, cells: { label: "Remove: Cash and cash equivalents", ...bc((p) => -sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "s4", type: "spacer", cells: {} },
      // NWC ex. Cash (reported)
      { id: "nwc-ex-cash", type: "total", cells: { label: "Net working capital, reported (ex. cash)", ...bc((p) => calcNWCExCash(tb, p)) } },
      { id: "s5", type: "spacer", cells: {} },
      // Change in reported NWC
      { id: "hdr-change-rpt", type: "section-header", label: "Change in reported NWC", cells: { label: "Change in reported NWC" } },
      { id: "change-nwc-dollar", type: "data", cells: { label: "$ Change in NWC ex. Cash", ...(() => {
        const { periods, aggregatePeriods, priorBalances } = dealData.deal;
        const cells = {};
        const priorNWCExCash = () => {
          if (!priorBalances || Object.keys(priorBalances).length === 0) return 0;
          let total = 0;
          for (const e of tb) {
            if (e.fsType !== "BS") continue;
            const resolved = sumByLineItem([e], "Accounts receivable", "__test__") !== 0 ? true : sumByLineItem([e], "Other current assets", "__test__") !== 0 ? true : sumByLineItem([e], "Current liabilities", "__test__") !== 0 ? true : sumByLineItem([e], "Other current liabilities", "__test__") !== 0 ? true : false;
            if (resolved && sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0) {
              total += priorBalances[e.accountId] ?? 0;
            }
          }
          return total;
        };
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            const prior = priorNWCExCash();
            cells[periods[i].id] = prior !== 0 ? calcNWCExCash(tb, periods[i].id) - prior : 0;
          } else {
            cells[periods[i].id] = calcNWCExCash(tb, periods[i].id) - calcNWCExCash(tb, periods[i - 1].id);
          }
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + (cells[pid] || 0), 0);
        }
        return cells;
      })() } },
      { id: "change-nwc-pct", type: "data", format: "percent", cells: { label: "Change in NWC as % of Revenue", ...marginCells(
        dealData,
        (p) => {
          const { periods } = dealData.deal;
          const idx = periods.findIndex((pp) => pp.id === p);
          if (idx <= 0) return 0;
          return calcNWCExCash(tb, p) - calcNWCExCash(tb, periods[idx - 1].id);
        },
        (p) => calcRevenue(tb, p)
      ) } },
      { id: "s6", type: "spacer", cells: {} },
      // Additional NWC adjustments (placeholder for user entries)
      { id: "hdr-add-adj", type: "section-header", label: "Additional NWC adjustments", cells: { label: "Additional NWC adjustments" } },
      { id: "add-adj-placeholder", type: "data", editable: true, indent: 1, cells: { label: "Additional adjustment 1" } },
      { id: "s7", type: "spacer", cells: {} },
      // NWC adjusted
      { id: "nwc-adjusted", type: "total", cells: { label: "Net working capital, adjusted", ...bc((p) => calcNWCExCash(tb, p)) } },
      { id: "s8", type: "spacer", cells: {} },
      // Change in adjusted NWC
      { id: "hdr-change-adj", type: "section-header", label: "Change in adjusted NWC", cells: { label: "Change in adjusted NWC" } },
      { id: "change-adj-dollar", type: "data", cells: { label: "$ Change in adjusted NWC", ...(() => {
        const { periods, aggregatePeriods, priorBalances } = dealData.deal;
        const cells = {};
        const priorNWCExCash2 = () => {
          if (!priorBalances || Object.keys(priorBalances).length === 0) return 0;
          let total = 0;
          for (const e of tb) {
            if (e.fsType !== "BS") continue;
            const isNWCNonCash = (sumByLineItem([e], "Accounts receivable", "__test__") !== 0 || sumByLineItem([e], "Other current assets", "__test__") !== 0 || sumByLineItem([e], "Current liabilities", "__test__") !== 0 || sumByLineItem([e], "Other current liabilities", "__test__") !== 0) && sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0;
            if (isNWCNonCash) total += priorBalances[e.accountId] ?? 0;
          }
          return total;
        };
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            const prior = priorNWCExCash2();
            cells[periods[i].id] = prior !== 0 ? calcNWCExCash(tb, periods[i].id) - prior : 0;
          } else {
            cells[periods[i].id] = calcNWCExCash(tb, periods[i].id) - calcNWCExCash(tb, periods[i - 1].id);
          }
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + (cells[pid] || 0), 0);
        }
        return cells;
      })() } },
      { id: "s9", type: "spacer", cells: {} },
      // Trailing Averages
      { id: "hdr-trail", type: "section-header", label: "Trailing Averages", cells: { label: "Trailing Averages" } },
      { id: "trail-ar", type: "data", format: "number", cells: { label: "A/R Days Outstanding", ...bc((p) => {
        const ar = sumByLineItem(tb, "Accounts receivable", p);
        const rev = calcRevenue(tb, p);
        return rev === 0 ? 0 : ar / Math.abs(rev) * 30;
      }) } },
      { id: "trail-ap", type: "data", format: "number", cells: { label: "A/P Days Outstanding", ...bc((p) => {
        const ap = sumByLineItem(tb, "Current liabilities", p);
        const cogs = calcCOGS(tb, p);
        return cogs === 0 ? 0 : Math.abs(ap) / Math.abs(cogs) * 30;
      }) } },
      { id: "s10", type: "spacer", cells: {} },
      // Check
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
      { id: "check", type: "check", cells: {
        label: "Check to BS (should = 0)",
        ...bc((p) => {
          const nwc = calcNetWorkingCapital(tb, p);
          const ca = calcTotalCurrentAssets(tb, p);
          const cl = calcTotalCurrentLiabilities(tb, p);
          const diff = nwc - (ca + cl);
          return Math.abs(diff) < 0.01 ? 0 : diff;
        })
      }, checkPassed: dealData.deal.periods.every((p) => {
        const nwc = calcNetWorkingCapital(tb, p.id);
        const ca = calcTotalCurrentAssets(tb, p.id);
        const cl = calcTotalCurrentLiabilities(tb, p.id);
        return Math.abs(nwc - (ca + cl)) < 0.01;
      }) }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  NWCAnalysisTab
};
