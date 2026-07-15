## Goal

Push GL reconciliation on project `621a6c9f…` from 68% toward >90% by fixing three confirmed code bugs in `supabase/functions/analyze-general-ledger/index.ts`. All fixes are generic and apply to every project.

## Fixes

### 1. Contra-revenue name-pattern classification (Pattern A)

Deleted contra-revenue accounts (`Shipping Income (deleted)`, `Discounts (deleted)`, `Returns (deleted)`, `Fees (deleted)`) have no COA match and no numeric prefix, so they fall through to `OTHER` and get routed through the (broken) `glBalanceLatest` path.

- Add a name-pattern classifier that runs after COA/group lookup fails:
  - `/shipping|discount|return|refund|fee|chargeback|sales?tax/i` on an account whose parent chain or sibling context is revenue-like → classify `REVENUE` (contra).
  - `/cogs|cost of goods|cost of sales|merchant fee|processing fee/i` → `EXPENSE`.
  - `/distribution|owner draw|contribution|member draw/i` → `EQUITY`.
- Once reclassified, these accounts use `activityNet` (summed across all exports), which matches how TB rolls them up.

### 2. Grouped-monthly GL balance detection (Pattern A, secondary)

When QuickBooks exports GL "grouped by month", the `Balance` column resets each month rather than being cumulative-since-inception. `glBalanceLatest` currently picks the max-transaction-date row, which in grouped mode is just December's activity, not YTD.

- Detect grouped mode per section: if the section contains multiple monthly subtotal rows or the `Balance` column is non-monotonic across the section, mark `isGroupedMonthly = true`.
- When `isGroupedMonthly`, ignore `Balance` entirely and derive both `snapshotBalance` and `activityNet` from summed `Amount` values.

### 3. Undeposited Funds double-count (Pattern B)

Sum across GL exports for `1001 Undeposited Funds` already matches TB (~$534K), but the report shows $1.07M — exactly 2×. The `num:` / `name:` merge is not catching this row.

- In child mode, after building the per-export map, run a final pass that folds any `name:` entry whose normalized leaf matches a `num:` entry's normalized name into the `num:` entry, then deletes the `name:` key. Currently the fold happens before all rows are collected in some section-recursion paths.
- In orchestrator reload, group scratch rows by `COALESCE(account_number, normName(account_name))` and sum within the group instead of treating `num:1001` and `name:undeposited funds` as separate rows.
- Add a `walkSections` guard: track visited `(sectionId, accountKey)` pairs and skip if already processed in this export to prevent recursion double-visits.

### 4. Inventory Asset "latest export" tiebreak (Pattern C)

`glBalanceLatest` picks per export by max transaction date, but across exports the "winner" is chosen by insertion order, not by period-end. Two exports covering overlapping horizons can flip which one wins.

- Track `periodEnd` per export (max transaction date across all sections in that export).
- Orchestrator selects the export with the greatest `periodEnd` for each BS account's snapshot, deterministically.

## Verification

After deploy, re-run **Analyze GL** on `621a6c9f…`. Expected:
- Deleted contra-revenue rows: GL magnitudes match TB within tolerance.
- Undeposited Funds: single row at ~$534K.
- Inventory Asset: single deterministic snapshot.
- Identity check tightens materially; overall reconciliation >90%.

If any row still misses, capture the new table and iterate narrowly on that row only — no further speculative rewrites.

## Technical notes

- All changes are inside `supabase/functions/analyze-general-ledger/index.ts` (both child and orchestrator modes). No schema changes to `gl_reconcile_accounts`.
- Memory footprint unchanged; the classifier and grouped-mode detector are O(rows) with no additional retained state.
- No frontend changes.
