import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function FixedAssetsTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const columns = [
      { key: "desc", label: "Description", width: 200, frozen: true, format: "text" as const },
      { key: "category", label: "Category", width: 120, format: "text" as const },
      { key: "date", label: "Acquired", width: 100, format: "text" as const },
      { key: "cost", label: "Cost", width: 100, format: "currency" as const },
      { key: "depr", label: "Accum Depr", width: 100, format: "currency" as const },
      { key: "nbv", label: "Net Book Value", width: 100, format: "currency" as const },
    ];
    const rows: GridRow[] = dealData.fixedAssets.map((fa, i) => ({
      id: `fa-${i}`, type: "data" as const, editable: true,
      cells: { desc: fa.description, category: fa.category, date: fa.acquisitionDate, cost: fa.cost, depr: fa.accumulatedDepreciation, nbv: fa.netBookValue },
    }));
    if (rows.length > 0) {
      rows.push({ id: "total", type: "total", cells: {
        desc: "Total", category: "", date: "",
        cost: dealData.fixedAssets.reduce((s, f) => s + f.cost, 0),
        depr: dealData.fixedAssets.reduce((s, f) => s + f.accumulatedDepreciation, 0),
        nbv: dealData.fixedAssets.reduce((s, f) => s + f.netBookValue, 0),
      } });
    }
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
