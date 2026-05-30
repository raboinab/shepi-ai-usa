import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import * as XLSX from "npm:xlsx@0.18.5";

import { aiFetch, ensureZdrEnabled } from "../_shared/zdrGuard.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface TrialBalanceAccount {
  id: string;
  fsType: 'BS' | 'IS';
  accountNumber: string;
  accountName: string;
  accountType: string;
  monthlyValues: Record<string, number>;
}

interface DerivedTotals {
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalRevenue?: number;
  totalCogs?: number;
  grossProfit?: number;
  totalExpenses?: number;
  netOperatingIncome?: number;
  totalOtherIncome?: number;
  totalOtherExpense?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netChangeInCash?: number;
  asOfDate?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  /** AI-extracted detail rows, only populated for income_statement. Excludes subtotals/headers. */
  lineDetails?: { label: string; amount: number; section: 'income' | 'cogs' | 'expenses' | 'other_income' | 'other_expense' }[];
}

interface TBBreakdownItem {
  accountName: string;
  accountType: string;
  bucket: 'revenue' | 'cogs' | 'expense' | 'other_income' | 'other_expense';
  totalInScope: number;
}

interface MissingAccount {
  label: string;
  section: string;
  uploadedAmount: number;
  suspectedBucket: string;
}


interface ValidationLineItem {
  lineItem: string;
  uploadedValue: number | null;
  trialBalanceValue: number;
  variance: number | null;
  variancePercent: number | null;
  status: 'match' | 'minor' | 'significant' | 'extraction_failed';
}

// --- Period helpers ---

/** Sort period keys chronologically and return the latest one */
function getLatestPeriodKey(monthlyValues: Record<string, number>): string | null {
  const keys = Object.keys(monthlyValues).filter(k => monthlyValues[k] !== undefined);
  if (keys.length === 0) return null;
  // Period keys are typically like "2024-01", "2024-02", etc.
  keys.sort();
  return keys[keys.length - 1];
}

/** Filter period keys that fall within a date range */
function getPeriodKeysInRange(
  monthlyValues: Record<string, number>,
  periodStart?: string | null,
  periodEnd?: string | null
): string[] {
  const keys = Object.keys(monthlyValues);
  if (!periodStart && !periodEnd) return keys;

  return keys.filter(key => {
    // key format: "2024-01" or similar
    if (periodStart && key < periodStart.slice(0, 7)) return false;
    if (periodEnd && key > periodEnd.slice(0, 7)) return false;
    return true;
  });
}

// --- Trial Balance derivation logic ---

/**
 * Classify a BS account. Account-name overrides catch common GL-derivation errors
 * (e.g. "Accounts Payable" mis-typed as "Other current assets" by upstream parsers).
 */
function classifyBSAccount(accountName: string, accountType: string): 'asset' | 'liability' | 'equity' | null {
  const name = (accountName || '').toLowerCase();
  const type = (accountType || '').toLowerCase();

  // Name-based hard overrides
  if (name.includes('accounts payable') || /\ba\/p\b/.test(name) || name.includes('(a/p)')) return 'liability';
  if (name.includes('credit card') || name.includes('mastercard') || name.includes(' visa') || name.startsWith('visa') || name.includes('amex') || name.includes('american express')) return 'liability';
  if (name.includes('notes payable') || name.includes('loan payable') || name.includes('line of credit')) return 'liability';
  if (name.includes('accounts receivable') || /\ba\/r\b/.test(name) || name.includes('(a/r)')) return 'asset';
  if (name.includes('retained earnings') || name.includes('opening balance equity') || name.includes("owner's equity") || name.includes('owners equity') || name.includes('common stock') || name.includes('contributed capital') || name.includes('paid-in capital') || name.includes('paid in capital') || name.includes('distributions') || name.includes('owner draw')) return 'equity';

  // Type-based classification (more specific patterns first)
  if (type.includes('equity')) return 'equity';
  if (type.includes('liabilit') || type.includes('payable') || type.includes('credit card') || type.includes('loan') || type.includes('debt') || type.includes('accrued') || type.includes('deferred revenue') || type.includes('notes payable')) return 'liability';
  if (type.includes('asset') || type.includes('bank') || type.includes('cash') || type.includes('receivable') || type.includes('inventory') || type.includes('prepaid') || type.includes('fixed') || type.includes('intangible')) return 'asset';

  return null;
}

