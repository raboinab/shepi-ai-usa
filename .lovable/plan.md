## Bug: Cash Flow validation card shows wrong title

The card header in `src/components/wizard/shared/FinancialStatementValidationCard.tsx` only handles two document types:

```ts
const documentTypeLabel = result.documentType === 'balance_sheet' 
  ? 'Balance Sheet' 
  : 'Income Statement (P&L)';
```

When `documentType === 'cash_flow'` (which is what gets passed for your CFS upload), it falls through to the `else` branch and renders **"Income Statement (P&L) Validation Results"** — which is why you're seeing that label even though the underlying validation is correctly running against cash flow.

### Fix

Replace the ternary with a switch/map so all three types render correctly:

- `balance_sheet` → "Balance Sheet"
- `income_statement` → "Income Statement (P&L)"
- `cash_flow` → "Cash Flow Statement"

One-line presentation fix. No logic changes, no edge function changes.

### File
- `src/components/wizard/shared/FinancialStatementValidationCard.tsx` (the `documentTypeLabel` assignment, ~line 110)
