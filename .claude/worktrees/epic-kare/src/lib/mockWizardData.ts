/**
 * Mock Wizard Data for WizardDemo
 * Generates a fully-populated ProjectData for "Acme Industrial Supply Co."
 * Uses the same underlying revenue/cost model as mockDeal.ts for consistency.
 * All wizard_data keys match the shapes expected by their respective wizard sections.
 */
import type { ProjectData } from "@/pages/Project";
import { generatePeriods } from "@/lib/periodUtils";
import { createMockBankStatements } from "@/lib/mockDeal";

// ─────────────────────────────────────────────
// Shared helpers (mirrored from mockDeal.ts)
// ─────────────────────────────────────────────

function pid(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthlyRevenue(year: number, month: number): number {
  const base = 420000;
  const yearGrowth = (year - 2022) * 0.08;
  const seasonal = [0, -0.03, 0.01, 0.02, 0.02, 0.03, 0.02, 0.01, 0.02, 0.04, 0.05, 0.06][month - 1];
  return Math.round(base * (1 + yearGrowth) * (1 + seasonal));
}

// ─────────────────────────────────────────────
// Build wizard_data sections
// ─────────────────────────────────────────────

function buildChartOfAccounts() {
  return {
    accounts: [
      { id: 1,  accountNumber: "1000", accountName: "Sales Revenue",                fsType: "IS", category: "Revenue" },
      { id: 2,  accountNumber: "2000", accountName: "Cost of Goods Sold",            fsType: "IS", category: "Cost of Goods Sold" },
      { id: 3,  accountNumber: "3100", accountName: "Officer Salaries",              fsType: "IS", category: "Payroll & Related" },
      { id: 4,  accountNumber: "3200", accountName: "Wages & Salaries",              fsType: "IS", category: "Payroll & Related" },
      { id: 5,  accountNumber: "3300", accountName: "Payroll Taxes",                 fsType: "IS", category: "Payroll & Related" },
      { id: 6,  accountNumber: "4100", accountName: "Rent Expense",                  fsType: "IS", category: "Operating expenses" },
      { id: 7,  accountNumber: "4200", accountName: "Utilities",                     fsType: "IS", category: "Operating expenses" },
      { id: 8,  accountNumber: "4300", accountName: "Insurance",                     fsType: "IS", category: "Operating expenses" },
      { id: 9,  accountNumber: "4400", accountName: "Software & IT",                 fsType: "IS", category: "Operating expenses" },
      { id: 10, accountNumber: "5100", accountName: "Interest Expense",              fsType: "IS", category: "Other expense (income)" },
      { id: 11, accountNumber: "5200", accountName: "Depreciation & Amortization",   fsType: "IS", category: "Other expense (income)" },
      { id: 12, accountNumber: "5300", accountName: "Income Tax Expense",            fsType: "IS", category: "Other expense (income)" },
      { id: 13, accountNumber: "6100", accountName: "Cash and Cash Equivalents",     fsType: "BS", category: "Cash and cash equivalents" },
      { id: 14, accountNumber: "6200", accountName: "Accounts Receivable",           fsType: "BS", category: "Accounts receivable" },
      { id: 15, accountNumber: "6300", accountName: "Inventory",                     fsType: "BS", category: "Other current assets" },
      { id: 16, accountNumber: "6400", accountName: "Prepaid Expenses",              fsType: "BS", category: "Other current assets" },
      { id: 17, accountNumber: "7100", accountName: "Equipment, Gross",              fsType: "BS", category: "Fixed assets" },
      { id: 18, accountNumber: "7200", accountName: "Accumulated Depreciation",      fsType: "BS", category: "Fixed assets" },
      { id: 19, accountNumber: "7300", accountName: "Other Assets",                  fsType: "BS", category: "Other assets" },
      { id: 20, accountNumber: "8100", accountName: "Accounts Payable",              fsType: "BS", category: "Current liabilities" },
      { id: 21, accountNumber: "8200", accountName: "Accrued Liabilities",           fsType: "BS", category: "Other current liabilities" },
      { id: 22, accountNumber: "8300", accountName: "Deferred Revenue",              fsType: "BS", category: "Other current liabilities" },
      { id: 23, accountNumber: "9100", accountName: "Long-term Debt",                fsType: "BS", category: "Long term liabilities" },
      { id: 24, accountNumber: "9200", accountName: "Retained Earnings / Equity",   fsType: "BS", category: "Equity" },
    ],
  };
}

function buildTrialBalance() {
  const periods = generatePeriods(1, 2022, 12, 2024);

  // Build monthly values for each account
  const accounts: Record<string, Record<string, number>> = {
    "1000": {}, "2000": {}, "3100": {}, "3200": {}, "3300": {},
    "4100": {}, "4200": {}, "4300": {}, "4400": {}, "5100": {},
    "5200": {}, "5300": {},
    "6100": {}, "6200": {}, "6300": {}, "6400": {},
    "7100": {}, "7200": {}, "7300": {},
    "8100": {}, "8200": {}, "8300": {},
    "9100": {}, "9200": {},
  };

  let cumulativeCash = 245000;

  for (const p of periods) {
    const rev = monthlyRevenue(p.year, p.month);
    const cogs = Math.round(rev * 0.52);
    const officerSal = 25000;
    const wages = 30000 + (p.year - 2022) * 1000;
    const payrollTax = Math.round((officerSal + wages) * 0.08);
    const rent = 12000;
    const utilities = 2800 + (p.month >= 6 && p.month <= 8 ? 500 : 0);
    const insurance = 4000;
    const software = 6000 + (p.year - 2022) * 500;
    const interest = Math.max(4000 - (p.year - 2022) * 400, 1500);
    const depreciation = 8000;
    const taxes = Math.round(rev * 0.025);

    const id = p.id;
    accounts["1000"][id] = -rev;
    accounts["2000"][id] = cogs;
    accounts["3100"][id] = officerSal;
    accounts["3200"][id] = wages;
    accounts["3300"][id] = payrollTax;
    accounts["4100"][id] = rent;
    accounts["4200"][id] = utilities;
    accounts["4300"][id] = insurance;
    accounts["4400"][id] = software;
    accounts["5100"][id] = interest;
    accounts["5200"][id] = depreciation;
    accounts["5300"][id] = taxes;

    const netIncome = -rev + cogs + officerSal + wages + payrollTax + rent + utilities + insurance + software + interest + depreciation + taxes;
    cumulativeCash += -netIncome;

    accounts["6100"][id] = Math.max(cumulativeCash, 50000);
    accounts["6200"][id] = Math.round(rev * 1.5);
    accounts["6300"][id] = 180000 + (p.year - 2022) * 10000;
    accounts["6400"][id] = 30000;
    accounts["7100"][id] = 960000;
    accounts["7200"][id] = -(288000 + (p.year * 12 + p.month - (2022 * 12 + 1)) * 8000);
    accounts["7300"][id] = 50000;
    accounts["8100"][id] = -Math.round(cogs * 0.55);
    accounts["8200"][id] = -45000;
    accounts["8300"][id] = -25000;
    accounts["9100"][id] = -(800000 - (p.year * 12 + p.month - (2022 * 12 + 1)) * 10000);
  }

  // Compute equity as balancing plug per period
  for (const p of periods) {
    const id = p.id;
    const isAccounts = ["1000","2000","3100","3200","3300","4100","4200","4300","4400","5100","5200","5300"];
    const bsAccounts = ["6100","6200","6300","6400","7100","7200","7300","8100","8200","8300","9100"];
    const isSum = isAccounts.reduce((s, a) => s + (accounts[a][id] ?? 0), 0);
    const bsSum = bsAccounts.reduce((s, a) => s + (accounts[a][id] ?? 0), 0);
    accounts["9200"][id] = -(bsSum + isSum);
  }

  const COA_META: Array<{ accountNumber: string; accountName: string; fsType: string; fsLineItem: string; subAccount1: string }> = [
    { accountNumber: "1000", accountName: "Sales Revenue",              fsType: "IS", fsLineItem: "Revenue",                  subAccount1: "" },
    { accountNumber: "2000", accountName: "Cost of Goods Sold",         fsType: "IS", fsLineItem: "Cost of Goods Sold",       subAccount1: "" },
    { accountNumber: "3100", accountName: "Officer Salaries",           fsType: "IS", fsLineItem: "Payroll & Related",        subAccount1: "Officer Compensation" },
    { accountNumber: "3200", accountName: "Wages & Salaries",           fsType: "IS", fsLineItem: "Payroll & Related",        subAccount1: "Wages" },
    { accountNumber: "3300", accountName: "Payroll Taxes",              fsType: "IS", fsLineItem: "Payroll & Related",        subAccount1: "Payroll Taxes" },
    { accountNumber: "4100", accountName: "Rent Expense",               fsType: "IS", fsLineItem: "Operating expenses",       subAccount1: "Facilities" },
    { accountNumber: "4200", accountName: "Utilities",                  fsType: "IS", fsLineItem: "Operating expenses",       subAccount1: "Utilities" },
    { accountNumber: "4300", accountName: "Insurance",                  fsType: "IS", fsLineItem: "Operating expenses",       subAccount1: "Insurance" },
    { accountNumber: "4400", accountName: "Software & IT",              fsType: "IS", fsLineItem: "Operating expenses",       subAccount1: "Technology" },
    { accountNumber: "5100", accountName: "Interest Expense",           fsType: "IS", fsLineItem: "Other expense (income)",   subAccount1: "" },
    { accountNumber: "5200", accountName: "Depreciation & Amortization",fsType: "IS", fsLineItem: "Other expense (income)",   subAccount1: "" },
    { accountNumber: "5300", accountName: "Income Tax Expense",         fsType: "IS", fsLineItem: "Other expense (income)",   subAccount1: "" },
    { accountNumber: "6100", accountName: "Cash and Cash Equivalents",  fsType: "BS", fsLineItem: "Cash and cash equivalents",subAccount1: "" },
    { accountNumber: "6200", accountName: "Accounts Receivable",        fsType: "BS", fsLineItem: "Accounts receivable",      subAccount1: "" },
    { accountNumber: "6300", accountName: "Inventory",                  fsType: "BS", fsLineItem: "Other current assets",    subAccount1: "Inventory" },
    { accountNumber: "6400", accountName: "Prepaid Expenses",           fsType: "BS", fsLineItem: "Other current assets",    subAccount1: "Prepaid Expenses" },
    { accountNumber: "7100", accountName: "Equipment, Gross",           fsType: "BS", fsLineItem: "Fixed assets",            subAccount1: "" },
    { accountNumber: "7200", accountName: "Accumulated Depreciation",   fsType: "BS", fsLineItem: "Fixed assets",            subAccount1: "" },
    { accountNumber: "7300", accountName: "Other Assets",               fsType: "BS", fsLineItem: "Other assets",            subAccount1: "" },
    { accountNumber: "8100", accountName: "Accounts Payable",           fsType: "BS", fsLineItem: "Current liabilities",     subAccount1: "" },
    { accountNumber: "8200", accountName: "Accrued Liabilities",        fsType: "BS", fsLineItem: "Other current liabilities",subAccount1: "" },
    { accountNumber: "8300", accountName: "Deferred Revenue",           fsType: "BS", fsLineItem: "Other current liabilities",subAccount1: "" },
    { accountNumber: "9100", accountName: "Long-term Debt",             fsType: "BS", fsLineItem: "Long term liabilities",   subAccount1: "" },
    { accountNumber: "9200", accountName: "Retained Earnings / Equity", fsType: "BS", fsLineItem: "Equity",                 subAccount1: "" },
  ];

  return {
    accounts: COA_META.map((meta) => ({
      id: `tb-${meta.accountNumber}`,
      accountNumber: meta.accountNumber,
      accountName: meta.accountName,
      fsType: meta.fsType,
      fsLineItem: meta.fsLineItem,
      subAccount1: meta.subAccount1,
      subAccount2: "",
      subAccount3: "",
      monthlyValues: accounts[meta.accountNumber] ?? {},
    })),
  };
}

function buildDDAdjustments() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const allPeriodValues = (fn: (p: { year: number; month: number; id: string }) => number) => {
    const out: Record<string, number> = {};
    for (const p of periods) out[p.id] = fn(p);
    return out;
  };

  return {
    adjustments: [
      {
        id: "adj-demo-1",
        block: "MA",
        effectType: "EBITDA",
        adjustmentClass: "normalization",
        intent: "normalize_down_expense",
        linkedAccountNumber: "3100",
        linkedAccountName: "Officer Salaries",
        description: "Officer Salary Normalization",
        evidenceNotes: "Owner compensation above market rate. Normalizing to $180K/yr market equivalent.",
        periodValues: allPeriodValues(() => 10000),
        sourceType: "manual",
        status: "accepted",
        createdAt: new Date(2025, 0, 15).toISOString(),
      },
      {
        id: "adj-demo-2",
        block: "DD",
        effectType: "EBITDA",
        adjustmentClass: "non_recurring",
        intent: "remove_expense",
        linkedAccountNumber: "4300",
        linkedAccountName: "Insurance",
        description: "One-Time Legal Settlement",
        evidenceNotes: "Non-recurring legal settlement in June 2023. Excluded from normalized earnings.",
        periodValues: allPeriodValues((p) => (p.id === "2023-06" ? 185000 : 0)),
        sourceType: "manual",
        status: "accepted",
        createdAt: new Date(2025, 0, 15).toISOString(),
      },
      {
        id: "adj-demo-3",
        block: "PF",
        effectType: "EBITDA",
        adjustmentClass: "pro_forma",
        intent: "normalize_up_expense",
        linkedAccountNumber: "4100",
        linkedAccountName: "Rent Expense",
        description: "Pro Forma Market Rent",
        evidenceNotes: "Rent below market. Pro forma adjustment to reflect market rate of $13,500/mo.",
        periodValues: allPeriodValues(() => 1500),
        sourceType: "manual",
        status: "accepted",
        createdAt: new Date(2025, 0, 15).toISOString(),
      },
    ],
  };
}

