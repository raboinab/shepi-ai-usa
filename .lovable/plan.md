## What went wrong

My previous fix made it worse. TB equity jumped from $2,252,980 → $16,039,005 (gap is now -$13.3M, was +$526k).

Root cause: `deriveTotalsFromTrialBalance` sums IS account values across **every period key in `monthlyValues`** when `periodStart`/`periodEnd` aren't passed (line 134 → `getPeriodKeysInRange`). That produces **multi-year accumulated net income** (~$13.8M across all months in the TB), not the current-year YTD figure.

I then added that whole number on top of equity. But the TB's Retained Earnings row at period-end already contains all prior closed years' earnings. So I double-counted every prior year and then some.

The original $526,104 gap was exactly **current fiscal-year YTD net income** — the uploaded seller's BS shows period-end equity = RE-closed-through-prior-FY + YTD earnings, while TB equity rows alone only reflect RE-closed-through-prior-FY.

## The right fix

Roll in **only current-fiscal-year YTD net income**, not all-history net income.

Steps in `supabase/functions/validate-financial-statement/index.ts`:

1. **Pass fiscal year context into `deriveTotalsFromTrialBalance`.** The handler already loads `project.fiscal_year_end` (need to add to the select on line 365) and has `effectivePeriodEnd`. Pass both into the deriver.

2. **Compute YTD start.** Given `fiscal_year_end` (e.g. "12-31") and `effectivePeriodEnd` (or latest TB month if missing), compute the first month of the current open fiscal year. Fallback: if no `fiscal_year_end`, use Jan 1 of the year of the latest TB period.

3. **Compute `ytdNetIncome` separately** by re-running the IS aggregation restricted to keys between YTD-start and periodEnd. Leave the existing `netIncome` (full-range) alone for the IS validation path — it's needed there.

4. **Roll only `ytdNetIncome` into equity**:
   ```ts
   const totalEquityWithYTD = totalEquity + ytdNetIncome;
   return { ..., totalEquity: totalEquityWithYTD, netIncome /* unchanged */ };
   ```

5. **Cap protection**: if `Math.abs(ytdNetIncome) > Math.abs(totalRevenue)` for the YTD slice, log a warning and skip the rollup — defensive against bad classification.

## Expected result on this deal

- YTD slice (likely Jan–latest 2024 or 2025) → netIncome ≈ $526,104.
- TB equity: $2,252,980 + $526,104 = $2,779,084 → matches uploaded.
- Variance → $0, `tbIsBalanced` → true, score → ~100%.

## Files

- `supabase/functions/validate-financial-statement/index.ts` only.
  - Add `fiscal_year_end` to project select.
  - Add `computeYtdRange(fiscalYearEnd, periodEnd, availableKeys)` helper.
  - Add `sumIsForKeyRange(accounts, keys)` helper (or parameterize the existing loop).
  - Replace the unconditional `totalEquity + netIncome` with YTD-only rollup.

No client, schema, or migration changes. Auto-redeploys; re-run validation on the existing upload — no re-upload needed.

Want me to ship it?