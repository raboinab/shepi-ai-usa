## Finding

Live data check on project `fa0768ca…` (Sandbox_Company_US_2):

- 83 trial-balance rows, 0 missing `qbAccountId` ✅
- But 80 rows carry an `accountNumber` and only **55 are distinct** — QB sub-accounts inherit the parent's number. Example: `90050` is shared by 6 rows (`Job Expenses:Equipment Rental`, `Job Expenses:Job Materials`, `…:Decks and Patios`, `…:Fountain and Garden Lighting`, `…:Plants and Soil`, `…:Sprinklers and Drip Systems`).
- `fullyQualifiedName` is `null` on every row; the disambiguation today rides entirely on `accountName` containing the `Parent:Child` path.

Current key priority in `src/lib/trialBalanceUtils.ts` (`processRows` ~L474 and `mergeAccounts.keyOf` ~L534):

```
1. qbAccountId
2. accountNumber                ← UNSAFE: collapses 6 distinct accounts to one
3. fullyQualifiedName
4. accountName + type + subtype
```

We're only safe right now because tier 1 covers 100% of QB-API rows. The moment a row arrives without `qbAccountId` (CSV upload, manual entry, partial backend payload) tier 2 silently merges unrelated accounts.

No `chart_of_accounts` table exists, so the earlier "stale pre-fix record" theory is moot — wizard JSON is the only store.

## Plan

Tighten the fallback so `accountNumber` alone is never a unique bucket key. Combine it with `accountName` (and type+subtype) so shared parent numbers can't collapse distinct sub-accounts.

### Changes — `src/lib/trialBalanceUtils.ts`

Update both key builders to:

```
1. id:{qbAccountId}                                       — true unique id
2. fqn:{fullyQualifiedName}                               — full Parent:Child path
3. composite: num+name+type+subtype  (or name+type+subtype when no number)
```

Specifically:
- `processRows` (~L474-479): demote `accountNumber`, never use it bare.
- `mergeAccounts.keyOf` (~L534-539): same change.
- Update the comment block above each to reflect that QB reuses parent `accountNumber` on children.

### Verification

- Run `bun vitest run src/lib/trialBalanceUtils.test.ts` — existing tests must still pass.
- Add one regression test: two rows with identical `accountNumber` but different `accountName` / `qbAccountId=undefined` must remain two distinct accounts after `processRows` and `mergeAccounts`.

### Out of scope

- No DB / migration changes (no `chart_of_accounts` table).
- No changes to `chartOfAccountsUtils.ts` or `supabase/functions/_shared/tbAggregation.ts` (already correct per earlier review).
- No edge-function deploy needed.