// Unified Data Completeness Utility
// Centralized logic for checking data presence across wizard_data sections

/**
 * Unified data presence check - handles all wizard_data structures
 * Used by CompletenessTracker (Insights) and ExportCenterSection (Deliverables)
 */
export const checkHasData = (data: unknown): boolean => {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Check for rawData (spreadsheet data from Google Sheets)
    if (obj.rawData && Array.isArray(obj.rawData) && obj.rawData.length > 0) return true;
    // Check for items array (generic)
    if (obj.items && Array.isArray(obj.items) && obj.items.length > 0) return true;
    // Check for customers/vendors arrays
    if (obj.customers && Array.isArray(obj.customers) && obj.customers.length > 0) return true;
    if (obj.vendors && Array.isArray(obj.vendors) && obj.vendors.length > 0) return true;
    // Check for contracts array
    if (obj.contracts && Array.isArray(obj.contracts) && obj.contracts.length > 0) return true;
    // Check for assets array
    if (obj.assets && Array.isArray(obj.assets) && obj.assets.length > 0) return true;
    // Check for adjustments array
    if (obj.adjustments && Array.isArray(obj.adjustments) && obj.adjustments.length > 0) return true;
    // Check for periodData array
    if (obj.periodData && Array.isArray(obj.periodData) && obj.periodData.length > 0) return true;
    // Check for employees array (payroll)
    if (obj.employees && Array.isArray(obj.employees) && obj.employees.length > 0) return true;
    // Check for accounts array (chart of accounts)
    if (obj.accounts && Array.isArray(obj.accounts) && obj.accounts.length > 0) return true;
    // Check for entries array (journal entries)
    if (obj.entries && Array.isArray(obj.entries) && obj.entries.length > 0) return true;
    // Check for rows array (general ledger, inventory)
    if (obj.rows && Array.isArray(obj.rows) && obj.rows.length > 0) return true;
    // Generic object check - has meaningful keys with values
    const keys = Object.keys(obj).filter(k => !k.startsWith("_"));
    return keys.length > 0 && keys.some(k => obj[k] !== null && obj[k] !== undefined);
  }
  return false;
};

// Section definition interface
export interface CompletionSection {
  key: string;
  label: string;
  category: string;
  wizardDataKey: string;      // Direct key in wizard_data
  nestedKey?: string;         // For supplementary.debtSchedule etc.
}

