## Problem

Inside the **Verification** group, the three doc types currently configure coverage as:

| Type | Current config | Period Coverage panel |
|---|---|---|
| Balance Sheet | `point-in-time` ("As-of Date") | Shows only a single "covered / not covered" check, no per-period timeline |
| Income Statement (P&L) | `monthly` | Full month-by-month timeline ✓ |
| Cash Flow Statement | `monthly` | Full month-by-month timeline ✓ |

So Balance Sheet is the odd one out — it never renders the same period-by-period coverage strip the other two show. (P&L and Cash Flow already render it, but it is easy to miss because there is no documents uploaded yet — `effectivePeriods.length > 0` requires the project's analysis periods to be set.)

## Change

In `src/components/wizard/sections/DocumentUploadSection.tsx`, update `DOCUMENT_COVERAGE_CONFIG.balance_sheet`:

```ts
balance_sheet: {
  type: 'monthly',
  label: 'Period Coverage',
  description: 'Balance sheet snapshot for each reporting period (month-end)'
},
```

That's the only line change. Coverage calc, timeline rendering, missing-period alert, and per-period upload all already handle `monthly` for the other two — Balance Sheet will inherit the same UI automatically.

## Verification

1. Open Wizard → Documents → Verification → Balance Sheet. Confirm the **Period Coverage** card now shows the same month-by-month strip (e.g. Jan 2023 → Dec 2025) that Income Statement shows.
2. Upload a BS for Mar 2024 → that month flips to "covered", missing-period alert lists the rest.
3. Income Statement and Cash Flow tabs are unchanged.

## Out of scope

- No changes to financial-statement validation logic (`validateFinancialStatement`, `FinancialStatementValidationCard`) — those are independent of the coverage panel.
- No changes to other doc types' coverage configs.
- No backend / schema changes.