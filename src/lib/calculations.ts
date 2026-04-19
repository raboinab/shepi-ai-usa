/**
 * Core financial calculations for the workbook engine.
 * Replaces all Google Sheets formulas (SUMIF, aggregation, EBITDA, margins).
 */
import type { 
  TrialBalanceEntry, Adjustment, PeriodDef, DealData, 
  GridRow, GridColumn, FiscalYear, Reclassification 
} from "./workbook-types";
import { resolveLabel, matchesCategory, SALES_ALIASES, COGS_ALIASES, OPEX_ALIASES, PAYROLL_ALIASES, OTHER_EXPENSE_ALIASES } from "./deal-labels";

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
  entries: TrialBalanceEntry[],
  lineItem: string,
  periodId: string
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
  entries: TrialBalanceEntry[],
  fsType: "BS" | "IS",
  periodId: string
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
  entries: TrialBalanceEntry[],
  lineItem: string,
  subAccount1: string,
  periodId: string
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

export function getSubAccounts(
  entries: TrialBalanceEntry[],
  lineItem: string
): string[] {
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
  entries: TrialBalanceEntry[],
  lineItem: string
): TrialBalanceEntry[] {
  return entries.filter(e => {
    const directMatch = matchesCategory(e.fsLineItem, lineItem) || 
                         resolveLabel(e.fsLineItem) === lineItem;
    // For "Operating expenses": exclude entries with subAccount1 = "Payroll & Related"
    if (lineItem === "Operating expenses" && directMatch) {
      return e.subAccount1?.toLowerCase() !== "payroll & related";
    }
    if (directMatch) return true;
    // For "Payroll & Related": also include OpEx entries with subAccount1 = "Payroll & Related"
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
  // Exclude entries that are "Operating expenses" but subAccount1 = "Payroll & Related"
  // (real QB data maps payroll under OpEx with a sub-label)
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
  // Match both: direct "Payroll & Related" line items (demo data)
  // AND "Operating expenses" entries with subAccount1 = "Payroll & Related" (real QB data)
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
// Uses explicit addback account mappings from DealData when available.
// Falls back to $0 when no explicit mapping exists (matching Excel behavior).
// ============================================

export function calcInterestExpense(
  entries: TrialBalanceEntry[],
  periodId: string,
  addbackAccountIds?: string[]
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
  entries: TrialBalanceEntry[],
  periodId: string,
  addbackAccountIds?: string[]
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
  entries: TrialBalanceEntry[],
  periodId: string,
  addbackAccountIds?: string[]
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

/**
 * Reported EBITDA = Net Income - (Interest + Taxes + Depreciation) addbacks.
 * When addback accounts aren't configured, addbacks are $0 so EBITDA = Net Income.
 */
export function calcReportedEBITDA(
  entries: TrialBalanceEntry[],
  periodId: string,
  addbacks?: AddbackMapping
): number {
  return calcNetIncome(entries, periodId) -
         calcInterestExpense(entries, periodId, addbacks?.interest) -
         calcDepreciationExpense(entries, periodId, addbacks?.depreciation) -
         calcIncomeTaxExpense(entries, periodId, addbacks?.taxes);
}

export function calcReportedEBITDAMargin(
  entries: TrialBalanceEntry[],
  periodId: string,
  addbacks?: AddbackMapping
): number {
  const revenue = calcRevenue(entries, periodId);
  if (revenue === 0) return NaN; // will format as "n/q"
  return calcReportedEBITDA(entries, periodId, addbacks) / Math.abs(revenue);
}

export function calcEBITDA(entries: TrialBalanceEntry[], periodId: string): number {
  return calcRevenue(entries, periodId) + 
         calcCOGS(entries, periodId) + 
         calcOpEx(entries, periodId) +
         calcPayroll(entries, periodId);
}

export function calcAdjustmentTotal(
  adjustments: Adjustment[],
  type: "MA" | "DD" | "PF" | "all",
  periodId: string,
  excludeNonQoE = true
): number {
  let total = 0;
  for (const adj of adjustments) {
    if (excludeNonQoE && adj.effectType === "NonQoE") continue;
    if (type === "all" || adj.type === type) {
      total += adj.amounts[periodId] || 0;
    }
  }
  return total;
}

// ============================================
// Per-Line-Item Adjustment Allocation
// Replicates GS SUMIFS(adjustments, fsLineItem = "Sales")
// ============================================

/**
 * Sum adjustments whose linked TB account's fsLineItem matches a target line-item group.
 * Resolves each adjustment's tbAccountNumber → TrialBalanceEntry → fsLineItem,
 * then checks if it belongs to the given alias set.
 */
export function calcAdjustmentByLineItem(
  adjustments: Adjustment[],
  tbIndex: Map<string, TrialBalanceEntry>,
  lineItemCategory: string,
  lineItemAliases: Set<string>,
  type: "MA" | "DD" | "PF" | "all",
  periodId: string
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

/** Adjustments allocated to Revenue line items */
export function calcRevenueAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Revenue", SALES_ALIASES, type, periodId);
}

/** Adjustments allocated to COGS line items */
export function calcCOGSAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Cost of Goods Sold", COGS_ALIASES, type, periodId);
}

/** Adjustments allocated to OpEx line items */
export function calcOpExAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Operating expenses", OPEX_ALIASES, type, periodId) +
         calcAdjustmentByLineItem(adjustments, tbIndex, "Payroll & Related", PAYROLL_ALIASES, type, periodId);
}

/** Adjustments allocated to Other Expense line items */
export function calcOtherExpenseAdjustments(
  adjustments: Adjustment[], tbIndex: Map<string, TrialBalanceEntry>,
  type: "MA" | "DD" | "PF" | "all", periodId: string
): number {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Other expense (income)", OTHER_EXPENSE_ALIASES, type, periodId);
}

export function calcAdjustedEBITDA(
  entries: TrialBalanceEntry[],
  adjustments: Adjustment[],
  periodId: string,
  addbacks?: AddbackMapping
): number {
  // Adjustments are positive addbacks; in TB space EBITDA is negative (credit convention),
  // so subtracting positive adj makes the result more negative → after npc flip = higher positive display
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
  // In TB convention: assets (positive) + liabilities+equity (negative) = 0
  return Math.abs(assets + liabEquity) < 0.01;
}

// ============================================
// Working Capital
// ============================================

export function calcNetWorkingCapital(entries: TrialBalanceEntry[], periodId: string): number {
  // Liabilities are negative in TB (credit convention), so ADD them (adding a negative = subtract |CL|)
  return calcTotalCurrentAssets(entries, periodId) + calcTotalCurrentLiabilities(entries, periodId);
}

export function calcNWCExCash(entries: TrialBalanceEntry[], periodId: string): number {
  const currentAssetsExCash = sumByLineItem(entries, "Accounts receivable", periodId) +
                               sumByLineItem(entries, "Other current assets", periodId);
  // Liabilities are negative in TB — add them (adding negative = subtract |CL|)
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
  entries: TrialBalanceEntry[],
  adjustments: Adjustment[],
  periodId: string,
  addbacks?: AddbackMapping
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

/**
 * Build FY, LTM, YTD aggregate periods from the deal's fiscal years and periods.
 */
export function buildAggregatePeriods(
  periods: PeriodDef[],
  fiscalYears: FiscalYear[],
  fiscalYearEnd: number
): AggregatePeriod[] {
  const aggs: AggregatePeriod[] = [];

  // FY aggregates
  for (const fy of fiscalYears) {
    aggs.push({
      id: `agg-${fy.label}`,
      label: fy.label,
      shortLabel: fy.label,
      monthPeriodIds: fy.periods.map(p => p.id),
    });
  }

  // LTM & YTD based on the latest period available
  if (periods.length > 0) {
    const latest = periods[periods.length - 1];
    const latestDate = latest.date;

    // LTM = last 12 months ending at latest period
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

    // YTD = from start of current fiscal year to latest period
    const fyeMonth = fiscalYearEnd;
    // Current FY starts the month after FYE
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

/**
 * Sum a TB entry's balances across multiple monthly periods.
 */
export function sumEntryAcrossPeriods(entry: TrialBalanceEntry, periodIds: string[]): number {
  let total = 0;
  for (const pid of periodIds) {
    total += entry.balances[pid] || 0;
  }
  return total;
}

/**
 * Sum a calculation function across aggregate period's monthly periods.
 */
export function calcForAggregatePeriod(
  calcFn: (entries: TrialBalanceEntry[], periodId: string) => number,
  entries: TrialBalanceEntry[],
  monthPeriodIds: string[]
): number {
  return monthPeriodIds.reduce((sum, pid) => sum + calcFn(entries, pid), 0);
}

// ============================================
// Period Aggregation (Fiscal Year Totals)
// ============================================

export function sumAcrossPeriods(
  calcFn: (entries: TrialBalanceEntry[], periodId: string) => number,
  entries: TrialBalanceEntry[],
  periods: PeriodDef[]
): number {
  return periods.reduce((sum, p) => sum + calcFn(entries, p.id), 0);
}

export function groupByFiscalYear(
  periods: PeriodDef[],
  fiscalYearEnd: number
): FiscalYear[] {
  if (periods.length === 0) return [];
  
  const years: FiscalYear[] = [];
  let currentYear: PeriodDef[] = [];
  
  for (const period of periods) {
    currentYear.push(period);
    
    if (period.month === fiscalYearEnd) {
      const shortYear = String(period.year).slice(-2);
      years.push({
        label: `FY ${shortYear}`,
        periods: [...currentYear],
      });
      currentYear = [];
    }
  }
  
  if (currentYear.length > 0) {
    const lastPeriod = currentYear[currentYear.length - 1];
    const shortYear = String(lastPeriod.year).slice(-2);
    years.push({
      label: `FY ${shortYear}`,
      periods: currentYear,
    });
  }
  
  return years;
}

// ============================================
// TB Plug Row
// ============================================

/**
 * Compute cumulative retained earnings for Balance Sheet display.
 *
 * The TB equity account is a per-period balancing plug (equity[p] = -(bsNonEquity[p] + IS[p])).
 * That plug makes the TB Check = 0 for every period, but it is NOT suitable for BS display
 * because it is a flow (absorbs only that period's IS), not a stock (cumulative RE).
 *
 * This function computes the correct display equity by:
 *   1. Using the TB plug for the first period as the opening equity base.
 *      (plug[p0] already includes the first period's IS.)
 *   2. For each subsequent period, adding that period's net income to the running balance.
 *      In TB convention IS is negative when profitable, so we negate it to get positive display.
 *
 * Result: a growing positive number representing cumulative retained earnings through throughPeriodId.
 * This is structurally separate from the TB equity account — it does NOT affect the TB Check.
 */
export function calcDisplayEquity(
  entries: TrialBalanceEntry[],
  allPeriodIds: string[],
  throughPeriodId: string
): number {
  if (allPeriodIds.length === 0) return 0;
  // Opening base = negate the TB equity plug for period 0 (gives positive display equity)
  const firstPeriodId = allPeriodIds[0];
  const firstEquity = -sumByLineItem(entries, "Equity", firstPeriodId);
  // Accumulate net income for periods 2..throughPeriodId (period 0 already baked into firstEquity)
  let cumulative = firstEquity;
  for (const pid of allPeriodIds) {
    if (pid === throughPeriodId) break;  // check break FIRST (handles throughPeriodId === firstPeriodId)
    if (pid === firstPeriodId) continue; // skip period 0 — already baked into firstEquity
    cumulative += -sumByFsType(entries, "IS", pid); // negate: IS negative when profitable → add positive NI
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

/**
 * Sum only "Cash and cash equivalents" accounts where subAccount1 indicates
 * an undeposited / clearing account (e.g. QBO "Undeposited Funds").
 */
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

/**
 * Compute the net reclassification impact on a given FS line item for a period.
 * Amounts moving TO this line item are added; amounts moving FROM are subtracted.
 * Supports both per-period amounts and the flat "_flat" fallback from single-amount wizard entries.
 */
export function sumReclassImpact(
  reclassifications: Reclassification[],
  lineItem: string,
  periodId: string
): number {
  let total = 0;
  for (const r of reclassifications) {
    const amt = r.amounts[periodId] ?? r.amounts["_flat"] ?? 0;
    if (amt === 0) continue;
    // Check if this reclass moves amount INTO this line item
    if (matchesCategory(r.toAccount, lineItem) || resolveLabel(r.toAccount) === lineItem) {
      total += amt;
    }
    // Check if this reclass moves amount OUT OF this line item
    if (matchesCategory(r.fromAccount, lineItem) || resolveLabel(r.fromAccount) === lineItem) {
      total -= amt;
    }
  }
  return total;
}

/**
 * Sum a line item from TB + overlay reclassification impacts.
 */
export function sumByLineItemWithReclass(
  entries: TrialBalanceEntry[],
  reclassifications: Reclassification[],
  lineItem: string,
  periodId: string
): number {
  return sumByLineItem(entries, lineItem, periodId) + sumReclassImpact(reclassifications, lineItem, periodId);
}
