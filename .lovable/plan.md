## Goal

Make every verified add-back drillable in two clicks from the DD Adjustments workbook tab:

```text
[Adjustment row]  →  [GL Lines panel]  →  [Bank Statement panel]
   click 1              click 2
```

No new data, no new tables. Everything required is already in `adjustment_proofs.traceability_data.matching_transactions`, `canonical_transactions` (with `source_document_id`), and `documents` (file_path, page metadata in `parsed_summary`).

## What the user will see

**Click 1 — open an adjustment row in the DD Adjustments tab**
A side sheet opens showing:
- Adjustment header (description, amount, period, validation badge)
- "GL Lines Supporting This Adjustment" table:
  - Date · Account # / Name · Description / Vendor · Amount · Source Doc (icon)
- Variance triangle (Seller vs. Matched) at the top
- Empty state if no matches: "No GL transactions matched. This adjustment is asserted-only."

**Click 2 — click any GL line**
A nested panel (or stacked sheet) slides in showing:
- The bank/source transaction it reconciles to:
  - Date · Payee · Amount · Account · Memo · Statement name · Page #
- "Open source document" button → opens the underlying PDF/CSV in a new tab via existing signed-URL flow
- If the GL line came from QuickBooks (no bank doc linked), show source = "QuickBooks GL" with the realm/period

## Where it plugs in

1. **`DDAdjustmentsTab.tsx`** — add an `onRowClick` path. Currently `SpreadsheetGrid` has no row-click prop, so:
   - Add optional `onRowClick?: (rowId: string) => void` to `SpreadsheetGridProps`.
   - Wire it on the row `<div>` (cursor-pointer + hover state for `data` rows only).
   - In `DDAdjustmentsTab`, when a row id matches `adj-{id}`, open a new `<AdjustmentTraceSheet>` keyed to that adjustment id.

2. **New component: `src/components/workbook/AdjustmentTraceSheet.tsx`**
   - Uses Shadcn `Sheet` (right side, `w-[640px]`).
   - Loads the proof for `adjustmentId` from `useAdjustmentProofs(projectId).proofMap`.
   - Renders the GL lines list directly from `proof.traceability_data.matching_transactions` (already shaped — we reuse the `MatchingTransaction` type from `VerifyAdjustmentDialog`).
   - Each GL line is a button → sets `selectedTxnId`, opens the bank panel.

3. **New component: `src/components/workbook/BankReconcilePanel.tsx`**
   - Receives the selected `MatchingTransaction.id`.
   - Single read query against `canonical_transactions` joined to `documents`:
     ```ts
     supabase.from("canonical_transactions")
       .select("id, txn_date, payee, vendor, description, memo, amount, account_name, account_number, source_type, source_document_id, raw_payload, documents:source_document_id(name, file_path, period_start, period_end, parsed_summary)")
       .eq("id", txnId).single()
     ```
   - Displays the bank-side fields. Page number is read from `raw_payload.page` or `parsed_summary.pages` if present (fallback: hide).
   - "Open statement" button calls `supabase.storage.from('documents').createSignedUrl(file_path, 600)` and opens it.

4. **Hook reuse** — no schema changes. `useAdjustmentProofs` already exposes everything we need; we only widen the `ProofSummary` returned from the hook to also pass through `traceability_data.matching_transactions` (currently dropped). One-line addition.

## Technical notes

- **Two clicks, not three:** the trace sheet opens on a single grid-row click (not a button inside the row). The GL → bank step is the second click.
- **Reuse, don't duplicate:** the GL-line markup is lifted from `VerifyAdjustmentDialog` lines 405–438; we extract it into `<MatchingTxnList onSelect={...} />` and use it in both places. `VerifyAdjustmentDialog` keeps working unchanged for the wizard flow.
- **No grid behavior regression:** existing cells stay double-click-to-edit; the new row click is suppressed if the click originated inside an editable cell that's currently being edited.
- **Empty / unverified rows:** for adjustments without a proof row (asserted-only), the sheet still opens but shows a clear "Not yet GL-traced — run verification" CTA that opens `VerifyAdjustmentDialog` in normal mode.
- **Performance:** the trace sheet only fetches per-transaction detail when a GL line is clicked; the proof list is already cached project-wide by `useAdjustmentProofs`.

## Out of scope (intentionally)

- No PDF page-jump (we open the document at page 1 unless `parsed_summary.pages[txnIdx]` exists). Real per-page anchors are a follow-up.
- No new column on the grid. The whole row is the affordance; we add a subtle right-edge chevron on hover for discoverability.
- No backend / migration work.

## Effort

~3–4 hours. One new prop on `SpreadsheetGrid`, two new components (~120 lines each), one extracted shared sub-component, one query.
