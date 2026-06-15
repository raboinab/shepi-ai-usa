## Goal

Make the balance sheet correct and GAAP-presented across all three surfaces (web tab, XLSX, PDF). Eliminate the tautological balance check, add the missing non-current subtotals, and make the web tab consistent with the export pipeline.

## Scope correction

Earlier diagnosis said `slideRenderer.ts:112` (`data: {}`) breaks the PDF. It does not — `createDataInjector` in `src/lib/pdf/index.ts` (lines 195-230) wraps every slide and merges `computedReports.balanceSheet.rawData` into `data` before render. The PDF renders real numbers when `computedReports` is populated; dashes only show when the report is missing/empty. We will leave that wiring alone but tighten the slide fallback so it matches the real grid shape.

## Changes

### 1. Real balance check (kills the tautology)

In `src/lib/calculations.ts`, `calcTotalLiabilitiesAndEquity` already exists and returns `totalLiab + totalEquity` where `totalEquity = -sumByLineItem("Equity", p)`. Use this — not `calcTotalAssets` — as the L&E rollup. The check then becomes a true `Assets − (Liabilities + Equity)` test that can actually fail when the TB doesn't tie.

Apply in both:
- `src/components/workbook/tabs/BalanceSheetTab.tsx` — `total-le` row uses `calcTotalLiabilitiesAndEquity`; `check` row computes real `assets − l&e` and sets `checkPassed` from the result instead of hardcoding `true`.
- `src/lib/workbook-grid-builders.ts::buildBalanceSheetGrid` — same: TOTAL L&E row uses `calcTotalLiabilitiesAndEquity`, plus add a Balance Check row (currently the grid builder has no check at all).

Equity line also needs to switch to `calcTotalEquity` (i.e., `-sumByLineItem("Equity", p)`) instead of the current `assets + liabilities` derivation, otherwise equity is force-plugged and the check is still tautological.

### 2. GAAP non-current subtotals

Add helpers in `src/lib/calculations.ts`:
- `calcTotalNonCurrentAssets(tb, p) = sumByLineItem(tb, "Fixed assets", p) + sumByLineItem(tb, "Other assets", p)`
- `calcTotalNonCurrentLiabilities(tb, p) = sumByLineItem(tb, "Long term liabilities", p)` (single line today, but named subtotal for presentation parity and future-proofing).

Insert `subtotal` rows in both `BalanceSheetTab.tsx` and `buildBalanceSheetGrid`:
- After Fixed Assets + Other Assets → "Total Non-Current Assets"
- After Long Term Liabilities → "Total Non-Current Liabilities"

Order becomes the standard classified-BS shape:
```text
ASSETS
  Cash & Equivalents
  Accounts Receivable
  Other Current Assets
  Total Current Assets
  Fixed Assets
  Other Assets
  Total Non-Current Assets
  TOTAL ASSETS

LIABILITIES
  Current Liabilities
  Other Current Liabilities
  Total Current Liabilities
  Long Term Liabilities
  Total Non-Current Liabilities
  Total Liabilities

EQUITY
  Total Equity
  TOTAL LIABILITIES & EQUITY
  Balance Check (Assets − L&E)
```

### 3. Web tab: use reclass-aware sums

Switch `BalanceSheetTab.tsx` from `calc.sumByLineItem` to `calc.sumByLineItemWithReclass(tb, dealData.reclassifications ?? [], lineItem, p)` so the on-screen tab matches the XLSX/PDF builders. Without this, any user reclassification silently diverges between screen and export.

### 4. Slide fallback parity

In `src/components/pdf-slides/BalanceSheetSlide.tsx`, update the `hasData = false` placeholder rows to match the real grid shape (the new GAAP order above) so a missing-data render and a real render look structurally identical. Also widen `BOLD_KEYS` to keep "non-current" subtotals bolded.

### 5. (Out of scope, flagged) BS Detailed

`buildBSDetailedGrid` is a separate, more granular grid — it likely already needs the same treatment, but I'll touch only the summary surfaces in this change and call out the BS Detailed pass as a follow-up so this PR stays reviewable.

## Verification

- Use the existing demo deal: the balance check should show 0 (or a small rounding number) when the TB ties; deliberately edit one TB entry in mock data to confirm the check turns red.
- Regenerate the demo PDF + XLSX via `bun run scripts/generate-demo-pdf.ts` and `bun run scripts/generate-demo-workbook.ts`; visually QA pages of the PDF (skill/pdf workflow) to confirm subtotals render and the slide table doesn't overflow.
- Spot-check that columns still align after the two new subtotal rows (the table is column-driven so this is low risk, but worth eyeballing).

## Technical notes

- `calcTotalLiabilities` in `calculations.ts` returns a negative number (credit convention). `calcTotalLiabilitiesAndEquity = calcTotalLiabilities + calcTotalEquity`, where `calcTotalEquity = -sumByLineItem("Equity", p)`. For display in the grid, the `nbc` helper already negates, so the L&E row should be wired through `nbc(...)` (or its existing sign convention) consistently with how Total Liabilities is displayed. Verify sign once during implementation.
- No schema changes. No new dependencies.
- Memory rule respected: nothing here implies CPA attestation; this is presentation + arithmetic correctness only.
