## Goal

When a user uploads a Journal Entries file (Excel or CSV) under the Journal Entries doc type, parse the rows into the same shape QuickBooks sync produces, store as `data_type = 'journal_entries'` in `processed_data`, and let the existing `useAutoLoadJournalEntries` hook populate the wizard viewer automatically — without touching the QuickBooks path.

## Diagnosis (why it's empty today)

- `JournalEntriesSection` only renders entries from `wizardData.journalEntries.entries`, which is hydrated by `useAutoLoadJournalEntries` from `processed_data` rows with `data_type = 'journal_entries'`.
- Only `complete-qb-sync/index.ts:359` ever writes that data type. Uploaded JE Excel/CSV files are sent to `analyze-journal-entries`, which writes `journal_entry_analysis` (the insights card) — never `journal_entries`.
- Confirmed on project `fa0768ca…`: only `journal_entry_analysis` rows exist; no `journal_entries`. Empty-state copy reflects this ("after a QuickBooks sync").

## Changes

### 1. New edge function: `supabase/functions/process-journal-entries/index.ts`

Deterministic parser (no AI — JE files are tabular and can be large/many rows).

- Accept `{ documentId, projectId }`, look up the document row, download the file from storage.
- For `.xlsx` / `.xls`: parse with `xlsx` via `npm:xlsx@0.18.5` (already in use elsewhere if present, else add). For `.csv`: parse with simple line/quote-aware split.
- Detect header row (case-insensitive). Required columns (any of these aliases):
  - JE id: `je #`, `entry #`, `num`, `journal #`, `transaction id`
  - Date: `date`, `txn date`, `transaction date`
  - Account: `account`, `account name`
  - Debit: `debit`, `debit amount`
  - Credit: `credit`, `credit amount`
  - Optional: `memo`, `description`, `account id`, `adj` / `adjustment`
- Group rows by JE id (+ date as fallback). For each group, build:
  ```
  { id, txnDate (YYYY-MM-DD), totalAmount (sum of debits), isAdjustment, memo, lines: [{accountName, accountId, amount, postingType: "DEBIT"|"CREDIT"}] }
  ```
- Sort entries by `txnDate` desc.
- Write a `processed_data` row exactly matching the shape `transformQBJournalEntriesToWizard` expects when called via `useAutoLoadProcessedData` — i.e., the hook passes `data` straight into the transform. Simplest: store the already-wizard-shaped payload `{ data: rawEntries, count }` where `rawEntries` use the same field names the QB transform reads (`id`, `txnDate`, `line[].journalEntryLineDetail.accountRef.{name,value}`, `line[].amount`, `line[].journalEntryLineDetail.postingType`, `privateNote`, `adjustment`). This keeps a single transform path.
- Insert with `source_type: 'upload_parse'`, `data_type: 'journal_entries'`, `validation_status: 'pending'`.
- Fire-and-forget call to `embed-project-data` with `data_types: ['journal_entries']`.
- Standard CORS + error handling mirroring `process-debt-schedule`.

### 2. Wire upload to the new function

In `src/components/wizard/sections/DocumentUploadSection.tsx` (around line 1180, alongside `debt_schedule`), add a branch:

```ts
} else if (docType === "journal_entries") {
  await supabase.from('documents').update({ processing_status: "processing" }).eq('id', insertedDoc.id);
  const { error } = await supabase.functions.invoke('process-journal-entries', {
    body: { documentId: insertedDoc.id, projectId },
  });
  if (error) {
    await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
    toast.error("Failed to parse journal entries");
  } else {
    await supabase.from('documents').update({ processing_status: "completed" }).eq('id', insertedDoc.id);
    toast.success("Journal entries parsed — open the Journal Entries section to view.");
  }
}
```

The existing `analyze-journal-entries` insights run (triggered by the `AnalysisRunButton` in DocumentUploadSection.tsx:1989) stays untouched — uploads now both populate the viewer and feed the analyzer.

### 3. Empty-state copy refresh

Update `JournalEntriesSection.tsx` empty-state to: "No journal entries yet. Connect QuickBooks or upload a JE Excel/CSV in the Documents section." Keep it short.

### 4. No DB / schema changes

`processed_data` already supports `data_type = 'journal_entries'`. No migration needed.

## Validation

- On project `fa0768ca…`, re-upload `Sandbox Company_US_2_Debt Schedule.csv`-style JE file → confirm a new `processed_data` row with `data_type = 'journal_entries'` appears.
- Reload wizard → Adjustments → Journal Entries: rows render in the table with debit/credit totals.
- QB sync path: confirm `complete-qb-sync` still writes the same data_type and the viewer keeps showing QB rows (last-write-wins, which is the existing behavior for that section).
- `analyze-journal-entries` insights card still renders independently in the Documents section.

## Out of scope

- No changes to QuickBooks sync, `process-debt-schedule`, payroll/fixed-assets fallbacks, or the analyzer.
- No new RLS, no schema changes.
- No PDF support for JE (already disabled in the upload picker).
