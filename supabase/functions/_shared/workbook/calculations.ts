/**
 * Core financial calculations (server-side copy).
 * Mirrors src/lib/calculations.ts — keep in sync.
 */
import type {
  TrialBalanceEntry, Adjustment, PeriodDef, DealData,
  GridRow, GridColumn, FiscalYear, Reclassification,
} from "./workbook-types.ts";
import {
  resolveLabel, matchesCategory,
  SALES_ALIASES, COGS_ALIASES, OPEX_ALIASES, PAYROLL_ALIASES, OTHER_EXPENSE_ALIASES,
} from "./deal-labels.ts";

// ============================================
// Index Building
// ============================================

export function buildTbIndex(entries: TrialBalanceEntry[]): Map<string, TrialBalanceEntry> {
  const index = new Map<string, TrialBalanceEntry>();
  for (const entry of entries) {
    index.set(entry.accountId, entry);
  }
  return index;
}

// ============================================
// Aggregation Functions
// ============================================

export function sumByLineItem(
  entries: TrialBalanceEntry[], lineItem: string, periodId: string
): number {
  let total = 0;
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, lineItem) ||
        resolveLabel(entry.fsLineItem) === lineItem) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function sumByFsType(
  entries: TrialBalanceEntry[], fsType: "BS" | "IS", periodId: string
): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.fsType === fsType) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function sumBySubAccount(
  entries: TrialBalanceEntry[], lineItem: string, subAccount1: string, periodId: string
): number {
  let total = 0;
  for (const entry of entries) {
    const resolvedLineItem = resolveLabel(entry.fsLineItem);
    if ((resolvedLineItem === lineItem || matchesCategory(entry.fsLineItem, lineItem)) &&
        entry.subAccount1.toLowerCase() === subAccount1.toLowerCase()) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function getSubAccounts(entries: TrialBalanceEntry[], lineItem: string): string[] {
  const subs = new Set<string>();
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, lineItem) ||
        resolveLabel(entry.fsLineItem) === lineItem) {
      if (entry.subAccount1) subs.add(entry.subAccount1);
    }
  }
  return Array.from(subs).sort();
}

export function getEntriesByLineItem(
  entries: TrialBalanceEntry[], lineItem: string
): TrialBalanceEntry[] {
  return entries.filter(e => {
    const directMatch = matchesCategory(e.fsLineItem, lineItem) ||
                         resolveLabel(e.fsLineItem) === lineItem;
    if (lineItem === "Operating expenses" && directMatch) {
      return e.subAccount1?.toLowerCase() !== "payroll & related";
    }
    if (directMatch) return true;
    if (lineItem === "Payroll & Related") {
      const isOpEx = matchesCategory(e.fsLineItem, "Operating expenses") ||
                     resolveLabel(e.fsLineItem) === "Operating expenses";
      if (isOpEx && e.subAccount1?.toLowerCase() === "payroll & related") return true;
    }
    return false;
  });
}

// ============================================
// Financial Statement Calculations
// ============================================

export function calcRevenue(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Revenue", periodId);
}

export function calcCOGS(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Cost of Goods Sold", periodId);
}

export function calcGrossProfit(entries: TrialBalanceEntry[], periodId: string): number {
  return calcRevenue(entries, periodId) + calcCOGS(entries, periodId);
}

