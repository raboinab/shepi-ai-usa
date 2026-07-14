## Short answer

No, those numbers are wrong. $3.9B in assets and −$547M net income on a 92-account SMB GL is impossible — it points to a parser bug in `analyze-general-ledger`, not real books.

## What's actually broken

Pulled the raw GL export for project `621a6c9f…` (2025 general_ledger, 92 accounts, 38,580 rows) and inspected the Wells Fargo Business Checking section. Two concrete parser problems produce the inflated identity totals:

1. **"Beginning Balance" row is actually the year-end running balance in this QB export.** Rows come back date-descending, so the section starts with `Beginning Balance | ... | 214,716.04` — that's the Dec-31 running balance, not the Jan-1 opener. The parser at `analyze-general-ledger/index.ts:230` treats it as `beginningBalance`. When the running-balance column isn't detected, `glBalance = beginningBalance + netSum` double-counts the year's activity.
2. **Ending-balance detection assumes ascending date order.** `endingBalance` at `index.ts:249-251` is assigned on every DATA row and keeps the *last* row's value. With descending rows, "last" = the earliest transaction of the year, so ending is the opening balance. Combined with #1, some accounts get opening + full activity, others get closing = opening — a mix that blows up `sumAssets` and `netIncome` in the identity check.

The 25% / 23-of-92 match rate is a secondary symptom: sub-accounts with the QB colon notation (`4000:Sales`) still don't hit the FQN keys in `reconciliation` for GL sections that lack `acctId`, so anything without a QB id falls to leaf-name matching and misses.

Also worth noting (not the root cause but adds noise):
- The analyzer only reads the *single most recent* `processed_data` GL row (`limit(1)` at `index.ts:100`). This project has three GL exports (2024, 2025, 2026 YTD) — 2025 is what's shown, the other two are invisible.
- `identityCheck.assets` keeps signed values while `liabilities`/`equity` take `Math.abs`. If sign conventions drift across accounts, the difference math looks worse than it is.

## Fix plan

### 1. Detect QB row ordering per section (`supabase/functions/analyze-general-ledger/index.ts`, section-parser loop starting at line 157)

Before iterating DATA rows in a section, scan the first and last data row's date and set `orderDesc = firstDate > lastDate`. Then:

- If `orderDesc`, iterate `childRows` in reverse so Beginning Balance / ending running balance land in the right slots.
- Alternatively (safer): explicitly locate the `Beginning Balance` row (regardless of position) → `beginningBalance`. Locate the `Total <AccountName>` summary row (QB always emits one) → use its balance column as `endingBalance`. Fall back to running-balance-of-last-transaction only if neither is present.

Prefer the Total-row approach — it's order-independent and matches what QB actually reports as the account's period-end balance.

### 2. Prefer Total row for `glBalance`, drop the double-count path

Replace lines 266-269:
```ts
let glBalance: number;
if (totalRowBalance != null)          glBalance = totalRowBalance;      // trust QB summary
else if (balanceColIdx >= 0 && endingBalance !== 0) glBalance = endingBalance;
else if (beginningBalance !== 0 || netSum !== 0)    glBalance = beginningBalance + netSum;
else glBalance = 0;
```
`totalRowBalance` is captured from `section.summary?.colData?.[balanceColIdx]` (or amountColIdx fallback).

### 3. Normalize identity-check signs

At line 803, apply `Math.abs` to assets too, and separate contra-assets by name pattern (`accumulated depreciation|allowance for`) so they subtract cleanly. Also cap the "difference > $1000" flag threshold as a % of total assets so small-book projects don't spam.

### 4. Aggregate GL across all periods, not just the newest export

Change the `.limit(1)` on line 100 to fetch every `general_ledger` row for the project, then merge sections by account key. Since keys are stable on `acctId`, later exports overwrite earlier ones per account, giving whole-lifetime coverage instead of the accidentally-last-uploaded slice. Track `periodStart`/`periodEnd` as the union.

### 5. Fix sub-account matching for GL sections missing `acctId`

Reuse the FQN normalization from `src/lib/trialBalanceUtils.ts` (colon → space, case-fold, strip acct-number prefix) when building `coaByLeaf` and when matching in the reconciliation step. This should lift the 23/92 match rate materially.

### 6. Re-run for this project

After deploy, POST to `analyze-general-ledger` with `{ project_id: '621a6c9f-1c25-40fa-92fa-6762ae3fe72b' }` and confirm the identity numbers land in a sane range (assets in the hundreds of thousands / low millions for this business, net income within a few hundred K of P&L).

## Out of scope

- Rebuilding the GL from `canonical_transactions` (that path stays as fallback).
- Fixing the P&L / BS tie-out separately — the fixes above should incidentally close most of the identity gap; anything remaining is a follow-up.
- UI changes to `GeneralLedgerInsightsCard`.
