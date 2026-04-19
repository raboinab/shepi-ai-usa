/**
 * Formatting utilities for the workbook engine.
 * Accounting-convention formatting with parentheses for negatives.
 */

/**
 * Format a number as currency with accounting convention.
 * Negative values are shown in parentheses: (1,234)
 * Zero values show as "-"
 */
export function formatCurrency(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return "";
  if (value === 0) return "-";
  
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return value < 0 ? `(${formatted})` : formatted;
}

/**
 * Format a number as a percentage.
 * e.g. 0.1234 -> "12.3%"
 * Returns "n/q" when value is not quantifiable (zero denominator).
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "";
  if (!isFinite(value)) return "N/M";
  
  const pct = value * 100;
  const formatted = Math.abs(pct).toFixed(decimals);
  return pct < 0 ? `(${formatted}%)` : `${formatted}%`;
}

/**
 * Parse a currency string back to a number.
 * Handles: $1,234.56, (1,234), -1234, etc.
 */
export function parseCurrency(value: string): number {
  if (!value || value === "-" || value === "") return 0;
  
  const isNegative = value.includes("(") && value.includes(")");
  const cleaned = value
    .replace(/[$,()]/g, "")
    .replace(/\s/g, "")
    .trim();
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  
  return isNegative ? -num : num;
}

/**
 * Format a number for display in the grid based on column format.
 */
export function formatCell(
  value: string | number | null,
  format?: "currency" | "percent" | "number" | "text"
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  // NaN (e.g. zero-denominator ratios) → "n/q" universally
  if (typeof value === "number" && isNaN(value)) return "N/M";
  
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "number":
      return value.toLocaleString("en-US");
    default:
      return String(value);
  }
}
