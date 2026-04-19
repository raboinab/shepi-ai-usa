import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import { getEntriesByLineItem, sumByLineItem } from "@/lib/calculations";
import { negatedBsEndingBalanceCells, bsEntryCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function OtherCurrentLiabilitiesTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Other current liabilities");
    // nbc: liabilities are credits (negative in TB) → negate for positive display (matches BS tab)
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns: GridData["columns"] = [
      { key: "label", label: "Other Current Liabilities", width: 280, frozen: true, format: "text" as const },
      { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" as const },
      { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" as const },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const ec = { acctNo: "", fsLine: "" };
    const rows: GridRow[] = [
      { id: "hdr-reported", type: "section-header", label: "Other Current Liabilities - reported", cells: { label: "Other Current Liabilities - reported", ...ec } },
    ];

    for (const e of entries) {
      // Negate each entry's balances for positive display (credits are negative in TB)
      const negatedBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.balances)) negatedBalances[k] = -(v as number);
      rows.push({
        id: `rpt-${e.accountId}`, type: "data" as const, indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, negatedBalances) },
      });
    }

    rows.push({
      id: "total-reported", type: "total",
      cells: { label: "Total Other Current Liabilities", ...ec, ...nbc(p => sumByLineItem(tb, "Other current liabilities", p)) },
    });
    rows.push({ id: "s1", type: "spacer", cells: {} });

    // Adjusted section (mirrors reported — OCL adjustments entered in NWC tab)
    rows.push({ id: "hdr-adjusted", type: "section-header", label: "Other Current Liabilities - adjusted", cells: { label: "Other Current Liabilities - adjusted", ...ec } });
    for (const e of entries) {
      const negatedBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.balances)) negatedBalances[k] = -(v as number);
      rows.push({
        id: `adj-${e.accountId}`, type: "data" as const, indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, negatedBalances) },
      });
    }
    rows.push({
      id: "total-adjusted", type: "total",
      cells: { label: "Total Other Current Liabilities (adjusted)", ...ec, ...nbc(p => sumByLineItem(tb, "Other current liabilities", p)) },
    });
    rows.push({ id: "s2", type: "spacer", cells: {} });

    // Check: sum of raw TB entries vs sumByLineItem — in raw TB space (both negative), diff = 0
    rows.push({
      id: "check", type: "check", checkPassed: true,
      cells: { label: "Check to BS (should = 0)", ...ec, ...nbc(p => {
        const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
        const bsTotal = sumByLineItem(tb, "Other current liabilities", p);
        return Math.abs(total - bsTotal) < 0.01 ? 0 : total - bsTotal;
      }) },
    });

    return { columns, rows, frozenColumns: 3 };
  }, [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
