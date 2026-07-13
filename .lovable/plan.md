## Findings

- The two Balance Sheet rows are duplicates in practice: same file name, same detected period (`2026-05-01` to `2026-05-31`), same project, both completed.
- The trash icon exists in the Uploaded Documents table, but deletion currently calls `resetDocumentArtifacts` for the document type. For Balance Sheets that deletes all `processed_data` rows for `balance_sheet`, not just the selected duplicate. That makes deleting one duplicate risky because it can wipe the parsed Balance Sheet artifact for the remaining file too.
- The Re-run Analysis button was added only to the Reports / Deliverables sections, not to the Document Upload page shown in your screenshot. That is why you do not see it on this page.

## Plan

1. **Make single-document deletion safe for Balance Sheets**
   - Change the delete behavior for optional verification statements (`balance_sheet`, `income_statement`, `cash_flow`) so it removes artifacts tied to the selected `source_document_id` only.
   - Do not delete all project-level `processed_data` for that statement type when another uploaded document of the same type still exists.
   - Keep the current broader reset behavior for source-of-truth documents like Trial Balance and Chart of Accounts.

2. **Improve duplicate clarity in Uploaded Documents**
   - Detect duplicate optional verification uploads by `account_type + name + period_start + period_end`.
   - Mark duplicates in the table with a small “Duplicate” badge so users can tell why two rows appear identical.
   - Keep both rows deletable, but deletion should only affect the row selected.

3. **Add Re-run Analysis directly to the page shown**
   - Add a `Re-run analysis` button in the Upload Balance Sheet / Optional Verification area and/or the Uploaded Documents actions for completed Balance Sheet rows.
   - It will re-run extraction, date detection, and validation for the selected/latest Balance Sheet.
   - Mirror this for P&L and Cash Flow optional verification tabs so the control appears where users naturally look.

4. **Refresh validation state after rerun/delete**
   - After deleting or rerunning, refresh the document list and validation result shown on the page.
   - If the deleted row was the one currently powering validation and another duplicate remains, the remaining duplicate should become the active/latest source.

5. **Verify with James’s project**
   - Confirm the Balance Sheet tab shows the two duplicate rows with a duplicate indicator.
   - Delete one duplicate and confirm one Balance Sheet remains.
   - Confirm the remaining document’s parsed data/validation is not wiped.
   - Confirm `Re-run analysis` is visible on the Balance Sheet upload/validation page.