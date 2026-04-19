/**
 * Reclass-aware metric helpers.
 * Wraps raw calc.* functions with reclassification overlay so consumers
 * don't need to duplicate the overlay loop from qoeMetrics.ts.
 *
 * All return display-positive values (revenue as positive, etc.).
 */
import type { TrialBalanceEntry, Reclassification, Adjustment } from "./workbook-types";
import type { AddbackMapping } from "./calculations";
import * as calc from "./calculations";

function reclassOverlay(
  rc: Reclassification[],
  pids: string[],
  categories: string[]
): number {
  if (rc.length === 0) return 0;
  let total = 0;
  for (const pid of pids) {
    for (const cat of categories) {
      total += calc.sumReclassImpact(rc, cat, pid);
    }
  }
  return total;
}

const IS_CATEGORIES = ["Revenue", "Cost of Goods Sold", "Operating expenses", "Payroll & Related", "Other expense (income)"];

/** Display-positive LTM revenue including reclass impacts */
export function reclassAwareRevenue(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = -pids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue"]);
}

/** Display-positive LTM COGS (debit = positive) including reclass impacts */
export function reclassAwareCOGS(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = pids.reduce((s, p) => s + calc.calcCOGS(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Cost of Goods Sold"]);
}

/** Display-positive LTM gross profit including reclass impacts */
export function reclassAwareGrossProfit(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = -pids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue", "Cost of Goods Sold"]);
}

/** Display-positive LTM operating income including reclass impacts */
export function reclassAwareOperatingIncome(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = -pids.reduce((s, p) => s + calc.calcOperatingIncome(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue", "Cost of Goods Sold", "Operating expenses", "Payroll & Related"]);
}

/** Display-positive LTM net income including reclass impacts */
export function reclassAwareNetIncome(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = -pids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}

/** Display-positive LTM OpEx (debit = positive) including reclass impacts */
export function reclassAwareOpEx(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = pids.reduce((s, p) => s + calc.calcOpEx(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Operating expenses", "Payroll & Related"]);
}

/** Display-positive LTM Other Expense including reclass impacts */
export function reclassAwareOtherExpense(tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[]): number {
  const raw = pids.reduce((s, p) => s + calc.calcOtherExpense(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Other expense (income)"]);
}

/** Display-positive reported EBITDA including reclass impacts */
export function reclassAwareReportedEBITDA(
  tb: TrialBalanceEntry[], rc: Reclassification[], pids: string[], ab: AddbackMapping
): number {
  const raw = -pids.reduce((s, p) => s + calc.calcReportedEBITDA(tb, p, ab), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}

/** Display-positive adjusted EBITDA including reclass impacts */
export function reclassAwareAdjustedEBITDA(
  tb: TrialBalanceEntry[], rc: Reclassification[], adj: Adjustment[], pids: string[], ab: AddbackMapping
): number {
  const raw = -pids.reduce((s, p) => s + calc.calcAdjustedEBITDA(tb, adj, p, ab), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}

/**
 * Per-period reclass-aware revenue (TB sign, not display-positive).
 * Useful for denominators in margin calculations where the consumer handles sign.
 */
export function reclassAwareRevenueRaw(tb: TrialBalanceEntry[], rc: Reclassification[], pid: string): number {
  return calc.calcRevenue(tb, pid) + calc.sumReclassImpact(rc, "Revenue", pid);
}
