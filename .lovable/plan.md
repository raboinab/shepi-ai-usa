## What the screenshot shows

Three problems, all in `supabase/functions/analyze-general-ledger/index.ts`:

### 1. Duplicated account rows (`Account` and `Account*`)

`1025 Fidelity Business Account`, `1999 Fidelity MM`, `Afterpay Sales`, `Faire Sales`, etc. each appear twice. The `*` is our own marker for "TB-inferred" rows. The duplicates come from **key collisions**: the same real account gets two entries in `acctMap` because we key on `id:${acctId}` when the GL export carries an id and `name:${acctName.toLowerCase()}` when it doesn't. When one export has the id and another doesn't (or COA-injected rows use a different key), the account splits into two independent rows and both survive into reconciliation.

**Fix**: after the parse loop, collapse `acctMap` by normalized-name (leaf + parent path). When a name collision has one entry with `acctId` and one without, merge into the id-keyed one; sum `glActivity`/`txnCount`, pick the latest-`period_end` for `glBalance`.

### 2. Revenue/expense accounts show enormous variances (`z_Shopify Sales` GL $448k vs TB −$17.7M)

For P&L accounts we currently use `mergedGlBalance = isLatest ? glBalance : prev.glBalance` — the latest GL export wins. But you have three GL exports (2024, 2025, 2026 YTD) and each one is a **year's activity**. Latest = 2026 YTD only ≈ $448K. TB side sums each calendar year's YTD-final ≈ $17M lifetime. Of course they don't match.

**Fix**: for P&L classifications (REVENUE/INCOME/EXPENSE/COGS/OTHER_INCOME/OTHER_EXPENSE) **sum `glBalance` across exports** instead of taking the latest — matches TB's `yearSumBalance` behavior. Balance-sheet classes keep latest-wins snapshot. Classification isn't always known at parse time (COA might be missing an account) — apply the merge rule after classification is resolved.

### 3. Identity check double-counts equity

`Owner's Pay & Personal Expenses -$1,360,373` (a distribution / draw) and `Retained Earnings -$4,362,905` are both `Math.abs()`'d into `sumEquity`, so distributions inflate equity instead of offsetting it. Combined with revenue being wildly under-counted per issue #2, the identity check reports a $146K miss that isn't a real data problem — it's arithmetic.

**Fix**: sum equity **signed**, not `abs`. Same for liabilities and net income — the sign-convention normalization needs to happen per-account (based on whether QB is exporting debit-positive or true-signed for that class), not by blanket `Math.abs`. Concretely:
- Assets: keep current logic (abs, minus contra-assets).
- Liabilities: `sumLiab += Math.abs(v)` stays — QB GL parent totals are debit-positive magnitudes.
- Equity: split into "capital-like" (retained earnings, capital stock, opening balance = credit-natural positive) vs "distribution-like" (owner's pay, shareholder distributions, member draw = debits reducing equity). Use signed sum with distributions subtracting.
- Revenue/Expense: unchanged (abs works after fix #2 restores real magnitudes).

## Verify

After redeploy, re-run analysis on `621a6c9f…` and expect:
- No `*` duplicates in the reconciliation table.
- `z_Shopify Sales` GL summed across exports lands within a few % of TB $17.7M.
- Identity check well inside tolerance (equity properly nets distributions against retained earnings).
- Reconciliation rate rises materially from 37% once revenue/expense stop showing as false variances.

## Out of scope

- The `*` UI treatment itself stays (it's still meaningful for genuine tb_inferred BS backfills — just shouldn't be producing a second row for the same account).
- No changes to matching heuristics, TB parsing, UI, or downstream identity check display beyond the numbers it consumes.

Single file touched: `supabase/functions/analyze-general-ledger/index.ts`.
