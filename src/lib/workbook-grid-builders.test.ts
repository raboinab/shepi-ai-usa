import { describe, it, expect } from "vitest";
import { TAB_GRID_BUILDERS } from "./workbook-grid-builders";
import { WORKBOOK_TABS } from "./workbook-tabs";
import { createMockDealData } from "./mockDeal";

const deal = createMockDealData();

describe("TAB_GRID_BUILDERS — smoke test every workbook tab", () => {
  it("every WORKBOOK_TABS entry has a registered builder (or is intentionally absent)", () => {
    // Not every tab must have a builder (some pull from extras), but registered
    // builders must correspond to a real tab id.
    const tabIds = new Set(WORKBOOK_TABS.map((t) => t.id));
    for (const builderId of Object.keys(TAB_GRID_BUILDERS)) {
      expect(tabIds.has(builderId)).toBe(true);
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
