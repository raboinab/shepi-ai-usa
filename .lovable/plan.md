# Tax Return Analysis — Make It Actually Cross-Check Everything

## Today's gap

The 1120-S parser extracts **~60 fields** (every P&L line, every Sch L balance both dates, all 19 Sch K items, full M-1 / M-2, 1125-A COGS sub-items). The comparator runs against **only 5–7 of them** (Gross Receipts, Wages, Officer Comp, Depreciation, Interest, Total Assets, Taxable Income). Everything else — rent, repairs, taxes, advertising, bad debts, other deductions, M-1 book/tax recon, every Sch L line, all Sch K income/dividends/charitable/179/distributions, 1125-A purchases & inventory — is shown but never validated, even though the project already has `trial_balance`, `general_ledger`, `canonical_transactions`, `ar_aging`, `ap_aging`, `chart_of_accounts`, `balance_sheet`, and `payroll` loaded into `processed_data`.

Also: the `-1%` Consistency Score is a sentinel for "no comparisons ran" but the UI renders it literally with a red bar.

## What to build (one pass, no schema changes)

### 1. Generalized account-mapping comparator (new helper in `parse-tax-return/index.ts`)

Add a `compareLineToGL(taxField, taxValue, accountMatchers, sources)` helper that:
- Pulls year-scoped totals from the **best available** source in this order:
  1. `canonical_transactions` (sum amounts for the tax year by account name/number regex) — most precise
  2. `processed_data.trial_balance` for the tax year (ending balance for BS lines; YTD activity for P&L lines)
  3. `processed_data.general_ledger` aggregated by account
  4. `processed_data.balance_sheet` / `income_statement` line totals as fallback
  5. `wizard_data.*` cached versions
- Returns `{ comparisonValue, source, variance, variancePercent, status }`.
- Uses an account-name/number matcher map (regex-based) per tax line so e.g. "Rents (11)" matches any GL account containing "rent" / "lease" excluding "rental income".

### 2. Cover every extracted field

Add `comparisons.push(...)` blocks for each tax field below, each using `compareLineToGL` with its matcher list. Group by tab so the UI can section them.

**Page 1 — Income & Deductions (currently 2 of 14 covered → all 14)**
- Returns & Allowances, Net Receipts, Other Income, Total Income
- Officer Comp ✓ (already), Salaries & Wages ✓, plus: Repairs, Bad Debts, Rent, Taxes & Licenses, Interest ✓, Depreciation ✓, Depletion, Advertising, Pension, Employee Benefits, Other Deductions, Total Deductions, Ordinary Business Income

**Schedule L — 0 of 40 line-items → all 40 (20 BOY, 20 EOY)**
- Each line vs. corresponding BS account: cash, AR, inventory, loans to/from shareholders, other current assets, buildings, depreciable assets, accumulated depreciation, land, other assets, total assets ✓, AP, mortgages, other liabilities, total liabilities, capital stock, retained earnings, AAA, total equity.
- AR specifically also cross-checks `ar_aging` total; AP cross-checks `ap_aging`.

**Schedule M-1 — 0 of 6 → all 6**
- `netIncomePerBooks` vs. `incomeStatement.netIncome` for the year.
- `incomePerScheduleK` vs. sum of K income lines (internal self-check).
- Reconciling items: surface as "review only" since they have no GL counterpart.

**Schedule M-2 — 0 cross-checks → real ones**
- Internal: `endingAAA == beginningAAA + ordinaryIncome + otherAdditions − lossDeductions − otherReductions − distributionsCash − distributionsProperty` (already a flag — promote to a comparison row).
- `distributionsCash + distributionsProperty` vs. equity/distribution account activity in TB/GL — this finally answers the "Shareholder Distributions" row instead of leaving it as "Review Required".

**Schedule K — 0 of 19 real comparisons → key ones**
- `ordinaryBusinessIncome` ↔ Page 1 line 21 (internal).
- `interestIncome` ↔ GL interest-income accounts.
- `charitableContributions` ↔ GL charitable account.
- `section179Deduction` ↔ fixed-assets section 179 entries.
- `distributions` ↔ M-2 distributions + equity GL (replaces today's stub).
- Remaining low-signal K items → "review only" group.

**1125-A — 0 sub-line checks → all 6**
- Beginning/ending inventory ↔ TB inventory account.
- Purchases ↔ GL purchases account.
- Cost of labor ↔ payroll direct-labor classification (if tagged).
- Total COGS ↔ Page 1 line 2 (already implicit).

### 3. Scoring & status

- Keep status buckets: `match` (<2% variance), `minor_variance` (2–10%), `material_variance` (>10%), `missing_data`, plus new `review_only` for items with no automatable counterpart (most K items, M-1 reconciling lines).
- `overallScore` excludes `missing_data` AND `review_only` from the denominator.
- If `totalComparisons === 0` → return `overallScore: null` (not `-1`).

### 4. Year-matching fix

- Replace last-write-wins loop (line 741–748) with explicit per-data_type query filtered to `period_end` within `{taxYear}-01-01` … `{taxYear}-12-31`. Fall back to nearest period only if exact-year missing, and tag the source label `(period mismatch)`.
- For `canonical_transactions`, query directly with `txn_date >= {year}-01-01 AND txn_date <= {year}-12-31`.

### 5. UI updates — `TaxReturnInsightsCard.tsx`

- Treat `overallScore == null || overallScore < 0` → render "N/A" badge + helper line, hide Progress bar, skip red coloring.
- If `comparisons.length === 0` → hide the comparison `<Table>` entirely.
- Group the comparison table by category (Page 1, Schedule K, Schedule L, M-1/M-2, COGS) with collapsible sub-sections — matches the existing tab structure.
- Add a separate "Manual review (no automated counterpart)" section listing `review_only` rows so they don't look like broken variances.
- Add an "Account match" column showing which GL account(s) the comparison resolved to (transparency).

### 6. Re-analysis trigger

- Existing "Re-analyze" button in `DocumentUploadSection` is sufficient. No migration of old `tax_return_analysis` rows — user re-runs each year and the new logic writes a fresh record.

## Out of scope

- AI extraction itself (we already get all the fields).
- New tables, new RLS, new edge functions.
- CPA review workflow / attestation (untouched per project doctrine).
- Multi-year trend comparison across tax returns (separate feature).

## Files to touch

- `supabase/functions/parse-tax-return/index.ts` — new `compareLineToGL` helper, account matcher map, ~50 comparison blocks replacing the existing 7, year-scoped fetch, `overallScore` null handling, `review_only` status, GL/canonical_transactions queries.
- `src/components/wizard/sections/TaxReturnInsightsCard.tsx` — null-score guard, empty-table guard, category grouping, "manual review" section, "Account match" column.

## Verification

- Re-analyze the existing 2023 / 2024 / 2025 1120-S records and confirm:
  - Each year shows a real numeric score (or "N/A" with helper text if literally no financial data exists).
  - Page 1 deductions (rent, repairs, taxes, advertising, other deductions) show GL-sourced variances.
  - Sch L AR/AP rows reconcile to AR/AP aging totals.
  - Shareholder Distributions resolves to a real variance instead of "Review Required".
  - M-2 AAA roll-forward arithmetic shows as its own comparison row.
