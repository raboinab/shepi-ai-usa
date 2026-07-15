## Goal

Make the Reconciliation tab scannable. Keep the 93% math and all reason codes exactly as they are — this is a presentation-only pass.

## What's wrong today

Every section renders as a flat table stacked on the previous one, so the tab reads as one long undifferentiated wall. Specifically:

- The three "missing" lists (In GL / In TB / material variances) all use the same visual weight, so the eye has no anchor.
- The "Unreconciled by reason" section shows badges *and* a full table, but the table only opens inside a `<details>` and uses the same row styling as the full reconciliation below it — they look identical.
- Numbers aren't right-aligned in a consistent column width, so `-$1,000` vs `$0` vs `$574,850` shift horizontally row to row.
- `(deleted)` account names get truncated mid-word without an ellipsis, so half the column reads "…VampireFreaks Wholesa".
- The full reconciliation `<details>` dumps 60 rows with no filter, no sort, and no way to see just the non-zero ones.

## Changes

### 1. Summary header at the top of the tab

Replace the free-floating "Material Variances" heading with a one-line KPI strip:

```text
93% reconciled · 43 matched · 13 variance · 3 in GL only · 1 in TB only
```

Uses `Badge` variants (green/amber/muted) so the eye lands on the number first. This is the anchor for everything below.

### 2. Collapse the four "not-matched" lists into one card

Today: four separate sections (Material Variances, Structural, In GL missing TB, In TB missing GL). New: a single "Needs attention" card with a segmented control at the top (`Variances · Structural · GL only · TB only`). Each segment shows the same table shape:

```text
Account                        GL          TB      Variance   Reason
```

- Column widths are fixed with `tabular-nums`, all money right-aligned, account name gets `truncate` + `title={name}` so the full name shows on hover.
- Reason column is a small muted `Badge`, not raw text — makes the row scannable at a glance.
- Header of each segment shows the count so users know what they're looking at without counting rows.

### 3. Full reconciliation table gets a proper toolbar

The current `<details>Show full reconciliation (60)</details>` becomes a collapsible card with:

- Search box (filter by account name)
- Toggle: "Hide zero-variance rows" (default ON — makes 43 of 60 rows disappear, leaves the interesting ones)
- Toggle: "Hide `(deleted)` accounts" (default OFF, but one click removes QBO cruft)
- Column headers become clickable for sort by |variance| desc / account asc.

No new data — pure client-side filter/sort on `analysisData.recon`.

### 4. Money formatting

- One shared `<Money value={n} />` inline component with `tabular-nums font-mono-ish` and consistent negative styling (parens or red, pick one — planning to use `text-destructive` for negatives, parens for the export).
- `$0` renders as muted `—` so zero rows stop pulling attention.

### 5. Sticky tab header

The Overview/Reconciliation/Flags tabs currently scroll away. Add `sticky top-0 bg-background z-10` to the `TabsList` inside the card so users can jump between tabs from anywhere in the long reconciliation list.

## Files touched

- `src/components/wizard/sections/GeneralLedgerInsightsCard.tsx` — all changes live here. Lines ~214–383 (the Reconciliation `TabsContent`) get restructured. Overview and Flags tabs are unchanged.
- No new files, no new dependencies (uses existing shadcn `Table`, `Badge`, `Input`, `Toggle`, `Tabs`).
- No edge function, migration, or reconciliation logic changes.

## Non-goals

- Not touching the reason codes, tolerances, or the 93% number.
- Not auto-hiding deleted accounts by default (user explicitly picked "Just fix readability", not "auto-suppress cruft").
- Not adding export/print — separate ask if wanted.

## Verification

- Load `/project/621a6c9f-1c25-40fa-92fa-6762ae3fe72b`, open GL Analysis → Reconciliation tab.
- Confirm the KPI strip reads `93% · 43 matched · 13 variance · 3 GL only · 1 TB only`.
- Toggle "Hide zero-variance" and confirm the full table drops to 17 rows.
- Sort by |variance| desc and confirm PayPal / Discounts / Shipping Income don't appear (they're status=match, variance=0) and the true residuals (Etsy Payout $753, Shopify VF Wholesale $668, etc.) surface at the top.
- Resize to 1024px width and confirm no column overlaps or horizontal scroll inside the card.
