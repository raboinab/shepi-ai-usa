## Diagnosis

Pulled the live data for project `fa0768ca…` and compared against what the screenshot is showing.

**What's actually in the DB (latest `tax_return_analysis` rows):**

| Year | Score | Comparisons | Sources picked |
|------|-------|-------------|----------------|
| 2023 | 56    | 9           | IS + BS = qbtojson aggregate, TB + GL = **period_mismatch** |
| 2024 | 56    | 9           | IS + BS = qbtojson aggregate, TB + GL = **period_mismatch** |
| 2025 | 100   | **3**       | IS + BS + TB + GL = in_year (single month) |

So the analyzer is producing real scores. The screenshot ("N/A — no comparable data", "Analyzed: 6/4/2026") is **stale UI** — the user is looking at a previous render; the most recent 2025 re-run finished at 15:05 today with score 100 and was never refetched.

But the underlying analyzer also has two real bugs that crater coverage:

### Bug 1 — Tax year 2025 picks a single month of unified_api data
`processed_data` for `income_statement` / `balance_sheet` / `trial_balance` (source `unified_api`) stores **one row per month**. The resolver in `parse-tax-return/index.ts` (≈L1057-1067) does:
```ts
const inYear = rows.find(r => period_end inside 2025-01-01..2025-12-31)
```
This picks the first matching row (a single month), then proceeds as if that month *were* the full year. That's why 2025 has only 3 comparisons and unrealistically high score=100 — most matchers find $0 and silently skip via `pushCompare` (comparisonValue === 0 → return).

### Bug 2 — qbtojson multi-year aggregates with non-null period_end fall through to `period_mismatch`
For TB and GL the qbtojson row has `period_start = 2023-01-31`, `period_end = 2025-12-31` (multi-year). The aggregate branch (L1069) only matches `!r.period_end && source_type === 'qbtojson'`. So the resolver skips it and lands in branch (c) "period_mismatch", which discards GL/TB matching for the right year. That's the "Only out-of-year data available" diagnostic in 2023 + 2024.

### Bug 3 — UI doesn't auto-refetch after re-analyze if the invoke errors silently
`handleReanalyzeTaxReturn` updates state only when `parseResult.analysis?.documentId` is present. If the edge function returns the bare object (current shape), the field is present, but if it ever returns `{ status:'queued' }` (e.g. the auto-reanalyze path), the card stays stale and shows yesterday's "Analyzed:" date.

## Plan

### 1. Resolver: prefer broadest year-coverage source (parse-tax-return/index.ts ~L1040-1088)

Replace the "pick first in_year" logic with:

1. **Multi-row in_year aggregation** — collect *all* rows with `period_start..period_end` overlapping the tax year, then:
   - For IS/cashflow-style (additive) data: merge by appending monthlyValues maps so the full year is summed.
   - For BS (point-in-time): pick the row whose `period_end` is closest to (but ≤) `yearEnd`.
2. **Treat any row spanning ≥ 11 months as `aggregate`** even when `period_end` is non-null (covers the qbtojson TB/GL case). Concretely:
   ```ts
   const isMultiYearAggregate = (r) =>
     r.source_type === 'qbtojson' &&
     (!r.period_end ||
      monthsBetween(r.period_start, r.period_end) >= 11);
   ```
3. Keep the existing single-row in_year branch as a fallback only when no aggregation is possible.

Expected effect:
- 2025: IS/BS/TB stitched from 7 unified_api months + qbtojson aggregate fill → real year totals → meaningful variance for Gross Receipts, Officer Comp, Salaries, etc.
- 2023/2024: GL/TB no longer flagged "period_mismatch"; matchers run against the qbtojson multi-year aggregate scoped to that year.

### 2. Don't silently drop deduction comparisons when the matcher hits one account with $0

`pushCompare` skips on `comparisonValue === 0`. For deductions where the tax return reports a real number and the IS/GL shows $0, that's a *meaningful* variance (e.g. taxpayer claimed Officer Comp but the books show none). Emit it as a `review_only` row with note "Books show $0 for matched accounts" instead of silently dropping. (`parse-tax-return/index.ts` ~L1252-1257 + the deduction loop ~L1454-1463.)

### 3. Force a refetch after re-analyze (DocumentUploadSection.tsx ~L818-857)

After `handleReanalyzeTaxReturn` finishes (success path or any returned object), call `fetchTaxReturnInsights()` to pull the freshest row from `processed_data` instead of relying on `parseResult.analysis`. Removes the "Analyzed: 6/4" stale-card case entirely.

### 4. Smoke-test against the live project

After redeploy, re-run `parse-tax-return` for all three documents on project `fa0768ca…` and verify:
- 2025 produces >10 comparisons (was 3)
- 2023/2024 source diagnostics flip TB + GL from `period_mismatch` → `aggregate`
- Score is no longer 100 for 2025 once real account-level matching runs

## Technical Details

**Files**
- `supabase/functions/parse-tax-return/index.ts` — resolver + zero-comparison handling
- `src/components/wizard/sections/DocumentUploadSection.tsx` — refetch after re-analyze

**Data assumptions verified via SQL**
- `processed_data` for this project has 15 unified_api monthly IS rows (2025-06..2026-05), 15 monthly BS rows, 15 monthly TB rows; qbtojson aggregates exist for IS (array of 36 months), BS (array of 36), TB (`monthlyReports[36]`), GL (raw report shape).
- canonical_transactions: not inspected in this debug pass; the existing `GL_SOURCE_TYPES` filter + `txn_date` range is unchanged.

**Out of scope**
- Re-architecting how unified_api stores monthly rows.
- Changing the AI extraction prompt / Schedule K-L-M shape.
- Cross-validation against `tax_return_analysis_v1` schema (per prior decision, tax return stays out of the normalized contract).
