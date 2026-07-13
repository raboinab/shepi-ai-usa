## What I think is happening

The COA mapping is much better now: the cached trial balance has 183 accounts, 151 matched to COA, with Revenue/COGS/Expense accounts populated. The remaining mismatch is mainly because the validation logic is not correctly including the 2026 stub-period keys.

Key signal: this project stores 2026 months as `stub-2026-01` through `stub-2026-05`, while the P&L document period is `2023-01-01` to `2026-05-31`. The validator compares period keys lexicographically against `YYYY-MM`, so keys like `stub-2026-05` do not pass the `<= 2026-05` filter. That means the uploaded P&L includes Jan-May 2026, but the TB-derived validation is mostly excluding those months.

There is also a diagnostics issue: the uploaded P&L labels include account numbers (`5000 COGS-Shopify`), while the TB display labels often omit those numbers (`COGS-Shopify`). The actual TB account exists, but the missing-account detector only matches normalized names, not account numbers plus names, so it falsely reports many accounts as “not found.”

## Plan

1. **Fix period filtering for stub months**
   - Add a helper in `validate-financial-statement` that converts any period key to a comparable month key:
     - `2025-12` -> `2025-12`
     - `stub-2026-05` -> `2026-05`
   - Use that helper anywhere validation filters or sorts monthly values by `periodStart` / `periodEnd`.
   - This should pull Jan-May 2026 into the TB totals for this project.

2. **Fix YTD conversion for mixed regular + stub periods**
   - Update the income-statement YTD-to-monthly conversion so it sorts by normalized month key, not raw key string.
   - This prevents stub keys from being ordered after all regular keys and producing incorrect deltas.

3. **Fix missing-account diagnostics**
   - Improve `computeMissingAccounts` so it recognizes uploaded labels with account numbers when the TB account exists without the prefix.
   - Add matching by:
     - stripped leading account number
     - TB `accountNumber + accountName`
     - TB full path segments after stripping leading numbers
   - The “missing” list should then only show truly absent P&L lines, not mapped accounts with different display labels.

4. **Re-run validation for the VampireFreaks P&L**
   - Redeploy `validate-financial-statement`.
   - Re-run the validation for `VampireFreaks_Profit and Loss (4).xlsx`.
   - Check whether Revenue, COGS, Gross Profit, OpEx, NOI, and Net Income converge materially.

5. **If a residual variance remains, inspect real accounting causes**
   - After the period-key bug is fixed, compare remaining variances line-by-line.
   - Likely remaining explanations include TB-only below-the-line accounts, deleted/parent accounts, or uploaded P&L presentation choices.
   - Do not hide those as matches; show them as true reconciliation differences.

## Expected outcome

- The 0% match should improve significantly because the TB side will include Jan-May 2026.
- The false “20 uploaded line items not found in TB” list should shrink dramatically.
- Any remaining mismatch should reflect actual accounting/presentation differences, not a software period-filtering bug.