export function calcOpEx(entries: TrialBalanceEntry[], periodId: string): number {
  let total = 0;
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, "Operating expenses") ||
        resolveLabel(entry.fsLineItem) === "Operating expenses") {
      if (entry.subAccount1?.toLowerCase() === "payroll & related") continue;
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function calcPayroll(entries: TrialBalanceEntry[], periodId: string): number {
  let total = 0;
  for (const entry of entries) {
    const isDirectPayroll = matchesCategory(entry.fsLineItem, "Payroll & Related") ||
                            resolveLabel(entry.fsLineItem) === "Payroll & Related";
    const isOpExPayroll = (matchesCategory(entry.fsLineItem, "Operating expenses") ||
                           resolveLabel(entry.fsLineItem) === "Operating expenses") &&
                          entry.subAccount1?.toLowerCase() === "payroll & related";
    if (isDirectPayroll || isOpExPayroll) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function calcOtherExpense(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Other expense (income)", periodId);
}

export function calcOperatingIncome(entries: TrialBalanceEntry[], periodId: string): number {
  return calcGrossProfit(entries, periodId) + calcOpEx(entries, periodId) + calcPayroll(entries, periodId);
}

export function calcNetIncome(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByFsType(entries, "IS", periodId);
}

// ============================================
// EBITDA Addbacks
// ============================================

export function calcInterestExpense(
  entries: TrialBalanceEntry[], periodId: string, addbackAccountIds?: string[]
): number {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function calcDepreciationExpense(
  entries: TrialBalanceEntry[], periodId: string, addbackAccountIds?: string[]
): number {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function calcIncomeTaxExpense(
  entries: TrialBalanceEntry[], periodId: string, addbackAccountIds?: string[]
): number {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}

export function calcReportedEBITDA(
  entries: TrialBalanceEntry[], periodId: string, addbacks?: AddbackMapping
): number {
  return calcNetIncome(entries, periodId) -
         calcInterestExpense(entries, periodId, addbacks?.interest) -
         calcDepreciationExpense(entries, periodId, addbacks?.depreciation) -
         calcIncomeTaxExpense(entries, periodId, addbacks?.taxes);
}

export function calcReportedEBITDAMargin(
  entries: TrialBalanceEntry[], periodId: string, addbacks?: AddbackMapping
): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcReportedEBITDA(entries, periodId, addbacks) / Math.abs(revenue);
}

export function calcEBITDA(entries: TrialBalanceEntry[], periodId: string): number {
  return calcRevenue(entries, periodId) +
         calcCOGS(entries, periodId) +
         calcOpEx(entries, periodId);
}

export function calcAdjustmentTotal(
  adjustments: Adjustment[], type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  let total = 0;
  for (const adj of adjustments) {
    if (type === "all" || adj.type === type) {
      total += adj.amounts[periodId] || 0;
    }
  }
  return total;
}

// ============================================
// Per-Line-Item Adjustment Allocation
// ============================================

export function calcAdjustmentByLineItem(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  lineItemCategory: string, lineItemAliases: Set<string>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  let total = 0;
  for (const adj of adjustments) {
    if (type !== "all" && adj.type !== type) continue;
    const entry = tbIndex.get(adj.tbAccountNumber);
    if (!entry) continue;
    const resolved = resolveLabel(entry.fsLineItem);
    if (resolved === lineItemCategory || lineItemAliases.has((entry.fsLineItem || "").toLowerCase().trim())) {
      total += adj.amounts[periodId] || 0;
    }
  }
  return total;
}

export function calcRevenueAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Revenue", SALES_ALIASES, type, periodId);
}

export function calcCOGSAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Cost of Goods Sold", COGS_ALIASES, type, periodId);
}

export function calcOpExAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Operating expenses", OPEX_ALIASES, type, periodId) +
         calcAdjustmentByLineItem(adjustments, tbIndex, "Payroll & Related", PAYROLL_ALIASES, type, periodId);
}

export function calcOtherExpenseAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Other expense (income)", OTHER_EXPENSE_ALIASES, type, periodId);
}

export function calcAdjustedEBITDA(
  entries: TrialBalanceEntry[], adjustments: Adjustment[], periodId: string, addbacks?: AddbackMapping
): number {
  return calcReportedEBITDA(entries, periodId, addbacks) -
         calcAdjustmentTotal(adjustments, "all", periodId);
}

// ============================================
// Balance Sheet Calculations
// ============================================

export function calcTotalCurrentAssets(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Cash and cash equivalents", periodId) +
         sumByLineItem(entries, "Accounts receivable", periodId) +
         sumByLineItem(entries, "Other current assets", periodId);
}

export function calcTotalAssets(entries: TrialBalanceEntry[], periodId: string): number {
  return calcTotalCurrentAssets(entries, periodId) +
         sumByLineItem(entries, "Fixed assets", periodId) +
         sumByLineItem(entries, "Other assets", periodId);
}

export function calcTotalCurrentLiabilities(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Current liabilities", periodId) +
         sumByLineItem(entries, "Other current liabilities", periodId);
}

export function calcTotalLiabilities(entries: TrialBalanceEntry[], periodId: string): number {
  return calcTotalCurrentLiabilities(entries, periodId) +
         sumByLineItem(entries, "Long term liabilities", periodId);
}

export function calcTotalEquity(entries: TrialBalanceEntry[], periodId: string): number {
  return sumByLineItem(entries, "Equity", periodId);
}

