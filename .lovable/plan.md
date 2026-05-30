# Fix TB ingestion: P&L is YTD-within-year and resets each January

## What re-ran

Yes — Edge Function logs show two `Complete: 78 accounts, 2 flags, score=1, matched=1/76` calls in the last few minutes. The previous GL-parser fix is live and working (Decks $13,037, Plants $15,993, Sprinklers $24,891 are now real period totals instead of last-txn fragments). But `matched` is still 1/76 because **the TB side is now under-reported**, so almost every account fails the variance tolerance.

## Root cause (confirmed against `processed_data` id `ad998424…`)

Each entry in `monthlyReports[]` is a **single-month** QuickBooks TB run (`startDate` = first of month, `endDate` = last of month, e.g. Dec 1 2025 → Dec 31 2025). 36 reports cover Jan 2023 → Dec 2025.

The values inside each monthly TB behave differently by account class:

- **Balance Sheet (Asset / Liability / Equity)** — true end-of-month balance. Example: month 35 Checking = $410,901, which IS the period-end. Last populated month is the right answer.
- **Revenue / Expense** — YTD-cumulative within a calendar year, RESET each January. Confirmed for "Other Income":

  ```
  May–Nov 2023:   credit  $5,420.14  ← YTD plateau
  Dec 2023:       credit  $7,570.44  ← full year 2023
  Jan–Oct 2024:   (empty / 0)
  Nov–Dec 2024:   credit $21,633.84  ← full year 2024
  Jan–May 2025:   (empty)
  Jun–Jul 2025:   credit $56,312.95
  Aug–Dec 2025:   credit $69,017.69  ← full year 2025
  ```

  Correct full-period TB for Other Income = Dec23 + Dec24 + Dec25 = **$98,221.97**. The analyzer currently reports `$6,607` (one slot of one month) and the previous "sum-all-months" code would have reported ~$300k (~3× year inflation).

The current code (lines 304–415) always uses `lastPopulatedIdx` globally — fine for BS, wrong for P&L. That's why every revenue/expense line shows variance.

## Fix — `supabase/functions/analyze-general-ledger/index.ts`

### 1. Build BOTH a snapshot AND a year-sum per series (lines 372–398)

For each series, compute two TB values from `perMonth[]`:
- `snapshot` — value at `lastPopulatedIdx` with walk-back fallback (current logic).
- `yearSum` — sum of the **last populated month within each calendar year** the series touched. Year boundaries derive from the `monthly[idx].year` field which is already present in the data.

Carry both on the `TBAcct` so reconciliation can pick the right one per match.

```ts
type TBAcct = {
  name: string;
  snapshotDebit: number; snapshotCredit: number;
  yearSumDebit: number;  yearSumCredit: number;
  snapshotBalance: number;  // snapshotDebit - snapshotCredit
  yearSumBalance: number;   // yearSumDebit  - yearSumCredit
};
```

Year-sum algorithm: for each unique `year` value in `monthly`, find the highest `monthIdx` in that year where `perMonth[idx].debit !== 0 || credit !== 0`; add that slot. Accounts with no activity in a year contribute 0 for that year.

### 2. Leaf aggregation operates on both values (lines 400–414)

`leafAgg` sums `snapshotDebit/Credit` and `yearSumDebit/Credit` separately so the leaf bucket exposes both.

### 3. Pick the right value at match time (lines 435–445)

The GL `acct.classification` is already known here (`ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE | OTHER`).

```ts
const isPL = acct.classification === "REVENUE" || acct.classification === "EXPENSE";
const tbBalance = isPL ? tb.yearSumBalance : tb.snapshotBalance;
```

Then variance compares `acct.glBalance` to that picked `tbBalance`. Material-variance and match logic unchanged.

### 4. Update the comment block at lines 304–308

State the actual behavior (single-month TB; P&L resets each January; sum each year's last populated month for P&L; last-populated-month overall for BS).

### 5. Logging

Update the summary log to also print P&L vs BS match counts so future regressions are obvious:

```
[ANALYZE-GL] TB ingested: 36 monthly reports, N full-path, M leaf
[ANALYZE-GL] Reconciliation: matched=X/Y (BS=a, P&L=b), variances=Z, missingInTB=W
```

## Expected outcome after deploy

- `Other Income` TB → ~$98,222 (vs current −$6,607) and GL $331k — closer but still variance (likely a separate `qbToJson` issue for income side; out of scope).
- `Labor` TB → ~$148k (matches GL $148k).
- `Decks and Patios` TB → ~$13k (matches GL $13k).
- `matched` count jumps materially. Whatever residual variance remains is real data drift between the GL and TB ingestion pipelines, not an analyzer bug.

## Out of scope (separate issue if remaining)

- Sign convention on the income side (revenue accounts in QBO carry a credit balance; the analyzer treats `balance = debit - credit`, which yields negative — that's fine for BS but P&L variance should compare absolute magnitudes; the existing `absDiffMag` branch already does this).
- The `qbToJson` ingestion pipeline that produces `processed_data`.
- COA enrichment, frontend, scoring.
