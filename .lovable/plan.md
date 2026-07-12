## What's changing and why

The upload form for Balance Sheet, Income Statement, and Cash Flow currently shows a Month + Year picker labeled "Reporting Period". It was added so we could show a coverage timeline before the file was parsed. It's confusing — every other document category (bank statement, credit card, tax return, payroll, GL, journals, AR/AP, vendor/customer summary, debt/fixed asset schedules) already uploads without asking the user to label a period, and the auto-detect edge function we added last turn (`detect-financial-statement-period`) now fills `period_start` / `period_end` from the file itself.

For the sandbox project `fa0768ca-…`, every document was uploaded through the paths that don't ask for a period — that's why you didn't hit this UI before. The FS-period picker only appears when `account_type` is `balance_sheet`, `income_statement`, or `cash_flow`.

## Scope

**Remove from the upload form** (`src/components/wizard/sections/DocumentUploadSection.tsx`):
- The "Reporting Period (optional)" Month + Year selector block that renders when `isFsPeriodType(type.value)` is true (~lines 2468-2510).
- The `selectedFsPeriod` state and its use in the upload payload (~lines 1135-1140, 474).
- The post-upload "no period selected" toast/prompt (~line 1662).

**Keep** (so downstream analytics still get dates):
- `detect-financial-statement-period` auto-detect fires on every BS/IS/CF upload.
- The "Detect" button on the documents table for any row that ended up with no period.
- The "Set manually" backfill dialog as an escape hatch when auto-detect fails.
- `period_start` / `period_end` columns on `documents` (many downstream functions still read them: `embed-project-data`, `validate-financial-statement`, `processed-data-*`, `insights-chat`, `mcp`, coverage timeline, POC bank data, etc.).

**No backend changes.** No migrations. No edge function edits.

## Result

- Uploading a Balance Sheet / Income Statement / Cash Flow works exactly like uploading a bank statement: pick the file, pick the category, upload. Done.
- Auto-detect runs in the background and fills the period.
- If auto-detect can't find the period, the row shows Detect + Set manually buttons in the documents table — same UX as today, just no upfront gate.

## Note on "when this was introduced"

I don't have git blame in this session, but the manual FS-period selector predates the auto-detect edge function we added last turn. Auto-detect made it redundant; this change finishes that migration.
