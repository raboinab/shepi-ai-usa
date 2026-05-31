## Plan

The remaining 91% result is not primarily a structural-classification problem. The logs show the GL parser is reading many P&L parent accounts as the **last transaction amount** instead of the full-period total:

```text
Design income GL=262.50 vs TB=-119,169.86
Services GL=103.55 vs TB=-85,784.95
Pest Control Services GL=70.00 vs TB=-179,716.11
Fountains and Garden Lighting GL=45.00 vs TB=-151,591.40
```

That happens because the parser’s “money column density” heuristic mistakes the numeric invoice/document number column for a money column, then treats the actual Amount column as a running Balance column. For GL rows that do not include a Balance value, this makes `glBalance` become the final transaction amount.

## Implementation steps

1. **Update `supabase/functions/analyze-general-ledger/index.ts`**
   - Read the QuickBooks GL report column metadata (`data.columns.column`) before parsing account sections.
   - Prefer explicit `ColKey` / title matching for `Amount` and `Balance` columns:
     - amount: `subt_nat_amount` or title `Amount`
     - balance: `rbal_nat_amount` or title `Balance`
   - Account section row `colData` includes the account label at index `0`, so report columns should map with a `+1` offset.
   - Only use the existing density heuristic as a fallback when metadata is missing.

2. **Make Balance detection safe**
   - If the mapped Balance column is absent from detail rows, treat it as unavailable instead of using Amount as Balance.
   - Derive `glBalance` from `beginningBalance + netSum` for those accounts.

3. **Keep the existing structural variance logic intact**
   - The current parent/rollup and cross-namespace structural checks can remain, but after GL balances are summed correctly, the five remaining P&L rows should become sign-normalized matches instead of material variances.
   - Avoid further loosening structural classification so real variances are not hidden.

4. **Validate with the reported project**
   - Deploy/re-run `analyze-general-ledger` for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`.
   - Confirm logs show these accounts using full-period GL totals, not final transaction amounts.
   - Confirm material variances drop and reconciliation rises from 91% toward the expected high-90s.

## Expected result

- The five listed material variances should reconcile or stop appearing as material variances.
- `Structural differences` should no longer need to absorb rows caused by parser error.
- Reconciliation score should increase substantially without masking actual GL/TB mismatches.