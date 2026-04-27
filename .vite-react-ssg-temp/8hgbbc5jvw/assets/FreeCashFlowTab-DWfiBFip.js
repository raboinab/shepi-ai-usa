import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, aw as negatedPeriodCells, ax as periodCells, ah as calcIncomeTaxExpense, K as sumReclassImpact, J as calcAdjustedEBITDA, N as sumByLineItem, O as calcNWCExCash } from "./sanitizeWizardData-nrsUY-BP.js";
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
function FreeCashFlowTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const rc = dealData.reclassifications ?? [];
    const pc = (fn) => periodCells(dealData, fn);
    const npc = (fn) => negatedPeriodCells(dealData, fn);
    const columns = buildStandardColumns(dealData, "Free Cash Flow", { labelWidth: 280 });
    const calcNWCChange = (p) => {
      const { periods, priorBalances } = dealData.deal;
      const idx = periods.findIndex((pp) => pp.id === p);
      if (idx < 0) return 0;
      if (idx === 0) {
        if (priorBalances && Object.keys(priorBalances).length > 0) {
          let priorNWC = 0;
          for (const e of tb) {
            if (e.fsType !== "BS") continue;
            const isNWCNonCash = (sumByLineItem([e], "Accounts receivable", "__test__") !== 0 || sumByLineItem([e], "Other current assets", "__test__") !== 0 || sumByLineItem([e], "Current liabilities", "__test__") !== 0 || sumByLineItem([e], "Other current liabilities", "__test__") !== 0) && sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0;
            if (isNWCNonCash) priorNWC += priorBalances[e.accountId] ?? 0;
          }
          return priorNWC !== 0 ? calcNWCExCash(tb, p) - priorNWC : 0;
        }
        return 0;
      }
      return calcNWCExCash(tb, p) - calcNWCExCash(tb, periods[idx - 1].id);
    };
    const rows = [
      // Adjusted EBITDA: stored negative in TB when profitable → negate for display (with reclass overlay)
      { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc((p) => {
        const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
        return calcAdjustedEBITDA(tb, adj, p, ab) + isReclass;
      }) } },
      // NWC increase = cash used = display as negative deduction
      { id: "nwc-change", type: "data", cells: { label: "Change in NWC", ...pc((p) => -calcNWCChange(p)) } },
      { id: "capex", type: "data", editable: true, cells: { label: "Capital Expenditures", ...pc((_) => 0) } },
      { id: "taxes", type: "data", editable: true, cells: { label: "Estimated Taxes", ...pc((p) => -calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "s1", type: "spacer", cells: {} },
      // FCF = Adj EBITDA - ΔNWC - Taxes (with reclass overlay)
      { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc((p) => {
        const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
        return -(calcAdjustedEBITDA(tb, adj, p, ab) + isReclass) - calcNWCChange(p) - calcIncomeTaxExpense(tb, p, ab.taxes);
      }) } }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  FreeCashFlowTab
};
