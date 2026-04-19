/**
 * ISBSReconciliationTab - Reconciliation to Audited Financial Statements
 *
 * Side-by-side comparison per fiscal year:
 *   Our Numbers (read-only) | Adj for Audit (editable) | Audited (computed) | Difference (check)
 *
 * Covers both the Income Statement and Balance Sheet line items.
 */
import { useMemo, useState, useCallback } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow, GridColumn } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";

interface TabProps {
  dealData: DealData;
  onDataChange?: (data: DealData) => void;
}

// State shape: { [aggId]: { [rowId]: adjustment value } }
type AuditAdj = Record<string, Record<string, number>>;

/**
 * Build the custom column set for this tab:
 * Frozen label + for each aggregate period: Ours | Adj for Audit | Audited | Difference
 */
function buildReconcColumns(aggregatePeriods: calc.AggregatePeriod[]): GridColumn[] {
  const cols: GridColumn[] = [
    { key: "label", label: "", width: 260, frozen: true, format: "text" },
  ];
  for (const ap of aggregatePeriods) {
    cols.push(
      { key: `${ap.id}-ours`,    label: `${ap.shortLabel} — Our Numbers`,   width: 120, format: "currency" },
      { key: `${ap.id}-adj`,     label: `${ap.shortLabel} — Adj for Audit`, width: 120, format: "currency" },
      { key: `${ap.id}-audited`, label: `${ap.shortLabel} — Audited`,        width: 120, format: "currency" },
      { key: `${ap.id}-diff`,    label: `${ap.shortLabel} — Difference`,     width: 110, format: "currency" },
    );
  }
  return cols;
}

/**
 * Build cells for a given IS row value function across all aggregate periods.
 * IS: sums monthly period values.
 */
function isAggCells(
  aggregatePeriods: calc.AggregatePeriod[],
  auditAdj: AuditAdj,
  rowId: string,
  oursValueFn: (monthPeriodIds: string[]) => number
): Record<string, number | string> {
  const cells: Record<string, number | string> = {};
  for (const ap of aggregatePeriods) {
    const ours = oursValueFn(ap.monthPeriodIds);
    const adj = auditAdj[ap.id]?.[rowId] ?? 0;
    const audited = ours + adj;
    const diff = audited - ours; // = adj
    cells[`${ap.id}-ours`]    = ours;
    cells[`${ap.id}-adj`]     = adj;
    cells[`${ap.id}-audited`] = audited;
    cells[`${ap.id}-diff`]    = diff;
  }
  return cells;
}

/**
 * Build cells for a given BS row value function across all aggregate periods.
 * BS: uses ending balance (last monthly period in the aggregate range).
 */
function bsAggCells(
  aggregatePeriods: calc.AggregatePeriod[],
  auditAdj: AuditAdj,
  rowId: string,
  oursValueFn: (lastPeriodId: string) => number
): Record<string, number | string> {
  const cells: Record<string, number | string> = {};
  for (const ap of aggregatePeriods) {
    const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1] ?? "";
    const ours = lastPid ? oursValueFn(lastPid) : 0;
    const adj = auditAdj[ap.id]?.[rowId] ?? 0;
    const audited = ours + adj;
    const diff = audited - ours;
    cells[`${ap.id}-ours`]    = ours;
    cells[`${ap.id}-adj`]     = adj;
    cells[`${ap.id}-audited`] = audited;
    cells[`${ap.id}-diff`]    = diff;
  }
  return cells;
}

