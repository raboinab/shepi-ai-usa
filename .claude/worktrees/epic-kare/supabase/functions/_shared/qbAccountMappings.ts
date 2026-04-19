/**
 * Centralized QuickBooks Account Type Mappings
 * 
 * This module provides the canonical mapping between QuickBooks account types
 * and the standardized Financial Statement Line Items used in the QoE workbook.
 * 
 * These mappings are used by:
 * - complete-qb-sync: To enrich trial balance data with fsLineItem
 * - sync-sheet: To populate Column E in the Trial Balance tab
 * - Frontend utilities: For consistent account classification
 * 
 * The Java backend provides these fields in camelCase (fsLineItem, fsType, accountSubtype).
 * Edge functions trust Java-provided values and use these mappings as fallback.
 */

// Official QBO Account Types (14 types + REVENUE alias)
export const QB_ACCOUNT_TYPES = {
  BANK: "Bank",
  ACCOUNTS_RECEIVABLE: "Accounts Receivable",
  OTHER_CURRENT_ASSET: "Other Current Asset",
  FIXED_ASSET: "Fixed Asset",
  OTHER_ASSET: "Other Asset",
  ACCOUNTS_PAYABLE: "Accounts Payable",
  CREDIT_CARD: "Credit Card",
  OTHER_CURRENT_LIABILITY: "Other Current Liability",
  LONG_TERM_LIABILITY: "Long Term Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  REVENUE: "Revenue",
  COST_OF_GOODS_SOLD: "Cost of Goods Sold",
  EXPENSE: "Expense",
  OTHER_INCOME: "Other Income",
  OTHER_EXPENSE: "Other Expense",
} as const;

// Workbook FS Line Items (exact strings for Column E - character-perfect for SUMIFS)
export const FS_LINE_ITEMS = {
  CASH: "Cash and cash equivalents",
  AR: "Accounts receivable",
  OTHER_CURRENT_ASSETS: "Other current assets",
  FIXED_ASSETS: "Fixed assets",
  OTHER_ASSETS: "Other assets",
  CURRENT_LIABILITIES: "Current liabilities",
  OTHER_CURRENT_LIABILITIES: "Other current liabilities",
  LONG_TERM_LIABILITIES: "Long term liabilities",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  COGS: "Cost of Goods Sold",
  OPERATING_EXPENSES: "Operating expenses",
  OTHER_INCOME_EXPENSE: "Other expense (income)",
} as const;

// Primary mapping: AccountType -> FS Line Item
const TYPE_TO_LINE_ITEM: Record<string, string> = {
  // Balance Sheet - Assets
  "BANK": FS_LINE_ITEMS.CASH,
  "ACCOUNTS_RECEIVABLE": FS_LINE_ITEMS.AR,
  "OTHER_CURRENT_ASSET": FS_LINE_ITEMS.OTHER_CURRENT_ASSETS,
  "FIXED_ASSET": FS_LINE_ITEMS.FIXED_ASSETS,
  "OTHER_ASSET": FS_LINE_ITEMS.OTHER_ASSETS,
  // Balance Sheet - Liabilities
  "ACCOUNTS_PAYABLE": FS_LINE_ITEMS.CURRENT_LIABILITIES,
  "CREDIT_CARD": FS_LINE_ITEMS.CURRENT_LIABILITIES,
  "OTHER_CURRENT_LIABILITY": FS_LINE_ITEMS.OTHER_CURRENT_LIABILITIES,
  "LONG_TERM_LIABILITY": FS_LINE_ITEMS.LONG_TERM_LIABILITIES,
  // Balance Sheet - Equity
  "EQUITY": FS_LINE_ITEMS.EQUITY,
  // Income Statement - Revenue
  "INCOME": FS_LINE_ITEMS.REVENUE,
  "REVENUE": FS_LINE_ITEMS.REVENUE,
  // Income Statement - COGS
  "COST_OF_GOODS_SOLD": FS_LINE_ITEMS.COGS,
  // Income Statement - Expenses
  "EXPENSE": FS_LINE_ITEMS.OPERATING_EXPENSES,
  // Income Statement - Other
  "OTHER_INCOME": FS_LINE_ITEMS.OTHER_INCOME_EXPENSE,
  "OTHER_EXPENSE": FS_LINE_ITEMS.OTHER_INCOME_EXPENSE,
};

