import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildBreakdownGrid } from "../shared/breakdownGridBuilder";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function OpExTab({ dealData }: TabProps) {
  const tb = dealData.trialBalance;
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Operating expenses",
    title: "Operating Expenses",
    pctLabel: "% of Operating Expenses",
    pctDenominator: (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p),
  }), [dealData, tb]);
  return <SpreadsheetGrid data={gridData} />;
}