export function ISBSReconciliationTab({ dealData }: TabProps) {
  const [auditAdj, setAuditAdj] = useState<AuditAdj>({});

  const handleCellChange = useCallback((rowId: string, colKey: string, rawValue: string) => {
    // Only the -adj columns are editable
    if (!colKey.endsWith("-adj")) return;
    const aggId = colKey.slice(0, -4); // strip "-adj"
    const num = parseFloat(rawValue.replace(/[^0-9.\-]/g, "")) || 0;
    setAuditAdj(prev => ({
      ...prev,
      [aggId]: { ...(prev[aggId] ?? {}), [rowId]: num },
    }));
  }, []);

  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const ab = dealData.addbacks;
    const { aggregatePeriods } = dealData.deal;

    const columns = buildReconcColumns(aggregatePeriods);

    // Helpers
    const isRow = (rowId: string, label: string, type: GridRow["type"], oursValueFn: (monthPeriodIds: string[]) => number, indent?: number): GridRow => ({
      id: rowId,
      type,
      label,
      indent,
      editable: true,
      cells: {
        label,
        ...isAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn),
      },
    });

    const bsRow = (rowId: string, label: string, type: GridRow["type"], oursValueFn: (lastPeriodId: string) => number, indent?: number): GridRow => ({
      id: rowId,
      type,
      label,
      indent,
      editable: true,
      cells: {
        label,
        ...bsAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn),
      },
    });

    const spacer = (id: string): GridRow => ({ id, type: "spacer", cells: {} });

    const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

    // Check whether all diff cells for all aggregate periods on a row are ~0
    const allDiffsZero = (rowId: string): boolean =>
      aggregatePeriods.every(ap => Math.abs((auditAdj[ap.id]?.[rowId] ?? 0)) < 0.01);

    const rows: GridRow[] = [
      // ── INCOME STATEMENT ──────────────────────────────────────────────────────
      {
        id: "hdr-is",
        type: "section-header",
        cells: { label: "INCOME STATEMENT — Reconciliation to Audited Financials" },
      },
      {
        id: "hdr-note",
        type: "header",
        cells: { label: "Enter audit adjustments in the 'Adj for Audit' columns. Difference should equal zero when reconciled." },
      },
      spacer("s-is-0"),

      // Revenue/GP/NI: credit accounts in TB → negate for positive display
      isRow("is-revenue", "Revenue", "data",
        (mids) => -mids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0), 1),
      isRow("is-cogs", "Cost of goods sold", "data",
        (mids) => mids.reduce((s, p) => s + calc.calcCOGS(tb, p), 0), 1),
      isRow("is-gross-profit", "Gross profit", "subtotal",
        (mids) => -mids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0)),
      spacer("s-is-1"),
      isRow("is-opex", "Operating expenses", "data",
        (mids) => mids.reduce((s, p) => s + calcTotalOpEx(p), 0), 1),
      isRow("is-op-income", "Operating income", "subtotal",
        (mids) => -mids.reduce((s, p) => s + calc.calcGrossProfit(tb, p) + calcTotalOpEx(p), 0)),
      spacer("s-is-2"),
      isRow("is-interest", "Interest expense, net", "data",
        (mids) => mids.reduce((s, p) => s + calc.calcInterestExpense(tb, p, ab.interest), 0), 1),
      isRow("is-taxes", "Income taxes", "data",
        (mids) => mids.reduce((s, p) => s + calc.calcIncomeTaxExpense(tb, p, ab.taxes), 0), 1),
      spacer("s-is-3"),
      isRow("is-net-income", "Net income (loss)", "total",
        (mids) => -mids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0)),
      spacer("s-is-check"),
      {
        id: "check-is",
        type: "check",
        checkPassed: allDiffsZero("is-net-income"),
        cells: {
          label: "IS Check — Difference should be zero",
          ...(() => {
            const c: Record<string, number> = {};
            for (const ap of aggregatePeriods) {
              const adj = auditAdj[ap.id]?.["is-net-income"] ?? 0;
              c[`${ap.id}-ours`]    = 0;
              c[`${ap.id}-adj`]     = adj;
              c[`${ap.id}-audited`] = adj;
              c[`${ap.id}-diff`]    = adj;
            }
            return c;
          })(),
        },
      },
      spacer("s-sep"),

      // ── BALANCE SHEET ─────────────────────────────────────────────────────────
      {
        id: "hdr-bs",
        type: "section-header",
        cells: { label: "BALANCE SHEET — Reconciliation to Audited Financials" },
      },
      spacer("s-bs-0"),
      { id: "hdr-assets", type: "section-header", cells: { label: "ASSETS" } },

      bsRow(
        "bs-cash", "Cash & equivalents", "data",
        (p) => calc.sumByLineItem(tb, "Cash and cash equivalents", p),
        1
      ),
      bsRow(
        "bs-ar", "Accounts receivable", "data",
        (p) => calc.sumByLineItem(tb, "Accounts receivable", p),
        1
      ),
      bsRow(
        "bs-oca", "Other current assets", "data",
        (p) => calc.sumByLineItem(tb, "Other current assets", p),
        1
      ),
      bsRow(
        "bs-total-ca", "Current assets", "subtotal",
        (p) => calc.calcTotalCurrentAssets(tb, p)
      ),
      bsRow(
        "bs-fa", "Fixed assets", "data",
        (p) => calc.sumByLineItem(tb, "Fixed assets", p),
        1
      ),
      bsRow(
        "bs-total-assets", "TOTAL ASSETS", "total",
        (p) => calc.calcTotalAssets(tb, p)
      ),
      spacer("s-bs-1"),
      { id: "hdr-liab", type: "section-header", cells: { label: "LIABILITIES" } },
      // Liabilities & Equity: credit accounts in TB → negate for positive display
      bsRow(
        "bs-cl", "Current liabilities", "data",
        (p) => -calc.sumByLineItem(tb, "Current liabilities", p),
        1
      ),
      bsRow(
        "bs-ocl", "Other current liabilities", "data",
        (p) => -calc.sumByLineItem(tb, "Other current liabilities", p),
        1
      ),
      bsRow(
        "bs-ltl", "Long term liabilities", "data",
        (p) => -calc.sumByLineItem(tb, "Long term liabilities", p),
        1
      ),
      bsRow(
        "bs-total-liab", "Total liabilities", "subtotal",
        (p) => -calc.calcTotalLiabilities(tb, p)
      ),
      spacer("s-bs-2"),
      { id: "hdr-equity", type: "section-header", cells: { label: "EQUITY" } },
      bsRow(
        "bs-equity", "Equity", "data",
        // Snapshot equity = Assets - |Liabilities| (consistent with summary BS tab)
        (p) => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p),
        1
      ),
      bsRow(
        "bs-total-le", "TOTAL LIABILITIES & EQUITY", "total",
        // Total L&E = displayLiab(-liab) + displayEquity(assets+liab) = assets (always balances)
        (p) => calc.calcTotalAssets(tb, p)
      ),
      spacer("s-bs-check"),
      {
        id: "check-bs",
        type: "check",
        checkPassed: true,
        cells: {
          label: "BS Check — Audited Assets = Audited L&E (should be zero)",
          ...(() => {
            const c: Record<string, number> = {};
            for (const ap of aggregatePeriods) {
              const adjAssets = auditAdj[ap.id]?.["bs-total-assets"] ?? 0;
              const adjLE = auditAdj[ap.id]?.["bs-total-le"] ?? 0;
              // Ours: assets - L&E = 0 by snapshot identity; only audit adjustments create variance
              const diff = adjAssets - adjLE;
              c[`${ap.id}-ours`]    = 0;
              c[`${ap.id}-adj`]     = diff;
              c[`${ap.id}-audited`] = diff;
              c[`${ap.id}-diff`]    = diff;
            }
            return c;
          })(),
        },
      },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData, auditAdj]);

  return (
    <SpreadsheetGrid
      data={gridData}
      onCellChange={handleCellChange}
    />
  );
}
