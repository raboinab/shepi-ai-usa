import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { i as trackEvent, B as Button } from "../main.mjs";
import { LayoutGrid, Table, BarChart3 } from "lucide-react";
import { W as WorkbookShell } from "./WorkbookShell-yE0LNnTn.js";
import { I as InsightsView } from "./InsightsView-BkA7fJjp.js";
import { g as groupByFiscalYear, b as buildAggregatePeriods, a as buildTbIndex } from "./sanitizeWizardData-nrsUY-BP.js";
import { D as DemoAuthGate } from "./DemoAuthGate-DDTOHLYa.js";
import { c as createMockProjectData } from "./mockWizardData-Bexxp34E.js";
import { e as exportWorkbookXlsx } from "./exportWorkbookXlsx-Cd_42-fY.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "./spinner-DXdBpr08.js";
import "./useAdjustmentProofs-BvjUM7OL.js";
import "react-resizable-panels";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "recharts";
import "./badge-BbLwm7hH.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "./table-CVoj8f5R.js";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-CSM87NBF.js";
import "react-markdown";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./TermsAcceptanceModal-DCI1QJ_5.js";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./periodUtils-DliZcATp.js";
import "xlsx";
function pid(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
function shortLabel(year, month) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[month - 1]}-${String(year).slice(-2)}`;
}
function buildPeriods() {
  const periods = [];
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
        endDate: (() => {
          const ld = new Date(y, m, 0);
          return `${y}-${String(m).padStart(2, "0")}-${String(ld.getDate()).padStart(2, "0")}`;
        })()
      });
    }
  }
  return periods;
}
function monthlyRevenue(year, month) {
  const base = 42e4;
  const yearGrowth = (year - 2022) * 0.08;
  const seasonal = [0, -0.03, 0.01, 0.02, 0.02, 0.03, 0.02, 0.01, 0.02, 0.04, 0.05, 0.06][month - 1];
  return Math.round(base * (1 + yearGrowth) * (1 + seasonal));
}
function buildTrialBalance(periods) {
  const isEntries = [
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
    { accountId: "5300", accountName: "Income Tax Expense", fsType: "IS", fsLineItem: "Other expense (income)", subAccount1: "", subAccount2: "", subAccount3: "" }
  ];
  const bsNonEquityEntries = [
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
    { accountId: "9100", accountName: "Long-term Debt", fsType: "BS", fsLineItem: "Long term liabilities", subAccount1: "", subAccount2: "", subAccount3: "" }
  ];
  const equityMeta = {
    accountId: "9200",
    accountName: "Retained Earnings / Equity",
    fsType: "BS",
    fsLineItem: "Equity",
    subAccount1: "",
    subAccount2: "",
    subAccount3: ""
  };
  const isBalances = {};
  for (const e of isEntries) {
    isBalances[e.accountId] = {};
  }
  let cumulativeCash = 245e3;
  const bsBalances = {};
  for (const e of bsNonEquityEntries) {
    bsBalances[e.accountId] = {};
  }
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
    const interest = 4e3 - (p.year - 2022) * 400 - Math.floor((p.month - 1) / 12) * 200;
    const depreciation = 8e3;
    const taxes = Math.round(rev * 0.025);
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
    const netIncome = -rev + cogs + officerSal + wages + payrollTax + rent + utilities + insurance + software + Math.max(interest, 1500) + depreciation + taxes;
    const cashChange = -netIncome;
    cumulativeCash += cashChange;
    bsBalances["6100"][p.id] = Math.max(cumulativeCash, 5e4);
    bsBalances["6200"][p.id] = Math.round(rev * 1.5);
    bsBalances["6300"][p.id] = 18e4 + (p.year - 2022) * 1e4;
    bsBalances["6400"][p.id] = 3e4;
    bsBalances["7100"][p.id] = 96e4;
    bsBalances["7200"][p.id] = -(288e3 + (p.year * 12 + p.month - (2022 * 12 + 1)) * 8e3);
    bsBalances["7300"][p.id] = 5e4;
    bsBalances["8100"][p.id] = -Math.round(cogs * 0.55);
    bsBalances["8200"][p.id] = -45e3;
    bsBalances["8300"][p.id] = -25e3;
    bsBalances["9100"][p.id] = -(8e5 - (p.year * 12 + p.month - (2022 * 12 + 1)) * 1e4);
  }
  const equityBalances = {};
  for (const p of periods) {
    let bsSum = 0;
    for (const e of bsNonEquityEntries) bsSum += bsBalances[e.accountId][p.id] ?? 0;
    let isSum = 0;
    for (const e of isEntries) isSum += isBalances[e.accountId][p.id] ?? 0;
    equityBalances[p.id] = -(bsSum + isSum);
  }
  const result = [];
  for (const e of isEntries) {
    result.push({ ...e, balances: isBalances[e.accountId] });
  }
  for (const e of bsNonEquityEntries) {
    result.push({ ...e, balances: bsBalances[e.accountId] });
  }
  result.push({ ...equityMeta, balances: equityBalances });
  return result;
}
function buildAdjustments(periods) {
  const adj1Amounts = {};
  for (const p of periods) {
    adj1Amounts[p.id] = 1e4;
  }
  const adj2Amounts = {};
  for (const p of periods) {
    adj2Amounts[p.id] = p.id === "2023-06" ? 185e3 : 0;
  }
  const adj3Amounts = {};
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
      amounts: adj1Amounts
    },
    {
      id: "adj-2",
      type: "DD",
      label: "One-Time Legal Settlement",
      tbAccountNumber: "4300",
      intent: "remove_expense",
      notes: "Non-recurring legal settlement in June 2023. Excluded from normalized earnings.",
      amounts: adj2Amounts
    },
    {
      id: "adj-3",
      type: "PF",
      label: "Pro Forma Market Rent",
      tbAccountNumber: "4100",
      intent: "pro_forma_expense",
      notes: "Rent below market. Pro forma adjustment to reflect market rate of $13,500/mo.",
      amounts: adj3Amounts
    }
  ];
}
function buildReclassifications(periods) {
  const amounts = {};
  for (const p of periods) {
    amounts[p.id] = 2e3;
  }
  return [
    {
      id: "reclass-1",
      label: "Officer Auto Expense to Compensation",
      fromAccount: "4200",
      toAccount: "3100",
      amounts
    }
  ];
}
function buildSupplementary() {
  return {
    debtSchedule: [
      {
        lender: "First National Bank — Term Loan",
        balance: 45e4,
        interestRate: 5.5,
        maturityDate: "2027-06-30",
        type: "Term Loan"
      }
    ],
    leaseObligations: [
      {
        description: "Warehouse Lease (12,000 sq ft)",
        leaseType: "Operating",
        annualPayment: 144e3,
        remainingTerm: 3,
        expirationDate: "2027-12-31"
      }
    ]
  };
}
function buildARaging() {
  return {
    "2024-12": [
      { name: "Acme Corp", current: 33e4, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 33e4 },
      { name: "Beta LLC", current: 15e4, days1to30: 62e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 212e3 },
      { name: "Gamma Industries", current: 8e4, days1to30: 0, days31to60: 5e4, days61to90: 0, days90plus: 0, total: 13e4 },
      { name: "Delta Co", current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 15648, total: 15648 },
      { name: "All Others", current: 87e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 87e3 }
    ],
    "2024-11": [
      { name: "Acme Corp", current: 325e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 325e3 },
      { name: "Beta LLC", current: 2e5, days1to30: 55e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 255e3 },
      { name: "All Others", current: 187340, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 187340 }
    ]
  };
}
function buildAPaging() {
  return {
    "2024-12": [
      { name: "Primary Supplier Co.", current: 1e5, days1to30: 2e4, days31to60: 0, days61to90: 0, days90plus: 0, total: 12e4 },
      { name: "Secondary Supplier LLC", current: 18e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 18e3 },
      { name: "Freight Logistics Inc.", current: 0, days1to30: 7e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 7e3 },
      { name: "Metro Utilities", current: 2700, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 2700 }
    ],
    "2024-11": [
      { name: "Primary Supplier Co.", current: 1e5, days1to30: 18e3, days31to60: 0, days61to90: 0, days90plus: 0, total: 118e3 },
      { name: "Secondary Supplier LLC", current: 18e3, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 18e3 },
      { name: "Metro Utilities", current: 10306, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 10306 }
    ]
  };
}
function buildFixedAssets() {
  return [
    { category: "Machinery & Equipment", description: "CNC Milling Machine & Assembly Equipment", acquisitionDate: "2020-01-15", cost: 72e4, accumulatedDepreciation: 432e3, netBookValue: 288e3 },
    { category: "Vehicles", description: "Delivery Fleet (4 trucks)", acquisitionDate: "2021-06-01", cost: 18e4, accumulatedDepreciation: 108e3, netBookValue: 72e3 },
    { category: "Leasehold Improvements", description: "Warehouse buildout & office renovation", acquisitionDate: "2022-03-01", cost: 6e4, accumulatedDepreciation: 28e3, netBookValue: 32e3 }
  ];
}
function buildTopCustomers() {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const fy22Rev = months.reduce((s, m) => s + monthlyRevenue(2022, m), 0);
  const fy23Rev = months.reduce((s, m) => s + monthlyRevenue(2023, m), 0);
  const fy24Rev = months.reduce((s, m) => s + monthlyRevenue(2024, m), 0);
  return {
    "annual-2022": [
      { name: "Acme Corp", revenue: Math.round(fy22Rev * 0.28), percentage: 28 },
      { name: "Beta LLC", revenue: Math.round(fy22Rev * 0.18), percentage: 18 },
      { name: "Gamma Industries", revenue: Math.round(fy22Rev * 0.12), percentage: 12 },
      { name: "Delta Co", revenue: Math.round(fy22Rev * 0.08), percentage: 8 },
      { name: "All Others", revenue: Math.round(fy22Rev * 0.34), percentage: 34 }
    ],
    "annual-2023": [
      { name: "Acme Corp", revenue: Math.round(fy23Rev * 0.31), percentage: 31 },
      { name: "Beta LLC", revenue: Math.round(fy23Rev * 0.17), percentage: 17 },
      { name: "Gamma Industries", revenue: Math.round(fy23Rev * 0.14), percentage: 14 },
      { name: "Delta Co", revenue: Math.round(fy23Rev * 0.07), percentage: 7 },
      { name: "All Others", revenue: Math.round(fy23Rev * 0.31), percentage: 31 }
    ],
    "annual-2024": [
      { name: "Acme Corp", revenue: Math.round(fy24Rev * 0.34), percentage: 34 },
      { name: "Beta LLC", revenue: Math.round(fy24Rev * 0.16), percentage: 16 },
      { name: "Gamma Industries", revenue: Math.round(fy24Rev * 0.13), percentage: 13 },
      { name: "Delta Co", revenue: Math.round(fy24Rev * 0.09), percentage: 9 },
      { name: "All Others", revenue: Math.round(fy24Rev * 0.28), percentage: 28 }
    ]
  };
}
function buildTopVendors() {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const fy22Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2022, m) * 0.52), 0);
  const fy23Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2023, m) * 0.52), 0);
  const fy24Cogs = months.reduce((s, m) => s + Math.round(monthlyRevenue(2024, m) * 0.52), 0);
  const makeVendors = (totalSpend) => {
    const primary = Math.round(totalSpend * 0.38);
    const secondary = Math.round(totalSpend * 0.22);
    const freight = Math.round(totalSpend * 0.18);
    const others = totalSpend - primary - secondary - freight;
    return [
      { name: "Primary Supplier Co.", spend: primary, percentage: 38 },
      { name: "Secondary Supplier LLC", spend: secondary, percentage: 22 },
      { name: "Freight Logistics Inc.", spend: freight, percentage: 18 },
      { name: "All Others", spend: others, percentage: 22 }
    ];
  };
  return {
    "annual-2022": makeVendors(fy22Cogs),
    "annual-2023": makeVendors(fy23Cogs),
    "annual-2024": makeVendors(fy24Cogs)
  };
}
function createMockDealData() {
  const periods = buildPeriods();
  const fiscalYears = groupByFiscalYear(periods, 12);
  const aggregatePeriods = buildAggregatePeriods(periods, fiscalYears, 12);
  const trialBalance = buildTrialBalance(periods);
  const tbIndex = buildTbIndex(trialBalance);
  const adjustments = buildAdjustments(periods);
  const reclassifications = buildReclassifications(periods);
  return {
    deal: {
      projectId: "demo",
      projectName: "Acme Industrial Supply — Demo",
      clientName: "shepi Capital Advisors",
      targetCompany: "Acme Industrial Supply Co.",
      industry: "Manufacturing / Distribution",
      transactionType: "Buy-Side",
      fiscalYearEnd: 12,
      periods,
      fiscalYears,
      aggregatePeriods
    },
    accounts: trialBalance.map((e) => ({
      accountId: e.accountId,
      accountName: e.accountName,
      fsType: e.fsType,
      fsLineItem: e.fsLineItem,
      subAccount1: e.subAccount1,
      subAccount2: e.subAccount2,
      subAccount3: e.subAccount3
    })),
    trialBalance,
    adjustments,
    reclassifications,
    tbIndex,
    monthDates: periods.map((p) => p.date),
    arAging: buildARaging(),
    apAging: buildAPaging(),
    fixedAssets: buildFixedAssets(),
    topCustomers: buildTopCustomers(),
    topVendors: buildTopVendors(),
    addbacks: {
      interest: ["5100"],
      depreciation: ["5200"],
      taxes: ["5300"]
    },
    supplementary: buildSupplementary()
  };
}
function createMockBankStatements() {
  const periods = buildPeriods();
  let openingBalance = 245e3;
  const statements = [];
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const rev = monthlyRevenue(p.year, p.month);
    const totalCredits = Math.round(rev * 0.98);
    const cogs = Math.round(rev * 0.52);
    const payroll = 25e3 + 3e4 + (p.year - 2022) * 1e3 + Math.round((55e3 + (p.year - 2022) * 1e3) * 0.08);
    const opex = 12e3 + 2800 + 4e3 + 6e3 + (p.year - 2022) * 500;
    const debtService = 1e4;
    const ownerDraw = 3500;
    const totalDebits = Math.round(cogs * 0.85 + payroll + opex + debtService + ownerDraw);
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
        transactionCount: Math.round(totalCredits / 15e3) + Math.round(totalDebits / 8e3)
      },
      createdAt: new Date(p.year, p.month - 1, 28).toISOString()
    });
    openingBalance = closingBalance;
  }
  return statements;
}
function createMockTransferClassifications() {
  const periods = buildPeriods();
  const map = /* @__PURE__ */ new Map();
  for (const p of periods) {
    map.set(p.id, { interbank: 0, interbankIn: 0, interbankOut: 0, owner: 3500 });
  }
  return map;
}
function WorkbookDemo() {
  const navigate = useNavigate();
  const dealData = useMemo(() => createMockDealData(), []);
  const mockBankStatements = useMemo(() => createMockBankStatements(), []);
  const mockTransferClassifications = useMemo(() => createMockTransferClassifications(), []);
  const mockProject = useMemo(() => createMockProjectData(), []);
  const [viewMode, setViewMode] = useState("workbook");
  useEffect(() => {
    trackEvent("workbook_tab_viewed", { demo: "workbook", tab: viewMode });
  }, [viewMode]);
  const handleExport = useCallback(() => {
    trackEvent("demo_workbook_exported", { format: "xlsx", demo: "workbook" });
    exportWorkbookXlsx({ dealData });
  }, [dealData]);
  return /* @__PURE__ */ jsx(DemoAuthGate, { page: "workbook", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-screen", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between gap-2 px-4 py-2 bg-card border-b border-border shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-destructive bg-destructive/15 px-2 py-0.5 rounded uppercase tracking-wide shrink-0", children: "Demo" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold truncate hidden sm:inline", children: "Acme Industrial Supply Co." }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground hidden md:inline ml-2", children: "Mock data · Jan 2022 – Dec 2024 · 36 months" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center border rounded-md shrink-0", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => navigate("/wizard/demo"),
            className: "gap-1 rounded-none rounded-l-md px-2 sm:px-3",
            title: "Wizard",
            children: [
              /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Wizard" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: viewMode === "workbook" ? "secondary" : "ghost",
            size: "sm",
            onClick: () => setViewMode("workbook"),
            className: "gap-1 rounded-none border-l px-2 sm:px-3",
            title: "Workbook",
            children: [
              /* @__PURE__ */ jsx(Table, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Workbook" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: viewMode === "insights" ? "secondary" : "ghost",
            size: "sm",
            onClick: () => setViewMode("insights"),
            className: "gap-1 rounded-none rounded-r-md border-l px-2 sm:px-3",
            title: "Insights",
            children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Insights" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0", children: [
      viewMode === "workbook" && /* @__PURE__ */ jsx(
        WorkbookShell,
        {
          dealData,
          mockBankStatements,
          mockTransferClassifications,
          onExport: handleExport
        }
      ),
      viewMode === "insights" && /* @__PURE__ */ jsx(InsightsView, { project: mockProject })
    ] })
  ] }) });
}
export {
  WorkbookDemo as default
};
