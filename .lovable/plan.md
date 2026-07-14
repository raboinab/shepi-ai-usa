## Why numbers still don't tie

The prior fixes (dedup, `glBalanceSum`, distribution offset) shipped, but the reconciliation table still shows:

- **Revenue GL << TB** — `z_Shopify Sales` $399K vs TB $17.7M; `T-Shirt Sales` -$24K vs TB -$4.3M; `Shopify COGS` $259K vs TB $10M. This is a ~40× miss, not a rounding issue.
- **Sign convention drifts row-to-row** — some revenue accounts land positive in GL and negative in TB, others match sign. That points to column detection picking Balance vs Amount differently per section.
- **Identity check off $1.4M** — most likely a downstream effect of #1: understated revenue → understated net income → equation doesn't close.

I don't want to make another blind edit. I want one round of instrumented diagnostics first, then a targeted fix.

## Plan

### Step 1 — Read real per-account numbers (no code changes)
Pull recent `[ANALYZE-GL]` log lines for project `621a6c9f…` from the edge function logs and pick 3 canary accounts:

- `z_Shopify Sales` (huge under-count)
- `T-Shirt Sales` (sign-flip + under-count)
- `1015 Wells Fargo Business Checking - 7179` (currently ties, use as control)

For each canary log the current run emits per GL export: `begin`, `end(date)`, `sumNet`, `rowNet`, `→ gl`. That tells us in one glance whether:
- column detection picked the wrong column (rowNet ≠ summaryNet by orders of magnitude),
- multi-export sum isn't happening (only one export logged for a P&L account),
- or QB is emitting revenue in one export with a different sign convention.

### Step 2 — Fix based on evidence, in `supabase/functions/analyze-general-ledger/index.ts`

Anticipated fixes (finalized after Step 1):

- **Prefer `beginning + summaryNet` over running-balance for P&L classes.** For P&L accounts the running balance restarts at 0 each report, but if QB's report is a subset (e.g. a filtered range) the endingBalance is only the visible slice. `summary.colData[amountColIdx]` is authoritative net for the whole section. Change the preference to: `summaryNet` first for P&L, `endingBalance` first for BS.
- **Sign normalization per section, not per row.** After the section is parsed, detect the natural side from the QB `type`/`detail_type` in the parent header and, if the section's sign contradicts (e.g. Income section with positive summary), flip the whole section's contribution. Removes the row-by-row sign drift.
- **Verify multi-export merge for P&L keys** — if two exports use different `acctId` presence, the pre-existing dedup pass must run before `glBalanceSum` selection. Confirm order and add a targeted log.

### Step 3 — Verify

Re-run analysis on project `621a6c9f…` and check:
- `z_Shopify Sales` GL within ~5% of TB $17.7M.
- No revenue rows with sign-flipped variance greater than a few % once TB match is confirmed.
- Identity check inside tolerance.
- Reconciliation rate materially above 36%.

## Out of scope

- No UI changes.
- No changes to TB parsing or matching heuristics beyond the sign-normalization needed above.
- One file: `supabase/functions/analyze-general-ledger/index.ts`.
