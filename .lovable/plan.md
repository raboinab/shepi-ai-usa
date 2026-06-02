# Fix Period Coverage for Balance Sheet, Income Statement, Cash Flow

## Root cause

The Period Coverage timeline for the three Verification docs is driven entirely by `documents.period_start` / `documents.period_end` (see `calculatePeriodCoverage` in `src/lib/periodUtils.ts`). For project `fa0768ca…` every FS doc in the DB has both columns NULL:

```
balance_sheet      1 doc   period_start: 0 / period_end: 0
income_statement   1 doc   period_start: 0 / period_end: 0
cash_flow          1 doc   period_start: 0 / period_end: 0
bank_statement    72 docs  period_start:72 / period_end:72  ← works
```

In `DocumentUploadSection.tsx` (~line 1009-1033) the insert only assigns period dates for `tax_return` (from the tax-year selector) and for the monthly customer/vendor summaries (parsed from file). For `balance_sheet` / `income_statement` / `cash_flow` we insert with `period_start: null, period_end: null` and never update them later — the validation edge function reads them but never writes them back. Result: the timeline always shows 0% covered.

So switching `balance_sheet` to `'monthly'` last round did make the UI render correctly — there is just nothing to render against.

## Fix

Mirror the tax-return pattern: collect the reporting period at upload time for the three FS types, then offer a one-click backfill for FS docs already in the DB.

### 1. Period picker at upload (FS types only)

In the upload panel for `balance_sheet` / `income_statement` / `cash_flow`:

- Add a small "Reporting period" selector above the dropzone with Month + Year selects, defaulted to the most recent uncovered month for that doc type (derived from `effectivePeriods` ∖ already-covered).
- Allow uploading multiple files in one go; each file gets the same selected period (typical case is one statement per month). Power-user case (a single PDF spanning many months) is out of scope — they can split or use QB sync.
- When `docType ∈ {balance_sheet, income_statement, cash_flow}`, set on insert:

```ts
periodStart = `${year}-${MM}-01`
periodEnd   = lastDayOfMonth(year, MM)  // ISO yyyy-mm-dd
```

- Block the upload (toast) if the user hasn't picked a period, same UX we use today for the tax-year gate.

### 2. Inline backfill for existing docs

Each FS doc row in the doc list (`~line 2491-2522`) already shows the period dates when present. When `period_start` is null and `account_type` is one of the three FS types, render a "Set period" link that opens a tiny month/year popover and patches the document row:

```ts
supabase.from('documents').update({ period_start, period_end }).eq('id', doc.id)
```

This unblocks the three orphaned FS docs already in the user's project without re-uploading.

### 3. No backend / validation changes

`validate-financial-statement` already accepts `periodStart` / `periodEnd` from the doc row and uses them to derive the TB slice — it will start receiving real values automatically. No edge function, schema, or `processed_data` changes.

## Verification

1. On `/project/fa0768ca…` → Documents → Verification → Balance Sheet, click "Set period" on the existing doc, pick e.g. Mar 2024. Timeline flips Mar 2024 green; coverage % updates.
2. Upload a new P&L PDF for Apr 2024 with the new picker. Timeline shows Apr 2024 green immediately; doc list shows the date range.
3. Repeat for Cash Flow. Confirm Income Statement and Cash Flow behave identically (shared code path).
4. Upload a `tax_return` and a `bank_statement` to confirm no regression in the existing period-assignment paths.

## Out of scope

- No change to `DOCUMENT_COVERAGE_CONFIG` (the three types stay `monthly`).
- No change to `validateFinancialStatement`, TB derivation, or `processed_data`.
- No auto-extraction of period dates from PDF content (could be a later enhancement; keeping this PR small and deterministic).
- No change to other doc types' upload flow.
