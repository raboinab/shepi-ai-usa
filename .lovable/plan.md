## Goal

Make uploaded Fixed Asset Registers flow into the workbook/PDF automatically — same pattern we use for payroll — so the wizard import click is no longer required for assets to appear. Wizard import still works for editing/overriding.

## How it works today

1. User uploads a Fixed Asset Register on the wizard.
2. `process-fixed-assets` edge function parses it and writes a `processed_data` row (`data_type='fixed_assets'`) with `data.extractedData.assets[]`.
3. Workbook/PDF read from `dealData.fixedAssets`, which `projectToDealAdapter` populates **only from `wizard_data.fixedAssets`**.
4. `wizard_data.fixedAssets` is only filled when the user clicks "Import" in `FixedAssetsImportDialog` inside the wizard.

So: upload alone → invisible in workbook. Upload + click Import in wizard → visible everywhere.

For project `fa0768ca…` I verified you did click Import — both `processed_data` and `wizard_data.fixedAssets` show 5 assets, so the Fixed Assets tab will render.

## What changes (Option A)

Mirror the payroll fallback pattern inside `loadDealDataWithPriorBalances`:

1. **New helper** `src/lib/fixedAssetsFallback.ts`
   - `fetchLatestFixedAssetsFallback(projectId)` — selects the most recent `processed_data` row where `data_type='fixed_assets'`, maps `data.extractedData.assets[]` into `FixedAssetEntry[]` (reusing the same field aliases as `adaptFixedAssets`, plus `accumDepreciation` and `nbv = cost - accumDepreciation` when missing). Returns `[]` if nothing found.

2. **Enrichment in `loadDealDataWithPriorBalances`** (`src/lib/projectToDealAdapter.ts`)
   - Add `fetchLatestFixedAssetsFallback(project.id)` to the existing `Promise.all` next to payroll fallback.
   - After resolving: `if (dealData.fixedAssets.length === 0 && fallback.length > 0) dealData.fixedAssets = fallback;`
   - Critically: only merge when `wizard_data.fixedAssets` is empty, so a user who imported and then hand-edited in the wizard never gets overwritten by a stale upload.

3. **No UI changes.** `FixedAssetsTab`, `BSDetailedTab`, the PDF slide, and the XLSX builder all already read `dealData.fixedAssets` — they light up automatically.

4. **Wizard import dialog stays.** It remains the canonical way to edit/override and to persist into `wizard_data` (which beats the fallback).

## Out of scope

- No changes to extraction, edge function, or wizard import UI.
- No live realtime subscription for assets (payroll has one because of multiple consumers; here a page refresh after upload is sufficient and matches everything except payroll). Can be added later if needed.

## Validation

- Existing project `fa0768ca…` still renders 5 assets (wizard path).
- Create a quick test project: upload a fixed asset CSV, do NOT click Import, open `/project/:id/workbook` → Fixed Assets tab should now show rows.
- Re-run `src/lib/workbook-grid-builders.test.ts` smoke suite.

