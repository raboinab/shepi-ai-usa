## Goal

For `bank_statement` and `credit_card` document types, replace the single merged coverage timeline with **one timeline row per account** (institution + account label), so a missing month on Chase Operating doesn't get masked by full coverage on Wells Savings.

## Scope

Only affects `bank_statement` and `credit_card` views inside `DocumentUploadSection`. Other doc types (TB, GL, AR/AP, tax returns, CIM…) keep their current single timeline — their coverage isn't per-account.

## Changes

### 1. Require `account_label` on upload (bank/CC only)

`src/components/wizard/sections/DocumentUploadSection.tsx`

- Change the label from "Account Label (Optional)" → "Account Label" with a red `*` and helper text: *"Use something distinct per account, e.g. 'Operating · ...4521' or 'Payroll · ...8830'. Required to separate coverage per account."*
- Add validation in the upload submit handler (`handleUpload` / the equivalent that currently checks `requiresInstitution`): if `account_type ∈ {bank_statement, credit_card}` and `accountLabel.trim() === ""`, toast `"Account label is required for bank/credit card statements"` and abort.
- After successful upload, clear `accountLabel` like the other form state.

### 2. Per-account coverage rows

New component: `src/components/wizard/shared/PerAccountCoverage.tsx`

```tsx
interface AccountGroup {
  key: string;              // `${institution}::${account_label}` (lowercased)
  institution: string;
  accountLabel: string;     // "" → "Unlabeled"
  docCount: number;
  periodSources: { period_start: string|null; period_end: string|null }[];
}

interface Props {
  groups: AccountGroup[];
  effectivePeriods: Period[];
  onBackfillClick?: (docIds: string[]) => void; // for unlabeled group
  unlabeledDocIds?: string[];
}
```

Renders one stacked row per group:
- Left column (fixed ~220px): institution name + account label, doc count, % coverage badge.
- Right column: a thinner `CoverageTimeline` bar (reuse `<CoverageTimeline coverageType="monthly" …>` per row, computed via `calculatePeriodCoverage(effectivePeriods, group.periodSources)`).
- If a group's `accountLabel === ""` (legacy unlabeled docs), the row has a yellow "Needs labeling" badge and a small "Label accounts" button that opens the backfill dialog.

In `DocumentUploadSection.tsx`:

- When `selectedType` is `bank_statement` or `credit_card`, build groups from `filteredDocs` keyed by `${institution ?? "Unknown"}::${account_label ?? ""}` and render `<PerAccountCoverage … />` **instead of** the single `<CoverageTimeline />`. Keep the overall % badge in the card header but compute it as union of all groups (so "60% of months covered across all accounts"). Keep the existing QB-coverage badge logic unchanged (QB rows go into a single "QuickBooks (synced)" group).
- For all other doc types, keep current single-timeline behavior — no visual change.

### 3. Backfill UI for legacy unlabeled documents

New dialog: `src/components/wizard/shared/AccountLabelBackfillDialog.tsx`

- Opens when the user clicks "Label accounts" on the unlabeled group, or from a new top-level alert banner that appears when `filteredDocs.some(d => ['bank_statement','credit_card'].includes(d.account_type) && !d.account_label)`.
- Lists each unlabeled doc as a row: filename, institution, period range, and a required `<Input>` for the label. "Save all" updates `documents.account_label` for the selected rows via supabase, then refetches.
- Banner copy: *"N bank/credit card document(s) are missing an account label. Per-account coverage requires this. Label them now →"*

### 4. Document list table

In the document list table (around line 2387 where institution/label columns render), make the `account_label` cell render `<Badge variant="outline">Needs label</Badge>` instead of "-" for bank/CC docs without a label, with an inline edit icon that opens the same backfill dialog scoped to that single document.

## Out of scope

- No schema change. `documents.account_label` stays nullable so old rows aren't broken; required-ness is enforced at the UI for new uploads only.
- DocuClipper auto-derivation of masked account numbers (option 2 from earlier) — can layer on later as a prefill default in the label field if `parsed_summary.account_number_masked` is present, but not part of this change.
- No change to `bank_statement` / `credit_card` coverage math itself — same `calculatePeriodCoverage`, just applied per-group.

## Verification

1. Upload a new bank statement with the label field empty → submit blocked with toast.
2. Upload two Chase statements with different labels (e.g. "Operating ...4521" Jan–Jun, "Payroll ...8830" Mar–Dec) → coverage card shows two rows with independent timelines.
3. On a project with pre-existing unlabeled bank docs → backfill banner appears, dialog lets user assign labels, rows then split correctly.
4. Other doc types (Trial Balance, Tax Return, CIM) are visually unchanged.