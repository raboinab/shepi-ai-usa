import { g as generatePeriods } from "./periodUtils-DliZcATp.js";
function monthlyRevenue(year, month) {
  const base = 42e4;
  const yearGrowth = (year - 2022) * 0.08;
  const seasonal = [0, -0.03, 0.01, 0.02, 0.02, 0.03, 0.02, 0.01, 0.02, 0.04, 0.05, 0.06][month - 1];
  return Math.round(base * (1 + yearGrowth) * (1 + seasonal));
}
function buildChartOfAccounts() {
  return {
    accounts: [
      { id: 1, accountNumber: "1000", accountName: "Sales Revenue", fsType: "IS", category: "Revenue" },
      { id: 2, accountNumber: "2000", accountName: "Cost of Goods Sold", fsType: "IS", category: "Cost of Goods Sold" },
      { id: 3, accountNumber: "3100", accountName: "Officer Salaries", fsType: "IS", category: "Payroll & Related" },
      { id: 4, accountNumber: "3200", accountName: "Wages & Salaries", fsType: "IS", category: "Payroll & Related" },
      { id: 5, accountNumber: "3300", accountName: "Payroll Taxes", fsType: "IS", category: "Payroll & Related" },
      { id: 6, accountNumber: "4100", accountName: "Rent Expense", fsType: "IS", category: "Operating expenses" },
      { id: 7, accountNumber: "4200", accountName: "Utilities", fsType: "IS", category: "Operating expenses" },
      { id: 8, accountNumber: "4300", accountName: "Insurance", fsType: "IS", category: "Operating expenses" },
      { id: 9, accountNumber: "4400", accountName: "Software & IT", fsType: "IS", category: "Operating expenses" },
      { id: 10, accountNumber: "5100", accountName: "Interest Expense", fsType: "IS", category: "Other expense (income)" },
      { id: 11, accountNumber: "5200", accountName: "Depreciation & Amortization", fsType: "IS", category: "Other expense (income)" },
      { id: 12, accountNumber: "5300", accountName: "Income Tax Expense", fsType: "IS", category: "Other expense (income)" },
      { id: 13, accountNumber: "6100", accountName: "Cash and Cash Equivalents", fsType: "BS", category: "Cash and cash equivalents" },
      { id: 14, accountNumber: "6200", accountName: "Accounts Receivable", fsType: "BS", category: "Accounts receivable" },
      { id: 15, accountNumber: "6300", accountName: "Inventory", fsType: "BS", category: "Other current assets" },
      { id: 16, accountNumber: "6400", accountName: "Prepaid Expenses", fsType: "BS", category: "Other current assets" },
      { id: 17, accountNumber: "7100", accountName: "Equipment, Gross", fsType: "BS", category: "Fixed assets" },
      { id: 18, accountNumber: "7200", accountName: "Accumulated Depreciation", fsType: "BS", category: "Fixed assets" },
      { id: 19, accountNumber: "7300", accountName: "Other Assets", fsType: "BS", category: "Other assets" },
      { id: 20, accountNumber: "8100", accountName: "Accounts Payable", fsType: "BS", category: "Current liabilities" },
      { id: 21, accountNumber: "8200", accountName: "Accrued Liabilities", fsType: "BS", category: "Other current liabilities" },
      { id: 22, accountNumber: "8300", accountName: "Deferred Revenue", fsType: "BS", category: "Other current liabilities" },
      { id: 23, accountNumber: "9100", accountName: "Long-term Debt", fsType: "BS", category: "Long term liabilities" },
      { id: 24, accountNumber: "9200", accountName: "Retained Earnings / Equity", fsType: "BS", category: "Equity" }
    ]
  };
}
function buildTrialBalance() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const accounts = {
    "1000": {},
    "2000": {},
    "3100": {},
    "3200": {},
    "3300": {},
    "4100": {},
    "4200": {},
    "4300": {},
    "4400": {},
    "5100": {},
    "5200": {},
    "5300": {},
    "6100": {},
    "6200": {},
    "6300": {},
    "6400": {},
    "7100": {},
    "7200": {},
    "7300": {},
    "8100": {},
    "8200": {},
    "8300": {},
    "9100": {},
    "9200": {}
  };
  let cumulativeCash = 245e3;
  for (const p of periods) {
    const rev = monthlyRevenue(p.year, p.month);
    const cogs = Math.round(rev * 0.52);
    const officerSal = 25e3;
    const wages = 3e4 + (p.year - 2022) * 1e3;
    const payrollTax = Math.round((officerSal + wages) * 0.08);
    const rent = 12e3;
    const utilities = 2800 + (p.month >= 6 && p.month <= 8 ? 500 : 0);
    const insurance = 4e3;
    const software = 6e3 + (p.year - 2022) * 500;
    const interest = Math.max(4e3 - (p.year - 2022) * 400, 1500);
    const depreciation = 8e3;
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
    accounts["6100"][id] = Math.max(cumulativeCash, 5e4);
    accounts["6200"][id] = Math.round(rev * 1.5);
    accounts["6300"][id] = 18e4 + (p.year - 2022) * 1e4;
    accounts["6400"][id] = 3e4;
    accounts["7100"][id] = 96e4;
    accounts["7200"][id] = -(288e3 + (p.year * 12 + p.month - (2022 * 12 + 1)) * 8e3);
    accounts["7300"][id] = 5e4;
    accounts["8100"][id] = -Math.round(cogs * 0.55);
    accounts["8200"][id] = -45e3;
    accounts["8300"][id] = -25e3;
    accounts["9100"][id] = -(8e5 - (p.year * 12 + p.month - (2022 * 12 + 1)) * 1e4);
  }
  const isAccountNums = ["1000", "2000", "3100", "3200", "3300", "4100", "4200", "4300", "4400", "5100", "5200", "5300"];
  for (const acctNum of isAccountNums) {
    let cumulative = 0;
    for (const p of periods) {
      if (p.month === 1) cumulative = 0;
      cumulative += accounts[acctNum][p.id];
      accounts[acctNum][p.id] = cumulative;
    }
  }
  for (const p of periods) {
    const id = p.id;
    const bsAccounts = ["6100", "6200", "6300", "6400", "7100", "7200", "7300", "8100", "8200", "8300", "9100"];
    const isSum = isAccountNums.reduce((s, a) => s + (accounts[a][id] ?? 0), 0);
    const bsSum = bsAccounts.reduce((s, a) => s + (accounts[a][id] ?? 0), 0);
    accounts["9200"][id] = -(bsSum + isSum);
  }
  const COA_META = [
    { accountNumber: "1000", accountName: "Sales Revenue", fsType: "IS", fsLineItem: "Revenue", subAccount1: "" },
    { accountNumber: "2000", accountName: "Cost of Goods Sold", fsType: "IS", fsLineItem: "Cost of Goods Sold", subAccount1: "" },
    { accountNumber: "3100", accountName: "Officer Salaries", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Officer Compensation" },
    { accountNumber: "3200", accountName: "Wages & Salaries", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Wages" },
    { accountNumber: "3300", accountName: "Payroll Taxes", fsType: "IS", fsLineItem: "Payroll & Related", subAccount1: "Payroll Taxes" },
    { accountNumber: "4100", accountName: "Rent Expense", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Facilities" },
    { accountNumber: "4200", accountName: "Utilities", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Utilities" },
    { accountNumber: "4300", accountName: "Insurance", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Insurance" },
    { accountNumber: "4400", accountName: "Software & IT", fsType: "IS", fsLineItem: "Operating expenses", subAccount1: "Technology" },
    { accountNumber: "5100", accountName: "Interest Expense", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "" },
    { accountNumber: "5200", accountName: "Depreciation & Amortization", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "" },
    { accountNumber: "5300", accountName: "Income Tax Expense", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "" },
    { accountNumber: "6100", accountName: "Cash and Cash Equivalents", fsType: "BS", fsLineItem: "Cash and cash equivalents", subAccount1: "" },
    { accountNumber: "6200", accountName: "Accounts Receivable", fsType: "BS", fsLineItem: "Accounts receivable", subAccount1: "" },
    { accountNumber: "6300", accountName: "Inventory", fsType: "BS", fsLineItem: "Other current assets", subAccount1: "Inventory" },
    { accountNumber: "6400", accountName: "Prepaid Expenses", fsType: "BS", fsLineItem: "Other current assets", subAccount1: "Prepaid Expenses" },
    { accountNumber: "7100", accountName: "Equipment, Gross", fsType: "BS", fsLineItem: "Fixed assets", subAccount1: "" },
    { accountNumber: "7200", accountName: "Accumulated Depreciation", fsType: "BS", fsLineItem: "Fixed assets", subAccount1: "" },
    { accountNumber: "7300", accountName: "Other Assets", fsType: "BS", fsLineItem: "Other assets", subAccount1: "" },
    { accountNumber: "8100", accountName: "Accounts Payable", fsType: "BS", fsLineItem: "Current liabilities", subAccount1: "" },
    { accountNumber: "8200", accountName: "Accrued Liabilities", fsType: "BS", fsLineItem: "Other current liabilities", subAccount1: "" },
    { accountNumber: "8300", accountName: "Deferred Revenue", fsType: "BS", fsLineItem: "Other current liabilities", subAccount1: "" },
    { accountNumber: "9100", accountName: "Long-term Debt", fsType: "BS", fsLineItem: "Long term liabilities", subAccount1: "" },
    { accountNumber: "9200", accountName: "Retained Earnings / Equity", fsType: "BS", fsLineItem: "Equity", subAccount1: "" }
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
      monthlyValues: accounts[meta.accountNumber] ?? {}
    }))
  };
}
function buildDDAdjustments() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const allPeriodValues = (fn) => {
    const out = {};
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
        periodValues: allPeriodValues(() => 1e4),
        sourceType: "manual",
        status: "accepted",
        createdAt: new Date(2025, 0, 15).toISOString()
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
        periodValues: allPeriodValues((p) => p.id === "2023-06" ? 185e3 : 0),
        sourceType: "manual",
        status: "accepted",
        createdAt: new Date(2025, 0, 15).toISOString()
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
        createdAt: new Date(2025, 0, 15).toISOString()
      }
    ]
  };
}
function buildReclassifications() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const amounts = {};
  for (const p of periods) amounts[p.id] = 2e3;
  return {
    reclasses: [
      {
        id: "reclass-demo-1",
        fromAccountNumber: "4200",
        toAccountNumber: "3100",
        description: "Officer Auto Expense to Compensation",
        amounts
      }
    ]
  };
}
function buildARaging() {
  return {
    periodData: [
      {
        periodId: "2022-12",
        entries: [
          { id: 1, customer: "Acme Corp", current: 21e4, days1to30: 15e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 225e3 },
          { id: 2, customer: "Beta LLC", current: 95e3, days1to30: 22e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 117e3 },
          { id: 3, customer: "Gamma Industries", current: 55e3, days1to30: 0, days31to60: 18e3, days61to90: 0, days90plus: 0, total: 73e3 },
          { id: 4, customer: "Delta Co", current: 12e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 8e3, total: 2e4 },
          { id: 5, customer: "All Others", current: 68e3, days1to30: 5e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 73e3 }
        ]
      },
      {
        periodId: "2023-12",
        entries: [
          { id: 1, customer: "Acme Corp", current: 28e4, days1to30: 1e4, days31to60: 0, days61to90: 0, days90plus: 0, total: 29e4 },
          { id: 2, customer: "Beta LLC", current: 125e3, days1to30: 4e4, days31to60: 0, days61to90: 0, days90plus: 0, total: 165e3 },
          { id: 3, customer: "Gamma Industries", current: 72e3, days1to30: 0, days31to60: 35e3, days61to90: 0, days90plus: 0, total: 107e3 },
          { id: 4, customer: "Delta Co", current: 5e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 12e3, total: 17e3 },
          { id: 5, customer: "All Others", current: 78e3, days1to30: 3e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 81e3 }
        ]
      },
      {
        periodId: "2024-06",
        entries: [
          { id: 1, customer: "Acme Corp", current: 305e3, days1to30: 8e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 313e3 },
          { id: 2, customer: "Beta LLC", current: 138e3, days1to30: 48e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 186e3 },
          { id: 3, customer: "Gamma Industries", current: 76e3, days1to30: 0, days31to60: 42e3, days61to90: 0, days90plus: 0, total: 118e3 },
          { id: 4, customer: "Delta Co", current: 0, days1to30: 0, days31to60: 0, days61to90: 3e3, days90plus: 1e4, total: 13e3 },
          { id: 5, customer: "All Others", current: 82e3, days1to30: 2e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 84e3 }
        ]
      },
      {
        periodId: "2024-12",
        entries: [
          { id: 1, customer: "Acme Corp", current: 33e4, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 33e4 },
          { id: 2, customer: "Beta LLC", current: 15e4, days1to30: 62e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 212e3 },
          { id: 3, customer: "Gamma Industries", current: 8e4, days1to30: 0, days31to60: 5e4, days61to90: 0, days90plus: 0, total: 13e4 },
          { id: 4, customer: "Delta Co", current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 15648, total: 15648 },
          { id: 5, customer: "All Others", current: 87e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 87e3 }
        ]
      }
    ],
    badDebtReserve: 0
  };
}
function buildAPaging() {
  return {
    periodData: [
      {
        periodId: "2022-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.", current: 52e3, days1to30: 1e4, days31to60: 0, days61to90: 0, days90plus: 0, total: 62e3 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 18e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 18e3 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0, days1to30: 8e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 8e3 },
          { id: 4, vendor: "Metro Utilities", current: 6200, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 6200 }
        ]
      },
      {
        periodId: "2023-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.", current: 65e3, days1to30: 14e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 79e3 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 22e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 22e3 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0, days1to30: 1e4, days31to60: 0, days61to90: 0, days90plus: 0, total: 1e4 },
          { id: 4, vendor: "Metro Utilities", current: 7800, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 7800 }
        ]
      },
      {
        periodId: "2024-12",
        entries: [
          { id: 1, vendor: "Primary Supplier Co.", current: 8e4, days1to30: 18e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 98e3 },
          { id: 2, vendor: "Secondary Supplier LLC", current: 28e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 28e3 },
          { id: 3, vendor: "Freight Logistics Inc.", current: 0, days1to30: 12e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 12e3 },
          { id: 4, vendor: "Metro Utilities", current: 9700, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 9700 }
        ]
      }
    ]
  };
}
function buildFixedAssets() {
  return {
    assets: [
      { id: 1, description: "Machinery & Equipment", cost: 72e4, accumDepr: 432e3, nbv: 288e3, usefulLife: "7 years", method: "MACRS 7-Year", acquisitionDate: "2020-01-15" },
      { id: 2, description: "Vehicles (4 trucks)", cost: 18e4, accumDepr: 108e3, nbv: 72e3, usefulLife: "5 years", method: "MACRS 5-Year", acquisitionDate: "2021-06-01" },
      { id: 3, description: "Leasehold Improvements", cost: 6e4, accumDepr: 28e3, nbv: 32e3, usefulLife: "15 years", method: "Straight-Line", acquisitionDate: "2022-03-01" }
    ],
    capexAnalysis: [
      { id: 1, period: "FY2022", capex: 45e3, maintenance: 28e3 },
      { id: 2, period: "FY2023", capex: 62e3, maintenance: 31e3 },
      { id: 3, period: "FY2024", capex: 38e3, maintenance: 29e3 }
    ]
  };
}
function buildPayroll() {
  const fy22Tax = 12 * Math.round((25e3 + 3e4) * 0.08);
  const fy23Tax = 12 * Math.round((25e3 + 31e3) * 0.08);
  const fy24Tax = 12 * Math.round((25e3 + 32e3) * 0.08);
  return {
    rawData: [
      ["", "FY2022", "FY2023", "FY2024"],
      ["Officer Compensation", "300000", "300000", "300000"],
      ["Wages & Salaries", "360000", "372000", "384000"],
      ["Payroll Taxes", String(fy22Tax), String(fy23Tax), String(fy24Tax)],
      ["Total Payroll", String(3e5 + 36e4 + fy22Tax), String(3e5 + 372e3 + fy23Tax), String(3e5 + 384e3 + fy24Tax)]
    ],
    source: "demo"
  };
}
function buildSupplementary() {
  return {
    debtSchedule: [
      {
        id: 1,
        lender: "First National Bank — Term Loan",
        originalAmount: 8e5,
        balance: 45e4,
        currentBalance: 45e4,
        interestRate: 5.5,
        maturityDate: "2027-06-30",
        type: "Term Loan"
      }
    ],
    leaseObligations: [
      {
        id: 1,
        description: "Warehouse Lease (12,000 sq ft)",
        leaseType: "Operating",
        type: "Operating",
        annualPayment: 144e3,
        remainingTerm: 3,
        expirationDate: "2027-12-31"
      }
    ],
    contingentLiabilities: []
  };
}
function buildTopCustomers() {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const fy22Rev = months.reduce((s, m) => s + monthlyRevenue(2022, m), 0);
  const fy23Rev = months.reduce((s, m) => s + monthlyRevenue(2023, m), 0);
  const fy24Rev = months.reduce((s, m) => s + monthlyRevenue(2024, m), 0);
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
        "2024": Math.round(fy24Rev * splits24[i])
      }
    })),
    totalRevenue: fy24Rev
  };
}
function buildTopVendors() {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const fy22Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2022, m) * 0.52), 0);
  const fy23Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2023, m) * 0.52), 0);
  const fy24Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2024, m) * 0.52), 0);
  const names = ["Primary Supplier Co.", "Secondary Supplier LLC", "Freight Logistics Inc.", "All Others"];
  const splits = [0.38, 0.22, 0.18, 0.22];
  return {
    vendors: names.map((name, i) => ({
      id: i + 1,
      name,
      yearlySpend: {
        "2022": Math.round(fy22Cogs * splits[i]),
        "2023": Math.round(fy23Cogs * splits[i]),
        "2024": Math.round(fy24Cogs * splits[i])
      }
    })),
    totalSpend: fy24Cogs
  };
}
function buildProofOfCash() {
  const periods = generatePeriods(1, 2022, 12, 2024);
  let cumulativeCash = 245e3;
  const cashByPeriod = {};
  let prevCash = 245e3;
  for (const p of periods) {
    const rev = monthlyRevenue(p.year, p.month);
    const cogs = Math.round(rev * 0.52);
    const officerSal = 25e3;
    const wages = 3e4 + (p.year - 2022) * 1e3;
    const payrollTax = Math.round((officerSal + wages) * 0.08);
    const rent = 12e3;
    const utilities = 2800 + (p.month >= 6 && p.month <= 8 ? 500 : 0);
    const insurance = 4e3;
    const software = 6e3 + (p.year - 2022) * 500;
    const interest = Math.max(4e3 - (p.year - 2022) * 400, 1500);
    const depreciation = 8e3;
    const taxes = Math.round(rev * 0.025);
    const netIncome = -rev + cogs + officerSal + wages + payrollTax + rent + utilities + insurance + software + interest + depreciation + taxes;
    const newCash = Math.max(cumulativeCash + -netIncome, 5e4);
    cashByPeriod[p.id] = { book: newCash, prevBook: prevCash };
    prevCash = newCash;
    cumulativeCash = newCash;
  }
  const monthlyData = periods.map((p, i) => {
    const { book, prevBook } = cashByPeriod[p.id] ?? { book: 0, prevBook: 0 };
    const rev = monthlyRevenue(p.year, p.month);
    const totalExpenses = Math.round(rev * 0.88);
    const timingVariance = i % 3 === 0 ? Math.round(rev * 5e-3) : 0;
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
      disbursementsPerBooks: totalExpenses
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
        dataSource: "statement"
      }
    ],
    monthlyData
  };
}
function buildJournalEntries() {
  const entries = [
    {
      id: "JE-2024-018",
      txnDate: "2024-12-31",
      totalAmount: 8e3,
      isAdjustment: false,
      memo: "Year-end Depreciation — Equipment",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 8e3, postingType: "DEBIT" },
        { accountName: "Accumulated Depreciation", accountId: "7200", amount: 8e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2024-017",
      txnDate: "2024-10-31",
      totalAmount: 18e3,
      isAdjustment: false,
      memo: "Software Subscription Prepayment — Annual SaaS Licenses",
      lines: [
        { accountName: "Prepaid Expenses", accountId: "6400", amount: 18e3, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 18e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2024-016",
      txnDate: "2024-09-30",
      totalAmount: 38e3,
      isAdjustment: false,
      memo: "Capital Equipment Purchase — Warehouse Forklift",
      lines: [
        { accountName: "Equipment, Gross", accountId: "7100", amount: 38e3, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 38e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2024-015",
      txnDate: "2024-06-30",
      totalAmount: 12500,
      isAdjustment: false,
      memo: "Mid-year Payroll Accrual — Officer Compensation",
      lines: [
        { accountName: "Officer Salaries", accountId: "3100", amount: 12500, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 12500, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2024-014",
      txnDate: "2024-03-31",
      totalAmount: 13e3,
      isAdjustment: false,
      memo: "Q1 Insurance Premium — Commercial Property & Liability",
      lines: [
        { accountName: "Prepaid Expenses", accountId: "6400", amount: 13e3, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 13e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2024-013",
      txnDate: "2024-01-15",
      totalAmount: 6e4,
      isAdjustment: false,
      memo: "Loan Principal Payment — Term Loan Q1 2024",
      lines: [
        { accountName: "Long-term Debt", accountId: "9100", amount: 6e4, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 6e4, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-012",
      txnDate: "2023-12-31",
      totalAmount: 21200,
      isAdjustment: false,
      memo: "Year-end Income Tax Accrual — FY2023",
      lines: [
        { accountName: "Income Tax Expense", accountId: "5300", amount: 21200, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 21200, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-011",
      txnDate: "2023-12-31",
      totalAmount: 3e4,
      isAdjustment: false,
      memo: "Year-end Employee Bonus Accrual",
      lines: [
        { accountName: "Wages & Salaries", accountId: "3200", amount: 3e4, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 3e4, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-010",
      txnDate: "2023-09-30",
      totalAmount: 22e3,
      isAdjustment: false,
      memo: "Inventory Write-down — Obsolete SKUs",
      lines: [
        { accountName: "Cost of Goods Sold", accountId: "2000", amount: 22e3, postingType: "DEBIT" },
        { accountName: "Inventory", accountId: "6300", amount: 22e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-009",
      txnDate: "2023-06-30",
      totalAmount: 4e3,
      isAdjustment: false,
      memo: "Mid-year Depreciation True-up — Equipment",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 4e3, postingType: "DEBIT" },
        { accountName: "Accumulated Depreciation", accountId: "7200", amount: 4e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-008",
      txnDate: "2023-06-01",
      totalAmount: 185e3,
      isAdjustment: true,
      memo: "Legal Settlement — Non-Recurring Litigation Expense",
      lines: [
        { accountName: "Insurance", accountId: "4300", amount: 185e3, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 185e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-007",
      txnDate: "2023-03-15",
      totalAmount: 36e3,
      isAdjustment: false,
      memo: "Equipment Lease Payment — Warehouse Facility Q1",
      lines: [
        { accountName: "Rent Expense", accountId: "4100", amount: 36e3, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 36e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2023-006",
      txnDate: "2023-01-15",
      totalAmount: 6e4,
      isAdjustment: false,
      memo: "Loan Principal Payment — Term Loan Q1 2023",
      lines: [
        { accountName: "Long-term Debt", accountId: "9100", amount: 6e4, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 6e4, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2022-005",
      txnDate: "2022-12-31",
      totalAmount: 18500,
      isAdjustment: false,
      memo: "Year-end Income Tax Accrual — FY2022",
      lines: [
        { accountName: "Income Tax Expense", accountId: "5300", amount: 18500, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 18500, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2022-004",
      txnDate: "2022-09-30",
      totalAmount: 25e3,
      isAdjustment: false,
      memo: "Deferred Revenue Recognition — Q3 Performance Contracts",
      lines: [
        { accountName: "Deferred Revenue", accountId: "8300", amount: 25e3, postingType: "DEBIT" },
        { accountName: "Sales Revenue", accountId: "1000", amount: 25e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2022-003",
      txnDate: "2022-06-30",
      totalAmount: 15e3,
      isAdjustment: false,
      memo: "Mid-year Payroll Accrual — Hourly Staff",
      lines: [
        { accountName: "Wages & Salaries", accountId: "3200", amount: 15e3, postingType: "DEBIT" },
        { accountName: "Accrued Liabilities", accountId: "8200", amount: 15e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2022-002",
      txnDate: "2022-03-31",
      totalAmount: 12e3,
      isAdjustment: false,
      memo: "Q1 Insurance Premium — Commercial Property & Liability",
      lines: [
        { accountName: "Prepaid Expenses", accountId: "6400", amount: 12e3, postingType: "DEBIT" },
        { accountName: "Cash and Cash Equivalents", accountId: "6100", amount: 12e3, postingType: "CREDIT" }
      ]
    },
    {
      id: "JE-2022-001",
      txnDate: "2022-01-31",
      totalAmount: 8e3,
      isAdjustment: false,
      memo: "Monthly Depreciation — Equipment Fleet",
      lines: [
        { accountName: "Depreciation & Amortization", accountId: "5200", amount: 8e3, postingType: "DEBIT" },
        { accountName: "Accumulated Depreciation", accountId: "7200", amount: 8e3, postingType: "CREDIT" }
      ]
    }
  ];
  return { entries, totalCount: entries.length, syncSource: void 0, lastSyncDate: void 0 };
}
function makePeriodValues(annualAmount) {
  const periods = generatePeriods(1, 2022, 12, 2024);
  const monthly = Math.round(annualAmount / 12);
  const out = {};
  for (const p of periods) out[p.id] = monthly;
  return out;
}
function buildMockDiscoveryProposals() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    updated_at: now
  };
  return [
    {
      ...base,
      id: "prop-demo-1",
      detector_type: "personal_expenses",
      title: "Personal & Discretionary Expenses",
      description: "Multiple personal charges identified across company credit cards — meals, travel, and subscriptions with no business purpose documentation.",
      block: "DD",
      adjustment_class: "personal_expense",
      intent: "remove_expense",
      linked_account_number: "4400",
      linked_account_name: "Software & IT",
      proposed_amount: 16279,
      proposed_period_values: makePeriodValues(16279),
      evidence_strength: "strong",
      review_priority: "high",
      internal_score: 0.92,
      support_json: { reported_amount: 16279, proposed_adjustment: 16279, confidence: 0.92, skeptic: "Some charges may have partial business use.", assumptions: ["No documentation found for flagged charges."] },
      ai_rationale: JSON.stringify({ rationale: "Identified 47 transactions across 3 credit cards totaling $16,279 with personal-use indicators: streaming subscriptions ($2,400/yr), vacation travel ($4,200), and restaurant charges on weekends/holidays ($9,679)." }),
      ai_key_signals: ["Weekend/holiday restaurant charges", "Streaming service subscriptions", "Personal travel bookings"],
      ai_warnings: ["Some restaurant charges may be client entertainment"]
    },
    {
      ...base,
      id: "prop-demo-2",
      detector_type: "owner_comp",
      title: "Owner Compensation Normalization",
      description: "Officer salary of $300K exceeds market rate for similar-sized distribution companies. Normalizing to $215K market equivalent.",
      block: "MA",
      adjustment_class: "normalization",
      intent: "normalize_down_expense",
      linked_account_number: "3100",
      linked_account_name: "Officer Salaries",
      proposed_amount: 85e3,
      proposed_period_values: makePeriodValues(85e3),
      evidence_strength: "strong",
      review_priority: "critical",
      internal_score: 0.95,
      support_json: { reported_amount: 3e5, proposed_adjustment: 85e3, confidence: 0.95, skeptic: "Market comp depends on region and responsibilities.", assumptions: ["Based on BLS and PEG data for $5-10M revenue distribution companies."] },
      ai_rationale: JSON.stringify({ rationale: "Officer compensation of $300K/yr is ~40% above the $215K median for owner-operators of $5-10M revenue distribution businesses in the Midwest region (BLS/PEG benchmarks)." }),
      ai_key_signals: ["Single officer on payroll", "Salary 40% above market median", "No employment agreement on file"],
      ai_warnings: ["Verify owner's actual role scope before finalizing"]
    },
    {
      ...base,
      id: "prop-demo-3",
      detector_type: "non_recurring",
      title: "One-Time Legal Settlement",
      description: "Legal settlement payment in June 2023 — non-recurring expense that should be excluded from normalized EBITDA.",
      block: "DD",
      adjustment_class: "non_recurring",
      intent: "remove_expense",
      linked_account_number: "4300",
      linked_account_name: "Insurance",
      proposed_amount: 42500,
      proposed_period_values: { "2023-06": 42500 },
      evidence_strength: "strong",
      review_priority: "high",
      internal_score: 0.88,
      support_json: { reported_amount: 42500, proposed_adjustment: 42500, confidence: 0.88, skeptic: "Confirm no ongoing litigation.", assumptions: ["Settlement was fully resolved with no future obligations."] },
      ai_rationale: JSON.stringify({ rationale: "Single payment of $42,500 to 'Morrison & Foerster LLP — Settlement' in June 2023. No similar payments in prior or subsequent periods. Classified as non-recurring legal expense." }),
      ai_key_signals: ["Single occurrence", "Law firm payee", "'Settlement' in memo"],
      ai_warnings: ["Confirm litigation is fully resolved"]
    },
    {
      ...base,
      id: "prop-demo-4",
      detector_type: "related_party",
      title: "Above-Market Related Party Rent",
      description: "Facility rent paid to entity owned by the seller exceeds market rate by ~$3,000/mo.",
      block: "PF",
      adjustment_class: "pro_forma",
      intent: "normalize_down_expense",
      linked_account_number: "4100",
      linked_account_name: "Rent Expense",
      proposed_amount: 36e3,
      proposed_period_values: makePeriodValues(36e3),
      evidence_strength: "moderate",
      review_priority: "normal",
      internal_score: 0.78,
      support_json: { reported_amount: 144e3, proposed_adjustment: 36e3, confidence: 0.78, skeptic: "Market rent depends on specific location and build-out.", assumptions: ["Comparable industrial rents in the area average $6.50/sq ft."] },
      ai_rationale: JSON.stringify({ rationale: "Rent of $12,000/mo ($5.14/sq ft) for 28,000 sq ft warehouse. Comparable industrial space in the area averages $3.86/sq ft. Above-market premium of ~$3,000/mo ($36K/yr) likely due to related-party arrangement." }),
      ai_key_signals: ["Landlord entity shares owner", "Rent exceeds market comps", "No arm's-length lease negotiation"],
      ai_warnings: ["Get independent appraisal for precision"]
    },
    {
      ...base,
      id: "prop-demo-5",
      detector_type: "non_recurring",
      title: "Non-Recurring Inventory Write-Down",
      description: "Inventory write-down in Q4 2023 for obsolete product line — one-time charge.",
      block: "DD",
      adjustment_class: "non_recurring",
      intent: "remove_expense",
      linked_account_number: "2000",
      linked_account_name: "Cost of Goods Sold",
      proposed_amount: 28400,
      proposed_period_values: { "2023-10": 28400 },
      evidence_strength: "moderate",
      review_priority: "normal",
      internal_score: 0.74,
      support_json: { reported_amount: 28400, proposed_adjustment: 28400, confidence: 0.74, skeptic: "Verify the product line was actually discontinued.", assumptions: ["Write-down is non-recurring and not part of regular inventory management."] },
      ai_rationale: JSON.stringify({ rationale: "JE memo references 'Obsolete inventory write-down — Series 400 product line discontinuation.' No similar entries in other periods. $28,400 booked to COGS in October 2023." }),
      ai_key_signals: ["'Write-down' in JE memo", "Product line discontinued", "Single occurrence"],
      ai_warnings: ["Confirm Series 400 is fully discontinued"]
    },
    {
      ...base,
      id: "prop-demo-6",
      detector_type: "personal_expenses",
      title: "Personal Vehicle Lease",
      description: "Monthly vehicle lease payment with no mileage log or business-use documentation.",
      block: "DD",
      adjustment_class: "personal_expense",
      intent: "remove_expense",
      linked_account_number: "4200",
      linked_account_name: "Utilities",
      proposed_amount: 14200,
      proposed_period_values: makePeriodValues(14200),
      evidence_strength: "weak",
      review_priority: "low",
      internal_score: 0.61,
      support_json: { reported_amount: 14200, proposed_adjustment: 14200, confidence: 0.61, skeptic: "Vehicle may have partial business use.", assumptions: ["No mileage log provided. Assuming 100% personal."] },
      ai_rationale: JSON.stringify({ rationale: "Recurring monthly payments of ~$1,183 to 'BMW Financial Services' booked to vehicle expense. No mileage log, fleet policy, or business-use documentation provided. Pattern suggests personal vehicle." }),
      ai_key_signals: ["Luxury vehicle brand", "No mileage documentation", "Consistent monthly payment"],
      ai_warnings: ["May have partial business use — request mileage log"]
    }
  ];
}
function buildMockReclassificationFlags() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const base = {
    project_id: "demo",
    user_id: "demo-user",
    status: "pending",
    reviewed_at: null,
    reviewed_by: null,
    source_data: {},
    created_at: now,
    updated_at: now,
    classification_context: null,
    flag_category: "reclassification"
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
        reasoning: "HVAC system replacement exceeds capitalization threshold and has multi-year useful life."
      }
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
        reasoning: "Asset sale proceeds are non-operating and should not be included in recurring revenue."
      }
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
        reasoning: "Shipping costs directly tied to product sales belong in COGS per matching principle."
      }
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
        reasoning: "Personal vehicle expense without business-use documentation is an owner benefit, not an operating cost."
      }
    },
    {
      ...base,
      id: "flag-demo-5",
      transaction_date: "2024-09-15",
      description: "Customer prepayment for Q4 orders — deposited and booked as revenue",
      amount: 45e3,
      account_name: "Sales Revenue",
      flag_type: "reclass_gain_loss_in_revenue",
      flag_reason: "Customer deposit of $45,000 booked to Revenue before goods were shipped. Should be reclassified to Deferred Revenue (liability) until delivery obligation is fulfilled.",
      confidence_score: 0.91,
      suggested_adjustment_type: "reclassification",
      suggested_adjustment_amount: 45e3,
      ai_analysis: {
        suggested_from_line_item: "Revenue",
        suggested_to_line_item: "Deferred Revenue (Liability)",
        matched_keywords: ["prepayment", "deposit", "Q4 orders", "advance"],
        reasoning: "Revenue recognition requires delivery of goods. Prepayments should be deferred until performance obligation is met."
      }
    }
  ];
}
function buildMockTransferClassifications() {
  return {
    summary: { total: 8921, operating: 7218, interbank: 847, owner: 412, other: 444 },
    cases: [
      {
        case_id: "demo-case-1",
        case_type: "internal_transfer",
        status: "suggested",
        confidence: 0.96,
        total_dollars: 284e3,
        transaction_count: 24,
        date_range: ["2022-01-15", "2024-12-20"],
        representative_txn_ids: ["t1", "t2", "t3"],
        edge_case_txn_ids: [],
        evidence_summary: [{ type: "matching_pair", weight: 0.9 }],
        risk_score: 0.2,
        reasoning_label: "Matched interbank pair (24 transactions)",
        transactions: []
      },
      {
        case_id: "demo-case-2",
        case_type: "owner_related",
        status: "suggested",
        confidence: 0.88,
        total_dollars: 156e3,
        transaction_count: 36,
        date_range: ["2022-02-01", "2024-11-30"],
        representative_txn_ids: ["t4", "t5"],
        edge_case_txn_ids: ["t6"],
        evidence_summary: [{ type: "owner_pattern", weight: 0.85 }],
        risk_score: 0.65,
        reasoning_label: "Owner Draws & Distributions",
        transactions: []
      },
      {
        case_id: "demo-case-3",
        case_type: "internal_transfer",
        status: "suggested",
        confidence: 0.91,
        total_dollars: 47200,
        transaction_count: 12,
        date_range: ["2022-06-01", "2024-09-15"],
        representative_txn_ids: ["t7"],
        edge_case_txn_ids: [],
        evidence_summary: [{ type: "matching_pair", weight: 0.88 }],
        risk_score: 0.15,
        reasoning_label: "Credit Card Payments",
        transactions: []
      },
      {
        case_id: "demo-case-4",
        case_type: "owner_related",
        status: "suggested",
        confidence: 0.72,
        total_dollars: 38400,
        transaction_count: 18,
        date_range: ["2023-01-10", "2024-12-05"],
        representative_txn_ids: ["t8", "t9"],
        edge_case_txn_ids: ["t10"],
        evidence_summary: [{ type: "owner_pattern", weight: 0.7 }],
        risk_score: 0.55,
        reasoning_label: "Personal App Transfers",
        transactions: []
      },
      {
        case_id: "demo-case-5",
        case_type: "ambiguous",
        status: "suggested",
        confidence: 0.58,
        total_dollars: 22800,
        transaction_count: 8,
        date_range: ["2023-03-01", "2024-08-20"],
        representative_txn_ids: ["t11"],
        edge_case_txn_ids: ["t12", "t13"],
        evidence_summary: [{ type: "heuristic_match", weight: 0.55 }],
        risk_score: 0.78,
        reasoning_label: "Needs manual review",
        transactions: []
      }
    ]
  };
}
function createMockProjectData() {
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
    periods,
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
            contractValue: 12e5,
            annualValue: 12e5,
            expirationDate: "2026-03-31",
            changeOfControl: "Consent required"
          },
          {
            id: 2,
            contractType: "Customer",
            counterparty: "National Industrial Distributors Inc.",
            description: "Regional distribution agreement granting exclusivity in the Midwest corridor — auto-renews annually",
            contractValue: 95e4,
            annualValue: 95e4,
            expirationDate: "2025-12-31",
            changeOfControl: "Termination right"
          },
          {
            id: 3,
            contractType: "Lease",
            counterparty: "Greenfield Industrial Properties",
            description: "Operating lease for 28,000 sq ft warehouse and distribution facility at 4400 Commerce Drive",
            contractValue: 54e4,
            annualValue: 18e4,
            expirationDate: "2027-06-30",
            changeOfControl: "None"
          }
        ]
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
      taxReturns: { hasData: true }
    }
  };
}
export {
  createMockProjectData as c
};
