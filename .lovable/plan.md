# Debt Schedule Auto-Fallback (mirror payroll / fixed assets)

## Goal
After a Debt Schedule CSV/PDF is uploaded and parsed by `process-debt-schedule`, it should appear in the workbook's **Supplementary** tab automatically — no need to open the wizard and click **Import from Documents**. Wizard import stays available to edit/override.

## Changes

### 1. New file: `src/lib/debtFallback.ts`
- Export `fetchLatestDebtFallback(projectId): Promise<SupplementaryDebtItem[]>`.
- Query `processed_data` for the most recent row with `project_id = projectId` and `data_type = 'debt_schedule'`, ordered by `created_at desc`, limit 1.
- Map `data.debts[]` (shape from `process-debt-schedule`: `lender`, `facilityType`, `currentBalance`, `interestRate`, `maturityDate`, optional `monthlyPayment`) into `SupplementaryDebtItem` shape used by `dealData.supplementary.debtSchedule` (matching what `DebtScheduleImportDialog` produces and what `adaptSupplementary` consumes — `lender` concatenated with facility type, `balance` = `currentBalance`, `interestRate`, `maturityDate`, `type` = `facilityType`).
- Return `[]` on no row, parse error, or query failure.

### 2. Update `src/lib/projectToDealAdapter.ts`
- Add a third entry to the existing `Promise.all` in `loadDealDataWithPriorBalances` for `debtFallback` (lazy import like the others).
- After `adaptSupplementary` runs and `dealData.supplementary` is populated, add:
  ```
  if ((dealData.supplementary?.debtSchedule?.length ?? 0) === 0 && debtFallback.length > 0) {
    dealData.supplementary = {
      debtSchedule: debtFallback,
      leaseObligations: dealData.supplementary?.leaseObligations ?? [],
    };
  }
  ```
- Never overwrite a non-empty wizard-edited debt list.

## What does NOT change
- `process-debt-schedule` edge function (already fixed for CSVs last round).
- `DebtScheduleImportDialog` — still works for manual import/override.
- `SupplementaryTab.tsx` — already renders `dealData.supplementary.debtSchedule`, no UI changes needed.
- Lease obligations — no fallback (no upload source for them).

## Validation
1. On project `fa0768ca…`, reload the workbook → **Supplementary** tab should show the parsed debt rows (lender, balance, rate, maturity) without touching the wizard.
2. Edit a row via the wizard's Supplementary section and save → fallback must NOT clobber the edits on next reload (wizard data takes priority).
3. Delete wizard supplementary data → fallback should re-populate from the uploaded CSV on next load.