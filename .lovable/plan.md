## Goal

Close the remaining gaps so `parse-tax-return` produces the same comparison set regardless of whether a project's financial data came from uploaded documents, `qbtojson`, or `quickbooks_api` / `unified_api`. Then verify against the 3 returns already stored for project `fa0768ca-…be3ede` (2023, 2024, 2025).

## What already works

- qbtojson **Income Statement** and **Balance Sheet** are normalized at read time via `maybeNormalizeQbData` → comparisons fire correctly.
- `skippedFields` is populated for most no-match branches and rendered in `TaxReturnInsightsCard`.
- Year-scoped GL aggregation from `canonical_transactions` (when present) feeds P&L matchers.

## What's still broken or incomplete

1. **qbtojson Cash Flow** is never normalized. No comparison reads it today, but the helper is missing from the "all sources work" claim.
2. **qbtojson Trial Balance** is never normalized. `wizardData.trialBalance` / `processedData.trial_balance` is consulted by some BS fallbacks (`getBsEoyByMatcher` only reads `balance_sheet`, but several callers in the wizard chain pass TB through). On a TB-only project, every BS comparison silently skips.
3. **GL fallback for qbtojson-only projects**: when `canonical_transactions` has no rows for the year, `hasGL = false` and every P&L matcher in the loop at line 1286 falls through to `{total: 0}` and emits a skip. We already have monthly IS account data after normalization — we should synthesize a pseudo-GL aggregate (`{name → abs total}`) from the normalized IS so `matchAccounts` works without `canonical_transactions`.
4. **quickbooks_api / unified_api shape probe**: `maybeNormalizeQbData` early-returns whenever `sourceType !== "qbtojson"`. If those rows happen to land in the raw QB Reports shape (which they often do — the unified API proxies QB reports), they bypass normalization. Detect raw shape regardless of `source_type` label.
5. **Distributions / M-2 regression guard** — already added but worth re-verifying on 2025 once items 3–4 land.

## Changes

All edits live in `supabase/functions/parse-tax-return/index.ts`. No DB schema changes. No ingestion changes.

### 1. Add two normalizers next to the existing pair

- `normalizeQbCashFlowMonthly(months)` → `{ operating: NormalizedSection, investing: NormalizedSection, financing: NormalizedSection, netChange: number }`. Same `walkQbLeaves` helper; bucket by `group` in {`OperatingActivities`, `InvestingActivities`, `FinancingActivities`}.
- `normalizeQbTrialBalance(payload)` → `{ accounts: [{ name, debit, credit, monthlyValues }] }`. Reads `payload.monthlyReports[].report.rows`, accumulates debit/credit per account per month, plus a single EOY value for `monthlyValues[YYYY-12]`.

### 2. Generalize the shape probe

Replace the `sourceType !== "qbtojson"` early return in `maybeNormalizeQbData` with:

```ts
const looksRawQb = isRawQbMonthlyArray(data) || hasMonthlyReports(data);
if (sourceType !== "qbtojson" && !looksRawQb) return data;
```

`hasMonthlyReports(data)` returns true when `data?.monthlyReports?.[0]?.report?.rows` exists (qbtojson TB shape, occasionally produced by `quickbooks_api`).

Wire `cash_flow` and `trial_balance` cases into the switch.

### 3. Synthesize pseudo-GL from normalized IS when canonical_transactions is empty

After the `glByAccount` build at line 1005:

```ts
if (!hasGL && processedData.income_statement?.revenue?.accounts) {
  for (const group of ["revenue","cogs","expenses"] as const) {
    for (const a of processedData.income_statement[group]?.accounts ?? []) {
      const yearTotal = Object.entries(a.monthlyValues ?? {})
        .filter(([k]) => k.startsWith(yearMonthPrefix))
        .reduce((s, [,v]) => s + Math.abs(Number(v) || 0), 0);
      if (yearTotal === 0) continue;
      glByAccount.set(a.name, { signed: yearTotal, abs: yearTotal, type: group });
    }
  }
  hasGL = glByAccount.size > 0;
  if (hasGL) skippedFields.push({ field: "GL source", reason: "Synthesized from normalized Income Statement (no canonical_transactions for year)" });
}
```

This lets `matchAccounts` resolve P&L matchers for qbtojson-only projects.

### 4. Emit explicit skip on TB-only fallthrough

If `processedData.balance_sheet` is missing but `processedData.trial_balance` exists with EOY balances, derive a synthetic BS-shaped object from the TB normalizer output and feed `getBsEoyByMatcher`. Otherwise log a `skippedFields` row stating "Balance Sheet missing; TB present but not yet wired" — surfaces the gap rather than silently scoring 0.

### 5. Verification (mandatory before declaring done)

Invoke `parse-tax-return` for each of the 3 returns and record:
- `comparisons.length`
- `overallScore`
- `skippedFields.length` (and the reasons)
- Counts of P&L, Schedule L, M-1, M-2, Distributions comparisons

Expected post-fix targets:
- 2025: ≥ 12 comparisons, Distributions row present, ≥ 1 M-1 calc check, ≥ 3 Schedule L rows.
- 2023 / 2024: ≥ 8 comparisons each, ≥ 2 Schedule L rows each.
- Every remaining 0-match branch shows up in `skippedFields` with a concrete reason — no silent skips.

Spot-check one revenue and one expense match per year against the QB monthly report sum to confirm pseudo-GL totals are correct.

## Out of scope

- DB schema changes, ingestion changes, PDF extractor changes.
- Building the BS-from-TB synthesizer if no project actually needs it (will skip cleanly via `skippedFields` instead).
- Touching any other edge function.

## Files touched

- `supabase/functions/parse-tax-return/index.ts` — two new normalizers, generalized shape probe, pseudo-GL fallback, explicit TB-only skip diagnostic.
