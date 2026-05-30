# Fix GL ↔ TB reconciliation in `analyze-general-ledger`

## Root cause (confirmed against live data, project `fa07…`, `processed_data` id `ad99…`)

I queried the actual `monthlyReports` array and traced "Decks and Patios" across all 36 months:

```
i=3   credit  300.30
i=4   credit  300.30
i=5   credit  300.30
i=6   credit  300.30
i=7   debit   606.09
…
i=35  debit  7363.81  (Job Expenses:Job Materials:Decks and Patios)
i=35  credit 15314.13 (Landscaping Services:Job Materials:Decks and Patios)
```

Three bugs, all in the TB ingestion side of the edge function:

1. **Each monthly TB report is a YTD-cumulative snapshot** — values plateau across consecutive months (300.30 for 4 months in a row) and only step when new activity posts. The current P&L branch sums all 36 months → multiplies the true period total by ~36 (Decks TB shows −$1.67M; actual signed leaf ≈ −$15k). The earlier "sum YTD across months" assumption was wrong.
2. **Same leaf name appears under multiple parent groups** in QBO TB output (`Landscaping Services:Job Materials:Decks and Patios` AND `Job Expenses:Job Materials:Decks and Patios`). GL reports the bare leaf "Decks and Patios". Today `series` is keyed by the full colon-delimited name, then `tbByLeaf.set(normName(s.name), t)` last-write-wins on the leaf — silently dropping one of the two halves and breaking the sign.
3. **Name matching mismatch** — only 1/76 accounts match. GL uses leaves; TB has parent-prefixed paths; both sides also vary on punctuation (`(A/R)`, `&`, double spaces). Normalization needs to be symmetric on both sides.

## Fix (edge function only — `supabase/functions/analyze-general-ledger/index.ts`, lines ~293–435)

### 1. Treat monthly TB reports as YTD-cumulative snapshots (BS and P&L)
- Replace the BS-vs-P&L branching with a single rule: use the **last populated monthly report** for every account regardless of classification.
- A monthly TB run for month N in QBO contains end-of-month-N YTD balances; end-of-Dec-2025 IS the period total for P&L AND the snapshot for BS. No summing.
- Keep the fallback walk-back to last non-empty month if the chosen slot is missing for a particular account.
- Drop `looksMonotonic`, `bsNameRe`, and the YTD-sum branch — no longer needed.

### 2. Aggregate by leaf with signed net (debit − credit)
- After building `series` keyed by full path, build `tbByLeaf` by summing `debit − credit` across all series entries that share the same normalized leaf.
- Result: `Decks and Patios` leaf TB balance = (revenue credit) + (expense debit) netted to one signed number, which can be compared to GL's leaf "Decks and Patios".
- Keep `tbByName` (full path) and `tbByAcctNum` for first-pass exact matching; fall through to leaf aggregate.

### 3. Symmetric name normalization
- Introduce `normKey(s)` = `s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim()`.
- Apply on both GL side (`acct.name` and `acct.leaf`) and TB side (full path leaf and series key) so "Accounts Receivable (A/R)" matches "accounts receivable".
- Match order per GL account: `acctNumber` → `normKey(full name)` → `normKey(leaf)`.

### 4. Diagnostics
- Keep the per-variance `console.log` (capped 25). Add one extra log line per match: `matchedBy=acctNum|fullName|leaf`. Add a summary line: `matchCount/totalAccounts and TB-leaves-aggregated`.

## Out of scope
- `qbToJson` ingestion (storage shape is correct; the analyzer was reading it wrong).
- Frontend `src/lib/trialBalanceUtils.ts` (separate UI parser, not used by the edge function).
- COA enrichment / classification side of the file.
- `GeneralLedgerInsightsCard` UI — display layer is unchanged; only the numbers feeding it change.

## Verification after deploy
Re-run analysis on the existing deal and check the edge-function logs / UI:
- `Matched Accounts` should jump from `1 / 76` to roughly `50+ / 76`.
- `Decks and Patios` TB column should be in the −$15k range, not −$1.67M.
- `Checking` TB stays ≈ $410,901 (Dec-2025 snapshot is correct; the GL-side $260k vs TB $411k is a real ingestion variance, not an analyzer bug — flag remains).
- `A − L − E − NI` identity should drop substantially (revenue inflation removed).
