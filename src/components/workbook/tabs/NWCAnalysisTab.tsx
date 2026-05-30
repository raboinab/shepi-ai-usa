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

    const cfg = dealData.deal.nwcConfig;
    const method = cfg?.method ?? "operating";
    const methodLabel = calc.nwcMethodLabel(method);
    const overlays = cfg?.normalizationAdjustments ?? [];

    const nwcOf = (p: string) => calc.calcNWCByMethod(tb, p, cfg);

    const rows: GridRow[] = [
      // Reported (always shown as starting point)
      { id: "hdr-nwc", type: "section-header", label: "Reported balance sheet", cells: { label: "Reported balance sheet" } },
      { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
      { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
      { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
      { id: "s1", type: "spacer", cells: {} },
      { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
      { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
      { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
      { id: "s2", type: "spacer", cells: {} },
      { id: "nwc-reported", type: "total", cells: { label: "Net working capital, reported", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
      { id: "s3", type: "spacer", cells: {} },

      // Method bridge
      { id: "hdr-adj", type: "section-header", label: `Bridge to ${methodLabel} NWC`, cells: { label: `Bridge to ${methodLabel} NWC` } },
      ...(method !== "reported" ? [
        { id: "adj-cash", type: "data" as const, indent: 1, cells: { label: "Less: Cash and cash equivalents", ...bc(p => -calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
      ] : []),
      ...(method === "transaction" ? [
        { id: "adj-tx", type: "data" as const, indent: 1, cells: { label: "Transaction inclusions (per LOI)", ...bc(_ => 0) } },
      ] : []),
      ...(method === "normalized" ? overlays.map((row, i) => ({
        id: `adj-norm-${row.id || i}`,
        type: "data" as const,
        indent: 1,
        cells: {
          label: `Normalization: ${row.label || `Adjustment ${i + 1}`}`,
          ...bc(p => row.periodValues?.[p] ?? 0),
        },
      })) : []),
      { id: "s4", type: "spacer", cells: {} },

      // Active method result
      { id: "nwc-active", type: "total", cells: { label: `Net working capital (${methodLabel})`, ...bc(p => nwcOf(p)) } },
      { id: "s5", type: "spacer", cells: {} },

      // Change vs prior period
      { id: "hdr-change", type: "section-header", label: `Change in ${methodLabel} NWC`, cells: { label: `Change in ${methodLabel} NWC` } },
      { id: "change-dollar", type: "data", cells: { label: `$ Change in NWC (${methodLabel})`, ...(() => {
        const { periods, aggregatePeriods, priorBalances } = dealData.deal;
        const cells: Record<string, number> = {};
        // Helper: prior-period NWC using same method (best-effort fallback to 0 when priorBalances unavailable)
        const priorNWCMethod = (): number => {
          if (!priorBalances || Object.keys(priorBalances).length === 0) return 0;
          // Construct a synthetic single-period TB at priorBalances and reuse calcNWCByMethod
          const synthPeriod = "__prior__";
          const synthTB = tb.map(e => ({
            ...e,
            balances: { ...e.balances, [synthPeriod]: priorBalances[e.accountId] ?? 0 },
          }));
          return calc.calcNWCByMethod(synthTB, synthPeriod, cfg);
        };
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            const prior = priorNWCMethod();
            cells[periods[i].id] = prior !== 0 ? nwcOf(periods[i].id) - prior : 0;
          } else {
            cells[periods[i].id] = nwcOf(periods[i].id) - nwcOf(periods[i - 1].id);
          }
        }
        for (const ap of aggregatePeriods) {
          cells[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + (cells[pid] || 0), 0);
        }
        return cells;
      })() } },
      { id: "change-pct", type: "data", format: "percent", cells: { label: "Change in NWC as % of Revenue", ...marginCells(
        dealData,
        p => {
          const { periods } = dealData.deal;
          const idx = periods.findIndex(pp => pp.id === p);
          if (idx <= 0) return 0;
          return nwcOf(p) - nwcOf(periods[idx - 1].id);
        },
        p => calc.calcRevenue(tb, p)
      ) } },
      { id: "s6", type: "spacer", cells: {} },

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

      // Check (only meaningful for reported method)
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
      { id: "check", type: "check", cells: {
        label: "Reported NWC tie to BS (should = 0)",
        ...bc(p => {
          const nwc = calc.calcNetWorkingCapital(tb, p);
          const ca = calc.calcTotalCurrentAssets(tb, p);
          const cl = calc.calcTotalCurrentLiabilities(tb, p);
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
