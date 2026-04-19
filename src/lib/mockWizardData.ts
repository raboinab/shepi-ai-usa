/**
 * Mock Wizard Data for WizardDemo
 * Generates a fully-populated ProjectData for "Acme Industrial Supply Co."
 * Uses the same underlying revenue/cost model as mockDeal.ts for consistency.
 * All wizard_data keys match the shapes expected by their respective wizard sections.
 */
import type { ProjectData } from "@/pages/Project";
import { generatePeriods } from "@/lib/periodUtils";


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

  // Convert IS accounts to cumulative YTD (matches QuickBooks Trial Balance convention).
  // The projectToDealAdapter's YTD→monthly conversion will reverse this back to monthly.
  const isAccountNums = ["1000","2000","3100","3200","3300","4100","4200","4300","4400","5100","5200","5300"];
  for (const acctNum of isAccountNums) {
    let cumulative = 0;
    for (const p of periods) {
      if (p.month === 1) cumulative = 0; // Reset at FY start (FYE=12)
      cumulative += accounts[acctNum][p.id];
      accounts[acctNum][p.id] = cumulative;
    }
  }

  // Compute equity as balancing plug per period (using cumulative IS values)
  for (const p of periods) {
    const id = p.id;
    const bsAccounts = ["6100","6200","6300","6400","7100","7200","7300","8100","8200","8300","9100"];
    const isSum = isAccountNums.reduce((s, a) => s + (accounts[a][id] ?? 0), 0);
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
  // Multi-period aging data for demo (Dec-22, Dec-23, Jun-24, Dec-24)
  return {
    periodData: [
      {
        periodId: "2022-12",
        entries: [
          { id: 1, customer: "Acme Corp",        current: 210000, days1to30: 15000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 225000 },
          { id: 2, customer: "Beta LLC",          current: 95000,  days1to30: 22000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 117000 },
          { id: 3, customer: "Gamma Industries", current: 55000,  days1to30: 0,     days31to60: 18000, days61to90: 0,    days90plus: 0,     total: 73000 },
          { id: 4, customer: "Delta Co",          current: 12000,  days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 8000,  total: 20000 },
          { id: 5, customer: "All Others",        current: 68000,  days1to30: 5000,  days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 73000 },
        ],
      },
      {
        periodId: "2023-12",
        entries: [
          { id: 1, customer: "Acme Corp",        current: 280000, days1to30: 10000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 290000 },
          { id: 2, customer: "Beta LLC",          current: 125000, days1to30: 40000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 165000 },
          { id: 3, customer: "Gamma Industries", current: 72000,  days1to30: 0,     days31to60: 35000, days61to90: 0,    days90plus: 0,     total: 107000 },
          { id: 4, customer: "Delta Co",          current: 5000,   days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 12000, total: 17000 },
          { id: 5, customer: "All Others",        current: 78000,  days1to30: 3000,  days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 81000 },
        ],
      },
      {
        periodId: "2024-06",
        entries: [
          { id: 1, customer: "Acme Corp",        current: 305000, days1to30: 8000,  days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 313000 },
          { id: 2, customer: "Beta LLC",          current: 138000, days1to30: 48000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 186000 },
          { id: 3, customer: "Gamma Industries", current: 76000,  days1to30: 0,     days31to60: 42000, days61to90: 0,    days90plus: 0,     total: 118000 },
          { id: 4, customer: "Delta Co",          current: 0,      days1to30: 0,     days31to60: 0,     days61to90: 3000, days90plus: 10000, total: 13000 },
          { id: 5, customer: "All Others",        current: 82000,  days1to30: 2000,  days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 84000 },
        ],
      },
      {
        periodId: "2024-12",
        entries: [
          { id: 1, customer: "Acme Corp",        current: 330000, days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 330000 },
          { id: 2, customer: "Beta LLC",          current: 150000, days1to30: 62000, days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 212000 },
          { id: 3, customer: "Gamma Industries", current: 80000,  days1to30: 0,     days31to60: 50000, days61to90: 0,    days90plus: 0,     total: 130000 },
          { id: 4, customer: "Delta Co",          current: 0,      days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 15648, total: 15648 },
          { id: 5, customer: "All Others",        current: 87000,  days1to30: 0,     days31to60: 0,     days61to90: 0,    days90plus: 0,     total: 87000 },
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
        periodId: "2022-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.",   current: 52000, days1to30: 10000, days31to60: 0, days61to90: 0, days90plus: 0, total: 62000 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 18000, days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 18000 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0,     days1to30: 8000,  days31to60: 0, days61to90: 0, days90plus: 0, total: 8000 },
          { id: 4, vendor: "Metro Utilities",        current: 6200,  days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 6200 },
        ],
      },
      {
        periodId: "2023-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.",   current: 65000, days1to30: 14000, days31to60: 0, days61to90: 0, days90plus: 0, total: 79000 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 22000, days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 22000 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0,     days1to30: 10000, days31to60: 0, days61to90: 0, days90plus: 0, total: 10000 },
          { id: 4, vendor: "Metro Utilities",        current: 7800,  days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 7800 },
        ],
      },
      {
        periodId: "2024-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.",   current: 80000, days1to30: 18000, days31to60: 0, days61to90: 0, days90plus: 0, total: 98000 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 28000, days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 28000 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0,     days1to30: 12000, days31to60: 0, days61to90: 0, days90plus: 0, total: 12000 },
          { id: 4, vendor: "Metro Utilities",        current: 9700,  days1to30: 0,     days31to60: 0, days61to90: 0, days90plus: 0, total: 9700 },
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
  const periods = generatePeriods(1, 2022, 12, 2024);

  // Build consistent GL book balances from the same TB cash formulas
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

  // Generate bank data consistent with book data (small timing variance for realism)
  const monthlyData = periods.map((p, i) => {
    const { book, prevBook } = cashByPeriod[p.id] ?? { book: 0, prevBook: 0 };
    const rev = monthlyRevenue(p.year, p.month);
    const totalExpenses = Math.round(rev * 0.88);
    // Bank balance tracks book balance with a small timing difference
    const timingVariance = (i % 3 === 0) ? Math.round(rev * 0.005) : 0;
    return {
      periodId: p.id,
      bankAccountId: "demo-bank-1",
      beginningBalance: prevBook + timingVariance,
      endingBankBalance: book + timingVariance,
      depositsPerBank: rev + timingVariance,
      withdrawalsPerBank: totalExpenses + timingVariance,
      ownerDistributions: 3500,
      beginningBookBalance: prevBook,
      endingBookBalance: book,
      receiptsPerBooks: rev,
      disbursementsPerBooks: totalExpenses,
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
// Mock AI Discovery Proposals
// ─────────────────────────────────────────────

function makePeriodValues(annualAmount: number): Record<string, number> {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const monthly = Math.round(annualAmount / 12);
  const out: Record<string, number> = {};
  for (const p of periods) out[p.id] = monthly;
  return out;
}

export function buildMockDiscoveryProposals() {
  const now = new Date().toISOString();
  const base = {
    job_id: "demo-job-1",
    project_id: "demo",
    user_id: "demo-user",
    master_proposal_id: null,
    detector_run_id: null,
    template_id: null,
    allocation_mode: "even",
    period_range: { start: "2022-01", end: "2024-12" },
    ai_model: "gpt-4o",
    status: "new",
    reviewer_user_id: null,
    reviewer_notes: null,
    reviewed_at: null,
    edited_amount: null,
    edited_period_values: null,
    created_at: now,
    updated_at: now,
  };

  return [
    {
      ...base,
      id: "prop-demo-1",
      detector_type: "personal_expenses",
      title: "Personal & Discretionary Expenses",
      description: "Multiple personal charges identified across company credit cards — meals, travel, and subscriptions with no business purpose documentation.",
      block: "DD" as const,
      adjustment_class: "personal_expense",
      intent: "remove_expense",
      linked_account_number: "4400",
      linked_account_name: "Software & IT",
      proposed_amount: 16279,
      proposed_period_values: makePeriodValues(16279),
      evidence_strength: "strong" as const,
      review_priority: "high" as const,
      internal_score: 0.92,
      support_json: { reported_amount: 16279, proposed_adjustment: 16279, confidence: 0.92, skeptic: "Some charges may have partial business use.", assumptions: ["No documentation found for flagged charges."] },
      ai_rationale: JSON.stringify({ rationale: "Identified 47 transactions across 3 credit cards totaling $16,279 with personal-use indicators: streaming subscriptions ($2,400/yr), vacation travel ($4,200), and restaurant charges on weekends/holidays ($9,679)." }),
      ai_key_signals: ["Weekend/holiday restaurant charges", "Streaming service subscriptions", "Personal travel bookings"],
      ai_warnings: ["Some restaurant charges may be client entertainment"],
    },
    {
      ...base,
      id: "prop-demo-2",
      detector_type: "owner_comp",
      title: "Owner Compensation Normalization",
      description: "Officer salary of $300K exceeds market rate for similar-sized distribution companies. Normalizing to $215K market equivalent.",
      block: "MA" as const,
      adjustment_class: "normalization",
      intent: "normalize_down_expense",
      linked_account_number: "3100",
      linked_account_name: "Officer Salaries",
      proposed_amount: 85000,
      proposed_period_values: makePeriodValues(85000),
      evidence_strength: "strong" as const,
      review_priority: "critical" as const,
      internal_score: 0.95,
      support_json: { reported_amount: 300000, proposed_adjustment: 85000, confidence: 0.95, skeptic: "Market comp depends on region and responsibilities.", assumptions: ["Based on BLS and PEG data for $5-10M revenue distribution companies."] },
      ai_rationale: JSON.stringify({ rationale: "Officer compensation of $300K/yr is ~40% above the $215K median for owner-operators of $5-10M revenue distribution businesses in the Midwest region (BLS/PEG benchmarks)." }),
      ai_key_signals: ["Single officer on payroll", "Salary 40% above market median", "No employment agreement on file"],
      ai_warnings: ["Verify owner's actual role scope before finalizing"],
    },
    {
      ...base,
      id: "prop-demo-3",
      detector_type: "non_recurring",
      title: "One-Time Legal Settlement",
      description: "Legal settlement payment in June 2023 — non-recurring expense that should be excluded from normalized EBITDA.",
      block: "DD" as const,
      adjustment_class: "non_recurring",
      intent: "remove_expense",
      linked_account_number: "4300",
      linked_account_name: "Insurance",
      proposed_amount: 42500,
      proposed_period_values: { "2023-06": 42500 },
      evidence_strength: "strong" as const,
      review_priority: "high" as const,
      internal_score: 0.88,
      support_json: { reported_amount: 42500, proposed_adjustment: 42500, confidence: 0.88, skeptic: "Confirm no ongoing litigation.", assumptions: ["Settlement was fully resolved with no future obligations."] },
      ai_rationale: JSON.stringify({ rationale: "Single payment of $42,500 to 'Morrison & Foerster LLP — Settlement' in June 2023. No similar payments in prior or subsequent periods. Classified as non-recurring legal expense." }),
      ai_key_signals: ["Single occurrence", "Law firm payee", "'Settlement' in memo"],
      ai_warnings: ["Confirm litigation is fully resolved"],
    },
    {
      ...base,
      id: "prop-demo-4",
      detector_type: "related_party",
      title: "Above-Market Related Party Rent",
      description: "Facility rent paid to entity owned by the seller exceeds market rate by ~$3,000/mo.",
      block: "PF" as const,
      adjustment_class: "pro_forma",
      intent: "normalize_down_expense",
      linked_account_number: "4100",
      linked_account_name: "Rent Expense",
      proposed_amount: 36000,
      proposed_period_values: makePeriodValues(36000),
      evidence_strength: "moderate" as const,
      review_priority: "normal" as const,
      internal_score: 0.78,
      support_json: { reported_amount: 144000, proposed_adjustment: 36000, confidence: 0.78, skeptic: "Market rent depends on specific location and build-out.", assumptions: ["Comparable industrial rents in the area average $6.50/sq ft."] },
      ai_rationale: JSON.stringify({ rationale: "Rent of $12,000/mo ($5.14/sq ft) for 28,000 sq ft warehouse. Comparable industrial space in the area averages $3.86/sq ft. Above-market premium of ~$3,000/mo ($36K/yr) likely due to related-party arrangement." }),
      ai_key_signals: ["Landlord entity shares owner", "Rent exceeds market comps", "No arm's-length lease negotiation"],
      ai_warnings: ["Get independent appraisal for precision"],
    },
    {
      ...base,
      id: "prop-demo-5",
      detector_type: "non_recurring",
      title: "Non-Recurring Inventory Write-Down",
      description: "Inventory write-down in Q4 2023 for obsolete product line — one-time charge.",
      block: "DD" as const,
      adjustment_class: "non_recurring",
      intent: "remove_expense",
      linked_account_number: "2000",
      linked_account_name: "Cost of Goods Sold",
      proposed_amount: 28400,
      proposed_period_values: { "2023-10": 28400 },
      evidence_strength: "moderate" as const,
      review_priority: "normal" as const,
      internal_score: 0.74,
      support_json: { reported_amount: 28400, proposed_adjustment: 28400, confidence: 0.74, skeptic: "Verify the product line was actually discontinued.", assumptions: ["Write-down is non-recurring and not part of regular inventory management."] },
      ai_rationale: JSON.stringify({ rationale: "JE memo references 'Obsolete inventory write-down — Series 400 product line discontinuation.' No similar entries in other periods. $28,400 booked to COGS in October 2023." }),
      ai_key_signals: ["'Write-down' in JE memo", "Product line discontinued", "Single occurrence"],
      ai_warnings: ["Confirm Series 400 is fully discontinued"],
    },
    {
      ...base,
      id: "prop-demo-6",
      detector_type: "personal_expenses",
      title: "Personal Vehicle Lease",
      description: "Monthly vehicle lease payment with no mileage log or business-use documentation.",
      block: "DD" as const,
      adjustment_class: "personal_expense",
      intent: "remove_expense",
      linked_account_number: "4200",
      linked_account_name: "Utilities",
      proposed_amount: 14200,
      proposed_period_values: makePeriodValues(14200),
      evidence_strength: "weak" as const,
      review_priority: "low" as const,
      internal_score: 0.61,
      support_json: { reported_amount: 14200, proposed_adjustment: 14200, confidence: 0.61, skeptic: "Vehicle may have partial business use.", assumptions: ["No mileage log provided. Assuming 100% personal."] },
      ai_rationale: JSON.stringify({ rationale: "Recurring monthly payments of ~$1,183 to 'BMW Financial Services' booked to vehicle expense. No mileage log, fleet policy, or business-use documentation provided. Pattern suggests personal vehicle." }),
      ai_key_signals: ["Luxury vehicle brand", "No mileage documentation", "Consistent monthly payment"],
      ai_warnings: ["May have partial business use — request mileage log"],
    },
  ];
}

// ─────────────────────────────────────────────
// Mock Reclassification Flags
// ─────────────────────────────────────────────

export function buildMockReclassificationFlags() {
  const now = new Date().toISOString();
  const base = {
    project_id: "demo",
    user_id: "demo-user",
    status: "pending" as const,
    reviewed_at: null,
    reviewed_by: null,
    source_data: {},
    created_at: now,
    updated_at: now,
    classification_context: null,
    flag_category: "reclassification",
  };

  return [
    {
      ...base,
      id: "flag-demo-1",
      transaction_date: "2024-03-15",
      description: "HVAC replacement and installation — coded to Repairs & Maintenance",
      amount: 23400,
      account_name: "Repairs & Maintenance",
      flag_type: "reclass_cogs_opex_boundary",
      flag_reason: "Equipment purchase of $23,400 booked to Repairs & Maintenance. This appears to be a capital expenditure that should be capitalized to Fixed Assets and depreciated over its useful life.",
      confidence_score: 0.89,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 23400,
      ai_analysis: {
        suggested_from_line_item: "Operating Expenses",
        suggested_to_line_item: "Fixed Assets (Capitalize)",
        matched_keywords: ["HVAC", "installation", "replacement"],
        reasoning: "HVAC system replacement exceeds capitalization threshold and has multi-year useful life.",
      },
    },
    {
      ...base,
      id: "flag-demo-2",
      transaction_date: "2024-06-30",
      description: "Gain on sale of delivery truck #4 — booked to Sales Revenue",
      amount: 18750,
      account_name: "Sales Revenue",
      flag_type: "reclass_gain_loss_in_revenue",
      flag_reason: "Gain on asset sale of $18,750 booked to Sales Revenue. Should be reclassified to Other Income (non-operating) to avoid inflating operating revenue.",
      confidence_score: 0.94,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 18750,
      ai_analysis: {
        suggested_from_line_item: "Revenue",
        suggested_to_line_item: "Other Income (Non-Operating)",
        matched_keywords: ["gain on sale", "delivery truck", "asset disposition"],
        reasoning: "Asset sale proceeds are non-operating and should not be included in recurring revenue.",
      },
    },
    {
      ...base,
      id: "flag-demo-3",
      transaction_date: "2024-01-01",
      description: "Freight & shipping charges — coded to Office Supplies throughout the year",
      amount: 62400,
      account_name: "Office Supplies",
      flag_type: "reclass_cogs_opex_boundary",
      flag_reason: "Shipping & freight costs totaling $62,400 booked to Office Supplies. These are direct costs related to product delivery and should be reclassified to Cost of Goods Sold.",
      confidence_score: 0.86,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 62400,
      ai_analysis: {
        suggested_from_line_item: "Operating Expenses",
        suggested_to_line_item: "Cost of Goods Sold",
        matched_keywords: ["freight", "shipping", "UPS", "FedEx", "delivery"],
        reasoning: "Shipping costs directly tied to product sales belong in COGS per matching principle.",
      },
    },
    {
      ...base,
      id: "flag-demo-4",
      transaction_date: "2024-01-01",
      description: "Owner's personal auto lease — BMW Financial Services monthly payments",
      amount: 14200,
      account_name: "Vehicle Expense",
      flag_type: "reclass_payroll_owner_comp",
      flag_reason: "Owner's personal vehicle lease of $14,200/yr booked to Vehicle Expense. No mileage log or business-use documentation. Should be reclassified to Owner Draws/Distributions.",
      confidence_score: 0.72,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 14200,
      ai_analysis: {
        suggested_from_line_item: "Operating Expenses",
        suggested_to_line_item: "Owner Draws / Distributions",
        matched_keywords: ["BMW Financial", "personal auto", "no mileage log"],
        reasoning: "Personal vehicle expense without business-use documentation is an owner benefit, not an operating cost.",
      },
    },
    {
      ...base,
      id: "flag-demo-5",
      transaction_date: "2024-09-15",
      description: "Customer prepayment for Q4 orders — deposited and booked as revenue",
      amount: 45000,
      account_name: "Sales Revenue",
      flag_type: "reclass_gain_loss_in_revenue",
      flag_reason: "Customer deposit of $45,000 booked to Revenue before goods were shipped. Should be reclassified to Deferred Revenue (liability) until delivery obligation is fulfilled.",
      confidence_score: 0.91,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 45000,
      ai_analysis: {
        suggested_from_line_item: "Revenue",
        suggested_to_line_item: "Deferred Revenue (Liability)",
        matched_keywords: ["prepayment", "deposit", "Q4 orders", "advance"],
        reasoning: "Revenue recognition requires delivery of goods. Prepayments should be deferred until performance obligation is met.",
      },
    },
  ];
}

// ─────────────────────────────────────────────
// Mock Transfer Classifications
// ─────────────────────────────────────────────

export function buildMockTransferClassifications() {
  return {
    summary: { total: 8921, operating: 7218, interbank: 847, owner: 412, other: 444 },
    cases: [
      {
        case_id: "demo-case-1",
        case_type: "internal_transfer" as const,
        status: "suggested" as const,
        confidence: 0.96,
        total_dollars: 284000,
        transaction_count: 24,
        date_range: ["2022-01-15", "2024-12-20"] as [string, string],
        representative_txn_ids: ["t1", "t2", "t3"],
        edge_case_txn_ids: [],
        evidence_summary: [{ type: "matching_pair", weight: 0.9 }],
        risk_score: 0.2,
        reasoning_label: "Matched interbank pair (24 transactions)",
        transactions: [],
      },
      {
        case_id: "demo-case-2",
        case_type: "owner_related" as const,
        status: "suggested" as const,
        confidence: 0.88,
        total_dollars: 156000,
        transaction_count: 36,
        date_range: ["2022-02-01", "2024-11-30"] as [string, string],
        representative_txn_ids: ["t4", "t5"],
        edge_case_txn_ids: ["t6"],
        evidence_summary: [{ type: "owner_pattern", weight: 0.85 }],
        risk_score: 0.65,
        reasoning_label: "Owner Draws & Distributions",
        transactions: [],
      },
      {
        case_id: "demo-case-3",
        case_type: "internal_transfer" as const,
        status: "suggested" as const,
        confidence: 0.91,
        total_dollars: 47200,
        transaction_count: 12,
        date_range: ["2022-06-01", "2024-09-15"] as [string, string],
        representative_txn_ids: ["t7"],
        edge_case_txn_ids: [],
        evidence_summary: [{ type: "matching_pair", weight: 0.88 }],
        risk_score: 0.15,
        reasoning_label: "Credit Card Payments",
        transactions: [],
      },
      {
        case_id: "demo-case-4",
        case_type: "owner_related" as const,
        status: "suggested" as const,
        confidence: 0.72,
        total_dollars: 38400,
        transaction_count: 18,
        date_range: ["2023-01-10", "2024-12-05"] as [string, string],
        representative_txn_ids: ["t8", "t9"],
        edge_case_txn_ids: ["t10"],
        evidence_summary: [{ type: "owner_pattern", weight: 0.7 }],
        risk_score: 0.55,
        reasoning_label: "Personal App Transfers",
        transactions: [],
      },
      {
        case_id: "demo-case-5",
        case_type: "ambiguous" as const,
        status: "suggested" as const,
        confidence: 0.58,
        total_dollars: 22800,
        transaction_count: 8,
        date_range: ["2023-03-01", "2024-08-20"] as [string, string],
        representative_txn_ids: ["t11"],
        edge_case_txn_ids: ["t12", "t13"],
        evidence_summary: [{ type: "heuristic_match", weight: 0.55 }],
        risk_score: 0.78,
        reasoning_label: "Needs manual review",
        transactions: [],
      },
    ],
  };
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
      discoveryProposals: buildMockDiscoveryProposals(),
      reclassificationFlags: buildMockReclassificationFlags(),
      transferClassifications: buildMockTransferClassifications(),
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
