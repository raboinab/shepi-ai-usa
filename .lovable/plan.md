## What "N/A — no comparable data" means

The card is saying: *we couldn't tie any line of the 1120-S back to a comparable number in your books for this year*. It's not that your books are empty — it's that the comparison engine is filtering them out incorrectly.

## What I found in this project (fa0768ca…)

You actually have plenty of data for 2023, 2024, and 2025:

| Source | 2023 | 2024 | 2025 |
|---|---|---|---|
| `canonical_transactions` total | 5,065 | 5,380 | 28,575 |
| of which `general_ledger` rows | 0 | 0 | 22,685 |
| of which `income_statement` snapshots | 1,780 | 1,850 | 1,975 |
| of which `bank_transactions` | 1,995 | 2,175 | 2,470 |
| `processed_data` IS/BS per-year aggregate | ✓ (qbtojson, `period_end=NULL`) | ✓ | ✓ |

Stored tax-return analyses in the DB right now:

| Year | Comparisons | Score | Notes |
|---|---|---|---|
| 2023 | 1 | -1 | stale — ran before the rewrite |
| 2024 | 1 | -1 | stale — ran before the rewrite |
| 2025 | 4 | 75 | new code, but only 4 cmps out of ~20 expected |

So three different bugs are stacked on top of each other.

## Root causes

**1. `processed_data` year filter throws away the only good source.**
`parse-tax-return` filters `processed_data` by `period_end IN [yearStart, yearEnd]`. The qbtojson full-history `income_statement` and `balance_sheet` rows have `period_end = NULL` (they're keyed by `monthlyValues`, not by period), so they get rejected. Fallback picks the most-recent unified_api row, which is **March–May 2026** — a single month tagged "(period mismatch)". For 2023/2024/2025 we end up comparing a 1120-S against one month of 2026.

**2. `sumISMonthly` doesn't filter by year.**
Even when the qbtojson IS is reached, `sumISMonthly('revenue')` sums *every* month of *every* year in `monthlyValues`. A 2023 return's $1.05M gross receipts then gets compared to 36 months of revenue — always a "significant variance".

**3. `canonical_transactions` aggregation double-counts.**
The matchers sum `amount_abs` across every row in the tax year. But for 2023/2024 the only "GL-like" rows are monthly IS/BS snapshots (60 rows per account = 12 months × 5 buckets in some cases, or repeated per-month cumulative balances). Summing them inflates totals by 12–60×, so they never match the tax return and the engine either skips them or marks them all as "significant variance".

**4. The 2023/2024 cards on screen are still showing the pre-rewrite result** (score `-1`, 1 comparison). They haven't been re-analyzed since the engine was rewritten — but re-analyzing alone won't fix it until causes 1–3 are addressed.

## Plan

### A. Fix the year resolution for `processed_data` (server)

In `supabase/functions/parse-tax-return/index.ts`:

- Treat qbtojson `income_statement` / `balance_sheet` / `trial_balance` / `general_ledger` rows with `period_end = NULL` as **full-history aggregates**, not "no period". Use them directly when present, instead of falling back to the most recent unified_api month.
- Prefer (in order): (a) row whose `period_end` is inside the tax year, (b) qbtojson aggregate (`period_end IS NULL`, source `qbtojson`), (c) latest with mismatch flag.

### B. Year-scope the income statement and balance sheet helpers

- `sumISMonthly(group, year)` — filter `monthlyValues` keys to `YYYY-*` for the tax year before summing. Same for `isNetIncome` → use only that year's months.
- `getBsEoyByMatcher(year)` — pick the December key of the tax year (or last available key ≤ `yearEnd`), not the absolute last key in `monthlyValues`.

### C. De-duplicate `canonical_transactions` aggregation

- When `source_type IN ('income_statement','balance_sheet','cash_flow','trial_balance')`, these are **monthly snapshots**, not journal entries. Exclude them from the `glByAccount` aggregation — they're already covered by the IS/BS helpers in (B).
- Keep `general_ledger`, `bank_transactions`, `credit_card_transactions`, `journal_entries`, and `qbtojson` GL rows in the aggregation.
- For years with **no** true GL source (2023, 2024 here), fall back to the IS processed_data for P&L deduction comparisons instead of GL matchers, and label the source "Income Statement (per-year)".

### D. Surface *why* a row is N/A, not just "N/A"

In `TaxReturnInsightsCard.tsx`, when `overallScore === null`, replace the single "no comparable data" line with a short reason list built from server-provided diagnostics, e.g.:
- ✅ Income Statement found for 2023 (qbtojson, 12 months)
- ✅ Balance Sheet found for 2023 (qbtojson, EOY 2023-12)
- ⚠️ No detailed General Ledger for 2023 — using IS aggregates for deductions
- ❌ 0 comparisons produced — explain which extracted fields had no counterpart

Server adds an `analysisDiagnostics: { sources: [...], skippedFields: [...] }` block to the stored analysis; UI renders it under the score.

### E. Auto-reanalyze stale rows

Currently 2023 and 2024 still hold pre-rewrite results (`overallScore: -1`). Add a one-shot: when the card loads and the stored result has `overallScore === -1` or is missing the new `analysisDiagnostics` field, the UI auto-invokes `parse-tax-return` once (silent, with a small "Updating analysis…" indicator) so the user doesn't have to click Re-analyze on every old card.

### Files

- `supabase/functions/parse-tax-return/index.ts` — A, B, C, plus emit `analysisDiagnostics`
- `src/components/wizard/sections/TaxReturnInsightsCard.tsx` — D (render diagnostics)
- `src/components/wizard/sections/DocumentUploadSection.tsx` — E (auto-reanalyze stale)

### Out of scope

- No DB schema changes.
- No changes to extraction (PDF → JSON) — only to the comparison engine and UI.
- Bank-statement-only reconciliation (matching deposits to gross receipts) is a separate, larger piece of work and not included here.

## Expected result after fix

For this project's three returns:
- **2025**: comparisons jump from 4 to ~15–18 (full P&L deductions vs GL, Schedule L vs BS EOY 2025-12, M-1, M-2). Real consistency score.
- **2024 / 2023**: ~10–12 comparisons each, driven by per-year IS/BS aggregates from the qbtojson rows that today are being silently dropped. Score reflects actual book-vs-return alignment instead of "N/A".
