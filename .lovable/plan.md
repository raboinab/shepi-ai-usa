## Diagnosis (now confirmed from the CSV)

Two things going on, only one is a code issue:

1. **Depreciation override was correct.** The CSV puts Depreciation ($21,028.15) in the **Other Expense** section, not Operating Expenses. The current edge function classification (Depreciation → `other_expense`) matches the CSV exactly. Keep it.

2. **The $19,172 gap is a missing TB account.** The CSV has a `Maintenance and Repair` **parent** account with $19,171.98 of direct postings, plus three child accounts (Building Repairs, Computer Repairs, Equipment Repairs). The TB for this project only contains the three children — the parent's direct postings are not in the TB at all. The variance is exactly $19,171.98.

This is a data-completeness issue with the seller's TB, not a validator bug. The validator is correctly flagging a real gap. We can make that gap easier to diagnose without forcing the user to download the CSV and grep for it.

## Plan: make completeness gaps self-diagnosing

All changes in `supabase/functions/validate-financial-statement/index.ts` and `src/components/wizard/shared/FinancialStatementValidationCard.tsx`.

### 1. Edge function — emit a `missingAccounts` diagnostic

After the AI returns `lineDetails` (already extracted), compute for each variance > $1,000 (or > 0.5% of revenue) which uploaded line items have **no matching TB account by name**. Matching:

- Normalize: lowercase, strip punctuation, strip the leading `Total for ` prefix.
- Compare against `account.accountName` (and the leaf of `:` paths).
- Account is "missing" when no TB account matches AND no parent path matches.

Persist into `validation_result.missingAccounts`: array of `{ label, section, uploadedAmount, suspectedBucket }`.

### 2. Edge function — emit a `tbBreakdown` and `uploadedBreakdown`

Two arrays inside `validation_result.diagnostics`:

- `tbBreakdown`: every IS account that contributed to a bucket → `{ accountName, accountType, bucket, totalInScope }`.
- `uploadedBreakdown`: the AI's `lineDetails` (capped at 80 rows), already typed `{ label, amount, section }`.

Cheap, no extra AI calls.

### 3. UI — add a collapsible "Diagnostic" section

In `FinancialStatementValidationCard`, when `result.diagnostics` is present and any line has `status === 'significant'`, render a collapsible `<Accordion>` titled **"Why don't these match?"** with:

- A "Missing TB accounts" callout (red, dismissible) listing every entry in `missingAccounts` with the uploaded amount and a one-line explanation: *"This line item exists in the uploaded P&L but has no matching account in your Trial Balance. Add it to the TB to close the gap."*
- Two side-by-side tables (uploaded vs TB) sorted by `Math.abs(amount)` desc, with rows highlighted when an uploaded label has no TB match (or vice versa).

No new dependencies — uses existing `Accordion`, `Table`, `Alert`.

### 4. Re-validate

Deploy and re-run on document `f74670b2-…`. Expected diagnostic surface:

- `missingAccounts` = `[{ label: "Maintenance and Repair", section: "expenses", uploadedAmount: 19171.98, suspectedBucket: "expense" }]`
- The UI shows: *"Your TB is missing this account. Add it to close a $19,172 variance."*
- Match score stays ~75% because the variance is real, but it's now actionable instead of mysterious.

### Out of scope

- No automatic TB mutation. The user (or wizard) must add the missing account themselves.
- No schema migration — `validation_result` is `jsonb`.
- No changes to BS path (still 100%).
- No new AI calls or prompt changes.
