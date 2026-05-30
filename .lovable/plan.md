
## What's actually wrong

I queried the data for this project. The "8% reconciled / A−L−E−NI off by $14.5M" output isn't because the books are bad — it's because `supabase/functions/analyze-general-ledger/index.ts` has four bugs that compound. Fixing them turns this from a noisy red card into a real reconciliation.

### Bug 1 — TB comparison uses only the LAST monthly report

```ts
const lastReport = monthly[monthly.length - 1];   // ← only December
```

The GL side sums `amount_signed` across **all** canonical transactions (full YTD: 18,148 rows) and ends up holding cumulative YTD balances. The TB side then pulls just the December monthly report. So every non-trivial account is "in variance" because we're comparing YTD-to-date against one month of activity. That's why matched is 7/85 — only accounts that happened to have minimal activity outside December "match".

**Fix:** For balance-sheet accounts use the cumulative ending balance through the latest period (sum debits/credits across all monthly reports per account, or pick the QuickBooks report whose `header.endPeriod === periodEnd`); for income/expense accounts use the YTD sum. Use a single per-account cumulative balance map keyed off the FY-end, not just the last month's slice.

### Bug 2 — Accounting identity ignores REVENUE

```ts
case "INCOME": sumIncome += a.glBalance; break;
```

The COA classification used by QuickBooks (and by the breakdown the UI already renders) is **`REVENUE`**, not `INCOME`. All 16 revenue accounts fall through the switch and contribute zero. Combined with `Math.abs(sumIncome) - Math.abs(sumExpense)`, net income becomes pure `-Expense` (≈ −$3.3M) and the identity check is off by $14.5M.

**Fix:** Accept both `REVENUE` and `INCOME` (and `COST_OF_GOODS_SOLD` → expense bucket). Compute net income with signed values, then handle the convention that revenues sum to a credit (negative signed) or debit (positive signed) consistently — don't blindly `Math.abs` after the fact. Add a normalization step that detects the sign convention from the dataset (whether revenues are stored positive or negative in `amount_signed`) and applies it uniformly.

### Bug 3 — Parent + leaf accounts are double-counted

Largest Accounts shows both `Savings:Savings` ($7.4M) **and** `Savings` ($2.3M); same for `Checking`. The GL has rollup parent rows and detail leaf rows; the aggregator keys by lowercase fully-qualified name so it treats them as separate accounts, inflating Assets.

**Fix:** Dedupe by detecting parent-rollup rows. Two safe heuristics: (a) if an account name `X` is a strict prefix of another account `X:Y` with non-zero activity, treat `X` as the rollup and exclude it from the identity sum; (b) prefer COA-leaf matching (`coaByLeaf`) and skip accounts whose normalized name appears as the leaf of multiple distinct fully-qualified COA entries.

### Bug 4 — Round-number plug flags on loan principals

`Notes Payable: 100000` and `Loan Payable: 16000` get flagged as possible plug entries, but loan principals are *expected* to be round numbers and they're already classified as LIABILITY. The current check only excludes `ASSET`.

**Fix:** Exclude LIABILITY accounts (and accounts whose name matches `/loan|note|mortgage|line of credit/i`) from the round-number-plug flag. Keep it focused on revenue/expense accounts where round numbers actually suggest manual journal plugs.

### Bonus polish (cheap)

- Reduce `reconciliationSummary.variances` denominator noise: drop accounts where both GL and TB are < $50 from "variance" → label "immaterial" instead, so the score reflects real disagreements.
- When `periodStart === periodEnd` (every txn dated 12/31, like this project), don't render the period range as "2025-12-31 – 2025-12-31" — show "FY ending 2025-12-31" instead in `GeneralLedgerInsightsCard.tsx`.

## Files

- `supabase/functions/analyze-general-ledger/index.ts` — all four logic fixes
- `src/components/wizard/sections/GeneralLedgerInsightsCard.tsx` — period-label cosmetic only

## Expected result on this project

After the fix, on the same data:
- Matched accounts jumps from 7/85 to roughly the high-70s/85 (most accounts will reconcile once GL YTD is compared against the YTD-cumulative TB).
- Identity check moves from "$14.5M off" to within a few thousand dollars (assuming the data is actually clean).
- Largest Accounts no longer shows duplicate Savings/Checking rows.
- Flags list drops the two loan-principal false positives.

No edge-function secret changes, no DB migrations, no ingestion changes (the all-on-12/31 txn dates are an upstream issue but not the cause of the bad reconciliation here).
