# Offline Workbook Round-Trip

Let users download the full XLSX workbook, edit it offline in Excel, and upload it back. The system applies their changes, regenerates calculated tabs, and merges intelligently if another teammate edited the same workbook online while they were away.

## Scope

All editable data flows back:
- Trial Balance (monthly balances per account)
- Adjustments (MA / DD / PF) + Reclassifications
- Supplementary: AR/AP Aging, Fixed Assets, Top Customers/Vendors, Debt Schedule, Leases
- Setup: deal info, addback mappings

Calculated tabs (QoE Analysis, NWC, Proof of Cash, Free Cash Flow, IS/BS Reconciliation, etc.) are **ignored on upload** and regenerated from inputs.

## User Flow

1. In the workbook header, "Export XLSX" stays as-is. Add a new "Upload edited workbook" button next to it.
2. Export embeds a hidden `__shepi_meta` sheet with:
   - `projectId`, `schemaVersion`, `exportedAt` (ISO timestamp), `exportedFromRevision` (project revision counter)
   - Stable row keys per input tab (accountId, adjustment id, period id, aging row id, etc.) so we can match rows even if the user re-orders or inserts blank lines
3. User edits in Excel, clicks Upload → file goes to a new `parse-workbook-upload` edge function.
4. Edge function:
   - Validates the meta sheet (right project, schema version compatible)
   - Compares `exportedFromRevision` to the project's current revision in the DB
   - Parses each input tab into a normalized diff
5. UI shows a **review dialog** before commit:
   - Summary: "47 TB cells changed, 3 adjustments added, 1 deleted, AR aging replaced"
   - If conflict detected → merge UI (see below)
6. User confirms → changes write to `projects.wizard_data` + supplementary tables. Revision counter bumps. Calculated tabs recompute on next workbook load.

## Conflict Handling (the merge case)

Add a `revision` integer column on `projects` (bumps on every workbook write).

On upload, compare `exportedFromRevision` vs current `revision`:

- **No drift** (revisions match) → straight overwrite, no merge UI.
- **Drift, no overlap** (online user edited Tab A, offline user edited Tab B) → auto-merge, show a "Both changes kept" confirmation.
- **Drift with overlap** (same cell/row touched on both sides) → **per-field merge UI** listing each conflict with three buttons: *Keep mine (offline)*, *Keep theirs (online)*, *Keep both* (where it makes sense — e.g. two new adjustments). User must resolve every conflict before commit.

Conflict detection granularity:
- Trial Balance: per (accountId, periodId) cell
- Adjustments / Reclass: per row (by id), with field-level diff if same id edited both sides
- Aging / Customers / Vendors / Fixed Assets / Debt / Leases: list-level (full replace from whichever side, with a "review both lists" view since these are usually full snapshots)
- Setup: per field

## Technical Section

**New files:**
- `supabase/functions/parse-workbook-upload/index.ts` — accepts XLSX upload, parses with `xlsx` (already used elsewhere), validates meta, returns diff payload (does NOT write yet)
- `supabase/functions/commit-workbook-upload/index.ts` — accepts resolved diff payload, writes to DB, bumps revision
- `src/lib/workbookUploadParser.ts` — shared parser logic (per-tab row→record mappers)
- `src/lib/workbookDiff.ts` — diff/merge algorithm
- `src/components/workbook/UploadReviewDialog.tsx` — diff summary + conflict resolution UI
- `src/components/workbook/WorkbookUploadButton.tsx` — file picker + upload orchestration

**Edited files:**
- `src/lib/exportWorkbookXlsx.ts` — append hidden `__shepi_meta` sheet with project id, revision, schema version, and per-tab row id columns
- `src/components/workbook/WorkbookShell.tsx` — add Upload button next to Export
- `src/pages/Workbook.tsx` — wire upload handler, refetch on commit

**Migration:**
- Add `revision integer not null default 0` to `projects`
- Trigger or app-side increment on any wizard_data write from the workbook path

**Schema version:** start at `"1.0"`. If the workbook structure changes later, bump and reject older exports with a clear "please re-export and redo your edits" error.

**Edge cases handled:**
- User adds a new adjustment row in Excel with blank id → treated as insert, new id generated server-side
- User deletes a row → detected as missing key, marked for delete (confirmed in review dialog)
- User edits a calculated tab → silently ignored, surfaced as a warning in review ("You edited QoE Analysis — those changes were dropped because that tab regenerates from inputs")
- File from a different project → hard reject with clear error
- Schema version mismatch → hard reject

## Out of Scope (for now)

- Realtime collaboration / live presence
- Offline editing in a PWA (still requires Excel)
- Round-tripping cell formatting/colors the user added in Excel
- Partial tab upload (always whole workbook)

## Effort

~1.5–2 weeks. The hidden meta sheet + diff/merge UI is the bulk of the work; the parsers are mechanical (one per input tab, mirroring the existing exporters).