export function calcTotalLiabilitiesAndEquity(entries: TrialBalanceEntry[], periodId: string): number {
  return calcTotalLiabilities(entries, periodId) + calcTotalEquity(entries, periodId);
}

export function bsCheckPasses(entries: TrialBalanceEntry[], periodId: string): boolean {
  const assets = calcTotalAssets(entries, periodId);
  const liabEquity = calcTotalLiabilitiesAndEquity(entries, periodId);
  return Math.abs(assets + liabEquity) < 0.01;
}

// ============================================
// Working Capital
// ============================================

export function calcNetWorkingCapital(entries: TrialBalanceEntry[], periodId: string): number {
  return calcTotalCurrentAssets(entries, periodId) + calcTotalCurrentLiabilities(entries, periodId);
}

export function calcNWCExCash(entries: TrialBalanceEntry[], periodId: string): number {
  const currentAssetsExCash = sumByLineItem(entries, "Accounts receivable", periodId) +
                               sumByLineItem(entries, "Other current assets", periodId);
  return currentAssetsExCash + calcTotalCurrentLiabilities(entries, periodId);
}

// ============================================
// Margins
// ============================================

export function calcGrossMargin(entries: TrialBalanceEntry[], periodId: string): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcGrossProfit(entries, periodId) / Math.abs(revenue);
}

export function calcOperatingMargin(entries: TrialBalanceEntry[], periodId: string): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcOperatingIncome(entries, periodId) / Math.abs(revenue);
}

export function calcEBITDAMargin(entries: TrialBalanceEntry[], periodId: string): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcEBITDA(entries, periodId) / Math.abs(revenue);
}

export function calcAdjustedEBITDAMargin(
  entries: TrialBalanceEntry[], adjustments: Adjustment[], periodId: string, addbacks?: AddbackMapping
): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcAdjustedEBITDA(entries, adjustments, periodId, addbacks) / Math.abs(revenue);
}

export function calcNetMargin(entries: TrialBalanceEntry[], periodId: string): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN;
  return calcNetIncome(entries, periodId) / Math.abs(revenue);
}

// ============================================
// Addback Mapping Type
// ============================================

export interface AddbackMapping {
  interest: string[];
  depreciation: string[];
  taxes: string[];
}

// ============================================
// Aggregate Period Helpers (FY / LTM / YTD)
// ============================================

export interface AggregatePeriod {
  id: string;
  label: string;
  shortLabel: string;
  monthPeriodIds: string[];
}

export function buildAggregatePeriods(
  periods: PeriodDef[], fiscalYears: FiscalYear[], fiscalYearEnd: number
): AggregatePeriod[] {
  const aggs: AggregatePeriod[] = [];
  for (const fy of fiscalYears) {
    aggs.push({
      id: `agg-${fy.label}`,
      label: fy.label,
      shortLabel: fy.label,
      monthPeriodIds: fy.periods.map(p => p.id),
    });
  }
  if (periods.length > 0) {
    const latest = periods[periods.length - 1];
    const latestDate = latest.date;
    const ltmPeriods = periods.filter(p => {
      const diff = (latestDate.getFullYear() - p.date.getFullYear()) * 12 +
                   (latestDate.getMonth() - p.date.getMonth());
      return diff >= 0 && diff < 12;
    });
    if (ltmPeriods.length > 0) {
      const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const ltmLabel = `LTM ${SHORT_MONTHS[latest.month - 1]}-${String(latest.year).slice(-2)}`;
      aggs.push({
        id: `agg-ltm-${latest.id}`,
        label: ltmLabel,
        shortLabel: ltmLabel,
        monthPeriodIds: ltmPeriods.map(p => p.id),
      });
    }
    const fyeMonth = fiscalYearEnd;
    let fyStartMonth = fyeMonth + 1;
    let fyStartYear = latest.year;
    if (fyStartMonth > 12) { fyStartMonth = 1; }
    if (latest.month < fyeMonth) { fyStartYear -= 1; }
    const ytdPeriods = periods.filter(p => {
      const pDate = p.date;
      const fyStart = new Date(fyStartYear, fyStartMonth - 1, 1);
      return pDate >= fyStart && pDate <= latestDate;
    });
    if (ytdPeriods.length > 0 && ytdPeriods.length < 12) {
      const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const ytdLabel = `YTD ${SHORT_MONTHS[latest.month - 1]}-${String(latest.year).slice(-2)}`;
      aggs.push({
        id: `agg-ytd-${latest.id}`,
        label: ytdLabel,
        shortLabel: ytdLabel,
        monthPeriodIds: ytdPeriods.map(p => p.id),
      });
    }
  }
  return aggs;
}

