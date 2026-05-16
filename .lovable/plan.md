## What I found

The current visible card is stale. The latest Supabase runs are not producing the `Unknown / $0 / Other: 76` result anymore.

Latest `general_ledger_analysis` rows for the project:

```text
2026-05-16 13:08  score 54, accounts 15, account types ASSET:9 / LIABILITY:5 / EQUITY:1
2026-05-16 13:04  score 54, accounts 15, account types ASSET:9 / LIABILITY:5 / EQUITY:1
2026-04-16 22:49  score 0,  accounts 76, account types Other:76, Unknown/$0 rows
```

So: yes, auto-refresh should change the displayed values from the stale 0%/Unknown card to the newer 54%/15-account result.

## Why it still doesn’t make sense

There is a second backend/data-quality issue in the latest “good” run: the GL parser/analysis is only using `source_type = general_ledger` rows in `canonical_transactions`, and the dataset appears capped/partial. The function logs show 15 accounts and the stored result has only 1,000 transactions in the summary, while direct canonical data shows more GL rows and many income/expense accounts.

That means there are two fixes:

1. **UI refresh bug**: the card can keep showing the old April row after re-run.
2. **Analysis completeness bug**: the latest run is better than April, but may still be incomplete/filtered incorrectly, so its values may still not fully match expectations.

## Plan

### 1. Make “Re-run analysis” update the parent card immediately

- Add an `onComplete` callback to `AnalysisRunButton`.
- After `useAnalysisTrigger` finishes and refetches the stored result, call the parent `fetchGLAnalysis()`.
- Pass `onComplete={fetchGLAnalysis}` from `DocumentUploadSection` for General Ledger.
- Do the same for Journal Entries if that button uses the same shared component, to avoid the same stale-card behavior there.

### 2. Make the GL fetch deterministic and resilient

- In `fetchGLAnalysis`, select `id`, `created_at`, and `data` so we can key the card by the actual processed row rather than array index.
- Clear `glAnalysis` to an empty array if no row exists, instead of leaving old state in place.
- Prefer the newest `created_at` row as it already does, but make the rendered key include the row id/created timestamp so React cannot preserve old card internals.

### 3. Stop duplicate success toasts

- The shared trigger already shows “Analysis complete”.
- The realtime listener also shows “General ledger analysis complete”.
- Keep only one clean completion signal for this path or make the realtime toast conditional so users don’t get duplicate/contradictory messages.

### 4. Investigate the GL completeness issue separately in the same pass

- Inspect the canonical GL query and the analysis function’s `.limit(50000)` usage.
- Compare counts in `canonical_transactions` by source/account/date with the latest analysis output.
- If the analysis is unintentionally excluding income/expense accounts or using a capped parser result, adjust the backend query/aggregation so the displayed values reflect the complete uploaded GL.

## Expected result

After implementation:

- Clicking **Re-run analysis** updates the visible GL card without a hard refresh.
- The old `0% / 76 Unknown / Other` card should no longer remain after a successful run.
- If backend completeness is fixed, the card should also show a more credible account mix beyond just ASSET/LIABILITY/EQUITY.