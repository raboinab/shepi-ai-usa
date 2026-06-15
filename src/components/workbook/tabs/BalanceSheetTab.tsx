import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, bsEndingBalanceCells, negatedBsEndingBalanceCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function BalanceSheetTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const rc = dealData.reclassifications ?? [];
    // Reclass-aware line item sum — keeps web tab in sync with PDF/XLSX builders.
    const s = (lineItem: string, p: string) => calc.sumByLineItemWithReclass(tb, rc, lineItem, p);

    // Subtotals (TB sign convention: assets +, liab/equity −)
    const totalCA = (p: string) => s("Cash and cash equivalents", p) + s("Accounts receivable", p) + s("Other current assets", p);
    const totalNCA = (p: string) => s("Fixed assets", p) + s("Other assets", p);
    const totalAssets = (p: string) => totalCA(p) + totalNCA(p);
    const totalCL = (p: string) => s("Current liabilities", p) + s("Other current liabilities", p);
    const totalNCL = (p: string) => s("Long term liabilities", p);
    const totalLiab = (p: string) => totalCL(p) + totalNCL(p);
    const totalEquity = (p: string) => s("Equity", p);
    const totalLE = (p: string) => totalLiab(p) + totalEquity(p);

    // bc = display as-is (assets positive). nbc = negate (liab/equity stored as credits/negative → display positive).
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns = buildStandardColumns(dealData, "");

    // Real balance check: assets + (liab + equity) ≈ 0 in TB convention.
    // Evaluated across every displayed period (regular + aggregate).
    const allPeriodIds = [
      ...dealData.deal.periods.map(p => p.id),
      ...dealData.deal.aggregatePeriods.map(ap => ap.id),
    ];
    const balanceCheckPassed = allPeriodIds.every(pid =>
      Math.abs(totalAssets(pid) + totalLE(pid)) < 1
    );

    const rows: GridRow[] = [
      { id: "hdr-assets", type: "section-header", label: "ASSETS", cells: { label: "ASSETS" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => s("Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => s("Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => s("Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => totalCA(p)) } },
      { id: "fa", type: "data", indent: 1, cells: { label: "Fixed Assets", ...bc(p => s("Fixed assets", p)) } },
      { id: "oa", type: "data", indent: 1, cells: { label: "Other Assets", ...bc(p => s("Other assets", p)) } },
      { id: "total-nca", type: "subtotal", cells: { label: "Total Non-Current Assets", ...bc(p => totalNCA(p)) } },
      { id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bc(p => totalAssets(p)) } },
      { id: "s1", type: "spacer", cells: {} },

      { id: "hdr-liab", type: "section-header", label: "LIABILITIES", cells: { label: "LIABILITIES" } },
      { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => totalCL(p) === 0 ? 0 : s("Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => s("Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => totalCL(p)) } },
      { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc(p => s("Long term liabilities", p)) } },
      { id: "total-ncl", type: "subtotal", cells: { label: "Total Non-Current Liabilities", ...nbc(p => totalNCL(p)) } },
      { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc(p => totalLiab(p)) } },
      { id: "s2", type: "spacer", cells: {} },

      { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
      // Real equity from TB (credit balance → negate for positive display).
      { id: "equity", type: "data", indent: 1, cells: { label: "Total Equity", ...nbc(p => totalEquity(p)) } },
      { id: "s3", type: "spacer", cells: {} },
      // L&E = displayed liabilities + displayed equity = −(totalLiab + totalEquity)
      { id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...nbc(p => totalLE(p)) } },

      // Real balance check — can actually fail when TB does not tie.
      { id: "check", type: "check", checkPassed: balanceCheckPassed, cells: {
        label: "Balance Check (Assets − L&E)",
        ...bc(p => {
          // Displayed assets − displayed L&E = totalAssets − (−totalLE) = totalAssets + totalLE
          const diff = totalAssets(p) + totalLE(p);
          return Math.abs(diff) < 0.01 ? 0 : diff;
        }),
      } },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
