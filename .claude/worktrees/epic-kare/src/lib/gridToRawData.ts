/**
 * Converts GridData (workbook engine format) to string[][] (wizard report format).
 */
import type { GridData, GridRow, GridColumn } from "./workbook-types";
import { formatCurrency, formatPercent } from "./workbook-format";

export function gridDataToRawData(gridData: GridData): string[][] {
  const { columns, rows } = gridData;
  if (columns.length === 0) return [];

  // Header row
  const headerRow = columns.map(c => c.label);
  const result: string[][] = [headerRow];

  for (const row of rows) {
    if (row.type === "spacer") continue; // skip spacer rows

    const cells: string[] = columns.map(col => {
      const val = row.cells[col.key];
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val;

      // Number formatting: row-level format overrides column format
      const fmt = (row as any).format ?? col.format;
      if (fmt === "percent") return formatPercent(val);
      if (fmt === "currency") return formatCurrency(val);
      if (fmt === "number") return val.toLocaleString("en-US");
      return String(val);
    });

    // Add visual prefix for row types
    if (row.type === "section-header") {
      // Bold-style: already just text
    } else if (row.indent) {
      cells[0] = "  ".repeat(row.indent) + cells[0];
    }

    result.push(cells);
  }

  return result;
}
