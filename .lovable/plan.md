## Root cause

The uploaded payroll register **is** in the database (`processed_data.data_type='payroll'` row exists with full monthly values for 2023–2025), and `useProjectDealData` correctly merges it onto `dealData.payrollFallback`.

The bug is at the render layer: `WorkbookTabView` routes the `payroll` tab to the custom React component `src/components/workbook/tabs/PayrollTab.tsx`, which **only reads Trial Balance entries** via `calc.getEntriesByLineItem(tb, "Payroll & Related")`. It has no fallback branch — so when no TB accounts are classified as "Payroll & Related" (this project's case), the grid renders an empty "reported" section even though `dealData.payrollFallback` is populated.

The sibling pure builder `buildPayrollGrid` in `src/lib/workbook-grid-builders.ts` already handles this correctly (lines 489–496 fall through to `buildPayrollFallbackGrid`). The custom component just never got the same treatment.

This is why both surfaces look empty:
- **Workbook page** → `WorkbookTabView` → `PayrollTab` (no fallback) → empty grid
- **Wizard Payroll section** → also renders `<WorkbookTabView tabId="payroll" />` → same empty grid (even though the section's own summary cards / reconciliation card do read the register correctly)

## Fix

Add a fallback branch at the top of `PayrollTab` that mirrors `buildPayrollGrid`'s logic:

```ts
const tbHasData = entries.some(e =>
  dealData.deal.periods.some(p => Math.abs(e.balances[p.id] || 0) > 0.01)
);
if (!tbHasData && dealData.payrollFallback) {
  // delegate: build the fallback grid via the existing pure builder
  return <SpreadsheetGrid data={buildPayrollFallbackGridForTab(dealData, dealData.payrollFallback)} />;
}
```

Two implementation options — I'll go with **Option A** for minimum surface area:

**Option A (preferred):** Export `buildPayrollFallbackGrid` from `workbook-grid-builders.ts` (currently file-local) and call it from `PayrollTab` when the fallback condition hits. No duplication, single source of truth for the fallback grid shape.

**Option B:** Inline a small fallback grid inside `PayrollTab` itself. Rejected — duplicates ~40 lines and creates two fallback grids that can drift.

## Files to change

1. `src/lib/workbook-grid-builders.ts` — change `function buildPayrollFallbackGrid` to `export function buildPayrollFallbackGrid`.
2. `src/components/workbook/tabs/PayrollTab.tsx` — import `buildPayrollFallbackGrid`; before constructing the TB grid, detect empty TB + present `payrollFallback` and return `<SpreadsheetGrid data={buildPayrollFallbackGrid(dealData, dealData.payrollFallback)} />`.

## Out of scope

- No DB / edge function / extraction changes — the upload pipeline is working.
- No changes to `PayrollSection`'s reconciliation cards or `useProjectDealData`.
- No changes to `buildPayrollGrid` (already correct).
- We do **not** also try to render the register inline when TB *is* populated — that's what the wizard's reconciliation/detail cards are for, and the grid stays TB-primary for P&L roll-up consistency (per existing doctrine).

## Verification

After the change, on this project the Payroll tab in both the Workbook page and the Wizard section should render rows for Salaries & Wages, Payroll Taxes, etc., with monthly columns matching the uploaded register (e.g., Regular Wages & Salaries showing $22,201.85 in Jan-23).