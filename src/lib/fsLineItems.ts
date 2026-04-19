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
