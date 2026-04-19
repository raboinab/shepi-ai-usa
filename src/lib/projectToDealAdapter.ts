/**
 * Data Adapter: transforms existing wizard_data + project fields
 * into the DealData interface consumed by the workbook engine.
 */
import type { 
  DealData, Account, TrialBalanceEntry, Adjustment, 
  Reclassification, PeriodDef, AgingEntry, FixedAssetEntry,
  CustomerEntry, VendorEntry, FiscalYear,
  SupplementaryDebtItem, SupplementaryLeaseItem
} from "./workbook-types";
import { buildTbIndex, groupByFiscalYear, buildAggregatePeriods } from "./calculations";
import type { AddbackMapping } from "./calculations";
import { computeSign } from "./qoeAdjustmentTaxonomy";
import type { LedgerIntent } from "./qoeAdjustmentTaxonomy";
import type { Period } from "./periodUtils";
import { derivePriorBalances } from "./derivePriorBalances";

// ============================================
// Main Adapter Function
// ============================================

export interface ProjectRecord {
  id: string;
  name: string;
  client_name: string | null;
  target_company: string | null;
  industry: string | null;
  transaction_type: string | null;
  fiscal_year_end: string | null;
  periods: Period[] | null;
  wizard_data: Record<string, unknown> | null;
}

export function projectToDealData(project: ProjectRecord): DealData {
  const wd = project.wizard_data || {};
  
  // 1. Build periods
  const periods = adaptPeriods(project.periods || []);
  const fiscalYearEnd = parseFiscalYearEnd(project.fiscal_year_end);
  const nonStubPeriods = periods.filter(p => !p.isStub);
  const fiscalYears = groupByFiscalYear(nonStubPeriods, fiscalYearEnd); // FY excludes stubs
  const aggregatePeriods = buildAggregatePeriods(periods, fiscalYears, fiscalYearEnd); // LTM/YTD includes stubs

  // Compute prior period ID (month before first visible period)
  let priorPeriodId: string | undefined;
  if (periods.length > 0) {
    const first = periods[0];
    const priorMonth = first.month === 1 ? 12 : first.month - 1;
    const priorYear = first.month === 1 ? first.year - 1 : first.year;
    priorPeriodId = `${priorYear}-${String(priorMonth).padStart(2, '0')}`;
  }
  
  // 2. Build accounts from chart of accounts
  const accounts = adaptAccounts(wd.chartOfAccounts);
  
  // 3. Build trial balance entries
  const trialBalance = adaptTrialBalance(wd.trialBalance, accounts, periods.map(p => p.id), fiscalYearEnd);

  // 3b. Auto-correct misclassified equity accounts (e.g. "Retained Earnings" mapped as "Other current assets")
  const EQUITY_NAME_PATTERNS = [
    /retained\s+earnings/i,
    /owner['']?s?\s+equity/i,
    /members?\s+equity/i,
    /partners?\s+equity/i,
    /shareholders?\s+equity/i,
    /stockholders?\s+equity/i,
    /opening\s+balance\s+equity/i,
  ];
  for (const entry of trialBalance) {
    if (entry.fsLineItem === "Equity") continue; // already correct
    const nameMatch = EQUITY_NAME_PATTERNS.some(pat => pat.test(entry.accountName));
    if (nameMatch) {
      entry.fsType = "BS";
      entry.fsLineItem = "Equity";
    }
  }
  // Also fix accounts array so downstream consumers stay consistent
  const accountMap = new Map(accounts.map(a => [a.accountId, a]));
  for (const entry of trialBalance) {
    if (entry.fsLineItem === "Equity") {
      const acct = accountMap.get(entry.accountId);
      if (acct && acct.fsLineItem !== "Equity") {
        acct.fsType = "BS";
        acct.fsLineItem = "Equity";
      }
    }
  }

  // 4. Build adjustments
  const ddAdj = wd.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = adaptAdjustments(ddAdj?.adjustments ?? wd.adjustments);
  const reclassData = wd.reclassifications as Record<string, unknown> | undefined;
  const reclassifications = adaptReclassifications(
    (reclassData?.reclassifications as unknown) ?? wd.reclassifications,
    trialBalance
  );
  
  // 5. Build addback mappings from deal setup
  const addbacks = adaptAddbacks(wd.dealSetup || wd.ebitdaAddbacks);

  // Auto-infer addback accounts from TB entries when no explicit mapping is present.
  // Looks for "Other expense (income)" accounts and maps by name heuristic:
  //   "interest" → addbacks.interest, "depreciation"/"amortization" → addbacks.depreciation, "tax" → addbacks.taxes
  if (addbacks.interest.length === 0 && addbacks.depreciation.length === 0 && addbacks.taxes.length === 0) {
    for (const entry of trialBalance) {
      if (entry.fsLineItem !== "Other expense (income)") continue;
      const nameLower = entry.accountName.toLowerCase();
      if (nameLower.includes("interest")) {
        addbacks.interest.push(entry.accountId);
      } else if (nameLower.includes("depreciation") || nameLower.includes("amortization")) {
        addbacks.depreciation.push(entry.accountId);
      } else if (nameLower.includes("tax")) {
        addbacks.taxes.push(entry.accountId);
      }
    }
  }
  
  // 6. Build index and month dates
  const tbIndex = buildTbIndex(trialBalance);
  const monthDates = buildMonthDates(periods);
  
  // 7. Build supplementary data
  const arAging = adaptAgingData(wd.arAging);
  const apAging = adaptAgingData(wd.apAging);
  const fixedAssets = adaptFixedAssets(wd.fixedAssets);
  const topCustomers = adaptCustomers(wd.topCustomers);
  const topVendors = adaptVendors(wd.topVendors);
  const supplementary = adaptSupplementary(wd.supplementary);

  // WIP account mapping from due diligence wizard data
  const dd = (wd.dueDiligence as Record<string, unknown> | undefined) || {};
  const wipAccountMapping = (dd.wipAccountMapping as DealData["wipAccountMapping"]) || undefined;
  
  return {
    deal: {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name || "",
      targetCompany: project.target_company || "",
      industry: project.industry || "",
      transactionType: project.transaction_type || "",
      fiscalYearEnd,
      periods,
      fiscalYears,
      aggregatePeriods,
      priorPeriodId,
    },
    accounts,
    trialBalance,
    adjustments,
    reclassifications,
    tbIndex,
    monthDates,
    arAging,
    apAging,
    fixedAssets,
    topCustomers,
    topVendors,
    addbacks,
    supplementary,
    wipAccountMapping,
  };
}