function classifyISAccount(accountName: string, accountType: string): 'revenue' | 'cogs' | 'expense' | 'other_income' | 'other_expense' | null {
  const name = (accountName || '').toLowerCase();
  const type = (accountType || '').toLowerCase();

  if (type.includes('cost of goods') || type.includes('cogs') || type.includes('cost of sales') || name.includes('cost of goods') || name.includes('cost of sales')) return 'cogs';

  // Name-based hard overrides for below-the-line items (catches QB's combined "Other expense (income)" type)
  if (name.includes('interest income') || name.includes('interest earned') || name.includes('dividend income') || name.includes('gain on') || name.includes('portfolio income')) return 'other_income';
  if (name.includes('interest expense') || name.includes('loss on') || name.includes('penalt') || name.includes('settlement')) return 'other_expense';
  // QuickBooks reports Depreciation/Amortization below the line in "Other Expense", regardless of COA type
  if (name.includes('depreciation') || name.includes('amortization') || name.includes('amortisation')) return 'other_expense';

  // Type-based: "Other income"
  if (type.includes('other income')) return 'other_income';
  // "Other expense (income)" or "Other expense" — default to other_expense unless name implied income above
  if (type.includes('other expense')) return 'other_expense';
  if (type.includes('income') || type.includes('revenue') || type.includes('sales')) return 'revenue';
  if (type.includes('expense')) return 'expense';

  return 'expense';
}

/** Strict classifier used only for BS rows that failed BS classification. */
function classifyLikelyISAccount(accountName: string, accountType: string): 'revenue' | 'cogs' | 'expense' | null {
  const name = (accountName || '').toLowerCase();
  const type = (accountType || '').toLowerCase();

  if (type.includes('cost of goods') || type.includes('cogs') || type.includes('cost of sales') || name.includes('cost of goods') || name.includes('cost of sales')) return 'cogs';
  if (type.includes('income') || type.includes('revenue') || type.includes('sales') || name.includes('income') || name.includes('revenue') || name.includes('sales')) return 'revenue';
  if (type.includes('expense') || type.includes('other expense')) return 'expense';

  const expenseNamePatterns = [
    'advertising', 'amortization', 'bank charge', 'bookkeeper', 'depreciation', 'dues',
    'equipment rental', 'fee', 'insurance', 'internet', 'legal', 'license', 'maintenance',
    'meal', 'office', 'payroll', 'penalt', 'permit', 'professional', 'rent', 'repair',
    'salary', 'settlement', 'software', 'subscription', 'supplies', 'tax', 'telephone',
    'travel', 'utilities', 'wage'
  ];

  return expenseNamePatterns.some(pattern => name.includes(pattern)) ? 'expense' : null;
}

function getPointInTimeValue(monthlyValues: Record<string, number>, periodEnd?: string | null): number {
  if (periodEnd) {
    const targetKey = periodEnd.slice(0, 7);
    const match = Object.keys(monthlyValues).sort().filter(k => k <= targetKey).pop();
    return match ? (monthlyValues[match] || 0) : 0;
  }

  const latestKey = getLatestPeriodKey(monthlyValues);
  return latestKey ? (monthlyValues[latestKey] || 0) : 0;
}

/** Parse fiscal year end (e.g. "12-31", "2024-12-31", "06-30") to month 1-12. */
function parseFiscalYearEndMonth(fiscalYearEnd: string | null | undefined): number {
  if (!fiscalYearEnd) return 12;
  const m = fiscalYearEnd.match(/(\d{1,2})[-\/](\d{1,2})/);
  if (!m) return 12;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  return a <= 12 ? a : b;
}

/**
 * QuickBooks Trial Balance IS rows are stored as cumulative YTD balances that
 * reset at each fiscal-year start. To get monthly activity, take the delta
 * between consecutive months within the same fiscal year; the first month of
 * each FY is the activity itself.
 */
function convertIsYtdToMonthlyActivity(
  monthlyValues: Record<string, number>,
  fiscalYearEndMonth: number
): Record<string, number> {
  const orderedKeys = Object.keys(monthlyValues).sort();
  if (orderedKeys.length === 0) return {};

  const fyStartMonth = (fiscalYearEndMonth % 12) + 1;
  const fyOf = (key: string): number => {
    const [yStr, mStr] = key.split('-');
    const y = parseInt(yStr, 10);
    const mo = parseInt(mStr, 10);
    return mo >= fyStartMonth ? y : y - 1;
  };

  const result: Record<string, number> = {};
  for (let i = 0; i < orderedKeys.length; i++) {
    const cur = orderedKeys[i];
    const prev = i > 0 ? orderedKeys[i - 1] : null;
    const curVal = monthlyValues[cur] || 0;
    if (!prev || fyOf(cur) !== fyOf(prev)) {
      result[cur] = curVal;
    } else {
      result[cur] = curVal - (monthlyValues[prev] || 0);
    }
  }
  return result;
}

/**
 * Compute the start month key (YYYY-MM) of the current open fiscal year
 * given fiscal_year_end (e.g. "12-31", "06-30") and the period-end we're reporting at.
 * Falls back to Jan of periodEnd's year if fiscalYearEnd is missing/unparseable.
 */
