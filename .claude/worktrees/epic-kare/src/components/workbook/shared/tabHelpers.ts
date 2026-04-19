/**
 * Shared helpers for workbook tab components.
 * Provides column builders and cell value generators that support
 * both monthly periods and aggregate (FY/LTM/YTD) periods.
 */
import type { GridColumn, DealData, TrialBalanceEntry } from "@/lib/workbook-types";
import type { AggregatePeriod } from "@/lib/calculations";

/**
 * Build the standard set of columns: frozen label + aggregate periods + monthly periods.
 */
export function buildStandardColumns(
  dealData: DealData,
  labelHeader: string,
  opts?: { labelWidth?: number; format?: "currency" | "percent" }
): GridColumn[] {
  const format = opts?.format || "currency";
  const labelWidth = opts?.labelWidth || 280;
  const { periods, aggregatePeriods } = dealData.deal;

  return [
    { key: "label", label: labelHeader, width: labelWidth, frozen: true, format: "text" as const },
    // Aggregate columns first (FY, LTM, YTD)
    ...aggregatePeriods.map(ap => ({
      key: ap.id,
      label: ap.shortLabel,
      width: 110,
      format: format as "currency" | "percent",
    })),
    // Monthly columns
    ...periods.map(p => ({
      key: p.id,
      label: p.shortLabel,
      width: 100,
      format: format as "currency" | "percent",
    })),
  ];
}

/**
 * Generate cell values for both monthly and aggregate periods.
 * `calcFn` should calculate the value for a single monthly period.
 */
export function periodCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  // Monthly values
  for (const p of periods) {
    cells[p.id] = calcFn(p.id);
  }

  // Aggregate values (sum of monthly)
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) {
      sum += calcFn(mpid);
    }
    cells[ap.id] = sum;
  }

  return cells;
}

/**
 * Generate cell values for an individual TB entry across all periods.
 */
export function entryCells(
  dealData: DealData,
  balances: Record<string, number>
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  for (const p of periods) {
    cells[p.id] = balances[p.id] || 0;
  }

  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) {
      sum += balances[mpid] || 0;
    }
    cells[ap.id] = sum;
  }

  return cells;
}

/**
 * Generate cell values for a margin/percentage calculation.
 * Uses NaN for zero-denominator (formats as "n/q").
 */
export function marginCells(
  dealData: DealData,
  numeratorFn: (periodId: string) => number,
  denominatorFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  const calcMargin = (num: number, den: number) => {
    if (den === 0) return NaN;
    return num / Math.abs(den);
  };

  for (const p of periods) {
    cells[p.id] = calcMargin(numeratorFn(p.id), denominatorFn(p.id));
  }

  for (const ap of aggregatePeriods) {
    let numSum = 0, denSum = 0;
    for (const mpid of ap.monthPeriodIds) {
      numSum += numeratorFn(mpid);
      denSum += denominatorFn(mpid);
    }
    cells[ap.id] = calcMargin(numSum, denSum);
  }

  return cells;
}

/**
 * Generate cell values for an adjustment across all periods.
 */
export function adjustmentCells(
  dealData: DealData,
  amounts: Record<string, number>
): Record<string, number> {
  return entryCells(dealData, amounts);
}

/**
 * Negated version of periodCells — flips sign for display-layer presentation.
 * Use for Revenue, Gross Profit, Net Income, EBITDA (stored as credits = negative in TB).
 */
export function negatedPeriodCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  return periodCells(dealData, p => -calcFn(p));
}

/**
 * Negated version of bsEndingBalanceCells — flips sign for display-layer presentation.
 * Use for Liabilities and Equity (stored as credits = negative in TB, shown as positive on BS).
 */
export function negatedBsEndingBalanceCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  return bsEndingBalanceCells(dealData, p => -calcFn(p));
}

/**
 * Generate cell values for Balance Sheet items using ending balance
 * (last month's value in the aggregate range, not a sum).
 */
export function bsEndingBalanceCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  for (const p of periods) {
    cells[p.id] = calcFn(p.id);
  }

  for (const ap of aggregatePeriods) {
    // For BS, use the ending balance = value of the last month in the range
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? calcFn(lastPeriodId) : 0;
  }

  return cells;
}

/**
 * Generate cell values for a BS entry's balances using ending balance for aggregates.
 */
export function bsEntryCells(
  dealData: DealData,
  balances: Record<string, number>
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  for (const p of periods) {
    cells[p.id] = balances[p.id] || 0;
  }

  for (const ap of aggregatePeriods) {
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? (balances[lastPeriodId] || 0) : 0;
  }

  return cells;
}

/**
 * Generate change cells: period-over-period dollar delta.
 * For monthly periods: current - previous month.
 * For aggregate periods: sum of monthly changes.
 */
export function changeCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  for (let i = 0; i < periods.length; i++) {
    if (i === 0) {
      cells[periods[i].id] = 0; // No prior period
    } else {
      cells[periods[i].id] = calcFn(periods[i].id) - calcFn(periods[i - 1].id);
    }
  }

  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) {
      sum += cells[mpid] || 0;
    }
    cells[ap.id] = sum;
  }

  return cells;
}

/**
 * Generate percent change cells: (current - prior) / |prior|.
 * Returns NaN when prior is 0 (formats as "n/q").
 */
export function pctChangeCells(
  dealData: DealData,
  calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};

  for (let i = 0; i < periods.length; i++) {
    if (i === 0) {
      cells[periods[i].id] = NaN;
    } else {
      const prior = calcFn(periods[i - 1].id);
      const current = calcFn(periods[i].id);
      cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
    }
  }

  // For aggregates, compute growth between consecutive aggregate periods of same type
  for (const ap of aggregatePeriods) {
    // Just use the aggregate-level values
    const aggVal = ap.monthPeriodIds.reduce((s, pid) => s + calcFn(pid), 0);
    // Find the "prior" aggregate (previous FY, etc.) - simplified: use NaN for now
    cells[ap.id] = NaN;
  }

  return cells;
}
