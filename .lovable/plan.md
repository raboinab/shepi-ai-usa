
## Problem

The Tax Return Analysis comparison for **Gross Receipts (Line 1a)** is artificially inflated by non‑operating income (interest, portfolio gains, etc.). The 1120‑S Line 1a is *operating* revenue only, but the platform is comparing it against `operating revenue + other income` from the books.

Measured impact (your numbers):

| Year | Tax 1a | Book operating | Book other | Platform uses | Inflation |
|------|--------|----------------|------------|---------------|-----------|
| 2023 | $1,056,019 | $908,500 | $166,204 | $1,074,704 | +$166K |
| 2024 | $745,694 | $976,324 | $119,648 | $1,095,972 | +$120K |
| 2025 | $907,693 | $824,583 | $6,713 | $831,295 | +$7K |

This is the largest single variance in the report and is the main driver of the 56–63% consistency scores.

## Root cause

`supabase/functions/parse-tax-return/index.ts`

1. **Line 704** — `bucketIsSection` collapses both QB section groups into one bucket:
   ```ts
   if (g === "income" || g === "otherincome" || h === "income" || h === "other income") return "revenue";
   ```
   QuickBooks emits `Income` and `OtherIncome` as distinct top‑level sections; we lose that distinction here.

2. **Line 1325** — `sumISMonthly('revenue')` returns the combined total because of (1).

3. **Lines 1356–1364** — that combined total is compared against `extractedData.grossReceipts` (1120‑S Line 1a), which by IRS definition excludes interest, dividends, and portfolio gains. Those items belong on Schedule K, not Line 1a.

## Fix

### 1. Separate the bucket (`index.ts` ~line 698–771)

- Extend `NormalizedIS` with a fourth bucket: `otherIncome: NormalizedSection`.
- Update `bucketIsSection` to return `"other_income"` for `group === "otherincome"` or `header === "other income"`, and keep only `group === "income"` / `header === "income"` mapping to `"revenue"`.
- Update `normalizeQbPnlMonthly` to populate the new bucket. Do **not** add other_income to `totalRevenue`.

### 2. Use operating-only revenue for the Line 1a compare (~line 1325–1364)

- `sumISMonthly('revenue')` now correctly returns operating revenue only — no other change needed there.
- The existing `pushCompare({ field: "Gross Receipts (1a)", ... })` block becomes accurate as a side‑effect.

### 3. (Optional but recommended) Add a separate Other Income tie‑out

Compare `otherIncome` bucket total against the Schedule K non‑operating lines we already extract (`scheduleK.interestIncome`, `dividendIncome`, `netSTCapitalGain`, `netLTCapitalGain`, `netSec1231Gain`, `otherIncomeLoss`). This turns what is currently a hidden source of noise into its own diagnostic row, and gives the user an explanation for legitimate book↔K differences instead of dragging the headline score.

### 4. Pseudo-GL synthesis (line ~1403)

The `for (const group of ["revenue", "cogs", "expenses"] as const)` loop should include `"other_income"` so other-income accounts remain searchable by downstream matchers (otherwise the Schedule K tie-out above would have nothing to match against on qbtojson-only projects).

### 5. Regression check

After deploying, re-run all three years for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`. Expected:
- 2023 Line 1a variance shrinks from ~1.7% inflated to the real ~14% delta (or whatever the operating-only books show)
- 2024 variance moves toward the real ~24% gap
- 2025 variance moves toward the real ~9% gap
- A new "Other Income vs Schedule K" row appears (if step 3 is included)
- Consistency scores recover proportionally (the largest variance line was driving the most weight)

## Out of scope

- No prompt/extractor changes (1a, Schedule K, and Other Income are already extracted).
- No DB schema changes.
- No frontend changes — the comparison rows are rendered generically from the analyzer output.

## Files touched

- `supabase/functions/parse-tax-return/index.ts` (only)

## Effort

~30–60 LOC. Single edge function deploy. No migration.
