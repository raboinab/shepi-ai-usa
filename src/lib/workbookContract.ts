/**
 * Workbook Tab Contract - Defines which tabs are writable, readable, or ignored
 * This contract is used by the edge function to validate sync requests
 */

// Tabs where user-entered data belongs - these become wizard steps and sync targets
// Updated for new template: QofE_AI_-_Quality_of_Earnings_workbook_complete-3.xlsx
export const WRITE_TABS = new Set([
  "Due Diligence Information",
  "Trial Balance",
  "AR Aging",
  "AP Aging",
  "Fixed Assets",               // capital A
  "Top Customers by Year",
  "Top Vendors by Year",
  "Proof of Cash",
]);

// Derived/formula-driven tabs that should be READ ONLY (treat as reports)
// Updated for new template TOC - includes all calculated tabs
// NOTE: Uses no-spaces format for detailed tabs to match sync-sheet constants
export const REPORT_TABS = new Set([
  // Primary Financial Statements
  "Income Statement",            // Tab 6
  "Income Statement-Detailed",   // Tab 7 (no spaces - canonical)
  "Income Statement - Detailed", // Tab 7 (with spaces - alternate)
  "Balance Sheet",               // Tab 15
  "Balance Sheet-Detailed",      // Tab 16 (no spaces - canonical)
  "Balance Sheet - Detailed",    // Tab 16 (with spaces - alternate)
  // QoE Reports
  "QoE Analysis",                // Tab 3
  // Detail Schedules (IS breakdown)
  "Sales",                       // Tab 8
  "Cost of Goods Sold",          // Tab 9
  "Operating Expenses",          // Tab 10
  "Other expense (income)",      // Tab 11
  "Payroll & Related",           // Tab 12
  // Working Capital Reports
  "WC",                          // Tab 13
  "NWC Analysis",                // Tab 14
  "Cash",                        // Tab 17
  "Other Current Assets",        // Tab 19
  "Other Current Liabilities",   // Tab 21
  // Cash Flow
  "Free Cash Flow",              // Tab 26
  // Supplementary
  "Supplementary",               // Tab 22
]);

// All readable tabs (includes both WRITE and REPORT)
export const READ_TABS = new Set([
  ...WRITE_TABS,
  ...REPORT_TABS,
  "Industry KPIs & Benchmarks",
  "Legend",
]);

// Navigation/index tabs - ignore for sync
export const IGNORE_TABS = new Set([
  "QofE =>",
  "WC =>",
  "Supplementary =>",
  "Legend",
]);

// ============================================
// Trial Balance Tab Constants (Updated for new template)
// ============================================
// Monthly columns: I → BC (47 months)
// Header row: 7
// First data row: 8
// Metadata columns: B-H (7 columns)
export const TB_CONTRACT = {
  sheetName: "Trial Balance",
  headerRow: 7,
  firstDataRow: 8,
  templateRow: 8,         // Row to copy formatting from
  monthStartCol: "I",     // Column 9 (was H/8)
  monthEndCol: "BC",      // Column 55 (was BF/58)
  numMonths: 47,          // I(9) to BC(55) = 47 columns (was 51)
  maxDataRows: 500,       // Maximum accounts before needing row insertion
  columns: {
    fsType: "B",          // Column 2
    accountId: "C",       // Column 3 (treat as text)
    accountName: "D",     // Column 4
    fsLineItem: "E",      // Column 5 - Financial Statement Line Item
    subAccount1: "F",     // Column 6 - Sub Account 1
    subAccount2: "G",     // Column 7 - Sub Account 2
    subAccount3: "H",     // Column 8 - Sub Account 3
  },
  // Plug row configuration (mirrors backend PLUG_ROW_METADATA)
  plugRow: {
    marker: "Plug",
    defaultPosition: 78,
    metadata: {
      fsType: "Plug",
      accountId: "Plug",
      accountName: "Net income",
      fsLineItem: "Equity",
      subAccount1: "Retained earnings",
      subAccount2: "Net income",
      subAccount3: "",
    },
  },
  // Do-not-write zones
  protectedRows: [2, 3, 4, 5, 7], // Checks/summary rows and header
};

// Fixed Reserved Ranges for AR/AP Aging
// Each period block spans 15 rows with 7 columns
export const AR_AGING_CONTRACT = {
  sheetName: "AR Aging",
  headerRow: 4,
  columns: {
    customer: "A",
    current: "B",
    days1to30: "C",
    days31to60: "D",
    days61to90: "E",
    days90plus: "F",
    total: "G",
  },
  // Fixed period blocks - each period gets 15 rows
  periodBlocks: [
    { periodId: "period_1", startRow: 5, endRow: 19 },
    { periodId: "period_2", startRow: 21, endRow: 35 },
    { periodId: "period_3", startRow: 37, endRow: 51 },
    { periodId: "period_4", startRow: 53, endRow: 67 },
    { periodId: "period_5", startRow: 69, endRow: 83 },
    { periodId: "period_6", startRow: 85, endRow: 99 },
  ],
  maxCustomersPerPeriod: 15,
};

