# Automated wizard ↔ workbook parity validation

## Goal
A repeatable check that, for every tab the wizard and workbook both render, diffs the two outputs cell-by-cell and reports exact mismatches (`tab`, `row`, `col`, `wizardValue`, `workbookValue`). Runs in CI via `vitest`, and as a one-off script against any real project in the database.

## Two complementary layers

### 1. Builder-level parity (fast, deterministic) — `src/lib/wizard-workbook-parity.test.ts`

For a fixture `DealData` (reuse the one in `workbook-grid-builders.test.ts`), assert that the grid produced by `TAB_GRID_BUILDERS[tabId]` equals the grid the wizard section would render for that same id. Since every migrated wizard section now goes through `WorkbookTabView`, the comparison is the identity check at the builder boundary plus a guard against future regressions where a section forks its own renderer.

Implementation:
- Enumerate `tabId` literals by scanning `src/components/wizard/**/*.tsx` (same regex used in the wiring check).
- For each id, call `TAB_GRID_BUILDERS[id](fixture)` twice — once via the wizard's `WorkbookTabView` import path, once directly — and `expect.toEqual` the resulting `cells` matrices.
- Fail with a readable diff: `tab=<id> row=<r> col=<c> wizard=<a> workbook=<b>`.
- Also assert every wired tabId exists in `TAB_GRID_BUILDERS` (catches typos at test time, not runtime).

### 2. Live-project parity script — `scripts/validate-parity.ts`

CLI tool that runs against a real project from Supabase and prints a per-tab mismatch report. Intended for ad-hoc verification ("does project X actually match?") without needing a browser session.

Implementation:
- Args: `--project <uuid>` (required), `--tabs <csv>` (optional filter).
- Service-role client (reads `SUPABASE_SERVICE_ROLE_KEY` from env; refuses to run without it; never bundled).
- Hydrate via `loadDealDataWithPriorBalances(projectRecord)` — same path the UI uses.
- For each tabId in `TAB_GRID_BUILDERS`, build the grid; if the project's `wizard_data` carries legacy `rawData` (e.g. `incomeStatement.rawData`), diff it against the freshly built grid and emit drift rows. Drift = "this project's cached wizard output disagrees with the current builder".
- Output: table with `tab | mismatches | sample (first 5)` and a non-zero exit code if any drift is found.

### Diff helper — `src/lib/gridDiff.ts`

Shared by both layers. Pure function:
```
diffGrids(a: string[][], b: string[][]): Array<{ row: number; col: number; a: string; b: string }>
```
Normalises whitespace and currency formatting (`$1,234` ≡ `1234.00`) before comparing so cosmetic differences don't fire.

## Files to add
- `src/lib/gridDiff.ts` — diff util + 4–5 unit tests in `gridDiff.test.ts`.
- `src/lib/wizard-workbook-parity.test.ts` — vitest, runs in the existing suite.
- `scripts/validate-parity.ts` — bun-runnable CLI.

## Files to touch
None. No production code changes; this is pure verification scaffolding.

## Out of scope
- Visual/DOM rendering parity (React Testing Library mount of both sides). The builder-level check is sufficient because every migrated section now delegates to `WorkbookTabView` — adding a DOM check would mostly test React, not parity.
- CI wiring. The new test runs automatically as part of `vitest run`.

## Acceptance
- `bunx vitest run src/lib/wizard-workbook-parity.test.ts` passes with the existing fixture.
- `bun run scripts/validate-parity.ts --project fa0768ca-96f9-4ded-b498-f64ca5be3ede` prints a per-tab report and exits 0 when there is no drift, non-zero with cell-level details when there is.
