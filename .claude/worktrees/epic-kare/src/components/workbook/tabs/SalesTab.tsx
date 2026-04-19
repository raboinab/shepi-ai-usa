import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData } from "@/lib/workbook-types";
import { buildBreakdownGrid } from "../shared/breakdownGridBuilder";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function SalesTab({ dealData }: TabProps) {
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Revenue",
    title: "Revenue",
    negateValues: true, // Revenue is credit (negative in TB) → flip to positive for display
  }), [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
