# Fix COA ingest: stop collapsing accounts by leaf name

## Diagnosis (confirmed in code)

The 89 → 79 loss is on our side, in `src/lib/chartOfAccountsUtils.ts`:

- `findMatchingAccount` matches incoming accounts to existing ones by:
  1. `accountNumber` (only if both sides have one)
  2. **normalized leaf `accountName`** ← collapses Income/Expense pairs that share a leaf name (Job Materials, Decks and Patios, Plants and Soil, Installation, etc. — 8 pairs in the QB sample)
  3. `originalName`
- Because the QB sample COA leaves `AcctNum` empty on most leaf accounts, step 1 doesn't fire and step 2 wins → 16 distinct accounts collapse to 8. That's the 89 → 81 step.
- `transformCoaData` reads `Name` / `fullyQualifiedName` but throws away the parent path and the QB `Id`, so by the time merge runs there's no way to disambiguate two "Job Materials" rows.
- `transformQBChartOfAccounts` in `complete-qb-sync` and `qb-sync-complete` already captures `accountId`, `accountType`, `accountSubtype`, `classification` — but the wizard-side `CoaAccount` type drops `accountId`, so the discriminator is lost the moment we hit `mergeCoaAccounts`.

The 81 → 79 step (Unapplied Cash Payment Income, Unapplied Cash Bill Payment Expense) is **not** a dedup collision — those names are distinct. It's a separate filter somewhere in the ingest pipeline that I still need to pin down (candidates: `process-quickbooks-file`, `processed-data-create`, or an `active`/classification filter). I'll trace it during implementation and either remove the filter or whitelist the Unapplied accounts.

## Changes

### 1. `src/lib/chartOfAccountsUtils.ts`
- Add `accountId?: string`, `fullyQualifiedName?: string`, `parentRef?: string` to `CoaAccount`.
- Rewrite `findMatchingAccount` matching priority:
  1. `accountId` exact match (when both sides have one) — primary key
  2. `accountNumber` exact match (when both have one)
  3. `fullyQualifiedName` normalized match (preserves parent path: "Landscaping Services:Job Materials" ≠ "Job Expenses:Job Materials")
  4. Leaf-name match **only if** `classification` AND `accountSubtype` also match (prevents Income vs Expense collapse)
- Drop the bare leaf-name match.
- `transformCoaData`: pull `Id`/`id` → `accountId`, `FullyQualifiedName`/`fullyQualifiedName` → `fullyQualifiedName`, `ParentRef.value` → `parentRef`. Preserve them through pre-processed (edge-function) path too.
- Keep the auto-account-number assignment, but stop using it as a match key for accounts that came in without one — track which numbers were synthesized so we don't accidentally collide synthesized numbers across imports.

### 2. `supabase/functions/complete-qb-sync/index.ts` + `qb-sync-complete/index.ts`
- In `transformQBChartOfAccounts`, also emit `fullyQualifiedName` and `parentRef` (already reads `Id`/`AccountSubType`/`Classification` — just need to surface FQN/parent for the wizard-side matcher).

### 3. Unapplied Cash drop (81 → 79)
- Trace where it happens: grep ingest pipeline for `active`, `Unapplied`, classification filters, and any "skip if balance is zero" logic in `process-quickbooks-file`, `processed-data-create`, `complete-qb-sync` and the wizard transform.
- Fix it in place — either remove the filter or explicitly retain Unapplied accounts (they're meaningful for proof-of-cash).
- Add a debug log of input-vs-output account count in `transformQBChartOfAccounts` and `transformCoaData` so any future shrinkage is visible in logs.

### 4. Guardrail
- Add a one-line warning log in `mergeCoaAccounts` whenever a match falls through to the leaf-name path, with both account names — so any future collisions surface immediately instead of silently collapsing.

### 5. Tests
- Add unit tests in `src/lib/chartOfAccountsUtils.test.ts`:
  - Two accounts with same leaf "Job Materials" but different `accountId` / FQN / classification → kept separate.
  - Two imports of the same QB account (same `accountId`) → merged.
  - Two accounts with same `accountNumber` → merged.
  - User-edited account is preserved when re-importing.

## Out of scope
- No changes to qbToJson (it's correct — returns 89).
- No changes to the COA mapping table.
- No UI changes; the existing COA grid will just show all 89 rows.
