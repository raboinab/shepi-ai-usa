import { describe, it, expect } from "vitest";
import { TAB_GRID_BUILDERS } from "./workbook-grid-builders";
import { WORKBOOK_TABS } from "./workbook-tabs";
import { createMockDealData } from "./mockDeal";

const deal = createMockDealData();

describe("TAB_GRID_BUILDERS — smoke test every workbook tab", () => {
  it("registers builders for all critical financial tabs", () => {
    const critical = ["setup", "trial-balance", "qoe-analysis", "income-statement", "balance-sheet"];
    for (const id of critical) {
      expect(TAB_GRID_BUILDERS[id], `missing builder for ${id}`).toBeDefined();
    }
  });

  for (const [tabId, builder] of Object.entries(TAB_GRID_BUILDERS)) {
    it(`builder '${tabId}' produces a non-throwing GridData with columns + rows`, () => {
      const grid = builder(deal);
      expect(grid).toBeDefined();
      expect(Array.isArray(grid.columns)).toBe(true);
      expect(Array.isArray(grid.rows)).toBe(true);
      expect(grid.columns.length).toBeGreaterThan(0);
    });
  }
});
