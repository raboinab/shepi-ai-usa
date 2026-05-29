## TB Importer Follow-up — Fix Leaf-Name Collisions

### Problem

`aggregateTrialBalanceRecords` in both `complete-qb-sync` and `qb-sync-complete` uses leaf account name (or a synthesized number) as both the **dedup key** and the **COA lookup key**. When two real accounts share a leaf name (e.g. `Job Materials` under Income vs. Expense, or the two `Unapplied Cash` accounts), the TB importer:

1. **Merges their balances** into a single `accountMap` entry — silently summing/overwriting period values.
2. **Mis-links to COA** — picks whichever entry won the `coaByName` map race.

This is the same bug class we just fixed on the COA side. The COA now carries `accountId`, `accountNumber` (real vs. `_autoNumbered`), `fullyQualifiedName`, `parentRef`, `classification`, and `accountSubtype` — the TB side just needs to use them.

### Scope

Two edge functions, one shared helper extracted for testability:

- `supabase/functions/complete-qb-sync/index.ts` — `aggregateTrialBalanceRecords` (lines 726–889)
- `supabase/functions/qb-sync-complete/index.ts` — `aggregateTrialBalanceRecords` (lines 657–780)

Both raw QB rows (`Rows.Row`) and the Java-enriched `{ accounts: [...] }` path are affected.

### Approach

Mirror the COA-side priority on TB ingest:

**1. Build richer COA lookup maps**

```ts
const coaById      = new Map<string, CoaAccount>();   // accountId
const coaByRealNum = new Map<string, CoaAccount>();   // accountNumber AND !_autoNumbered
const coaByFqn     = new Map<string, CoaAccount>();   // normalized FQN
const coaByName    = new Map<string, CoaAccount[]>(); // leaf name → list (for type+subtype tiebreak)
```

Normalize FQN with the same helper the COA side uses (lowercase, collapse `:` spacing, trim).

**2. New `resolveCoaMatch(row, coaMaps)` helper** — strict priority:

1. `accountId` exact match
2. Real (non-synthesized) `accountNumber` exact match
3. Normalized `fullyQualifiedName` exact match
4. Leaf-name match **only if** exactly one COA candidate matches **or** the row's `accountType`/`classification` + `accountSubtype` disambiguates to exactly one
5. Otherwise → unmatched (log `[TB] ambiguous leaf-name "<n>" — N candidates`)

**3. New `buildAccountKey(row, coaMatch)` for the dedup map** — same priority, falling back to a composite `${name}__${type}__${subtype}__${fqn}` only when no id/real#/FQN exists. Never collapse on bare leaf name.

**4. Read FQN from QB rows where available**

- Java-enriched path: pull `acct.fullyQualifiedName`, `acct.accountId`, `acct.parentRef`, `acct.classification`.
- Raw QB rows: `colData[0]?.id` is the QB account id — promote it to `accountId` (separate field from the synthesized accountNumber fallback).

**5. Persist the resolution info on the aggregated row**

Add `accountId`, `fullyQualifiedName`, `_matchSource: "id" | "number" | "fqn" | "name+type" | "unmatched"` so downstream (and logs) can see how each account was linked.

**6. Diagnostic counters**

At the end of aggregation, log:
```
[TB] in=<rawCount> out=<uniqueAccounts> matched={id:X, number:Y, fqn:Z, name:W, unmatched:U} ambiguous=<count>
```
Mirrors the COA-side counters so a future regression is easy to spot.

### Tests

New `supabase/functions/_shared/tbAggregation.test.ts` (or co-located test in each function). Cases:

1. Two TB rows with same leaf name (`Job Materials`) but different `accountType` → 2 distinct accountMap entries, both COA-matched.
2. Two `Unapplied Cash` rows with distinct `accountId` → 2 entries.
3. Same `accountId` across two periods → 1 entry with both period values.
4. Row with no id/#/FQN, COA has 2 leaf-name candidates → unmatched + ambiguous log.
5. Row matched by real account number wins over name-only collision.
6. `_autoNumbered` COA account is **not** matched by row's synthesized number.

### Out of scope

- No changes to the COA side (already fixed last turn).
- No schema changes — `accountId` and `fullyQualifiedName` are added to the aggregated JSON blob, which is `jsonb` and tolerates new fields.
- No frontend changes; the `_matchSource` field is internal diagnostics only.

### Risk

Low. The aggregated TB output keeps the same shape; we're only adding optional fields and changing how the key is built. Existing TB consumers that look up by `accountName` continue to work, and the new id/FQN fields are additive. The only behavior change a user will see is **more accounts** in the TB (no longer silently merged) — which is the intended outcome and matches the COA count.
