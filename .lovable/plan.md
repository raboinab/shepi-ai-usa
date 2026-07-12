## Context

You're right — this project *does* have a Trial Balance (`processed_data` row `055ec697…`, 41 records covering Jan 2023 → May 2026, source `qbtojson`). The reason P&L validation showed 0% match was **not** that the TB was missing — it was that every one of the 183 cached TB accounts in `wizard_data.trialBalance.accounts` had been written with `fsType: "BS"` and no `accountType`, so revenue/COGS accounts were invisible to the IS derivation.

## What's already in place (from last turn)

1. `src/lib/inferFsType.ts` — shared classifier: explicit fsType → QB accountType/classification/subtype → account-number prefix (1xxx-3xxx = BS, 4xxx-9xxx = IS) → name keywords.
2. `src/lib/chartOfAccountsUtils.ts` and `src/lib/trialBalanceUtils.ts` — both now call `inferFsType` instead of blindly defaulting new rows to `BS`.
3. `wizard_data.trialBalance.accounts` on project `621a6c9f…` cleared to `[]`, so the wizard rebuilds from `processed_data` on next load.

Given the TB rows look like `"1005 Cash"`, `"5000 COGS-Shopify"`, `"z_Shopify Sales"`, the number-prefix rule catches most and the name rule catches the rest (`sales`, `cogs`, `discounts`, `refunds`).

## Plan for this turn

Verification-only — no more code changes unless something is still wrong.

1. Ask James (or you) to open `https://shepi.ai/project/621a6c9f-1c25-40fa-92fa-6762ae3fe72b`, go to the Trial Balance section, and let the wizard rebuild the TB from processed_data.
2. Re-run the P&L validation against the same `VampireFreaks_Profit and Loss.xlsx`.
3. Expected result: revenue rows (`z_Shopify Sales`, `T-Shirt Sales`, `PayPal Sales`, `Faire Sales`, `4100 Royalties Income`, etc.) are now classified `IS` / `Revenue`, and COGS rows (`5000 COGS-Shopify`, `5095 Shipping`, `5001 T-Shirt COGS`, etc.) are classified `IS` / `Cost of Goods Sold`. Match rate should jump from 0% to a real number.
4. If match rate is still 0%, capture the new "Trial Balance accounts (0)" panel — that tells us whether the rebuild ran at all (a non-zero count means the fix ran but there's a name-mismatch issue to solve next).

## Technical notes

- The processed_data rows carry only account **names** — no `accountType`, `fsType`, or `subtype` — which is exactly the case the old `|| 'BS'` fallback failed on and the new inference now handles.
- `loadTrialBalanceFromProcessedData` only hoists `monthlyReports[0].report.rows` when there's a single monthly report; with 41 monthly reports the multi-report path in `transformQbTrialBalanceData` runs, which is where the new inference now applies.
- Nothing else in the pipeline needs to change; if verification uncovers a gap, we'll narrow to that specific path.
