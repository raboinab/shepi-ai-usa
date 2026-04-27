import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aK as buildBreakdownGrid, ak as calcOpEx, al as calcPayroll } from "./sanitizeWizardData-nrsUY-BP.js";
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
function OpExTab({ dealData }) {
  const tb = dealData.trialBalance;
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Operating expenses",
    title: "Operating Expenses",
    pctLabel: "% of Operating Expenses",
    pctDenominator: (p) => calcOpEx(tb, p) + calcPayroll(tb, p)
  }), [dealData, tb]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  OpExTab
};