/**
 * Async wrapper that calls projectToDealData then enriches with priorBalances
 * derived from canonical_transactions GL activity.
 */
export async function loadDealDataWithPriorBalances(project: ProjectRecord): Promise<DealData> {
  const dealData = projectToDealData(project);
  const priorBalances = await derivePriorBalances(
    project.id,
    dealData.trialBalance,
    dealData.deal.periods
  );
  if (Object.keys(priorBalances).length > 0) {
    dealData.deal.priorBalances = priorBalances;
  }
  return dealData;
}

// ============================================
// Period Adaptation
// ============================================

function adaptPeriods(periods: Period[]): PeriodDef[] {
  const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return periods
    .map(p => {
      // For stub periods, use the existing label (e.g., "Stub Feb-25") rather than recomputing
      const shortLabel = p.isStub
        ? (p.label || `Stub ${SHORT_MONTHS[p.month - 1]}-${String(p.year).slice(-2)}`)
        : `${SHORT_MONTHS[p.month - 1]}-${String(p.year).slice(-2)}`;
      return {
        id: p.id,
        label: shortLabel,
        shortLabel,
        year: p.year,
        month: p.month,
        isStub: p.isStub,
        startDate: p.startDate,
        endDate: p.endDate,
        date: new Date(p.year, p.month - 1, 1),
      };
    });
}

function parseFiscalYearEnd(fye: string | null): number {
  if (!fye) return 12;
  const month = parseInt(fye, 10);
  return isNaN(month) ? 12 : Math.max(1, Math.min(12, month));
}

function buildMonthDates(periods: PeriodDef[]): Date[] {
  return periods.map(p => p.date).sort((a, b) => a.getTime() - b.getTime());
}

// ============================================
// Account Adaptation
// ============================================

function adaptAccounts(coa: unknown): Account[] {
  if (!coa) return [];
  const arr = Array.isArray(coa) ? coa : (Array.isArray((coa as Record<string, unknown>)?.accounts) ? (coa as Record<string, unknown>).accounts as unknown[] : null);
  if (!arr) return [];
  
  return arr.map((acc: Record<string, unknown>) => ({
    accountId: String(acc.accountNumber || acc.id || ""),
    accountName: String(acc.accountName || acc.name || ""),
    fsType: (acc.fsType === "IS" ? "IS" : "BS") as "BS" | "IS",
    fsLineItem: String(acc.category || acc.fsLineItem || ""),
    subAccount1: String(acc.subAccount1 || acc.accountSubtype || ""),
    subAccount2: String(acc.subAccount2 || ""),
    subAccount3: String(acc.subAccount3 || ""),
  }));
}

