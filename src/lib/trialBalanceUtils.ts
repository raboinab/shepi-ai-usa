import { Period } from "./periodUtils";
import { inferFsType, extractLeadingAccountNumber } from "./inferFsType";


export type FSType = 'BS' | 'IS';
export type AccountCategory = 
  | 'Bank' | 'Accounts receivable' | 'Other Current Asset' | 'Fixed Asset' 
  | 'Other Asset' | 'Accounts Payable' | 'Credit Card' | 'Other Current Liability'
  | 'Long Term Liability' | 'Equity' | 'Income' | 'Cost of Goods Sold' | 'Expense'
  | 'Other Income' | 'Other Expense';

export interface TrialBalanceAccount {
  id: string;
  fsType: FSType;
  accountNumber: string;
  accountName: string;
  accountType: AccountCategory | string;
  accountSubtype: string;
  fsLineItem?: string; // Standardized FS classification
  subAccount1?: string; // Sub-account hierarchy level 1
  subAccount2?: string; // Sub-account hierarchy level 2
  qbAccountId?: string; // QuickBooks internal account Id (primary discriminator)
  fullyQualifiedName?: string; // QB FQN ("Parent:Child") — disambiguates leaf-name collisions
  monthlyValues: Record<string, number>; // periodId -> value
}


export interface TrialBalanceSummary {
  bsTotal: number;
  isTotal: number;
  cniTotal: number;
  checkTotal: number;
}

export function createEmptyAccount(): TrialBalanceAccount {
  return {
    id: crypto.randomUUID(),
    fsType: 'BS',
    accountNumber: '',
    accountName: '',
    accountType: '',
    accountSubtype: '',
    monthlyValues: {},
  };
}

/**
 * Convert IS account values from cumulative YTD (QuickBooks Trial Balance
 * convention) to monthly activity. BS accounts are passed through unchanged
 * (ending balances are correct as-is). Returns new account objects; inputs
 * are not mutated.
 *
 * Mirrors the conversion in projectToDealAdapter.ts so the wizard's TB view
 * matches the workbook's TB tab. Pass already-monthly data through this and
 * IS rows will be unaffected as long as no two consecutive months of the
 * same FY are both populated with cumulative-style values.
 */
export function convertIsYtdToMonthly(
  accounts: TrialBalanceAccount[],
  periods: Period[],
  fiscalYearEnd: number
): TrialBalanceAccount[] {
  const sortedPeriodIds = [...periods]
    .filter(p => !p.isStub)
    .sort((a, b) => {
      const ay = a.year ?? 0, by = b.year ?? 0;
      if (ay !== by) return ay - by;
      return (a.month ?? 0) - (b.month ?? 0);
    })
    .map(p => p.id);
  if (sortedPeriodIds.length === 0) return accounts;

  const fyStartMonth = (fiscalYearEnd % 12) + 1;
  const fyOf = (year: number, month: number) =>
    month >= fyStartMonth ? year : year - 1;
  const periodMeta = new Map<string, { year: number; month: number }>();
  for (const p of periods) {
    if (p.year != null && p.month != null) {
      periodMeta.set(p.id, { year: p.year, month: p.month });
    }
  }

  return accounts.map(acc => {
    if (acc.fsType !== 'IS') return acc;
    const monthly: Record<string, number> = { ...acc.monthlyValues };
    const orderedIds = sortedPeriodIds.filter(id => id in monthly);
    for (let i = orderedIds.length - 1; i > 0; i--) {
      const cur = periodMeta.get(orderedIds[i]);
      const prev = periodMeta.get(orderedIds[i - 1]);
      if (!cur || !prev) continue;
      if (fyOf(cur.year, cur.month) !== fyOf(prev.year, prev.month)) continue;
      monthly[orderedIds[i]] =
        (monthly[orderedIds[i]] || 0) - (monthly[orderedIds[i - 1]] || 0);
    }
    return { ...acc, monthlyValues: monthly };
  });
}

/** Inverse of {@link convertIsYtdToMonthly}: re-accumulates IS monthly
 *  activity into cumulative YTD within each fiscal year. BS untouched. */
