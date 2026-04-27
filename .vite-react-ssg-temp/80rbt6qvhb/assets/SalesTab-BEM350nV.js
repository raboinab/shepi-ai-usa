import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aK as buildBreakdownGrid } from "./sanitizeWizardData-nrsUY-BP.js";
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
function SalesTab({ dealData }) {
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Revenue",
    title: "Revenue",
    negateValues: true
    // Revenue is credit (negative in TB) → flip to positive for display
  }), [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  SalesTab
};
