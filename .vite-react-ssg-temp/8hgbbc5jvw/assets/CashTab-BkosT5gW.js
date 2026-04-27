import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aF as getEntriesByLineItem, aJ as bsEntryCells, aH as bsEndingBalanceCells, N as sumByLineItem } from "./sanitizeWizardData-nrsUY-BP.js";
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
function CashTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Cash and cash equivalents");
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const columns = [
      { key: "label", label: "Cash", width: 280, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const rows = entries.map((e) => ({
      id: e.accountId,
      type: "data",
      indent: 1,
      cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) }
    }));
    rows.push({
      id: "total",
      type: "total",
      cells: { label: "Total Cash", ...bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p)) }
    });
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  CashTab
};