export function convertIsMonthlyToYtd(
  accounts: TrialBalanceAccount[],
  periods: Period[],
  fiscalYearEnd: number
): TrialBalanceAccount[] {
  const sortedPeriodIds = [...periods]
    .filter(p => !p.isStub)
    .sort((a, b) => {
      const ay = a.year ?? 0, by = b.year ?? 0;
      if (ay !== by) return ay - by;
      return (a.month ?? 0) - (b.month ?? 0);
    })
    .map(p => p.id);
  if (sortedPeriodIds.length === 0) return accounts;

  const fyStartMonth = (fiscalYearEnd % 12) + 1;
  const fyOf = (year: number, month: number) =>
    month >= fyStartMonth ? year : year - 1;
  const periodMeta = new Map<string, { year: number; month: number }>();
  for (const p of periods) {
    if (p.year != null && p.month != null) {
      periodMeta.set(p.id, { year: p.year, month: p.month });
    }
  }

  return accounts.map(acc => {
    if (acc.fsType !== 'IS') return acc;
    const ytd: Record<string, number> = { ...acc.monthlyValues };
    const orderedIds = sortedPeriodIds.filter(id => id in ytd);
    for (let i = 1; i < orderedIds.length; i++) {
      const cur = periodMeta.get(orderedIds[i]);
      const prev = periodMeta.get(orderedIds[i - 1]);
      if (!cur || !prev) continue;
      if (fyOf(cur.year, cur.month) !== fyOf(prev.year, prev.month)) continue;
      ytd[orderedIds[i]] = (ytd[orderedIds[i]] || 0) + (ytd[orderedIds[i - 1]] || 0);
    }
    return { ...acc, monthlyValues: ytd };
  });
}

