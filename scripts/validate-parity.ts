/**
 * Live-project wizard ↔ workbook parity validator.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/validate-parity.ts --project <uuid>
 *   SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/validate-parity.ts --project <uuid> --tabs income-statement,balance-sheet
 *
 * Pulls the project record with the service role key, hydrates DealData via the same
 * adapter the UI uses, runs every WorkbookTabView grid builder, and compares each
 * grid against any legacy cached `rawData` stored in `wizard_data.<key>.rawData`.
 *
 * Exits 0 when there is no drift, non-zero with a per-cell mismatch report otherwise.
 */

// Browser shim so the supabase client (which is imported transitively) loads under bun.
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => mem.set(k, String(v)),
  removeItem: (k: string) => mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};
(globalThis as any).window = globalThis;

import { createClient } from "@supabase/supabase-js";
const { loadDealDataWithPriorBalances } = (await import("../src/lib/projectToDealAdapter")) as typeof import("../src/lib/projectToDealAdapter");
type ProjectRecord = import("../src/lib/projectToDealAdapter").ProjectRecord;
const { TAB_GRID_BUILDERS } = (await import("../src/lib/workbook-grid-builders")) as typeof import("../src/lib/workbook-grid-builders");
const { gridToMatrix, diffMatrices, formatDiffs } = (await import("../src/lib/gridDiff")) as typeof import("../src/lib/gridDiff");

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) args.set(a.slice(2), process.argv[++i] ?? "");
}

const projectId = args.get("project");
const tabsFilter = args.get("tabs")?.split(",").map((s) => s.trim()).filter(Boolean);

if (!projectId) {
  console.error("Missing --project <uuid>");
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL) in env.");
  process.exit(2);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb.from("projects").select("*").eq("id", projectId).single();
if (error || !data) {
  console.error("Failed to fetch project:", error?.message);
  process.exit(2);
}

const project = data as ProjectRecord;
const dealData = await loadDealDataWithPriorBalances(project);
console.log(`Project: ${project.name}`);
console.log(`Periods: ${dealData.deal.periods.length}  TB rows: ${dealData.trialBalance?.length ?? 0}\n`);

// Map of wizard_data legacy keys → builder tabId. Only keys actually cached as `rawData`
// in older project records are listed; everything else just builds fresh (no drift check).
const LEGACY_KEY_TO_TAB: Record<string, string> = {
  incomeStatement: "income-statement",
  balanceSheet: "balance-sheet",
  freeCashFlow: "free-cash-flow",
  nwcAnalysis: "nwc-analysis",
  workingCapital: "working-capital",
  payroll: "payroll",
  proofOfCash: "proof-of-cash",
  trialBalance: "trial-balance",
  qoeAnalysis: "qoe-analysis",
};

const wd = (project.wizard_data ?? {}) as Record<string, any>;
const tabIds = Object.keys(TAB_GRID_BUILDERS).filter(
  (id) => !tabsFilter || tabsFilter.includes(id),
);

interface Report {
  tabId: string;
  rows: number;
  cols: number;
  driftAgainstLegacy: number;
  sample: string;
  buildError?: string;
}

const reports: Report[] = [];
let totalDrift = 0;

for (const tabId of tabIds) {
  const builder = TAB_GRID_BUILDERS[tabId];
  let grid;
  try {
    grid = builder(dealData);
  } catch (e: any) {
    reports.push({ tabId, rows: 0, cols: 0, driftAgainstLegacy: 0, sample: "", buildError: e.message });
    continue;
  }
  const matrix = gridToMatrix(grid);

  // Find any legacy cached rawData for this tab
  let drift = 0;
  let sample = "";
  for (const [k, mappedTab] of Object.entries(LEGACY_KEY_TO_TAB)) {
    if (mappedTab !== tabId) continue;
    const legacy = wd[k]?.rawData;
    if (!Array.isArray(legacy) || legacy.length === 0) continue;
    const diffs = diffMatrices(matrix, legacy);
    drift += diffs.length;
    if (diffs.length > 0 && !sample) sample = formatDiffs(diffs, 5);
  }
  totalDrift += drift;
  reports.push({
    tabId,
    rows: grid.rows.length,
    cols: grid.columns.length,
    driftAgainstLegacy: drift,
    sample,
  });
}

const pad = (s: string, n: number) => s.padEnd(n);
console.log(pad("tab", 28), pad("rows", 6), pad("cols", 6), pad("drift", 8));
console.log("-".repeat(60));
for (const r of reports) {
  console.log(
    pad(r.tabId, 28),
    pad(String(r.rows), 6),
    pad(String(r.cols), 6),
    pad(r.buildError ? "ERROR" : String(r.driftAgainstLegacy), 8),
  );
  if (r.buildError) console.log(`    ! ${r.buildError}`);
  if (r.sample) console.log(r.sample);
}

console.log(`\nTotal drift cells: ${totalDrift}`);
console.log(`Tabs with build errors: ${reports.filter((r) => r.buildError).length}`);

if (totalDrift > 0 || reports.some((r) => r.buildError)) process.exit(1);
process.exit(0);
