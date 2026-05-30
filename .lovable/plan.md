## Diagnosis from the project's actual TB

Inspecting `wizard_data` for project `fa0768ca…`:

- The TB IS rows include things like **`Job Expenses:Cost of Labor`**, **`Job Expenses:Job Materials:Plants and Soil`**, etc., all stored under `accountType: "Operating expenses"`. These are landscaping job costs — significant dollar amounts.
- The uploaded QuickBooks "Profit and Loss by Month" CSV puts those same accounts in a **Job Expenses / Job Costs** block, which QB reports as a separate subtotal that the AI extracted as part of COGS or excluded from the "Total Expenses" subtotal it picked.
- A handful of TB rows have **empty `accountType`** (`Depreciation`, `Equipment Rental`, `Maintenance and Repair`) — my classifier falls through to `expense` for these, which may or may not match the uploaded P&L.
- TB also has below-the-line accounts under type `"Other expense (income)"`: `Miscellaneous`, `Penalties & Settlements`, `Interest Earned`, `Other Portfolio Income`. These now correctly bucket as `other_expense`.

The remaining $596k OpEx gap and $918k Net Income gap are NOT a code bug — they're real taxonomy drift between (a) how QuickBooks lays out the P&L for this seller and (b) how the AI extractor summarized it. The uploaded `Net Income $2,511,906` is actually **Net Operating Income** (GP − OpEx of $180k), not the true bottom-line.

## What to change

Two-pronged: (1) stop comparing apples-to-oranges; (2) give the user the breakdown so the gap is explainable, not mysterious.

### 1. `extractTotalsViaAI` (income_statement prompt)
- Force the AI to return the **true bottom-line Net Income** (after Other Income/Expense). If the document only shows "Net Operating Income", compute Net Income explicitly using the Other Income / Other Expense rows it can see. Add a separate `netOperatingIncome` field if available.
- Add `totalOtherIncome` and `totalOtherExpense` to the extraction schema so we can reconcile below-the-line categories.
- Add a `lineDetails` field: array of `{ label, amount, section }` for every detail row the AI used, capped at 60 rows. We log it so future variance is debuggable without a re-deploy.

### 2. `deriveTotalsFromTrialBalance`
- Already returns `otherIncome` / `otherExpense` internally — also expose them in `DerivedTotals` so we can show them in `lineItems`.
- For accounts whose name starts with `Job Expenses:` (or whose name contains `Cost of Labor` / `Job Materials`), reclassify into **COGS** instead of operating expense. QuickBooks treats Job Costs as cost of services, not opex.

### 3. `LINE_ITEM_DEFS.income_statement`
- Replace the single `Net Income` row with two rows: `Net Operating Income` and `Net Income`. Compare against the AI's `netOperatingIncome` and `netIncome` respectively. This eliminates the apples-to-oranges $918k variance.
- Add `Other Income` and `Other Expense` rows (only if either side has a value), so the user sees the below-the-line reconciliation explicitly.

### 4. Variance presentation
- For `Total Operating Expenses`, if the uploaded value is materially smaller than TB AND `(TB OpEx − Uploaded OpEx)` ≈ `(Uploaded COGS − TB COGS) × −1` (within 5%), surface a tooltip / note: *"Likely a Job Costs reclassification — QuickBooks counts Job Expenses as Cost of Services. The totals reconcile when combined."*
- Compute and surface a "Combined GP+OpEx parity" check so users can see that the operating block as a whole agrees even when individual lines drift.

### 5. Re-validate
- Auto-deploy and re-run validation against `c08f9791-…` (Profit and Loss CSV).
- Expected:
  - Job Expenses moved into TB COGS → TB COGS jumps to roughly match uploaded Job Costs.
  - TB OpEx drops to roughly uploaded $180k territory (within minor tolerance).
  - Net Operating Income compares clean.
  - Net Income compares clean (both sides now true bottom-line).
- If Job Expenses on the uploaded CSV are NOT in COGS, the reclassification can be toggled by a heuristic flag — we'll check the validation result and refine.

## Out of scope
- No UI changes beyond rendering the new line items the function already emits.
- No schema or migration changes.
- BS path unchanged (100% match).
