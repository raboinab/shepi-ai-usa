import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import { getEntriesByLineItem } from "@/lib/calculations";
import { bsEndingBalanceCells, bsEntryCells } from "../shared/tabHelpers";
import * as calc from "@/lib/calculations";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function CashTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Cash and cash equivalents");
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

    const columns: GridData["columns"] = [
      { key: "label", label: "Cash", width: 280, frozen: true, format: "text" as const },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const rows: GridRow[] = entries.map(e => ({
      id: e.accountId, type: "data" as const, indent: 1,
      cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) },
    }));

    rows.push({
      id: "total", type: "total",
      cells: { label: "Total Cash", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) },
    });

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
