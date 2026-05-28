/**
 * gridDiff — cell-by-cell comparison of two GridData (or raw 2D string matrices).
 *
 * Used by:
 *  - wizard-workbook-parity.test.ts (deterministic CI guard)
 *  - scripts/validate-parity.ts     (live-project drift report)
 *
 * Values are normalized before comparison so cosmetic differences
 * ($1,234.00 vs 1234 vs "1,234") don't fire false positives.
 */
import type { GridData } from "./workbook-types";

export interface CellDiff {
  row: number;
  col: number;
  colId?: string;
  rowLabel?: string;
  a: string;
  b: string;
}

/** Strip $, commas, parens-as-negative, whitespace; coerce to canonical number string when numeric. */
export function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const raw = String(v).trim();
  if (raw === "" || raw === "—" || raw === "-") return "";
  // Currency-ish: $1,234.50 or (1,234.50)
  const negParen = /^\(.*\)$/.test(raw);
  const cleaned = raw
    .replace(/[$,]/g, "")
    .replace(/^\(|\)$/g, "")
    .replace(/\s+/g, "");
  const num = Number(cleaned);
  if (!Number.isNaN(num) && cleaned !== "") {
    const signed = negParen ? -num : num;
    // Round to 2 decimals to absorb floating-point noise.
    return (Math.round(signed * 100) / 100).toString();
  }
  return raw.toLowerCase();
}

/** Flatten a GridData to a 2D string matrix in column order. */
export function gridToMatrix(g: GridData): string[][] {
  const colIds = g.columns.map((c) => c.id);
  const header = g.columns.map((c) => c.label ?? c.id);
  const body = g.rows.map((row) => {
    const labelCol = row.label ?? "";
    return [labelCol, ...colIds.map((id) => String(row.cells[id] ?? ""))];
  });
  return [["", ...header], ...body];
}

/** Diff two GridData by cell. Returns one entry per mismatched cell. */
export function diffGrids(a: GridData, b: GridData): CellDiff[] {
  const colsA = a.columns.map((c) => c.id);
  const colsB = b.columns.map((c) => c.id);
  const diffs: CellDiff[] = [];

  // Column mismatch is itself a diff
  if (colsA.length !== colsB.length || colsA.some((c, i) => c !== colsB[i])) {
    diffs.push({
      row: -1,
      col: -1,
      a: colsA.join("|"),
      b: colsB.join("|"),
    });
  }

  const maxRows = Math.max(a.rows.length, b.rows.length);
  for (let r = 0; r < maxRows; r++) {
    const ra = a.rows[r];
    const rb = b.rows[r];
    const ids = ra && rb ? colsA : ra ? colsA : colsB;
    for (let c = 0; c < ids.length; c++) {
      const id = ids[c];
      const va = normalizeCell(ra?.cells?.[id]);
      const vb = normalizeCell(rb?.cells?.[id]);
      if (va !== vb) {
        diffs.push({
          row: r,
          col: c,
          colId: id,
          rowLabel: ra?.label ?? rb?.label,
          a: va,
          b: vb,
        });
      }
    }
  }
  return diffs;
}

/** Diff two raw 2D string matrices (used when comparing a builder grid to legacy `rawData`). */
export function diffMatrices(a: string[][], b: string[][]): CellDiff[] {
  const diffs: CellDiff[] = [];
  const maxRows = Math.max(a.length, b.length);
  for (let r = 0; r < maxRows; r++) {
    const ra = a[r] ?? [];
    const rb = b[r] ?? [];
    const maxCols = Math.max(ra.length, rb.length);
    for (let c = 0; c < maxCols; c++) {
      const va = normalizeCell(ra[c]);
      const vb = normalizeCell(rb[c]);
      if (va !== vb) diffs.push({ row: r, col: c, a: va, b: vb });
    }
  }
  return diffs;
}

/** Pretty-print a diff list for test failure messages or CLI output. */
export function formatDiffs(diffs: CellDiff[], limit = 10): string {
  if (diffs.length === 0) return "(no mismatches)";
  const shown = diffs.slice(0, limit);
  const lines = shown.map((d) => {
    const loc = d.colId
      ? `r${d.row} c${d.col} [${d.rowLabel ?? "?"} / ${d.colId}]`
      : `r${d.row} c${d.col}`;
    return `  ${loc}  wizard="${d.a}"  workbook="${d.b}"`;
  });
  if (diffs.length > limit) lines.push(`  …and ${diffs.length - limit} more`);
  return lines.join("\n");
}
