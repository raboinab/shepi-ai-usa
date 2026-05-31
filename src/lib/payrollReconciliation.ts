/**
 * Helpers to reconcile two payroll data sources:
 *   - Trial Balance accounts classified as "Payroll & Related" (the books)
 *   - Uploaded payroll register (the detail), exposed via dealData.payrollFallback
 *
 * Both are summed to category-level LTM totals so the wizard can show a
 * variance card. Pure functions, no React, easy to test.
 */
import * as calc from "@/lib/calculations";
import type { DealData, PayrollFallbackData } from "@/lib/workbook-types";

export type PayrollCategoryKey = "salaryWages" | "payrollTaxes" | "benefits" | "ownerCompensation";

export const PAYROLL_CATEGORY_LABELS: Record<PayrollCategoryKey, string> = {
  salaryWages: "Salaries & Wages",
  ownerCompensation: "Owner Compensation",
  payrollTaxes: "Payroll Taxes",
  benefits: "Benefits",
};

export type PayrollTotals = Record<PayrollCategoryKey, number> & { total: number };

const ZERO_TOTALS = (): PayrollTotals => ({
  salaryWages: 0,
  payrollTaxes: 0,
  benefits: 0,
  ownerCompensation: 0,
  total: 0,
});

/** Categorize a TB account name into one of the four register-aligned buckets. */
export function categorizeAccountName(name: string): PayrollCategoryKey {
  const n = (name || "").toLowerCase();
  if (/(officer|owner|shareholder|member draw)/.test(n)) return "ownerCompensation";
  if (/(payroll tax|fica|medicare|futa|suta|unemployment|social security|sui|state tax)/.test(n)) return "payrollTaxes";
  if (/(benefit|health|medical|dental|vision|401k|retirement|pension|hsa|life ins|disability)/.test(n)) return "benefits";
  return "salaryWages";
}

/** Find the LTM aggregate period if one exists, else fall back to all visible monthly periods. */
function getLtmPeriodIds(dealData: DealData): string[] {
  const aggs = dealData.deal.aggregatePeriods || [];
  const ltm = aggs.find(a => a.id.startsWith("agg-ltm-") || /LTM/i.test(a.label));
  if (ltm) return ltm.monthPeriodIds;
  return dealData.deal.periods.map(p => p.id);
}

/** Sum TB Payroll & Related entries into category buckets across the LTM window. */
export function sumTbPayrollByCategory(dealData: DealData | null | undefined): PayrollTotals {
  const totals = ZERO_TOTALS();
  if (!dealData) return totals;

  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Payroll & Related");
  if (entries.length === 0) return totals;

  const periodIds = getLtmPeriodIds(dealData);

  for (const entry of entries) {
    const cat = categorizeAccountName(entry.accountName);
    const sum = periodIds.reduce((s, pid) => s + (entry.balances[pid] || 0), 0);
    // TB expenses are typically positive; coerce sign so we always report magnitude
    const magnitude = Math.abs(sum);
    totals[cat] += magnitude;
    totals.total += magnitude;
  }

  return totals;
}

/** Sum the uploaded register into category buckets across the LTM window. */
export function sumRegisterByCategory(
  fallback: PayrollFallbackData | null | undefined,
  dealData: DealData | null | undefined
): PayrollTotals {
  const totals = ZERO_TOTALS();
  if (!fallback) return totals;

  const periodIds = dealData ? getLtmPeriodIds(dealData) : null;

  const sumItems = (items: Array<{ monthlyValues: Record<string, number> }> | undefined) => {
    if (!items) return 0;
    return items.reduce((s, it) => {
      const mv = it.monthlyValues || {};
      if (periodIds && periodIds.length > 0) {
        return s + periodIds.reduce((a, pid) => a + (mv[pid] || 0), 0);
      }
      // No periods to scope to — sum everything we have
      return s + Object.values(mv).reduce((a, b) => a + (b || 0), 0);
    }, 0);
  };

  totals.salaryWages = sumItems(fallback.salaryWages);
  totals.ownerCompensation = sumItems(fallback.ownerCompensation);
  totals.payrollTaxes = sumItems(fallback.payrollTaxes);
  totals.benefits = sumItems(fallback.benefits);
  totals.total =
    totals.salaryWages + totals.ownerCompensation + totals.payrollTaxes + totals.benefits;

  return totals;
}

export interface VarianceRow {
  key: PayrollCategoryKey | "total";
  label: string;
  register: number;
  tb: number;
  variance: number;
  pctVariance: number; // 0..1
}

/** Build the row-by-row variance table comparing register vs TB totals. */
export function computeVariances(register: PayrollTotals, tb: PayrollTotals): VarianceRow[] {
  const keys: PayrollCategoryKey[] = ["salaryWages", "ownerCompensation", "payrollTaxes", "benefits"];
  const rows: VarianceRow[] = keys.map(k => {
    const r = register[k];
    const t = tb[k];
    const variance = r - t;
    const denom = Math.max(Math.abs(r), Math.abs(t));
    const pct = denom > 0 ? Math.abs(variance) / denom : 0;
    return { key: k, label: PAYROLL_CATEGORY_LABELS[k], register: r, tb: t, variance, pctVariance: pct };
  });
  const totalVar = register.total - tb.total;
  const totalDenom = Math.max(Math.abs(register.total), Math.abs(tb.total));
  rows.push({
    key: "total",
    label: "TOTAL",
    register: register.total,
    tb: tb.total,
    variance: totalVar,
    pctVariance: totalDenom > 0 ? Math.abs(totalVar) / totalDenom : 0,
  });
  return rows;
}

/** True if the LTM (or visible period) TB balances classified as Payroll & Related sum to non-zero. */
export function tbHasPayroll(dealData: DealData | null | undefined): boolean {
  return sumTbPayrollByCategory(dealData).total > 0.01;
}

/** True if the uploaded register has any line items at all. */
export function registerHasData(fb: PayrollFallbackData | null | undefined): boolean {
  if (!fb) return false;
  return (
    (fb.salaryWages?.length || 0) +
      (fb.ownerCompensation?.length || 0) +
      (fb.payrollTaxes?.length || 0) +
      (fb.benefits?.length || 0) >
    0
  );
}