// ============================================
// Trial Balance Adaptation
// ============================================

function adaptTrialBalance(
  tbData: unknown,
  accounts: Account[],
  sortedPeriodIds: string[],
  fiscalYearEnd: number
): TrialBalanceEntry[] {
  if (!tbData || typeof tbData !== "object") return [];
  
  const tb = tbData as Record<string, unknown>;
  const tbAccounts = tb.accounts as Record<string, unknown>[] | undefined;
  
  if (!Array.isArray(tbAccounts)) return [];
  
  const accountMap = new Map(accounts.map(a => [a.accountId, a]));
  
  return tbAccounts.map((acc: Record<string, unknown>) => {
    const accountId = String(acc.accountNumber || acc.accountId || acc.id || "");
    const enrichment = accountMap.get(accountId);
    
    const balances: Record<string, number> = {};
    const monthlyBalances = acc.monthlyValues || acc.monthlyBalances || acc.balances;
    
    if (monthlyBalances && typeof monthlyBalances === "object") {
      for (const [key, val] of Object.entries(monthlyBalances as Record<string, unknown>)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          balances[key] = numVal;
        }
      }
    }
    
    const fsType = (enrichment?.fsType || acc.fsType || "BS") as "BS" | "IS";

    // For IS accounts, convert cumulative YTD → monthly activity.
    // QB Trial Balances store YTD ending balances for IS accounts.
    // We iterate in reverse so earlier values are still cumulative when we subtract.
    if (fsType === "IS" && sortedPeriodIds.length > 0) {
      // Build ordered list of period IDs that exist in this account's balances
      const orderedIds = sortedPeriodIds.filter(id => id in balances);
      for (let i = orderedIds.length - 1; i > 0; i--) {
        // Determine if current and previous period are in the same fiscal year.
        // Period IDs are formatted as "YYYY-MM" or similar sortable strings.
        // Parse month from the period def to detect FY boundary.
        const curMonth = parsePeriodMonth(orderedIds[i]);
        const prevMonth = parsePeriodMonth(orderedIds[i - 1]);
        // FY starts at fiscalYearEnd + 1. If FYE=12, FY starts in month 1.
        const fyStartMonth = (fiscalYearEnd % 12) + 1;
        // If current month is the FY start month, it's the first month of a new FY — don't subtract.
        // Compare fiscal years to detect FY boundary (handles missing months)
        const curYear = parsePeriodYear(orderedIds[i]);
        const prevYear = parsePeriodYear(orderedIds[i - 1]);
        if (curYear !== undefined && prevYear !== undefined && curMonth !== undefined && prevMonth !== undefined) {
          const curFY = getFiscalYear(curYear, curMonth, fyStartMonth);
          const prevFY = getFiscalYear(prevYear, prevMonth, fyStartMonth);
          if (curFY !== prevFY) continue;
        }
        // Same fiscal year — subtract prior cumulative YTD to get monthly activity
        if (prevMonth !== undefined && curMonth !== undefined) {
          balances[orderedIds[i]] -= balances[orderedIds[i - 1]];
        }
      }
    }

    return {
      accountId,
      accountName: String(acc.accountName || acc.name || ""),
      fsType,
      fsLineItem: String(enrichment?.fsLineItem || acc.fsLineItem || acc.category || ""),
      subAccount1: String(enrichment?.subAccount1 || acc.subAccount1 || ""),
      subAccount2: String(enrichment?.subAccount2 || acc.subAccount2 || ""),
      subAccount3: String(enrichment?.subAccount3 || acc.subAccount3 || ""),
      balances,
    };
  });
}

/** Extract the year from a period ID like "2024-01" or "Jan-24". */
function parsePeriodYear(periodId: string): number | undefined {
  const match4 = periodId.match(/(\d{4})-\d{2}/);
  if (match4) return parseInt(match4[1], 10);
  const match2 = periodId.match(/[a-zA-Z]+-(\d{2})/);
  if (match2) return 2000 + parseInt(match2[1], 10);
  return undefined;
}

