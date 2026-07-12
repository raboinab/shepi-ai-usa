
## Root cause (confirmed in DB, not speculation)

James's project has 183 TB accounts in `wizard_data.trialBalance.accounts`. Every single one is tagged `fsType: "BS"` with an empty `accountType` — including obvious income rows like `4000 RETAIL:z_Shopify Sales`, `4000 RETAIL:Amazon Sales`, `4000 RETAIL:PayPal Sales`.

That's why the P&L validation card shows:
- **Trial Balance accounts (0)** in the diagnostic — the panel filters to `fsType === 'IS'`, and there are zero.
- **Total Revenue / COGS / Gross Profit derived from TB = 0** — same reason.
- **"20 uploaded line items not found in your Trial Balance"** — the missing-account matcher also filters to `fsType === 'IS'`.
- **0% match, $47M "unmatched"** — TB side of every comparison is zero.

The upstream cause is in `src/lib/chartOfAccountsUtils.ts` line 185:

```ts
fsType: acc.fsType || 'BS',
```

When the CoA is uploaded as a plain CSV (VampireFreaks.csv here), `acc.fsType` is undefined for every row, so everything defaults to `BS`. `crossReferenceWithCOA` then propagates that wrong `fsType` to the TB, and downstream everything treats the whole company as a balance sheet with no income statement.

There is already an `inferFsTypeFromName` helper used by the QB ingestion path in `supabase/functions/process-quickbooks-file/index.ts` — the CSV path just isn't using it.

## Fix

### 1. Stop defaulting fsType to BS blindly (`src/lib/chartOfAccountsUtils.ts`)

Replace the `acc.fsType || 'BS'` default (in both the `hasPreprocessedData` fallback branch and the plain branch, ~lines 170 and 185) with an inference step:

- If `acc.fsType` is set, use it.
- Else infer from `accountSubtype` / `classification` when QB-style hints are present (`Income`, `Revenue`, `Expense`, `CostOfGoodsSold`, `OtherIncome`, `OtherExpense` → `IS`; `Bank`, `AccountsReceivable`, `Asset`, `Liability`, `Equity`, `CreditCard`, etc. → `BS`).
- Else infer from account name/number using the same rules as `inferFsTypeFromName` (numeric prefix 4xxx/5xxx/6xxx/7xxx/8xxx → `IS`; 1xxx/2xxx/3xxx → `BS`; name regexes for sales/revenue/income/cogs/expense → `IS`).
- Only fall back to `BS` when nothing matches (and log so we can spot it).

Set `category` at the same time when inference is confident (e.g. sales → `revenue`, cogs → `cogs`, etc.), matching the buckets `validate-financial-statement` uses.

### 2. Reuse existing logic — don't duplicate

Extract `inferFsTypeFromName` / `inferCategoryFromName` out of `supabase/functions/process-quickbooks-file/index.ts` (or copy the rules into a shared module under `src/lib/`) so both the edge function and the client-side CoA transform use one implementation. This avoids the two paths drifting again.

### 3. Backfill James's project (one-off)

After the fix ships, his stored `wizard_data` is still wrong. Two options — pick one:

- **A. Data fix via `supabase--insert`:** Update `projects.wizard_data` for `621a6c9f-1c25-40fa-92fa-6762ae3fe72b`: clear `chartOfAccounts.accounts` and `trialBalance.accounts` so the wizard's next load re-derives them from `processed_data` using the new inference. This is the least risky option.
- **B. Reset via existing RPC:** Call `reset_project_data(...)` — but that also wipes documents/GL/bank data, so this is too aggressive. Do not use.

Go with option A.

### 4. Verify

After the code change + backfill:

1. Reopen `/project/621a6c9f-1c25-40fa-92fa-6762ae3fe72b`, go to Trial Balance section, let it reload. Confirm the TB now shows sales/COGS accounts flagged as `IS`.
2. Re-run the P&L validation card. Expect: Total Revenue ~$28.2M on both sides, COGS ~$13.6M on both sides, non-zero match %, and the "20 items not found" list shrinks dramatically.
3. Balance Sheet validation should still work (assets/liabilities/equity accounts are still correctly inferred as `BS`).

## Explicitly out of scope

- Not touching the validation card UI — the "0 matches / 3 significant / $47M unmatched" display is correct given the bad input; fix the input.
- Not changing the TB→P&L derivation math in `validate-financial-statement/index.ts`.
- Not touching Balance Sheet detection or period logic.
- Not adding any "no TB uploaded" fallback flow — you confirmed the TB IS uploaded.

## Files touched

- `src/lib/chartOfAccountsUtils.ts` — fix the default fsType/category inference.
- New `src/lib/inferFsType.ts` (or similar) — shared inference rules.
- `supabase/functions/process-quickbooks-file/index.ts` — import from the shared module instead of local helpers (behavior unchanged).
- Data fix migration/insert for project `621a6c9f-1c25-40fa-92fa-6762ae3fe72b` `wizard_data`.
