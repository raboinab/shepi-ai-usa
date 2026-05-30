## The bug

For Cash Flow Statement validation, the TB-derived "Operating Cash Flow / Investing Cash Flow / Financing Cash Flow / Net Change in Cash" values are stubs:

```ts
// supabase/functions/validate-financial-statement/index.ts:423
operatingCashFlow: netIncome, investingCashFlow: 0, financingCashFlow: 0,
netChangeInCash: netIncome,
```

So every uploaded Cash Flow Statement compares against Net Income on one row and zero on the others. That's why this project shows 0% match, OCF off by +10%, ICF/FCF reading as `-` (no TB value), and Net Change off by +10%.

## Fix

Derive a real **indirect-method** cash flow from the Trial Balance over the document's reporting period, using the BS deltas already present in TB plus the IS activity we already compute. Scope: only the `cash_flow` document path in `deriveTotalsFromTrialBalance`. No schema changes, no AI prompt changes, no UI changes.

### What gets computed

Period = `[periodStartKey, periodEndKey]` from the uploaded statement (same YTD slice logic already used for the equity rollup).

1. **Period Net Income** — sum of IS bucket activity (revenue − cogs − expenses + other_income − other_expense) restricted to the period slice. We already produce `ytdNetIncome` for the equity rollup; generalize it to any period window and reuse.

2. **BS deltas over the period** — for each BS account, `delta = balance(periodEnd) − balance(periodStart − 1)`. Classify each account into a CF bucket:
   - `cash` → tracked separately, drives the check figure
   - `current_asset_noncash` (AR, inventory, prepaid, other current asset) → OCF, sign: `−Δ`
   - `current_liability_noninterest` (AP, accrued, other current liab; exclude lines containing "loan", "note", "line of credit", "credit card") → OCF, sign: `+Δ`
   - `fixed_asset` / `intangible` → ICF, sign: `−Δ` (CapEx and intangible additions)
   - `other_noncurrent_asset` → ICF, sign: `−Δ`
   - `debt_liability` (long-term liabilities + current-liability rows whose name matches debt keywords) → FCF, sign: `+Δ`
   - `equity` (excluding retained earnings movement, which is captured by Net Income) → FCF, sign: `+Δ`
   - Retained earnings movement is intentionally excluded — it's already represented by Net Income.

3. **Non-cash addback** — Depreciation/amortization expense for the period (sum of IS accounts whose name matches `/deprec|amort/i`) is added back into OCF. We already have `calcDepreciationExpense` in `src/lib/calculations.ts`; port the same matching rule into the edge function (it can't import frontend code).

4. **Totals**
   - `operatingCashFlow = netIncome + D&A + Σ(current_asset Δ with −) + Σ(current_liab_noninterest Δ with +)`
   - `investingCashFlow = Σ(fixed/intangible/other_noncurrent_asset Δ with −)`
   - `financingCashFlow = Σ(debt Δ with +) + Σ(equity Δ with +)`
   - `netChangeInCash = OCF + ICF + FCF` (should reconcile to actual ΔCash; we'll log the gap as a sanity check, not surface it)

### Classification rules (in the edge function)

Add a small helper next to the existing `classifyBSAccount`:

```ts
function classifyCFBucket(accountName: string, accountType: string, bucket: BsBucket):
  'current_asset_noncash' | 'cash' | 'fixed_asset' | 'other_asset' |
  'current_liab_op' | 'debt' | 'equity' | null
```

Keyed off the existing `bucket` ('asset' | 'liability' | 'equity') plus name/type heuristics already used elsewhere in the file (cash/AR/inventory/prepaid/fixed/intangible for assets; loan|note|line of credit|credit card|long.?term for debt; everything else under liability → operating).

### Output shape

`deriveTotalsFromTrialBalance` returns the same `DerivedTotals` shape — only the four CF fields change from stubs to real numbers. No frontend changes needed; `LINE_ITEM_DEFS.cash_flow` already lists the four rows.

## Files touched

- `supabase/functions/validate-financial-statement/index.ts` — generalize the YTD slice into a `slicePeriod()` helper, add `classifyCFBucket`, replace the four stub lines with computed values. ~80 lines added.
- Edge function gets redeployed automatically.

## Verify

Re-run validation on this project's uploaded Cash Flow Statement. Expected:
- OCF, ICF, FCF, Net Change in Cash all populated from TB.
- Variances should drop to near-zero on this Sandbox file (QuickBooks indirect-method CF uses the same rules). Any residual variance > 1% gets surfaced via the existing "Why don't these match?" panel logic, unchanged.

## Out of scope

- No new line items beyond the four already shown.
- No direct-method CF.
- No changes to balance sheet or income statement validation paths.
- No "missing accounts" detector changes (the existing one already runs for all doc types).
