## Goal

Push GL reconciliation on `621a6c9f…` from 66% toward >90% by fixing three related bugs in `supabase/functions/analyze-general-ledger/index.ts`. All fixes are generic — they apply to any project.

## Observations from the current report

- Assets $2.57M, Liab $155K, Equity −$2.12M, NI $7.54M → identity off by −$3.0M. Net income at $7.5M against Assets of $2.5M is implausible and drives most of the gap.
- Largest revenue line `z_Shopify Sales` = $17.7M and `T‑Shirt Sales` = $4.3M — inflated vs anything TB shows.
- Material variances are dominated by revenue-contra / clearing accounts with opposite signs on GL vs TB:
  - `Shipping Income (deleted)` GL $55K vs TB −$575K
  - `Discounts (deleted)` GL −$47K vs TB $444K
  - `Returns (deleted)` GL −$14K vs TB $183K
  - `Undeposited Funds (Sales)` GL $1.07M vs TB $534K (exact 2×) → aggregation double-count.
- `Shareholder Distributions` GL −$759K vs TB $1.11M — sign convention mismatch survives the distribution regex path.
- Orphans: `PayPal Hold`, `Shop Pay Sales`, `Wells Fargo Business Checking (7179)` in GL but not TB; `Capital Stock −$1,000` in TB but not GL.

## Fixes in `supabase/functions/analyze-general-ledger/index.ts`

### 1. Revenue / expense sign convention (biggest lever)

Replace `Math.abs(v)` inside the identity accumulator with a signed rule keyed off the *sign majority* of P&L accounts, not per-account absolute value:

- Compute `sumRevenueSigned` and `sumExpenseSigned` from `glActivityNet` (already signed) instead of `glBalance` after abs-collapsing.
- If revenues are credit-natural (sum ≤ 0), take `revenue = -sumRevenueSigned`; if debit-natural (sum > 0), take `revenue = sumRevenueSigned`. Same rule per-account for expenses (contra-revenue like Discounts/Returns should net *against* revenue, not be summed as positive magnitudes into Revenue).
- Recognize revenue contra accounts (`Discounts`, `Returns`, `Refund*`) and subtract them from revenue instead of treating them as positive revenue. That alone flips ~$1M of the variance table.

### 2. Aggregation double‑count on clearing / undeposited accounts

Undeposited Funds landing at exactly 2× TB means the same account is being upserted under two scratch keys across exports (once by `num:1001` and once by `name:undeposited funds sales`) and then both rows are loaded back into `acctMap` in the orchestrator's scratch reload.

- In the scratch upsert path, resolve to a *single canonical key per export* using this precedence: `num:<prefix>` → else `name:<normName>`. Never emit both.
- In the orchestrator scratch reload, dedupe by `(account_number || normName)` after fetch, summing `activity_*` and picking `snapshot_balance` from the row with the latest `snapshot_period`.

### 3. Orphan collapse: `(deleted)` variants and `z_` prefixes

`z_Shopify Sales` in GL vs `Shopify Sales` in TB, and `Foo (deleted)` on both sides, should reconcile as one account.

- Extend `normName` used only for matching (not for display) to strip:
  - trailing ` (deleted)` / `*` markers
  - leading `z_` / `zz_` archival prefixes
  - QBO auto-suffix ` - <CompanyName>` when a company_info company_name is available.
- Re-run leaf matching with this normalized key before falling back to `missing_in_tb` / `missing_in_gl`.

### 4. Distributions sign

`3100 Shareholder Distributions` GL −$759K, TB $1.11M. The current `distributionRe` applies `-Math.abs(v)` which loses the sign entirely.

- For EQUITY accounts, use signed `glBalanceLatest` directly (BS snapshot). Do not apply `Math.abs`. Distributions naturally carry a debit (negative) balance under credit-natural equity, which is already the correct contribution.

### 5. Report the identity components on the same basis

- Show `sumRevenue`/`sumExpense` in the identity block using the signed convention above so users see a coherent A − L − E − NI decomposition rather than absolute-value sums.

## Verification

- Redeploy `analyze-general-ledger`, click **Re‑run analysis** on `621a6c9f…`.
- Expected: Reconciled % rises materially (target > 90%); `z_Shopify Sales`, `T‑Shirt Sales`, `Shipping Income`, `Discounts`, `Returns` variances collapse; identity check within tolerance; `Undeposited Funds` matches TB.
- Spot-check the small project `fa0768ca…` to confirm no regression.

## Out of scope

No schema change, no frontend change, no change to the orchestrator/child memory architecture (that fix stays).
