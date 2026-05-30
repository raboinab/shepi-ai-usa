## Goal

Introduce a single **NWC Method** toggle in Shepi. The user picks one of five methods, and every downstream calculation (Working Capital tab, NWC Analysis tab, Deal Parameters peg, Free Cash Flow change-in-NWC, PDF Working Capital slide, and workbook XLSX export) uses that method.

The five methods follow the taxonomy you laid out:

1. **Reported** — Total Current Assets − Total Current Liabilities (book)
2. **Operating** — excludes cash, short-term debt, income taxes payable
3. **Transaction** — Operating with configurable inclusions/exclusions per LOI
4. **Normalized** — Transaction + user-entered normalization adjustments (seasonality, one-time items)
5. **Component** — AR + Inventory + Prepaids − AP − Accrued Expenses − Deferred Revenue

## Scope

### 1. Data model

- Add `nwcMethod: 'reported' | 'operating' | 'transaction' | 'normalized' | 'component'` to `DealParameters` in `src/lib/nwcDataUtils.ts`. Default `'operating'`.
- Add `transactionInclusions` (record of line-item keys → boolean) for the Transaction method's exclude toggles (cash, short-term debt, income taxes payable, owner-related balances).
- Add `normalizationAdjustments: Array<{ id, label, periodValues: Record<periodId, number> }>` for Normalized method.
- Persist via existing `dealParameters` save path (no schema migration — these live in the same `dealParameters` JSON column already used).

### 2. Calculation layer (`src/lib/calculations.ts`)

Add one entry point: `calcNWCByMethod(entries, periodId, method, params) → number`. Internally it composes the existing primitives:

- `reported` → `calcNetWorkingCapital`
- `operating` → `calcNWCExCash` minus short-term debt and income taxes payable buckets (read from `Other current liabilities` sub-rows when tagged; fall back to `calcNWCExCash` if not tagged)
- `transaction` → operating with user `transactionInclusions` applied
- `normalized` → transaction + sum of `normalizationAdjustments[period]`
- `component` → AR + Inventory + Prepaids − AP − Accrued − Deferred Revenue, using COA sub-line-item tags

Component requires sub-tags that the current 5-bucket COA does not expose individually. **Decision needed (see Open Questions):** introduce sub-line-item tags or treat `component` as currently equivalent to `operating` until sub-tags exist.

### 3. UI — Method selector

New component `src/components/wizard/shared/NWCMethodSelector.tsx`: segmented control with the 5 options, short description tooltip per method, and a "Configure" affordance that opens:

- **Transaction method:** checkbox list of items to exclude (Cash, Short-term debt, Income taxes payable, Owner loans).
- **Normalized method:** editable table of adjustment rows × periods (replaces the current free-text "Additional NWC adjustments" row in the NWC Analysis grid).

Place the selector at the top of `NWCFCFSection.tsx`, above the summary cards.

### 4. Downstream wiring

- **Summary cards** in `NWCFCFSection.tsx`: "Current NWC" reflects the active method; add a small method badge.
- **WorkingCapitalTab.tsx**: replace the hardcoded "Net Working Capital" / "NWC ex. Cash" rows with a single "Net Working Capital ({method})" row and the % of Revenue ratio using that value.
- **NWCAnalysisTab.tsx**: re-label the "reported → adjusted" flow to match the selected method, and route the "Normal NWC adjustments" block to the Normalized adjustments store.
- **DealParametersCard.tsx**: peg averages (T3M / T6M / T12M) are recomputed against the selected NWC method via `calcNWCByMethod`, not from the legacy `extractNWCMetrics` scraper.
- **FreeCashFlowTab.tsx**: "Change in NWC" line uses the selected method.
- **PDF (`src/lib/pdf/pdfWorker.ts`) + workbook XLSX builders**: Working Capital slide / tab header shows the method name and uses its values; narratives reference the chosen definition.

### 5. Tests

Add unit tests in `src/lib/nwcDataUtils.test.ts` and `calculations.test.ts` covering each method against a fixed mock trial balance, plus a regression test that switching method does not mutate trial balance data.

## Open questions

1. **Component method line items.** The current Chart of Accounts only has `Cash / AR / Other current assets / Current liabilities / Other current liabilities`. Component requires AR / Inventory / Prepaids / AP / Accrued / Deferred Revenue separately. Two options: (a) add sub-line-item tags to the COA so users classify accounts at a finer grain (bigger change, touches Trial Balance import / COA mapping UI); or (b) ship Component as "equivalent to Operating" with a "Requires sub-classification — coming soon" badge until the COA is expanded.
2. **Method scope.** Should the chosen method also drive the **homepage / marketing copy and guides** (e.g. `/guides/WorkingCapitalAnalysis`), or only the in-app calculations? I'd recommend in-app only for this pass; we can update the guide separately.
3. **Demo PDF/XLSX.** After this change the demo assets in `/public/demo/` will be out of date — should I regenerate them as part of this work (per the project memory note about `scripts/generate-demo-pdf.ts` / `generate-demo-workbook.ts`)?

## Out of scope

- No changes to CPA review workflow, DFY messaging, or marketing claims.
- No new database tables; reuses existing `dealParameters` JSON.
- No CPA-attestation-style language added to the report.
