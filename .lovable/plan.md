## What I found

- The payroll extraction itself is working: `processed_data` has the latest payroll row for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`, with 7 extracted line items across salary/wages, owner compensation, and payroll taxes.
- The edge function logs show successful storage, not a model failure.
- The likely break is frontend wiring: the Project/Wizard and Workbook pages build `DealData` from `projects.wizard_data`, but the uploaded payroll register lives in `processed_data`. The helper that merges `processed_data` payroll fallback exists, but the shared hook using it is not currently used anywhere.

## Plan

1. **Centralize payroll fallback enrichment**
   - Add payroll fallback loading into `loadDealDataWithPriorBalances(project)` so every caller that builds `DealData` gets the latest payroll extraction from `processed_data`.
   - Keep the existing `projectToDealData()` synchronous adapter unchanged for places that intentionally need a pure transform.

2. **Fix the wizard payroll section**
   - Update `WizardContent`’s async enrichment path so the Payroll section receives `dealData.payrollFallback` after the latest processed payroll record loads.
   - This should make the summary cards, source badges, workbook payroll grid, and register detail render off the extracted payroll register.

3. **Fix the standalone workbook page**
   - Because `Workbook.tsx` already uses `loadDealDataWithPriorBalances`, the centralized enrichment should make `/project/:id/workbook` payroll fallback work without duplicating code.

4. **Clean up unused path**
   - Remove or simplify the unused `useProjectDealData` hook if it becomes redundant, or leave it only if another near-term caller needs the live insert subscription.

5. **Validate**
   - Re-check the payroll record query and run targeted tests/search validation for the affected payroll fallback paths.
   - Confirm there are no OpenAI/Gemini model references reintroduced in the payroll function path.