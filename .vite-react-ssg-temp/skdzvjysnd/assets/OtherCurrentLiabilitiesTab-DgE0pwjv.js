import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aF as getEntriesByLineItem, aJ as bsEntryCells, aI as negatedBsEndingBalanceCells, N as sumByLineItem } from "./sanitizeWizardData-nrsUY-BP.js";
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
function OtherCurrentLiabilitiesTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Other current liabilities");
    const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
    const columns = [
      { key: "label", label: "Other Current Liabilities", width: 280, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const ec = { acctNo: "", fsLine: "" };
    const rows = [
      { id: "hdr-reported", type: "section-header", label: "Other Current Liabilities - reported", cells: { label: "Other Current Liabilities - reported", ...ec } }
    ];
    for (const e of entries) {
      const negatedBalances = {};
      for (const [k, v] of Object.entries(e.balances)) negatedBalances[k] = -v;
      rows.push({
        id: `rpt-${e.accountId}`,
        type: "data",
        indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, negatedBalances) }
      });
    }
    rows.push({
      id: "total-reported",
      type: "total",
      cells: { label: "Total Other Current Liabilities", ...ec, ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) }
    });
    rows.push({ id: "s1", type: "spacer", cells: {} });
    rows.push({ id: "hdr-adjusted", type: "section-header", label: "Other Current Liabilities - adjusted", cells: { label: "Other Current Liabilities - adjusted", ...ec } });
    for (const e of entries) {
      const negatedBalances = {};
      for (const [k, v] of Object.entries(e.balances)) negatedBalances[k] = -v;
      rows.push({
        id: `adj-${e.accountId}`,
        type: "data",
        indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, negatedBalances) }
      });
    }
    rows.push({
      id: "total-adjusted",
      type: "total",
      cells: { label: "Total Other Current Liabilities (adjusted)", ...ec, ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) }
    });
    rows.push({ id: "s2", type: "spacer", cells: {} });
    rows.push({
      id: "check",
      type: "check",
      checkPassed: true,
      cells: { label: "Check to BS (should = 0)", ...ec, ...nbc((p) => {
        const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
        const bsTotal = sumByLineItem(tb, "Other current liabilities", p);
        return Math.abs(total - bsTotal) < 0.01 ? 0 : total - bsTotal;
      }) }
    });
    return { columns, rows, frozenColumns: 3 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  OtherCurrentLiabilitiesTab
};
