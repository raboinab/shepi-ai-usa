import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import { formatCurrency } from "@/lib/workbook-format";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function TrialBalanceTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const periods = dealData.deal.periods;
    const columns = [
      { key: "fsType", label: "FS", width: 45, frozen: true, format: "text" as const },
      { key: "accountId", label: "Acct #", width: 70, frozen: true, format: "text" as const },
      { key: "accountName", label: "Account Name", width: 280, frozen: true, format: "text" as const },
      { key: "fsLineItem", label: "FS Line Item", width: 170, frozen: true, format: "text" as const },
      ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 90, format: "currency" as const })),
    ];

    const dataRows = dealData.trialBalance.map(entry => {
      const fullName = entry.accountName || '';
      const colonParts = fullName.split(':');
      const indentLevel = colonParts.length - 1;
      const leafName = colonParts[colonParts.length - 1]?.trim() || fullName;

      return {
        id: entry.accountId,
        type: "data" as const,
        editable: true,
        indent: indentLevel,
        cells: {
          fsType: entry.fsType,
          accountId: entry.accountId,
          accountName: leafName,
          fsLineItem: entry.fsLineItem,
          ...Object.fromEntries(periods.map(p => [p.id, entry.balances[p.id] || 0])),
        },
      };
    });

    // Compute BS and IS totals per period
    const bsTotals: Record<string, number> = {};
    const isTotals: Record<string, number> = {};
    for (const entry of dealData.trialBalance) {
      for (const p of periods) {
        const val = entry.balances[p.id] || 0;
        if (entry.fsType === "BS") {
          bsTotals[p.id] = (bsTotals[p.id] || 0) + val;
        } else {
          isTotals[p.id] = (isTotals[p.id] || 0) + val;
        }
      }
    }

    // Accumulate IS monthly values back to YTD for the check.
    // After YTD→monthly conversion, BS ending + IS monthly ≠ 0.
    // The correct check is BS ending + IS YTD cumulative = 0.
    const fyEndMonth = dealData.deal.fiscalYearEnd;
    const fyStartMonth = (fyEndMonth % 12) + 1;
    const isYtdTotals: Record<string, number> = {};
    let isRunning = 0;
    for (const p of periods) {
      if (p.month === fyStartMonth) isRunning = 0;
      isRunning += isTotals[p.id] || 0;
      isYtdTotals[p.id] = isRunning;
    }

    const bsRow: GridRow = {
      id: "__bs_total",
      type: "subtotal",
      cells: {
        fsType: "", accountId: "", accountName: "BS Total", fsLineItem: "",
        ...Object.fromEntries(periods.map(p => [p.id, bsTotals[p.id] || 0])),
      },
    };

    const isRow: GridRow = {
      id: "__is_total",
      type: "subtotal",
      cells: {
        fsType: "", accountId: "", accountName: "IS Total (YTD)", fsLineItem: "",
        ...Object.fromEntries(periods.map(p => [p.id, isYtdTotals[p.id] || 0])),
      },
    };

    const checkCells: Record<string, string | number | null> = {
      fsType: "", accountId: "", accountName: "Check (should be 0)", fsLineItem: "",
    };
    let allBalanced = true;
    for (const p of periods) {
      const checkVal = (bsTotals[p.id] || 0) + (isYtdTotals[p.id] || 0);
      checkCells[p.id] = checkVal;
      if (Math.abs(checkVal) >= 0.01) allBalanced = false;
    }

    const checkRow: GridRow = {
      id: "__check",
      type: "check",
      checkPassed: allBalanced,
      cells: checkCells,
    };

    const rows = [...dataRows, bsRow, isRow, checkRow];

    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