function buildReclassifications() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const amounts: Record<string, number> = {};
  for (const p of periods) amounts[p.id] = 2000;
  return {
    reclasses: [
      {
        id: "reclass-demo-1",
        fromAccountNumber: "4200",
        toAccountNumber: "3100",
        description: "Officer Auto Expense to Compensation",
        amounts,
      },
    ],
  };
}

function buildARaging() {
  return {
    periodData: [
      {
        periodId: "2024-12",
        entries: [
          { id: 1, customer: "Acme Corp",          current: 330000, days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 330000 },
          { id: 2, customer: "Beta LLC",            current: 150000, days1to30: 62000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 212000 },
          { id: 3, customer: "Gamma Industries",   current: 80000,  days1to30: 0,     days31to60: 50000, days61to90: 0,    days90plus: 0,     total: 130000 },
          { id: 4, customer: "Delta Co",            current: 0,      days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 15648, total: 15648 },
          { id: 5, customer: "All Others",          current: 87000,  days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 87000 },
        ],
      },
    ],
    badDebtReserve: 0,
  };
}

function buildAPaging() {
  return {
    periodData: [
      {
        periodId: "2024-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.",     current: 80000, days1to30: 18000, days31to60: 0, days61to90: 0, days90plus: 0, total: 98000 },
          { id: 2, vendor: "Secondary Supplier LLC",   current: 28000, days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 28000 },
          { id: 3, vendor: "Freight Logistics Inc.",   current: 0,     days1to30: 12000, days31to60: 0, days61to90: 0, days90plus: 0, total: 12000 },
          { id: 4, vendor: "Metro Utilities",          current: 9700,  days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 9700 },
        ],
      },
    ],
  };
}

