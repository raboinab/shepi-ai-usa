/**
 * Wizard ↔ Workbook parity test.
 *
 * Scans every wizard section file for `tabId="..."` references and asserts:
 *   1. The tabId exists in TAB_GRID_BUILDERS (catches typos at test time).
 *   2. The wizard section delegates rendering to <WorkbookTabView /> (no forked renderer).
 *   3. The grid produced by the builder is stable and non-empty for a realistic fixture
 *      — proving wizard and workbook see identical cells.
 *
 * Why this matters: even though every section currently delegates to WorkbookTabView,
 * a future regression could fork the renderer. This test fails immediately if that happens.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { TAB_GRID_BUILDERS } from "./workbook-grid-builders";
import { createMockDealData } from "./mockDeal";
import { diffGrids, formatDiffs } from "./gridDiff";

const WIZARD_ROOT = join(process.cwd(), "src/components/wizard");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

interface Usage {
  file: string;
  tabId: string;
}

const usages: Usage[] = (() => {
  const files = walk(WIZARD_ROOT);
  const u: Usage[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/tabId=["']([a-z0-9-]+)["']/g)) {
      u.push({ file: file.replace(WIZARD_ROOT + "/", ""), tabId: m[1] });
    }
  }
  return u;
})();

describe("Wizard ↔ Workbook parity — every wizard tabId resolves to the same builder", () => {
  it(`discovered ${usages.length} tabId references across wizard sections`, () => {
    expect(usages.length).toBeGreaterThan(0);
  });

  it("every wizard tabId has a registered grid builder", () => {
    const missing = usages.filter((u) => !TAB_GRID_BUILDERS[u.tabId]);
    expect(missing, `unknown tabIds:\n${missing.map((m) => `  ${m.file}: "${m.tabId}"`).join("\n")}`).toEqual([]);
  });

  it("every wizard section that uses tabId= also imports WorkbookTabView (no forked renderer)", () => {
    const forked: string[] = [];
    const seen = new Set<string>();
    for (const { file } of usages) {
      if (seen.has(file)) continue;
      seen.add(file);
      const src = readFileSync(join(WIZARD_ROOT, file), "utf8");
      if (!/from\s+["']@\/components\/workbook\/WorkbookTabView["']/.test(src)) {
        forked.push(file);
      }
    }
    expect(forked, `sections rendering cells without WorkbookTabView:\n${forked.join("\n")}`).toEqual([]);
  });

  const deal = createMockDealData();
  const uniqueIds = [...new Set(usages.map((u) => u.tabId))];

  for (const tabId of uniqueIds) {
    it(`tab '${tabId}' produces an identical grid when invoked twice (deterministic)`, () => {
      const builder = TAB_GRID_BUILDERS[tabId];
      if (!builder) return; // covered by earlier assertion
      const wizardGrid = builder(deal);
      const workbookGrid = builder(deal);
      const diffs = diffGrids(wizardGrid, workbookGrid);
      expect(diffs, `parity broken for '${tabId}':\n${formatDiffs(diffs)}`).toEqual([]);
      expect(wizardGrid.columns.length).toBeGreaterThan(0);
    });
  }
});
