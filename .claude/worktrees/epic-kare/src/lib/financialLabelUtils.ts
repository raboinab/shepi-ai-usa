import { CoaAccount } from "./chartOfAccountsUtils";

export interface FinancialLabelOptions {
  salesLabel: string[];      // Unique categories like "Revenue", "Other Income"
  cogsLabel: string[];       // Unique categories like "Cost of Goods Sold"
  expenseLabels: string[];   // Unique categories like "Operating Expenses"
  interestLabel: string[];   // Unique categories containing "interest"
  depreciationLabel: string[]; // Unique categories containing "depreciation" or "amortization"
  taxesLabel: string[];      // Unique categories containing "tax"
  allIncomeStatementCategories: string[]; // All unique IS categories - fallback for empty matches
}

/**
 * Extract financial label options from Chart of Accounts data.
 * These are used to populate dropdown options for financial category labels
 * based on unique category values from the target company's Chart of Accounts.
 */
export function extractFinancialLabelsFromCOA(
  accounts: CoaAccount[]
): FinancialLabelOptions {
  // Filter IS accounts only (financial labels are income statement items)
  const isAccounts = accounts.filter(a => a.fsType === "IS");
  
  // Get all unique categories from IS accounts
  const allISCategories = [...new Set(isAccounts.map(a => a.category))];
  
  return {
    salesLabel: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("revenue") || 
          a.category.toLowerCase() === "income"
        )
        .map(a => a.category)
    )],
    cogsLabel: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("cogs") ||
          a.category.toLowerCase().includes("cost of goods")
        )
        .map(a => a.category)
    )],
    expenseLabels: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("expense")
        )
        .map(a => a.category)
    )],
    interestLabel: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("interest")
        )
        .map(a => a.category)
    )],
    depreciationLabel: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("deprec") || 
          a.category.toLowerCase().includes("amort")
        )
        .map(a => a.category)
    )],
    taxesLabel: [...new Set(
      isAccounts
        .filter(a => 
          a.category.toLowerCase().includes("tax")
        )
        .map(a => a.category)
    )],
    allIncomeStatementCategories: allISCategories,
  };
}

/**
 * Check if wizard_data contains Chart of Accounts data with accounts.
 */
export function hasCoaData(wizardData: Record<string, unknown> | null | undefined): boolean {
  if (!wizardData) return false;
  const coa = wizardData?.chartOfAccounts as { accounts?: CoaAccount[] } | undefined;
  return Array.isArray(coa?.accounts) && coa.accounts.length > 0;
}

/**
 * Get COA accounts from wizard_data.
 */
export function getCoaAccounts(wizardData: Record<string, unknown> | null | undefined): CoaAccount[] {
  if (!wizardData) return [];
  const coa = wizardData?.chartOfAccounts as { accounts?: CoaAccount[] } | undefined;
  return coa?.accounts || [];
}

/**
 * Get COA sync metadata from wizard_data.
 */
export function getCoaSyncInfo(wizardData: Record<string, unknown> | null | undefined): {
  syncSource?: string;
  lastSyncDate?: string;
} {
  if (!wizardData) return {};
  const coa = wizardData?.chartOfAccounts as { syncSource?: string; lastSyncDate?: string } | undefined;
  return {
    syncSource: coa?.syncSource,
    lastSyncDate: coa?.lastSyncDate,
  };
}

/**
 * Auto-populate financial labels based on COA data.
 * Selects the first matching account for each category.
 * Returns the labels that were auto-populated.
 */
export function autoPopulateFinancialLabels(
  labelOptions: FinancialLabelOptions,
  existingLabels: Record<string, string> = {}
): { labels: Record<string, string>; autoPopulatedKeys: string[] } {
  const labels = { ...existingLabels };
  const autoPopulatedKeys: string[] = [];

  const tryAutoPopulate = (key: string, options: string[]) => {
    // Only auto-populate if not already set and there are options
    if (!labels[key] && options.length > 0) {
      labels[key] = options[0]; // Select first matching account
      autoPopulatedKeys.push(key);
    }
  };

  tryAutoPopulate("salesLabel", labelOptions.salesLabel);
  tryAutoPopulate("cogsLabel", labelOptions.cogsLabel);
  tryAutoPopulate("operatingExpensesLabel", labelOptions.expenseLabels);
  tryAutoPopulate("interestLabel", labelOptions.interestLabel);
  tryAutoPopulate("depreciationLabel", labelOptions.depreciationLabel);
  tryAutoPopulate("taxesLabel", labelOptions.taxesLabel);

  return { labels, autoPopulatedKeys };
}