function buildFixedAssets() {
  return {
    assets: [
      { id: 1, description: "Machinery & Equipment",   cost: 720000, accumDepr: 432000, nbv: 288000, usefulLife: "7 years", method: "MACRS 7-Year",   acquisitionDate: "2020-01-15" },
      { id: 2, description: "Vehicles (4 trucks)",     cost: 180000, accumDepr: 108000, nbv: 72000,  usefulLife: "5 years", method: "MACRS 5-Year",   acquisitionDate: "2021-06-01" },
      { id: 3, description: "Leasehold Improvements",  cost: 60000,  accumDepr: 28000,  nbv: 32000,  usefulLife: "15 years",method: "Straight-Line", acquisitionDate: "2022-03-01" },
    ],
    capexAnalysis: [
      { id: 1, period: "FY2022", capex: 45000, maintenance: 28000 },
      { id: 2, period: "FY2023", capex: 62000, maintenance: 31000 },
      { id: 3, period: "FY2024", capex: 38000, maintenance: 29000 },
    ],
  };
}

function buildPayroll() {
  // Compute from same formulas as TB: officer=25K, wages=30K+(year-2022)*1K, tax=8%
  const fy22Tax = 12 * Math.round((25000 + 30000) * 0.08);   // 52,800
  const fy23Tax = 12 * Math.round((25000 + 31000) * 0.08);   // 53,760
  const fy24Tax = 12 * Math.round((25000 + 32000) * 0.08);   // 54,720
  return {
    rawData: [
      ["", "FY2022", "FY2023", "FY2024"],
      ["Officer Compensation", "300000", "300000", "300000"],
      ["Wages & Salaries",     "360000", "372000", "384000"],
      ["Payroll Taxes",        String(fy22Tax), String(fy23Tax), String(fy24Tax)],
      ["Total Payroll",        String(300000 + 360000 + fy22Tax), String(300000 + 372000 + fy23Tax), String(300000 + 384000 + fy24Tax)],
    ],
    source: "demo",
  };
}

