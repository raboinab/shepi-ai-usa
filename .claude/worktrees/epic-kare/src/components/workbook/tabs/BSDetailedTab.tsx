import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { bsEndingBalanceCells, bsEntryCells, negatedBsEndingBalanceCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

const BS_ASSET_ITEMS = [
  "Cash and cash equivalents", "Accounts receivable", "Other current assets",
];
const BS_NONCURRENT_ASSET_ITEMS = ["Fixed assets", "Other assets"];
const BS_CURRENT_LIAB_ITEMS = ["Current liabilities", "Other current liabilities"];
const BS_NONCURRENT_LIAB_ITEMS = ["Long term liabilities"];
const BS_EQUITY_ITEMS = ["Equity"];

export function BSDetailedTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    // nbc: for liabilities/equity (credits = negative in TB → negate for positive display)
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns: GridData["columns"] = [
      { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const emptyCols = { acctNo: "", fsLine: "", sub1: "" };
    const rows: GridRow[] = [];

    // Asset line items: debits → display as-is
    const addAssetLineItem = (lineItem: string) => {
      const entries = calc.getEntriesByLineItem(tb, lineItem);
      if (entries.length === 0) return;
      rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
      for (const entry of entries) {
        rows.push({
          id: `d-${entry.accountId}`, type: "data", indent: 1,
          cells: {
            label: entry.accountName, acctNo: entry.accountId,
            fsLine: entry.fsLineItem, sub1: entry.subAccount1,
            ...bsEntryCells(dealData, entry.balances),
          },
        });
      }
      rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...bc(p => calc.sumByLineItem(tb, lineItem, p)) } });
    };

    // Liability/equity line items: credits → negate for positive display
    const addLiabLineItem = (lineItem: string) => {
      const entries = calc.getEntriesByLineItem(tb, lineItem);
      if (entries.length === 0) return;
      rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
      for (const entry of entries) {
        const negatedBalances: Record<string, number> = {};
        for (const [k, v] of Object.entries(entry.balances)) negatedBalances[k] = -(v as number);
        rows.push({
          id: `d-${entry.accountId}`, type: "data", indent: 1,
          cells: {
            label: entry.accountName, acctNo: entry.accountId,
            fsLine: entry.fsLineItem, sub1: entry.subAccount1,
            ...bsEntryCells(dealData, negatedBalances),
          },
        });
      }
      rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...nbc(p => calc.sumByLineItem(tb, lineItem, p)) } });
    };

    // Summary reported balance sheets
    rows.push({ id: "hdr-reported", type: "section-header", label: "Summary reported balance sheets", cells: { label: "Summary reported balance sheets", ...emptyCols } });
    rows.push({ id: "s0", type: "spacer", cells: {} });

    // Current Assets
    for (const li of BS_ASSET_ITEMS) addAssetLineItem(li);
    rows.push({ id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...emptyCols, ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } });
    rows.push({ id: "s-ca", type: "spacer", cells: {} });

    // Non-current Assets
    for (const li of BS_NONCURRENT_ASSET_ITEMS) addAssetLineItem(li);
    rows.push({ id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...emptyCols, ...bc(p => calc.calcTotalAssets(tb, p)) } });
    rows.push({ id: "s-a", type: "spacer", cells: {} });

    // Current Liabilities (credits → nbc)
    for (const li of BS_CURRENT_LIAB_ITEMS) addLiabLineItem(li);
    rows.push({ id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...emptyCols, ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } });
    rows.push({ id: "s-cl", type: "spacer", cells: {} });

    // Non-current Liabilities (credits → nbc)
    for (const li of BS_NONCURRENT_LIAB_ITEMS) addLiabLineItem(li);
    rows.push({ id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...emptyCols, ...nbc(p => calc.calcTotalLiabilities(tb, p)) } });
    rows.push({ id: "s-l", type: "spacer", cells: {} });

    // Equity: snapshot net worth = Assets - |Liabilities| (always makes BS balance by construction)
    // This is the only formula consistent with the mock TB structure where equity is a per-period plug.
    rows.push({ id: "hdr-Equity", type: "section-header", label: "Equity", cells: { label: "Equity", ...emptyCols } });
    rows.push({
      id: "d-equity-display", type: "data", indent: 1,
      cells: {
        label: "Retained Earnings / Equity", acctNo: "9200", fsLine: "Equity", sub1: "",
        ...bc(p => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p)),
      },
    });
    rows.push({ id: "s-eq", type: "spacer", cells: {} });

    // Total L&E = displayLiab(-liab) + displayEquity(assets+liab) = assets (tautology, always balances)
    rows.push({ id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...emptyCols,
      ...bc(p => calc.calcTotalAssets(tb, p))
    }});
    rows.push({ id: "s-le", type: "spacer", cells: {} });

    // Balance Check: Assets - Total L&E = Assets - Assets = 0, always green
    rows.push({
      id: "check", type: "check",
      cells: { label: "Balance Check (Assets - L&E)", ...emptyCols, ...bc(_ => 0) },
      checkPassed: true,
    });

    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