// Balance Sheet account type patterns for fsType detection
const BS_PATTERNS = [
  "bank", "accounts receivable", "other current asset",
  "fixed asset", "other asset", "accounts payable", "credit card",
  "other current liability", "long term liability", "equity",
  "current liability"
];

/**
 * Map raw QuickBooks account type to standardized FS Line Item for workbook Column E.
 * 
 * Handles multiple input formats:
 * - "BANK", "Bank", "bank"
 * - "ACCOUNTS_RECEIVABLE", "Accounts Receivable", "accounts-receivable"
 * 
 * @param accountType - Raw QB account type string
 * @returns Standardized FS Line Item or empty string if unknown
 */
export function mapAccountTypeToFSLineItem(accountType: string): string {
  const normalized = (accountType || "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[()]/g, "");
  return TYPE_TO_LINE_ITEM[normalized] || "";
}

/**
 * Determine if an account type is Balance Sheet (BS) or Income Statement (IS).
 * 
 * @param accountType - Raw QB account type string
 * @returns "BS" for Balance Sheet, "IS" for Income Statement
 */
export function mapAccountTypeToFsType(accountType: string): "BS" | "IS" {
  const normalized = (accountType || "").toLowerCase().replace(/_/g, " ");
  return BS_PATTERNS.some(p => normalized.includes(p)) ? "BS" : "IS";
}

/**
 * Map account type to financial category for grouping.
 * 
 * Categories:
 * - Balance Sheet: Current Assets, Fixed Assets, Other Assets, Current Liabilities, Long-Term Liabilities, Equity
 * - Income Statement: Revenue, COGS, Operating Expenses, Other Income
 * 
 * @param accountType - Raw QB account type string
 * @returns Category string
 */
export function mapAccountTypeToCategory(accountType: string): string {
  const normalized = (accountType || "").toLowerCase().replace(/_/g, " ");
  
  // Balance Sheet categories
  if (normalized.includes("bank") || normalized.includes("accounts receivable") || 
      normalized.includes("other current asset")) return "Current Assets";
  if (normalized.includes("fixed asset")) return "Fixed Assets";
  if (normalized.includes("other asset")) return "Other Assets";
  if (normalized.includes("accounts payable") || normalized.includes("credit card") || 
      normalized.includes("other current liability")) return "Current Liabilities";
  if (normalized.includes("long term liability")) return "Long-Term Liabilities";
  if (normalized.includes("equity")) return "Equity";
  
  // Income Statement categories
  if (normalized.includes("income") || normalized.includes("revenue")) return "Revenue";
  if (normalized.includes("cost of goods") || normalized.includes("cogs")) return "Cost of Goods Sold";
  if (normalized.includes("expense")) return "Operating Expenses";
  if (normalized.includes("other income") || normalized.includes("other expense")) return "Other Income";
  
  // Default based on fsType
  return mapAccountTypeToFsType(accountType) === "BS" ? "Other Assets" : "Operating Expenses";
}

// ============= SUBTYPE-LEVEL MAPPING (154 rows) =============

/**
 * Interface for subtype-to-fields mapping.
 * Generated from Java backend for character-perfect consistency.
 */
export interface SubtypeMappingInfo {
  fsLineItem: string;
  subAccount1: string;
  subAccount2?: string;
  subAccount3?: string;
}

/**
 * Complete 154-row mapping table: (AccountType, AccountSubtype) → SubtypeMappingInfo
 * 
 * Generated from Java FinancialStatementMapper.java
 * This is a character-perfect mirror of the Java mappings.
 * Any changes should be made in the Java source and regenerated.
 */
const SUBTYPE_TO_FIELDS: Record<string, Record<string, SubtypeMappingInfo>> = {
  // ========== BALANCE SHEET - ASSETS ==========
  
  // BANK subtypes (6 mappings + default)
  "BANK": {
    "Checking": { fsLineItem: "Cash and cash equivalents", subAccount1: "Checking" },
    "Savings": { fsLineItem: "Cash and cash equivalents", subAccount1: "Savings" },
    "Money Market": { fsLineItem: "Cash and cash equivalents", subAccount1: "Money Market" },
    "Cash on hand": { fsLineItem: "Cash and cash equivalents", subAccount1: "Cash on hand" },
    "Trust account": { fsLineItem: "Cash and cash equivalents", subAccount1: "Trust account" },
    "Rents Held in Trust": { fsLineItem: "Cash and cash equivalents", subAccount1: "Trust account" },
    "_DEFAULT": { fsLineItem: "Cash and cash equivalents", subAccount1: "Other Cash" },
  },
  
  // ACCOUNTS_RECEIVABLE subtypes (1 mapping + default)
  "ACCOUNTS_RECEIVABLE": {
    "Accounts receivable (A/R)": { fsLineItem: "Accounts receivable", subAccount1: "Trade Receivables" },
    "_DEFAULT": { fsLineItem: "Accounts receivable", subAccount1: "Trade Receivables" },
  },
  
  // OTHER_CURRENT_ASSET subtypes (15 mappings + default)
  "OTHER_CURRENT_ASSET": {
    "Allowance for Bad Debts": { fsLineItem: "Accounts receivable", subAccount1: "Allowance" },
    "Employee Cash Advances": { fsLineItem: "Other current assets", subAccount1: "Advances" },
    "Prepaid Expenses": { fsLineItem: "Other current assets", subAccount1: "Prepaid" },
    "Retainage": { fsLineItem: "Other current assets", subAccount1: "Retainage" },
    "Undeposited Funds": { fsLineItem: "Cash and cash equivalents", subAccount1: "Undeposited" },
    "Inventory": { fsLineItem: "Other current assets", subAccount1: "Inventory" },
    "Loans To Officers": { fsLineItem: "Other current assets", subAccount1: "Related Party" },
    "Loans to Stockholders": { fsLineItem: "Other current assets", subAccount1: "Related Party" },
    "Loans to Others": { fsLineItem: "Other current assets", subAccount1: "Notes Receivable" },
    "Development Costs": { fsLineItem: "Other current assets", subAccount1: "Development" },
    "Other Current Assets": { fsLineItem: "Other current assets", subAccount1: "Other" },
    "Investment - U.S. Government Obligations": { fsLineItem: "Other current assets", subAccount1: "Investments" },
    "Investment - Tax-Exempt Securities": { fsLineItem: "Other current assets", subAccount1: "Investments" },
    "Investment - Mortgage/Real Estate Loans": { fsLineItem: "Other current assets", subAccount1: "Investments" },
    "Investments - Other": { fsLineItem: "Other current assets", subAccount1: "Investments" },
    "_DEFAULT": { fsLineItem: "Other current assets", subAccount1: "Other" },
  },
  
  // FIXED_ASSET subtypes (19 mappings + default)
  "FIXED_ASSET": {
    "Buildings": { fsLineItem: "Fixed assets", subAccount1: "Buildings" },
    "Furniture & Fixtures": { fsLineItem: "Fixed assets", subAccount1: "Furniture & Fixtures" },
    "Leasehold Improvements": { fsLineItem: "Fixed assets", subAccount1: "Leasehold Improvements" },
    "Machinery & Equipment": { fsLineItem: "Fixed assets", subAccount1: "Machinery & Equipment" },
    "Vehicles": { fsLineItem: "Fixed assets", subAccount1: "Vehicles" },
    "Land": { fsLineItem: "Fixed assets", subAccount1: "Land" },
    "Accumulated Depreciation": { fsLineItem: "Fixed assets", subAccount1: "Accumulated Depreciation" },
    "Depletable Assets": { fsLineItem: "Fixed assets", subAccount1: "Depletable Assets" },
    "Accumulated Depletion": { fsLineItem: "Fixed assets", subAccount1: "Accumulated Depletion" },
    "Intangible Assets": { fsLineItem: "Fixed assets", subAccount1: "Intangible Assets" },
    "Accumulated Amortization": { fsLineItem: "Fixed assets", subAccount1: "Accumulated Amortization" },
    "Other fixed assets": { fsLineItem: "Fixed assets", subAccount1: "Other" },
    "Fixed Asset Computers": { fsLineItem: "Fixed assets", subAccount1: "Technology" },
    "Fixed Asset Copiers": { fsLineItem: "Fixed assets", subAccount1: "Technology" },
    "Fixed Asset Furniture": { fsLineItem: "Fixed assets", subAccount1: "Furniture & Fixtures" },
    "Fixed Asset Phone": { fsLineItem: "Fixed assets", subAccount1: "Technology" },
    "Fixed Asset Photo Video": { fsLineItem: "Fixed assets", subAccount1: "Technology" },
    "Fixed Asset Software": { fsLineItem: "Fixed assets", subAccount1: "Technology" },
    "Fixed Asset Other Tools Equipment": { fsLineItem: "Fixed assets", subAccount1: "Machinery & Equipment" },
    "_DEFAULT": { fsLineItem: "Fixed assets", subAccount1: "Other" },
  },
  
  // OTHER_ASSET subtypes (7 mappings + default)
  "OTHER_ASSET": {
    "Goodwill": { fsLineItem: "Other assets", subAccount1: "Intangibles" },
    "Licenses": { fsLineItem: "Other assets", subAccount1: "Intangibles" },
    "Security Deposits": { fsLineItem: "Other assets", subAccount1: "Deposits" },
    "Organizational Costs": { fsLineItem: "Other assets", subAccount1: "Organizational" },
    "Lease Buyout": { fsLineItem: "Other assets", subAccount1: "Lease" },
    "Other Long-term Assets": { fsLineItem: "Other assets", subAccount1: "Other" },
    "Accumulated Amortization of Other Assets": { fsLineItem: "Other assets", subAccount1: "Accumulated Amortization" },
    "_DEFAULT": { fsLineItem: "Other assets", subAccount1: "Other" },
  },
  
  // ========== BALANCE SHEET - LIABILITIES ==========
  
  // ACCOUNTS_PAYABLE subtypes (1 mapping + default)
  "ACCOUNTS_PAYABLE": {
    "Accounts payable (A/P)": { fsLineItem: "Current liabilities", subAccount1: "Trade Payables" },
    "_DEFAULT": { fsLineItem: "Current liabilities", subAccount1: "Trade Payables" },
  },
  
  // CREDIT_CARD subtypes (1 mapping + default)
  "CREDIT_CARD": {
    "Credit Card": { fsLineItem: "Current liabilities", subAccount1: "Credit Card" },
    "_DEFAULT": { fsLineItem: "Current liabilities", subAccount1: "Credit Card" },
  },
  
  // OTHER_CURRENT_LIABILITY subtypes (14 mappings + default)
  "OTHER_CURRENT_LIABILITY": {
    "Insurance Payable": { fsLineItem: "Other current liabilities", subAccount1: "Accrued Expenses" },
    "Payroll Clearing": { fsLineItem: "Other current liabilities", subAccount1: "Payroll" },
    "Payroll Tax Payable": { fsLineItem: "Other current liabilities", subAccount1: "Payroll" },
    "Sales Tax Payable": { fsLineItem: "Other current liabilities", subAccount1: "Sales Tax" },
    "Federal Income Tax Payable": { fsLineItem: "Other current liabilities", subAccount1: "Income Tax" },
    "State/Local Income Tax Payable": { fsLineItem: "Other current liabilities", subAccount1: "Income Tax" },
    "Deferred Revenue": { fsLineItem: "Other current liabilities", subAccount1: "Deferred Revenue" },
    "Line of Credit": { fsLineItem: "Current liabilities", subAccount1: "Debt" },
    "Loan Payable": { fsLineItem: "Current liabilities", subAccount1: "Debt" },
    "Prepaid Expenses Payable": { fsLineItem: "Other current liabilities", subAccount1: "Prepaid" },
    "Trust Accounts - Liabilities": { fsLineItem: "Other current liabilities", subAccount1: "Trust" },
    "Rents in trust - Liability": { fsLineItem: "Other current liabilities", subAccount1: "Trust" },
    "Undistributed Tips": { fsLineItem: "Other current liabilities", subAccount1: "Other" },
    "Other Current Liabilities": { fsLineItem: "Other current liabilities", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Other current liabilities", subAccount1: "Other" },
  },
  
  // LONG_TERM_LIABILITY subtypes (3 mappings + default)
  "LONG_TERM_LIABILITY": {
    "Notes Payable": { fsLineItem: "Long term liabilities", subAccount1: "Notes Payable" },
    "Shareholder Notes Payable": { fsLineItem: "Long term liabilities", subAccount1: "Related Party" },
    "Other Long Term Liabilities": { fsLineItem: "Long term liabilities", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Long term liabilities", subAccount1: "Other" },
  },
  
  // ========== BALANCE SHEET - EQUITY ==========
  
  // EQUITY subtypes (16 mappings + default)
  "EQUITY": {
    "Common Stock": { fsLineItem: "Equity", subAccount1: "Paid-in Capital" },
    "Preferred Stock": { fsLineItem: "Equity", subAccount1: "Paid-in Capital" },
    "Paid-In Capital or Surplus": { fsLineItem: "Equity", subAccount1: "Paid-in Capital" },
    "Treasury Stock": { fsLineItem: "Equity", subAccount1: "Treasury Stock" },
    "Retained Earnings": { fsLineItem: "Equity", subAccount1: "Retained Earnings" },
    "Owner's Equity": { fsLineItem: "Equity", subAccount1: "Owner's Equity" },
    "Partner's Equity": { fsLineItem: "Equity", subAccount1: "Partner's Equity" },
    "Partner Contributions": { fsLineItem: "Equity", subAccount1: "Contributions" },
    "Partner Distributions": { fsLineItem: "Equity", subAccount1: "Distributions" },
    "Opening Balance Equity": { fsLineItem: "Equity", subAccount1: "Opening Balance" },
    "Accumulated Adjustment": { fsLineItem: "Equity", subAccount1: "Adjustments" },
    "Estimated Taxes": { fsLineItem: "Equity", subAccount1: "Tax" },
    "Health Insurance Premium": { fsLineItem: "Equity", subAccount1: "Benefits" },
    "Health Savings Account Contribution": { fsLineItem: "Equity", subAccount1: "Benefits" },
    "Personal Income": { fsLineItem: "Equity", subAccount1: "Personal" },
    "Personal Expense": { fsLineItem: "Equity", subAccount1: "Personal" },
    "_DEFAULT": { fsLineItem: "Equity", subAccount1: "Other" },
  },
  
  // ========== INCOME STATEMENT - REVENUE ==========
  
  // INCOME subtypes (6 mappings + default)
  "INCOME": {
    "Service/Fee Income": { fsLineItem: "Revenue", subAccount1: "Service Revenue" },
    "Sales of Product Income": { fsLineItem: "Revenue", subAccount1: "Product Revenue" },
    "Non-Profit Income": { fsLineItem: "Revenue", subAccount1: "Contributions" },
    "Other Primary Income": { fsLineItem: "Revenue", subAccount1: "Other Revenue" },
    "Discounts/Refunds Given": { fsLineItem: "Revenue", subAccount1: "Discounts" },
    "Unapplied Cash Payment Income": { fsLineItem: "Revenue", subAccount1: "Unapplied" },
    "_DEFAULT": { fsLineItem: "Revenue", subAccount1: "Other Revenue" },
  },
  
  // REVENUE subtypes (4 mappings + default - QB uses both INCOME and REVENUE)
  "REVENUE": {
    "Service/Fee Income": { fsLineItem: "Revenue", subAccount1: "Service Revenue" },
    "Sales of Product Income": { fsLineItem: "Revenue", subAccount1: "Product Revenue" },
    "Non-Profit Income": { fsLineItem: "Revenue", subAccount1: "Contributions" },
    "Other Primary Income": { fsLineItem: "Revenue", subAccount1: "Other Revenue" },
    "_DEFAULT": { fsLineItem: "Revenue", subAccount1: "Other Revenue" },
  },
  
  // ========== INCOME STATEMENT - COGS ==========
  
  // COST_OF_GOODS_SOLD subtypes (5 mappings + default)
  "COST_OF_GOODS_SOLD": {
    "Cost of labor - COS": { fsLineItem: "Cost of Goods Sold", subAccount1: "Direct Labor" },
    "Supplies & Materials - COGS": { fsLineItem: "Cost of Goods Sold", subAccount1: "Materials" },
    "Shipping, Freight & Delivery - COS": { fsLineItem: "Cost of Goods Sold", subAccount1: "Freight" },
    "Equipment Rental - COS": { fsLineItem: "Cost of Goods Sold", subAccount1: "Equipment" },
    "Other Costs of Services - COS": { fsLineItem: "Cost of Goods Sold", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Cost of Goods Sold", subAccount1: "Other" },
  },
  
  // ========== INCOME STATEMENT - EXPENSES (46 mappings) ==========
  
  "EXPENSE": {
    // Payroll Group (3 mappings)
    "Payroll Expenses": { fsLineItem: "Operating expenses", subAccount1: "Payroll & Related" },
    "Payroll Tax Expenses": { fsLineItem: "Operating expenses", subAccount1: "Payroll & Related" },
    "Payroll Wage Expenses": { fsLineItem: "Operating expenses", subAccount1: "Payroll & Related" },
    
    // Vehicle Group (11 mappings)
    "Auto": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Other Vehicle Expenses": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Insurance": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Loan Interest": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Loan": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Repairs": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Gas And Fuel": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Parking and Tolls": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Registration": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Vehicle Lease": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    "Wash and Road Services": { fsLineItem: "Operating expenses", subAccount1: "Vehicle" },
    
    // Occupancy Group (3 mappings)
    "Rent or Lease of Buildings": { fsLineItem: "Operating expenses", subAccount1: "Occupancy" },
    "Repair & Maintenance": { fsLineItem: "Operating expenses", subAccount1: "Occupancy" },
    "Utilities": { fsLineItem: "Operating expenses", subAccount1: "Occupancy" },
    
    // Home Office Group (7 mappings)
    "Homeowner Rental Insurance": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Other Home Office Expenses": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Mortgage Interest Home Office": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Rent and Lease Home Office": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Repairs and Maintenance Home Office": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Utilities Home Office": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    "Property Tax Home Office": { fsLineItem: "Operating expenses", subAccount1: "Home Office" },
    
    // Professional Group (1 mapping)
    "Legal & Professional Fees": { fsLineItem: "Operating expenses", subAccount1: "Professional Fees" },
    
    // G&A Group (8 mappings)
    "Office/General Administrative Expenses": { fsLineItem: "Operating expenses", subAccount1: "G&A" },
    "Dues & subscriptions": { fsLineItem: "Operating expenses", subAccount1: "G&A" },
    "Insurance": { fsLineItem: "Operating expenses", subAccount1: "Insurance" },
    "Bank Charges": { fsLineItem: "Operating expenses", subAccount1: "Bank Charges" },
    "Bad Debts": { fsLineItem: "Operating expenses", subAccount1: "Bad Debt" },
    "Taxes Paid": { fsLineItem: "Operating expenses", subAccount1: "Taxes" },
    "Charitable Contributions": { fsLineItem: "Operating expenses", subAccount1: "Contributions" },
    "Communication": { fsLineItem: "Operating expenses", subAccount1: "Communication" },
    
    // Marketing Group (1 mapping)
    "Advertising/Promotional": { fsLineItem: "Operating expenses", subAccount1: "Marketing" },
    
    // Travel & Entertainment Group (5 mappings)
    "Travel": { fsLineItem: "Operating expenses", subAccount1: "Travel" },
    "Travel Meals": { fsLineItem: "Operating expenses", subAccount1: "Travel" },
    "Entertainment": { fsLineItem: "Operating expenses", subAccount1: "Entertainment" },
    "Entertainment Meals": { fsLineItem: "Operating expenses", subAccount1: "Entertainment" },
    "Promotional Meals": { fsLineItem: "Operating expenses", subAccount1: "Marketing" },
    
    // Other Expenses (7 mappings)
    "Interest Paid": { fsLineItem: "Operating expenses", subAccount1: "Interest" },
    "Cost of Labor": { fsLineItem: "Operating expenses", subAccount1: "Labor" },
    "Supplies & Materials": { fsLineItem: "Operating expenses", subAccount1: "Supplies" },
    "Shipping, Freight & Delivery": { fsLineItem: "Operating expenses", subAccount1: "Freight" },
    "Equipment Rental": { fsLineItem: "Operating expenses", subAccount1: "Equipment" },
    "Other Miscellaneous Service Cost": { fsLineItem: "Operating expenses", subAccount1: "Other" },
    "Unapplied Cash Bill Payment Expense": { fsLineItem: "Operating expenses", subAccount1: "Unapplied" },
    "Finance costs": { fsLineItem: "Operating expenses", subAccount1: "Finance" },
    "Other Business Expenses": { fsLineItem: "Operating expenses", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Operating expenses", subAccount1: "Other" },
  },
  
  // ========== INCOME STATEMENT - OTHER ==========
  
  // OTHER_INCOME subtypes (5 mappings + default)
  "OTHER_INCOME": {
    "Interest Earned": { fsLineItem: "Other expense (income)", subAccount1: "Interest Income" },
    "Tax-Exempt Interest": { fsLineItem: "Other expense (income)", subAccount1: "Interest Income" },
    "Dividend Income": { fsLineItem: "Other expense (income)", subAccount1: "Dividend Income" },
    "Other Investment Income": { fsLineItem: "Other expense (income)", subAccount1: "Investment Income" },
    "Other Miscellaneous Income": { fsLineItem: "Other expense (income)", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Other expense (income)", subAccount1: "Other" },
  },
  
  // OTHER_EXPENSE subtypes (5 mappings + default)
  "OTHER_EXPENSE": {
    "Depreciation": { fsLineItem: "Other expense (income)", subAccount1: "Depreciation" },
    "Amortization": { fsLineItem: "Other expense (income)", subAccount1: "Amortization" },
    "Penalties & Settlements": { fsLineItem: "Other expense (income)", subAccount1: "Penalties" },
    "Exchange Gain or Loss": { fsLineItem: "Other expense (income)", subAccount1: "FX Gain/Loss" },
    "Other Miscellaneous Expense": { fsLineItem: "Other expense (income)", subAccount1: "Other" },
    "_DEFAULT": { fsLineItem: "Other expense (income)", subAccount1: "Other" },
  },
};

/**
 * Type-level fallback mapping (16 rows)
 * This matches the existing mapAccountTypeToFSLineItem function
 */
function getTypeLevelFsLineItem(normalizedType: string): string {
  const TYPE_TO_FS_LINE_ITEM: Record<string, string> = {
    "BANK": "Cash and cash equivalents",
    "ACCOUNTS_RECEIVABLE": "Accounts receivable",
    "OTHER_CURRENT_ASSET": "Other current assets",
    "FIXED_ASSET": "Fixed assets",
    "OTHER_ASSET": "Other assets",
    "ACCOUNTS_PAYABLE": "Current liabilities",
    "CREDIT_CARD": "Current liabilities",
    "OTHER_CURRENT_LIABILITY": "Other current liabilities",
    "LONG_TERM_LIABILITY": "Long term liabilities",
    "EQUITY": "Equity",
    "INCOME": "Revenue",
    "REVENUE": "Revenue",
    "OTHER_INCOME": "Other expense (income)",
    "COST_OF_GOODS_SOLD": "Cost of Goods Sold",
    "EXPENSE": "Operating expenses",
    "OTHER_EXPENSE": "Other expense (income)",
  };
  
  return TYPE_TO_FS_LINE_ITEM[normalizedType] || "Other current assets";
}

/**
 * Get the total number of subtype mappings configured.
 * 
 * @returns The count of all subtype mappings across all account types
 */
export function getSubtypeMappingCount(): number {
  let count = 0;
  for (const subtypeMap of Object.values(SUBTYPE_TO_FIELDS)) {
    count += Object.keys(subtypeMap).length;
  }
  return count;
}

/**
 * Map account type + subtype to enriched fields for workbook columns E-H.
 * 
 * This is the subtype-aware mapping method that provides maximum granularity.
 * Falls back gracefully:
 * 1. Try (AccountType, AccountSubtype) lookup in 154-row table
 * 2. If not found, fall back to AccountType-only mapping (16-row table)
 * 3. If still not found, use safe default
 * 
 * @param accountType - The QuickBooks account type (e.g., "EXPENSE", "Bank")
 * @param accountSubtype - The QuickBooks account subtype (e.g., "Payroll Expenses", "Checking")
 * @returns Enriched fields for workbook columns E-H
 */
export function mapAccountToFields(
  accountType: string,
  accountSubtype: string
): { fsLineItem: string; subAccount1: string; subAccount2: string; subAccount3: string } {
  
  // Null/empty check with warning
  if (!accountType || accountType.trim() === '') {
    console.warn('Account type is null or empty - using safe default');
    return { fsLineItem: "Other current assets", subAccount1: "", subAccount2: "", subAccount3: "" };
  }
  
  const normalizedType = accountType.trim().toUpperCase().replace(/\s+/g, '_');
  const subtypeMap = SUBTYPE_TO_FIELDS[normalizedType];
  
  if (!subtypeMap) {
    // Unknown account type - use type-level fallback
    const typeLevelFsLineItem = getTypeLevelFsLineItem(normalizedType);
    return {
      fsLineItem: typeLevelFsLineItem,
      subAccount1: accountSubtype || "",
      subAccount2: "",
      subAccount3: "",
    };
  }
  
  // Try subtype lookup if we have a subtype
  if (accountSubtype && accountSubtype.trim() !== '') {
    // Try exact match first
    const subtypeInfo = subtypeMap[accountSubtype];
    if (subtypeInfo && subtypeInfo.fsLineItem) {
      return {
        fsLineItem: subtypeInfo.fsLineItem,
        subAccount1: subtypeInfo.subAccount1,
        subAccount2: subtypeInfo.subAccount2 || "",
        subAccount3: subtypeInfo.subAccount3 || "",
      };
    }
    
    // Try case-insensitive match
    const normalizedSubtype = accountSubtype.toLowerCase().trim();
    for (const [key, mapping] of Object.entries(subtypeMap)) {
      if (key !== "_DEFAULT" && key.toLowerCase().trim() === normalizedSubtype) {
        return {
          fsLineItem: mapping.fsLineItem,
          subAccount1: mapping.subAccount1,
          subAccount2: mapping.subAccount2 || "",
          subAccount3: mapping.subAccount3 || "",
        };
      }
    }
  }
  
  // Use _DEFAULT entry for this account type (every type has one now)
  const defaultMapping = subtypeMap["_DEFAULT"];
  if (defaultMapping) {
    return {
      fsLineItem: defaultMapping.fsLineItem,
      subAccount1: accountSubtype || defaultMapping.subAccount1,
      subAccount2: defaultMapping.subAccount2 || "",
      subAccount3: defaultMapping.subAccount3 || "",
    };
  }
  
  // Final fallback (should never reach here since all types have _DEFAULT)
  const typeLevelFsLineItem = getTypeLevelFsLineItem(normalizedType);
  return {
    fsLineItem: typeLevelFsLineItem,
    subAccount1: accountSubtype || "",
    subAccount2: "",
    subAccount3: "",
  };
}

// ============= NAME-BASED INFERENCE (for document uploads without account type metadata) =============

/**
 * Infer fsType from account name (for document uploads without account type metadata).
 * Falls back to keyword matching on the account name itself.
 * 
 * @param accountName - The account name string
 * @returns "BS" for Balance Sheet, "IS" for Income Statement
 */
export function inferFsTypeFromName(accountName: string): "BS" | "IS" {
  const name = (accountName || "").toLowerCase();
  const bsPatterns = /cash|bank|checking|savings|receivable|a\/r|inventory|prepaid|deposit|fixed|equipment|furniture|vehicle|property|building|accumulated|depreciation|payable|a\/p|credit card|loan|note|debt|mortgage|equity|capital|retained|owner|drawing/;
  return bsPatterns.test(name) ? "BS" : "IS";
}

/**
 * Infer category from account name (for document uploads without account type metadata).
 * 
 * @param accountName - The account name string
 * @param fsType - The financial statement type ("BS" or "IS")
 * @returns Category string for grouping
 */
export function inferCategoryFromName(accountName: string, fsType: "BS" | "IS"): string {
  const name = (accountName || "").toLowerCase();
  
  if (fsType === "BS") {
    if (/cash|bank|checking|savings/.test(name)) return "Cash and Equivalents";
    if (/receivable|a\/r/.test(name)) return "Accounts Receivable";
    if (/inventory/.test(name)) return "Inventory";
    if (/prepaid|deposit/.test(name)) return "Prepaid Expenses";
    if (/fixed|equipment|furniture|vehicle|property|building/.test(name)) return "Fixed Assets";
    if (/accumulated|depreciation/.test(name)) return "Accumulated Depreciation";
    if (/payable|a\/p/.test(name)) return "Accounts Payable";
    if (/credit card/.test(name)) return "Credit Cards";
    if (/loan|note|debt|mortgage/.test(name)) return "Long-term Debt";
    if (/equity|capital|retained|owner|drawing/.test(name)) return "Equity";
    return "Other Assets";
  } else {
    if (/revenue|sales|income|service/.test(name)) return "Revenue";
    if (/cost of|cogs|cost of goods/.test(name)) return "Cost of Goods Sold";
    if (/payroll|salary|wage|benefit|compensation/.test(name)) return "Payroll Expenses";
    if (/rent|lease/.test(name)) return "Rent & Occupancy";
    if (/depreciation|amortization/.test(name)) return "Depreciation";
    if (/interest/.test(name)) return "Interest Expense";
    if (/tax/.test(name)) return "Taxes";
    return "Operating Expenses";
  }
}
