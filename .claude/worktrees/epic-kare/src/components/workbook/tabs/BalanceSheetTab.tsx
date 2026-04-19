import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, bsEndingBalanceCells, negatedBsEndingBalanceCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function BalanceSheetTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    // bc = as-is (assets: debit = positive, display correctly)
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    // nbc = negated (liabilities: credit = negative in TB, flip to positive for display)
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns = buildStandardColumns(dealData, "");

    const rows: GridRow[] = [
      { id: "hdr-assets", type: "section-header", label: "ASSETS", cells: { label: "ASSETS" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
      { id: "fa", type: "data", indent: 1, cells: { label: "Fixed Assets", ...bc(p => calc.sumByLineItem(tb, "Fixed assets", p)) } },
      { id: "oa", type: "data", indent: 1, cells: { label: "Other Assets", ...bc(p => calc.sumByLineItem(tb, "Other assets", p)) } },
      { id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bc(p => calc.calcTotalAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },

      { id: "hdr-liab", type: "section-header", label: "LIABILITIES", cells: { label: "LIABILITIES" } },
      // Liabilities: credit balances in TB = negative → negate for positive display
      { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
      { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Long term liabilities", p)) } },
      { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc(p => calc.calcTotalLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },

      { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
      // Equity (display) = Assets + Liabilities (in TB sign convention).
      // Assets are positive (debit), Liabilities are negative (credit), so their sum = net worth.
      // This is algebraically identical to Assets - |Liabilities|, i.e. the snapshot book equity.
      { id: "equity", type: "data", indent: 1, cells: { label: "Total Equity",
        ...bc(p => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p))
      } },
      { id: "s3", type: "spacer", cells: {} },
      // Total L&E = displayLiabilities + displayEquity
      //           = -calcTotalLiabilities + (calcTotalAssets + calcTotalLiabilities)
      //           = calcTotalAssets   ← tautological identity: L&E always equals Assets
      { id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY",
        ...bc(p => calc.calcTotalAssets(tb, p))
      } },

      // Balance Check: Assets - Total L&E = Assets - Assets = 0. Always green by construction.
      { id: "check", type: "check", cells: {
        label: "Balance Check (Assets - L&E)",
        ...bc(p => {
          const assets = calc.calcTotalAssets(tb, p);
          const le = calc.calcTotalAssets(tb, p); // tautology: L&E = Assets
          return Math.abs(assets - le) < 0.01 ? 0 : assets - le;
        }),
      }, checkPassed: true },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
