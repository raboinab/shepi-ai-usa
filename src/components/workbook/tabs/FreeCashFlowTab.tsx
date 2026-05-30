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

    const cfg = dealData.deal.nwcConfig;
    const methodLabel = calc.nwcMethodLabel(cfg?.method);
    const nwcOf = (p: string) => calc.calcNWCByMethod(tb, p, cfg);

    // Calculate change in NWC per period (with prior-period support) — uses active method
    const calcNWCChange = (p: string): number => {
      const { periods, priorBalances } = dealData.deal;
      const idx = periods.findIndex(pp => pp.id === p);
      if (idx < 0) return 0;
      if (idx === 0) {
        if (priorBalances && Object.keys(priorBalances).length > 0) {
          // Synthesize a prior-period TB column and run calcNWCByMethod on it.
          const synthPeriod = "__prior__";
          const synthTB = tb.map(e => ({
            ...e,
            balances: { ...e.balances, [synthPeriod]: priorBalances[e.accountId] ?? 0 },
          }));
          const priorNWC = calc.calcNWCByMethod(synthTB, synthPeriod, cfg);
          return priorNWC !== 0 ? nwcOf(p) - priorNWC : 0;
        }
        return 0;
      }
      return nwcOf(p) - nwcOf(periods[idx - 1].id);
    };

    const rows: GridRow[] = [
      { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc(p => {
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return calc.calcAdjustedEBITDA(tb, adj, p, ab) + isReclass;
      }) } },
      { id: "nwc-change", type: "data", cells: { label: `Change in NWC (${methodLabel})`, ...pc(p => -calcNWCChange(p)) } },
      { id: "capex", type: "data", editable: true, cells: { label: "Capital Expenditures", ...pc(_ => 0) } },
      { id: "taxes", type: "data", editable: true, cells: { label: "Estimated Taxes", ...pc(p => -calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc(p => {
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return -(calc.calcAdjustedEBITDA(tb, adj, p, ab) + isReclass) - calcNWCChange(p) - calc.calcIncomeTaxExpense(tb, p, ab.taxes);
      }) } },
    ];


    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
