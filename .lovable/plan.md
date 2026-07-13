## Why P&L shows 0% match

Every TB account in the diagnostic is bucket = **expense** — including obvious BS rows like `1025 Fidelity Business Account`, `2025 Amazon Chase CC`, `3070 Member Draw`. That's why Revenue, COGS, and Gross Profit are all $0 on the TB side.

Root cause chain (verified against `wizard_data.trialBalance.accounts` and `processed_data.chart_of_accounts`):

1. **TB rows store the account number inside `accountName`** — the parser emits `accountName = "1025 Fidelity Business Account"` with `accountNumber = ""` and `accountType = ""`. `inferFsType` only checks the `accountNumber` column for the digit-prefix rule, misses, then falls through to `'IS'`.
2. **`classifyISAccount` in `validate-financial-statement` defaults to `'expense'`** whenever `accountType` is empty and no keyword match is found. Every mis-classified BS row (and every revenue/COGS row whose accountType is blank) piles into `totalExpenses` → $58M, and revenue/COGS/gross profit stay at $0.
3. **CoA cross-reference silently no-ops.** `wizard_data.chartOfAccounts.accounts` is empty for this project — the CoA lives only in `processed_data` in raw qbToJson shape (`name`, `fullyQualifiedName`, `acctNum`, `classification`, `fsType`). `rebuild-project-tb` only reads the wizard cache and, even if it read the raw CoA, its cross-reference expects the client shape (`accountName`, `accountNumber`, `accountId`) so no match would occur.

The Balance Sheet ($0 differences) works only because its accounts happened to hit name-keyword hints ("Fidelity", "Amazon Chase" don't, but the BS validation path is less sensitive when CoA is absent). The P&L, which relies on precise bucketing, breaks completely.

## Fix

Three coordinated changes so the pipeline recovers even when TB `accountNumber`/`accountType` are blank and the CoA hasn't been normalized into the wizard cache.

### 1. `inferFsType` — extract leading digits from the name
`src/lib/inferFsType.ts` and the ported copy in `supabase/functions/rebuild-project-tb/index.ts`.

If `accountNumber` is empty, look for a leading 4-5 digit prefix in `fullyQualifiedName` first, then `accountName`, and apply the existing 1xxx-3xxx → BS, 4xxx-9xxx → IS rule. This fixes fsType for every account in this project (all names start with the number).

### 2. Validator — bucket by leading digits + name fallback
`supabase/functions/validate-financial-statement/index.ts`.

- `classifyISAccount`: when `accountType` is empty, use leading digits: `4xxx` → `revenue`, `5xxx` → `cogs`, `6xxx-9xxx` → `expense`. After that, name fallback: `sales|revenue|income` → `revenue`; `cost of goods|cogs` → `cogs`. Only after these fallbacks fail should we hit the `'expense'` default.
- `classifyBSAccount`: mirror the fallback — `1xxx` → `asset`, `2xxx` → `liability`, `3xxx` → `equity` when `accountType` is empty and no name hit.

This restores non-zero Revenue / COGS / Gross Profit on the TB side even when the CoA never gets cross-referenced.

### 3. `rebuild-project-tb` — read raw CoA and match its native shape
`supabase/functions/rebuild-project-tb/index.ts`.

- If `wizard_data.chartOfAccounts.accounts` is empty, load the latest `processed_data` row with `data_type = 'chart_of_accounts'` and use its `data` array.
- In `crossReferenceCOA`, accept either shape: read the number from `accountNumber` **or** `acctNum`, the name from `accountName` **or** `name`, the QB id from `accountId` **or** `id`, and fall back to `fullyQualifiedName` for name matches. Match TB accounts whose `accountName` starts with `"{acctNum} "` or ends with the CoA `fullyQualifiedName`.
- When a match hits, copy `fsType`, `classification` → `accountType` bucket, and the real `accountNumber` back onto the TB account so downstream code (validator, workbook, adapter) sees a properly enriched row.

### 4. Rerun and verify

After deploy, invoke `rebuild-project-tb` for `621a6c9f-1c25-40fa-92fa-6762ae3fe72b`, then re-run the P&L validation. Expected: Revenue ≈ $28.3M on the TB side, COGS ≈ $13.6M, Gross Profit ≈ $14.6M, and the diagnostic bucket column should show a mix of `revenue`/`cogs`/`expense` instead of all `expense`. BS-typed accounts (`1xxx`/`2xxx`/`3xxx`) should no longer appear in the P&L breakdown at all.

## Out of scope / follow-ups

- The client-side `crossReferenceWithCOA` in `src/lib/trialBalanceUtils.ts` has the same "expects client shape" assumption. Not blocking this bug (wizard CoA cache is empty), but worth normalizing next pass so both sides agree on the CoA shape.
- The `qbtojson` TB parser that emits `accountName = "{acctNum} {name}"` with an empty `accountNumber` is the true upstream culprit; leaving that as a separate PR because it affects ingestion of every QB TB, not just this project.
