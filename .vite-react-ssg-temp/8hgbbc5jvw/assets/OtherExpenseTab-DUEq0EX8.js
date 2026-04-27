import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aK as buildBreakdownGrid, am as calcOtherExpense } from "./sanitizeWizardData-nrsUY-BP.js";
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
function OtherExpenseTab({ dealData }) {
  const tb = dealData.trialBalance;
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Other expense (income)",
    title: "Other Expense (Income)",
    pctLabel: "% of Other Expense (Income)",
    pctDenominator: (p) => calcOtherExpense(tb, p)
  }), [dealData, tb]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  OtherExpenseTab
};