export function calculateFYTotal(
  account: TrialBalanceAccount,
  periods: Period[],
  fiscalYearEnd: number // month 1-12
): number {
  // Get periods for the most recent complete fiscal year
  const regularPeriods = periods.filter(p => !p.isStub);
  if (regularPeriods.length === 0) return 0;

  // For BS accounts, return the ending balance (last period of FY)
  // For IS accounts, sum all months in the FY
  if (account.fsType === 'BS') {
    // Find the last fiscal year end period
    const fyEndPeriods = regularPeriods.filter(p => p.month === fiscalYearEnd);
    if (fyEndPeriods.length > 0) {
      const lastFYEnd = fyEndPeriods[fyEndPeriods.length - 1];
      return account.monthlyValues[lastFYEnd.id] || 0;
    }
    return 0;
  } else {
    // IS: sum all periods in the last complete FY
    let total = 0;
    const fyEndPeriods = regularPeriods.filter(p => p.month === fiscalYearEnd);
    if (fyEndPeriods.length === 0) return 0;
    
    const lastFYEnd = fyEndPeriods[fyEndPeriods.length - 1];
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? lastFYEnd.year : lastFYEnd.year - 1;
    
    regularPeriods.forEach(p => {
      const isInFY = (p.year === fyStartYear && p.month >= fyStartMonth) ||
                     (p.year === lastFYEnd.year && p.month <= fiscalYearEnd);
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}

export function calculateLTM(
  account: TrialBalanceAccount,
  periods: Period[]
): number {
  // Last 12 months from the most recent period (includes stubs for complete trailing view)
  if (periods.length === 0) return 0;

  const last12 = periods.slice(-12);
  
  if (account.fsType === 'BS') {
    // Return ending balance of last period
    const lastPeriod = last12[last12.length - 1];
    return account.monthlyValues[lastPeriod.id] || 0;
  } else {
    // Sum last 12 months
    return last12.reduce((sum, p) => sum + (account.monthlyValues[p.id] || 0), 0);
  }
}

export function calculateYTD(
  account: TrialBalanceAccount,
  periods: Period[],
  fiscalYearEnd: number
): number {
  // Include stubs for complete YTD trailing view
  if (periods.length === 0) return 0;

  const lastPeriod = periods[periods.length - 1];
  const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
  const fyStartYear = fiscalYearEnd === 12 ? lastPeriod.year : 
    (lastPeriod.month > fiscalYearEnd ? lastPeriod.year : lastPeriod.year - 1);

  if (account.fsType === 'BS') {
    return account.monthlyValues[lastPeriod.id] || 0;
  } else {
    let total = 0;
    periods.forEach(p => {
      const isInCurrentFY = (p.year === fyStartYear && p.month >= fyStartMonth) ||
                            (p.year > fyStartYear);
      if (isInCurrentFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}

export function calculateBalanceCheck(
  accounts: TrialBalanceAccount[],
  periodId: string
): TrialBalanceSummary {
  let bsTotal = 0;
  let isTotal = 0;

  accounts.forEach(account => {
    const value = account.monthlyValues[periodId] || 0;
    if (account.fsType === 'BS') {
      bsTotal += value;
    } else {
      isTotal += value;
    }
  });

  // CNI = Cumulative Net Income (negative of IS for balance sheet presentation)
  const cniTotal = -isTotal;
  // Check should be BS + IS = 0 when balanced (debits equal credits)
  const checkTotal = bsTotal + isTotal;

  return { bsTotal, isTotal, cniTotal, checkTotal };
}

export function formatCurrency(value: number): string {
  if (value === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}


export const ACCOUNT_TYPES: { fsType: FSType; types: string[] }[] = [
  { fsType: 'BS', types: ['Bank', 'Accounts receivable', 'Other Current Asset', 'Fixed Asset', 'Other Asset'] },
  { fsType: 'BS', types: ['Accounts Payable', 'Credit Card', 'Other Current Liability', 'Long Term Liability', 'Equity'] },
  { fsType: 'IS', types: ['Income', 'Cost of Goods Sold', 'Expense', 'Other Income', 'Other Expense'] },
];

export function getFSTypeForAccountType(accountType: string): FSType {
  for (const group of ACCOUNT_TYPES) {
    if (group.types.includes(accountType)) {
      return group.fsType;
    }
  }
  return 'BS';
}

// QB Trial Balance row from qbToJson (normalized format)
// Extended to include Java-enriched fields
interface QbTrialBalanceRow {
  accountNumber?: string;
  accountName?: string;
  accountType?: string;
  subAccountType?: string;
  qbAccountId?: string; // QuickBooks internal Id from colData[0].id
  fullyQualifiedName?: string; // QB FQN — disambiguates leaf-name collisions
  debit?: number;
  credit?: number;
  balance?: number;
  // Java-enriched fields (from backend COA-first enrichment)
  fsType?: 'BS' | 'IS';
  fsLineItem?: string;
  accountSubtype?: string;
  // NEW: subAccount hierarchy fields
  subAccount1?: string;
  subAccount2?: string;
  subAccount3?: string;
  _matchedFromCOA?: boolean;
}


// Raw QB API format with colData arrays
interface QbRawColData {
  value: string;
  id?: string;
}

interface QbRawRow {
  colData?: QbRawColData[];
}

interface QbRawReport {
  header?: { endPeriod?: string };
  rows?: { row?: QbRawRow[] };
}

interface QbMonthlyReport {
  reportDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  rows?: QbTrialBalanceRow[];
  report?: QbRawReport;
}

/** Convert month abbreviation + year to ISO end-of-month date, e.g. ("JAN","2024") → "2024-01-31" */
function deriveEndDateFromMonthYear(month: string, year: string): string | null {
  const map: Record<string, number> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  };
  const m = map[month.toUpperCase()];
  const y = parseInt(year, 10);
  if (!m || isNaN(y)) return null;
  // Last day of the month: day 0 of next month
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

interface QbTrialBalanceResponse {
  monthlyReports?: QbMonthlyReport[];
  rows?: QbTrialBalanceRow[];
  reportDate?: string;
}

// Parse raw QB colData format into normalized row
function parseColDataRow(rawRow: QbRawRow): QbTrialBalanceRow | null {
  const colData = rawRow.colData;
  if (!colData || colData.length < 3) return null;

  const rawName = colData[0]?.value || '';
  const rawId = colData[0]?.id ? String(colData[0].id) : '';
  const debitStr = colData[1]?.value || '0';
  const creditStr = colData[2]?.value || '0';

  // Skip empty rows or header rows
  if (!rawName || rawName === 'Account' || rawName === 'Total') return null;

  // Many QB TB exports collapse "acctNum name" into colData[0].value
  // (e.g. "1005 Cash", "4000 RETAIL:z_Shopify Sales"). Split them apart so
  // downstream COA matching by accountNumber and clean leaf-name lookups work.
  const leadingNum = extractLeadingAccountNumber(rawName);
  const cleanedName = leadingNum
    ? rawName.replace(/^\d{4,5}\s*[-:]?\s*/, '').trim() || rawName
    : rawName;

  // Sub-account rows arrive as "<parentAcctNum> Parent:Child" (QB prefixes
  // the *parent's* acctNum on the FQN). If we keep that number as the row's
  // accountNumber, the CoA match by-number collides with the parent account
  // and every sub-account collapses into its parent (Vampire Freaks bug:
  // "4000 RETAIL:z_Shopify Sales" merged into "RETAIL"). Only trust the
  // leading number when the cleaned name has no ":" — i.e. it's a true leaf.
  const isSubAccount = cleanedName.includes(':');
  const accountNumber = isSubAccount ? '' : (leadingNum || '');
  const accountName = cleanedName;
  const fullyQualifiedName = isSubAccount ? cleanedName : undefined;

  // colData[0].id in the qbToJson TB feed is a row-sequence (3, 4, 5...),
  // NOT the QB entity Id used in the CoA (200, 205, ...). Treating it as
  // qbAccountId poisons the CoA match, so only keep it when it looks like a
  // real QB entity Id (>= 4 digits, matching QB's numbering).
  const qbAccountId = rawId && /^\d{4,}$/.test(rawId) ? rawId : '';

  const debit = parseFloat(debitStr.replace(/[^0-9.-]/g, '')) || 0;
  const credit = parseFloat(creditStr.replace(/[^0-9.-]/g, '')) || 0;

  return {
    accountNumber,
    accountName,
    fullyQualifiedName,
    qbAccountId,
    debit,
    credit,
    balance: debit - credit,
  };
}


// Transform qbToJson trial balance data to TrialBalanceAccount[]
export function transformQbTrialBalanceData(
  qbData: QbTrialBalanceResponse,
  periods: Period[]
): TrialBalanceAccount[] {
  const accountMap = new Map<string, TrialBalanceAccount>();
  
  // Handle single report format
  if (qbData.reportDate) {
    const period = findPeriodByDate(qbData.reportDate, periods);
    if (period) {
      // Check for normalized array format first (from document uploads via qbToJson)
      if (qbData.rows && Array.isArray(qbData.rows)) {
        processRows(qbData.rows, period.id, accountMap);
      }
      // Handle raw QB colData format: { rows: { row: [...] } }
      else if (qbData.rows && typeof qbData.rows === 'object' && !Array.isArray(qbData.rows)) {
        const rowsObj = qbData.rows as unknown as { row?: QbRawRow[] };
        if (rowsObj.row && Array.isArray(rowsObj.row)) {
          const normalizedRows = rowsObj.row
            .map(parseColDataRow)
            .filter((row): row is QbTrialBalanceRow => row !== null);
          processRows(normalizedRows, period.id, accountMap);
        }
      }
    }
  }
  
  // Handle monthly reports array format
  if (qbData.monthlyReports && Array.isArray(qbData.monthlyReports)) {
    for (const monthlyReport of qbData.monthlyReports) {
      // Try normalized format first (reportDate), then raw QB format (endDate, header.endPeriod)
      let reportDate = monthlyReport.reportDate || 
                       monthlyReport.endDate || 
                       monthlyReport.report?.header?.endPeriod;
      
      // Derive from month+year if standard date fields missing (e.g. "JAN" + "2024")
      if (!reportDate && monthlyReport.month && monthlyReport.year) {
        reportDate = deriveEndDateFromMonthYear(monthlyReport.month, monthlyReport.year);
      }
      
      if (!reportDate) continue;
      
      const period = findPeriodByDate(reportDate, periods);
      if (!period) continue;
      
      // Handle normalized rows format
      if (monthlyReport.rows && Array.isArray(monthlyReport.rows)) {
        processRows(monthlyReport.rows, period.id, accountMap);
      }
      // Handle raw QB colData format (report.rows.row)
      else if (monthlyReport.report?.rows?.row && Array.isArray(monthlyReport.report.rows.row)) {
        const rawRows = monthlyReport.report.rows.row;
        const normalizedRows = rawRows
          .map(parseColDataRow)
          .filter((row): row is QbTrialBalanceRow => row !== null);
        processRows(normalizedRows, period.id, accountMap);
      }
    }
  }
  
  return Array.from(accountMap.values());
}

function findPeriodByDate(dateStr: string, periods: Period[]): Period | undefined {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // First try exact year+month match on regular periods
  const exactMatch = periods.find(p => p.year === year && p.month === month);
  if (exactMatch) return exactMatch;
  
  // Fallback: check if date falls within any stub period's date range
  for (const p of periods) {
    if (p.isStub && p.startDate && p.endDate) {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (date >= start && date <= end) return p;
    }
  }
  
  return undefined;
}

function processRows(
  rows: QbTrialBalanceRow[],
  periodId: string,
  accountMap: Map<string, TrialBalanceAccount>
): void {
  for (const row of rows) {
    // Bucket key priority (mirrors supabase/functions/_shared/tbAggregation.ts):
    //   1. qbAccountId             — true unique discriminator
    //   2. fullyQualifiedName      — Parent:Child path
    //   3. composite               — accountNumber + name + type + subtype
    // NOTE: accountNumber alone is NOT unique — QB reuses the parent's number
    // on every sub-account (e.g. 90050 covers Job Materials + 5 children +
    // Equipment Rental). Bare leaf-name bucketing is also forbidden (it merged
    // Unapplied Cash A/R vs A/P, Job Materials Income vs Expense, etc.).
    const _num = row.accountNumber || '';
    const _nm = (row.accountName || '').toLowerCase();
    const _ty = (row.accountType || '').toLowerCase();
    const _sub = (row.accountSubtype || row.subAccountType || '').toLowerCase();
    const accountKey =
      (row.qbAccountId && `id:${row.qbAccountId}`) ||
      (row.fullyQualifiedName && `fqn:${row.fullyQualifiedName.toLowerCase()}`) ||
      ((_nm || _num) && `c:${_num}|${_nm}|${_ty}|${_sub}`) ||
      '';
    if (!accountKey) continue;

    
    let account = accountMap.get(accountKey);
    if (!account) {
      const accountType = row.accountType || '';
      const accountSubtype = row.accountSubtype || row.subAccountType || '';
      
      const inferredFsType = inferFsType({
        fsType: row.fsType,
        accountType,
        classification: (row as any).classification,
        accountSubtype,
        accountName: row.accountName,
        accountNumber: row.accountNumber,
        fullyQualifiedName: row.fullyQualifiedName,
      });
      account = {
        id: crypto.randomUUID(),
        // Backend-provided fsType wins; otherwise infer from name/number/type
        // hints instead of blanket-defaulting to BS (which broke P&L validation).
        fsType: inferredFsType || 'IS',
        accountNumber: row.accountNumber || '',
        accountName: row.accountName || '',
        accountType: accountType,
        accountSubtype: accountSubtype,
        // Use backend-provided fsLineItem only - empty = bug visible
        fsLineItem: row.fsLineItem || '',
        qbAccountId: row.qbAccountId || undefined,
        fullyQualifiedName: row.fullyQualifiedName || undefined,
        monthlyValues: {},
        // Preserve match flag if present
        ...(row._matchedFromCOA !== undefined && { _matchedFromCOA: row._matchedFromCOA }),
      } as TrialBalanceAccount;

      accountMap.set(accountKey, account);
    }

    
    // Calculate value: prefer explicit balance, then debit-credit, then colData extraction
    let value = row.balance;
    if (value === undefined) {
      if (row.debit !== undefined || row.credit !== undefined) {
        value = (row.debit || 0) - (row.credit || 0);
      } else if ((row as any).colData && Array.isArray((row as any).colData) && (row as any).colData.length >= 2) {
        // Handle raw QB format with separate Debit/Credit columns
        const colData = (row as any).colData;
        const debit = parseFloat(colData[1]?.value || "0") || 0;
        const credit = parseFloat(colData[2]?.value || "0") || 0;
        value = debit - credit;
      } else {
        value = 0;
      }
    }
    account.monthlyValues[periodId] = value;
  }
}

// Merge accounts from multiple sources by account key
export function mergeAccounts(
  existing: TrialBalanceAccount[],
  incoming: TrialBalanceAccount[]
): TrialBalanceAccount[] {
  const accountMap = new Map<string, TrialBalanceAccount>();
  
  // Same priority as processRows. accountNumber is NOT unique (QB reuses the
  // parent's number on sub-accounts), so it's only used as part of a composite.
  const keyOf = (a: TrialBalanceAccount) => {
    const num = a.accountNumber || '';
    const nm = (a.accountName || '').toLowerCase();
    const ty = (a.accountType || '').toLowerCase();
    const sub = (a.accountSubtype || '').toLowerCase();
    return (
      (a.qbAccountId && `id:${a.qbAccountId}`) ||
      (a.fullyQualifiedName && `fqn:${a.fullyQualifiedName.toLowerCase()}`) ||
      ((nm || num) && `c:${num}|${nm}|${ty}|${sub}`) ||
      ''
    );
  };


  
  // Add existing accounts to map
  for (const account of existing) {
    const key = keyOf(account);
    if (key) {
      accountMap.set(key, { ...account, monthlyValues: { ...account.monthlyValues } });
    }
  }
  
  // Merge incoming accounts
  for (const account of incoming) {
    const key = keyOf(account);
    if (!key) continue;
    
    const existingAccount = accountMap.get(key);
    
    if (existingAccount) {
      // Merge monthly values (incoming overwrites existing for same period)
      existingAccount.monthlyValues = {
        ...existingAccount.monthlyValues,
        ...account.monthlyValues,
      };
    } else {
      accountMap.set(key, { ...account, monthlyValues: { ...account.monthlyValues } });
    }
  }
  
  return Array.from(accountMap.values());
}

// ============= COA Cross-Reference Utilities =============

import { CoaAccount } from "./chartOfAccountsUtils";

export interface CrossReferenceStats {
  matched: number;
  unmatched: number;
}

// Valid FS Line Items (granular values from 154-row mapping)
// Used to filter out generic Java-provided values like "Assets" or "Liabilities"
const VALID_FS_LINE_ITEMS = new Set([
  "Cash and cash equivalents",
  "Accounts receivable",
  "Other current assets",
  "Fixed assets",
  "Other assets",
  "Current liabilities",
  "Other current liabilities",
  "Long term liabilities",
  "Equity",
  "Sales",
  "Revenue",
  "Cost of Goods Sold",
  "Operating expenses",
  "Other expense (income)",
]);

// Normalize QuickBooks classification to readable display label for fsLineItem
// Returns undefined for generic categories (ASSET, LIABILITY) to allow fallback to mapping
function normalizeClassification(classification: string): string | undefined {
  if (!classification) return undefined;
  
  const classMap: Record<string, string | undefined> = {
    "REVENUE": "Revenue",        // Prefer "Revenue" terminology (per user's QB setup)
    "INCOME": "Revenue",         // Map INCOME to Revenue terminology
    "EXPENSE": "Operating expenses",
    "ASSET": undefined,          // Don't use generic "Assets" - fallback to 154-row mapping
    "LIABILITY": undefined,      // Don't use generic "Liabilities" - fallback to mapping
    "EQUITY": "Equity",
    "OTHER_INCOME": "Other expense (income)",
    "OTHERINCOME": "Other expense (income)",
    "OTHER_EXPENSE": "Other expense (income)",
    "OTHEREXPENSE": "Other expense (income)",
    "COST_OF_GOODS_SOLD": "Cost of Goods Sold",
    "COSTOFGOODSSOLD": "Cost of Goods Sold",
    "COGS": "Cost of Goods Sold",
  };
  
  const key = classification.toUpperCase();
  return key in classMap ? classMap[key] : undefined;
}

// Cross-reference TB accounts with COA data to auto-populate classifications
export function crossReferenceWithCOA(
  tbAccounts: TrialBalanceAccount[],
  coaAccounts: CoaAccount[]
): { accounts: TrialBalanceAccount[]; matchStats: CrossReferenceStats } {
  // Build lookup maps. Priority for matching: QB account Id → real account
  // number → leaf name (with ambiguity handling).
  const coaByQbId = new Map<string, CoaAccount>();
  const coaByNumber = new Map<string, CoaAccount>();
  const coaByFqn = new Map<string, CoaAccount>();
  const coaByName = new Map<string, CoaAccount>();         // unique leaf names only
  const coaByNameAll = new Map<string, CoaAccount[]>();    // includes ambiguous leaves

  coaAccounts.forEach(coa => {
    if (coa.accountId) coaByQbId.set(String(coa.accountId), coa);
    if (coa.accountNumber && !coa._autoNumbered) {
      coaByNumber.set(String(coa.accountNumber), coa);
    }
    const fqn = (coa as any).fullyQualifiedName as string | undefined;
    if (fqn) coaByFqn.set(fqn.toLowerCase(), coa);
    if (coa.accountName) {
      const key = coa.accountName.toLowerCase();
      const list = coaByNameAll.get(key) || [];
      list.push(coa);
      coaByNameAll.set(key, list);
    }
  });
  // Only populate coaByName for names that resolve unambiguously to a single COA entry.
  for (const [key, list] of coaByNameAll) {
    if (list.length === 1) coaByName.set(key, list[0]);
  }

  let matched = 0;
  let unmatched = 0;
  
  const enrichedAccounts = tbAccounts.map(tb => {
    // Last-resort: extract leading digits off the TB name in case the parser
    // didn't populate accountNumber (legacy cached rows from before the fix).
    const nameDigits = extractLeadingAccountNumber(tb.accountName || '');
    const fqnLower = (tb.fullyQualifiedName || '').toLowerCase();
    const nameLower = (tb.accountName || '').toLowerCase();
    // TB accountName can itself be the FQN (e.g. "RETAIL:z_Shopify Sales")
    // when the parser stripped the parent's acctNum prefix. Prefer FQN over
    // number lookup for sub-accounts so children don't collapse into parents.
    const nameAsFqn = nameLower.includes(':') ? nameLower : '';

    const coaMatch =
      (tb.qbAccountId && coaByQbId.get(tb.qbAccountId)) ||
      (fqnLower && coaByFqn.get(fqnLower)) ||
      (nameAsFqn && coaByFqn.get(nameAsFqn)) ||
      (tb.accountNumber && coaByNumber.get(String(tb.accountNumber))) ||
      (nameLower && coaByName.get(nameLower)) ||
      (tb.accountName?.includes(':') && coaByName.get(tb.accountName.split(':').pop()!.trim().toLowerCase())) ||
      (tb.accountName?.includes(':') && coaByName.get(tb.accountName.split(':')[0].trim().toLowerCase())) ||
      (nameDigits && coaByNumber.get(nameDigits));


    
    if (coaMatch) {
      matched++;
      
      // Use classification from COA as fsLineItem if available (priority #2 in trust chain)
      // This provides the "Revenue" vs "Sales" fix - use QB's own classification
      const fsLineItemFromClassification = coaMatch.classification 
        ? normalizeClassification(coaMatch.classification)
        : undefined;
      
      return {
        ...tb,
        accountNumber: coaMatch.accountNumber || tb.accountNumber,   // Real COA account number
        fsType: coaMatch.fsType,                                    // From COA
        accountType: coaMatch.category,                              // Map COA category to accountType
        accountSubtype: coaMatch.accountSubtype || '',               // From COA (qbToJson accountSubType)
        // Priority: existing fsLineItem (Java) → classification → fallback mapping
        fsLineItem: tb.fsLineItem || coaMatch.category || fsLineItemFromClassification || undefined,
        _matchedFromCOA: true,                                       // Internal flag for UI
      };
    } else {
      unmatched++;
      // Heuristic fallback for genuinely unmatched accounts based on name patterns
      const nameLower = (tb.accountName || '').toLowerCase();
      let inferredFsLineItem: string | undefined;
      if (nameLower.includes('income') || nameLower.includes('revenue') || nameLower.includes('sales')) {
        inferredFsLineItem = 'Revenue';
      } else if (nameLower.includes('cost of goods') || nameLower.includes('cogs')) {
        inferredFsLineItem = 'Cost of Goods Sold';
      } else if (nameLower.includes('depreciation') || nameLower.includes('amortization')) {
        inferredFsLineItem = 'Other expense (income)';
      } else if (nameLower.includes('payroll') || nameLower.includes('salary') || nameLower.includes('wage')) {
        inferredFsLineItem = 'Operating expenses';
      } else if (nameLower.includes('expense') || nameLower.includes('cost')) {
        inferredFsLineItem = 'Operating expenses';
      } else if (nameLower.includes('insurance') || nameLower.includes('rent') || nameLower.includes('utilities')) {
        inferredFsLineItem = 'Operating expenses';
      }
      return {
        ...tb,
        ...(inferredFsLineItem && !tb.fsLineItem ? { 
          fsLineItem: inferredFsLineItem, 
          fsType: 'IS' as FSType 
        } : {}),
        _matchedFromCOA: false,
      };
    }
  });
  
  return {
    accounts: enrichedAccounts as TrialBalanceAccount[],
    matchStats: { matched, unmatched }
  };
}

// Helper to check if account was matched from COA
export function isMatchedFromCOA(account: TrialBalanceAccount): boolean {
  return (account as any)._matchedFromCOA === true;
}

// ============= Dynamic FY/LTM/YTD Column Utilities =============

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export { SHORT_MONTHS };

/**
 * Get list of complete fiscal years spanned by periods.
 * For December year-end: FY23 = Jan 2023 - Dec 2023
 * For non-December year-end (e.g., March): FY24 = Apr 2023 - Mar 2024
 */
export function getFiscalYears(periods: Period[], fiscalYearEnd: number): number[] {
  const regularPeriods = periods.filter(p => !p.isStub);
  if (regularPeriods.length === 0) return [];

  const fySet = new Set<number>();
  
  // For each fiscal year-end period present, we have a complete FY
  const fyEndPeriods = regularPeriods.filter(p => p.month === fiscalYearEnd);
  
  for (const fyEnd of fyEndPeriods) {
    // FY label = calendar year of the fiscal year end
    fySet.add(fyEnd.year);
  }
  
  return Array.from(fySet).sort((a, b) => a - b);
}

/**
 * Calculate FY total for a specific fiscal year.
 * BS accounts: Ending balance at FY-end month
 * IS accounts: Sum all months in the fiscal year
 */
export function calculateFYTotalForYear(
  account: TrialBalanceAccount,
  periods: Period[],
  fiscalYearEnd: number,
  fyYear: number
): number {
  const regularPeriods = periods.filter(p => !p.isStub);
  
  // Find the fiscal year end period for this year
  const fyEndPeriod = regularPeriods.find(p => p.year === fyYear && p.month === fiscalYearEnd);
  if (!fyEndPeriod) return 0;

  if (account.fsType === 'BS') {
    // BS: Return ending balance at fiscal year end
    return account.monthlyValues[fyEndPeriod.id] || 0;
  } else {
    // IS: Sum all periods in this fiscal year
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? fyYear : fyYear - 1;
    
    let total = 0;
    regularPeriods.forEach(p => {
      const isInFY = 
        (fiscalYearEnd === 12)
          ? (p.year === fyYear && p.month >= 1 && p.month <= 12)
          : ((p.year === fyStartYear && p.month >= fyStartMonth) ||
             (p.year === fyYear && p.month <= fiscalYearEnd));
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}

/**
 * Get LTM reference periods (fiscal year-end months present in the data).
 * Returns periods where LTM calculations make sense (typically year-end months).
 */
export function getLTMReferencePeriods(periods: Period[], fiscalYearEnd: number): Period[] {
  const regularPeriods = periods.filter(p => !p.isStub);
  // Return all fiscal year-end periods
  return regularPeriods.filter(p => p.month === fiscalYearEnd);
}

/**
 * Calculate LTM (Last Twelve Months) ending at a specific period.
 * BS accounts: Ending balance at that period
 * IS accounts: Sum of trailing 12 months
 */
export function calculateLTMAtPeriod(
  account: TrialBalanceAccount,
  periods: Period[],
  endPeriod: Period
): number {
  const regularPeriods = periods.filter(p => !p.isStub);
  
  if (account.fsType === 'BS') {
    return account.monthlyValues[endPeriod.id] || 0;
  } else {
    // Find 12 months ending at endPeriod
    const endIndex = regularPeriods.findIndex(p => p.id === endPeriod.id);
    if (endIndex < 0) return 0;
    
    const startIndex = Math.max(0, endIndex - 11);
    const ltmPeriods = regularPeriods.slice(startIndex, endIndex + 1);
    
    return ltmPeriods.reduce((sum, p) => sum + (account.monthlyValues[p.id] || 0), 0);
  }
}

/**
 * Get YTD reference periods (fiscal year-end months present in the data).
 * Returns periods where YTD calculations are displayed (typically year-end months).
 */
export function getYTDReferencePeriods(periods: Period[], fiscalYearEnd: number): Period[] {
  const regularPeriods = periods.filter(p => !p.isStub);
  // Return all fiscal year-end periods
  return regularPeriods.filter(p => p.month === fiscalYearEnd);
}

/**
 * Calculate YTD (Year-to-Date) ending at a specific period.
 * BS accounts: Ending balance at that period
 * IS accounts: Sum from FY start through that period
 */
export function calculateYTDAtPeriod(
  account: TrialBalanceAccount,
  periods: Period[],
  fiscalYearEnd: number,
  endPeriod: Period
): number {
  const regularPeriods = periods.filter(p => !p.isStub);
  
  if (account.fsType === 'BS') {
    return account.monthlyValues[endPeriod.id] || 0;
  } else {
    // Determine fiscal year start
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? endPeriod.year : endPeriod.year - 1;
    
    let total = 0;
    regularPeriods.forEach(p => {
      // Check if period is in the fiscal year up to endPeriod
      const isInFY = 
        (fiscalYearEnd === 12)
          ? (p.year === endPeriod.year && p.month <= endPeriod.month)
          : ((p.year === fyStartYear && p.month >= fyStartMonth) ||
             (p.year === endPeriod.year && p.month <= endPeriod.month));
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}
