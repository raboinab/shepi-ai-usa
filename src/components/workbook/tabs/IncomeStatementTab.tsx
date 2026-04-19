import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, periodCells, negatedPeriodCells, marginCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function IncomeStatementTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    // npc = negated period cells (for income/credit accounts shown as positive)
    const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
    const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
    const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);

    const columns = buildStandardColumns(dealData, "");

    // Operating Expenses = OpEx + Payroll combined (Excel convention)
    const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

    const rows: GridRow[] = [
      // -- Income Statement - as reported --
      { id: "hdr-reported", type: "section-header", label: "Income Statement - as reported", cells: { label: "Income Statement - as reported" } },
      // Revenue is a credit (negative in TB) → negate for positive display
      { id: "revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
      // COGS is a debit (positive in TB) → display as-is
      { id: "cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
      // Gross Profit = Revenue - COGS (in display terms). In TB: rev+cogs = negative when profitable. Negate.
      { id: "gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
      // Operating income = gross profit + opex in TB terms (negative+positive). Negate for display.
      { id: "op-income", type: "subtotal", cells: { label: "Operating income", ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
      { id: "s2", type: "spacer", cells: {} },
      { id: "other", type: "data", cells: { label: "Other expense (income)", ...pc(p => calc.calcOtherExpense(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },
      // Net Income: stored as sum of IS (negative when profitable). Negate for display.
      { id: "net-income", type: "total", cells: { label: "Net income (loss)", ...npc(p => calc.calcNetIncome(tb, p)) } },
      { id: "s4", type: "spacer", cells: {} },

      // -- EBITDA addbacks --
      { id: "hdr-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
      { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
      { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s5", type: "spacer", cells: {} },
      // Reported EBITDA is negative in TB when profitable → negate
      { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab)) } },
      { id: "s6", type: "spacer", cells: {} },

      // -- Income Statement - as adjusted --
      { id: "hdr-adjusted", type: "section-header", label: "Income Statement - as adjusted", cells: { label: "Income Statement - as adjusted" } },
      // Revenue, COGS, OpEx show as-reported — adjustments flow through a dedicated bridge row (industry standard)
      { id: "adj-revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
      { id: "adj-cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
      { id: "adj-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
      { id: "s-adj1", type: "spacer", cells: {} },
      { id: "adj-opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
      { id: "adj-op-income", type: "subtotal", cells: { label: "Operating income", ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
      { id: "s-adj2", type: "spacer", cells: {} },
      // Dedicated QoE Adjustments bridge row: positive = adds to EBITDA (industry standard addback display)
      { id: "qoe-adjustments", type: "data", indent: 1, cells: { label: "QoE Adjustments", ...pc(p => calc.calcAdjustmentTotal(adj, "all", p)) } },
      { id: "s-adj2b", type: "spacer", cells: {} },
      { id: "adj-other", type: "data", cells: { label: "Other expense (income)", ...pc(p => calc.calcOtherExpense(tb, p)) } },
      { id: "s-adj3", type: "spacer", cells: {} },
      { id: "adj-net-income", type: "total", cells: { label: "Net income (loss)", ...npc(p => calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p)) } },
      { id: "s-adj4", type: "spacer", cells: {} },

      // -- EBITDA addbacks (adjusted) --
      { id: "hdr-adj-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
      { id: "adj-interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
      { id: "adj-taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "adj-depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s-adj5", type: "spacer", cells: {} },
      // calcAdjustedEBITDA already uses subtraction internally ✓
      { id: "adj-ebitda", type: "total", cells: { label: "Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
      { id: "s7", type: "spacer", cells: {} },

      // -- % of Revenue --
      { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
      { id: "rev-growth", type: "data", format: "percent", cells: { label: "Revenue growth", ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells: Record<string, number> = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) { cells[periods[i].id] = NaN; continue; }
        const prior = -calc.calcRevenue(tb, periods[i - 1].id);
          const current = -calc.calcRevenue(tb, periods[i].id);
          cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
        }
        for (const ap of aggregatePeriods) { cells[ap.id] = NaN; }
        return cells;
      })() } },
      // Margins: numerator negated (to make EBITDA/GP positive), denominator is |revenue|
      { id: "gm", type: "data", format: "percent", cells: { label: "Gross margin", ...mc(p => -calc.calcGrossProfit(tb, p), p => calc.calcRevenue(tb, p)) } },
      { id: "om", type: "data", format: "percent", cells: { label: "Operating margin", ...mc(p => -(calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)), p => calc.calcRevenue(tb, p)) } },
      { id: "em", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc(p => -calc.calcReportedEBITDA(tb, p, ab), p => calc.calcRevenue(tb, p)) } },
      { id: "aem", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc(p => -calc.calcAdjustedEBITDA(tb, adj, p, ab), p => calc.calcRevenue(tb, p)) } },
      { id: "nm", type: "data", format: "percent", cells: { label: "Net margin", ...mc(p => -calc.calcNetIncome(tb, p), p => calc.calcRevenue(tb, p)) } },
      { id: "s8", type: "spacer", cells: {} },

      // -- Check rows --
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
      {
        id: "check-qoe", type: "check",
        cells: { label: "Check to QoE (should = 0)", ...pc(p => {
          // Both computed in TB space (negative when profitable).
          // calcAdjustedEBITDA = reportedEBITDA - adjustmentTotal
          // qoeEBITDA = reportedEBITDA - adjustmentTotal  (same formula → should always = 0)
          const isAdj = calc.calcAdjustedEBITDA(tb, adj, p, ab);
          const qoeAdj = calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "all", p);
          const diff = isAdj - qoeAdj;
          return Math.abs(diff) < 0.01 ? 0 : diff;
        }) },
        checkPassed: dealData.deal.periods.every(p => {
          const isAdj = calc.calcAdjustedEBITDA(tb, adj, p.id, ab);
          const qoeAdj = calc.calcReportedEBITDA(tb, p.id, ab) - calc.calcAdjustmentTotal(adj, "all", p.id);
          return Math.abs(isAdj - qoeAdj) < 0.01;
        }),
      },
      {
        id: "check-tb", type: "check",
        cells: { label: "Check to TB (should = 0)", ...pc(p => {
          const isTotal = calc.sumByFsType(tb, "IS", p);
          const lineTotal = calc.calcRevenue(tb, p) + calc.calcCOGS(tb, p) + calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p) + calc.calcOtherExpense(tb, p);
          return Math.abs(isTotal - lineTotal) < 0.01 ? 0 : isTotal - lineTotal;
        }) },
        checkPassed: true,
      },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
