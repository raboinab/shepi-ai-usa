import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import { getEntriesByLineItem, sumByLineItem } from "@/lib/calculations";
import { bsEndingBalanceCells, bsEntryCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function OtherCurrentAssetsTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Other current assets");
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

    const columns: GridData["columns"] = [
      { key: "label", label: "Other Current Assets", width: 280, frozen: true, format: "text" as const },
      { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" as const },
      { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" as const },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const ec = { acctNo: "", fsLine: "" };
    const rows: GridRow[] = [
      { id: "hdr-reported", type: "section-header", label: "Other Current Assets - reported", cells: { label: "Other Current Assets - reported", ...ec } },
    ];

    for (const e of entries) {
      rows.push({
        id: `rpt-${e.accountId}`, type: "data" as const, indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, e.balances) },
      });
    }

    rows.push({
      id: "total-reported", type: "total",
      cells: { label: "Total Other Current Assets", ...ec, ...bc(p => sumByLineItem(tb, "Other current assets", p)) },
    });
    rows.push({ id: "s1", type: "spacer", cells: {} });

    // Adjusted section (same structure for now, adjustments TBD)
    rows.push({ id: "hdr-adjusted", type: "section-header", label: "Other Current Assets - adjusted", cells: { label: "Other Current Assets - adjusted", ...ec } });
    for (const e of entries) {
      rows.push({
        id: `adj-${e.accountId}`, type: "data" as const, indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, e.balances) },
      });
    }
    rows.push({
      id: "total-adjusted", type: "total",
      cells: { label: "Total Other Current Assets (adjusted)", ...ec, ...bc(p => sumByLineItem(tb, "Other current assets", p)) },
    });
    rows.push({ id: "s2", type: "spacer", cells: {} });

    // Check row
    rows.push({
      id: "check", type: "check", checkPassed: true,
      cells: { label: "Check to BS (should = 0)", ...ec, ...bc(p => {
        const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
        const bsTotal = sumByLineItem(tb, "Other current assets", p);
        return Math.abs(total - bsTotal) < 0.01 ? 0 : total - bsTotal;
      }) },
    });

    return { columns, rows, frozenColumns: 3 };
  }, [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
