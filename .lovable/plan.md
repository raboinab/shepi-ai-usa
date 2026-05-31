# Treat Trial Balance + Payroll Register as complementary sources

## The insight

- **Trial Balance** = source of truth for the books. Reconciles to the P&L. Usually 3–6 summary accounts.
- **Payroll Register** = higher-fidelity detail. Per-employee, per-tax-type, per-benefit. Almost always more granular than TB.

Today the system treats them as either/or (TB if classified + non-zero, else register fallback). That throws away analytical value when both exist, and gives users no signal about coverage or variance.

A real QoE finding pattern: *"Per payroll register: $1.21M wages. Per TB Salaries & Wages: $1.18M. Variance: $30K (2.5%) — investigate timing or unrecorded accrual."*

## Goal

Surface both sources in the Payroll wizard section with a clear reconciliation, while preserving the workbook's accounting integrity (TB stays the official roll-up).

## Approach

### 1. Source state in `PayrollSection`

Compute three booleans up front:
- `tbHasPayroll` — any TB account classified as `Payroll & Related` with non-zero balances (existing `buildPayrollGrid` check, lifted into the section)
- `registerHasData` — `dealData.payrollFallback` present with any non-empty category
- `unclassifiedPayrollSuspects` — TB accounts whose name matches payroll keywords (salar, wage, payroll tax, FICA, 401k, benefit) but aren't classified yet

Render different surfaces based on these.

### 2. Source badge row (always visible at top of section)

Two pills side-by-side:
```
[ Trial Balance: 4 accounts · $1.18M LTM ]   [ Payroll Register: Sandbox Co Payroll.xlsx · $1.21M LTM ]
```
Each pill:
- Green tint when present + non-zero
- Muted with "Not provided" + small "Add" link when missing (links to classification helper or Documents page)
- Tooltip explains the role

### 3. Reconciliation card (only when both sources exist)

A compact table comparing the two sources at the **category level**:

```
Category           Per Register      Per TB           Variance        % Var
Salaries & Wages   $890K             $870K            $20K            2.3%
Payroll Taxes      $112K             $108K            $4K             3.7%
Benefits           $145K             $140K            $5K             3.5%
Owner Comp         $60K              $60K             $0              0.0%
TOTAL              $1,207K           $1,178K          $29K            2.5%
```

- Color the variance cell amber if >3%, red if >10%
- One-line interpretation: *"Variances of <3% are normal timing differences. Larger gaps often indicate unrecorded accruals or misclassification."*

Implementation: compute TB category totals via the existing `calc` helpers + `subAccount1 === 'Payroll & Related'` classification; register totals from `payrollFallback`. Sum across LTM period set.

### 4. Detailed register breakdown (when register exists)

Collapsible card below the workbook grid: lists the register's individual line items grouped by category (Salaries & Wages, Owner Comp, Payroll Taxes, Benefits). This is the value-add the register provides over TB.

### 5. Workbook grid: keep current behavior

`buildPayrollGrid` continues to prefer TB when classified+non-zero, falls back to register otherwise. No change — this is the right behavior for an accounting roll-up that reconciles to the P&L.

Add a small footnote under the grid: *"Workbook shows Trial Balance roll-up when available. See reconciliation above for register comparison."*

### 6. Smart empty states

- **Neither source**: prominent dual CTA — *"Classify Trial Balance payroll accounts"* (opens classification helper) **OR** *"Upload a payroll register"* (links to Documents → Payroll Reports)
- **TB only, with unclassified suspects**: yellow hint — *"3 TB accounts may be payroll-related but aren't classified: Salaries Expense, Payroll Tax Exp, 401k Match. [Review classifications]"*
- **Register only**: amber hint — *"No Trial Balance accounts classified as Payroll & Related. Workbook is using the register as fallback — classify TB accounts to enable reconciliation."*

## Out of scope

- No change to `buildPayrollGrid` precedence (keeps TB-primary for the workbook/PDF)
- No DB schema changes
- No edge function changes
- Not building a period-by-period reconciliation chart (LTM totals only for v1)
- Not auto-classifying TB accounts (suspects are surfaced as a hint, user still confirms)

## Files touched

- `src/components/wizard/sections/PayrollSection.tsx` — main rework
- `src/components/wizard/shared/PayrollReconciliationCard.tsx` (new) — reconciliation table
- `src/components/wizard/shared/PayrollSourceBadges.tsx` (new) — source pills
- `src/components/wizard/shared/PayrollRegisterDetail.tsx` (new) — collapsible register breakdown
- `src/lib/payrollReconciliation.ts` (new) — pure helpers: `sumTbPayrollByCategory(dealData)`, `sumRegisterByCategory(fallback)`, `computeVariances(tb, reg)`

## Verification

1. Project with only register (current state for `fa0768ca…`): register pill green, TB pill muted with "Classify accounts" link, amber hint shown, workbook grid renders from register
2. Project with only TB classified: TB pill green, register pill muted with upload link, no reconciliation card
3. Project with both: both pills green, reconciliation card shows category-level variance, both detail panels available
4. Project with neither: dual CTA empty state
