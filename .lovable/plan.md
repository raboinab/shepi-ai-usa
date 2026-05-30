## Fix GL↔TB reconciliation in `analyze-general-ledger`

Three concrete bugs in the analyzer are causing low TB match rates and the Checking-style snapshot gaps. All fixes are in `supabase/functions/analyze-general-ledger/index.ts`.

### 1. TB BS "last non-empty month" is the wrong snapshot

QuickBooks `TrialBalance` reports for BS accounts return the **as-of period-end balance** for the report's end date — not period-only activity. Today we pick the *last month where `debit !== 0 || credit !== 0`*. For accounts that had no December movement (very common for parked equity/loan accounts) we silently fall back to an older month and compare a stale snapshot against the YTD GL ending balance. That alone explains a chunk of "variances".

**Fix:** for BS accounts, pick the snapshot from the **chronologically last monthly report that contains *any* rows**, not the last month where this specific account moved. Track the global "last populated report index" once across the walk, then read `s.perMonth[lastIdx]` (zero counts as a valid snapshot). Fall back to the previous non-empty month only if that slot is genuinely absent (account didn't exist yet).

### 2. Classification fallthrough sums BS accounts as P&L YTD

When the COA lookup misses (no `acctId`, leaf-name collision, or COA simply doesn't list the account), `cls` defaults to `"OTHER"` and the code routes the account through the **P&L YTD-sum** branch. For a BS account that means we sum 12–36 monthly snapshots and produce a number 10–30× too large — e.g. Checking $260k → ~$3M. This is almost certainly the source of the Workbook-level $411k Checking figure too.

**Fix:** add a heuristic BS detector that runs when COA classification is missing:
- account name matches `/checking|savings|cash|bank|deposit|undeposited|payable|receivable|loan|note|mortgage|line of credit|equity|retained|capital|fixed asset|accumulated|inventory|prepaid|accrued|payroll liab|tax payable|credit card/i`
- OR the account's per-month series is monotonically non-decreasing/non-increasing across ≥3 months (snapshot signature, not flow)
Treat those as BS → point-in-time. Otherwise keep the P&L YTD path.

### 3. Identity-check double-counts when GL signs are mixed

`Math.abs(sumLiab)` / `Math.abs(sumEquity)` / `Math.abs(sumRevenue)` is applied to the **already-summed** total. If one liability is signed +500 and another −300 (sign convention drift across imports), the net is 200 and `Math.abs` gives 200, masking the real $800 of liabilities. Apply `Math.abs` per-account before summing instead.

### 4. Diagnostics

Add a one-line `console.log` per reconciled account when status="variance" with `{name, classification, glBalance, tbBalance, tbSourceMonthIdx}` so the next debugging pass can read the edge function log instead of guessing. Cap to first 25 to keep logs sane.

### Out of scope

- qbToJson ingestion shape (confirmed not the bug since the same `monthlyReports[]` payload feeds the Workbook correctly when classification resolves).
- Frontend TB parser (`src/lib/trialBalanceUtils.ts`) — unchanged.
- COA enrichment — unchanged; the heuristic above is the safety net for when COA is incomplete.

### Verification

After deploying, re-run the GL analysis on the same project and confirm via edge-function logs:
- `glDetailSource: "processed_data"` still set
- `matchCount` jumps materially above 1/76
- `identityCheck.difference` drops below the previous $3.7M
- Spot-check Checking: `tbBalance` should now ≈ $260k, not $411k
