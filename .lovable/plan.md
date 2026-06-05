## The real root cause (different from the previous plan)

While inspecting the actual `processed_data` rows for this project, I found the previous plan was wrong about *why* nothing was matching. The qbtojson rows exist with `period_end = NULL` (as expected), but their `data` payload is the raw **QuickBooks Reports API shape**, not the normalized accounts/`monthlyValues` shape the comparison engine reads.

Actual shapes in DB for project `fa0768ca-…be3ede`:

| `data_type` | `source_type` | Actual `data` shape |
|---|---|---|
| `income_statement` | `qbtojson` | Array of 36 `{ month: "YYYY-MM", report: { rows, header, columns }, startDate, endDate }` |
| `balance_sheet` | `qbtojson` | Same — array of 36 monthly QB BalanceSheet reports |
| `cash_flow` | `qbtojson` | Same — array of 36 monthly QB CashFlow reports |
| `trial_balance` | `qbtojson` | `{ summary, monthlyReports: [ { year, month, report, … } x 36 ] }` |
| `general_ledger` | `qbtojson` | `{ rows, header, columns }` — single multi-year report |

What the comparison engine reads:

```
incomeStatement.revenue.accounts[i].monthlyValues["YYYY-MM"]
incomeStatement.expenses.accounts[i].monthlyValues[...]
incomeStatement.cogs.accounts[...]
balanceSheet.<bucket>.accounts[...].monthlyValues[...]
```

That shape does not exist for this project. So `sumISMonthly`, `matchISAccounts`, `getBsEoyByMatcher`, M-1, M-2, Schedule L all return 0 silently — exactly the "regression to 3 tautological comparisons" I observed. The previous rewrite added year-scoping and diagnostics for a shape that's never present in real data.

## Fix: normalize at read time inside the edge function

Add a one-stop adapter that converts the raw QB report shapes into the engine's expected `{revenue, cogs, expenses}` / `{assets, liabilities, equity}` / `{accounts: [{name, monthlyValues}]}` shape, keyed by `YYYY-MM`. Apply it whenever the resolver picks a qbtojson row.

No DB schema changes. No changes to extraction. No changes to the QB ingestion pipeline. Only `supabase/functions/parse-tax-return/index.ts` and the existing UI diagnostics block.

### 1. New normalizers (server, inside `parse-tax-return/index.ts`)

- `normalizeQbPnlMonthly(rows: QbMonthlyPnL[]): IncomeStatement`
  - Walks each `{month, report}` entry, flattens `report.rows` (handling QB's nested `Section`/`Data`/`Summary` row types).
  - Buckets by top-level section header text: `Income` → `revenue`, `Cost of Goods Sold` → `cogs`, `Expenses` / `Other Expense` → `expenses`. Net section subtotals are skipped.
  - Per leaf account, accumulates `monthlyValues["YYYY-MM"] = signedAmount`. Sign follows QB convention (revenue positive, expenses positive on debit).
  - Output is exactly `{ revenue: { accounts: [...] }, cogs: {...}, expenses: {...}, totalRevenue, netIncome }`.
- `normalizeQbBalanceSheetMonthly(rows: QbMonthlyBS[]): BalanceSheet`
  - Same idea, bucketed into `assets`, `liabilities`, `equity` by QB section. `monthlyValues["YYYY-MM"]` holds the **end-of-month** balance (BS is point-in-time, so the last value of each month, not a sum).
- `normalizeQbTrialBalance(payload): TrialBalance`
  - Reads `monthlyReports[].report.rows` → per account `{ debit, credit }` per month.
- `normalizeQbGeneralLedger(payload): { transactions: [...] }`
  - Flattens `rows` into `{ date, account, amount, memo }` rows the existing `glByAccount` / `matchAccounts` logic already understands.

All four are pure, ~50–80 lines each, with shared row-walking helpers.

### 2. Hook normalizers into the resolver

In the existing `pickProcessedData(dataType)` block:

- After selecting a qbtojson row (the aggregate-period branch), pass it through the matching normalizer before returning. The rest of the file works unchanged because it now sees the expected shape.
- For unified_api monthly rows (already normalized today), no change.
- Keep the existing year-scoping in `sumISMonthly` and `getBsEoyByMatcher` — they're correct, they just had no data to iterate.

### 3. Restore + harden the Shareholder Distributions comparison

Currently 2025 regressed from 4 → 3 comparisons because the Distributions branch checks `m2.distributionsCash + m2.distributionsProperty` against book Distributions, and book Distributions came from the BS `equity` bucket, which was empty. Once (1) and (2) land, the equity bucket exists, so this fires again. Add an explicit `if (!bookDistributions) skippedFields.push({...})` so the regression can't happen silently next time.

### 4. Replace silent skips with explicit diagnostics

Every comparison that today does `if (matched.total === 0) continue;` becomes:

```ts
if (matched.total === 0) {
  skippedFields.push({ field: label, reason: hasGL
    ? `No GL account matched ${matcherKey}`
    : `No IS account matched ${matcherKey}` });
  continue;
}
```

Same treatment for the M-1, M-2, and Schedule L branches when their book counterpart is 0/missing. `analysisDiagnostics.skippedFields` already exists in the type — just populate it everywhere instead of in only two places.

### 5. UI: show skippedFields in the card

`TaxReturnInsightsCard.tsx` currently renders only `sources`. Add a collapsible "Skipped checks (N)" section under the score listing each `{field, reason}` so silent failures surface to the user immediately. Stale-result auto-reanalyze logic already added stays.

### 6. Verification (mandatory before claiming done)

For each of the 3 stored returns (2023, 2024, 2025):

1. Call `parse-tax-return` and capture `comparisons.length`, `overallScore`, and `skippedFields.length`.
2. Spot-check one revenue and one expense comparison per year: log `matched.accounts` and `comparisonValue`, manually confirm the matched accounts in the QB monthly report sum to that value for that year.
3. Confirm Distributions comparison reappears for 2025 (the row that regressed). Confirm at least one M-1 and one Schedule L comparison fires for each year.
4. Expected post-fix counts: 2025 ≈ 12–18 comparisons; 2023/2024 ≈ 8–12 each. Anything below those should show up as `skippedFields` rows with a real reason.

The fix is only "done" when those three checks pass — not when HTTP 200 + `variance: 0` show up.

## Files touched

- `supabase/functions/parse-tax-return/index.ts` — add 4 normalizers, wire into resolver, populate `skippedFields` on every skip, restore Distributions guard.
- `src/components/wizard/sections/TaxReturnInsightsCard.tsx` — render `skippedFields` block.

## Out of scope

- DB schema changes, ingestion changes, PDF extraction changes.
- Normalizing unified_api shapes (already normalized).
- Bank-statement-only reconciliation.
- Any change to the year resolver beyond passing qbtojson rows through the new normalizers (the previous plan's resolver tweaks already shipped and are correct).
