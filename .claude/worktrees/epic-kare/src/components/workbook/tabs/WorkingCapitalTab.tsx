import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, bsEndingBalanceCells, negatedBsEndingBalanceCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

/**
 * Working Capital summary tab (Tab 13).
 * Shows a high-level summary of current assets, current liabilities, and NWC.
 * Assets are debit (positive in TB → display as-is).
 * Liabilities are credit (negative in TB → negate for display).
 * NWC = CA - CL (computed as positive number when CA > CL).
 */
export function WorkingCapitalTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns = buildStandardColumns(dealData, "Working Capital Summary", { labelWidth: 280 });

    const rows: GridRow[] = [
      { id: "hdr-ca", type: "section-header", label: "Current Assets", cells: { label: "Current Assets" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },

      { id: "hdr-cl", type: "section-header", label: "Current Liabilities", cells: { label: "Current Liabilities" } },
      // Liabilities: credit = negative in TB → negate for positive display
      { id: "cl", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },

      // NWC = CA - CL. In TB: CA (positive) - (-CL_raw) = CA + CL_raw. calcNetWorkingCapital returns CA + CL_raw (since CL_raw is negative).
      // For display: we want CA - displayed_CL. displayed_CL = -CL_raw, so NWC_display = CA - (-CL_raw) = CA + CL_raw = calcNetWorkingCapital. Already correct.
      { id: "nwc", type: "total", cells: { label: "Net Working Capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
      { id: "nwc-ex", type: "subtotal", cells: { label: "NWC ex. Cash", ...bc(p => calc.calcNWCExCash(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },

      // NWC as % of Revenue
      // Use ending-balance NWC / annualized revenue to avoid summing a stock variable
      { id: "hdr-pct", type: "section-header", label: "NWC as % of Revenue", cells: { label: "NWC as % of Revenue" } },
      {
        id: "nwc-pct",
        type: "data",
        format: "percent",
        cells: {
          label: "NWC ex. Cash / Revenue",
          ...(() => {
            const { periods, aggregatePeriods } = dealData.deal;
            const cells: Record<string, number> = {};
            // Monthly: ending NWC / (monthly rev × 12) = annualized ratio
            for (const p of periods) {
              const nwc = calc.calcNWCExCash(tb, p.id);
              const annualRev = Math.abs(calc.calcRevenue(tb, p.id)) * 12;
              cells[p.id] = annualRev === 0 ? NaN : nwc / annualRev;
            }
            // Aggregate: ending NWC (last month of period) / total annual revenue
            for (const ap of aggregatePeriods) {
              const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
              const nwc = lastPid ? calc.calcNWCExCash(tb, lastPid) : 0;
              const annualRev = Math.abs(
                ap.monthPeriodIds.reduce((s, pid) => s + calc.calcRevenue(tb, pid), 0)
              );
              cells[ap.id] = annualRev === 0 ? NaN : nwc / annualRev;
            }
            return cells;
          })(),
        },
      },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
