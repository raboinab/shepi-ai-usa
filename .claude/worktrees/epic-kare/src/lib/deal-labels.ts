/**
 * Dynamic label resolution for account matching.
 * Maps FS line items to their aliases for flexible matching.
 */

export const SALES_ALIASES = new Set([
  "revenue", "sales", "income", "service revenue", "service income",
  "product revenue", "product sales", "net revenue", "net sales",
  "gross revenue", "total revenue", "total sales",
]);

export const COGS_ALIASES = new Set([
  "cost of goods sold", "cogs", "cost of sales", "cos",
  "cost of revenue", "direct costs", "cost of services",
  "materials", "direct labor", "manufacturing costs",
]);

export const OPEX_ALIASES = new Set([
  "operating expenses", "opex", "operating expense",
  "general and administrative", "g&a", "selling expenses",
  "sg&a", "selling, general & administrative",
  "administrative expenses", "admin expenses",
]);

export const OTHER_EXPENSE_ALIASES = new Set([
  "other expense (income)", "other income", "other expense",
  "other income/expense", "non-operating income",
  "interest income", "interest expense", "gain on sale",
  "loss on sale", "miscellaneous income", "miscellaneous expense",
]);

export const PAYROLL_ALIASES = new Set([
  "payroll & related", "payroll", "salaries", "wages",
  "payroll expenses", "salaries & wages", "compensation",
  "employee benefits", "payroll taxes",
]);

const CASH_ALIASES = new Set([
  "cash and cash equivalents", "cash", "bank", "checking",
  "savings", "money market", "petty cash", "cash in bank",
]);

const AR_ALIASES = new Set([
  "accounts receivable", "a/r", "ar", "trade receivables",
  "receivables", "accts receivable",
]);

const AP_ALIASES = new Set([
  "accounts payable", "a/p", "ap", "trade payables",
  "payables", "accts payable", "current liabilities",
]);

const FIXED_ASSET_ALIASES = new Set([
  "fixed assets", "property plant and equipment", "pp&e",
  "ppe", "property and equipment", "capital assets",
  "tangible assets", "long-term assets",
]);

const EQUITY_ALIASES = new Set([
  "equity", "stockholders equity", "shareholders equity",
  "owner's equity", "retained earnings", "capital stock",
  "common stock", "additional paid-in capital",
]);

const OCA_ALIASES = new Set([
  "other current assets", "oca", "prepaid expenses",
  "inventory", "other receivables", "deposits",
]);

const OCL_ALIASES = new Set([
  "other current liabilities", "ocl", "accrued expenses",
  "accrued liabilities", "deferred revenue", "credit cards",
  "other payables",
]);

const LONG_TERM_LIABILITIES_ALIASES = new Set([
  "long term liabilities", "long-term debt", "notes payable",
  "mortgages", "bonds payable", "term loans",
]);

const OTHER_ASSETS_ALIASES = new Set([
  "other assets", "intangible assets", "goodwill",
  "deposits", "long-term investments",
]);

/** All label groups for iteration */
const LABEL_GROUPS: Record<string, Set<string>> = {
  "Revenue": SALES_ALIASES,
  "Cost of Goods Sold": COGS_ALIASES,
  "Operating expenses": OPEX_ALIASES,
  "Other expense (income)": OTHER_EXPENSE_ALIASES,
  "Payroll & Related": PAYROLL_ALIASES,
  "Cash and cash equivalents": CASH_ALIASES,
  "Accounts receivable": AR_ALIASES,
  "Other current assets": OCA_ALIASES,
  "Fixed assets": FIXED_ASSET_ALIASES,
  "Other assets": OTHER_ASSETS_ALIASES,
  "Current liabilities": AP_ALIASES,
  "Other current liabilities": OCL_ALIASES,
  "Long term liabilities": LONG_TERM_LIABILITIES_ALIASES,
  "Equity": EQUITY_ALIASES,
};

/**
 * Resolve an FS line item string to its canonical label.
 * Returns the canonical name or the original string if no match.
 */
export function resolveLabel(lineItem: string): string {
  const lower = (lineItem || "").toLowerCase().trim();
  if (!lower) return lineItem;
  
  for (const [canonical, aliases] of Object.entries(LABEL_GROUPS)) {
    if (aliases.has(lower) || lower === canonical.toLowerCase()) {
      return canonical;
    }
  }
  
  return lineItem;
}

/**
 * Check if a line item matches a specific category.
 */
export function matchesCategory(lineItem: string, category: string): boolean {
  const aliases = LABEL_GROUPS[category];
  if (!aliases) return false;
  
  const lower = (lineItem || "").toLowerCase().trim();
  return aliases.has(lower) || lower === category.toLowerCase();
}

/**
 * Get the FS type (BS or IS) for a given line item.
 */
export function getFsTypeForLineItem(lineItem: string): "BS" | "IS" {
  const resolved = resolveLabel(lineItem);
  const isItems = ["Revenue", "Cost of Goods Sold", "Operating expenses", 
                   "Other expense (income)", "Payroll & Related"];
  return isItems.includes(resolved) ? "IS" : "BS";
}
