## What we're actually comparing

Two independent views of the same accounts, both stored in `processed_data` for project `621a6c9f…`:

- **General Ledger (GL)** — 4 XLSX exports uploaded (2023, 2024, 2025, 2026 YTD). For each account we compute:
  - `snapshotBalance` — the running Balance column at the last transaction (correct for Assets / Liabilities / Equity)
  - `activityNet` — Σ of transaction amounts across all exports (correct for Revenue / Expense / COGS)
  - Selector: BS classes → snapshot, P&L classes → activityNet
- **Trial Balance (TB)** — one row in `processed_data` containing 41 monthly QuickBooks TBs (Jan 2023 → May 2026). Per account we compute:
  - `snapshotBalance` — debit − credit in the last populated month (for BS)
  - `yearSumBalance` — for each calendar year, take that year's last populated YTD-final and sum across years (for P&L, because QB TB YTD resets every January)

Reconciliation walks every GL account, matches by fully-qualified path first then by leaf name, and compares `glBalance` (BS: snapshot / P&L: activityNet) against `tbBalance` (BS: snapshot / P&L: yearSum).

## What the current 32% number is telling us — four separate problems

**1. The 2023 GL export was uploaded but never landed in `processed_data`.**
```
documents:      2023, 2024, 2025, 2026 YTD  (all "completed")
processed_data: 2024, 2025, 2026 YTD        (2023 missing)
```
TB includes 2023 in `yearSumBalance`, GL doesn't. This alone deletes an entire year of activity from every P&L comparison.

**2. Sign convention mismatch on P&L.**
GL activityNet comes out **positive** on revenue (`TikTok Sales +$5.16M`, `z_Shopify +$1.53M`). TB `yearSumBalance = debit − credit` is **negative** on revenue (credit balance). The reconciler subtracts them directly, so every revenue account books a variance ~= 2× the smaller number. Same accounts, opposite conventions.

**3. Magnitude gap beyond just missing 2023.**
`z_Shopify Sales`: GL $1.5M vs TB $17.7M (~12×). Missing 2023 alone can't explain this. Either the section walker is skipping rows in that account across the three parsed years, or `activityNet` is being read from the wrong column / netted against something. We don't yet know which — the diagnostic log lines added last turn haven't been read.

**4. Classification leak on numeric-prefixed accounts.**
`6105 Rent & Lease`, `6140 Phone/Internet` are tagged REVENUE. Both are expenses with a leading account number. This is a name-inference bug (numeric prefix defeats the "starts with revenue|sales|…" regex, then falls through to REVENUE default). Consequence: net income is inflated → identity check A − L − E − NI = −$10.9M.

## The plan

### Step A — read the diagnostic lines we already emitted

`analyze-general-ledger` currently logs a `[ANALYZE-GL:DIAG]`-style line per account (added last turn, not yet inspected). Trigger one re-run and pull the log lines for six canary accounts: `TikTok Sales`, `z_Shopify Sales`, `T-Shirt Sales`, `Shopify Discounts`, `6105 Rent & Lease`, `1015 Wells Fargo … 7179`. That resolves problem 3 (magnitude gap) without more guessing.

### Step B — re-ingest the 2023 GL

Its `documents` row is `completed` but no `general_ledger` `processed_data` row exists. Root cause is likely in the GL upload/parse edge function — a silent failure on that file. Re-trigger parsing and confirm a 4th `general_ledger` row appears.

### Step C — targeted code fixes in `supabase/functions/analyze-general-ledger/index.ts`

Only after Step A tells us what's actually wrong. Anticipated shape:

1. **Sign normalization keyed off QB metadata, not names.** Use the SECTION `group` (Income / CostOfGoodsSold / Expense / OtherIncome / OtherExpense) captured by the recursive `walkSections` added last turn to force `activityNet` onto TB's debit-minus-credit convention. Revenue → negative, Expense → positive. That eliminates the reconciler's sign flip in one place.
2. **Trust QB's summary row.** For each account section, prefer the `sum_amount` on the "Total for <account>" row (QB's own net) over hand-summing DATA rows. Log the delta when they disagree.
3. **Classification priority: QB metadata > numeric prefix > name regex > OTHER.** `acctType` / `detailType` from the section header wins. Only fall back to name inference when metadata is absent. Fixes `6105 Rent & Lease`, `6140 Phone/Internet`.
4. **Confirm dedup order.** The `id:` vs `name:` collapse must run **before** the classification-based balance selector, so revenue accounts with different `acctId`s across years merge before `activityNet` is chosen.

### Step D — verify

Re-run analysis. Success criteria:

- `z_Shopify Sales` within ~5% of TB's yearSum, correct sign
- `6105 Rent & Lease` classified EXPENSE
- Identity check `|A − L − E − NI|` inside `max($1K, 1% of assets)`
- Reconciliation rate materially above 36%
- No revenue row with a sign-flipped variance

## Out of scope

- UI or copy changes on `/project/…/general-ledger`
- TB parsing changes (TB side is behaving correctly)
- Any project-specific hardcoding — every fix keys off QB metadata or generic rules that apply to all projects

## Technical notes

- File touched in Step C: `supabase/functions/analyze-general-ledger/index.ts` only.
- Step B may also touch the GL upload/parse function once we identify which one silently dropped the 2023 file.
- No migrations. No frontend changes.