function computeFiscalYtdStartKey(fiscalYearEnd: string | null | undefined, periodEndKey: string): string {
  const [endYearStr, endMonthStr] = periodEndKey.split('-');
  const endYear = parseInt(endYearStr, 10);
  const endMonth = parseInt(endMonthStr, 10);

  let fyEndMonth = 12;
  if (fiscalYearEnd) {
    const m = fiscalYearEnd.match(/(\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      // Accept both MM-DD and YYYY-MM-DD style; first group treated as month if <=12
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      fyEndMonth = a <= 12 ? a : b;
    }
  }

  // FY-start month = month after FY-end month
  const fyStartMonth = (fyEndMonth % 12) + 1;
  // If the periodEnd month is on/after fyStart, current FY started this calendar year; else last year.
  const fyStartYear = endMonth >= fyStartMonth ? endYear : endYear - 1;
  return `${fyStartYear}-${String(fyStartMonth).padStart(2, '0')}`;
}

function deriveTotalsFromTrialBalance(
  accounts: TrialBalanceAccount[],
  documentType: string,
  periodStart?: string | null,
  periodEnd?: string | null,
  fiscalYearEnd?: string | null,
  breakdownOut?: TBBreakdownItem[]
): DerivedTotals {
  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
  let totalRevenue = 0, totalCogs = 0, totalExpenses = 0;
  let otherIncome = 0, otherExpense = 0;
  // Open-income accumulators for the reporting endpoint.
  let ytdRevenue = 0, ytdCogs = 0, ytdExpenses = 0;

  // Determine YTD start key (only needed for BS validation rollup)
  let ytdStartKey: string | null = null;
  if (documentType === 'balance_sheet') {
    // Use periodEnd if given, else latest period across all accounts
    let referenceEndKey = periodEnd ? periodEnd.slice(0, 7) : null;
    if (!referenceEndKey) {
      for (const a of accounts) {
        const k = getLatestPeriodKey(a.monthlyValues);
        if (k && (!referenceEndKey || k > referenceEndKey)) referenceEndKey = k;
      }
    }
    if (referenceEndKey) {
      ytdStartKey = computeFiscalYtdStartKey(fiscalYearEnd, referenceEndKey);
    }
  }
  const ytdEndKey = periodEnd ? periodEnd.slice(0, 7) : null;

  for (const account of accounts) {
    let value = 0;

    if (account.fsType === 'BS' && (documentType === 'balance_sheet' || documentType === 'cash_flow')) {
      // Point-in-time: latest period ≤ periodEnd, or latest overall
      value = getPointInTimeValue(account.monthlyValues, periodEnd);
    } else if (account.fsType === 'IS') {
      if (documentType === 'balance_sheet') {
        // QB Trial Balance income rows are endpoint balances for the open fiscal year,
        // not monthly movements. For BS equity rollup, use the reporting endpoint only.
        value = getPointInTimeValue(account.monthlyValues, periodEnd);
      } else {
        // QB IS rows are cumulative YTD; convert to monthly activity before summing.
        const monthly = convertIsYtdToMonthlyActivity(account.monthlyValues, parseFiscalYearEndMonth(fiscalYearEnd));
        const filteredKeys = getPeriodKeysInRange(monthly, periodStart, periodEnd);
        value = filteredKeys.reduce((sum, k) => sum + (monthly[k] || 0), 0);
      }
    } else {
      if (account.fsType === 'BS') {
        const latestKey = getLatestPeriodKey(account.monthlyValues);
        value = latestKey ? (account.monthlyValues[latestKey] || 0) : 0;
      } else {
        value = Object.values(account.monthlyValues).reduce((sum, v) => sum + v, 0);
      }
    }

    if (account.fsType === 'BS') {
      const bucket = classifyBSAccount(account.accountName, account.accountType);
      if (!bucket) {
        if (documentType === 'balance_sheet' && ytdStartKey) {
          const fallbackBucket = classifyLikelyISAccount(account.accountName, account.accountType);
          if (fallbackBucket === 'revenue') ytdRevenue += -value;
          else if (fallbackBucket === 'cogs') ytdCogs += Math.abs(value);
          else if (fallbackBucket === 'expense') ytdExpenses += Math.abs(value);
        }
        continue;
      }
      if (bucket === 'asset') totalAssets += value;
      else if (bucket === 'liability') totalLiabilities += -value;
      else totalEquity += -value;
    } else if (account.fsType === 'IS') {
      const bucket = classifyISAccount(account.accountName, account.accountType);
      let signedTotal = 0;
      if (bucket === 'revenue') { totalRevenue += -value; signedTotal = -value; }
      else if (bucket === 'cogs') { totalCogs += Math.abs(value); signedTotal = Math.abs(value); }
      else if (bucket === 'expense') { totalExpenses += Math.abs(value); signedTotal = Math.abs(value); }
      else if (bucket === 'other_income') { otherIncome += -value; signedTotal = -value; }
      else if (bucket === 'other_expense') { otherExpense += Math.abs(value); signedTotal = Math.abs(value); }

      if (breakdownOut && bucket) {
        breakdownOut.push({
          accountName: account.accountName,
          accountType: account.accountType || '',
          bucket,
          totalInScope: signedTotal,
        });
      }

      // YTD slice for equity rollup
      if (ytdStartKey) {
        const ytdValue = documentType === 'balance_sheet'
          ? value
          : Object.keys(account.monthlyValues)
            .filter(k => k >= ytdStartKey! && (!ytdEndKey || k <= ytdEndKey))
            .reduce((sum, k) => sum + (account.monthlyValues[k] || 0), 0);
        if (bucket === 'revenue') ytdRevenue += -ytdValue;
        else if (bucket === 'cogs') ytdCogs += Math.abs(ytdValue);
        else if (bucket === 'expense') ytdExpenses += Math.abs(ytdValue);
        // include other_income/other_expense in YTD net income for equity rollup
        else if (bucket === 'other_income') ytdRevenue += -ytdValue;
        else if (bucket === 'other_expense') ytdExpenses += Math.abs(ytdValue);
      }
    }
  }

  const grossProfit = totalRevenue - totalCogs;
  const operatingIncome = grossProfit - totalExpenses;
  const netIncome = operatingIncome + otherIncome - otherExpense;
  const ytdNetIncome = (ytdRevenue - ytdCogs) - ytdExpenses;

  // Roll only current-FY YTD net income into equity. TB Retained Earnings already
  // contains all prior closed years; adding all-history netIncome would double-count.
  let totalEquityAdjusted = totalEquity;
  if (documentType === 'balance_sheet' && ytdStartKey) {
    // Defensive: skip rollup if YTD net income exceeds YTD revenue (classification gone wrong)
    if (Math.abs(ytdNetIncome) > Math.abs(ytdRevenue) * 2 && ytdRevenue !== 0) {
      console.warn(`[validate-fs] Skipping equity YTD rollup: ytdNetIncome=${ytdNetIncome} vs ytdRevenue=${ytdRevenue}`);
    } else {
      totalEquityAdjusted = totalEquity + ytdNetIncome;
      console.log(`[validate-fs] Equity rollup: base=${totalEquity} + ytdNI=${ytdNetIncome} (YTD from ${ytdStartKey} to ${ytdEndKey || 'latest'}) = ${totalEquityAdjusted}`);
    }
  }

  return {
    totalAssets, totalLiabilities, totalEquity: totalEquityAdjusted,
    totalRevenue, totalCogs, grossProfit, totalExpenses,
    netOperatingIncome: operatingIncome,
    totalOtherIncome: otherIncome,
    totalOtherExpense: otherExpense,
    netIncome,
    operatingCashFlow: netIncome, investingCashFlow: 0, financingCashFlow: 0,
    netChangeInCash: netIncome,
  };
}


// --- Variance helpers ---

function formatCurrencyForSummary(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function getVarianceStatus(variance: number, baseValue: number): 'match' | 'minor' | 'significant' {
  if (variance === 0) return 'match';
  const absVariance = Math.abs(variance);
  const absBase = Math.abs(baseValue);
  if (absVariance <= 1 || (absBase > 0 && absVariance / absBase <= 0.001)) return 'match';
  if (absBase > 0 && absVariance / absBase <= 0.01) return 'minor';
  return 'significant';
}

const LINE_ITEM_DEFS: Record<string, { key: string; label: string }[]> = {
  balance_sheet: [
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'totalLiabilities', label: 'Total Liabilities' },
    { key: 'totalEquity', label: 'Total Equity' },
  ],
  income_statement: [
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'totalCogs', label: 'Cost of Goods Sold' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'totalExpenses', label: 'Total Operating Expenses' },
    { key: 'netOperatingIncome', label: 'Net Operating Income' },
    { key: 'totalOtherIncome', label: 'Other Income' },
    { key: 'totalOtherExpense', label: 'Other Expense' },
    { key: 'netIncome', label: 'Net Income' },
  ],
  cash_flow: [
    { key: 'operatingCashFlow', label: 'Operating Cash Flow' },
    { key: 'investingCashFlow', label: 'Investing Cash Flow' },
    { key: 'financingCashFlow', label: 'Financing Cash Flow' },
    { key: 'netChangeInCash', label: 'Net Change in Cash' },
  ],
};

