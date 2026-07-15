# Why GL works on one project and not the other

Both projects have 4 GL exports. The difference is size:

| Project | GL exports | Raw JSON | Transactions |
|---|---|---|---|
| `fa0768ca…` (works) | 4 | ~478 KB total | ~76 rows/summary lines |
| `621a6c9f…` (fails) | 4 | ~7.0 MB total (≈2 MB each) | ~431 rows/summary lines, ~116k underlying txns |

The reconciler was rewritten to load exports one at a time, but it still builds a **single in-memory `accountMap`** across all exports, and each export's parsed JSON explodes 5–10× in memory once QuickBooks' nested `Rows → Rows → Rows` structure is walked. On VampireFreaks (621a6c9f) that pushes the Deno edge worker over the 256 MB cap → `Memory limit exceeded`. On the smaller project it fits comfortably, so it succeeds.

The recent "null things between exports" fix helped but isn't enough: the aggregate map itself, plus one fully expanded ~2 MB export at a time, still peaks over the limit.

# Fix plan

Stop holding the whole reconciliation in RAM. Persist per-account aggregates to Postgres between exports, then compute the final report from the DB.

## 1. New scratch table

```
gl_reconcile_accounts (
  project_id uuid,
  run_id     uuid,
  account_key text,          -- num:XXXX or name:normalized
  account_number text,
  account_name text,
  classification text,        -- ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE/UNKNOWN
  snapshot_balance numeric,   -- latest BS snapshot wins
  snapshot_period date,
  activity_net numeric,       -- summed for P&L
  txn_count int,
  primary key (project_id, run_id, account_key)
)
```

Standard grants + RLS (project owner + admin/cpa via `has_project_access`). Service role writes from the edge function.

## 2. Refactor `analyze-general-ledger`

- Generate `run_id`, delete any prior rows for the project.
- For each GL export (already sequential):
  - Parse, walk sections, build a **small per-export** account delta map.
  - `upsert` deltas into `gl_reconcile_accounts` using SQL `on conflict … do update`:
    - `snapshot_balance` = winner by `snapshot_period` (BS accounts)
    - `activity_net` = existing + delta (P&L accounts)
    - `txn_count` = existing + delta
  - Null out parsed JSON, delta map, and record ref. Force loop-scoped scope so GC can reclaim.
- After all exports processed, `select` the aggregated rows back (much smaller: ~a few hundred rows) and:
  - Join to Trial Balance in memory (TB is already compact).
  - Compute variances, identity check, reconciliation %.
  - Write the final report to `processed_data` as today.
- Delete scratch rows for that `run_id` at the end (or keep for debugging behind a flag).

Peak memory becomes: one parsed export + one small delta map + final compact join. Independent of how many exports/years.

## 3. Safety net

- Wrap the per-export block in try/catch; on parse error mark that export as skipped in the report rather than failing the whole run.
- Add a hard cap: if a single export's parsed size (via `JSON.stringify(data).length` before walking) exceeds e.g. 8 MB, stream sections one at a time using a shallow walker that yields section by section instead of building the full array first.

## 4. Verification

- Re-run Analyze GL on `621a6c9f…` — expect completion, no OOM, and the previously-fixed classification/keying logic to now apply consistently across all 4 years.
- Re-run on `fa0768ca…` to confirm no regression on the small project.
- Spot-check identity check comes near zero and Phone/Internet, Rent & Lease reconcile against TB.

## Technical notes

- The scratch-table approach is preferable to "spawn N sub-invocations" because it keeps a single user-facing job with progress and avoids orchestration complexity.
- No change to the parser's account-keying or classification logic — those bugs are already fixed; this plan only changes *where* aggregates live during the run.
- No frontend changes required.
