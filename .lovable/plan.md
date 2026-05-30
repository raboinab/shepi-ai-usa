# Fix GL detail parser column-detection bug in `analyze-general-ledger`

## Root cause (confirmed against live data, project `fa07…`, processed_data id `779284ae`)

The QuickBooks GL detail JSON has only **one money column per DATA row** (col 7 = Amount). There is no running balance column. But occasional non-money columns happen to contain a stray numeric string — e.g. a doc-num "1" — which the parser counts as a money column.

For "Decks and Patios" (23 DATA rows):

```
col  numeric_count   colsum
0    0               0          (account name)
1    0               0          (date)
2    0               0          (txn type)
3    1               1          ← stray "1" in doc-num field
4    0               0
5    0               0
6    0               0          (split account name)
7    23              13,036.85  ← real Amount column
```

The current detection at lines 130–153 sorts all columns that had ≥1 numeric value and picks the **second-from-last** as `amountColIdx` and the **last** as `balanceColIdx`. So it picks:

- `amountColIdx = 3` (1-of-23 hit rate, captures basically nothing)
- `balanceColIdx = 7` (the real amount column, **mis-classified as running balance**)

In the loop, `endingBalance` is overwritten on every row with col-7's value, so it ends up as the **last transaction's amount** (Decks: $103.55). The final preference rule at line 193 (`if balanceColIdx ≥ 0 && endingBalance ≠ 0 → glBalance = endingBalance`) then ships that single-transaction number as the account's GL balance.

This explains every variance in the log:

| Account | GL (now) | Real net sum of Amount col | TB |
|---|---|---|---|
| Decks and Patios | $103.55 | ~$13,037 | −$86,820 |
| Labor | $148,371 | (last txn) | −$69,018 |
| Office Expenses | $18 | (last txn) | $3,694 |
| Other Income | $331,583 | (last txn) | −$6,607 |

(GL-vs-TB sign and magnitude beyond this are a separate sandbox-data question; the parser bug is the dominant error.)

## Fix — `supabase/functions/analyze-general-ledger/index.ts`, lines 130–153

Require a money column to actually be **dense** before treating it as such. Concretely:

1. After building `moneyColFreq`, drop any column whose hit rate is below a threshold:
   ```
   minHits = max(3, ceil(sampled * 0.5))
   moneyIdxsSorted = [...moneyColFreq.entries()]
       .filter(([, n]) => n >= minHits)
       .map(([i]) => i)
       .sort((a, b) => a - b)
   ```
2. Keep the existing branching (`length ≥ 2` ⇒ amount + balance; `length === 1` ⇒ amount only; `0` ⇒ leave both -1, glBalance defaults to 0).
3. Additional safety on the "balance" branch: when `balanceColIdx` is selected, also require that the column be **monotonically related** to the amount column on the sample (i.e. actually behaves like a running balance). If not, downgrade to `balanceColIdx = -1` and treat the higher-index column as `amountColIdx`. This handles future QBO variants where some other dense numeric column appears.
4. Update the comment block at lines 130–133 to reflect the new heuristic.

No other functions or files need to change. The TB-side fix from the previous turn stays.

## Verification after deploy

Re-run analysis on the existing deal. Edge-function log should show:

- `[ANALYZE-GL] Parsed 76 accounts / 7691 txns` (unchanged).
- The per-variance log lines should show `gl=` values in the thousands or tens-of-thousands range for the previously-truncated leaf accounts (Decks, Plants and Soil, Sprinklers, Fuel, Office Expenses), not in the $10–$200 range.
- `matched=` count should jump materially above 1/76 — most P&L accounts will newly land within the existing match tolerance.
- Any GL-vs-TB residuals after this fix are real data variances (or sandbox quirks), not parser bugs.

## Out of scope

- TB ingestion (already fixed last turn).
- COA enrichment / classification (separate file; unaffected).
- The GL ingestion pipeline (`qbToJson` / CSV parser) that produced `processed_data.data` — we just consume what's already stored.
- Frontend display.