function buildLineItems(
  documentType: string,
  derivedTotals: DerivedTotals,
  uploadedTotals: DerivedTotals | undefined | null
): ValidationLineItem[] {
  const defs = LINE_ITEM_DEFS[documentType] || [];
  const OPTIONAL_KEYS = new Set(['totalOtherIncome', 'totalOtherExpense']);

  return defs.flatMap(({ key, label }) => {
    const tbValue = (derivedTotals as Record<string, number>)[key] || 0;
    const rawUploaded = uploadedTotals?.[key as keyof DerivedTotals];

    if (OPTIONAL_KEYS.has(key) && Math.abs(tbValue) < 1 && (rawUploaded == null || Math.abs(rawUploaded as number) < 1)) {
      return [];
    }

    if (rawUploaded === null || rawUploaded === undefined) {
      return [{ lineItem: label, uploadedValue: null, trialBalanceValue: tbValue, variance: null, variancePercent: null, status: 'extraction_failed' as const }];
    }

    const uploadedValue = rawUploaded as number;
    const variance = uploadedValue - tbValue;
    const variancePercent = tbValue !== 0 ? (variance / Math.abs(tbValue)) * 100 : 0;
    return [{ lineItem: label, uploadedValue, trialBalanceValue: tbValue, variance, variancePercent, status: getVarianceStatus(variance, tbValue) }];
  });
}

