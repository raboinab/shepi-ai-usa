# Reclass EBITDA Treatment Fix

## Problem

Reclassifications currently shift Reported and Adjusted EBITDA on the QoE Summary cards and EBITDA Trend chart even when both sides of the reclass live inside EBITDA categories. The ledger contract (`src/types/qoeLedger.ts`) defines reclasses as `effectType: "PresentationOnly"`, so a balanced reclass between two EBITDA-included line items must net to zero EBITDA impact.

Root cause: the EBITDA overlay sums reclass impact across **all five IS categories**, including `"Other expense (income)"`, which lives *below* the EBITDA line. That makes the overlay non-zero for every reclass, even balanced ones.

## Policy

A reclass changes EBITDA **only when it crosses the EBITDA line**:

- **EBITDA-included categories**: `Revenue`, `Cost of Goods Sold`, `Operating expenses`, `Payroll & Related`
- **Below-the-line (EBITDA-excluded)**: `Other expense (income)` (and any future interest/tax/D&A buckets)

Intra-EBITDA reclasses (e.g., OpEx ↔ Payroll, Revenue ↔ COGS) sum to zero across the four EBITDA categories and therefore leave EBITDA unchanged. Cross-line reclasses (e.g., OpEx ↔ Other expense) move only one side's amount across the four EBITDA categories, so EBITDA correctly shifts by that amount.

Net income, gross profit, revenue, OpEx, etc. continue to reflect every reclass (they already do via their own per-category overlays).

## Changes

### 1. `src/lib/qoeMetrics.ts`
- Remove `otherReclass` from the `reportedEBITDA` / `adjustedEBITDA` accumulation.
- Keep `otherReclass` for `netIncome` (net income is below the EBITDA line and must reflect all IS reclasses).
- The new `totalISReclass` used for EBITDA becomes: `revReclass + cogsReclass + opexReclass + payrollReclass` (no `otherReclass`).

### 2. `src/lib/reclassHelpers.ts`
- Add a new constant `EBITDA_CATEGORIES = ["Revenue", "Cost of Goods Sold", "Operating expenses", "Payroll & Related"]` (excludes `"Other expense (income)"`).
- `reclassAwareReportedEBITDA` and `reclassAwareAdjustedEBITDA` use `EBITDA_CATEGORIES` instead of `IS_CATEGORIES` for their overlay.
- `reclassAwareNetIncome` keeps using `IS_CATEGORIES` (correct — includes everything).
- All other helpers unchanged.

### 3. Tests
- Add a focused test in `src/lib/qoeMetrics.test.ts` (or a new `reclassHelpers.test.ts`):
  - Given a balanced reclass that moves $10k from `Operating expenses` to `Payroll & Related`: EBITDA delta = 0.
  - Given a reclass that moves $10k from `Operating expenses` to `Other expense (income)`: EBITDA increases by $10k; Net Income unchanged.
  - Given a reclass that moves $10k from `Revenue` to `Other expense (income)` (modeled as negative income reclass): EBITDA decreases by $10k; Net Income unchanged.

## Out of Scope

- `src/lib/workbook-grid-builders.ts` per-category overlays — already category-specific and correct for the workbook grids (P&L rows reflect reclasses; EBITDA in those grids should be re-verified separately if the user sees a mismatch there, but no change requested here).
- Per-period workbook EBITDA rows, breakdown grids, PDF exporter — not part of this request.
- The `ProofOfCashSection` book-beginning fix from the prior turn — already shipped.
- Underlying `Reclassification` data model and bucket-balance validation — unchanged.

## Verification

After implementation, on the user's project (`fa0768ca-…`):
1. QoE Summary "Reported EBITDA" and "Adjusted EBITDA" cards should match the values from before any reclasses were added, **unless** at least one reclass crosses between an EBITDA category and `Other expense (income)`.
2. EBITDA Trend chart lines should not jump when a purely-intra-EBITDA reclass is added/removed.
3. Net Income and the P&L line items on the workbook grids continue to reflect every reclass.
