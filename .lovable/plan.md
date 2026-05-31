# Make uploaded payroll data flow into the Payroll section + Workbook

## What's actually happening

For project `fa0768ca-...`, the latest payroll upload **succeeded end-to-end**:

- `process-payroll-document` parsed the XLSX (4 sheets, 32,849 chars)
- Extracted 6 line items with high confidence
- Stored them in `processed_data` with `data_type = 'payroll'`

But both surfaces still look empty because the extracted data is **never fed into the rendering paths**:

1. **Wizard → Payroll section** (`src/components/wizard/sections/PayrollSection.tsx`)
   - Reads `data.rawData` (only populated by a workbook sync) for summary cards
   - Renders `<WorkbookTabView tabId="payroll" dealData={dealData} />`, which calls `buildPayrollGrid(dealData)`
   - `buildPayrollGrid` falls back to `dealData.payrollFallback` when TB has nothing classified as Payroll & Related — but **nothing sets `payrollFallback`** on the live `dealData` (it's only assembled inside `ExportCenterSection` at export time)
2. **Documents → Payroll Reports tile** — the `PayrollInsightsCard` is already wired through the realtime subscription, so this should appear after a fresh upload. If both surfaces are empty after a page reload, the realtime fetch is racing the render — `fetchPayrollAnalysis` runs on mount but only sets state if rows exist.

## Goal

When a payroll file is extracted (or already exists in `processed_data`), automatically populate the Workbook's Payroll tab so:
- Wizard Payroll section's summary cards + WorkbookTabView grid show real numbers
- Documents page insights card shows up reliably on reload
- Workbook page's Payroll tab also lights up — no manual "sync" needed
- Export Center continues to work unchanged

## Approach

Lift the existing `payrollFallback` assembly out of `ExportCenterSection` into a small shared helper, then inject it into `dealData` as soon as it's loaded for the project.

### 1. New helper: `src/lib/payrollFallback.ts`

- `buildPayrollFallbackFromProcessedData(record)` — takes a `processed_data` row's `data.extractedData` and returns a `PayrollFallbackData` object (the exact mapping currently inlined at `ExportCenterSection.tsx:432-445`).
- `fetchLatestPayrollFallback(projectId)` — queries `processed_data` for the newest `data_type='payroll'` row and returns the fallback (or `null`).

### 2. Wire it into `useProjectDealData` (`src/hooks/useProjectDealData.ts`)

After the initial `dealData` is loaded, fire `fetchLatestPayrollFallback(projectId)` and merge the result into state:
```
setDealData(prev => prev ? { ...prev, payrollFallback } : prev)
```
Also subscribe to `processed_data` inserts for this project (filtered by `data_type='payroll'`) so a fresh upload re-merges without a page reload.

This single change makes the Payroll WorkbookTabView, the standalone Workbook page, and any other consumer of `dealData` render the data automatically.

### 3. Update `PayrollSection` summary cards (`src/components/wizard/sections/PayrollSection.tsx`)

Today `extractMetrics` only reads `data.rawData`. Extend it (or add a second path) so when `dealData.payrollFallback` is present it computes Total Payroll / Tax Rate / Benefit Rate / Owner Comp from the fallback categories. The grid below already renders via `WorkbookTabView` once step 2 lands.

### 4. Simplify `ExportCenterSection`

Replace the inlined block at lines 431-445 with `buildPayrollFallbackFromProcessedData(payrollData)` so we have one source of truth.

### 5. Quick UX hint

In `PayrollSection`, if `payrollFallback` is being used (no TB Payroll classification yet), show a small muted note: *"Showing extracted payroll from your uploaded report. Classify Trial Balance accounts as 'Payroll & Related' to use TB data instead."* — clarifies why the data appeared without a sync.

## Out of scope

- No DB schema changes
- No edge-function changes (process-payroll-document already stores the right shape)
- Not changing the cross-validation flag logic
- Not touching the workbook grid builder itself — the fallback path already exists, we're just feeding it

## Files touched

- `src/lib/payrollFallback.ts` (new)
- `src/hooks/useProjectDealData.ts`
- `src/components/wizard/sections/PayrollSection.tsx`
- `src/components/wizard/sections/ExportCenterSection.tsx` (refactor only)

## Verification

1. Reload the project — Payroll wizard section shows summary cards + populated grid sourced from the existing `processed_data` row
2. Workbook page → Payroll tab renders the same grid
3. Re-upload a payroll XLSX — UI updates without manual refresh via realtime
4. Classify a TB account as "Payroll & Related" → TB path takes precedence over fallback (existing `buildPayrollGrid` logic)
