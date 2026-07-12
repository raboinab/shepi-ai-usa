## What's wrong with James Walbridge's project

**Project:** "Vampire Freaks" (`621a6c9f-1c25-40fa-92fa-6762ae3fe72b`), owner `walbridge.james@gmail.com`, status `in-progress`, stuck at phase 2 / section 1.

**What I found in the database**

- 24 credit card PDFs uploaded — all have `period_start` / `period_end` populated correctly.
- 2 financial statements uploaded today at 19:31–19:32 UTC:
  - `VampireFreaks_Balance Sheet.xlsx`
  - `VampireFreaks_Profit and Loss (4).xlsx`
  - Both have **NULL** `period_start` and `period_end`.
- No rows in `workflows`, `analysis_jobs`, or `adjustment_proposals` for this project.
- No entries in `upload_errors` for this project.
- The `detect-financial-statement-period` edge function is deployed (returns 401 to unauthenticated curl) but its logs and `function_edge_logs` have **zero invocations ever** — not just for this project.

**Diagnosis**

When we removed the manual reporting-period picker, we replaced it with a fire-and-forget call to `detect-financial-statement-period` in `DocumentUploadSection.tsx` (line 1638–1656). That call is never actually reaching the edge function — nothing in the platform logs shows a single request. Because the caller wraps it in `.catch(err => { console.warn; return null })` and the toast only fires when `applied > 0`, the user sees no error and no dates get written. Downstream analysis then can't run because BS/P&L have no period, which is why the project is stalled.

The credit-card path works because it goes through `create-processing-tasks` → DocuClipper, which stamps its own dates.

## Plan to fix

1. **Repair the pipeline** in `src/components/wizard/sections/DocumentUploadSection.tsx`:
   - Await the detection calls (still in parallel via `Promise.all`) instead of fire-and-forget, so failures surface.
   - Log every attempt/failure via `logUploadError` so we get visibility in `upload_errors`.
   - Show a toast when detection fails, not just when it succeeds, so users can fall back to a manual date entry.
   - Return a structured result and confirm at least one attempt hits the edge (verify by tailing edge-function logs after a test upload).

2. **Add a lightweight manual fallback** on each FS document row: a small "Set statement dates" link that opens a start/end date picker and writes `period_start` / `period_end` directly. This is the escape hatch for cases where OCR/regex can't detect dates from the file.

3. **Backfill Walbridge's two files now**: invoke `detect-financial-statement-period` server-side for `d6272337…` (P&L) and `e8a24dbf…` (Balance Sheet). If detection returns nothing, set the dates from the credit-card coverage window (Jan 2025 – Jun 2026 based on the statements uploaded) after confirming the period with him.

4. **Verify**: reload the project, confirm both FS docs show period dates, then confirm the wizard advances past phase 2 section 1 and analysis becomes runnable.

## Technical notes

- The invoke bug is almost certainly that the fire-and-forget promise is being dropped when the component re-renders after `fetchDocuments()` on line 1634 runs — React unmount can abort the underlying fetch in some browsers. Awaiting or moving the call to a small `useEffect` keyed on newly-uploaded doc ids would also fix it; awaiting is the smaller change.
- Do not re-introduce the month/year picker from before — the fallback link should be opt-in only, per the standing "no manual reporting period" preference.
- No schema or RLS changes needed. No new edge function needed.
