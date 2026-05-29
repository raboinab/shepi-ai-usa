# Fix upload verification and balance sheet validation

## What is actually happening

This is not just a CSV-vs-PDF issue. The live project shows two separate problems:

1. **Document-type verification fails open for CSV/Excel.**
   The `validate-document-type` logs show CSV files are being sent to the AI gateway as an unsupported file part, then the function returns a permissive “proceeding with upload” result. That means CSV/XLSX uploads are effectively not being checked before upload.

2. **Balance Sheet validation is deriving the comparison totals incorrectly.**
   For project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`, the uploaded balance sheet extracts correctly:
   - Assets: `$2,893,672`
   - Liabilities: `$114,589`
   - Equity: `$2,779,084`

   But the Trial Balance-derived side is wrong because the edge function currently buckets accounts using brittle text matching and keeps equity signed negative. It is also classifying some obviously wrong accounts into BS buckets, e.g. `Landscaping Services:Job Materials` marked as `Equity`, `Billable Expense Income` marked as `Current liabilities`, and `Accounts Payable` marked as asset-like due substring matching.

3. **Balance Sheet coverage is misleading.**
   Optional balance sheet verification is being treated like monthly coverage, so a single point-in-time Balance Sheet with no period dates displays `0% coverage`. For a Balance Sheet verification document, that should be a point-in-time/as-of check, not full monthly coverage.

## Implementation plan

### 1. Make document-type verification read CSV/XLSX directly
Update `supabase/functions/validate-document-type/index.ts`:
- For CSV/TXT: decode base64 to text and classify using the first rows.
- For XLS/XLSX: parse with `xlsx`, convert the first sheet rows to text, then classify.
- Keep image validation for image uploads.
- Stop treating unsupported/failed validation as a successful validation.
- Add a hard COA guardrail: if the user selected `chart_of_accounts` and the content looks like `trial_balance`, `balance_sheet`, `income_statement`, or `general_ledger`, return `isValid: false`.

### 2. Make the upload UI respect failed validation
Update `src/components/wizard/sections/ChartOfAccountsSection.tsx` and `src/components/wizard/sections/DocumentUploadSection.tsx`:
- Show the mismatch dialog whenever `isValid === false`, even if no `suggestedType` is returned.
- Remove the silent “change type then still upload as the wrong type” behavior.
- Keep an explicit “upload anyway” override, but make it clearly intentional rather than the default path.

### 3. Fix Balance Sheet derived totals
Update `supabase/functions/validate-financial-statement/index.ts`:
- For Balance Sheet validation, derive totals from the latest Trial Balance period using normalized accounting signs:
  - Assets = positive asset balances.
  - Liabilities = absolute value of liability balances.
  - Equity = absolute value of equity balances.
- Prefer structured account classification fields where available, and avoid substring traps like `Accounts Payable` being counted as receivable/asset because it contains “payable” or `Billable Expense Income` being treated as a liability.
- Add sanity metadata to the result when TB-derived totals are not internally balanced so the UI can explain that the issue is in the source TB/COA mapping, not necessarily the uploaded Balance Sheet.

### 4. Fix Balance Sheet verification coverage
Update `src/components/wizard/sections/DocumentUploadSection.tsx`:
- Change `balance_sheet` coverage from monthly to point-in-time.
- If a balance sheet upload has no explicit `period_start`/`period_end`, treat it as a verification snapshot instead of showing `0% coverage` across Jan-23 to Dec-25.

### 5. Improve the validation card wording
Update `src/components/wizard/shared/FinancialStatementValidationCard.tsx`:
- When uploaded Balance Sheet is balanced but TB-derived totals are not, show a clearer message: “Uploaded file appears balanced; Trial Balance/COA mapping needs review.”
- Keep the variance table, but make it clear whether the variance is caused by source mapping/sign normalization versus a true seller balance sheet mismatch.

## Files to touch

- `supabase/functions/validate-document-type/index.ts`
- `supabase/functions/validate-financial-statement/index.ts`
- `src/components/wizard/sections/ChartOfAccountsSection.tsx`
- `src/components/wizard/sections/DocumentUploadSection.tsx`
- `src/components/wizard/shared/FinancialStatementValidationCard.tsx`

## Validation after implementation

- Re-run the validation for document `498a13c9-872c-4c8d-b4b8-eb09657e600c`.
- Confirm the Balance Sheet verification no longer reports misleading `0% coverage`.
- Confirm CSV/XLSX wrong-slot uploads now produce a mismatch warning instead of silently passing.
