## Why 66% is where we're stuck

The last round of fixes shipped, but three of the four intended behaviors don't produce the expected result on real data. Root causes, one per stuck symptom:

### 1. Contra-revenue signs still opposite between GL and TB
`Discounts`, `Returns`, `Shipping Income (deleted)`, and the fee lines all have GL and TB signs pointing opposite ways. We added a `contraRevenueRe` path in the *identity equation* (line 1166) but the **reconciliation variance rows** (line 1041's flippedVariance) still compare raw `glBalance` vs `tbBalance` without a class-aware sign policy. On a QuickBooks TB, credits are negative and debits positive; on our GL activity_net we sum signed amounts directly. For contra-revenue that lives on the debit side in GL detail but is netted against revenue as a positive in TB, the two conventions disagree by construction. Fix: normalize signs at the reconciliation layer using COA classification + contra-account regex before computing variance, not just in the identity accumulator.

### 2. Undeposited Funds is still exactly 2× TB
The scratch reload (lines 218–223) *sums* duplicate keys (`num:1001` + `name:undeposited funds sales`) instead of picking one. Two representations of the same account get added together, producing the 2× reading. The `num:` and `name:` writes both happen when the export has a number-prefixed row and a name-only row. Fix: at scratch upsert time, emit only one canonical key per account per export (precedence: `num:<prefix>` when present, else `name:<leaf>`) and never both; and on reload, if both keys exist, prefer `num:` and drop `name:` for the same underlying account.

### 3. `(deleted)` and `z_` orphans not collapsing to their TB counterparts
`Wells Fargo Business Checking (7179) (deleted)` GL $423K sits opposite `1015 Wells Fargo Business Checking - 7179` TB $425K — clearly one account. `normName` strips `(deleted)` on the GL side but the TB side still carries the `1015 ` prefix and ` - 7179` suffix, so leaf keys don't match. Fix: apply the same normalization to TB names — strip leading account numbers, trailing ` - <digits>` register suffixes, and `(deleted)`/`z_` markers — before building `coaByLeaf` and before the orphan-collapse pass.

### 4. Distributions still off by ~$350K
`3100 Shareholder Distributions` GL −$759K vs TB $1.11M. Not just a sign issue — magnitudes differ. Two plausible causes: (a) the 2023 GL still isn't contributing equity activity because equity path uses `snapshot_balance` (BS-latest) but distributions in QB post as running debits to an equity account and TB may reflect a period-summed rollup; (b) `distributionRe` never fires because the account name is `3100 Shareholder Distributions` and the regex expects "Distribution" without the number prefix in some code path. Fix: for equity accounts specifically, prefer `activity_net` summed across all exports (like P&L) rather than the latest snapshot, and let sign fall out naturally. Verify the regex matches numbered names.

## Changes (all in `supabase/functions/analyze-general-ledger/index.ts`, still generic)

1. **Reconciliation-layer sign policy.** Before computing variance for each account, apply: revenues/contra-revenues → compare as `-signedGL` vs `signedTB` if credit-natural; assets → signed as-is; equity → signed as-is; expenses → signed as-is. Drop the ad-hoc `flippedVariance` heuristic in favor of a deterministic class + contra-regex table.

2. **Scratch write dedupe.** In the child parser, resolve one canonical key per account per export before the upsert loop; never write both `num:` and `name:` for the same account. In the orchestrator reload, when a canonical account has both keys, prefer `num:` and skip the `name:` row entirely (do not sum).

3. **TB-side name normalization.** Extend `normName` (or add a second pass) to also strip: leading `^\d{3,6}[\s\-:]+` account numbers, trailing ` - \d{3,}` register suffixes, `(deleted)`, `*`, `z_`/`zz_`. Rebuild `coaByLeaf` with these keys and rerun the orphan-collapse pass so GL-deleted variants match their numbered TB parent.

4. **Equity treatment.** Route equity accounts through the activity-summed path (same as P&L) instead of latest-snapshot, and remove any residual `Math.abs` on the equity contribution to the identity check. Confirm `distributionRe` fires on numbered names like `3100 Shareholder Distributions`.

5. **Identity block reporting.** Emit `sumRevenue`, `sumExpense`, `sumEquity` under the same signed convention used in the reconciliation table so users see consistent numbers on both views.

## Verification

- Redeploy, re-run **Analyze GL** on `621a6c9f…`.
- Expected: Undeposited Funds collapses to ~1× TB; `(deleted)` fee/discount/returns rows either match or drop out via TB-side normalization; Wells Fargo `(deleted)` orphan merges with `1015`; identity check within 1% of assets; reconciled % > 90%.
- Sanity check on `fa0768ca…` (small project) to confirm no regression.

## Out of scope

No schema changes, no frontend changes, no orchestrator/child architecture changes.