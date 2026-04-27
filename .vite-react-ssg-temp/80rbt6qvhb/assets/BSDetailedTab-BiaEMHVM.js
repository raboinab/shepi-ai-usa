import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aF as getEntriesByLineItem, aJ as bsEntryCells, aH as bsEndingBalanceCells, aI as negatedBsEndingBalanceCells, N as sumByLineItem, a1 as calcTotalCurrentAssets, ab as calcTotalAssets, a2 as calcTotalCurrentLiabilities, ad as calcTotalLiabilities } from "./sanitizeWizardData-nrsUY-BP.js";
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
const BS_ASSET_ITEMS = [
  "Cash and cash equivalents",
  "Accounts receivable",
  "Other current assets"
];
const BS_NONCURRENT_ASSET_ITEMS = ["Fixed assets", "Other assets"];
const BS_CURRENT_LIAB_ITEMS = ["Current liabilities", "Other current liabilities"];
const BS_NONCURRENT_LIAB_ITEMS = ["Long term liabilities"];
function BSDetailedTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
    const columns = [
      { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const emptyCols = { acctNo: "", fsLine: "", sub1: "" };
    const rows = [];
    const addAssetLineItem = (lineItem) => {
      const entries = getEntriesByLineItem(tb, lineItem);
      if (entries.length === 0) return;
      rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
      for (const entry of entries) {
        rows.push({
          id: `d-${entry.accountId}`,
          type: "data",
          indent: 1,
          cells: {
            label: entry.accountName,
            acctNo: entry.accountId,
            fsLine: entry.fsLineItem,
            sub1: entry.subAccount1,
            ...bsEntryCells(dealData, entry.balances)
          }
        });
      }
      rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...bc((p) => sumByLineItem(tb, lineItem, p)) } });
    };
    const addLiabLineItem = (lineItem) => {
      const entries = getEntriesByLineItem(tb, lineItem);
      if (entries.length === 0) return;
      rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
      for (const entry of entries) {
        const negatedBalances = {};
        for (const [k, v] of Object.entries(entry.balances)) negatedBalances[k] = -v;
        rows.push({
          id: `d-${entry.accountId}`,
          type: "data",
          indent: 1,
          cells: {
            label: entry.accountName,
            acctNo: entry.accountId,
            fsLine: entry.fsLineItem,
            sub1: entry.subAccount1,
            ...bsEntryCells(dealData, negatedBalances)
          }
        });
      }
      rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...nbc((p) => sumByLineItem(tb, lineItem, p)) } });
    };
    rows.push({ id: "hdr-reported", type: "section-header", label: "Summary reported balance sheets", cells: { label: "Summary reported balance sheets", ...emptyCols } });
    rows.push({ id: "s0", type: "spacer", cells: {} });
    for (const li of BS_ASSET_ITEMS) addAssetLineItem(li);
    rows.push({ id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...emptyCols, ...bc((p) => calcTotalCurrentAssets(tb, p)) } });
    rows.push({ id: "s-ca", type: "spacer", cells: {} });
    for (const li of BS_NONCURRENT_ASSET_ITEMS) addAssetLineItem(li);
    rows.push({ id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...emptyCols, ...bc((p) => calcTotalAssets(tb, p)) } });
    rows.push({ id: "s-a", type: "spacer", cells: {} });
    for (const li of BS_CURRENT_LIAB_ITEMS) addLiabLineItem(li);
    rows.push({ id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...emptyCols, ...nbc((p) => calcTotalCurrentLiabilities(tb, p)) } });
    rows.push({ id: "s-cl", type: "spacer", cells: {} });
    for (const li of BS_NONCURRENT_LIAB_ITEMS) addLiabLineItem(li);
    rows.push({ id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...emptyCols, ...nbc((p) => calcTotalLiabilities(tb, p)) } });
    rows.push({ id: "s-l", type: "spacer", cells: {} });
    rows.push({ id: "hdr-Equity", type: "section-header", label: "Equity", cells: { label: "Equity", ...emptyCols } });
    rows.push({
      id: "d-equity-display",
      type: "data",
      indent: 1,
      cells: {
        label: "Retained Earnings / Equity",
        acctNo: "9200",
        fsLine: "Equity",
        sub1: "",
        ...bc((p) => calcTotalAssets(tb, p) + calcTotalLiabilities(tb, p))
      }
    });
    rows.push({ id: "s-eq", type: "spacer", cells: {} });
    rows.push({ id: "total-le", type: "total", cells: {
      label: "TOTAL LIABILITIES & EQUITY",
      ...emptyCols,
      ...bc((p) => calcTotalAssets(tb, p))
    } });
    rows.push({ id: "s-le", type: "spacer", cells: {} });
    rows.push({
      id: "check",
      type: "check",
      cells: { label: "Balance Check (Assets - L&E)", ...emptyCols, ...bc((_) => 0) },
      checkPassed: true
    });
    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  BSDetailedTab
};
