import { Period } from "./periodUtils";

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
  rows?: QbTrialBalanceRow[];
  report?: QbRawReport;
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
  
  const accountName = colData[0]?.value || '';
  const accountId = colData[0]?.id || '';
  const debitStr = colData[1]?.value || '0';
  const creditStr = colData[2]?.value || '0';
  
  // Skip empty rows or header rows
  if (!accountName || accountName === 'Account' || accountName === 'Total') return null;
  
  const debit = parseFloat(debitStr.replace(/[^0-9.-]/g, '')) || 0;
  const credit = parseFloat(creditStr.replace(/[^0-9.-]/g, '')) || 0;
  
  return {
    accountNumber: accountId,
    accountName: accountName,
    debit: debit,
    credit: credit,
    balance: debit - credit
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
      const reportDate = monthlyReport.reportDate || 
                         monthlyReport.endDate || 
                         monthlyReport.report?.header?.endPeriod;
      
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
    const accountKey = row.accountNumber || row.accountName || '';
    if (!accountKey) continue;
    
    let account = accountMap.get(accountKey);
    if (!account) {
      const accountType = row.accountType || '';
      const accountSubtype = row.accountSubtype || row.subAccountType || '';
      
      account = {
        id: crypto.randomUUID(),
        // Use backend-provided fsType, simple fallback to BS (not derived)
        fsType: row.fsType || 'BS',
        accountNumber: row.accountNumber || '',
        accountName: row.accountName || '',
        accountType: accountType,
        accountSubtype: accountSubtype,
        // Use backend-provided fsLineItem only - empty = bug visible
        fsLineItem: row.fsLineItem || '',
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
  
  // Add existing accounts to map
  for (const account of existing) {
    const key = account.accountNumber || account.accountName;
    if (key) {
      accountMap.set(key, { ...account, monthlyValues: { ...account.monthlyValues } });
    }
  }
  
  // Merge incoming accounts
  for (const account of incoming) {
    const key = account.accountNumber || account.accountName;
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
  // Build lookup maps by accountNumber and accountName (case-insensitive)
  const coaByNumber = new Map<string, CoaAccount>();
  const coaByName = new Map<string, CoaAccount>();
  
  coaAccounts.forEach(coa => {
    if (coa.accountNumber) coaByNumber.set(coa.accountNumber, coa);
    if (coa.accountName) coaByName.set(coa.accountName.toLowerCase(), coa);
  });
  
  let matched = 0;
  let unmatched = 0;
  
  const enrichedAccounts = tbAccounts.map(tb => {
    // Try to find matching COA account by number first, then by name
    const coaMatch = 
      (tb.accountNumber && coaByNumber.get(tb.accountNumber)) ||
      (tb.accountName && coaByName.get(tb.accountName.toLowerCase())) ||
      // Parent-name fallback for sub-accounts (e.g., "Cost of Sales:Equipment Rental" -> "Cost of Sales")
      (tb.accountName?.includes(':') && coaByName.get(tb.accountName.split(':')[0].trim().toLowerCase())) ||
      // Child-name fallback (e.g., "Payroll Expenses:Payroll Taxes" -> "Payroll Taxes")
      (tb.accountName?.includes(':') && coaByName.get(tb.accountName.split(':').pop()!.trim().toLowerCase()));
    
    if (coaMatch) {
      matched++;
      
      // Use classification from COA as fsLineItem if available (priority #2 in trust chain)
      // This provides the "Revenue" vs "Sales" fix - use QB's own classification
      const fsLineItemFromClassification = coaMatch.classification 
        ? normalizeClassification(coaMatch.classification)
        : undefined;
      
      return {
        ...tb,
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
      if (nameLower.includes('payroll') || nameLower.includes('salary') || nameLower.includes('wage')) {
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
