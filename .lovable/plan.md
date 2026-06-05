Build the full offline workbook round-trip in one pass. Export → edit in Excel → re-import covers every writable tab, with conflict detection and a sandbox round-trip test to prove it works.

## Scope

All writable input tabs round-trip:
- Trial Balance (per account × period cell edits)
- Adjustments (MA / DD / PF) — edit amounts, add new rows, delete rows
- Reclassifications — edit, add, delete
- Setup / Due Diligence Information (deal name, client, industry, etc.)
- AR Aging, AP Aging (fixed 15-row period blocks)
- Fixed Assets (list replace)
- Top Customers, Top Vendors (list replace per period)
- Debt Schedule, Lease Obligations (list replace)

Calculated tabs are ignored on upload with a soft warning.

## Schema bump

`__shepi_meta` schema 1.0 → 1.1. Older exports rejected with "please re-export" message. Meta sheet gains: reclassification ids, supplementary section markers, full base snapshot of writable tabs (for three-way merge).

## Conflict handling

- `commit-workbook-upload` re-reads project at write time, compares against `exportedFromRevision`.
- Per-field overlap detection: if a field changed both online AND offline, return typed conflict payload.
- Non-overlapping drift auto-merges (both sets of changes kept) with toast.
- Overlapping conflicts open `ConflictResolutionDialog` — per-field **Keep mine / Keep theirs** radio. Atomic write + revision bump after all resolved.

## Sandbox self-test

`scripts/test-workbook-roundtrip.ts` (bun-runnable):
1. Build a real workbook server-side via `buildStyledWorkbook` with mock `DealData`.
2. Mutate it with exceljs (change TB cells, edit adjustments, add a new adjustment, delete one, edit setup).
3. Base64 it, POST to `parse-workbook-upload` via `supabase.functions.invoke`.
4. Assert diff shape matches expectations.
5. POST to `commit-workbook-upload`, assert resulting `wizard_data` and `revision`.
6. Run the conflict path: mutate DB between parse and commit, assert 409 + conflict payload, then resolve and re-commit.

Run with `bun run scripts/test-workbook-roundtrip.ts` against the dev project.

## Files

**New:**
- `src/lib/workbookUploadShared.ts` — shared types + base snapshot shape (used by parser, committer, dialog)
- `src/components/workbook/ConflictResolutionDialog.tsx`
- `scripts/test-workbook-roundtrip.ts`

**Edited:**
- `src/lib/buildStyledWorkbook.ts` — meta sheet 1.1 with base snapshot + reclass/supplementary keys
- `src/lib/exportWorkbookXlsx.ts` — pass full `dealData` snapshot through
- `supabase/functions/parse-workbook-upload/index.ts` — full tab coverage, returns base + new + warnings
- `supabase/functions/commit-workbook-upload/index.ts` — three-way merge, conflict payload, force/resolve modes
- `src/components/workbook/WorkbookUploadButton.tsx` — wire up conflict dialog, surface full summary

**No new migrations** — `revision` column exists from Phase 1.

## Trade-offs

- Base snapshot embedded in meta sheet adds ~50–300KB per workbook. Acceptable.
- AR/AP aging uses fixed-row block math; first version may need tuning for edge cases (empty blocks, extra rows added in Excel). Test script covers happy path; you'll likely surface bugs in real use and I'll fix them.
- "Keep both" merge semantics not implemented — only Keep mine / Keep theirs. Adding "both" later is additive.

## What you should expect

First end-to-end run probably fails on at least one tab (most likely AR aging or debt schedule row matching). Test script will tell us which. I'll iterate.