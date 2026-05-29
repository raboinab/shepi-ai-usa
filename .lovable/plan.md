# Fix: Trial Balance showing 83 of 89 accounts

## Root cause

The COA has 89 accounts; 6 leaf names appear twice under different parents (e.g. `Equipment Rental` as a root expense and `Job Expenses:Equipment Rental` as a sub-account; `Job Materials`, `Cost of Labor`, etc.). The QuickBooks trial-balance feed reports each row using only the **leaf name** in `colData[0].value`, with the unique QB account Id in `colData[0].id`.

`src/lib/trialBalanceUtils.ts` currently:

1. `parseColDataRow` puts the QB Id into `accountNumber` and the leaf name into `accountName`.
2. `processRows` builds its account map with `key = accountName || accountNumber` — so the leaf-name collision merges the 6 duplicate-leaf pairs into single rows. 89 → 83.
3. `mergeAccounts` uses the same leaf-only key, perpetuating the collapse.
4. `crossReferenceWithCOA` indexes COA by `coa.accountNumber` and by sequential `coa.id` (1..89), neither of which is the real QB account Id, so the collapsed TB rows match the wrong COA entry (or only one of the pair).

We already fixed the same class of bug on the COA side by prioritizing `accountId` > real `accountNumber` > `fullyQualifiedName` > leaf+classification+subtype. The TB side was missed.

## Fix

### 1. `src/lib/trialBalanceUtils.ts` — preserve the QB account Id

- Add `qbAccountId?: string` to `TrialBalanceAccount` (or piggy-back on a new field — do **not** overload `accountNumber`, which the rest of the app treats as the human-readable COA number).
- In `parseColDataRow`, stop writing the QB Id into `accountNumber`. Return both:
  - `qbAccountId` = `colData[0].id`
  - `accountName` = leaf
  - leave `accountNumber` empty (the real number comes from COA cross-reference).
- In `processRows`, build the map key as `qbAccountId || accountName || accountNumber` so distinct QB accounts with identical leaf names stay separate.
- In `mergeAccounts`, key on `qbAccountId || accountName || accountNumber` for the same reason.

### 2. `src/lib/trialBalanceUtils.ts` — match COA by QB Id first

In `crossReferenceWithCOA`:

- Build a third lookup `coaByQbId = new Map<string, CoaAccount>()` populated from `coa.accountId` (the real QB Id stored by `transformCoaData`).
- Match order: `qbAccountId` → `accountNumber` (real, not the QB Id we used to stuff in here) → `accountName` (leaf) with a tie-break on classification when multiple COA entries share the leaf → existing parent/child fallbacks.
- When a leaf-name lookup is ambiguous (more than one COA entry shares that leaf), prefer the COA entry whose `fullyQualifiedName` matches the TB row's parent chain if available, otherwise leave it unmatched rather than silently picking the first.

### 3. Regression test

Add a case to `src/lib/trialBalanceUtils.test.ts` (create if missing) that feeds two TB rows with identical `accountName` but distinct `colData[0].id` (e.g. ids `247` and `254`, both named `Equipment Rental`) across two periods, and asserts:

- `transformQbTrialBalanceData` returns **2** accounts, not 1.
- `crossReferenceWithCOA` matches each to its respective COA entry by `accountId` (one root `Equipment Rental`, one sub `Job Expenses:Equipment Rental`).

### 4. Rehydrate the affected project

After the fix ships, the cached `wizard_data.trialBalance` on project `fa0768ca-…` is still the collapsed 83-row snapshot. Either:

- Clear `wizard_data.trialBalance` for that project so `loadTrialBalanceFromProcessedData` rebuilds it from `processed_data`, **or**
- Bump a small version constant the loader checks and force a one-time rebuild.

I'll go with clearing the cached field for just this project (smaller blast radius) and note it in the response.

## Files touched

- `src/lib/trialBalanceUtils.ts` — parse, process, merge, cross-reference
- `src/lib/trialBalanceUtils.test.ts` — new regression test (create if absent)
- one-shot SQL to clear the stale `wizard_data.trialBalance` on the affected project

## Out of scope

- COA logic (already fixed).
- UI changes — the "X accounts / Y matched from COA" counters will update automatically once the underlying array has 89 entries.
- Edge-function-side TB processing — the bug is purely in the client-side transform.