function buildSupplementary() {
  return {
    debtSchedule: [
      {
        id: 1,
        lender: "First National Bank — Term Loan",
        originalAmount: 800000,
        balance: 450000,
        currentBalance: 450000,
        interestRate: 5.5,
        maturityDate: "2027-06-30",
        type: "Term Loan",
      },
    ],
    leaseObligations: [
      {
        id: 1,
        description: "Warehouse Lease (12,000 sq ft)",
        leaseType: "Operating",
        type: "Operating",
        annualPayment: 144000,
        remainingTerm: 3,
        expirationDate: "2027-12-31",
      },
    ],
    contingentLiabilities: [],
  };
}

function buildTopCustomers() {
  // Compute FY totals from the same monthlyRevenue() used by TB
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const fy22Rev = months.reduce((s, m) => s + monthlyRevenue(2022, m), 0);
  const fy23Rev = months.reduce((s, m) => s + monthlyRevenue(2023, m), 0);
  const fy24Rev = months.reduce((s, m) => s + monthlyRevenue(2024, m), 0);
  // Year-varying splits matching mockDeal.ts exactly
  const names = ["Acme Corp", "Beta LLC", "Gamma Industries", "Delta Co", "All Others"];
  const splits22 = [0.28, 0.18, 0.12, 0.08, 0.34];
  const splits23 = [0.31, 0.17, 0.14, 0.07, 0.31];
  const splits24 = [0.34, 0.16, 0.13, 0.09, 0.28];
  return {
    customers: names.map((name, i) => ({
      id: i + 1,
      name,
      yearlyRevenue: {
        "2022": Math.round(fy22Rev * splits22[i]),
        "2023": Math.round(fy23Rev * splits23[i]),
        "2024": Math.round(fy24Rev * splits24[i]),
      },
    })),
    totalRevenue: fy24Rev,
  };
}

