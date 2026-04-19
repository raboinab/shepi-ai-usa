import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, bsEndingBalanceCells, negatedBsEndingBalanceCells, marginCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

/**
 * NWC Analysis tab - full rework matching Excel structure.
 * Assets: debit = positive in TB → display as-is.
 * Liabilities: credit = negative in TB → negate for positive display.
 */
export function NWCAnalysisTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

    const columns = buildStandardColumns(dealData, "NWC Analysis", { labelWidth: 280 });

    const rows: GridRow[] = [
      // Net working capital - reported to adjusted
      { id: "hdr-nwc", type: "section-header", label: "Net working capital - reported to adjusted", cells: { label: "Net working capital - reported to adjusted" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      // Liabilities: negate for display
      { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },
      // NWC: CA + CL_raw (CL_raw is negative) = CA - |CL| which is the correct NWC number
      { id: "nwc-reported", type: "total", cells: { label: "Net working capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },

      // Normal NWC adjustments (remove cash from NWC)
      { id: "hdr-adj", type: "section-header", label: "Normal NWC adjustments", cells: { label: "Normal NWC adjustments" } },
      { id: "adj-cash", type: "data", indent: 1, cells: { label: "Remove: Cash and cash equivalents", ...bc(p => -calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "s4", type: "spacer", cells: {} },

      // NWC ex. Cash (reported)
      { id: "nwc-ex-cash", type: "total", cells: { label: "Net working capital, reported (ex. cash)", ...bc(p => calc.calcNWCExCash(tb, p)) } },
      { id: "s5", type: "spacer", cells: {} },

      // Change in reported NWC
      { id: "hdr-change-rpt", type: "section-header", label: "Change in reported NWC", cells: { label: "Change in reported NWC" } },
      { id: "change-nwc-dollar", type: "data", cells: { label: "$ Change in NWC ex. Cash", ...(() => {
        const { periods, aggregatePeriods, priorBalances } = dealData.deal;
        const cells: Record<string, number> = {};
        // Helper: sum prior balances for NWC ex cash
        const priorNWCExCash = (): number => {
          if (!priorBalances || Object.keys(priorBalances).length === 0) return 0;
          let total = 0;
          for (const e of tb) {
            if (e.fsType !== 'BS') continue;
            const resolved = calc.sumByLineItem([e], "Accounts receivable", "__test__") !== 0 ? true
              : calc.sumByLineItem([e], "Other current assets", "__test__") !== 0 ? true
              : calc.sumByLineItem([e], "Current liabilities", "__test__") !== 0 ? true
              : calc.sumByLineItem([e], "Other current liabilities", "__test__") !== 0 ? true
              : false;
            if (resolved && calc.sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0) {
              total += priorBalances[e.accountId] ?? 0;
            }
          }
          return total;
        };
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            const prior = priorNWCExCash();
            cells[periods[i].id] = prior !== 0 ? calc.calcNWCExCash(tb, periods[i].id) - prior : 0;
          } else {
            cells[periods[i].id] = calc.calcNWCExCash(tb, periods[i].id) - calc.calcNWCExCash(tb, periods[i - 1].id);
          }
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + (cells[pid] || 0), 0);
        }
        return cells;
      })() } },
      { id: "change-nwc-pct", type: "data", format: "percent", cells: { label: "Change in NWC as % of Revenue", ...marginCells(
        dealData,
        p => {
          const { periods } = dealData.deal;
          const idx = periods.findIndex(pp => pp.id === p);
          if (idx <= 0) return 0;
          return calc.calcNWCExCash(tb, p) - calc.calcNWCExCash(tb, periods[idx - 1].id);
        },
        p => calc.calcRevenue(tb, p)
      ) } },
      { id: "s6", type: "spacer", cells: {} },

      // Additional NWC adjustments (placeholder for user entries)
      { id: "hdr-add-adj", type: "section-header", label: "Additional NWC adjustments", cells: { label: "Additional NWC adjustments" } },
      { id: "add-adj-placeholder", type: "data", editable: true, indent: 1, cells: { label: "Additional adjustment 1" } },
      { id: "s7", type: "spacer", cells: {} },

      // NWC adjusted
      { id: "nwc-adjusted", type: "total", cells: { label: "Net working capital, adjusted", ...bc(p => calc.calcNWCExCash(tb, p)) } },
      { id: "s8", type: "spacer", cells: {} },

      // Change in adjusted NWC
      { id: "hdr-change-adj", type: "section-header", label: "Change in adjusted NWC", cells: { label: "Change in adjusted NWC" } },
      { id: "change-adj-dollar", type: "data", cells: { label: "$ Change in adjusted NWC", ...(() => {
        const { periods, aggregatePeriods, priorBalances } = dealData.deal;
        const cells: Record<string, number> = {};
        const priorNWCExCash2 = (): number => {
          if (!priorBalances || Object.keys(priorBalances).length === 0) return 0;
          let total = 0;
          for (const e of tb) {
            if (e.fsType !== 'BS') continue;
            const isNWCNonCash = (calc.sumByLineItem([e], "Accounts receivable", "__test__") !== 0
              || calc.sumByLineItem([e], "Other current assets", "__test__") !== 0
              || calc.sumByLineItem([e], "Current liabilities", "__test__") !== 0
              || calc.sumByLineItem([e], "Other current liabilities", "__test__") !== 0)
              && calc.sumByLineItem([e], "Cash and cash equivalents", "__test__") === 0;
            if (isNWCNonCash) total += priorBalances[e.accountId] ?? 0;
          }
          return total;
        };
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            const prior = priorNWCExCash2();
            cells[periods[i].id] = prior !== 0 ? calc.calcNWCExCash(tb, periods[i].id) - prior : 0;
          } else {
            cells[periods[i].id] = calc.calcNWCExCash(tb, periods[i].id) - calc.calcNWCExCash(tb, periods[i - 1].id);
          }
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + (cells[pid] || 0), 0);
        }
        return cells;
      })() } },
      { id: "s9", type: "spacer", cells: {} },

      // Trailing Averages
      { id: "hdr-trail", type: "section-header", label: "Trailing Averages", cells: { label: "Trailing Averages" } },
      { id: "trail-ar", type: "data", format: "number", cells: { label: "A/R Days Outstanding", ...bc(p => {
        const ar = calc.sumByLineItem(tb, "Accounts receivable", p);
        const rev = calc.calcRevenue(tb, p);
        return rev === 0 ? 0 : (ar / Math.abs(rev)) * 30;
      }) } },
      { id: "trail-ap", type: "data", format: "number", cells: { label: "A/P Days Outstanding", ...bc(p => {
        const ap = calc.sumByLineItem(tb, "Current liabilities", p);
        const cogs = calc.calcCOGS(tb, p);
        return cogs === 0 ? 0 : (Math.abs(ap) / Math.abs(cogs)) * 30;
      }) } },
      { id: "s10", type: "spacer", cells: {} },

      // Check
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
      { id: "check", type: "check", cells: {
        label: "Check to BS (should = 0)",
        ...bc(p => {
          const nwc = calc.calcNetWorkingCapital(tb, p);
          const ca = calc.calcTotalCurrentAssets(tb, p);
          const cl = calc.calcTotalCurrentLiabilities(tb, p);
          // NWC = CA + CL_raw (CL is negative in TB). This should always be 0.
          const diff = nwc - (ca + cl);
          return Math.abs(diff) < 0.01 ? 0 : diff;
        }),
      }, checkPassed: dealData.deal.periods.every(p => {
        const nwc = calc.calcNetWorkingCapital(tb, p.id);
        const ca = calc.calcTotalCurrentAssets(tb, p.id);
        const cl = calc.calcTotalCurrentLiabilities(tb, p.id);
        return Math.abs(nwc - (ca + cl)) < 0.01;
      }) },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
