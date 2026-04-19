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
  
  // 2. Build accounts from chart of accounts
  const accounts = adaptAccounts(wd.chartOfAccounts);
  
  // 3. Build trial balance entries
  const trialBalance = adaptTrialBalance(wd.trialBalance, accounts);
  
  // 4. Build adjustments
  const ddAdj = wd.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = adaptAdjustments(ddAdj?.adjustments ?? wd.adjustments);
  const reclassData = wd.reclassifications as Record<string, unknown> | undefined;
  const reclassifications = adaptReclassifications(
    (reclassData?.reclasses as unknown) ?? wd.reclassifications
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
  };
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
  accounts: Account[]
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
    
    return {
      accountId,
      accountName: String(acc.accountName || acc.name || ""),
      fsType: (enrichment?.fsType || acc.fsType || "BS") as "BS" | "IS",
      fsLineItem: String(enrichment?.fsLineItem || acc.fsLineItem || acc.category || ""),
      subAccount1: String(enrichment?.subAccount1 || acc.subAccount1 || ""),
      subAccount2: String(enrichment?.subAccount2 || acc.subAccount2 || ""),
      subAccount3: String(enrichment?.subAccount3 || acc.subAccount3 || ""),
      balances,
    };
  });
}

// ============================================
// Adjustment Adaptation
// ============================================

function adaptAdjustments(adjData: unknown): Adjustment[] {
  if (!adjData || !Array.isArray(adjData)) return [];
  
  return adjData.map((adj: Record<string, unknown>) => {
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

function adaptReclassifications(reclassData: unknown): Reclassification[] {
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
    
    return {
      id: String(r.id || ""),
      label: String(r.description || r.label || ""),
      fromAccount: String(r.fromAccountNumber || r.fromAccount || ""),
      toAccount: String(r.toAccountNumber || r.toAccount || ""),
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
