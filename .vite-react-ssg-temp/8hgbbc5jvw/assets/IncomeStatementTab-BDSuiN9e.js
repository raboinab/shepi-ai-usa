import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, F as calcRevenue, J as calcAdjustedEBITDA, I as calcReportedEBITDA, az as calcAdjustmentTotal, aw as negatedPeriodCells, ax as periodCells, ay as marginCells, aj as calcCOGS, am as calcOtherExpense, as as calcInterestExpense, ah as calcIncomeTaxExpense, an as calcDepreciationExpense, G as calcGrossProfit, H as calcNetIncome, aE as sumByFsType, ak as calcOpEx, al as calcPayroll } from "./sanitizeWizardData-nrsUY-BP.js";
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
function IncomeStatementTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const npc = (fn) => negatedPeriodCells(dealData, fn);
    const pc = (fn) => periodCells(dealData, fn);
    const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
    const columns = buildStandardColumns(dealData, "");
    const calcTotalOpEx = (p) => calcOpEx(tb, p) + calcPayroll(tb, p);
    const rows = [
      // -- Income Statement - as reported --
      { id: "hdr-reported", type: "section-header", label: "Income Statement - as reported", cells: { label: "Income Statement - as reported" } },
      // Revenue is a credit (negative in TB) → negate for positive display
      { id: "revenue", type: "data", cells: { label: "Revenue", ...npc((p) => calcRevenue(tb, p)) } },
      // COGS is a debit (positive in TB) → display as-is
      { id: "cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc((p) => calcCOGS(tb, p)) } },
      // Gross Profit = Revenue - COGS (in display terms). In TB: rev+cogs = negative when profitable. Negate.
      { id: "gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc((p) => calcGrossProfit(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "opex", type: "data", cells: { label: "Operating Expenses", ...pc((p) => calcTotalOpEx(p)) } },
      // Operating income = gross profit + opex in TB terms (negative+positive). Negate for display.
      { id: "op-income", type: "subtotal", cells: { label: "Operating income", ...npc((p) => calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
      { id: "s2", type: "spacer", cells: {} },
      { id: "other", type: "data", cells: { label: "Other expense (income)", ...pc((p) => calcOtherExpense(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },
      // Net Income: stored as sum of IS (negative when profitable). Negate for display.
      { id: "net-income", type: "total", cells: { label: "Net income (loss)", ...npc((p) => calcNetIncome(tb, p)) } },
      { id: "s4", type: "spacer", cells: {} },
      // -- EBITDA addbacks --
      { id: "hdr-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
      { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
      { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s5", type: "spacer", cells: {} },
      // Reported EBITDA is negative in TB when profitable → negate
      { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc((p) => calcReportedEBITDA(tb, p, ab)) } },
      { id: "s6", type: "spacer", cells: {} },
      // -- Income Statement - as adjusted --
      { id: "hdr-adjusted", type: "section-header", label: "Income Statement - as adjusted", cells: { label: "Income Statement - as adjusted" } },
      // Revenue, COGS, OpEx show as-reported — adjustments flow through a dedicated bridge row (industry standard)
      { id: "adj-revenue", type: "data", cells: { label: "Revenue", ...npc((p) => calcRevenue(tb, p)) } },
      { id: "adj-cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc((p) => calcCOGS(tb, p)) } },
      { id: "adj-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc((p) => calcGrossProfit(tb, p)) } },
      { id: "s-adj1", type: "spacer", cells: {} },
      { id: "adj-opex", type: "data", cells: { label: "Operating Expenses", ...pc((p) => calcTotalOpEx(p)) } },
      { id: "adj-op-income", type: "subtotal", cells: { label: "Operating income", ...npc((p) => calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
      { id: "s-adj2", type: "spacer", cells: {} },
      // Dedicated QoE Adjustments bridge row: positive = adds to EBITDA (industry standard addback display)
      { id: "qoe-adjustments", type: "data", indent: 1, cells: { label: "QoE Adjustments", ...pc((p) => calcAdjustmentTotal(adj, "all", p)) } },
      { id: "s-adj2b", type: "spacer", cells: {} },
      { id: "adj-other", type: "data", cells: { label: "Other expense (income)", ...pc((p) => calcOtherExpense(tb, p)) } },
      { id: "s-adj3", type: "spacer", cells: {} },
      { id: "adj-net-income", type: "total", cells: { label: "Net income (loss)", ...npc((p) => calcNetIncome(tb, p) - calcAdjustmentTotal(adj, "all", p)) } },
      { id: "s-adj4", type: "spacer", cells: {} },
      // -- EBITDA addbacks (adjusted) --
      { id: "hdr-adj-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
      { id: "adj-interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
      { id: "adj-taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "adj-depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s-adj5", type: "spacer", cells: {} },
      // calcAdjustedEBITDA already uses subtraction internally ✓
      { id: "adj-ebitda", type: "total", cells: { label: "Adjusted EBITDA", ...npc((p) => calcAdjustedEBITDA(tb, adj, p, ab)) } },
      { id: "s7", type: "spacer", cells: {} },
      // -- % of Revenue --
      { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
      { id: "rev-growth", type: "data", format: "percent", cells: { label: "Revenue growth", ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            cells[periods[i].id] = NaN;
            continue;
          }
          const prior = -calcRevenue(tb, periods[i - 1].id);
          const current = -calcRevenue(tb, periods[i].id);
          cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = NaN;
        }
        return cells;
      })() } },
      // Margins: numerator negated (to make EBITDA/GP positive), denominator is |revenue|
      { id: "gm", type: "data", format: "percent", cells: { label: "Gross margin", ...mc((p) => -calcGrossProfit(tb, p), (p) => calcRevenue(tb, p)) } },
      { id: "om", type: "data", format: "percent", cells: { label: "Operating margin", ...mc((p) => -(calcGrossProfit(tb, p) + calcTotalOpEx(p)), (p) => calcRevenue(tb, p)) } },
      { id: "em", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc((p) => -calcReportedEBITDA(tb, p, ab), (p) => calcRevenue(tb, p)) } },
      { id: "aem", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc((p) => -calcAdjustedEBITDA(tb, adj, p, ab), (p) => calcRevenue(tb, p)) } },
      { id: "nm", type: "data", format: "percent", cells: { label: "Net margin", ...mc((p) => -calcNetIncome(tb, p), (p) => calcRevenue(tb, p)) } },
      { id: "s8", type: "spacer", cells: {} },
      // -- Check rows --
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
      {
        id: "check-qoe",
        type: "check",
        cells: { label: "Check to QoE (should = 0)", ...pc((p) => {
          const isAdj = calcAdjustedEBITDA(tb, adj, p, ab);
          const qoeAdj = calcReportedEBITDA(tb, p, ab) - calcAdjustmentTotal(adj, "all", p);
          const diff = isAdj - qoeAdj;
          return Math.abs(diff) < 0.01 ? 0 : diff;
        }) },
        checkPassed: dealData.deal.periods.every((p) => {
          const isAdj = calcAdjustedEBITDA(tb, adj, p.id, ab);
          const qoeAdj = calcReportedEBITDA(tb, p.id, ab) - calcAdjustmentTotal(adj, "all", p.id);
          return Math.abs(isAdj - qoeAdj) < 0.01;
        })
      },
      {
        id: "check-tb",
        type: "check",
        cells: { label: "Check to TB (should = 0)", ...pc((p) => {
          const isTotal = sumByFsType(tb, "IS", p);
          const lineTotal = calcRevenue(tb, p) + calcCOGS(tb, p) + calcOpEx(tb, p) + calcPayroll(tb, p) + calcOtherExpense(tb, p);
          return Math.abs(isTotal - lineTotal) < 0.01 ? 0 : isTotal - lineTotal;
        }) },
        checkPassed: true
      }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  IncomeStatementTab
};
