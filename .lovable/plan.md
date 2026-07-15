## Root cause

`supabase/functions/process-quickbooks-file/index.ts` marks a document `completed` even when the `processed_data` insert fails.

Lines 785–805:
```ts
const { error: saveError } = await supabase.from('processed_data').insert({...});
if (saveError) {
  console.error(...);
  // Don't throw - we still want to update the document status
} else {
  console.log("Successfully saved to processed_data");
}
```

Execution falls through to line 866, which unconditionally sets `processing_status: "completed"` and writes a full `parsed_summary` (record_count, period, `processed_at`). The user sees a green checkmark, the document row looks healthy, but `processed_data` has no matching row.

That is exactly the state of `VampireFreaks_General Ledger 2023.xlsx` (doc `d57ba143`):

- `documents`: `processing_status = completed`, `record_count = 143`, `processed_at = 2026-07-12T17:17:21Z`
- `processed_data`: no `general_ledger` row for 2023 (2024, 2025, 2026-YTD are all present, created 17:17:09 / 17:17:20 / 17:16:54 — 2023 was the largest file and the only one that failed to persist)

The four GL files were processed in parallel; the 2023 insert most likely hit a transient PostgREST/Storage error, which the current code swallows. Any future GL/BS/P&L/COA/TB upload that trips a transient insert failure will have the same invisible outcome.

## Fix

### Step 1 — stop swallowing insert errors (generic, all data types)

In `supabase/functions/process-quickbooks-file/index.ts`, when `processed_data` insert fails:

1. Set `documents.processing_status = 'failed'` with `parsed_summary.error` describing the DB error (do NOT overwrite with `completed` afterward).
2. Return a 500 with the error so the caller's Retry button surfaces it — matches the pattern already used for storage-download / qbToJson-API failures elsewhere in this function.
3. Guard the "update document to completed" block (line 866) behind a `savedOk` flag so it only runs on successful persistence.

The fallback-COA insert on line 835 has the same swallow pattern — log-only. Leave the document status alone there (COA is a secondary artifact), but ensure the primary insert result is the gate for `completed`.

### Step 2 — re-ingest the 2023 GL

Once Step 1 is deployed:

1. Reset doc `d57ba143-2d34-4c97-88ec-8f041270a0e4`: `processing_status = 'pending'`, clear `parsed_summary`.
2. Invoke `process-quickbooks-file` with `{ documentId: 'd57ba143-…' }` from the edge-function console (or use the existing Retry button on the wizard).
3. Verify a new `processed_data` row appears with `data_type='general_ledger'`, `period_start='2023-01-01'`, `period_end='2023-12-31'`, `record_count ≈ 143`.

If the insert fails again, we'll now see the real error in logs + the document status (rather than a fake "completed"), and can address the underlying cause (row size, timeout, etc.).

### Step 3 — verify GL reconciliation

Re-run "Analyze GL" on project `621a6c9f-…`. With 2023 back on the GL side, `activityNet` sums will finally cover the same 41-month window as TB and P&L variances on `z_Shopify Sales`, `TikTok Sales`, etc. should collapse. Any remaining variance is a real reconciliation issue, not a data-gap artifact — and we already have `[ANALYZE-GL:DIAG]` logging staged for those.

## Out of scope

- No changes to `analyze-general-ledger` this turn. Sign-normalization / QB-metadata-classification fixes were previously staged there and can be revisited only if variances persist after 2023 is re-ingested.
- No UI changes.
- No migrations.

## Technical notes

Files edited: `supabase/functions/process-quickbooks-file/index.ts` only.

Shape of the change around line 800:

```ts
let savedOk = false;
const { error: saveError } = await supabase.from('processed_data').insert({...});
if (saveError) {
  await supabase.from('documents').update({
    processing_status: 'failed',
    parsed_summary: { error: `Failed to save processed data: ${saveError.message}` },
  }).eq('id', documentId);
  return new Response(JSON.stringify({ error: saveError.message, documentId }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
savedOk = true;
```

Then only run the `completed` update + fallback-COA block when `savedOk` is true.
