## Diagnosis

Verified against your project:
- `fiscal_year_end` is **NULL** (so my fallback assumed Dec-31 calendar year — correct here).
- TB spans **Jan-2023 → Dec-2025** (3 full years).
- My YTD logic picked `referenceEndKey = 2025-12` (latest TB period), so YTD = all of 2025 = ~$3.67M, which is what got rolled into equity (`$2,252,980 + $3,674,033 = $5,927,013`).
- But the seller's uploaded BS is "as-of" some earlier date where YTD net income = exactly $526,104.

So the equity rollup is correctly **computing** YTD net income — it's just YTD through the **wrong date**. We're using the TB's last available month instead of the uploaded BS's actual as-of date.

## The fix

Extract the **as-of date** from the uploaded balance sheet itself and use that as the YTD cutoff.

Changes in `supabase/functions/validate-financial-statement/index.ts`:

1. **Add `asOfDate` to the AI extraction prompt** for `balance_sheet`:
   ```
   { "totalAssets": ..., "totalLiabilities": ..., "totalEquity": ..., "asOfDate": "YYYY-MM-DD" }
   ```
   Look for "As of …", "Balance Sheet as of …", or the date in the column header.

2. **Add `asOfDate?: string` to `DerivedTotals`** (uploaded side only — extracted).

3. **In the handler**, after AI extraction, if `uploadedTotals.asOfDate` is present **and** caller did not pass `periodEnd`, set `effectivePeriodEnd = uploadedTotals.asOfDate` and **re-derive** `derivedTotals` with that date. This makes:
   - BS point-in-time read snap to as-of month (already supported by existing code).
   - YTD rollup window end at as-of month (matches uploaded book).

4. **Defensive fallback**: if `asOfDate` can't be extracted (older docs, weird formats), keep current behavior but add a visible note in the summary:
   > "Could not determine balance sheet as-of date — derived TB values use the latest TB period. Equity variance may reflect timing only."

5. **Optional UX**: surface `asOfDate` in the validation card description ("as of MM/DD/YYYY") so the user sees what we used.

## Expected on this deal

- AI extracts as-of date from "Sandbox Company_US_2_Balance Sheet.csv" header (likely 2024-12-31 or a 2025 mid-year date).
- YTD slice narrows to that period → ytdNetIncome ≈ $526,104.
- TB equity → $2,779,084. Variance → $0. Score → ~100%. `tbIsBalanced` → true.

## Files

- `supabase/functions/validate-financial-statement/index.ts` only.

No client, schema, or migration changes. Auto-redeploys; re-run validation on the existing upload.

Ship it?