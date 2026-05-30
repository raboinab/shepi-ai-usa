## Plan

Fix the P&L validation at the source: the uploaded Profit & Loss file contains monthly activity totals, while the Trial Balance IS rows are QuickBooks cumulative YTD balances. The current validator is summing those YTD snapshots, which overstates revenue/expenses across multi-month ranges.

### 1. Update Trial Balance derivation for Income Statements
- In `supabase/functions/validate-financial-statement/index.ts`, change the `income_statement` path so IS accounts are converted from cumulative YTD snapshots into period activity before summing.
- Keep Balance Sheet behavior intact: BS validation should still use point-in-time IS values for current-year income rollup.
- Respect fiscal year boundaries when calculating monthly deltas, defaulting to calendar year if no fiscal year end is stored.

### 2. Improve period handling
- Keep the extracted `periodStart` / `periodEnd` summary context, but do not let a full-file period like `2023-01-01 → 2025-12-31` cause YTD double-counting.
- Derive P&L totals over the selected/extracted range using monthly activity deltas.

### 3. Align COGS extraction/validation
- The uploaded P&L parser extracted COGS as `$7,255.78`, while the stored processed QuickBooks P&L has COGS summarized as `$0` for this dataset.
- Add more defensive handling around COGS so validation compares like-for-like and avoids treating account detail rows as COGS totals when the P&L report summary indicates none.

### 4. Validate against the reported project
- Deploy the updated `validate-financial-statement` edge function.
- Re-run validation for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede` / document `c25d4cb8-00e1-405e-a1a9-95c9921bc727`.
- Confirm the Trial Balance-derived P&L drops from the inflated `$18.4M` revenue to the uploaded `$2.7M` scale and that remaining variances represent real mapping/extraction issues, not period math.

No UI, schema, or migration changes are needed.