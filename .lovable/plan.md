## Where we stand

After the YTD→activity fix, the Balance Sheet validates 100% and the P&L is much closer. Remaining gaps for Sandbox Company:

| Line | Uploaded | TB-derived | Gap |
|---|---|---|---|
| Revenue | $2,709,406 | $2,962,125 | **-$252,720 (-8.5%)** |
| COGS | $7,256 | $7,256 | match |
| OpEx | $180,244 | $775,914 | **-$595,671 (-76.8%)** |
| Net Income | N/A | $2,178,955 | not extracted |

These are no longer period-math problems; they are extraction + classification mismatches between what the AI pulls off the QuickBooks CSV and how `classifyISAccount` buckets QB account types.

## Root causes

1. **Revenue $253k gap** — `classifyISAccount` treats QB account type `"Other Income"` as `revenue`. QuickBooks' "Total Revenue" / "Total Income" line on the P&L excludes Other Income (it's reported below the operating block). So TB sums more than the uploaded "Total Revenue".

2. **OpEx $596k gap** — the AI almost certainly grabbed a sub-total row off the CSV (likely "Total Expenses" of one section, or it skipped Payroll/Other Expense sections) instead of the full operating-expense universe. Net Income failing to extract is the same symptom: the AI didn't find a clean "Net Income" line.

3. **No Net Income comparison** — extraction returns null, so we lose the strongest end-to-end cross-check.

## Fix plan — `supabase/functions/validate-financial-statement/index.ts`

### 1. Split "Other Income" out of Revenue on the TB side
- Add an `otherIncome` bucket to `classifyISAccount` for account types containing `"other income"` (and account-name fallbacks like "interest income", "gain on …").
- Subtract it from `totalRevenue` and fold it into a new `otherIncomeNet` derived field; alternatively, simply exclude it from `totalRevenue` so the line matches what QB's P&L prints as Total Income.
- Mirror change for `classifyLikelyISAccount`.

### 2. Tighten the income-statement extraction prompt
Rewrite the `income_statement` branch of `extractTotalsViaAI` so the model:
- Distinguishes "Total Income" / "Total Revenue" (operating) from "Other Income".
- For Total Operating Expenses: if a single printed subtotal is ambiguous, SUM every detail row classified as an operating expense (exclude COGS, interest, depreciation, taxes, other expense) rather than trust one subtotal row. This matches what `classifyISAccount` does on the TB side.
- Always attempt Net Income: look for "Net Income", "Net Operating Income", "Net Earnings", or compute `Revenue − COGS − OpEx` if not explicitly present.
- Return a small `notes` array describing which rows were used (for debugging in logs).

### 3. Surface extraction provenance in the response
- Log (and include in the response under `derivedTotals.notes`) which TB account types contributed to OpEx and Revenue so we can diagnose future mismatches without re-deploying.
- Add a console log of the extracted rows the AI used, so the next variance is one log-lookup away.

### 4. Re-validate
- Auto-deploy the function.
- Re-run validation for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede` against the same P&L CSV.
- Expected: Revenue match (or <1% minor), OpEx <1% minor, Net Income now present and matching.

## Out of scope
- No UI changes; the validation results panel already renders whatever lineItems/summary we return.
- No schema/migration changes.
- BS validation path is untouched (it's at 100%).
