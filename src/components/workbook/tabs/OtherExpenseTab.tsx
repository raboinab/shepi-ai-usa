import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildBreakdownGrid } from "../shared/breakdownGridBuilder";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function OtherExpenseTab({ dealData }: TabProps) {
  const tb = dealData.trialBalance;
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Other expense (income)",
    title: "Other Expense (Income)",
    pctLabel: "% of Other Expense (Income)",
    pctDenominator: (p: string) => calc.calcOtherExpense(tb, p),
  }), [dealData, tb]);
  return <SpreadsheetGrid data={gridData} />;
}
