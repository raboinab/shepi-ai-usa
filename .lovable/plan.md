## What's happening

On your validation card:

- **Total Assets** match exactly ($2,893,672 = $2,893,672) → no variance, so the Uploaded/Variance cells render blank (that's working as designed for a perfect match — but it looks empty/confusing).
- **Total Liabilities** off by $1 → rounding, treated as match.
- **Total Equity** off by **$526,104 (+23.4%)** → flagged "significant."

Because Assets match and Liabilities match, the only way Equity can differ is if the TB-derived equity total is missing something. It is.

## Root cause

In `supabase/functions/validate-financial-statement/index.ts`, the `deriveTotalsFromTB` function (around lines 116–169) sums **only BS-type accounts** classified as equity (Retained Earnings, Common Stock, Owner's Equity, Distributions, etc.). It computes `netIncome = grossProfit - totalExpenses` on the same pass but **never adds it to `totalEquity`**.

A real balance sheet's equity = beginning retained earnings + **current-period net income** + other equity. The seller's uploaded BS includes the YTD earnings; ours doesn't. So:

```
$2,779,084 (uploaded equity)
− $2,252,980 (TB equity rows only)
= $526,104  ← exactly the YTD net income missing from the roll-up
```

That's why the "Trial Balance-derived: Not balanced" warning also fires — the same $526k gap means Assets ≠ Liabilities + Equity on our side.

## The fix

Two small, surgical changes to `supabase/functions/validate-financial-statement/index.ts`:

1. **Roll net income into TB equity** in `deriveTotalsFromTB`:
   - After computing `netIncome`, set `totalEquity = totalEquity + netIncome` before returning.
   - This matches GAAP period-end equity = book equity + YTD earnings closed to RE.

2. **Re-evaluate `tbIsBalanced`** with the corrected equity (already uses `derivedTotals.totalEquity`, so it'll auto-correct once #1 lands).

Expected result after fix on this deal:
- Total Equity: TB shows ~$2,779,084 → matches uploaded, variance ≈ $0.
- `tbIsBalanced` flips to true.
- Overall match score jumps from 67% → ~100%.
- The "Trial Balance / Chart of Accounts mapping issue" info alert disappears.

## Small UX cleanup (optional, same card)

In `FinancialStatementValidationCard.tsx`, when a line item is a perfect match the **Uploaded** and **Variance** cells render as empty/blank, which is what you saw on the Total Assets row and made the table look broken. Two options:

- **A. Leave as-is** — current behavior, blanks mean "no variance worth showing."
- **B. Always show Uploaded value**, and show "$0 (0.0%)" or a "—" in Variance for matches.

I'd recommend **B** — it makes the table self-explanatory at a glance. Let me know if you want this included.

## Files to change

- `supabase/functions/validate-financial-statement/index.ts` — add net income to TB equity in `deriveTotalsFromTB` (~2 lines).
- *(optional)* `src/components/wizard/shared/FinancialStatementValidationCard.tsx` — always render uploaded value + explicit "$0" variance for matches (~5 lines).

No DB migrations, no client logic changes beyond the optional UX tweak. After redeploy you can re-run the validation on the same uploaded CSV — no re-upload needed.

Want me to ship just the equity fix, or include the UX cleanup too?
