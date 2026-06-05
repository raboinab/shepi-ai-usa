# Offline Workbook Round-Trip — Full Build + Self-Test

Ship Phases 2 and 3 on top of the Phase 1 foundation already in place, then self-test the full round-trip in the sandbox (export → mutate XLSX programmatically → re-upload → verify DB state) without requiring user interaction.

## Phase 2 — Full input-tab coverage

Extend the meta sheet, parser, and committer to cover every editable input tab:

- **Trial Balance** — per-(accountId, periodId) cell diffs. Stable keys already emitted; add parser that reads the TB sheet, matches by account + period header, and emits cell-level changes.
- **Adjustments add/delete** — detect new rows (blank id → server-generated uuid) and missing rows (id in meta but absent in sheet → delete).
- **Reclassifications** — same row-level pattern as adjustments.
- **Supplementary tabs** — AR Aging, AP Aging, Fixed Assets, Top Customers, Top Vendors, Debt Schedule, Leases. Treat each as a full list replace (these are snapshot-style tabs); show "list replaced" in review.
- **Setup** — per-field diff on deal info + addback mappings.

Calculated tabs (QoE, NWC, Proof of Cash, IS/BS Recon, Free Cash Flow, etc.) parsed sheets are ignored on upload; surface a soft warning in the review dialog if the user touched them.

## Phase 3 — Per-field merge UI

When `exportedFromRevision < current revision` AND the diff overlaps fields the online side also changed:

- `commit-workbook-upload` returns a conflict payload listing each overlapping field (TB cell, adjustment field, setup field) with `mine` / `theirs` / `base` values.
- New `ConflictResolutionDialog.tsx` renders each conflict with three buttons: *Keep mine*, *Keep theirs*, *Keep both* (only where semantically valid — e.g. two new adjustments).
- User resolves all conflicts → resolved payload posted back to `commit-workbook-upload` with `resolutions` map → atomic write + revision bump.
- Non-overlapping drift auto-merges with a "Both changes kept" toast.

## Self-Test in sandbox

End-to-end automated test, no user interaction:

1. Seed a test project in Supabase with known wizard_data (TB, adjustments, AR aging, debt, setup).
2. Run the real `buildStyledWorkbook` server-side via a Node script to produce an XLSX with the `__shepi_meta` sheet.
3. Programmatically mutate the workbook with `exceljs`:
   - Edit a TB cell
   - Change an adjustment amount
   - Add a new adjustment row (blank id)
   - Delete an adjustment row
   - Replace an AR aging row
   - Edit a setup field
4. Invoke `parse-workbook-upload` via `supabase functions invoke` against the local sandbox — assert the diff matches expectations.
5. Invoke `commit-workbook-upload` — assert DB wizard_data reflects every change and revision bumped by 1.
6. **Conflict path:** bump revision out-of-band, mutate the same TB cell on both sides, re-upload — assert conflict payload returned, then post resolutions and assert final state matches the chosen resolutions.
7. Print a pass/fail report.

Test lives at `scripts/test-workbook-roundtrip.ts`, run with `bun run scripts/test-workbook-roundtrip.ts`. Iterates until all assertions green; fixes bugs found along the way.

## Technical section

**New files:**
- `src/lib/workbookUploadParser.ts` — per-tab row→record parsers (TB, adjustments, reclass, AR, AP, fixed assets, customers, vendors, debt, leases, setup)
- `src/lib/workbookDiff.ts` — three-way diff (base = `exportedFromRevision` snapshot, mine = uploaded, theirs = current DB)
- `src/components/workbook/ConflictResolutionDialog.tsx` — per-field merge UI
- `scripts/test-workbook-roundtrip.ts` — sandbox self-test harness

**Edited files:**
- `src/lib/buildStyledWorkbook.ts` — extend `__shepi_meta` with stable keys for TB cells, reclass, supplementary tabs, setup fields; snapshot of base values for three-way diff
- `supabase/functions/parse-workbook-upload/index.ts` — call full parser, produce full diff, store base snapshot for conflict detection
- `supabase/functions/commit-workbook-upload/index.ts` — three-way merge logic, return conflict payload when overlaps detected, accept resolutions on second call
- `src/components/workbook/WorkbookUploadButton.tsx` — expand review dialog to cover all change types; chain into ConflictResolutionDialog when conflicts returned

**Schema:** no new migrations — `revision` already added in Phase 1. Schema version bumps from `"1.0"` → `"1.1"` because meta sheet gains fields; older exports rejected with a clear "please re-export" error.

**Base snapshot strategy:** to do real three-way merge, the parse function needs the "base" (what the DB looked like at `exportedFromRevision`). Two options:
- (a) Embed the full base snapshot in `__shepi_meta` at export time (simpler, fatter XLSX)
- (b) Store snapshots server-side in a new `project_revision_snapshots` table keyed by revision (cleaner, requires migration + retention policy)

Going with **(a)** for now — keeps everything in the file, no extra table, no retention question. Snapshot is JSON-stringified and stored in a hidden sheet cell; for a typical workbook this adds ~50–200KB to the XLSX, acceptable.

## Effort
Single agent loop. Phase 2 parsers + Phase 3 merge UI + self-test harness, iterating until the test passes.

## Out of scope
Realtime presence; cell formatting round-trip; partial tab upload.
