/**
 * Standard Financial Statement Line Items
 * Used for reclassification dropdowns and spreadsheet sync
 */
export const FS_LINE_ITEMS = [
  "Cash and cash equivalents",
  "Accounts receivable",
  "Other current assets",
  "Fixed assets",
  "Other assets",
  "Current liabilities",
  "Other current liabilities",
  "Long term liabilities",
  "Equity",
  "Revenue",
  "Cost of Goods Sold",
  "Operating expenses",
  "Other expense (income)",
] as const;

export type FsLineItem = typeof FS_LINE_ITEMS[number];

/**
 * Group FS Line Items by statement type for UI organization
 */
export const FS_LINE_ITEMS_BY_TYPE = {
  "Balance Sheet - Assets": [
    "Cash and cash equivalents",
    "Accounts receivable",
    "Other current assets",
    "Fixed assets",
    "Other assets",
  ],
  "Balance Sheet - Liabilities & Equity": [
    "Current liabilities",
    "Other current liabilities",
    "Long term liabilities",
    "Equity",
  ],
  "Income Statement": [
    "Revenue",
    "Cost of Goods Sold",
    "Operating expenses",
    "Other expense (income)",
  ],
} as const;

/**
 * Normalize a free-form FS line item string (e.g. from AI output) to one of the
 * 14 canonical FS_LINE_ITEMS. Returns "" when no confident match is found so
 * the UI can prompt the user to pick manually.
 */
export function normalizeFsLineItem(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";

  // Exact match
  if ((FS_LINE_ITEMS as readonly string[]).includes(s)) return s;

  // Case-insensitive exact match (catches "Operating Expenses" → "Operating expenses")
  const lower = s.toLowerCase();
  const ci = (FS_LINE_ITEMS as readonly string[]).find(
    (x) => x.toLowerCase() === lower,
  );
  if (ci) return ci;

  // Keyword map — order matters: more specific patterns first.
  const rules: Array<[RegExp, string]> = [
    [/cogs|cost of goods|cost of revenue|job cost|job material|job labor|cost of labor/i, "Cost of Goods Sold"],
    [/depreciation|amortization|\bd&a\b/i, "Operating expenses"],
    [/contra.?revenue|refund|return|allowance|discount/i, "Revenue"],
    [/other income|interest earned|non.?operating|below.?the.?line|gain on|loss on/i, "Other expense (income)"],
    [/operating expense|opex|sg&a|\bsga\b|overhead|payroll|salary|wages|rent|lease|utilities/i, "Operating expenses"],
    [/retained earnings|opening balance|owner.?s? draw|distribution|contribution|\bequity\b/i, "Equity"],
    [/long.?term|note payable|loan payable|\bdebt\b|mortgage/i, "Long term liabilities"],
    [/current liab|sales tax payable|accounts payable|\bap\b|accrued|payroll liab/i, "Current liabilities"],
    [/fixed asset|pp&e|equipment|building|vehicle|machinery|furniture/i, "Fixed assets"],
    [/cash|checking|savings|money market/i, "Cash and cash equivalents"],
    [/receivable|\bar\b/i, "Accounts receivable"],
    [/suspense|clearing|unapplied|deferred|prepaid/i, "Other current assets"],
    [/^revenue$|^sales$|income.*revenue|^income$/i, "Revenue"],
    // Last-resort catch-alls for bare/ambiguous AI strings (keep AFTER specific patterns)
    [/\bincome\b|\brevenue\b/i, "Revenue"],
    [/\bliabilit(y|ies)\b/i, "Current liabilities"],
    [/\bexpense(s)?\b/i, "Operating expenses"],
    [/\basset(s)?\b/i, "Other current assets"],
  ];

  for (const [re, target] of rules) {
    if (re.test(s)) return target;
  }

  return "";
}
