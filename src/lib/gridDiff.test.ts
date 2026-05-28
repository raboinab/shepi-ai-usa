import { describe, it, expect } from "vitest";
import { normalizeCell, diffGrids, diffMatrices, gridToMatrix, formatDiffs } from "./gridDiff";
import type { GridData } from "./workbook-types";

describe("normalizeCell", () => {
  it("treats currency formatting as equal to plain numbers", () => {
    expect(normalizeCell("$1,234.50")).toBe(normalizeCell(1234.5));
    expect(normalizeCell("1,234")).toBe(normalizeCell("1234"));
  });
  it("treats parenthesized values as negative", () => {
    expect(normalizeCell("(500)")).toBe(normalizeCell(-500));
  });
  it("collapses empty / dash placeholders", () => {
    expect(normalizeCell("")).toBe(normalizeCell("—"));
    expect(normalizeCell(null)).toBe(normalizeCell(undefined));
  });
  it("absorbs floating-point noise to 2dp", () => {
    expect(normalizeCell(0.1 + 0.2)).toBe(normalizeCell(0.3));
  });
});

const makeGrid = (cells: Array<Record<string, string | number>>): GridData => ({
  columns: [
    { key: "jan", label: "Jan" },
    { key: "feb", label: "Feb" },
  ],
  rows: cells.map((c, i) => ({ id: `r${i}`, type: "data", label: `Row ${i}`, cells: c })),
});

describe("diffGrids", () => {
  it("returns no diffs when grids match numerically (formatting differs)", () => {
    const a = makeGrid([{ jan: "$1,000", feb: "(200)" }]);
    const b = makeGrid([{ jan: 1000, feb: -200 }]);
    expect(diffGrids(a, b)).toEqual([]);
  });
  it("reports exact mismatched cells with row/col coordinates", () => {
    const a = makeGrid([{ jan: 100, feb: 200 }]);
    const b = makeGrid([{ jan: 100, feb: 999 }]);
    const diffs = diffGrids(a, b);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ row: 0, col: 1, colId: "feb", a: "200", b: "999" });
  });
});

describe("gridToMatrix + diffMatrices + formatDiffs", () => {
  it("round-trips and produces readable output", () => {
    const g = makeGrid([{ jan: 1, feb: 2 }]);
    const m = gridToMatrix(g);
    expect(m[0]).toEqual(["", "Jan", "Feb"]);
    expect(diffMatrices(m, m)).toEqual([]);
    expect(formatDiffs([])).toBe("(no mismatches)");
    expect(formatDiffs([{ row: 1, col: 2, a: "10", b: "20" }])).toMatch(/wizard="10"/);
  });
});