export const AP_AGING_CONTRACT = {
  sheetName: "AP Aging",
  headerRow: 4,
  columns: {
    vendor: "A",
    current: "B",
    days1to30: "C",
    days31to60: "D",
    days61to90: "E",
    days90plus: "F",
    total: "G",
  },
  // Fixed period blocks - same structure as AR
  periodBlocks: [
    { periodId: "period_1", startRow: 5, endRow: 19 },
    { periodId: "period_2", startRow: 21, endRow: 35 },
    { periodId: "period_3", startRow: 37, endRow: 51 },
    { periodId: "period_4", startRow: 53, endRow: 67 },
    { periodId: "period_5", startRow: 69, endRow: 83 },
    { periodId: "period_6", startRow: 85, endRow: 99 },
  ],
  maxVendorsPerPeriod: 15,
};

// Aging bucket labels
export const AGING_BUCKETS = [
  { key: "current", label: "Current", days: "0-30" },
  { key: "days1to30", label: "1-30 Days", days: "1-30" },
  { key: "days31to60", label: "31-60 Days", days: "31-60" },
  { key: "days61to90", label: "61-90 Days", days: "61-90" },
  { key: "days90plus", label: "90+ Days", days: "90+" },
] as const;

// Helper to check if a tab is writable
export const isWriteTab = (tabName: string): boolean => WRITE_TABS.has(tabName);

// Helper to check if a tab is readable
export const isReadTab = (tabName: string): boolean => READ_TABS.has(tabName);

// Helper to check if a tab is a report (read-only)
export const isReportTab = (tabName: string): boolean => REPORT_TABS.has(tabName);

// Helper to check if a tab should be ignored
export const isIgnoreTab = (tabName: string): boolean => IGNORE_TABS.has(tabName);
 
 // ============================================
 // QoE Analysis Tab Contract
 // ============================================
 // QoE Analysis is a LEDGER (writable), not a report
 // Users create MA/DD/PF adjustments and reclassifications
 
 export const QOE_ANALYSIS_CONTRACT = {
   sheetName: "QoE Analysis",
   mode: "expandable-ledger" as const,
   
   // Header row for period detection (scan for date patterns)
   headerRow: 10,
   
   // Metadata columns (written for each adjustment)
   columns: {
     adjustmentId: "C",      // Display ID (first 8 chars of UUID)
     adjustmentType: "D",    // Block type (MA/DD/PF)
     tbAccountNumber: "E",   // TB account anchor (required)
     notes: "S",             // Evidence / notes
   },
   
   // Period column defaults (validated at sync time)
   // CRITICAL: These must be derived from project.periods and validated
   // against template header row. Hardcoding is fallback only.
   ebitdaMonthCols: {
     default: { start: 21, end: 67 },  // U:BO (1-indexed)
     count: 47,
     // Detect first/last date column by scanning header row 10
     detectPattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
   },
   
   // Reclassification bucket columns (fixed arrays)
   reclassBuckets: {
     bucket1: { start: 46, end: 53, count: 8 },  // AT:BA
     bucket2: { start: 58, end: 65, count: 8 },  // BF:BM
   },
   
   // Block coordinates (expandable)
   blocks: {
     managementAdjustments: {
       type: "MA" as const,
       detailStartRow: 15,
       detailEndRow: 16,
       totalRow: 17,
       capacity: 2,
     },
     dueDiligenceAdjustments: {
       type: "DD" as const,
       detailStartRow: 20,
       detailEndRow: 21,
       totalRow: 22,
       capacity: 2,
     },
     proFormaAdjustments: {
       type: "PF" as const,
       detailStartRow: 25,
       detailEndRow: 26,
       totalRow: 27,
       capacity: 2,
     },
     reclassifications: {
       type: "RECLASS" as const,
       detailStartRow: 39,
       detailEndRow: 43,
       totalRow: 38,  // Total row is ABOVE detail for reclass
       capacity: 5,
     },
   },
   
   // Protected rows (never write to these)
   protectedRows: [
     1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, // Headers and labels
     17, 18, 19,  // MA total row and spacing
     22, 23, 24,  // DD total row and spacing
     27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,  // PF total row, spacing, and reclass header/total
   ],
   
   // Maximum rows that can be inserted before aborting
   maxInsertRows: 200,
   
   // If project.periods.length exceeds available template columns, sync should abort
   abortIfPeriodsExceedColumns: true,
 };
 
 // Helper to get block config by type
 export function getQoeBlockByType(type: string) {
   const blocks = QOE_ANALYSIS_CONTRACT.blocks;
   if (type === "MA") return blocks.managementAdjustments;
   if (type === "DD") return blocks.dueDiligenceAdjustments;
   if (type === "PF") return blocks.proFormaAdjustments;
   if (type === "RECLASS") return blocks.reclassifications;
   return null;
 }
