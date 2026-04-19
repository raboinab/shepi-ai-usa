/**
 * Shared helpers for workbook tab components (server-side copy).
 * Mirrors src/components/workbook/shared/tabHelpers.ts — keep in sync.
 */
import type { GridColumn, DealData, TrialBalanceEntry } from "./workbook-types.ts";
import type { AggregatePeriod } from "./calculations.ts";

export function buildStandardColumns(
  dealData: DealData, labelHeader: string,
  opts?: { labelWidth?: number; format?: "currency" | "percent" }
): GridColumn[] {
  const format = opts?.format || "currency";
  const labelWidth = opts?.labelWidth || 280;
  const { periods, aggregatePeriods } = dealData.deal;
  return [
    { key: "label", label: labelHeader, width: labelWidth, frozen: true, format: "text" as const },
    ...aggregatePeriods.map(ap => ({
      key: ap.id, label: ap.shortLabel, width: 110,
      format: format as "currency" | "percent",
    })),
    ...periods.map(p => ({
      key: p.id, label: p.shortLabel, width: 100,
      format: format as "currency" | "percent",
    })),
  ];
}

export function periodCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (const p of periods) cells[p.id] = calcFn(p.id);
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) sum += calcFn(mpid);
    cells[ap.id] = sum;
  }
  return cells;
}

export function entryCells(
  dealData: DealData, balances: Record<string, number>
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (const p of periods) cells[p.id] = balances[p.id] || 0;
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) sum += balances[mpid] || 0;
    cells[ap.id] = sum;
  }
  return cells;
}

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

export function adjustmentCells(
  dealData: DealData, amounts: Record<string, number>
): Record<string, number> {
  return entryCells(dealData, amounts);
}

export function negatedPeriodCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  return periodCells(dealData, p => -calcFn(p));
}

export function negatedBsEndingBalanceCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  return bsEndingBalanceCells(dealData, p => -calcFn(p));
}

export function bsEndingBalanceCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (const p of periods) cells[p.id] = calcFn(p.id);
  for (const ap of aggregatePeriods) {
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? calcFn(lastPeriodId) : 0;
  }
  return cells;
}

export function bsEntryCells(
  dealData: DealData, balances: Record<string, number>
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (const p of periods) cells[p.id] = balances[p.id] || 0;
  for (const ap of aggregatePeriods) {
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? (balances[lastPeriodId] || 0) : 0;
  }
  return cells;
}

export function changeCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (let i = 0; i < periods.length; i++) {
    if (i === 0) { cells[periods[i].id] = 0; }
    else { cells[periods[i].id] = calcFn(periods[i].id) - calcFn(periods[i - 1].id); }
  }
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) sum += cells[mpid] || 0;
    cells[ap.id] = sum;
  }
  return cells;
}

export function pctChangeCells(
  dealData: DealData, calcFn: (periodId: string) => number
): Record<string, number> {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells: Record<string, number> = {};
  for (let i = 0; i < periods.length; i++) {
    if (i === 0) { cells[periods[i].id] = NaN; }
    else {
      const prior = calcFn(periods[i - 1].id);
      const current = calcFn(periods[i].id);
      cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
    }
  }
  for (const ap of aggregatePeriods) {
    cells[ap.id] = NaN;
  }
  return cells;
}
