import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";

import { buildStandardColumns, periodCells, negatedPeriodCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function FreeCashFlowTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const rc = dealData.reclassifications ?? [];
    const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
    const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);

    const columns = buildStandardColumns(dealData, "Free Cash Flow", { labelWidth: 280 });

    // Calculate change in NWC per period (with prior-period support)
    const calcNWCChange = (p: string): number => {
      const { periods, priorBalances } = dealData.deal;
      const idx = periods.findIndex(pp => pp.id === p);
      if (idx < 0) return 0;
      if (idx === 0) {
        // Use prior balances if available
        if (priorBalances && Object.keys(priorBalances).length > 0) {
          let priorNWC = 0;
          for (const e of tb) {
            if (e.fsType !== 'BS') continue;
            const isNWCNonCash = (calc.sumByLineItem([e], "Accounts receivable", "__test__") !== 0
              || calc.sumByLineItem([e], "Other current assets", "__test__") !== 0
              || calc.sumByLineItem([e], "Current liabilities", "__test__") !== 0
              || calc.sumByLineItem([e], "Other current liabilities", "__test__") !== 0)
              && calc.sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0;
            if (isNWCNonCash) priorNWC += priorBalances[e.accountId] ?? 0;
          }
          return priorNWC !== 0 ? calc.calcNWCExCash(tb, p) - priorNWC : 0;
        }
        return 0;
      }
      return calc.calcNWCExCash(tb, p) - calc.calcNWCExCash(tb, periods[idx - 1].id);
    };

    const rows: GridRow[] = [
      // Adjusted EBITDA: stored negative in TB when profitable → negate for display (with reclass overlay)
      { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc(p => {
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return calc.calcAdjustedEBITDA(tb, adj, p, ab) + isReclass;
      }) } },
      // NWC increase = cash used = display as negative deduction
      { id: "nwc-change", type: "data", cells: { label: "Change in NWC", ...pc(p => -calcNWCChange(p)) } },
      { id: "capex", type: "data", editable: true, cells: { label: "Capital Expenditures", ...pc(_ => 0) } },
      { id: "taxes", type: "data", editable: true, cells: { label: "Estimated Taxes", ...pc(p => -calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "s1", type: "spacer", cells: {} },
      // FCF = Adj EBITDA - ΔNWC - Taxes (with reclass overlay)
      { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc(p => {
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return -(calc.calcAdjustedEBITDA(tb, adj, p, ab) + isReclass) - calcNWCChange(p) - calc.calcIncomeTaxExpense(tb, p, ab.taxes);
      }) } },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
