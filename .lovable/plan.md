## Goal

Make Balance Sheet uploads behave identically to P&L and Cash Flow: when a file contains multiple monthly columns (or multi-column comparative snapshots), the detector should capture the full `period_start`→`period_end` span, and the coverage timeline should fill in every month in between.

## What's already right

- `CoverageTimeline` (monthly mode) already fills every month between `period_start` and `period_end` — same code path P&L/CF use.
- `detect-financial-statement-period` already has header-row scans for BS ("As of…", numeric dates, ISO dates).

## What's actually broken

The Vampire Freaks BS upload registered `period_start=2026-05-01, period_end=2026-05-31` even though the user expects multi-month coverage. Two likely causes (verify in build mode by downloading the stored `.xlsx` and printing the header rows):

1. **QBO comparative BS columns use bare month-year labels** like `"May 2026"`, `"Apr 2026"`, `"Mar 2026"` — no "As of", no day, no ISO. The current BS header regex requires either `Month DD, YYYY`, `MM/DD/YYYY`, or `YYYY-MM-DD`. Bare `Month YYYY` falls through to the single-month fallback (§7), which fires only if no earlier match hit — and one "As of May 31, 2026" in the title kills that fallback.
2. **`headerText` window is too small** — only the first ~10 rows are passed to the BS-specific header scan, so later column-header rows are missed on stacked/multi-section exports.

## Changes

### `supabase/functions/detect-financial-statement-period/index.ts`

1. **Add bare "Month YYYY" scan for BS headers** in the `accountType === "balance_sheet"` block (§6b):
   - Regex: `\b([A-Za-z]{3,9})\.?\s+(\d{4})\b`
   - For each match, `pushRange(startOfMonth, endOfMonth, "bs header month-year")`.
   - This ensures QBO's `Apr 2026 | May 2026 | Jun 2026` column headers all register.

2. **Widen the header window** passed as `headerText` for XLSX BS files from ~10 rows to first 20 rows (or first non-empty row plus the next 5), so column-header rows below a title block are included.

3. **Always run BS header scans even when a `year ended` / `as of` match already fired** (they already do — just confirm §6b runs unconditionally so a single title date doesn't shadow the comparative columns).

4. **Prefer widest span**: current `starts.sort()[0]` / `ends.sort().slice(-1)[0]` already picks widest — no change, but add a unit-style log line showing `starts.length` / `ends.length` so we can diagnose future files from edge-function logs.

### Diagnostic step (build mode, before shipping)

Download `1cc25ae2…/621a6c9f…/1783969512198_VampireFreaks_Balance Sheet.xlsx` from the `documents` bucket, dump sheet header rows, and confirm which of the two causes above actually applies. Adjust the regex additions if the real header format differs (e.g., `MMM-YY`, `5/31/26`, stacked "Period Ending" rows).

### Re-run for existing project

After deploy, invoke `detect-financial-statement-period` for document `753518ce-6ffe-4af0-b806-906447aaadfc` so `period_start` / `period_end` update on the stored row. Then re-run BS validation from the UI (already exposed via the Re-run button).

## Out of scope

- The "Not balanced" derivation issue (separate bug in `validate-financial-statement` equity rollup) — flag it after this fix lands so it can be planned independently.
- Auto-deriving BS snapshots from the Trial Balance (rejected in prior turn).

## Technical notes

- File: `supabase/functions/detect-financial-statement-period/index.ts` — additive regex block; no schema changes.
- No client changes required; `CoverageTimeline` monthly renderer already handles wider spans.
- No migration required.
