## Goal

Confirm the TB → P&L fix works on project `621a6c9f-1c25-40fa-92fa-6762ae3fe72b` without waiting on James to reopen it. Warm the cache server-side, then verify the numbers.

## Current state

- Fix is live: `src/lib/inferFsType.ts` + updated `chartOfAccountsUtils.ts` / `trialBalanceUtils.ts` classify accounts by QB metadata → account-number prefix → name keywords (no more blind `fsType: "BS"` default).
- Project's `wizard_data.trialBalance.accounts` is currently `[]` (cleared last turn).
- `processed_data` has 41 monthly TB rows (Jan 2023 → May 2026, source `qbtojson`), untouched.

## Plan

1. **Add a one-off admin edge function** `rebuild-project-tb` (service-role, admin-only) that:
   - Loads `processed_data` TB rows for a given `project_id`.
   - Runs the same `transformQbTrialBalanceData` + `inferFsType` pipeline used client-side (shared code imported from `_shared/`).
   - Cross-references with the project's CoA (`wizard_data.chartOfAccounts.accounts`) using `crossReferenceWithCOA`.
   - Writes the enriched array back to `wizard_data.trialBalance.accounts` with a fresh `lastUpdated` timestamp.
2. **If the shared client helpers can't be cleanly imported into Deno**, port only the minimum needed (`inferFsType`, `transformQbTrialBalanceData`, `mergeAccounts`, `crossReferenceWithCOA`) into `supabase/functions/_shared/trial-balance/` and have both sides import from there. No behavior change on the client.
3. **Invoke it once** for James's project via `supabase--curl_edge_functions`.
4. **Verify via SQL**:
   - `jsonb_array_length(wizard_data->'trialBalance'->'accounts')` is ~183.
   - Count of accounts with `fsType = 'IS'` is > 0 and roughly matches the number of 4xxx/5xxx/6xxx-9xxx rows (expect ~80–120 IS out of 183).
   - Spot-check that `z_Shopify Sales`, `T-Shirt Sales`, `5000 COGS-Shopify`, `5095 Shipping` are classified `IS` with categories Revenue / Cost of Goods Sold.
5. **Run the P&L validator** the same way the UI does: call the existing `validate-financial-statement` edge function against James's uploaded `VampireFreaks_Profit and Loss.xlsx` document, using the freshly rebuilt TB. Log the match rate.
6. **Report the numbers back to you** — TB account count, IS vs BS split, and P&L match rate before/after. If match rate is still 0%, capture the mismatch reasons (name-normalization gaps, period-alignment issues) and open a narrow follow-up plan for just that gap.

## Notes

- No changes to any UI or client-side classification behavior — the client fix is already in place; this plan only warms the cache and measures the result.
- The new edge function is admin-only and single-purpose; safe to keep around as an ops tool for future stuck projects, or delete after verification — your call.
