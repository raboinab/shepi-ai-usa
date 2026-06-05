## Goal

When a tax-return deduction line lands $0 in the books (GL + Income Statement), fall back to comparison against uploaded external documents (payroll registers, fixed assets schedule, debt schedule) before emitting a review-only row. This closes the gap where payroll runs through Gusto/ADP and never hits the GL, depreciation is tracked off-book on a fixed asset schedule, or interest is tracked in a debt schedule.

## Where the changes go

`supabase/functions/parse-tax-return/index.ts` — deduction loop at lines ~1574–1631 plus four small reducer helpers.

## Changes

### 1. Extract four reducer helpers (top of analyzer block, near `matchISAccounts`)

```
getPayrollOwnerComp(year)        → number    // from wizardData.payroll.ownerComp.accounts, year-scoped via monthlyValues YYYY-MM prefix
getPayrollSalaries(year)         → number    // from wizardData.payroll.salaryWages.accounts OR employees[]/array forms, year-scoped
getFixedAssetDepreciation(year)  → number    // sum of currentYearDepreciation / annualDepreciation, year-scoped if asset has year field, else annual
getDebtScheduleInterest(year)    → number    // sum of annualInterest / interestExpense, year-scoped if available, else annual
```

Each returns `{ total: number; yearScoped: boolean; source: string }` so the row can show the right source label and a "(no year scoping)" hint when only annual totals exist.

### 2. Per-line external-document fallback in the deduction loop

Before the existing `pushReviewOnly` push when `matched.total === 0`, check the tax key and consult the matching helper:

| Tax key | Helper | Source label |
|---|---|---|
| `officerCompensation` | `getPayrollOwnerComp` | `Payroll Reports — Owner Comp (uploaded)` |
| `salariesWages` | `getPayrollSalaries` | `Payroll Reports (uploaded)` |
| `depreciation` | `getFixedAssetDepreciation` | `Fixed Assets Schedule (uploaded)` |
| `interestExpense` | `getDebtScheduleInterest` | `Debt Schedule (uploaded)` |

If the helper returns a positive total, emit a `pushCompare` row (not review-only) with the original threshold and a `flagMessage` that notes "books had $0 for this line; matched against uploaded {source}".

### 3. Combined Payroll fallback row

The combined Officer+Salaries fallback added in the previous change should also include `getPayrollOwnerComp(year) + getPayrollSalaries(year)` in its book-side total when the keyword match returns $0. This makes the combined row work even for projects with no payroll account in books at all.

### 4. Review-only "tip" when no fallback document exists

When `matched.total === 0` AND the external-document helper also returns 0 AND the tax key is one of the four supported, append a tip to the review-only note:

> Tip: upload a payroll register / fixed assets schedule / debt schedule for this year to enable a direct comparison.

This converts a silent dead-end into an actionable next step.

### 5. Year scoping caveats

- Payroll: `monthlyValues` keys (`YYYY-MM`) are filtered to the tax year. If only annual totals exist (no `monthlyValues`), use the annual total and mark `yearScoped: false`.
- Fixed assets: prefer `currentYearDepreciation` when the asset's `inServiceYear` ≤ taxYear and not disposed; otherwise sum all. Mark `yearScoped` accordingly.
- Debt schedule: same pattern — prefer year-specific interest fields if present.

When `yearScoped` is false, the row's source label becomes e.g. `Payroll Reports (uploaded; no year scoping)` and the flagMessage gets a `— variance may reflect multi-year totals` suffix.

## Out of scope

- No new document categories — only uses payroll / fixed assets / debt schedules already in `wizardData`.
- No prompt or extractor changes.
- No frontend changes — `source` and `flagMessage` already render on the comparison table.
- No M-1 / Schedule K / Schedule L changes.
- No further matcher-regex changes (the previous broadening stays as-is).

## Files touched

- `supabase/functions/parse-tax-return/index.ts` only.

## Effort

~80–120 LOC. Single edge function deploy. No migration.

## Regression check

Re-analyze 2023 / 2024 / 2025 on project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`:
- If payroll reports were uploaded: Officer Comp and Salaries rows switch from review-only ($0 books) to real comparison rows sourced from "Payroll Reports (uploaded)".
- If no payroll docs were uploaded: review-only row keeps the "considered accounts" hint AND gets the new "upload a payroll register…" tip.
- Same pattern for Depreciation (Fixed Assets Schedule) and Interest (Debt Schedule).
- Consistency scores recover further as legitimate matches replace $0-in-books gaps.
