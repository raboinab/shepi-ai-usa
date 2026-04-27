const WRITE_TABS = /* @__PURE__ */ new Set([
  "Due Diligence Information",
  "Trial Balance",
  "AR Aging",
  "AP Aging",
  "Fixed Assets",
  // capital A
  "Top Customers by Year",
  "Top Vendors by Year",
  "Proof of Cash"
]);
const REPORT_TABS = /* @__PURE__ */ new Set([
  // Primary Financial Statements
  "Income Statement",
  // Tab 6
  "Income Statement-Detailed",
  // Tab 7 (no spaces - canonical)
  "Income Statement - Detailed",
  // Tab 7 (with spaces - alternate)
  "Balance Sheet",
  // Tab 15
  "Balance Sheet-Detailed",
  // Tab 16 (no spaces - canonical)
  "Balance Sheet - Detailed",
  // Tab 16 (with spaces - alternate)
  // QoE Reports
  "QoE Analysis",
  // Tab 3
  // Detail Schedules (IS breakdown)
  "Sales",
  // Tab 8
  "Cost of Goods Sold",
  // Tab 9
  "Operating Expenses",
  // Tab 10
  "Other expense (income)",
  // Tab 11
  "Payroll & Related",
  // Tab 12
  // Working Capital Reports
  "WC",
  // Tab 13
  "NWC Analysis",
  // Tab 14
  "Cash",
  // Tab 17
  "Other Current Assets",
  // Tab 19
  "Other Current Liabilities",
  // Tab 21
  // Cash Flow
  "Free Cash Flow",
  // Tab 26
  // Supplementary
  "Supplementary"
  // Tab 22
]);
/* @__PURE__ */ new Set([
  ...WRITE_TABS,
  ...REPORT_TABS,
  "Industry KPIs & Benchmarks",
  "Legend"
]);
const AR_AGING_CONTRACT = {
  maxCustomersPerPeriod: 15
};
const AP_AGING_CONTRACT = {
  maxVendorsPerPeriod: 15
};
const AGING_BUCKETS = [
  { key: "current", label: "Current", days: "0-30" },
  { key: "days1to30", label: "1-30 Days", days: "1-30" },
  { key: "days31to60", label: "31-60 Days", days: "31-60" },
  { key: "days61to90", label: "61-90 Days", days: "61-90" },
  { key: "days90plus", label: "90+ Days", days: "90+" }
];
export {
  AGING_BUCKETS as A,
  AR_AGING_CONTRACT as a,
  AP_AGING_CONTRACT as b
};
