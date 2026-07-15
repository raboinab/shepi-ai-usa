## Goal

Close (or explain) the remaining 7% reconciliation gap on project `621a6c9f…` without special-casing this company. The 93% run is the baseline; the 7% is a mix of accounts we haven't yet inspected line-by-line. We need to see them clearly, categorize each cause, and fix the ones that are code/parser bugs vs. document them as true timing/scope differences.

## Why a deeper pass is needed

`gl_reconcile_accounts` (the scratch table) stores per-account GL snapshots and activity but does not persist the TB side of the reconciliation, so we currently can't query "which accounts still vary and by how much" without re-running the analyzer. Every investigation right now requires re-running the edge function and re-reading its JSON output. That's why the remaining variances are opaque.

## Plan

### 1. Persist the reconciliation result

Extend `gl_reconcile_accounts` (or add a sibling `gl_reconcile_results` table) so each run writes, per account:

- `tb_balance`
- `gl_balance` (final selected value: snapshot for BS, activity for P&L)
- `variance`
- `reconciled` (bool, with threshold)
- `reason_code` when unreconciled (see step 3)
- `source_export_ids` array

This gives us a queryable audit trail across runs and companies, not just this one.

### 2. Add a variance breakdown view in the UI

On the GL Analysis card, add an expandable "Unreconciled accounts" section listing every account with a variance above the tolerance, sorted by absolute variance. For each row show TB, GL, variance, classification, reason code, and the exports that contributed. This is what will make the remaining 7% visible without SQL.

### 3. Categorize each residual variance with a `reason_code`

In `analyze-general-ledger`, when an account fails to reconcile, tag it with one of:

- `MISSING_GL_COVERAGE` — TB period extends beyond any GL export
- `TB_ONLY_ACCOUNT` — account exists in TB, no matching GL section
- `GL_ONLY_ACCOUNT` — GL section exists, no TB row
- `SIGN_MISMATCH_UNRESOLVED` — magnitudes match after sign flip attempts fail
- `SNAPSHOT_DATE_MISMATCH` — BS snapshot date ≠ TB as-of date
- `SUMMARY_ROW_MISSING` — no section summary, row sum used, and it disagrees
- `CLASSIFICATION_AMBIGUOUS` — matched both BS and P&L logic paths
- `RESIDUAL_LT_1PCT` — variance below materiality
- `UNKNOWN` — fallback

Only `MISSING_GL_COVERAGE`, `TB_ONLY_ACCOUNT`, and `RESIDUAL_LT_1PCT` are acceptable. The rest are code bugs to be fixed in the same pass.

### 4. Investigate and fix the top residual buckets

Re-run analysis, then for each account bucket:

- **`SNAPSHOT_DATE_MISMATCH`** — likely from BS accounts where the latest GL export ends before the TB "as-of" date. Fix by carrying forward the last snapshot + any subsequent activity from any partial export.
- **`SUMMARY_ROW_MISSING`** — QuickBooks sometimes omits section summaries when a section has zero net activity. Fall back to `beginningBalance` for BS and `0` for P&L instead of `netSum` (which can double-count reversals).
- **`CLASSIFICATION_AMBIGUOUS`** — an account whose COA type says BS but name matches P&L pattern (or vice versa). Make COA classification win over name inference; name inference is only fallback.
- **`GL_ONLY_ACCOUNT`** — usually merged/renamed accounts. Add a normalized-name fuzzy match against TB before flagging.
- **`SIGN_MISMATCH_UNRESOLVED`** — inspect and, if generic, add the missing sign rule (e.g. contra-equity, contra-asset with `*` marker).

Do this narrowly: only fix a bucket if the root cause is generic. Do not hardcode account names.

### 5. Report and threshold

After fixes:

- Re-run GL analysis for `621a6c9f…` and target ≥97% reconciled.
- Remaining variances must all be `MISSING_GL_COVERAGE`, `TB_ONLY_ACCOUNT`, or `RESIDUAL_LT_1PCT`.
- Surface those three categories in the UI as "explained gaps" instead of counting them against the reconciliation score.

## Technical details

- Migration: add columns to `gl_reconcile_accounts` (`tb_balance numeric`, `variance numeric`, `reconciled boolean`, `reason_code text`, `source_export_ids uuid[]`) with the required GRANTs already on the table.
- Edge function: `supabase/functions/analyze-general-ledger/index.ts` — in the final merge step where TB is joined against per-account aggregates, write the reconciliation row for every account (currently only in-memory) and assign `reason_code`.
- UI: extend `src/components/wizard/sections/GeneralLedgerInsightsCard.tsx` with an accordion listing unreconciled accounts + reason codes; add a "why isn't this 100%?" explainer for the three accepted reason codes.
- Materiality threshold: reuse the existing reconciliation tolerance; add a `RESIDUAL_LT_1PCT` bucket for anything below 1% of account magnitude AND below $500 absolute.

## What this plan is not

- Not project-specific — no hardcoded account names or IDs for `621a6c9f…`.
- Not a redesign of the analyzer — the orchestrator/child architecture and existing snapshot/activity logic stay.
- Not a change to what counts as "reconciled" — only a change to how we categorize and explain what doesn't reconcile.
