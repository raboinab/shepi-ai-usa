/**
 * Server-side QoE adapter: transforms project.wizard_data + project fields
 * into the DealData interface consumed by the shared workbook calculations.
 *
 * Mirrors src/lib/projectToDealAdapter.ts — keep in sync for the fields used
 * by QoE widgets. Only the minimal surface needed by qoeMetrics.ts is included.
 */
import type {
  DealData, Account, TrialBalanceEntry, Adjustment,
  Reclassification, PeriodDef, AgingEntry, FixedAssetEntry,
  CustomerEntry, VendorEntry, FiscalYear,
  SupplementaryDebtItem, SupplementaryLeaseItem,
} from "../workbook/workbook-types.ts";
import {
  buildTbIndex, groupByFiscalYear, buildAggregatePeriods,
  type AddbackMapping,
} from "../workbook/calculations.ts";
import { computeSign, type LedgerIntent } from "../workbook/qoeAdjustmentTaxonomy.ts";

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
  firm_name?: string | null;
  prepared_by_line?: string | null;
  firm_logo_path?: string | null;
}

export interface Period {
  id: string;
  label: string;
  year: number;
  month: number;
  isStub?: boolean;
  startDate?: string;
  endDate?: string;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function projectToDealData(project: ProjectRecord): DealData {
  const wd = project.wizard_data || {};

  const periods = adaptPeriods(project.periods || []);
  const fiscalYearEnd = parseFiscalYearEnd(project.fiscal_year_end);
  const nonStubPeriods = periods.filter((p) => !p.isStub);
  const fiscalYears = groupByFiscalYear(nonStubPeriods, fiscalYearEnd);
  const aggregatePeriods = buildAggregatePeriods(periods, fiscalYears, fiscalYearEnd);

  let priorPeriodId: string | undefined;
  if (periods.length > 0) {
    const first = periods[0];
    const priorMonth = first.month === 1 ? 12 : first.month - 1;
    const priorYear = first.month === 1 ? first.year - 1 : first.year;
    priorPeriodId = `${priorYear}-${String(priorMonth).padStart(2, "0")}`;
  }

  const accounts = adaptAccounts(wd.chartOfAccounts);
  const trialBalance = adaptTrialBalance(
    wd.trialBalance,
    accounts,
    periods.map((p) => p.id),
    fiscalYearEnd,
  );

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
    if (entry.fsLineItem === "Equity") continue;
    const nameMatch = EQUITY_NAME_PATTERNS.some((pat) => pat.test(entry.accountName));
    if (nameMatch) {
      entry.fsType = "BS";
      entry.fsLineItem = "Equity";
    }
  }
  const accountMap = new Map(accounts.map((a) => [a.accountId, a]));
  for (const entry of trialBalance) {
    if (entry.fsLineItem === "Equity") {
      const acct = accountMap.get(entry.accountId);
      if (acct && acct.fsLineItem !== "Equity") {
        acct.fsType = "BS";
        acct.fsLineItem = "Equity";
      }
    }
  }

  const ddAdj = wd.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = adaptAdjustments(ddAdj?.adjustments ?? wd.adjustments);
  const reclassData = wd.reclassifications as Record<string, unknown> | undefined;
  const reclassifications = adaptReclassifications(
    (reclassData?.reclassifications as unknown) ?? wd.reclassifications,
    trialBalance,
  );
  const addbacks = adaptAddbacks(wd.dealSetup || wd.ebitdaAddbacks);

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

