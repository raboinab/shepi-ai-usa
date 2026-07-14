## What the new numbers tell us

Reconciliation went from 36% → 32%, and the pattern changed shape:

- **Revenue is now positive in GL, negative in TB.** `TikTok Sales` $5.16M GL vs -$79K TB; `z_Shopify Sales` $1.53M GL vs -$17.7M TB; `T-Shirt Sales` $389K GL vs -$4.34M TB. That's two independent problems on the same rows: a **sign flip** and a **magnitude miss**.
- **Some P&L accounts now match sign but not magnitude** (`Shopify Discounts` $1.90M vs $1.40M — same sign, ~35% off). So sign handling isn't uniformly wrong — it depends on how the section was parsed.
- **Identity check blew out to -$10.9M** with Net Income at +$15.3M. Net income is being computed from the same sign-flipped revenue, so equity ends up understated by roughly the revenue error.
- **`6105 Rent & Lease` and `6140 Phone/Internet` are classified REVENUE.** Those are expenses. Classification is leaking on numeric-prefixed accounts.

The last edit switched P&L from `snapshotBalance` to `activityNet` (Σ of `subt_nat_amount` per DATA row). QB's `subt_nat_amount` is signed by natural side — revenue credits come through negative. If we're getting positive totals, either we're reading the wrong column, or we're `abs()`-ing somewhere, or we're picking up the summary row's `sum_amount` with the opposite convention. I don't want to guess again.

## Plan

### Step 1 — One diagnostic pass, no logic changes

In `supabase/functions/analyze-general-ledger/index.ts`, expand the existing per-account log line to emit, for every section:

- `acctName`, `acctType` / `detailType` from the parent header (raw QB metadata)
- `amountColIdx`, `balanceColIdx` actually used
- `firstRowAmount`, `lastRowAmount` (raw values, unsigned)
- `summaryAmount` (raw `sum_amount` from QB's "Total for …" summary row)
- `summaryNet` we computed
- `rowNetSum` we computed
- `snapshotBalance`, `activityNet`, and which one the selector picked
- `classification` after inference

Then re-run analysis on `621a6c9f…` and read the log lines for six canary accounts:

- `TikTok Sales`, `z_Shopify Sales`, `T-Shirt Sales` (sign-flipped + short)
- `Shopify Discounts` (right sign, wrong magnitude)
- `6105 Rent & Lease` (misclassified as REVENUE)
- `1015 Wells Fargo … 7179` (control — ties)

That tells us in one read whether the sign flip is (a) wrong column, (b) `abs()` in the selector, (c) QB's summary row using a different sign convention than the DATA rows, or (d) all three.

### Step 2 — Targeted fix based on the log

Anticipated, but final shape depends on Step 1:

1. **Trust QB's summary row for P&L**, not row re-sums. `sum_amount` on the "Total for <account>" row is authoritative for the visible section. If sign disagrees with DATA-row sums, the summary row wins and we log the delta.
2. **Sign convention keyed off QB metadata, not the name.** Use `acctType` / `detailType` from the section header (`Income`, `CostOfGoodsSold`, `Expense`, `OtherIncome`, `OtherExpense`) to decide the natural side, and normalize the whole section to that side after parsing.
3. **Numeric-prefix classification.** `6105 Rent & Lease` is being pulled to REVENUE by the leaf-name fallback. Add: if QB metadata gives `acctType`, that always beats name inference. Only fall back to name/number inference when metadata is missing.
4. **Confirm dedup runs before selector.** The 2024/2025/2026 exports use different `acctId`s for the same revenue accounts. If dedup fires after the P&L balance is chosen, the sum is on the wrong (unmerged) row. Verify ordering; fix if needed.

### Step 3 — Verify

Re-run on `621a6c9f…`. Success criteria:

- `z_Shopify Sales` within ~5% of TB's -$17.7M **with correct sign**.
- `6105 Rent & Lease` classified EXPENSE.
- Identity check inside `max($1K, 1% of assets)`.
- Reconciliation rate materially above 36%.
- No revenue row with a sign-flipped variance.

## Out of scope

- No UI changes.
- No TB parsing changes.
- One file: `supabase/functions/analyze-general-ledger/index.ts`.
- No project-specific hardcoding — everything keys off QB metadata or generic classification rules.