export function sumEntryAcrossPeriods(entry: TrialBalanceEntry, periodIds: string[]): number {
  let total = 0;
  for (const pid of periodIds) {
    total += entry.balances[pid] || 0;
  }
  return total;
}

export function calcForAggregatePeriod(
  calcFn: (entries: TrialBalanceEntry[], periodId: string) => number,
  entries: TrialBalanceEntry[], monthPeriodIds: string[]
): number {
  return monthPeriodIds.reduce((sum, pid) => sum + calcFn(entries, pid), 0);
}

export function sumAcrossPeriods(
  calcFn: (entries: TrialBalanceEntry[], periodId: string) => number,
  entries: TrialBalanceEntry[], periods: PeriodDef[]
): number {
  return periods.reduce((sum, p) => sum + calcFn(entries, p.id), 0);
}

export function groupByFiscalYear(periods: PeriodDef[], fiscalYearEnd: number): FiscalYear[] {
  if (periods.length === 0) return [];
  const years: FiscalYear[] = [];
  let currentYear: PeriodDef[] = [];
  for (const period of periods) {
    currentYear.push(period);
    if (period.month === fiscalYearEnd) {
      const shortYear = String(period.year).slice(-2);
      years.push({ label: `FY ${shortYear}`, periods: [...currentYear] });
      currentYear = [];
    }
  }
  if (currentYear.length > 0) {
    const lastPeriod = currentYear[currentYear.length - 1];
    const shortYear = String(lastPeriod.year).slice(-2);
    years.push({ label: `FY ${shortYear}`, periods: currentYear });
  }
  return years;
}

export function calcDisplayEquity(
  entries: TrialBalanceEntry[], allPeriodIds: string[], throughPeriodId: string
): number {
  if (allPeriodIds.length === 0) return 0;
  const firstPeriodId = allPeriodIds[0];
  const firstEquity = -sumByLineItem(entries, "Equity", firstPeriodId);
  let cumulative = firstEquity;
  for (const pid of allPeriodIds) {
    if (pid === throughPeriodId) break;
    if (pid === firstPeriodId) continue;
    cumulative += -sumByFsType(entries, "IS", pid);
  }
  return cumulative;
}

export function calcPlugAmount(entries: TrialBalanceEntry[], periodId: string): number {
  let total = 0;
  for (const entry of entries) {
    total += entry.balances[periodId] || 0;
  }
  return -total;
}

// ============================================
// Clearing Account Helpers (Proof of Cash)
// ============================================

export function calcUndepositedFunds(entries: TrialBalanceEntry[], periodId: string): number {
  let total = 0;
  const CLEARING_KEYWORDS = ["undeposited", "unapplied cash"];
  for (const entry of entries) {
    if (
      matchesCategory(entry.fsLineItem, "Cash and cash equivalents") ||
      resolveLabel(entry.fsLineItem) === "Cash and cash equivalents"
    ) {
      const sub = (entry.subAccount1 || "").toLowerCase().trim();
      const name = (entry.accountName || "").toLowerCase().trim();
      const isClearing = CLEARING_KEYWORDS.some(k => sub.includes(k) || name.includes(k));
      if (isClearing) {
        total += entry.balances[periodId] || 0;
      }
    }
  }
  return total;
}

// ============================================
// Reclassification Overlay
// ============================================

export function sumReclassImpact(
  reclassifications: Reclassification[],
  lineItem: string,
  periodId: string
): number {
  let total = 0;
  for (const r of reclassifications) {
    const amt = r.amounts[periodId] ?? r.amounts["_flat"] ?? 0;
    if (amt === 0) continue;
    if (matchesCategory(r.toAccount, lineItem) || resolveLabel(r.toAccount) === lineItem) {
      total += amt;
    }
    if (matchesCategory(r.fromAccount, lineItem) || resolveLabel(r.fromAccount) === lineItem) {
      total -= amt;
    }
  }
  return total;
}

export function sumByLineItemWithReclass(
  entries: TrialBalanceEntry[],
  reclassifications: Reclassification[],
  lineItem: string,
  periodId: string
): number {
  return sumByLineItem(entries, lineItem, periodId) + sumReclassImpact(reclassifications, lineItem, periodId);
}
