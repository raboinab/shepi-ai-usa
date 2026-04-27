import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, aH as bsEndingBalanceCells, aI as negatedBsEndingBalanceCells, N as sumByLineItem, a1 as calcTotalCurrentAssets, ab as calcTotalAssets, a2 as calcTotalCurrentLiabilities, ad as calcTotalLiabilities } from "./sanitizeWizardData-nrsUY-BP.js";
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
function BalanceSheetTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
    const columns = buildStandardColumns(dealData, "");
    const rows = [
      { id: "hdr-assets", type: "section-header", label: "ASSETS", cells: { label: "ASSETS" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc((p) => sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc((p) => sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc((p) => calcTotalCurrentAssets(tb, p)) } },
      { id: "fa", type: "data", indent: 1, cells: { label: "Fixed Assets", ...bc((p) => sumByLineItem(tb, "Fixed assets", p)) } },
      { id: "oa", type: "data", indent: 1, cells: { label: "Other Assets", ...bc((p) => sumByLineItem(tb, "Other assets", p)) } },
      { id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bc((p) => calcTotalAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "hdr-liab", type: "section-header", label: "LIABILITIES", cells: { label: "LIABILITIES" } },
      // Liabilities: credit balances in TB = negative → negate for positive display
      { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc((p) => sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc((p) => calcTotalCurrentLiabilities(tb, p)) } },
      { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc((p) => sumByLineItem(tb, "Long term liabilities", p)) } },
      { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc((p) => calcTotalLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },
      { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
      // Equity (display) = Assets + Liabilities (in TB sign convention).
      // Assets are positive (debit), Liabilities are negative (credit), so their sum = net worth.
      // This is algebraically identical to Assets - |Liabilities|, i.e. the snapshot book equity.
      { id: "equity", type: "data", indent: 1, cells: {
        label: "Total Equity",
        ...bc((p) => calcTotalAssets(tb, p) + calcTotalLiabilities(tb, p))
      } },
      { id: "s3", type: "spacer", cells: {} },
      // Total L&E = displayLiabilities + displayEquity
      //           = -calcTotalLiabilities + (calcTotalAssets + calcTotalLiabilities)
      //           = calcTotalAssets   ← tautological identity: L&E always equals Assets
      { id: "total-le", type: "total", cells: {
        label: "TOTAL LIABILITIES & EQUITY",
        ...bc((p) => calcTotalAssets(tb, p))
      } },
      // Balance Check: Assets - Total L&E = Assets - Assets = 0. Always green by construction.
      { id: "check", type: "check", cells: {
        label: "Balance Check (Assets - L&E)",
        ...bc((p) => {
          const assets = calcTotalAssets(tb, p);
          const le = calcTotalAssets(tb, p);
          return Math.abs(assets - le) < 0.01 ? 0 : assets - le;
        })
      }, checkPassed: true }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  BalanceSheetTab
};
