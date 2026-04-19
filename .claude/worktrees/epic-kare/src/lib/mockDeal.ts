/**
 * Mock Deal Data for Workbook Demo
 * Generates a fully-populated DealData for "Acme Industrial Supply Co."
 * - 36 months (Jan-2022 → Dec-2024), FYE December
 * - Balanced TB: BS Total + IS Total = 0 per period (equity is balancing plug)
 * - 3 adjustments, 1 reclassification, AR/AP aging, fixed assets, customers/vendors
 */
import type { DealData, PeriodDef, TrialBalanceEntry, Adjustment, Reclassification, AgingEntry, FixedAssetEntry, CustomerEntry, VendorEntry, SupplementaryDebtItem, SupplementaryLeaseItem } from "./workbook-types";
import { buildTbIndex, groupByFiscalYear, buildAggregatePeriods } from "./calculations";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function pid(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shortLabel(year: number, month: number): string {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MONTHS[month - 1]}-${String(year).slice(-2)}`;
}

// Build 36 monthly periods: Jan-2022 → Dec-2024
function buildPeriods(): PeriodDef[] {
  const periods: PeriodDef[] = [];
  for (let y = 2022; y <= 2024; y++) {
    for (let m = 1; m <= 12; m++) {
      const id = pid(y, m);
      periods.push({
        id,
        label: shortLabel(y, m),
        shortLabel: shortLabel(y, m),
        year: y,
        month: m,
        date: new Date(y, m - 1, 1),
        startDate: `${id}-01`,
        endDate: new Date(y, m, 0).toISOString().split("T")[0],
      });
    }
  }
  return periods;
}

// Revenue grows from ~420K/mo in Jan-2022 to ~520K/mo in Dec-2024
// with a seasonal uplift in Q4 (+5%) and mild dip in Feb (–3%)
function monthlyRevenue(year: number, month: number): number {
  const base = 420000;
  const yearGrowth = (year - 2022) * 0.08; // 8% YoY
  const seasonal = [0, -0.03, 0.01, 0.02, 0.02, 0.03, 0.02, 0.01, 0.02, 0.04, 0.05, 0.06][month - 1];
  return Math.round(base * (1 + yearGrowth) * (1 + seasonal));
}

// ─────────────────────────────────────────────
// TB Account Definitions
// IS convention: Revenue is negative (credit), expenses are positive (debit)
// BS convention: Assets positive, Liabilities/Equity negative
// ─────────────────────────────────────────────

function buildTrialBalance(periods: PeriodDef[]): TrialBalanceEntry[] {
  // We'll build balances per account then compute equity as balancing plug

  // ── Collect IS entries first ──
  const isEntries: Omit<TrialBalanceEntry, "balances">[] = [
    { accountId: "1000", accountName: "Sales Revenue", fsType: "IS", fsLineItem: "Revenue", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "2000", accountName: "Cost of Goods Sold", fsType: "IS", fsLineItem: "Cost of Goods Sold", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "3100", accountName: "Officer Salaries", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Officer Compensation", subAccount2: "", subAccount3: "" },
    { accountId: "3200", accountName: "Wages & Salaries", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Wages", subAccount2: "", subAccount3: "" },
    { accountId: "3300", accountName: "Payroll Taxes", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Payroll Taxes", subAccount2: "", subAccount3: "" },
    { accountId: "4100", accountName: "Rent Expense", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Facilities", subAccount2: "", subAccount3: "" },
    { accountId: "4200", accountName: "Utilities", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Utilities", subAccount2: "", subAccount3: "" },
    { accountId: "4300", accountName: "Insurance", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Insurance", subAccount2: "", subAccount3: "" },
    { accountId: "4400", accountName: "Software & IT", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Technology", subAccount2: "", subAccount3: "" },
    { accountId: "5100", accountName: "Interest Expense", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "5200", accountName: "Depreciation & Amortization", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "5300", accountName: "Income Tax Expense", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "", subAccount2: "", subAccount3: "" },
  ];

  // ── BS entries (excluding equity — computed as plug) ──
  const bsNonEquityEntries: Omit<TrialBalanceEntry, "balances">[] = [
    { accountId: "6100", accountName: "Cash and Cash Equivalents", fsType: "BS", fsLineItem: "Cash and cash equivalents", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "6200", accountName: "Accounts Receivable", fsType: "BS", fsLineItem: "Accounts receivable", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "6300", accountName: "Inventory", fsType: "BS", fsLineItem: "Other current assets", subAccount1: "Inventory", subAccount2: "", subAccount3: "" },
    { accountId: "6400", accountName: "Prepaid Expenses", fsType: "BS", fsLineItem: "Other current assets", subAccount1: "Prepaid Expenses", subAccount2: "", subAccount3: "" },
    { accountId: "7100", accountName: "Equipment, Gross", fsType: "BS", fsLineItem: "Fixed assets", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "7200", accountName: "Accumulated Depreciation", fsType: "BS", fsLineItem: "Fixed assets", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "7300", accountName: "Other Assets", fsType: "BS", fsLineItem: "Other assets", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "8100", accountName: "Accounts Payable", fsType: "BS", fsLineItem: "Current liabilities", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "8200", accountName: "Accrued Liabilities", fsType: "BS", fsLineItem: "Other current liabilities", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "8300", accountName: "Deferred Revenue", fsType: "BS", fsLineItem: "Other current liabilities", subAccount1: "", subAccount2: "", subAccount3: "" },
    { accountId: "9100", accountName: "Long-term Debt", fsType: "BS", fsLineItem: "Long term liabilities", subAccount1: "", subAccount2: "", subAccount3: "" },
  ];

  // Equity entry — balances computed last
  const equityMeta: Omit<TrialBalanceEntry, "balances"> = {
    accountId: "9200",
    accountName: "Retained Earnings / Equity",
    fsType: "BS",
    fsLineItem: "Equity",
    subAccount1: "",
    subAccount2: "",
    subAccount3: "",
  };

  // Build IS balances
  // Revenue: negative (credit convention in TB)
  const isBalances: Record<string, Record<string, number>> = {};
  for (const e of isEntries) {
    isBalances[e.accountId] = {};
  }

  // Cumulative cash tracking for BS
  let cumulativeCash = 245000; // Starting cash Jan-2022
  const bsBalances: Record<string, Record<string, number>> = {};
  for (const e of bsNonEquityEntries) {
    bsBalances[e.accountId] = {};
  }

  for (const p of periods) {
    const rev = monthlyRevenue(p.year, p.month);
    const cogs = Math.round(rev * 0.52); // ~48% gross margin (COGS = 52% of Rev)
    const officerSal = 25000;
    const wages = 30000 + (p.year - 2022) * 1000;
    const payrollTax = Math.round((officerSal + wages) * 0.08);
    const rent = 12000;
    const utilities = 2800 + (p.month >= 6 && p.month <= 8 ? 500 : 0); // summer spike
    const insurance = 4000;
    const software = 6000 + (p.year - 2022) * 500;
    const interest = 4000 - (p.year - 2022) * 400 - Math.floor((p.month - 1) / 12) * 200;
    const depreciation = 8000;
    const taxes = Math.round(rev * 0.025); // simplified ~2.5% of revenue

    // IS convention: revenue = negative, expenses = positive
    isBalances["1000"][p.id] = -rev;
    isBalances["2000"][p.id] = cogs;
    isBalances["3100"][p.id] = officerSal;
    isBalances["3200"][p.id] = wages;
    isBalances["3300"][p.id] = payrollTax;
    isBalances["4100"][p.id] = rent;
    isBalances["4200"][p.id] = utilities;
    isBalances["4300"][p.id] = insurance;
    isBalances["4400"][p.id] = software;
    isBalances["5100"][p.id] = Math.max(interest, 1500);
    isBalances["5200"][p.id] = depreciation;
    isBalances["5300"][p.id] = taxes;

    // Net income for this period (IS sum = all IS accounts)
    const netIncome = -rev + cogs + officerSal + wages + payrollTax + rent + utilities + insurance + software + Math.max(interest, 1500) + depreciation + taxes;
    // Net income is negative (profit) in debit convention — cash increases by |netIncome|
    const cashChange = -netIncome;

    cumulativeCash += cashChange;

    // AR: ~45 days DSO = 1.5 months revenue
    bsBalances["6100"][p.id] = Math.max(cumulativeCash, 50000);
    bsBalances["6200"][p.id] = Math.round(rev * 1.5); // ~45 DSO
    bsBalances["6300"][p.id] = 180000 + (p.year - 2022) * 10000; // growing inventory
    bsBalances["6400"][p.id] = 30000;
    bsBalances["7100"][p.id] = 960000; // gross PP&E
    bsBalances["7200"][p.id] = -(288000 + (p.year * 12 + p.month - (2022 * 12 + 1)) * 8000); // accumulated depr (negative)
    bsBalances["7300"][p.id] = 50000;
    bsBalances["8100"][p.id] = -Math.round(cogs * 0.55); // ~30 days DPO of COGS/month * 0.55
    bsBalances["8200"][p.id] = -45000;
    bsBalances["8300"][p.id] = -25000;
    bsBalances["9100"][p.id] = -(800000 - (p.year * 12 + p.month - (2022 * 12 + 1)) * 10000); // declining debt
  }

  // Equity is the per-period balancing plug: equity[p] = -(bsNonEquity[p] + IS[p])
  // This is the ONLY formula that satisfies the TB identity for every single period:
  //   bsNonEquity[p] + equity[p] + IS[p] = 0  ✓
  // The Balance Sheet tab uses calcDisplayEquity() (cumulative RE) for display — not this plug.
  const equityBalances: Record<string, number> = {};
  for (const p of periods) {
    let bsSum = 0;
    for (const e of bsNonEquityEntries) bsSum += bsBalances[e.accountId][p.id] ?? 0;
    let isSum = 0;
    for (const e of isEntries) isSum += isBalances[e.accountId][p.id] ?? 0;
    equityBalances[p.id] = -(bsSum + isSum);
  }

  // Assemble final TB
  const result: TrialBalanceEntry[] = [];
  for (const e of isEntries) {
    result.push({ ...e, balances: isBalances[e.accountId] });
  }
  for (const e of bsNonEquityEntries) {
    result.push({ ...e, balances: bsBalances[e.accountId] });
  }
  result.push({ ...equityMeta, balances: equityBalances });

  return result;
}

// ─────────────────────────────────────────────
// Adjustments
// ─────────────────────────────────────────────

function buildAdjustments(periods: PeriodDef[]): Adjustment[] {
  // adj-1: Officer Salary Normalization — $10K/mo addback
  const adj1Amounts: Record<string, number> = {};
  for (const p of periods) {
    adj1Amounts[p.id] = 10000;
  }

  // adj-2: One-Time Legal Settlement — only Jun-2023
  const adj2Amounts: Record<string, number> = {};
  for (const p of periods) {
    adj2Amounts[p.id] = p.id === "2023-06" ? 185000 : 0;
  }

  // adj-3: Pro Forma Market Rent — rent goes UP to $13.5K → decreases EBITDA
  const adj3Amounts: Record<string, number> = {};
  for (const p of periods) {
    adj3Amounts[p.id] = -1500;
  }

  return [
    {
      id: "adj-1",
      type: "MA",
      label: "Officer Salary Normalization",
      tbAccountNumber: "3100",
      intent: "normalize_down_expense",
      notes: "Owner compensation above market rate. Normalizing to $180K/yr market equivalent.",
      amounts: adj1Amounts,
    },
    {
      id: "adj-2",
      type: "DD",
      label: "One-Time Legal Settlement",
      tbAccountNumber: "4300",
      intent: "remove_expense",
      notes: "Non-recurring legal settlement in June 2023. Excluded from normalized earnings.",
      amounts: adj2Amounts,
    },
    {
      id: "adj-3",
      type: "PF",
      label: "Pro Forma Market Rent",
      tbAccountNumber: "4100",
      intent: "pro_forma_expense",
      notes: "Rent below market. Pro forma adjustment to reflect market rate of $13,500/mo.",
      amounts: adj3Amounts,
    },
  ];
}

// ─────────────────────────────────────────────
// Reclassifications
// ─────────────────────────────────────────────

function buildReclassifications(periods: PeriodDef[]): Reclassification[] {
  const amounts: Record<string, number> = {};
  for (const p of periods) {
    amounts[p.id] = 2000;
  }
  return [
    {
      id: "reclass-1",
      label: "Officer Auto Expense to Compensation",
      fromAccount: "4200",
      toAccount: "3100",
      amounts,
    },
  ];
}

// ─────────────────────────────────────────────
// Supplementary Data
// ─────────────────────────────────────────────

function buildSupplementary(): { debtSchedule: SupplementaryDebtItem[]; leaseObligations: SupplementaryLeaseItem[] } {
  return {
    debtSchedule: [
      {
        lender: "First National Bank — Term Loan",
        balance: 450000,
        interestRate: 5.5,
        maturityDate: "2027-06-30",
        type: "Term Loan",
      },
    ],
    leaseObligations: [
      {
        description: "Warehouse Lease (12,000 sq ft)",
        leaseType: "Operating",
        annualPayment: 144000,
        remainingTerm: 3,
        expirationDate: "2027-12-31",
      },
    ],
  };
}

// ─────────────────────────────────────────────

// AR Aging — totals tie to TB AR balance (rev × 1.5) for each period
// Dec-24 TB AR: round(516,432 × 1.5) = 774,648
// Nov-24 TB AR: round(511,560 × 1.5) = 767,340
function buildARaging(): Record<string, AgingEntry[]> {
  return {
    "2024-12": [
      { name: "Acme Corp",         current: 330000, days1to30:      0, days31to60:     0, days61to90: 0, days90plus:      0, total: 330000 },
      { name: "Beta LLC",          current: 150000, days1to30:  62000, days31to60:     0, days61to90: 0, days90plus:      0, total: 212000 },
      { name: "Gamma Industries",  current:  80000, days1to30:      0, days31to60: 50000, days61to90: 0, days90plus:      0, total: 130000 },
      { name: "Delta Co",          current:      0, days1to30:      0, days31to60:     0, days61to90: 0, days90plus:  15648, total:  15648 },
      { name: "All Others",        current:  87000, days1to30:      0, days31to60:     0, days61to90: 0, days90plus:      0, total:  87000 },
    ],
    "2024-11": [
      { name: "Acme Corp",         current: 325000, days1to30:      0, days31to60:     0, days61to90: 0, days90plus:      0, total: 325000 },
      { name: "Beta LLC",          current: 200000, days1to30:  55000, days31to60:     0, days61to90: 0, days90plus:      0, total: 255000 },
      { name: "All Others",        current: 187340, days1to30:      0, days31to60:     0, days61to90: 0, days90plus:      0, total: 187340 },
    ],
  };
}

// AP Aging — totals tie to TB AP balance (round(cogs × 0.52) × 0.55) for each period
// Dec-24 TB AP: round(268,545 × 0.55) = 147,700
// Nov-24 TB AP: round(266,011 × 0.55) = 146,306
function buildAPaging(): Record<string, AgingEntry[]> {
  return {
    "2024-12": [
      { name: "Primary Supplier Co.",   current: 100000, days1to30: 20000, days31to60: 0, days61to90: 0, days90plus: 0, total: 120000 },
      { name: "Secondary Supplier LLC", current:  18000, days1to30:     0, days31to60: 0, days61to90: 0, days90plus: 0, total:  18000 },
      { name: "Freight Logistics Inc.", current:      0, days1to30:  7000, days31to60: 0, days61to90: 0, days90plus: 0, total:   7000 },
      { name: "Metro Utilities",        current:   2700, days1to30:     0, days31to60: 0, days61to90: 0, days90plus: 0, total:   2700 },
    ],
    "2024-11": [
      { name: "Primary Supplier Co.",   current: 100000, days1to30: 18000, days31to60: 0, days61to90: 0, days90plus: 0, total: 118000 },
      { name: "Secondary Supplier LLC", current:  18000, days1to30:     0, days31to60: 0, days61to90: 0, days90plus: 0, total:  18000 },
      { name: "Metro Utilities",        current:  10306, days1to30:     0, days31to60: 0, days61to90: 0, days90plus: 0, total:  10306 },
    ],
  };
}

// Fixed Assets — Accum Depr and NBV updated to match TB at Dec-24
// TB: Equipment gross $960k, Accum Depr = 288k + (35 months × $8k/mo) = $568k, NBV = $392k
function buildFixedAssets(): FixedAssetEntry[] {
  return [
    { category: "Machinery & Equipment",  description: "CNC Milling Machine & Assembly Equipment", acquisitionDate: "2020-01-15", cost: 720000, accumulatedDepreciation: 432000, netBookValue: 288000 },
    { category: "Vehicles",               description: "Delivery Fleet (4 trucks)",                 acquisitionDate: "2021-06-01", cost: 180000, accumulatedDepreciation: 108000, netBookValue:  72000 },
    { category: "Leasehold Improvements", description: "Warehouse buildout & office renovation",    acquisitionDate: "2022-03-01", cost:  60000, accumulatedDepreciation:  28000, netBookValue:  32000 },
  ];
}

function buildTopCustomers(): Record<string, CustomerEntry[]> {
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const fy22Rev = months.reduce((s, m) => s + monthlyRevenue(2022, m), 0); // exact TB sum
  const fy23Rev = months.reduce((s, m) => s + monthlyRevenue(2023, m), 0);
  const fy24Rev = months.reduce((s, m) => s + monthlyRevenue(2024, m), 0);

  return {
    "annual-2022": [
      { name: "Acme Corp", revenue: Math.round(fy22Rev * 0.28), percentage: 28 },
      { name: "Beta LLC", revenue: Math.round(fy22Rev * 0.18), percentage: 18 },
      { name: "Gamma Industries", revenue: Math.round(fy22Rev * 0.12), percentage: 12 },
      { name: "Delta Co", revenue: Math.round(fy22Rev * 0.08), percentage: 8 },
      { name: "All Others", revenue: Math.round(fy22Rev * 0.34), percentage: 34 },
    ],
    "annual-2023": [
      { name: "Acme Corp", revenue: Math.round(fy23Rev * 0.31), percentage: 31 },
      { name: "Beta LLC", revenue: Math.round(fy23Rev * 0.17), percentage: 17 },
      { name: "Gamma Industries", revenue: Math.round(fy23Rev * 0.14), percentage: 14 },
      { name: "Delta Co", revenue: Math.round(fy23Rev * 0.07), percentage: 7 },
      { name: "All Others", revenue: Math.round(fy23Rev * 0.31), percentage: 31 },
    ],
    "annual-2024": [
      { name: "Acme Corp", revenue: Math.round(fy24Rev * 0.34), percentage: 34 },
      { name: "Beta LLC", revenue: Math.round(fy24Rev * 0.16), percentage: 16 },
      { name: "Gamma Industries", revenue: Math.round(fy24Rev * 0.13), percentage: 13 },
      { name: "Delta Co", revenue: Math.round(fy24Rev * 0.09), percentage: 9 },
      { name: "All Others", revenue: Math.round(fy24Rev * 0.28), percentage: 28 },
    ],
  };
}

function buildTopVendors(): Record<string, VendorEntry[]> {
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const fy22Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2022, m) * 0.52), 0); // exact TB sum
  const fy23Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2023, m) * 0.52), 0);
  const fy24Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2024, m) * 0.52), 0);

  const makeVendors = (totalSpend: number): VendorEntry[] => {
    const primary = Math.round(totalSpend * 0.38);
    const secondary = Math.round(totalSpend * 0.22);
    const freight = Math.round(totalSpend * 0.18);
    const others = totalSpend - primary - secondary - freight; // absorb rounding residual
    return [
      { name: "Primary Supplier Co.", spend: primary, percentage: 38 },
      { name: "Secondary Supplier LLC", spend: secondary, percentage: 22 },
      { name: "Freight Logistics Inc.", spend: freight, percentage: 18 },
      { name: "All Others", spend: others, percentage: 22 },
    ];
  };

  return {
    "annual-2022": makeVendors(fy22Cogs),
    "annual-2023": makeVendors(fy23Cogs),
    "annual-2024": makeVendors(fy24Cogs),
  };
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────

export function createMockDealData(): DealData {
  const periods = buildPeriods();
  const fiscalYears = groupByFiscalYear(periods, 12); // FYE December
  const aggregatePeriods = buildAggregatePeriods(periods, fiscalYears, 12);
  const trialBalance = buildTrialBalance(periods);
  const tbIndex = buildTbIndex(trialBalance);
  const adjustments = buildAdjustments(periods);
  const reclassifications = buildReclassifications(periods);

  return {
    deal: {
      projectId: "demo",
      projectName: "Acme Industrial Supply — Demo",
      clientName: "Shepi Capital Advisors",
      targetCompany: "Acme Industrial Supply Co.",
      industry: "Manufacturing / Distribution",
      transactionType: "Buy-Side",
      fiscalYearEnd: 12,
      periods,
      fiscalYears,
      aggregatePeriods,
    },
    accounts: trialBalance.map(e => ({
      accountId: e.accountId,
      accountName: e.accountName,
      fsType: e.fsType,
      fsLineItem: e.fsLineItem,
      subAccount1: e.subAccount1,
      subAccount2: e.subAccount2,
      subAccount3: e.subAccount3,
    })),
    trialBalance,
    adjustments,
    reclassifications,
    tbIndex,
    monthDates: periods.map(p => p.date),
    arAging: buildARaging(),
    apAging: buildAPaging(),
    fixedAssets: buildFixedAssets(),
    topCustomers: buildTopCustomers(),
    topVendors: buildTopVendors(),
    addbacks: {
      interest: ["5100"],
      depreciation: ["5200"],
      taxes: ["5300"],
    },
    supplementary: buildSupplementary(),
  };
}

// ─────────────────────────────────────────────
// Mock Bank Statement Data (for Proof of Cash)
// ─────────────────────────────────────────────

export interface MockBankStatement {
  id: string;
  documentId: string | null;
  documentName?: string;
  accountNumber?: string;
  bankName?: string;
  periodStart: string | null;
  periodEnd: string | null;
  summary: {
    openingBalance?: number;
    closingBalance?: number;
    totalCredits?: number;
    totalDebits?: number;
    transactionCount?: number;
  };
  createdAt: string;
}

export function createMockBankStatements(): MockBankStatement[] {
  const periods = buildPeriods();

  // Seed: starting opening balance = 245,000
  // Each month: credits ≈ revenue (inflows), debits ≈ COGS + OpEx + debt service
  // Closing = opening + credits - debits
  // We calibrate so closing ≈ the TB Cash balance for that period

  let openingBalance = 245000;
  const statements: MockBankStatement[] = [];

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const rev = monthlyRevenue(p.year, p.month);

    // Credits: revenue collections (with ~5 day lag = 98% collected this month)
    const totalCredits = Math.round(rev * 0.98);

    // Debits: COGS + payroll + rent + utilities + insurance + software + debt service + owner draws
    const cogs = Math.round(rev * 0.52);
    const payroll = 25000 + 30000 + (p.year - 2022) * 1000 + Math.round((55000 + (p.year - 2022) * 1000) * 0.08);
    const opex = 12000 + 2800 + 4000 + 6000 + (p.year - 2022) * 500;
    const debtService = 10000; // monthly principal + interest
    const ownerDraw = 3500;
    const totalDebits = Math.round(cogs * 0.85 + payroll + opex + debtService + ownerDraw); // COGS partially credit (net)

    const closingBalance = openingBalance + totalCredits - totalDebits;

    statements.push({
      id: `mock-bank-${p.id}`,
      documentId: null,
      documentName: `Bank Statement — ${p.label}`,
      accountNumber: "****4821",
      bankName: "First National Bank",
      periodStart: p.startDate ?? null,
      periodEnd: p.endDate ?? null,
      summary: {
        openingBalance,
        closingBalance,
        totalCredits,
        totalDebits,
        transactionCount: Math.round(totalCredits / 15000) + Math.round(totalDebits / 8000),
      },
      createdAt: new Date(p.year, p.month - 1, 28).toISOString(),
    });

    openingBalance = closingBalance;
  }

  return statements;
}

export function createMockTransferClassifications(): Map<string, { interbank: number; owner: number }> {
  const periods = buildPeriods();
  const map = new Map<string, { interbank: number; owner: number }>();
  for (const p of periods) {
    map.set(p.id, { interbank: 0, owner: 3500 });
  }
  return map;
}
