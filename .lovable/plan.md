## Goal

Stop the remaining false-positive variances on the tax return analysis page (Officer Comp / Salaries showing $0 in books, Repairs / Rents / Depreciation / Advertising swinging ±40–400% year over year) by:

1. Broadening the book-account keyword matchers to cover common QB naming variants.
2. Handling the S-corp payroll edge case where books don't split Officer vs. Salaries.
3. Giving users visibility into *which* book accounts were considered (and which were ignored) so misclassifications become reviewable instead of silent.

No frontend changes are required — the existing comparison table already renders `matchedAccounts` and `skippedFields`.

## Where the problem lives

`supabase/functions/parse-tax-return/index.ts`

- **Lines 1169–1182** — `PL_MATCHERS`: the deduction-side regex sets.
- **Lines 1473–1533** — the deduction loop that calls `matchAccounts` / `matchISAccounts` and emits `pushReviewOnly` when matches return $0.
- **Helpers** `matchAccounts` and `matchISAccounts` (used to scan canonical_transactions and IS-bucket accounts respectively).

## Changes

### 1. Broaden `PL_MATCHERS`

Extend each regex set with common QB naming variants observed in the wild. Keep exclude patterns to avoid double-counting (e.g., "Rental Income" stays out of "Rents"). Approximate additions:

| Bucket | Add to `match` |
|---|---|
| `salariesWages` | `/\bw[- ]?2\b/i`, `/\bgusto\b/i`, `/\bpayroll expense/i`, `/\bemployee comp/i`, `/staff (cost|wage)/i`, `/labor expense/i` |
| `officerCompensation` | `/officer salar/i`, `/officer wage/i`, `/owner salar/i`, `/owner wage/i`, `/shareholder salar/i`, `/shareholder wage/i`, `/\bowner pay\b/i`, `/\bs[- ]?corp.*(salary|wage|comp)/i` |
| `repairs` | `/\br\s*&\s*m\b/i`, `/\br\/m\b/i`, `/upkeep/i`, `/janitorial/i`, `/cleaning/i`, `/\bservice contract/i` (with exclude `/customer service/i`, `/internet service/i`) |
| `rent` | `/\brental expense/i`, `/office space/i`, `/storage (rent|fee)/i`, `/equipment lease/i`, `/vehicle lease/i` |
| `taxes` | `/\bbusiness license/i`, `/\bpermit/i`, `/regulatory fee/i`, `/\bfranchise tax/i`, `/\bproperty tax/i`, `/\bpayroll tax/i` (NOTE: keep `payroll tax` IN here, OUT of salaries) |
| `interestExpense` | `/\bloan interest/i`, `/\bcredit card interest/i`, `/mortgage interest/i`, `/line of credit/i` |
| `depreciation` | `/\bdep\b/i` (narrow, with `\b`), `/section 179/i`, `/bonus depreciation/i` |
| `advertising` | `/\bads\b/i`, `/google ads/i`, `/facebook ads/i`, `/social media/i`, `/sponsorship/i`, `/trade show/i`, `/branding/i`, `/seo expense/i` |
| `pension` | `/simple ira/i`, `/sep[- ]?ira/i`, `/roth/i`, `/employer match/i` |
| `employeeBenefit` | `/\bhsa\b/i`, `/\bfsa\b/i`, `/life insurance/i`, `/disability insurance/i`, `/worker.?s? comp/i`, `/pto\b/i`, `/staff (meal|event|gift)/i` |

These are additive — no existing matches change.

### 2. S-corp combined-payroll fallback (Officer Comp + Salaries)

When **both** `officerCompensation` and `salariesWages` are extracted from the tax return but **one of them lands $0 in books**, run a single combined match against `[...salariesWages.match, ...officerCompensation.match]` and compare the *combined* tax amount against the *combined* book amount as one extra diagnostic row labeled "Combined Payroll (Officer + Salaries)". This catches the common case where a small S-corp books all payroll to one bucket (e.g., "Gusto - Payroll Expenses") rather than splitting officer vs. staff.

The two per-line rows still emit (so the split mismatch is visible), but the combined row prevents the headline consistency score from being dragged down twice when the books are just structurally flat.

### 3. Surface unmatched IS account names

In the `matched.total === 0` branch (line 1504), enrich the `pushReviewOnly` note with a short list of expense accounts the matcher *considered but rejected*. Specifically:

- Pull the list of IS expense accounts for the year (already loaded for `matchISAccounts`).
- Append: `Considered accounts that did not match: "Acct A", "Acct B", … (truncate at 5).`

This converts "books show $0" into a reviewable hint — the user can see "oh, I have a `Contract Labor` account that wasn't matched as salaries" and either rename or update the matcher next iteration.

### 4. Regression check

After deploy, re-analyze 2023, 2024, 2025 for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`. Expected effect:

- Officer Comp / Salaries: either match real book accounts now, OR show a non-zero "Combined Payroll" row with a reasonable variance, OR show $0 with a list of considered accounts (legitimately unmatched — actionable).
- R&M, Rents, Depreciation, Advertising: variances should compress as additional accounts come into the match buckets. Years where books are genuinely missing categories will keep their variance — that's the correct behavior.
- Consistency scores should move into the 60–80% range for this project; remaining gaps are real and reviewable.

## Out of scope

- No prompt / extractor changes.
- No DB / migration changes.
- No frontend changes — `matchedAccounts` and `skippedFields` already render.
- No changes to balance-sheet (`BS_MATCHERS`) — only P&L deduction matchers.

## Files touched

- `supabase/functions/parse-tax-return/index.ts` only.

## Effort

~80–120 LOC, single edge function deploy.
