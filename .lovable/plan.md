## Goal

Finish what Phase A started: every wizard section that has a workbook counterpart renders the exact workbook tab via `WorkbookTabView`, off the same `DealData` from `useProjectDealData`. No parallel `buildWizardReports` pipeline left for migrated surfaces.

## Phase B — Core statements (finish)

1. **TrialBalanceSection** — swap the bespoke grid for `<WorkbookTabView tabId="trial-balance" dealData={dealData} onDataChange={...} />`. Keep the existing chrome (upload, AI helpers, status banners). Edits flow through `onDataChange` → `updateWizardData` so the workbook grid re-derives.
2. **NWCFCFSection** — remove the leftover `SpreadsheetReportViewer` block. Render three `WorkbookTabView`s stacked: `working-capital`, `nwc-analysis`, `free-cash-flow`. Keep dashboard cards + `DealParametersCard` on top.
3. **Verify** any `GenericReportSection` callsite for `incomeStatementDetailed`, `balanceSheetDetailed`, `isbsReconciliation`, `salesDetail`, `cogsDetail`, `operatingExpenses`, `otherExpenseIncome` is passing `dealData` + `reportType`. Fix WizardContent callsites that still pass legacy `data` only.

## Phase C — QoE & DD Adjustments

4. **DDAdjustmentsSection** — replace bespoke grid with three stacked `WorkbookTabView`s: `dd-adjustments-1`, `dd-adjustments-2`, `qoe-analysis`. Keep the existing "add/edit adjustment" dialog; on save call `updateWizardData` so the workbook builders re-render.

## Phase D — Working capital & cash (remaining)

5. **ProofOfCashSection** → `<WorkbookTabView tabId="proof-of-cash" />`. Keep bank-reconcile panel + dashboard.
6. **Cash / OCA / OCL / Free Cash Flow** GenericReportSection callsites already covered by Phase B step 3 — confirm.

## Phase E — Subledgers & supplements

7. Swap to `WorkbookTabView` in:
   - ARAgingSection → `ar-aging`
   - APAgingSection → `ap-aging`
   - FixedAssetsSection → `fixed-assets`
   - PayrollSection → `payroll`
   - TopCustomersSection → `top-customers`
   - TopVendorsSection → `top-vendors`
   - SupplementarySection → `supplementary`
   - WIP section (if mounted) → `wip-schedule`

   Each keeps its current chrome (title, description, dashboard cards if any, upload panel). Body becomes the workbook tab.

## Phase F — Cleanup

8. Delete bespoke render helpers in `src/lib/wizardReportBuilder.ts` that are no longer referenced by any wizard section.
9. If `buildWizardReports` is still consumed elsewhere (ExportCenter, PDF builder), leave it intact — only remove the per-section render code the wizard used.
10. Remove now-dead props (`data`, `fcfData`, etc.) from migrated section signatures and their WizardContent callsites.

## Verification (after each phase)

- Open `fa0768ca-96f9-4ded-b498-f64ca5be3ede`. For every migrated section, open the matching workbook tab side-by-side and confirm subtotals + check rows match.
- `bunx vitest run src/lib/workbook-grid-builders.test.ts`.
- Confirm build is green.

## Notes

- Editable tabs (TB, DD Adjustments) keep their dialogs/edit affordances — `WorkbookTabView` already forwards `onDataChange`, and the underlying tab components handle inline editing the same way the workbook page does.
- Wizard-only analytics columns (LTM/YTD pivots) that don't exist in the workbook tab will be added to the workbook builder rather than dropped — keeps a single source while preserving info.
- No DB or schema changes. Frontend-only refactor.
