## Root cause (confirmed from raw data)

Sampled the raw `processed_data` for project `621a6c9f…` and the 2026 GL export. QuickBooks GL DATA rows have **8 columns, no prepended account label** (the account name lives in the section header, not the row):

```
[Date, Type, Num, Name, Memo, Split, Amount(6), Balance(7)]
```

The parser at `supabase/functions/analyze-general-ledger/index.ts:151` adds `+1` to every column index ("prepended account label in DATA rows"). That's true for TrialBalance reports but **wrong for GeneralLedger sections**. Result:

- `amountColIdx = 7` — actually the running **Balance** column
- `balanceColIdx = 8` — out of bounds, returns `null` every row

Consequences visible in your screenshot:
- `balanceColIdx` invalid → `endingBalance` never set → falls through to `beginningBalance + netSum`
- `netSum` is the sum of the "amount" col, but that column is really the running balance → summing 2,020 running-balance snapshots for Wells Fargo produces the $975M we see (vs. the real $425K ending on 2026-05-31 that sits in col 7 of the very first DATA row).
- Same mechanism inflates Undeposited Funds ($870M vs $534K real), Inventory ($190M vs $635K), etc.
- Rows are **descending** in these exports (2026-05-31 first), and the "Beginning Balance" row is at the TOP with value $424,933.07 — that's actually the true ending running balance for the period, not the opener.

## Fix

Single file: `supabase/functions/analyze-general-ledger/index.ts`

1. **Drop the `+1` offset for GL sections.** Use the metadata column indices as-is (amount at 6, balance at 7). The offset was copy-pasta from TB parsing.
2. **Re-derive beginning vs. ending from row order.** After parsing DATA rows, sort transactions by `txnDate`:
   - `endingBalance` = balance column of the row with MAX `txnDate`
   - The "Beginning Balance" label row is order-dependent in QB — in descending exports it holds the period's ending running balance, in ascending exports it holds the opener. Ignore its label; trust chronological max.
3. **Prefer the `summary` row for net activity.** Each section's `summary.colData[6]` is QB's own "Total for <account>" net — use it directly instead of summing DATA rows (which is what's inflating things). `glBalance = beginningBalanceTrue + summaryNet` when balance col is empty; otherwise `glBalance = endingBalance`.
4. **Per-account merge across the 3 exports (2024, 2025, 2026 YTD)** stays as-is: winner for `glBalance` is the export with the latest `period_end`, activity sums across exports. This is already implemented correctly — only the per-section numbers were wrong.
5. **Log a per-section sanity line** (`beginning`, `endingByDate`, `summaryNet`, `chosenGlBalance`) so if a future export has a different shape we can see it in one glance.

No changes to the reconciliation/matching logic, UI, or downstream identity check — those will produce sensible numbers once the per-section balances are correct.

## Verify

After deploy:
- Re-run analysis on project `621a6c9f…`
- Expected: Wells Fargo ≈ $425K, Undeposited ≈ $534K, total assets in the low millions, identity check < $1M off.
- If still off, pull `[ANALYZE-GL]` logs from the sanity line and iterate.

## Out of scope

- The 20/120 match rate — separate matching issue (sub-account FQN normalization); tackle after the balances are trustworthy so we're not chasing two bugs at once.
- Rebuilding GL from `canonical_transactions` (fallback path stays).
