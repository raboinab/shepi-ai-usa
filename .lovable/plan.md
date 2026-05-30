## Problem

Uploaded P&L "Sandbox Company_US_2_Profit and Loss by Month.csv" shows $2.7M revenue. TB-derived shows $18.4M revenue. Ratio ~6.8x.

Root cause: TB spans Jan-2023 → Dec-2025 (36 months). The current IS path in `deriveTotalsFromTrialBalance` sums **all periods** in the TB when no `periodStart`/`periodEnd` is passed. The uploaded P&L covers only a subset of those months (likely partial-year or a specific year), so we're comparing a multi-year TB total against a single-period upload.

The Balance Sheet flow already handles this: AI extracts `asOfDate` and we re-derive TB totals anchored on that date. The Income Statement flow has no equivalent — it never extracts or applies a reporting period from the uploaded P&L.

## Fix (single file: `supabase/functions/validate-financial-statement/index.ts`)

1. **Extend `DerivedTotals`** with `periodStart?: string | null` and `periodEnd?: string | null` (uploaded side).

2. **Update the AI extraction prompt for `income_statement`** to also extract:
   - `periodStart` (YYYY-MM-DD) — first reporting month in the file (e.g. earliest monthly column header, "For the period beginning …", or first month of a "YTD" range).
   - `periodEnd` (YYYY-MM-DD) — last reporting month (e.g. latest monthly column header, "as of …", "year ended …").
   - If only month/year is available, snap start to first-of-month and end to last-of-month.
   - Return null for either if not determinable.

3. **In the handler**, after AI extraction for `income_statement`, if uploaded `periodStart` and/or `periodEnd` came back and caller didn't pass explicit values, set `effectivePeriodStart`/`effectivePeriodEnd` to the extracted dates and **re-derive `derivedTotals`** scoped to that range. The existing `getPeriodKeysInRange` already handles the slice for IS accounts.

4. **Defensive fallback**: if neither date can be extracted, log a warning and append a note to the summary ("Could not determine the P&L reporting period — derived TB values may span a different range").

5. **Surface the period context** in the summary on success, e.g. "(Scoped to 2025-01-01 → 2025-05-31.)" so users see what window we compared.

## Expected outcome

AI extracts the P&L's actual reporting window from the monthly column headers → TB IS sum narrows to those same months → revenue/COGS/OpEx/GP/NI line up → match score climbs from 0% to ~100% (or surfaces real classification variances instead of period-mismatch noise).

## Out of scope

- No client/UI changes (existing card already renders summary + line items).
- No schema/migration changes.
- BS validation path untouched.