function buildTopVendors() {
  // Compute FY COGS totals from the same monthlyRevenue() * 0.52
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const fy22Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2022, m) * 0.52), 0);
  const fy23Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2023, m) * 0.52), 0);
  const fy24Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2024, m) * 0.52), 0);
  // Fixed splits matching mockDeal.ts exactly
  const names = ["Primary Supplier Co.", "Secondary Supplier LLC", "Freight Logistics Inc.", "All Others"];
  const splits = [0.38, 0.22, 0.18, 0.22];
  return {
    vendors: names.map((name, i) => ({
      id: i + 1,
      name,
      yearlySpend: {
        "2022": Math.round(fy22Cogs * splits[i]),
        "2023": Math.round(fy23Cogs * splits[i]),
        "2024": Math.round(fy24Cogs * splits[i]),
      },
    })),
    totalSpend: fy24Cogs,
  };
}

function buildProofOfCash() {
  const bankStatements = createMockBankStatements();
  const periods = generatePeriods(1, 2022, 12, 2024);

  // Build GL book balances from the same TB cash account
  let cumulativeCash = 245000;
  const cashByPeriod: Record<string, { book: number; prevBook: number }> = {};
  let prevCash = 245000;
  for (const p of periods) {
    const rev = monthlyRevenue(p.year, p.month);
    const cogs = Math.round(rev * 0.52);
    const officerSal = 25000;
    const wages = 30000 + (p.year - 2022) * 1000;
    const payrollTax = Math.round((officerSal + wages) * 0.08);
    const rent = 12000;
    const utilities = 2800 + (p.month >= 6 && p.month <= 8 ? 500 : 0);
    const insurance = 4000;
    const software = 6000 + (p.year - 2022) * 500;
    const interest = Math.max(4000 - (p.year - 2022) * 400, 1500);
    const depreciation = 8000;
    const taxes = Math.round(rev * 0.025);
    const netIncome = -rev + cogs + officerSal + wages + payrollTax + rent + utilities + insurance + software + interest + depreciation + taxes;
    const newCash = Math.max(cumulativeCash + -netIncome, 50000);
    cashByPeriod[p.id] = { book: newCash, prevBook: prevCash };
    prevCash = newCash;
    cumulativeCash = newCash;
  }

  const monthlyData = bankStatements.map((stmt, i) => {
    const periodId = periods[i]?.id ?? "";
    const { book, prevBook } = cashByPeriod[periodId] ?? { book: 0, prevBook: 0 };
    return {
      periodId,
      bankAccountId: "demo-bank-1",
      beginningBalance: stmt.summary.openingBalance ?? 0,
      endingBankBalance: stmt.summary.closingBalance ?? 0,
      depositsPerBank: stmt.summary.totalCredits ?? 0,
      withdrawalsPerBank: stmt.summary.totalDebits ?? 0,
      ownerDistributions: 3500,
      beginningBookBalance: prevBook,
      endingBookBalance: book,
      receiptsPerBooks: monthlyRevenue(periods[i]?.year ?? 2022, periods[i]?.month ?? 1),
      disbursementsPerBooks: Math.round(monthlyRevenue(periods[i]?.year ?? 2022, periods[i]?.month ?? 1) * 0.88),
    };
  });

  return {
    bankAccounts: [
      {
        id: "demo-bank-1",
        name: "Operating Checking",
        accountNumber: "****4821",
        type: "checking",
        institution: "First National Bank",
        dataSource: "statement",
      },
    ],
    monthlyData,
  };
}

