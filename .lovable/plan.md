
## Problem

When a user uploads the wrong document (e.g. Chart of Accounts) and deletes it, the document row gets removed from `documents`, but **derived state persists** — so the UI still shows the doc as "provided" and re-upload is awkward.

Today's `handleDelete` (in `DocumentUploadSection.tsx`) only:
1. Deletes `processed_data` rows where `source_document_id = docId`
2. Deletes `canonical_transactions` where `source_document_id = docId`
3. Removes the storage file
4. Deletes the `documents` row

What it does **not** clean up:
- **`projects.wizard_data.chartOfAccounts.accounts`** — the parsed COA is cached on the project row and survives doc deletion. Same risk for `trialBalance`, and any other wizard_data section hydrated from a doc.
- **`processed_data` rows that don't have `source_document_id` set** (older rows / aggregated parses keyed only by `project_id` + `data_type`).
- **`docuclipper_jobs`** rows tied to the document.
- **`adjustment_proofs` / `flagged_transactions`** that referenced this document as evidence.

The CIM re-upload path (`handleCimReupload`) already does a deeper clean for that one type. We need the same discipline for every document type, exposed as a "Delete & reset" action.

## Goal

A user who deletes a document gets back to a clean slate for that document type, can re-upload immediately, and downstream tabs (Chart of Accounts, Trial Balance, etc.) reflect the change.

## Approach

1. **Introduce a single `resetDocumentArtifacts(doc)` helper** in `src/lib/documentReset.ts` that, given a document, knows how to scrub every place its artifacts live:
   - Storage file
   - `documents` row
   - `processed_data` rows by `source_document_id` AND by `(project_id, data_type)` matching the doc's `account_type` (e.g. `chart_of_accounts` → `data_type IN ('chart_of_accounts','coa_classification')`)
   - `canonical_transactions` by `source_document_id`
   - `docuclipper_jobs` by `document_id`
   - `adjustment_proofs` where `document_id = doc.id` (just null the link; don't delete the proof — keep audit trail)
   - The matching slice of `projects.wizard_data` (e.g. clear `wizard_data.chartOfAccounts.accounts` when an `account_type='chart_of_accounts'` doc is deleted; clear `wizard_data.trialBalance.accounts` when TB is deleted)

   Mapping table lives in the helper, keyed by `account_type`.

2. **Wire `handleDelete` in `DocumentUploadSection.tsx` to call the helper** instead of doing inline deletes. Toast: "Document deleted — you can re-upload."

3. **Add a confirm dialog** before delete that explicitly states what will be wiped:
   - "Deleting this Chart of Accounts will also clear the parsed accounts and any classifications derived from it. Adjustments referencing this document will keep their record but lose the source link. Continue?"
   
   This is the "annoying to reset" problem the user raised — solved by making one click do the full reset honestly, instead of leaving stale state.

4. **Add a "Replace" affordance** next to each uploaded document (small icon button). Replace = `resetDocumentArtifacts(doc)` then immediately open the file picker for the same slot. This is the wrong-upload recovery flow.

5. **Keep adjustments intact.** If a downstream `adjustment_proposals` row referenced the deleted doc's parsed data, we don't auto-delete — the user can re-run discovery from the workbook. Surface this in the confirm copy: "Existing adjustments are not deleted; re-run discovery if you want them refreshed against the new document."

## Out of scope

- No soft-delete / versioning. The user wants a clean reset, not an audit trail of every wrong upload. (Adjustment proofs are the one place we preserve history by nulling the link rather than cascading the delete.)
- No bulk "reset project" — single-document scope only.
- No changes to `cpa_onboarding_documents` (different flow).

## Files to touch

- `src/lib/documentReset.ts` (new) — the helper + account_type → wizard_data slice mapping
- `src/components/wizard/sections/DocumentUploadSection.tsx` — replace inline delete; add Replace button; add confirm dialog
- `src/components/wizard/sections/DocumentUploadSection.tsx` — refactor `handleCimReupload` to call the same helper (removes duplication)

## Verification

- Upload a Chart of Accounts → confirm `wizard_data.chartOfAccounts.accounts` populates and the COA tab shows accounts
- Delete it → confirm: storage file gone, `documents` row gone, `processed_data` for that doc gone, `wizard_data.chartOfAccounts.accounts` cleared, COA tab empty, Data Sources checklist flips back to "not_provided"
- Upload a different COA → confirm clean re-parse, no merge with prior data
- Repeat for Trial Balance and one bank statement
