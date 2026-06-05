## What's actually wrong

I pulled the project's uploaded documents straight from `processed_data` and confirmed three concrete bugs in `supabase/functions/parse-tax-return/index.ts`. The user already uploaded everything we need; the analyzer just isn't reading the right paths.

### Bug 1 — Payroll / Fixed Assets / Debt Schedule helpers read the wrong JSON paths

The helpers I added last round look at `payrollDoc.ownerComp.accounts`, `fixedAssetsDoc.assets[].currentYearDepreciation`, `debtScheduleDoc.debts[].annualInterest`. None of those fields exist in the real stored shape. So every helper returns `0`, the fallback never fires, and the user gets the "upload a payroll register…" tip on top of docs they already uploaded.

Real shapes (verified against this project):

| Doc | Actual path | Per-row fields |
|---|---|---|
| Payroll | `data.extractedData.salaryWages[]` and `data.extractedData.ownerCompensation[]` | `{ name, monthlyValues: { "YYYY-MM": number } }` |
| Fixed Assets | `data.extractedData.assets[]` | `{ cost, accumDepreciation, dateAcquired, usefulLife: "7 years" }` — no precomputed annual depreciation |
| Debt Schedule | `data.debts[]` (top-level, NOT under extractedData) | `{ currentBalance, interestRate, originalAmount, maturityDate }` — no precomputed annual interest |

### Bug 2 — "Other Income (Schedule K non-operating)" is structurally apples-to-oranges

Tax-side sum of Schedule K interest + dividends + cap gains vs. books "Other Income" section produces wild swings (−75%, −81%, +1574% across the three years). Including it in the consistency score punishes deals for a comparison that was never meaningful.

### Bug 3 — Revenue "regression" is not a regression

The prior 0% Gross Receipts variance was an artifact of `totalRevenue` summing all 3 years against a single-year tax return. The new per-year monthly scoping shows real 10–24% variances — that's the honest number and stays.

## Changes to `supabase/functions/parse-tax-return/index.ts`

### 1. Rewrite the four helpers (lines ~1520–1615) against real shapes

```text
payrollAccounts(group)  // group = 'salaryWages' | 'ownerCompensation'
  arr = payrollDoc?.extractedData?.[group]      // real path
     ?? (Array.isArray(payrollDoc?.[group]) ? payrollDoc[group] : null)  // PayrollFallbackData shape
     ?? payrollDoc?.[group]?.accounts           // last-resort legacy
  sum each row's monthlyValues keys matching `${taxYear}-`
  fallback: sum all monthlyValues if no year keys match (mark yearScoped:false)

getPayrollOwnerComp(year)
  payrollAccounts('ownerCompensation')
  source: "Payroll — Owner Compensation (uploaded)"

getPayrollSalaries(year)
  payrollAccounts('salaryWages')
  source: "Payroll Reports (uploaded)"

getFixedAssetDepreciation(year)
  list = fixedAssetsDoc?.extractedData?.assets ?? fixedAssetsDoc?.assets ?? (Array.isArray(fixedAssetsDoc) ? fixedAssetsDoc : [])
  for each asset:
     life = parseInt(usefulLife) || 0       // "7 years" -> 7
     annual = life > 0 ? cost / life : 0
     acquiredYear = new Date(dateAcquired || acquisitionDate).getFullYear()
     fullyDepYear = acquiredYear + life
     include if acquiredYear <= taxYear && fullyDepYear > taxYear
     (prorate first year by months in service if dateAcquired is mid-year — optional, skip for v1)
  source: "Fixed Assets Schedule (uploaded)"

getDebtScheduleInterest(year)
  list = debtScheduleDoc?.debts ?? debtScheduleDoc?.extractedData?.debts ?? (Array.isArray(debtScheduleDoc) ? debtScheduleDoc : [])
  for each debt:
     rate = interestRate / 100
     // Approximation: avg of original and current balance (declining principal)
     avgBal = (originalAmount + currentBalance) / 2
     annual = avgBal * rate
     maturityYear = new Date(maturityDate).getFullYear()
     include if maturityYear >= taxYear   // debt still outstanding in tax year
  mark yearScoped:false and add " (estimated from rate × avg balance)" to source label
  source: "Debt Schedule (uploaded, estimated)"
```

Sanity check against this project's docs for 2024:
- Owner Comp: 12 × $10,000 = **$120,000** (matches tax line 7 if present)
- Salaries: Sum of 2024 monthlyValues = **~$228,409**
- Depreciation: 5 assets, annual ≈ $13,495/7 + $12,800/7 + $8,500/10 + 0 (fully dep) + $3,200/5 ≈ **~$5,323**
- Interest: ($15k+$4k)/2 × 7.25% + ($35k+$25k)/2 × 5.99% ≈ **~$2,486**

These now actually flow into `pushCompare` rows instead of "$0 books → tip".

### 2. Downgrade "Other Income (Schedule K non-operating)" (lines ~1436–1460)

Add `excludeFromScore: true` to the row's payload and skip it in the consistency-score reducer. Also append to its `note`: *"Informational only — books 'Other Income' bucket and Schedule K line items are structurally different. Excluded from consistency score."*

The pushCompare/scoring reducer already iterates over flagged rows; add `if (row.excludeFromScore) continue;` before counting.

### 3. Make the tip only fire when the document truly isn't uploaded

Currently the tip is appended whenever `EXT_FALLBACKS[taxKey]() === 0`. Change it so the tip is appended only when the corresponding `payrollDoc / fixedAssetsDoc / debtScheduleDoc` is `null/undefined` — i.e. genuinely missing. If the doc exists but the helper returned 0, append a different note: *"Uploaded {doc} for {year} had no matching rows — extraction may need review."* That converts a wrong nag into an actionable signal.

## Out of scope

- No prompt/extractor changes; the existing extractors produce the shapes above.
- No frontend changes.
- No new document categories.
- Revenue/Other Income deltas surfaced by per-year scoping remain visible — that's the correct behavior.

## Files touched

- `supabase/functions/parse-tax-return/index.ts` only. ~80 LOC diff. Single edge-function deploy. No migration.

## Verification (after deploy)

Re-analyze 2023 / 2024 / 2025 on project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`. Expected:

- Officer Compensation row: tax vs **$120,000** sourced from "Payroll — Owner Compensation (uploaded)".
- Salaries & Wages row: tax vs year-summed salaryWages from "Payroll Reports (uploaded)".
- Depreciation row: tax vs computed Fixed Assets total from "Fixed Assets Schedule (uploaded)".
- Interest Expense row: tax vs estimated Debt Schedule interest from "Debt Schedule (uploaded, estimated)".
- "Upload a payroll register…" tip disappears on this project (docs are present).
- "Other Income (Schedule K non-operating)" still shown but tagged informational and no longer drags the consistency score.
- Consistency score should land in the 60–80% range across all three years.