  const tbIndex = buildTbIndex(trialBalance);
  const monthDates = buildMonthDates(periods);
  const arAging = adaptAgingData(wd.arAging);
  const apAging = adaptAgingData(wd.apAging);
  const fixedAssets = adaptFixedAssets(wd.fixedAssets);
  const topCustomers = adaptCustomers(wd.topCustomers);
  const topVendors = adaptVendors(wd.topVendors);
  const supplementary = adaptSupplementary(wd.supplementary);
  const dd = wd.dueDiligence as Record<string, unknown> | undefined;
  const wipAccountMapping = dd?.wipAccountMapping as DealData["wipAccountMapping"] | undefined;
  const dp = wd.dealParameters as Record<string, unknown> | undefined;
  const nwcConfig = {
    method: (dp?.nwcMethod as DealData["deal"]["nwcConfig"]["method"]) || "operating",
    transactionInclusions: dp?.transactionInclusions as DealData["deal"]["nwcConfig"]["transactionInclusions"],
    normalizationAdjustments: dp?.normalizationAdjustments as DealData["deal"]["nwcConfig"]["normalizationAdjustments"],
  };

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
      firmName: project.firm_name || undefined,
      preparedByLine: project.prepared_by_line || undefined,
      firmLogoUrl: project.firm_logo_path || undefined,
      nwcConfig,
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

function adaptPeriods(periods: Period[]): PeriodDef[] {
  return periods.map((p) => {
    const shortLabel = p.isStub
      ? p.label || `Stub ${SHORT_MONTHS[p.month - 1]}-${String(p.year).slice(-2)}`
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
  return periods.map((p) => p.date).sort((a, b) => a.getTime() - b.getTime());
}

function adaptAccounts(coa: unknown): Account[] {
  if (!coa) return [];
  const arr = Array.isArray(coa)
    ? coa
    : Array.isArray((coa as Record<string, unknown>)?.accounts)
      ? ((coa as Record<string, unknown>).accounts as unknown[])
      : null;
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

function adaptTrialBalance(
  tbData: unknown,
  accounts: Account[],
  sortedPeriodIds: string[],
  fiscalYearEnd: number,
): TrialBalanceEntry[] {
  if (!tbData || typeof tbData !== "object") return [];

  const tb = tbData as Record<string, unknown>;
  const tbAccounts = tb.accounts as Record<string, unknown>[] | undefined;
  if (!Array.isArray(tbAccounts)) return [];

  const accountMap = new Map(accounts.map((a) => [a.accountId, a]));

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
    if (fsType === "IS" && sortedPeriodIds.length > 0) {
      const orderedIds = sortedPeriodIds.filter((id) => id in balances);
      for (let i = orderedIds.length - 1; i > 0; i--) {
        const curMonth = parsePeriodMonth(orderedIds[i]);
        const prevMonth = parsePeriodMonth(orderedIds[i - 1]);
        const fyStartMonth = (fiscalYearEnd % 12) + 1;
        const curYear = parsePeriodYear(orderedIds[i]);
        const prevYear = parsePeriodYear(orderedIds[i - 1]);
        if (
          curYear !== undefined &&
          prevYear !== undefined &&
          curMonth !== undefined &&
          prevMonth !== undefined
        ) {
          const curFY = getFiscalYear(curYear, curMonth, fyStartMonth);
          const prevFY = getFiscalYear(prevYear, prevMonth, fyStartMonth);
          if (curFY !== prevFY) continue;
        }
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

function parsePeriodYear(periodId: string): number | undefined {
  const match4 = periodId.match(/(\d{4})-\d{2}/);
  if (match4) return parseInt(match4[1], 10);
  const match2 = periodId.match(/[a-zA-Z]+-(\d{2})/);
  if (match2) return 2000 + parseInt(match2[1], 10);
  return undefined;
}

function getFiscalYear(year: number, month: number, fyStartMonth: number): number {
  return month >= fyStartMonth ? year : year - 1;
}

function parsePeriodMonth(periodId: string): number | undefined {
  const match = periodId.match(/(\d{4})-(\d{2})/);
  if (match) return parseInt(match[2], 10);
  const lower = periodId.toLowerCase();
  for (let i = 0; i < SHORT_MONTHS.length; i++) {
    if (lower.startsWith(SHORT_MONTHS[i].toLowerCase())) return i + 1;
  }
  return undefined;
}

function adaptAdjustments(adjData: unknown): Adjustment[] {
  if (!adjData || !Array.isArray(adjData)) return [];

  const ACCEPTED_STATUSES = new Set(["accepted", "accepted_with_edits"]);
  const accepted = (adjData as Record<string, unknown>[]).filter((adj) => {
    const status = adj.status as string | undefined;
    return !status || ACCEPTED_STATUSES.has(status);
  });

  return accepted.map((adj) => {
    const amounts: Record<string, number> = {};
    const periodAmounts = adj.periodValues || adj.periodAmounts || adj.amounts;
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

    const rawEffect = adj.effectType as string | undefined;
    const effectType =
      rawEffect === "NonQoE" || rawEffect === "PresentationOnly" || rawEffect === "EBITDA"
        ? rawEffect
        : "EBITDA";

    return {
      id: String(adj.id || ""),
      type: (adj.block || adj.type || adj.adjustmentType || "DD") as "MA" | "DD" | "PF",
      label: String(adj.description || adj.label || adj.name || ""),
      tbAccountNumber: String(adj.linkedAccountNumber || adj.tbAccountNumber || adj.accountNumber || ""),
      intent: String(adj.intent || "other"),
      notes: String(adj.evidenceNotes || adj.notes || ""),
      amounts,
      effectType,
    };
  });
}

function adaptReclassifications(reclassData: unknown, tb: TrialBalanceEntry[] = []): Reclassification[] {
  if (!reclassData || !Array.isArray(reclassData)) return [];

  return (reclassData as Record<string, unknown>[]).map((r) => {
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
    if (Object.keys(amounts).length === 0 && r.amount != null) {
      const singleAmt = Number(r.amount);
      if (!isNaN(singleAmt) && singleAmt !== 0) {
        amounts["_flat"] = singleAmt;
      }
    }

    let tbEntry: TrialBalanceEntry | undefined;
    if (tb.length > 0) {
      const acctNum = String(r.accountNumber || r.fromAccountNumber || "");
      const acctName = String(r.accountName || r.accountDescription || r.description || "");
      const acctNameTail = acctName.toLowerCase().split(":").pop()?.trim() || "";
      tbEntry = tb.find(
        (e) =>
          (acctNum && acctNum.length > 1 && e.accountId === acctNum) ||
          (acctName && acctName.length > 2 && e.accountName.toLowerCase().includes(acctName.toLowerCase())) ||
          (acctNameTail && acctNameTail.length > 2 && e.accountName.toLowerCase().includes(acctNameTail)) ||
          (acctNum && acctNum.length > 1 && e.accountName.toLowerCase().startsWith(acctNum.toLowerCase())),
      );
    }

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

function adaptAgingData(data: unknown): Record<string, AgingEntry[]> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  const result: Record<string, AgingEntry[]> = {};

  if (Array.isArray(obj.periodData)) {
    for (const period of obj.periodData as Record<string, unknown>[]) {
      const periodId = String(period.periodId || "");
      const entries = period.entries;
      if (!periodId || !Array.isArray(entries)) continue;
      result[periodId] = mapAgingEntries(entries);
    }
    return result;
  }

  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = mapAgingEntries(entries);
  }
  return result;
}

function mapAgingEntries(entries: unknown[]): AgingEntry[] {
  return (entries as Record<string, unknown>[]).map((e) => ({
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
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>).assets)
      ? ((data as Record<string, unknown>).assets as unknown[])
      : null;
  if (!arr) return [];
  return (arr as Record<string, unknown>[]).map((fa) => ({
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

  const result: Record<string, CustomerEntry[]> = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = (entries as Record<string, unknown>[]).map((e) => ({
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

  const result: Record<string, VendorEntry[]> = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = (entries as Record<string, unknown>[]).map((e) => ({
      name: String(e.name || e.vendor || ""),
      spend: Number(e.spend || e.amount || 0),
      percentage: Number(e.percentage || e.pct || 0),
    }));
  }
  return result;
}

function adaptSupplementary(data: unknown): { debtSchedule: SupplementaryDebtItem[]; leaseObligations: SupplementaryLeaseItem[] } | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;

  const debtRaw = obj.debtSchedule as Record<string, unknown> | undefined;
  const leaseRaw = obj.leaseObligations as Record<string, unknown> | undefined;

  const debtItems: SupplementaryDebtItem[] = [];
  const rawDebtArr = Array.isArray(debtRaw?.items)
    ? debtRaw!.items
    : Array.isArray(debtRaw)
      ? debtRaw
      : [];
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
  const rawLeaseArr = Array.isArray(leaseRaw?.items)
    ? leaseRaw!.items
    : Array.isArray(leaseRaw)
      ? leaseRaw
      : [];
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
