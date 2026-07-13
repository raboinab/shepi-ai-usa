## Problem

Journal Entries, General Ledger, and Proof of Cash all have visible "Re-run analysis" buttons in the wizard. The three financial statement sections — **Balance Sheet**, **Income Statement**, and **Cash Flow** (and the combined Financial Reports view) — do not. Today the only way to re-trigger `process-statement` / `detect-financial-statement-period` / `validate-financial-statement` for those docs is to scroll back to Document Upload and click a small per-document button (or re-upload the file).

## Goal

Add a "Re-run analysis" control on each of the BS / IS / CF report pages that re-processes the uploaded document(s) for that statement type and refreshes the on-page data, matching the UX pattern already used for JE and GL.

## Scope

**In:**
- Add a re-run button on `BalanceSheetSection`, `IncomeStatementSection`, and the Cash Flow tab of `FinancialReportsSection`.
- Button re-invokes the existing pipeline for the latest uploaded document of that type:
  1. `process-statement` (re-extract)
  2. `detect-financial-statement-period` (re-tag periods)
  3. `validate-financial-statement` (re-validate against Trial Balance)
- After completion, refresh the section's data (reload deal data + validation results) and toast success/failure.
- Empty state (no document uploaded yet): keep current "no data" card, add an inline hint pointing to Document Upload — no re-run button since there's nothing to re-run.

**Out:**
- No changes to the edge functions themselves.
- No changes to the underlying calculation/grid logic.
- No new admin/service-role path — uses the same user-auth invoke pattern as the existing per-document button.

## Implementation

1. **Extract the re-run flow into a small hook** `src/hooks/useRerunFinancialStatement.ts`:
   - Input: `projectId`, `docType` ('balance_sheet' | 'income_statement' | 'cash_flow')
   - Looks up the latest `documents` row for that type
   - Calls the 3 edge functions in sequence, with toast + loading state
   - Exposes `{ rerun, running }` plus an optional `onComplete` callback for the caller to refresh local state.

2. **Reuse `AnalysisRunButton`-style UI** — add a compact `<RerunFinancialStatementButton>` (top-right of the section header) that shows:
   - `Re-run analysis` when a doc + data exist
   - Disabled with tooltip "Upload a document first" when no doc exists

3. **Wire into three sections:**
   - `src/components/wizard/sections/BalanceSheetSection.tsx`
   - `src/components/wizard/sections/IncomeStatementSection.tsx`
   - `src/components/wizard/sections/FinancialReportsSection.tsx` (one button per tab: P&L, BS, CF)
   
   Each passes an `onComplete` that re-fetches deal data / validation results so the grid updates without a page reload.

4. **No DB / migration / edge function changes.**

## Files touched

- `src/hooks/useRerunFinancialStatement.ts` (new)
- `src/components/wizard/shared/RerunFinancialStatementButton.tsx` (new)
- `src/components/wizard/sections/BalanceSheetSection.tsx`
- `src/components/wizard/sections/IncomeStatementSection.tsx`
- `src/components/wizard/sections/FinancialReportsSection.tsx`
