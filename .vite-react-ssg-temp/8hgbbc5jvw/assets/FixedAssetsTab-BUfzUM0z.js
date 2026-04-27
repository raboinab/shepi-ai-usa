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
function FixedAssetsTab({ dealData }) {
  const gridData = useMemo(() => {
    const columns = [
      { key: "desc", label: "Description", width: 200, frozen: true, format: "text" },
      { key: "category", label: "Category", width: 120, format: "text" },
      { key: "date", label: "Acquired", width: 100, format: "text" },
      { key: "cost", label: "Cost", width: 100, format: "currency" },
      { key: "depr", label: "Accum Depr", width: 100, format: "currency" },
      { key: "nbv", label: "Net Book Value", width: 100, format: "currency" }
    ];
    const rows = dealData.fixedAssets.map((fa, i) => ({
      id: `fa-${i}`,
      type: "data",
      editable: true,
      cells: { desc: fa.description, category: fa.category, date: fa.acquisitionDate, cost: fa.cost, depr: fa.accumulatedDepreciation, nbv: fa.netBookValue }
    }));
    if (rows.length > 0) {
      rows.push({ id: "total", type: "total", cells: {
        desc: "Total",
        category: "",
        date: "",
        cost: dealData.fixedAssets.reduce((s, f) => s + f.cost, 0),
        depr: dealData.fixedAssets.reduce((s, f) => s + f.accumulatedDepreciation, 0),
        nbv: dealData.fixedAssets.reduce((s, f) => s + f.netBookValue, 0)
      } });
    }
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  FixedAssetsTab
};
