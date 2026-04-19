import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData } from "@/lib/workbook-types";
import { buildBreakdownGrid } from "../shared/breakdownGridBuilder";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function COGSTab({ dealData }: TabProps) {
  const gridData = useMemo(() => buildBreakdownGrid(dealData, {
    lineItem: "Cost of Goods Sold",
    title: "Cost of Goods Sold",
  }), [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
