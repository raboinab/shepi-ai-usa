## Goal

Wizard = Workbook, cell-for-cell. Workbook wins on every conflict. Achieved by making the wizard render the **same grid builders** the workbook uses, from the **same `DealData`** object — eliminating the parallel `buildWizardReports` pipeline that keeps drifting.

## Root cause (recap)

- Workbook: `projectToDealData()` → `loadDealDataWithPriorBalances()` → `TAB_GRID_BUILDERS[tabId](dealData)` → `<SpreadsheetGrid>`.
- Wizard: `projectToDealData()` (no prior-balance enrichment) → `buildWizardReports()` (separate format) → bespoke per-section components.

Two pipelines, two reformat steps, guaranteed drift. We just patched one section (TB) twice. There are ~20 more pairs.

## Solution

One render path for financial data. Wizard sections keep their chrome (uploads, AI helpers, status banners, editing dialogs) but the **grid inside each section is the workbook tab**.

### Building blocks

1. **`src/hooks/useProjectDealData.ts`** — single hook that runs `projectToDealData` + `loadDealDataWithPriorBalances`. Used by `WizardContent.tsx` and `Workbook.tsx` so they can't diverge.
2. **`src/components/workbook/WorkbookTabView.tsx`** — `<WorkbookTabView tabId="..." dealData={...} />` looks up `TAB_GRID_BUILDERS[tabId]` and renders `<SpreadsheetGrid>`. One component, every section uses it.
3. **Section migrations** — each wizard section's body becomes `<WorkbookTabView tabId="..." />` wrapped in the existing wizard chrome.
4. **Retire `buildWizardReports`** for migrated consumers; keep it only where ExportCenter still depends on it, then remove entirely.

### Editing

- **Trial Balance / DD Adjustments** keep edits. Edits write back through existing `updateWizardData`; the displayed grid is still the workbook grid (re-derived after save).
- All other sections are read-only display today and stay that way.

### Wizard-only extras

If a wizard section currently shows analytics columns the workbook tab doesn't (LTM, YTD pivots, etc.), I **extend the workbook builder** to include them rather than dropping them from the wizard. That preserves info and still satisfies "they match" — because both surfaces use the extended builder.

## Section mapping

| Wizard section | Workbook tab |
|---|---|
| TrialBalanceSection | `trial-balance` |
| IncomeStatementSection | `income-statement` |
| BalanceSheetSection | `balance-sheet` |
| GenericReportSection("incomeStatementDetailed") | `is-detailed` |
| GenericReportSection("balanceSheetDetailed") | `bs-detailed` |
| GenericReportSection("isbsReconciliation") | `is-bs-reconciliation` |
| GenericReportSection("salesDetail" / "cogsDetail" / "operatingExpenses" / "otherExpenseIncome") | `sales` / `cogs` / `opex` / `other-expense` |
| GenericReportSection("cashAnalysis" / "otherCurrentAssets" / "otherCurrentLiabilities" / "freeCashFlow") | `cash` / `other-current-assets` / `other-current-liabilities` / `free-cash-flow` |
| NWCFCFSection | `working-capital` + `nwc-analysis` + `free-cash-flow` |
| DDAdjustmentsSection | `dd-adjustments-1` + `dd-adjustments-2` + `qoe-analysis` |
| ProofOfCashSection | `proof-of-cash` |
| ARAgingSection / APAgingSection | `ar-aging` / `ap-aging` |
| FixedAssetsSection | `fixed-assets` |
| PayrollSection | `payroll` |
| TopCustomersSection / TopVendorsSection | `top-customers` / `top-vendors` |
| SupplementarySection | `supplementary` |

No counterpart, left as-is: Project Setup, Chart of Accounts, Onboarding, Document Upload, Reclassifications, Journal Entries, Material Contracts, Inventory, Flagged Transactions, QoE Summary, QoE Executive Summary, discovery/insights cards, Export Center, Analysis Reports.

## Phasing

I'll ship incrementally and verify each phase on project `fa0768ca-96f9-4ded-b498-f64ca5be3ede` before the next.

- **Phase A — Foundation.** Hook + `WorkbookTabView`; rewire `WizardContent` and `Workbook` to the hook. No visible change.
- **Phase B — Core statements.** TB, IS, BS, IS Detailed, BS Detailed, IS↔BS Reconciliation.
- **Phase C — QoE & Adjustments.** DD Adjustments + QoE Analysis grids; keep edit dialog.
- **Phase D — Working capital & cash.** NWC/FCF, Proof of Cash, Cash, OCA, OCL.
- **Phase E — Subledgers & supplements.** AR/AP aging, Fixed Assets, Payroll, Top Customers/Vendors, Sales/COGS/OpEx/Other Expense, Supplementary, WIP.
- **Phase F — Cleanup.** Remove `buildWizardReports` and dead legacy section render code.

## Verification (every phase)

1. Open wizard section + workbook tab side-by-side on `fa0768ca…`.
2. Spot-check 3 rows × 3 periods + every subtotal/check row. Must match.
3. `bunx vitest run src/lib/workbook-grid-builders.test.ts`.
4. Confirm build is green.

## Starting now with Phase A.