// --- Diagnostics: detect uploaded line items with no matching TB account ---

function normalizeAccountLabel(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/^\s*total\s+for\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** For each uploaded detail row, check whether a TB account (or any path segment) matches by name. */
function computeMissingAccounts(
  uploadedLines: NonNullable<DerivedTotals['lineDetails']>,
  tbAccounts: TrialBalanceAccount[]
): MissingAccount[] {
  // Build a set of normalized TB names: full path AND each ":"-separated segment.
  const tbNames = new Set<string>();
  for (const a of tbAccounts) {
    if (a.fsType !== 'IS') continue;
    const name = a.accountName || '';
    tbNames.add(normalizeAccountLabel(name));
    for (const seg of name.split(':')) {
      tbNames.add(normalizeAccountLabel(seg));
    }
  }

  const missing: MissingAccount[] = [];
  const SECTION_TO_BUCKET: Record<string, string> = {
    income: 'revenue',
    cogs: 'cogs',
    expenses: 'expense',
    other_income: 'other_income',
    other_expense: 'other_expense',
  };
  for (const row of uploadedLines || []) {
    if (!row?.label || typeof row.amount !== 'number' || row.amount === 0) continue;
    const norm = normalizeAccountLabel(row.label);
    if (!norm) continue;
    // Skip obvious subtotals / headers the AI may have leaked through.
    if (/^(total|gross profit|net (operating |other )?income|net loss|income|expenses|cost of goods sold)$/.test(norm)) continue;
    if (tbNames.has(norm)) continue;
    // Try last segment in case the AI included an indented sub-path.
    const parts = norm.split(' ');
    if (parts.length > 1 && tbNames.has(parts[parts.length - 1])) continue;
    missing.push({
      label: row.label,
      section: row.section,
      uploadedAmount: row.amount,
      suspectedBucket: SECTION_TO_BUCKET[row.section] || 'expense',
    });
  }
  // Sort by absolute amount desc, cap at 20.
  missing.sort((a, b) => Math.abs(b.uploadedAmount) - Math.abs(a.uploadedAmount));
  return missing.slice(0, 20);
}

// --- XLSX parsing: download file from storage and convert to text for AI ---

async function parseXlsxFromStorage(
  supabase: ReturnType<typeof createClient>,
  filePath: string
): Promise<string | null> {
  try {
    console.log(`[validate-fs] Downloading xlsx from storage: ${filePath}`);
    const { data: fileData, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error || !fileData) {
      console.warn(`[validate-fs] Failed to download file:`, error?.message);
      return null;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames.slice(0, 3)) { // max 3 sheets
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
      // Limit to 600 rows (QB P&L exports can have many detail lines + section subtotals)
      const rows = json.slice(0, 600);
      if (rows.length > 0) {
        sheets.push(`Sheet: ${sheetName}\n` + rows.map(r => (r as unknown[]).join('\t')).join('\n'));
      }
    }

    const text = sheets.join('\n\n');
    console.log(`[validate-fs] Parsed xlsx: ${text.length} chars from ${workbook.SheetNames.length} sheets`);
    return text.length > 0 ? text : null;
  } catch (e) {
    console.warn(`[validate-fs] xlsx parse error:`, e);
    return null;
  }
}

// --- AI extraction from text content ---

async function extractTotalsViaAI(
  textContent: string,
  documentType: string
): Promise<DerivedTotals | null> {
  const VERCEL_AI_GATEWAY_KEY = Deno.env.get("VERCEL_AI_GATEWAY_KEY");
  if (!VERCEL_AI_GATEWAY_KEY) return null;

  let prompt = '';
  if (documentType === 'balance_sheet') {
    prompt = `Extract the following totals from this Balance Sheet spreadsheet data. Look for rows labeled "Total Assets", "Total Liabilities", "Total Equity" or similar. If there are monthly columns, use the LAST (most recent) month's value OR find a "Total" column.

ALSO extract the "as-of date" of the balance sheet. Look for phrases like "As of YYYY-MM-DD", "Balance Sheet as of …", or a date in a column header. Return it as YYYY-MM-DD. If the only date available is a month/year (e.g. "December 2024"), return the last day of that month (e.g. "2024-12-31"). If no date can be found, return null.

Return ONLY valid JSON:
      { "totalAssets": number or null, "totalLiabilities": number or null, "totalEquity": number or null, "asOfDate": "YYYY-MM-DD" or null }

      Spreadsheet data:\n${textContent.slice(0, 32000)}`;

  } else if (documentType === 'income_statement') {
    prompt = `Extract totals from this Income Statement / Profit & Loss spreadsheet (often a QuickBooks "Profit and Loss by Month" export).

STRUCTURE NOTES
- The file typically has monthly columns plus a Total column. Prefer the Total column; if absent, sum monthly values.
- QuickBooks P&Ls have these sections in order: Income, Cost of Goods Sold, Gross Profit, Expenses, Net Operating Income, Other Income, Other Expense, Net Other Income, Net Income.
- "Total Income" / "Total Revenue" refers ONLY to the operating Income section — DO NOT include Other Income.
- "Total Expenses" / "Total Operating Expenses" refers ONLY to the operating Expenses section — DO NOT include Other Expense, COGS, interest, depreciation, or taxes as separate below-the-line items.

EXTRACTION RULES
- totalRevenue: the printed "Total Income" or "Total Revenue" row from the operating Income section. If no such subtotal exists, SUM every detail row inside the Income section (stop at "Cost of Goods Sold" / "Gross Profit").
- totalCogs: "Total Cost of Goods Sold" / "Total COGS" / "Cost of Sales" subtotal, or sum of all detail rows in that section. 0 if the section is empty. Do NOT include Job Expenses / Job Materials / Cost of Labor here unless they are explicitly inside a "Cost of Goods Sold" section header.
- grossProfit: the printed "Gross Profit" row, or totalRevenue − totalCogs.
- totalExpenses: the printed "Total Expenses" / "Total Operating Expenses" row from the operating Expenses section. If ambiguous, SUM every detail row in the Expenses section (between Gross Profit and Net Operating Income). Include Job Expenses if QuickBooks places them in this section.
- netOperatingIncome: the printed "Net Operating Income" row, or grossProfit − totalExpenses.
- totalOtherIncome: SUM of rows in the "Other Income" section (below Net Operating Income). 0 if no such section.
- totalOtherExpense: SUM of rows in the "Other Expense" section. 0 if no such section.
- netIncome: the printed "Net Income" row (true bottom-line, AFTER Other Income/Expense). If not printed, compute netOperatingIncome + totalOtherIncome − totalOtherExpense.
- periodStart: first day of earliest reporting month (YYYY-MM-DD) from the earliest monthly column header.
- periodEnd: last day of latest reporting month (YYYY-MM-DD) from the latest monthly column header.
- If only a month/year is shown, snap to first/last day of that month. Return null only if truly unknown.
- lineDetails: an array of EVERY detail (leaf) row in the P&L with its Total-column amount and section. EXCLUDE section headers (e.g. "Income", "Expenses"), subtotal rows ("Total for …", "Gross Profit", "Net Operating Income", "Net Income"). INCLUDE parent accounts that have their own posted amount (e.g. a row labeled "Maintenance and Repair" with a value, even if it is followed by sub-rows that roll up under "Total for Maintenance and Repair"). Use the row label EXACTLY as printed (do not strip indentation prefixes other than leading whitespace). section ∈ "income" | "cogs" | "expenses" | "other_income" | "other_expense". Cap at 100 rows.

Return ONLY valid JSON (no markdown):
{ "totalRevenue": number or null, "totalCogs": number or null, "grossProfit": number or null, "totalExpenses": number or null, "netOperatingIncome": number or null, "totalOtherIncome": number or null, "totalOtherExpense": number or null, "netIncome": number or null, "periodStart": "YYYY-MM-DD" or null, "periodEnd": "YYYY-MM-DD" or null, "lineDetails": [{ "label": string, "amount": number, "section": "income"|"cogs"|"expenses"|"other_income"|"other_expense" }] }

Spreadsheet data:\n${textContent.slice(0, 32000)}`;
  } else if (documentType === 'cash_flow') {
    prompt = `Extract the following totals from this Cash Flow Statement spreadsheet data. If there are monthly columns, use the "Total" column or sum all months. Return ONLY valid JSON:
      { "operatingCashFlow": number or null, "investingCashFlow": number or null, "financingCashFlow": number or null, "netChangeInCash": number or null }
      
      Spreadsheet data:\n${textContent.slice(0, 32000)}`;
  }

  if (!prompt) return null;

  try {
    const aiResponse = await aiFetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VERCEL_AI_GATEWAY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "You are a financial data extraction specialist. Extract exact numerical values from spreadsheet data. When data has monthly columns, sum them or use the Total column. Return only valid JSON, no markdown." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[validate-fs] AI extracted totals:`, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (aiError) {
    console.warn("[validate-fs] AI extraction failed:", aiError);
  }
  return null;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, documentId, documentType, extractedTotals, periodStart, periodEnd } = await req.json();

    if (!projectId || !documentType) {
      return new Response(
        JSON.stringify({ error: "projectId and documentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project TB data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("wizard_data, periods, fiscal_year_end")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wizardData = project.wizard_data as Record<string, unknown> | null;
    const trialBalanceData = wizardData?.trialBalance as { accounts?: TrialBalanceAccount[] } | undefined;
    const accounts = trialBalanceData?.accounts || [];

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Trial Balance data found. Please upload and process a Trial Balance first.", code: "NO_TRIAL_BALANCE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine period context: prefer explicit params, then fetch from document record
    let effectivePeriodStart = periodStart || null;
    let effectivePeriodEnd = periodEnd || null;

    if (!effectivePeriodStart && !effectivePeriodEnd && documentId) {
      const { data: docPeriod } = await supabase
        .from("documents")
        .select("period_start, period_end")
        .eq("id", documentId)
        .single();
      if (docPeriod) {
        effectivePeriodStart = docPeriod.period_start;
        effectivePeriodEnd = docPeriod.period_end;
      }
    }

    console.log(`[validate-fs] Deriving totals for ${documentType}, periodStart=${effectivePeriodStart}, periodEnd=${effectivePeriodEnd}, accounts=${accounts.length}`);

    const fiscalYearEnd = (project as { fiscal_year_end?: string | null }).fiscal_year_end;
    let derivedTotals = deriveTotalsFromTrialBalance(accounts, documentType, effectivePeriodStart, effectivePeriodEnd, fiscalYearEnd);
    let uploadedTotals = extractedTotals as DerivedTotals | undefined;

    // --- Extraction pipeline: try multiple sources ---
    if (!uploadedTotals && documentId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("name, file_path, file_type, parsed_summary")
        .eq("id", documentId)
        .single();

      // Step 1: Try AI extraction from parsed_summary (works for PDFs with real parsed data)
      if (!uploadedTotals && doc?.parsed_summary) {
        const summary = doc.parsed_summary as Record<string, unknown>;
        // Only use parsed_summary if it has actual financial data (not just metadata)
        const hasFinancialData = summary && !summary.note && !summary.source;
        if (hasFinancialData) {
          console.log(`[validate-fs] Attempting AI extraction from parsed_summary`);
          uploadedTotals = await extractTotalsViaAI(JSON.stringify(summary), documentType);
        } else {
          console.log(`[validate-fs] parsed_summary is metadata-only, skipping`);
        }
      }

      // Step 2: Try downloading and parsing the xlsx file directly
      if (!uploadedTotals && doc?.file_path) {
        const ext = (doc.file_type || doc.name || '').toLowerCase();
        const isSpreadsheet = ext.includes('xlsx') || ext.includes('xls') || ext.includes('csv') ||
          ext.includes('spreadsheet') || ext.includes('excel');
        
        if (isSpreadsheet) {
          console.log(`[validate-fs] Attempting xlsx parse from storage: ${doc.file_path}`);
          const xlsxText = await parseXlsxFromStorage(supabase, doc.file_path);
          if (xlsxText) {
            uploadedTotals = await extractTotalsViaAI(xlsxText, documentType);
          }
        }
      }
    }

    // If AI extracted an as-of date and caller did not pin a periodEnd, re-derive TB totals
    // anchored on that date so YTD equity rollup matches the uploaded BS's reporting moment.
    if (
      documentType === 'balance_sheet' &&
      uploadedTotals?.asOfDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(uploadedTotals.asOfDate) &&
      !periodEnd
    ) {
      const prevEnd = effectivePeriodEnd;
      effectivePeriodEnd = uploadedTotals.asOfDate;
      console.log(`[validate-fs] Re-deriving with extracted asOfDate=${effectivePeriodEnd} (was ${prevEnd})`);
      derivedTotals = deriveTotalsFromTrialBalance(accounts, documentType, effectivePeriodStart, effectivePeriodEnd, fiscalYearEnd);
    } else if (documentType === 'balance_sheet' && !uploadedTotals?.asOfDate) {
      console.warn(`[validate-fs] No as-of date extracted from uploaded BS; YTD equity rollup may be off`);
    }

    // For income_statement, scope TB-derived totals to the uploaded P&L's reporting window.
    let isPeriodScoped = false;
    if (documentType === 'income_statement' && uploadedTotals) {
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      const extractedStart = dateRe.test(uploadedTotals.periodStart || '') ? uploadedTotals.periodStart! : null;
      const extractedEnd = dateRe.test(uploadedTotals.periodEnd || '') ? uploadedTotals.periodEnd! : null;
      if ((extractedStart && !periodStart) || (extractedEnd && !periodEnd)) {
        if (extractedStart && !periodStart) effectivePeriodStart = extractedStart;
        if (extractedEnd && !periodEnd) effectivePeriodEnd = extractedEnd;
        console.log(`[validate-fs] Re-deriving IS with extracted period ${effectivePeriodStart} → ${effectivePeriodEnd}`);
        derivedTotals = deriveTotalsFromTrialBalance(accounts, documentType, effectivePeriodStart, effectivePeriodEnd, fiscalYearEnd);
        isPeriodScoped = true;
      } else if (!extractedStart && !extractedEnd) {
        console.warn(`[validate-fs] No reporting period extracted from uploaded P&L; TB totals span all available months`);
      }
    }


    // Get document name
    let documentName = "Uploaded Document";
    if (documentId) {
      const { data: docInfo } = await supabase
        .from("documents")
        .select("name")
        .eq("id", documentId)
        .single();
      if (docInfo?.name) documentName = docInfo.name;
    }

    // If uploadedTotals is entirely missing, return extraction failed
    if (!uploadedTotals) {
      const failedResult = {
        documentType,
        documentName,
        overallScore: null,
        lineItems: [],
        validatedAt: new Date().toISOString(),
        extractionFailed: true,
        summary: "Could not extract totals from the uploaded document. Please verify the file contains readable financial data.",
        derivedTotals,
      };

      if (documentId) {
        await supabase
          .from("documents")
          .update({ validation_result: failedResult, validated_at: new Date().toISOString() })
          .eq("id", documentId);
      }

      return new Response(JSON.stringify(failedResult), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build comparison
    const lineItems = buildLineItems(documentType, derivedTotals, uploadedTotals);

    const scorableItems = lineItems.filter(l => l.status !== 'extraction_failed');
    const matchCount = scorableItems.filter(l => l.status === 'match').length;
    const minorCount = scorableItems.filter(l => l.status === 'minor').length;
    const overallScore = scorableItems.length > 0
      ? Math.round(((matchCount * 100) + (minorCount * 50)) / scorableItems.length)
      : null;

    // Balance checks
    let isBalanced: boolean | undefined;
    let tbIsBalanced: boolean | undefined;

    if (documentType === 'balance_sheet') {
      tbIsBalanced = Math.abs((derivedTotals.totalAssets || 0) - ((derivedTotals.totalLiabilities || 0) + (derivedTotals.totalEquity || 0))) < 1;
      const uAssets = uploadedTotals.totalAssets;
      const uLiab = uploadedTotals.totalLiabilities;
      const uEquity = uploadedTotals.totalEquity;
      if (uAssets != null && uLiab != null && uEquity != null) {
        isBalanced = Math.abs(uAssets - (uLiab + uEquity)) < 1;
      }
    }

    // Summary
    const significantCount = lineItems.filter(l => l.status === 'significant').length;
    const failedCount = lineItems.filter(l => l.status === 'extraction_failed').length;
    let summary = '';
    if (failedCount > 0 && failedCount === lineItems.length) {
      summary = 'Could not extract any totals from the uploaded document.';
    } else if (significantCount > 0) {
      summary = `Found ${significantCount} significant variance(s). Review the discrepancies and investigate the differences.`;
    } else if (minorCount > 0) {
      summary = `Good match with ${minorCount} minor variance(s). These may be due to rounding differences.`;
    } else if (failedCount > 0) {
      summary = `${matchCount} line items match. ${failedCount} could not be extracted from the document.`;
    } else {
      summary = 'Perfect match! The uploaded document aligns with Trial Balance-derived values.';
    }

    // Append as-of date context to the summary so users know what date the TB was anchored on
    if (documentType === 'balance_sheet') {
      if (uploadedTotals.asOfDate) {
        summary += ` (Anchored on as-of date ${uploadedTotals.asOfDate}.)`;
      } else {
        summary += ` Note: could not determine the balance sheet as-of date — derived TB values use the latest available period. Equity variance may reflect period-end timing only.`;
      }
    }

    if (documentType === 'income_statement') {
      if (isPeriodScoped) {
        summary += ` (Scoped to ${effectivePeriodStart || 'earliest'} → ${effectivePeriodEnd || 'latest'}.)`;
      } else if (!effectivePeriodStart && !effectivePeriodEnd) {
        summary += ` Note: could not determine the P&L reporting period — derived TB values may span a different range than the uploaded document.`;
      }
    }


    // Build diagnostics (only meaningful for income_statement)
    let diagnostics: {
      tbBreakdown: TBBreakdownItem[];
      uploadedBreakdown: NonNullable<DerivedTotals['lineDetails']>;
      missingAccounts: MissingAccount[];
    } | undefined;
    if (documentType === 'income_statement') {
      const tbBreakdown: TBBreakdownItem[] = [];
      // Re-derive once more with breakdownOut populated (cheap, in-memory).
      deriveTotalsFromTrialBalance(accounts, documentType, effectivePeriodStart, effectivePeriodEnd, fiscalYearEnd, tbBreakdown);
      tbBreakdown.sort((a, b) => Math.abs(b.totalInScope) - Math.abs(a.totalInScope));
      const uploadedBreakdown = (uploadedTotals.lineDetails || []).slice(0, 100);
      const missingAccounts = computeMissingAccounts(uploadedBreakdown, accounts);
      diagnostics = { tbBreakdown: tbBreakdown.slice(0, 80), uploadedBreakdown, missingAccounts };
      if (missingAccounts.length > 0) {
        const totalMissing = missingAccounts.reduce((s, m) => s + Math.abs(m.uploadedAmount), 0);
        summary += ` Detected ${missingAccounts.length} uploaded line item(s) with no matching TB account (${formatCurrencyForSummary(totalMissing)} unmatched).`;
      }
    }

    const result = {
      documentType,
      documentName,
      overallScore,
      lineItems,
      validatedAt: new Date().toISOString(),
      isBalanced,
      tbIsBalanced,
      extractionFailed: false,
      summary,
      derivedTotals,
      diagnostics,
    };

    if (documentId) {
      await supabase
        .from("documents")
        .update({ validation_result: result, validated_at: new Date().toISOString() })
        .eq("id", documentId);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