/** Determine which fiscal year a (year, month) belongs to.
 *  If FYE=12, fyStart=1 → month>=1 always true → FY=year.
 *  If FYE=6, fyStart=7 → Jul-Dec=year, Jan-Jun=year-1. */
function getFiscalYear(year: number, month: number, fyStartMonth: number): number {
  return month >= fyStartMonth ? year : year - 1;
}

/** Extract the month number (1-12) from a period ID like "2024-01" or a PeriodDef id. */
function parsePeriodMonth(periodId: string): number | undefined {
  // Try "YYYY-MM" format
  const match = periodId.match(/(\d{4})-(\d{2})/);
  if (match) return parseInt(match[2], 10);
  // Try "Mon-YY" format  
  const SHORT_MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const lower = periodId.toLowerCase();
  for (let i = 0; i < SHORT_MONTHS.length; i++) {
    if (lower.startsWith(SHORT_MONTHS[i])) return i + 1;
  }
  return undefined;
}

// ============================================
// Adjustment Adaptation
// ============================================

function adaptAdjustments(adjData: unknown): Adjustment[] {
  if (!adjData || !Array.isArray(adjData)) return [];

  const ACCEPTED_STATUSES = new Set(["accepted", "accepted_with_edits"]);
  const accepted = adjData.filter((adj: Record<string, unknown>) => {
    const status = adj.status as string | undefined;
    // Legacy adjustments have no status field — treat as accepted
    return !status || ACCEPTED_STATUSES.has(status);
  });
  
  return accepted.map((adj: Record<string, unknown>) => {
    const amounts: Record<string, number> = {};
    const periodAmounts = adj.periodValues || adj.periodAmounts || adj.amounts;
    // Apply intent sign so amounts are in display space (positive = adds to EBITDA).
    // Callers that operate in TB space (where EBITDA is negative) must subtract these amounts.
    const intent = String(adj.intent || "other") as LedgerIntent;
    const sign = computeSign(intent);
    
    if (periodAmounts && typeof periodAmounts === "object") {
      for (const [key, val] of Object.entries(periodAmounts as Record<string, unknown>)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          amounts[key] = numVal * sign;
        }
      }
    }
    
    return {
      id: String(adj.id || ""),
      type: (adj.block || adj.type || adj.adjustmentType || "DD") as "MA" | "DD" | "PF",
      label: String(adj.description || adj.label || adj.name || ""),
      tbAccountNumber: String(adj.linkedAccountNumber || adj.tbAccountNumber || adj.accountNumber || ""),
      intent: String(adj.intent || "other"),
      notes: String(adj.evidenceNotes || adj.notes || ""),
      amounts,
    };
  });
}

