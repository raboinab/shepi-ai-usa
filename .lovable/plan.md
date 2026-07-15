## Why I want to diagnose before coding

We've done four rounds of reconciliation fixes and moved from 25% → 68%. The remaining variance no longer looks like a single class of bug. Reading the current table, the residuals split into three distinct patterns that need different fixes — and one of them (period coverage) can't be fixed in code at all. Another blind round risks regressing the 68% we have.

## What the current numbers actually say

**Pattern A — "(deleted)" contra-revenue rows are ~10× off, not sign-flipped**
- Shipping Income (deleted): GL $55K vs TB $574K
- Discounts (deleted): GL $47K vs TB $444K
- Returns (deleted): GL $14K vs TB $182K
- Shopify Fee (deleted): GL $11K vs TB $111K
- PayPal Fee (deleted): GL $4.5K vs TB $55K

The ~10× ratio across a whole family is a coverage/period signature, not a sign or dedupe signature. These accounts were archived mid-history; if some GL exports covering their live period aren't being ingested (or are ingested but their rows aren't routed to the `(deleted)` key that TB uses), the GL side structurally undershoots by the missing periods.

**Pattern B — Undeposited Funds still doubles ($1.07M vs $534K)**
Code already prefers `num:` over `name:` in both child write and orchestrator reload. Still doubling means the two representations aren't landing under keys the merge step recognizes as the same account. Likely the `num:` prefix isn't extracted for some export rows, so both scratch rows are `name:`-keyed under slightly different normalized leaves.

**Pattern C — Inventory Asset $354K vs $635K (BS)**
BS uses `glBalanceLatest`. Different exports disagree on which is "latest" — probably ordered by filename or ingest time rather than actual period-end date.

## Proposed diagnostic (read-only, no code changes)

Query `gl_reconcile_accounts` for project `621a6c9f…` and answer three questions:

1. For `Shipping Income (deleted)`, `Discounts (deleted)`, `Returns (deleted)`: which `export_id` rows have non-zero contributions, and does the sum of those exports' periods cover the full TB horizon (Jan-23 → present)?
2. For Undeposited Funds: how many distinct scratch rows exist, what are their `account_key` values, and why isn't the orchestrator reload folding them together?
3. For Inventory Asset: what `glBalanceLatest` did each export contribute, and which export won the "latest" tiebreak?

## Then, targeted fixes only for what the data shows

- If Pattern A is a coverage gap → surface it as a UI warning ("GL covers X of Y months; N accounts under-reported") rather than pretending to reconcile. This is honest and correct.
- If Pattern A is a keying miss on the deleted-name variant → tighten normalization for the specific TB↔GL pair.
- If Pattern B is a `num:` extraction miss → widen the numeric-prefix regex in the child parser.
- If Pattern C is an ordering bug → order exports by TB period-end date (or embedded QB header date), not filename.

## Out of scope

No further reconciliation code changes until the scratch table has been inspected. No frontend changes. No schema changes.

## Deliverable of this step

A short written diagnosis stating, per pattern, whether it's a code bug (with the specific fix) or a data coverage limitation (with the specific UI disclosure to add). Then I'll come back with a narrow follow-up plan for just those fixes.