// All trackable sections - aligned with Document Checklist and Wizard Sidebar
// Total: 25 sections across 9 categories
export const COMPLETION_SECTIONS: CompletionSection[] = [
  // Core Data (matches Phase 2)
  { key: "chartOfAccounts", label: "Chart of Accounts", category: "Core Data", wizardDataKey: "chartOfAccounts" },
  { key: "trialBalance", label: "Trial Balance", category: "Core Data", wizardDataKey: "trialBalance" },
  { key: "generalLedger", label: "General Ledger", category: "Core Data", wizardDataKey: "generalLedger" },
  
  // Adjustments (matches Phase 3 Adjustments subgroup)
  { key: "ddAdjustments", label: "DD Adjustments", category: "Adjustments", wizardDataKey: "ddAdjustments" },
  { key: "reclassifications", label: "Reclassifications", category: "Adjustments", wizardDataKey: "reclassifications" },
  { key: "journalEntries", label: "Journal Entries", category: "Adjustments", wizardDataKey: "journalEntries" },
  
  // Schedules (matches Phase 3 Schedules subgroup)
  { key: "arAging", label: "AR Aging", category: "Schedules", wizardDataKey: "arAging" },
  { key: "apAging", label: "AP Aging", category: "Schedules", wizardDataKey: "apAging" },
  { key: "fixedAssets", label: "Fixed Assets", category: "Schedules", wizardDataKey: "fixedAssets" },
  { key: "inventory", label: "Inventory", category: "Schedules", wizardDataKey: "inventory" },
  { key: "payroll", label: "Payroll", category: "Schedules", wizardDataKey: "payroll" },
  { key: "materialContracts", label: "Material Contracts", category: "Schedules", wizardDataKey: "materialContracts" },
  
  // Supplementary (nested under wizard_data.supplementary)
  { key: "debtSchedule", label: "Debt Schedule", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "debtSchedule" },
  { key: "leaseObligations", label: "Lease Obligations", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "leaseObligations" },
  { key: "contingentLiabilities", label: "Contingent Liabilities", category: "Supplementary", wizardDataKey: "supplementary", nestedKey: "contingentLiabilities" },
  
  // Analysis (matches Phase 4)
  { key: "topCustomers", label: "Top Customers", category: "Analysis", wizardDataKey: "topCustomers" },
  { key: "topVendors", label: "Top Vendors", category: "Analysis", wizardDataKey: "topVendors" },
  
  // Reports (matches Phase 5 Financial Statements)
  { key: "incomeStatement", label: "Income Statement", category: "Reports", wizardDataKey: "incomeStatement" },
  { key: "balanceSheet", label: "Balance Sheet", category: "Reports", wizardDataKey: "balanceSheet" },
  { key: "cashFlow", label: "Cash Flow Statement", category: "Reports", wizardDataKey: "cashFlow" },
  
  // QoE (matches Phase 5 QoE Reports)
  { key: "qoeAnalysis", label: "QoE Analysis", category: "QoE", wizardDataKey: "qoeAnalysis" },
  { key: "qoeSummary", label: "QoE Summary", category: "QoE", wizardDataKey: "qoeSummary" },
  
  // Working Capital (matches Phase 5 Working Capital)
  { key: "nwcAnalysis", label: "NWC Analysis", category: "Working Capital", wizardDataKey: "nwcAnalysis" },
  { key: "freeCashFlow", label: "Free Cash Flow", category: "Working Capital", wizardDataKey: "freeCashFlow" },
  
  // Supporting (matches Phase 5 Supporting)
  { key: "proofOfCash", label: "Proof of Cash", category: "Supporting", wizardDataKey: "proofOfCash" },
];

/**
 * Helper to compute section status from wizard_data
 */
export function getSectionStatus(
  wizardData: Record<string, unknown>,
  section: CompletionSection
): boolean {
  if (section.nestedKey) {
    const parent = wizardData[section.wizardDataKey] as Record<string, unknown> | undefined;
    return checkHasData(parent?.[section.nestedKey]);
  }
  return checkHasData(wizardData[section.wizardDataKey]);
}

/**
 * Get all section statuses for completeness tracking
 */
export function getAllSectionStatuses(wizardData: Record<string, unknown>) {
  return COMPLETION_SECTIONS.map(section => ({
    key: section.key,
    label: section.label,
    category: section.category,
    hasData: getSectionStatus(wizardData, section),
  }));
}

/**
 * Get unique categories from sections
 */
export function getCategories(): string[] {
  return [...new Set(COMPLETION_SECTIONS.map(s => s.category))];
}

// Core sections for Export Center readiness check
export const CORE_EXPORT_SECTIONS = ["incomeStatement", "balanceSheet", "qoeAnalysis", "ddAdjustments"];

/**
 * Helper to check export readiness.
 * Checks computed reports first (from workbook engine), then falls back to wizard_data.
 */
export function getExportReadiness(
  wizardData: Record<string, unknown>,
  computedReports?: Record<string, { rawData?: string[][] }>
) {
  const coreStatus = CORE_EXPORT_SECTIONS.reduce((acc, key) => {
    // Check computed reports first
    if (computedReports?.[key]?.rawData && computedReports[key].rawData!.length > 0) {
      acc[key] = true;
    } else {
      acc[key] = checkHasData(wizardData[key]);
    }
    return acc;
  }, {} as Record<string, boolean>);
  
  const readyCount = Object.values(coreStatus).filter(Boolean).length;
  const totalCore = CORE_EXPORT_SECTIONS.length;
  
  return {
    coreStatus,
    readyCount,
    totalCore,
    isReady: readyCount === totalCore
  };
}