function adaptReclassifications(reclassData: unknown, tb: TrialBalanceEntry[] = []): Reclassification[] {
  if (!reclassData || !Array.isArray(reclassData)) return [];
  
  return reclassData.map((r: Record<string, unknown>) => {
    const amounts: Record<string, number> = {};
    const periodAmounts = r.periodAmounts || r.amounts;
    
    if (periodAmounts && typeof periodAmounts === "object") {
      for (const [key, val] of Object.entries(periodAmounts as Record<string, unknown>)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          amounts[key] = numVal;
        }
      }
    }

    // Wizard stores a single `amount` — use it as a flat value for all periods
    if (Object.keys(amounts).length === 0 && r.amount != null) {
      const singleAmt = Number(r.amount);
      if (!isNaN(singleAmt) && singleAmt !== 0) {
        amounts["_flat"] = singleAmt;
      }
    }

    // Resolve the TB entry ONCE using all matching strategies, then reuse
    // it for both per-period distribution and fromAccount resolution.
    // Single source of truth prevents the two lookups from drifting apart.
    let tbEntry: TrialBalanceEntry | undefined;
    if (tb.length > 0) {
      const acctNum = String(r.accountNumber || r.fromAccountNumber || "");
      const acctName = String(r.accountName || r.accountDescription || r.description || "");
      const acctNameTail = acctName.toLowerCase().split(":").pop()?.trim() || "";

      tbEntry = tb.find(e =>
        // 1. Exact accountId match (numeric IDs)
        (acctNum && acctNum.length > 1 && e.accountId === acctNum) ||
        // 2. accountName substring match (full or last segment of hierarchy)
        (acctName && acctName.length > 2 &&
          e.accountName.toLowerCase().includes(acctName.toLowerCase())) ||
        (acctNameTail && acctNameTail.length > 2 &&
          e.accountName.toLowerCase().includes(acctNameTail)) ||
        // 3. accountName startsWith acctNum (when acctNum is a text label like "Landscaping")
        (acctNum && acctNum.length > 1 &&
          e.accountName.toLowerCase().startsWith(acctNum.toLowerCase()))
      );
    }

    // Distribute _flat amount pro-rata across periods using TB balances
    if (amounts["_flat"] && tbEntry && Object.keys(tbEntry.balances).length > 0) {
      const flatAmt = amounts["_flat"];
      delete amounts["_flat"];

      const absBalances: Record<string, number> = {};
      let totalAbs = 0;
      for (const [periodId, balance] of Object.entries(tbEntry.balances)) {
        const abs = Math.abs(balance);
        absBalances[periodId] = abs;
        totalAbs += abs;
      }

      if (totalAbs > 0) {
        for (const [periodId, abs] of Object.entries(absBalances)) {
          amounts[periodId] = flatAmt * (abs / totalAbs);
        }
      } else {
        const count = Object.keys(tbEntry.balances).length;
        for (const periodId of Object.keys(tbEntry.balances)) {
          amounts[periodId] = flatAmt / count;
        }
      }
    }

    // Resolve fromAccount — when AI labels it "Unclassified", use the
    // resolved TB entry's fsLineItem so sumReclassImpact correctly
    // subtracts from the original category (e.g. Revenue).
    let fromAccount = String(r.fromFsLineItem || r.fromAccountNumber || r.fromAccount || "");
    if (fromAccount.toLowerCase().includes("unclassified") && tbEntry?.fsLineItem) {
      fromAccount = tbEntry.fsLineItem;
    }

    return {
      id: String(r.id || ""),
      label: String(r.description || r.label || ""),
      fromAccount,
      toAccount: String(r.toFsLineItem || r.toAccountNumber || r.toAccount || ""),
      amounts,
    };
  });
}

// ============================================
// Addback Mapping Adaptation
// ============================================

function adaptAddbacks(setupData: unknown): AddbackMapping {
  const empty: AddbackMapping = { interest: [], depreciation: [], taxes: [] };
  if (!setupData || typeof setupData !== "object") return empty;
  
  const setup = setupData as Record<string, unknown>;
  
  const toArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    return [];
  };
  
  return {
    interest: toArray(setup.interestAccounts || setup.interest),
    depreciation: toArray(setup.depreciationAccounts || setup.depreciation),
    taxes: toArray(setup.taxAccounts || setup.taxes),
  };
}

// ============================================
// Supplementary Data Adaptation
// ============================================

function adaptAgingData(data: unknown): Record<string, AgingEntry[]> {
  if (!data || typeof data !== "object") return {};
  const result: Record<string, AgingEntry[]> = {};
  const obj = data as Record<string, unknown>;

  // Wizard/QB format: { periodData: [{ periodId, entries }], syncSource }
  if (Array.isArray(obj.periodData)) {
    for (const period of obj.periodData as Record<string, unknown>[]) {
      const periodId = String(period.periodId || "");
      const entries = period.entries;
      if (!periodId || !Array.isArray(entries)) continue;
      result[periodId] = mapAgingEntries(entries);
    }
    return result;
  }

  // Flat dictionary format: { "period-id": [entries] }
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = mapAgingEntries(entries);
  }
  return result;
}

function mapAgingEntries(entries: unknown[]): AgingEntry[] {
  return entries.map((e: Record<string, unknown>) => ({
    name: String(e.name || e.customer || e.vendor || ""),
    current: Number(e.current || 0),
    days1to30: Number(e.days1to30 || e["1-30"] || 0),
    days31to60: Number(e.days31to60 || e["31-60"] || 0),
    days61to90: Number(e.days61to90 || e["61-90"] || 0),
    days90plus: Number(e.days90plus || e["90+"] || 0),
    total: Number(e.total || 0),
  }));
}

function adaptFixedAssets(data: unknown): FixedAssetEntry[] {
  if (!data) return [];
  // Unwrap { assets: [...] } wrapper if present
  const arr = Array.isArray(data) ? data : (Array.isArray((data as Record<string, unknown>).assets) ? (data as Record<string, unknown>).assets as unknown[] : null);
  if (!arr) return [];
  return arr.map((fa: Record<string, unknown>) => ({
    category: String(fa.category || ""),
    description: String(fa.description || fa.name || ""),
    acquisitionDate: String(fa.acquisitionDate || fa.dateAcquired || ""),
    cost: Number(fa.cost || fa.originalCost || 0),
    accumulatedDepreciation: Number(fa.accumulatedDepreciation || fa.accumDepr || 0),
    netBookValue: Number(fa.netBookValue || fa.nbv || 0),
  }));
}