// ─────────────────────────────────────────────
// Journal Entries Mock Data
// ─────────────────────────────────────────────

function buildJournalEntries() {
  // 18 realistic double-entry journal entries for Acme Industrial Supply Co.
  // Sorted descending by date (most recent first, as displayed in JournalEntriesSection)
  const entries = [
    {
      id: "JE-2024-018",
      txnDate: "2024-12-31",
      totalAmount: 8000,
      isAdjustment: false,
      memo: "Year-end Depreciation — Equipment",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 8000, postingType: "DEBIT" as const },
        { accountName: "Accumulated Depreciation",    accountId: "7200", amount: 8000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2024-017",
      txnDate: "2024-10-31",
      totalAmount: 18000,
      isAdjustment: false,
      memo: "Software Subscription Prepayment — Annual SaaS Licenses",
      lines: [
        { accountName: "Prepaid Expenses", accountId: "6400", amount: 18000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 18000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2024-016",
      txnDate: "2024-09-30",
      totalAmount: 38000,
      isAdjustment: false,
      memo: "Capital Equipment Purchase — Warehouse Forklift",
      lines: [
        { accountName: "Equipment, Gross", accountId: "7100", amount: 38000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 38000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2024-015",
      txnDate: "2024-06-30",
      totalAmount: 12500,
      isAdjustment: false,
      memo: "Mid-year Payroll Accrual — Officer Compensation",
      lines: [
        { accountName: "Officer Salaries",   accountId: "3100", amount: 12500, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 12500, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2024-014",
      txnDate: "2024-03-31",
      totalAmount: 13000,
      isAdjustment: false,
      memo: "Q1 Insurance Premium — Commercial Property & Liability",
      lines: [
        { accountName: "Prepaid Expenses", accountId: "6400", amount: 13000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 13000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2024-013",
      txnDate: "2024-01-15",
      totalAmount: 60000,
      isAdjustment: false,
      memo: "Loan Principal Payment — Term Loan Q1 2024",
      lines: [
        { accountName: "Long-term Debt",            accountId: "9100", amount: 60000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 60000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-012",
      txnDate: "2023-12-31",
      totalAmount: 21200,
      isAdjustment: false,
      memo: "Year-end Income Tax Accrual — FY2023",
      lines: [
        { accountName: "Income Tax Expense",  accountId: "5300", amount: 21200, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 21200, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-011",
      txnDate: "2023-12-31",
      totalAmount: 30000,
      isAdjustment: false,
      memo: "Year-end Employee Bonus Accrual",
      lines: [
        { accountName: "Wages & Salaries",   accountId: "3200", amount: 30000, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 30000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-010",
      txnDate: "2023-09-30",
      totalAmount: 22000,
      isAdjustment: false,
      memo: "Inventory Write-down — Obsolete SKUs",
      lines: [
        { accountName: "Cost of Goods Sold", accountId: "2000", amount: 22000, postingType: "DEBIT" as const },
        { accountName: "Inventory",          accountId: "6300", amount: 22000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-009",
      txnDate: "2023-06-30",
      totalAmount: 4000,
      isAdjustment: false,
      memo: "Mid-year Depreciation True-up — Equipment",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 4000, postingType: "DEBIT" as const },
        { accountName: "Accumulated Depreciation",    accountId: "7200", amount: 4000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-008",
      txnDate: "2023-06-01",
      totalAmount: 185000,
      isAdjustment: true,
      memo: "Legal Settlement — Non-Recurring Litigation Expense",
      lines: [
        { accountName: "Insurance",           accountId: "4300", amount: 185000, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 185000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-007",
      txnDate: "2023-03-15",
      totalAmount: 36000,
      isAdjustment: false,
      memo: "Equipment Lease Payment — Warehouse Facility Q1",
      lines: [
        { accountName: "Rent Expense",              accountId: "4100", amount: 36000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 36000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2023-006",
      txnDate: "2023-01-15",
      totalAmount: 60000,
      isAdjustment: false,
      memo: "Loan Principal Payment — Term Loan Q1 2023",
      lines: [
        { accountName: "Long-term Debt",            accountId: "9100", amount: 60000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 60000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2022-005",
      txnDate: "2022-12-31",
      totalAmount: 18500,
      isAdjustment: false,
      memo: "Year-end Income Tax Accrual — FY2022",
      lines: [
        { accountName: "Income Tax Expense",  accountId: "5300", amount: 18500, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 18500, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2022-004",
      txnDate: "2022-09-30",
      totalAmount: 25000,
      isAdjustment: false,
      memo: "Deferred Revenue Recognition — Q3 Performance Contracts",
      lines: [
        { accountName: "Deferred Revenue", accountId: "8300", amount: 25000, postingType: "DEBIT" as const },
        { accountName: "Sales Revenue",    accountId: "1000", amount: 25000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2022-003",
      txnDate: "2022-06-30",
      totalAmount: 15000,
      isAdjustment: false,
      memo: "Mid-year Payroll Accrual — Hourly Staff",
      lines: [
        { accountName: "Wages & Salaries",   accountId: "3200", amount: 15000, postingType: "DEBIT" as const },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 15000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2022-002",
      txnDate: "2022-03-31",
      totalAmount: 12000,
      isAdjustment: false,
      memo: "Q1 Insurance Premium — Commercial Property & Liability",
      lines: [
        { accountName: "Prepaid Expenses",          accountId: "6400", amount: 12000, postingType: "DEBIT" as const },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 12000, postingType: "CREDIT" as const },
      ],
    },
    {
      id: "JE-2022-001",
      txnDate: "2022-01-31",
      totalAmount: 8000,
      isAdjustment: false,
      memo: "Monthly Depreciation — Equipment Fleet",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 8000, postingType: "DEBIT" as const },
        { accountName: "Accumulated Depreciation",    accountId: "7200", amount: 8000, postingType: "CREDIT" as const },
      ],
    },
  ];

  return { entries, totalCount: entries.length, syncSource: undefined, lastSyncDate: undefined };
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────

export function createMockProjectData(): ProjectData {
  const periods = generatePeriods(1, 2022, 12, 2024);

  return {
    id: "demo",
    name: "Acme Industrial — Demo",
    client_name: "Shepi Capital Advisors",
    target_company: "Acme Industrial Supply Co.",
    transaction_type: "buy-side",
    industry: "Manufacturing / Distribution",
    status: "in-progress",
    fiscal_year_end: "12",
    periods: periods as unknown as string[],
    current_phase: 1,
    current_section: 1,
    wizard_data: {
      settings: { inventoryEnabled: false, currency: "USD $", onboardingComplete: true },
      chartOfAccounts: buildChartOfAccounts(),
      trialBalance: buildTrialBalance(),
      ddAdjustments: buildDDAdjustments(),
      reclassifications: buildReclassifications(),
      journalEntries: buildJournalEntries(),
      arAging: buildARaging(),
      apAging: buildAPaging(),
      fixedAssets: buildFixedAssets(),
      inventory: {},
      payroll: buildPayroll(),
      supplementary: buildSupplementary(),
      materialContracts: {
        contracts: [
          {
            id: 1,
            contractType: "Vendor/Supplier",
            counterparty: "Midwest Steel & Metals LLC",
            description: "Exclusive supply agreement for raw steel components — minimum annual purchase commitment of $1.2M",
            contractValue: 1200000,
            annualValue: 1200000,
            expirationDate: "2026-03-31",
            changeOfControl: "Consent required",
          },
          {
            id: 2,
            contractType: "Customer",
            counterparty: "National Industrial Distributors Inc.",
            description: "Regional distribution agreement granting exclusivity in the Midwest corridor — auto-renews annually",
            contractValue: 950000,
            annualValue: 950000,
            expirationDate: "2025-12-31",
            changeOfControl: "Termination right",
          },
          {
            id: 3,
            contractType: "Lease",
            counterparty: "Greenfield Industrial Properties",
            description: "Operating lease for 28,000 sq ft warehouse and distribution facility at 4400 Commerce Drive",
            contractValue: 540000,
            annualValue: 180000,
            expirationDate: "2027-06-30",
            changeOfControl: "None",
          },
        ],
      },
      topCustomers: buildTopCustomers(),
      topVendors: buildTopVendors(),
      proofOfCash: buildProofOfCash(),
      // Stubs so checklist completion checks pass for verification reports
      incomeStatement: { hasData: true },
      balanceSheet: { hasData: true },
      cashFlow: { hasData: true },
      // Period-coverage items: simulate full coverage for demo
      generalLedger: { hasData: true, coverageComplete: true },
      bankStatements: { hasData: true, coverageComplete: true },
      taxReturns: { hasData: true },
    },
  };
}
