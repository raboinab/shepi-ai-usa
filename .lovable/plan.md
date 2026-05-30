## What's actually broken (confirmed against `processed_data` for project `fa0768ca…`)

Re-run did fire — logs show two `Complete: 78 accounts, 2 flags, score=1, matched=1/76` invocations and the new `(snapshot for BS, yearSum for P&L)` log line is present. The yearSum work is live. But reconciliation got *worse* (1/78 matched, 75 variances) because two deeper bugs were always there and are now exposed.

### Bug 1 — TB leaf aggregation merges Revenue and Expense sides of the same leaf

QB returns the TB as a **flat list of rows** where `colData[0].value` is the full colon-delimited path and `colData[0].id` is the stable QB account id. Confirmed for month 35:

```text
id 19   Landscaping Services:Job Materials:Decks and Patios            credit 15,314.13   (revenue leaf)
id 50   Job Expenses:Job Materials:Decks and Patios                    debit   7,363.81   (expense leaf)
id 23   Landscaping Services:Labor                                     credit 14,567.05   (revenue leaf)
id 45   Job Expenses:Cost of Labor                                     debit   3,823.47   (expense leaf)
…
```

`series` is keyed by full path → distinct. **But `leafAgg`** (lines 440-461) reduces every series to `normKey(leafOf(name))` — i.e. just `"decks and patios"` — and sums the revenue and expense halves into a single TB bucket. That bucket then leaks back through `tbByLeaf`, AND through `tbByAcctNum` because the series records the *first* acctId seen for that leaf.

This is exactly what the shared `supabase/functions/_shared/tbAggregation.ts` was written to prevent ("Never merges two TB rows on bare leaf name alone — that was the bug that silently collapsed accounts like Job Materials (Income) + Job Materials (Expense)…"). This analyzer doesn't use that helper.

### Bug 2 — GL classification is wrong for the same colliding leaves

Variance log shows `Labor cls=REVENUE gl=148370.62` and `Fountains and Garden Lighting cls=REVENUE gl=45.00`. Labor is an expense; Fountains and Garden Lighting appears under both Revenue (small $45) and Expense ($14k). The GL parser is inferring classification from leaf name without preserving parent context, so the same name gets one class for all occurrences. This needs disambiguation too.

### Bug 3 — Match priority guarantees the wrong answer

`acct.acctNumber` (GL side) is matched against `tbByAcctNum` (TB side). When series collapsed onto a leaf overwrote `acctId`, the wrong TB row gets returned and the variance log misleadingly says `matchedBy=acctNum`.

## Fix — three coordinated changes in `supabase/functions/analyze-general-ledger/index.ts`

### 1. Key TB series on `acctId` (stable QB id), not display name

Lines 352–386. The walker today does `series.set(name.toLowerCase(), ...)`. Change to:

```ts
type Series = { id: string; fullPath: string; perMonth: Array<{debit:number; credit:number}> };
const series = new Map<string, Series>();          // key = acctId
const seriesByPath = new Map<string, Series>();    // secondary index for path matches

// inside walk:
const id = String(cd[0]?.id || "").trim();
const path = String(cd[0]?.value || "").trim();
const key = id || `path:${path.toLowerCase()}`;    // synthesize only if QB omitted id
let s = series.get(key);
if (!s) { s = { id: key, fullPath: path, perMonth: [] }; series.set(key, s); seriesByPath.set(path.toLowerCase(), s); }
…
```

Two different QB accounts with the same leaf no longer collide.

### 2. Replace `tbByLeaf` collapse with strict, source-tagged lookup maps

Lines 394–461. Drop `leafAgg` entirely. Build three maps that *preserve* the per-account axis values:

- `tbById: Map<string, TBAcct>` — keyed by QB acctId.
- `tbByFullPath: Map<string, TBAcct>` — keyed by `normKey(fullPath)`.
- `tbByLeaf: Map<string, TBAcct[]>` — keyed by `normKey(leafOf(fullPath))`, value is an **array**.

Matching in the reconciliation loop (lines 477–482) becomes:

```ts
// priority: id → full path → leaf (only when exactly one TB candidate matches the GL's classification)
let tb = acct.acctNumber ? tbById.get(acct.acctNumber) : undefined;
let matchedBy = tb ? "id" : "";
if (!tb && acct.fullPath) { tb = tbByFullPath.get(normKey(acct.fullPath)); if (tb) matchedBy = "fullPath"; }
if (!tb) {
  const candidates = tbByLeaf.get(normKey(acct.leaf)) || [];
  const isPL = acct.classification === "REVENUE" || acct.classification === "EXPENSE";
  // Filter candidates to the half of the chart that matches the GL row's class.
  // For BS use signed balance, for P&L use yearSum.
  const compatible = candidates.filter(c => sideMatches(c.fullPath, isPL));
  if (compatible.length === 1) { tb = compatible[0]; matchedBy = "leaf"; }
}
```

`sideMatches` reads the root segment of the TB `fullPath` (Income / Cost of Goods Sold / Expenses / Other Income / Asset / Liability / etc.) and decides whether it belongs to the revenue or expense side. If there are 0 or 2+ compatible candidates we leave it unmatched and let the variance card report `missing_in_tb` rather than silently match the wrong half.

### 3. Make the GL side carry `fullPath` and disambiguate classification

The GL parser needs to surface the same fully-qualified path the TB has, and use that path to set `classification`. Today `acct.classification` is set per leaf, so two GL rows with the same leaf get the same class. Walk the GL `Sections` ancestry when parsing each row and set:

- `acct.fullPath` — colon-delimited.
- `acct.classification` — derived from the root section (Income / Cost of Goods Sold / Expenses / Other Income / Other Expense / Asset / Liability / Equity).

This lets the new matcher in step 2 actually disambiguate `Labor (Income)` from `Cost of Labor (Expense)`.

The plan stays inside the analyze-general-ledger function; the upstream `qbToJson` pipeline is unchanged.

### 4. Update logging

```text
[ANALYZE-GL] TB ingested: 36 monthly reports, N series (by acctId)
[ANALYZE-GL] Match attempts: id=A, fullPath=B, leaf=C, ambiguous-leaf=D, unmatched=E
[ANALYZE-GL] Reconciliation: matched=X/Y (BS=a, P&L=b), variances=Z, missingInTB=W
```

The `ambiguous-leaf` counter calls out exactly the cases where leaf-name collision blocked a match — useful to spot future regressions.

## Expected result

After deploy, for project `fa0768ca…`:

- `Decks and Patios` (expense) matches TB `Job Expenses:Job Materials:Decks and Patios` (yearSum ≈ +$22k vs GL $13k) — small remaining variance is real data drift, not the −$261k cross-contamination.
- `Labor` GL row is correctly classified `EXPENSE`, matches `Job Expenses:Cost of Labor`, not the revenue Labor series.
- `matched` count goes from 1/78 into the 40–60 range. Remaining variances will be actual data issues (the saved $1.85M vs $2.31M kind), not analyzer bugs.

## Out of scope (separate work, flag only if needed)

- Sign convention on the income side (existing `absDiffMag` already handles magnitude comparison).
- `qbToJson` ingestion or COA enrichment — both already produce correct-shape data; the bug is purely in how analyze-general-ledger consumes it.
- Wizard / Workbook UI — no changes.