function adaptCustomers(data: unknown): Record<string, CustomerEntry[]> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;

  // Wizard format: { customers: [...], totalRevenue: number }
  if (Array.isArray(obj.customers)) {
    const result: Record<string, CustomerEntry[]> = {};
    for (const c of obj.customers as Record<string, unknown>[]) {
      const name = String(c.name || "");
      const yearlyRevenue = c.yearlyRevenue as Record<string, unknown> | undefined;
      if (yearlyRevenue && typeof yearlyRevenue === "object") {
        for (const [year, val] of Object.entries(yearlyRevenue)) {
          const key = `annual-${year}`;
          if (!result[key]) result[key] = [];
          result[key].push({ name, revenue: Number(val || 0), percentage: 0 });
        }
      }
    }
    return result;
  }

  // Flat dictionary format: { "period-id": [entries] }
  const result: Record<string, CustomerEntry[]> = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = entries.map((e: Record<string, unknown>) => ({
      name: String(e.name || e.customer || ""),
      revenue: Number(e.revenue || e.amount || 0),
      percentage: Number(e.percentage || e.pct || 0),
    }));
  }
  return result;
}

function adaptVendors(data: unknown): Record<string, VendorEntry[]> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;

  // Wizard format: { vendors: [...], totalSpend: number }
  if (Array.isArray(obj.vendors)) {
    const result: Record<string, VendorEntry[]> = {};
    for (const v of obj.vendors as Record<string, unknown>[]) {
      const name = String(v.name || "");
      const yearlySpend = (v.yearlySpend || v.yearlyRevenue) as Record<string, unknown> | undefined;
      if (yearlySpend && typeof yearlySpend === "object") {
        for (const [year, val] of Object.entries(yearlySpend)) {
          const key = `annual-${year}`;
          if (!result[key]) result[key] = [];
          result[key].push({ name, spend: Number(val || 0), percentage: 0 });
        }
      }
    }
    return result;
  }

  // Flat dictionary format
  const result: Record<string, VendorEntry[]> = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = entries.map((e: Record<string, unknown>) => ({
      name: String(e.name || e.vendor || ""),
      spend: Number(e.spend || e.amount || 0),
      percentage: Number(e.percentage || e.pct || 0),
    }));
  }
  return result;
}

// ============================================
// Supplementary Data Adaptation
// ============================================

function adaptSupplementary(data: unknown): { debtSchedule: SupplementaryDebtItem[]; leaseObligations: SupplementaryLeaseItem[] } | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;

  // Shape: { debtSchedule: { items: [...] }, leaseObligations: { items: [...] } }
  const debtRaw = obj.debtSchedule as Record<string, unknown> | undefined;
  const leaseRaw = obj.leaseObligations as Record<string, unknown> | undefined;

  const debtItems: SupplementaryDebtItem[] = [];
  const rawDebtArr = Array.isArray(debtRaw?.items) ? debtRaw!.items : (Array.isArray(debtRaw) ? debtRaw : []);
  for (const d of rawDebtArr as Record<string, unknown>[]) {
    debtItems.push({
      lender: String(d.lender || ""),
      balance: Number(d.balance || d.currentBalance || 0),
      interestRate: Number(d.interestRate || 0),
      maturityDate: String(d.maturityDate || ""),
      type: d.type ? String(d.type) : undefined,
    });
  }

  const leaseItems: SupplementaryLeaseItem[] = [];
  const rawLeaseArr = Array.isArray(leaseRaw?.items) ? leaseRaw!.items : (Array.isArray(leaseRaw) ? leaseRaw : []);
  for (const l of rawLeaseArr as Record<string, unknown>[]) {
    leaseItems.push({
      description: String(l.description || ""),
      leaseType: String(l.leaseType || l.type || "Operating"),
      annualPayment: Number(l.annualPayment || 0),
      remainingTerm: l.remainingTerm !== undefined ? Number(l.remainingTerm) : undefined,
      expirationDate: l.expirationDate ? String(l.expirationDate) : undefined,
    });
  }

  if (debtItems.length === 0 && leaseItems.length === 0) return undefined;
  return { debtSchedule: debtItems, leaseObligations: leaseItems };
}
