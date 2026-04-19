/**
 * Utility to slice wide tables for PDF readability.
 * Keeps col 0 (labels) + last N data columns.
 * If the last column looks like a total/LTM column, it's always kept.
 */
export function sliceColumnsForPDF(rawData: string[][], maxDataCols = 7): string[][] {
  if (!rawData || rawData.length === 0) return rawData;
  const totalCols = rawData[0].length;
  if (totalCols <= maxDataCols + 1) return rawData; // +1 for label column

  // Check if last column is a "total" column
  const lastHeader = (rawData[0][totalCols - 1] || "").toLowerCase();
  const isTotalCol = ["ltm", "total", "ttm", "sum", "ytd"].some((k) => lastHeader.includes(k));

  // Keep: col 0 (labels) + last N data columns (possibly reserving one for total)
  const reservedForTotal = isTotalCol ? 1 : 0;
  const dataCols = maxDataCols - reservedForTotal;
  const startIdx = Math.max(1, totalCols - reservedForTotal - dataCols);

  return rawData.map((row) => {
    const sliced = [row[0], ...row.slice(startIdx)];
    return sliced;
  });
}

/**
 * Abbreviate long month headers like "January 2024" → "Jan '24"
 */
const MONTH_MAP: Record<string, string> = {
  january: "Jan", february: "Feb", march: "Mar", april: "Apr",
  may: "May", june: "Jun", july: "Jul", august: "Aug",
  september: "Sep", october: "Oct", november: "Nov", december: "Dec",
};

export function abbreviateHeader(label: string): string {
  const lower = label.toLowerCase().trim();
  for (const [full, short] of Object.entries(MONTH_MAP)) {
    if (lower.startsWith(full)) {
      const yearMatch = label.match(/(\d{4})/);
      if (yearMatch) return `${short} '${yearMatch[1].slice(2)}`;
      return short;
    }
  }
  return label;
}
