## Why the check still differs

After the previous fix, both screens display the same per-cell numbers (BS ending balances, IS monthly activity). But the **balance check row** disagrees:

- **Workbook TB tab** (`TrialBalanceTab.tsx`) re-accumulates monthly IS back into YTD before testing `BS_ending + IS_YTD = 0`. Result: ~0 per period. ✅
- **Wizard TB** (`MultiPeriodTable.tsx`, line 137) calls `calculateBalanceCheck(displayAccounts, periodId)`, which naively sums each account's value for that period. Since `displayAccounts` is monthly-for-IS, the wizard ends up computing `BS_ending + IS_monthly` — that does not equal zero for any month except the FY-end month. Hence the "Check (should be 0)" column is wrong (and the "IS Total" subtotal row shows just-this-month, not YTD).

## Fix

Make the wizard's check + IS subtotal use the same YTD-re-accumulation as the workbook.

1. **`src/components/wizard/shared/MultiPeriodTable.tsx`**
   - Accept a new optional `fiscalYearEnd?: number` prop (default 12).
   - Compute a per-period `isYtdTotals` map by iterating periods in chronological order and resetting the running sum at each FY start month (same loop the workbook uses).
   - Replace the existing IS subtotal cell with `isYtdTotals[period.id]` and rename the row label to "IS Total (YTD)".
   - Replace the "Check (should be 0)" cell value with `bsTotal + isYtdTotals[period.id]`. BS subtotal stays as-is.

2. **`src/components/wizard/sections/TrialBalanceSection.tsx`**
   - Pass `fiscalYearEnd={fiscalYearEnd}` to `MultiPeriodTable`.

3. **`src/lib/trialBalanceUtils.ts`** — no changes needed; `calculateBalanceCheck` stays for callers that pass YTD data (the `outOfBalancePeriods` selector in `TrialBalanceSection` already passes the raw YTD `accounts`, which is correct).

## What stays the same

- Per-cell BS and IS values in the wizard grid still match the workbook (no change to `displayAccounts`).
- Edits still convert back to YTD via `convertIsMonthlyToYtd` before persisting — unchanged.
- The hidden out-of-balance banner logic (`outOfBalancePeriods`) keeps working off raw YTD accounts.

## Verification

After implementation, open project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`:
- Wizard TB → "Check (should be 0)" row should be ~0 for every period (matches workbook).
- "IS Total (YTD)" row in the wizard should equal the workbook's "IS Total (YTD)" row period-by-period.
- BS subtotal unchanged in both.
