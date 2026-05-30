## Short answer

Almost. The remaining $21k "Other Expense" gap is one classification bug, not a real difference.

## Diagnosis

I inspected the TB for this project. Two IS accounts have an **empty `accountType`** (no QB category):

- `Depreciation`
- `Equipment Rental`

`classifyISAccount` falls through and buckets them as plain operating `expense`. But QuickBooks' P&L lays out `Depreciation` (and typically `Amortization`) in the **Other Expense** section, below Net Operating Income. That's exactly where the uploaded CSV puts it.

The math works out:
- TB OpEx is currently $1,856 above uploaded OpEx — the small remainder once depreciation is removed.
- TB Other Expense is $21,029 below uploaded — that's the depreciation/amortization sitting in the wrong bucket.
- Move ~$21k of Depreciation/Amortization from `expense` → `other_expense` and both lines should match within tolerance, pulling Net Income back to a clean match too.

The other "Other expense (income)" rows (`Miscellaneous`, `Penalties & Settlements`, `Interest Earned`, `Other Portfolio Income`) are already classified correctly — Other Income matches exactly.

## Fix (single file)

`supabase/functions/validate-financial-statement/index.ts` → `classifyISAccount`:

1. Before the `accountType`-based switch, add a **name/subtype override** that returns `other_expense` when the account name (case-insensitive) starts with or contains: `depreciation`, `amortization`, `amortisation`, or when `accountSubtype` matches `Depreciation` / `Amortization`. QuickBooks treats these as below-the-line regardless of how the COA is typed.
2. Leave the existing override for "Interest Earned", "Gain on…", "Loss on…", "Interest expense" in place (those handle the ambiguous `Other expense (income)` parent type).
3. No change to the AI extraction prompt — it already returns `totalOtherExpense` correctly.
4. Deploy and re-run validation against document `c08f9791-…`.

## Expected result

- Other Expense: $60,874 vs ~$60,874 → match
- Total Operating Expenses: variance shrinks from -$1,856 toward $0
- Net Income: -$19,172 variance closes to <1%
- Overall match: 75% → ~95–100%

## Out of scope

- No UI changes.
- No schema / migration changes.
- `Equipment Rental` (also empty `accountType`) stays as operating expense — QB reports it in the operating section, and the residual $1,856 in OpEx is already within tolerance.
