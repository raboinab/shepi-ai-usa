## Read of the current state

Reconciliation is now correctly at 83% with all sign-mirror false positives gone. The 11 remaining material variances split into two buckets that should be treated differently:

### Bucket A — Genuine balance-sheet cutoff differences (4)

| Account | GL | TB | Variance |
|---|---|---|---|
| Savings | $1,852,556 | $2,306,033 | −$453,477 |
| Checking | $259,800 | $410,901 | −$151,101 |
| Undeposited Funds | $267,757 | $338,139 | −$70,382 |
| Accounts Receivable | −$300 | −$174,896 | $174,596 |

These are real and should keep flagging. They indicate the GL detail report and the TB were pulled at different cutoff points, or there are entries in the TB that didn't make it into the GL export. This is exactly what a reconciliation tool is *supposed* to surface.

### Bucket B — Parent-vs-rollup structural mismatches (6)

| Account | GL (parent only) | TB (rollup) |
|---|---|---|
| Landscaping Services | $30 | −$210,171 |
| Pest Control Services | $70 | −$179,716 |
| Fountains and Garden Lighting | $45 | −$151,591 |
| Other Income | $331,583 | −$98,222 |
| Design income | $263 | −$119,170 |
| Services | $104 | −$85,785 |

These are NOT data errors. QuickBooks' TB rolls child balances up into the parent total (e.g. `Landscaping Services` TB row = sum of all its sub-services). The GL parent row shows only direct postings to the parent ($30 of uncategorized billings), and the children are listed separately. We're correctly matching parent-to-parent, but those numbers are structurally incomparable.

The seventh structural row is A/P ($75,810 vs −$84,558, normalized variance −$8,748) — this looks like a small genuine cutoff difference, not a rollup. Keep it flagged.

### Plus one cosmetic issue

`Mastercard` ($75 vs −$710, −$635) and `Board of Equalization Payable` ($4 vs −$321, −$317) are non-material — below the existing $1,000 threshold — so they don't appear in Material Variances anyway. No change needed.

## The fix

Single edge function change: `supabase/functions/analyze-general-ledger/index.ts`, reconciliation loop only.

### 1. Detect parent-rollup mismatch

After matching a GL account to a TB account, check whether the matched TB row is a **parent rollup** — i.e. there exist other entries in `tbByFullPath` whose path starts with `${tb.fullPath}:` and carry non-trivial balances. Track these prefixes once at the top of the reconciliation loop:

```ts
const tbParentPaths = new Set<string>();
for (const [path] of tbByFullPath) {
  const parts = path.split(":");
  for (let i = 1; i < parts.length; i++) {
    tbParentPaths.add(parts.slice(0, i).join(":"));
  }
}
```

When a matched TB row's normalized fullPath is in `tbParentPaths` AND `Math.abs(tbBalance) > Math.abs(glBalance) * 3` (or similar tolerance), treat the comparison as a **structural variance**, not a data variance.

### 2. New status, separate UI bucket

Add a fourth status to `TBComparison`:

```ts
status: "match" | "variance" | "structural_variance" | "missing_in_tb";
```

- Excluded from `materialVariances` regardless of magnitude
- Counted toward `matchCount` for the reconciliation percentage (the underlying child accounts already match, so the parent's rollup discrepancy isn't a true reconciliation failure)
- Returned in the response payload as `structuralVariances: TBComparison[]` so the UI can render them in a separate, lower-severity section ("Parent accounts shown at rollup vs. direct-posting level")

### 3. UI surface (minimal)

`src/components/[wherever the reconciliation tab lives]` — add a collapsible section below "Material Variances" titled **"Structural differences"** with a one-line tooltip: *"These TB parent accounts include child rollups not posted directly to the parent in the GL. The child accounts reconcile separately."* Render the same column shape (Account / GL / TB / Variance) but in muted styling.

If discovering the exact component path during build is faster than guessing, do that first.

### 4. Reconciliation percentage

With Bucket B reclassified as matches, expect the rate to climb from 83% to ~91% (62 + 6 = 68 / 75). Bucket A's 4 real variances remain genuine.

## Out of scope

- Trying to reconstruct GL parent totals by summing children (the child accounts have different classification paths in GL vs TB; the arithmetic wouldn't tie cleanly and would hide real differences)
- Touching the TB ingester, GL parser, or any of the matching logic that's now working
- Adding a manual override / "ignore this account" UI
- Changing how `Mastercard` / `Board of Equalization` (immaterial small variances) are displayed

## Open question

Do you want structural-variance rows to:
**(a)** count as matches (reconciliation % goes up), or
**(b)** be excluded from both numerator and denominator (so the % reflects only "comparable" accounts)?

I'd recommend (a) — they aren't reconciliation failures, just presentation differences. But it's your call.
