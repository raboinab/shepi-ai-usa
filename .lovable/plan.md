## Diagnosis (starting-month specific)

In `src/components/wizard/sections/ProofOfCashSection.tsx`, each monthly Proof-of-Cash row has four balance fields. For the **first month of the review period** (Jan 2023 on project `fa0768ca-…`), here's what's actually happening:

| Field | Source | Status for month 1 |
| --- | --- | --- |
| `beginningBalance` (bank) | `stmt.summary.openingBalance` of the matched statement (line 203) | Data is in the DB (Jan 2023 = $453,477.08 + $151,100.98 = **$604,578.06**). If the UI shows `0`, the period-match at lines 180-194 isn't finding the Jan statement. |
| `endingBankBalance` | `stmt.summary.closingBalance` | Same matching path — if beginning is 0, ending is probably also 0 for month 1. |
| `beginningBookBalance` | **Nothing** (hardcoded `0` at line 97, never assigned) | Always 0 for every month, especially month 1. |
| `endingBookBalance` | **Nothing** (hardcoded `0` at line 100, never assigned) | Always 0. |

Plus an upstream data fact I confirmed: the earliest `trial_balance` row in `processed_data` is for period_end `2023-01-31`. **There is no Dec 2022 TB**, so the book-side opening for month 1 has no natural source from the trial balance alone.

## Fix

### 1. Bank-side first-month fix (period matching)
In `ProofOfCashSection.tsx`, lines 180-194, the matcher parses `stmt.periodStart`/`periodEnd` with a local-date helper but parses `p.startDate`/`p.endDate` with the same helper only when present, then falls back to `new Date(year, month-1, 1)`. If `period.startDate` is `undefined` AND the period object doesn't carry `year`/`month` (some legacy projects), the matcher silently skips month 1. Add a third fallback: compare `stmt.periodStart.substring(0,7)` (e.g. `"2023-01"`) against `period.id` or `period.label`. That guarantees the Jan statement maps to the Jan period even when date fields are missing.

### 2. Books-side: populate Beginning/Ending Book Balance from the trial balance
Add a second `useEffect` (mirrors the existing statement effect) that, for every period × bank account row, writes:

- `endingBookBalance` = `calc.sumByLineItem(tb, "Cash and cash equivalents", periodId)` for that period.
- `beginningBookBalance` = the prior period's `endingBookBalance`.

Allocation when there are multiple bank accounts: split the GL cash total proportionally by each account's `endingBankBalance` for that period, so the row total still ties to TB.

Only overwrite when `bookDataSource !== "manual"` so user-entered values stick.

### 3. First-month book opening (the unavoidable gap)
For period 0, the prior TB doesn't exist. Derive the opening as:

```
beginningBookBalance[period 0] = endingBookBalance[period 0]
                                 − depositsPerBook[period 0]
                                 + withdrawalsPerBook[period 0]
```

If `depositsPerBook` / `withdrawalsPerBook` aren't populated yet, fall back to the **bank** activity for month 1 (`endingBankBalance − totalCredits + totalDebits`) and surface a small inline hint: *"Month 1 book opening derived from bank activity — confirm against your prior period close."* This keeps the row non-zero and reconciling while flagging the assumption.

## Out of scope

- The Workbook → Proof of Cash tab (`ProofOfCashTab.tsx`) — no "Beginning Balance" row exists there; nothing to change.
- The 14-bucket FS Line Items contract — untouched.
- COA — untouched.

## Verification

1. Open the wizard Proof of Cash on project `fa0768ca-…`.
2. Confirm Jan 2023 row shows **Beginning Bank ≈ $604,578**, **Ending Bank ≈ $604,544** (matches DB).
3. Confirm Jan 2023 **Beginning Book** is non-zero and equals `Ending Book − Deposits + Withdrawals`.
4. Confirm Feb 2023 **Beginning Book** equals Jan 2023 **Ending Book**.
5. Edit a book-side value manually, re-render, confirm it isn't overwritten.
