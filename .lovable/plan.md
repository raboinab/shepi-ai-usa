## What's happening

The wizard's TB cache (`wizard_data.trialBalance.accounts`) is empty, so the client re-loads the TB from `processed_data` on every render and runs its own `crossReferenceWithCOA` (client, in `src/lib/trialBalanceUtils.ts`). For this project that client-side match returns ~0 hits, so the TB shows as "unmapped" even though the server-side `rebuild-project-tb` I fixed last round matched 152/183.

Why the client match fails on VampireFreaks:

1. **TB rows carry the account number inside the name, not in `accountNumber`.** `parseColDataRow` reads `colData[0].value` (`"1005 Cash"`, `"1015 Wells Fargo Business Checking - 7179"`) and hard-codes `accountNumber: ''`. So `coaByNumber.get(tb.accountNumber)` is never even attempted.
2. **`qbAccountId` on the TB side is not the QB entity Id.** `colData[0].id` in the qbToJson TB output is a row-sequence (`3`, `4`, `5`), but the CoA's `accountId` is the QB entity Id (`200`, `205`, …). They live in different namespaces, so `coaByQbId` never matches.
3. **Name match fails** because TB names still contain the leading digits (`"1005 Cash"` ≠ CoA `"Cash"` / `"Suspense"`), and the "Parent:Child" fallback doesn't strip the number prefix either.

Net result: `matched = 0`, `unmatched = 183`, everything falls to the heuristic bucketing and shows as "no COA mapping." This is the client-side twin of the bug I already fixed in the edge function last round — same root cause (`accountName = "{acctNum} {name}"`, `accountNumber = ""`), just in a second code path.

## Fix

All changes in `src/lib/trialBalanceUtils.ts` — no schema, no edge function, no data migration.

### 1. Extract the leading account number during TB parse
In `parseColDataRow`, after reading `colData[0].value`:
- Use `extractLeadingAccountNumber` (already exported from `src/lib/inferFsType.ts`) to pull a 4–5 digit prefix off the name.
- Populate `accountNumber` with that prefix when the QB feed doesn't supply one.
- Strip the number from `accountName` for display (`"1005 Cash"` → `"Cash"`), preserve the raw string on a new `rawAccountName` field so we don't lose it for debugging.
- Drop the misleading `qbAccountId` when `colData[0].id` is a bare row-sequence (`< 4` chars and numeric) — the CoA's `accountId` is a different Id space, and keeping it prevents the digit-prefix path from ever being tried.

### 2. Broaden `crossReferenceWithCOA` matching
Same file, same function. Once step 1 populates `accountNumber`, `coaByNumber.get(tb.accountNumber)` already matches for the common case. Add these additional matchers, in order, before falling back to unmatched:
- If TB has a `"Parent:Child"` name and neither leaf matched, try matching the parent name against the CoA `fullyQualifiedName` map.
- Build a `coaByFqn` map keyed on `fullyQualifiedName.toLowerCase()` and try it after `coaByNumber` — some CoA rows share numbers but have unique FQNs.
- Last-resort: pull leading digits off the TB name via `extractLeadingAccountNumber` and hit `coaByNumber` again, in case step 1 didn't fire (e.g. legacy cached rows).

### 3. Force a client-side re-match after the change
`loadTrialBalanceFromProcessedData` already accepts `forceCoaRebuild`. Call sites that read the TB for this project won't automatically re-run because rows have `_matchedFromCOA` cached as `false`. Set the default to `forceCoaRebuild: true` at the two call sites for one release (`src/components/wizard/sections/TrialBalanceSection.tsx` and `src/pages/Workbook.tsx`) so the enrichment recomputes with the new matcher; revert the default once we've verified the wizard cache is populating correctly.

### 4. Verify on VampireFreaks
Open `/project/621a6c9f-1c25-40fa-92fa-6762ae3fe72b` → Trial Balance. Expected after fix: ~150+ of 183 accounts show a green "COA matched" state, revenue/COGS/expense buckets populate, and re-running the P&L validation shows non-zero Revenue/COGS/Gross Profit on the TB side. Remaining unmatched should be genuine orphans (deleted accounts, journal-only entries) — I'll list them so you can decide whether to fold them back into the CoA.

### Out of scope
- Deeper fix in the `qbtojson` TB parser (it should emit `accountNumber` and `accountName` split) — that's the upstream culprit but affects every ingest and needs its own PR.
- Backfilling `wizard_data.trialBalance.accounts` for existing projects. The client falls back to `processed_data` correctly; a wizard-cache warm can come after we're confident in the new matcher.

## Technical detail

- Files touched: `src/lib/trialBalanceUtils.ts` (parse + match), `src/components/wizard/sections/TrialBalanceSection.tsx` and `src/pages/Workbook.tsx` (pass `forceCoaRebuild: true`).
- No new dependencies, no DB migration, no edge-function redeploy.
- `extractLeadingAccountNumber` already exists in `src/lib/inferFsType.ts` and handles both `"1005 Cash"` and `"1005-Cash"` / `"1005:Cash"` shapes.
- The CoA for this project (`processed_data` id `ffcce17e-…`) has `accountNumber` populated as strings (`"1000"`, `"1025"`, …), so string equality against the extracted prefix will match without normalization.
