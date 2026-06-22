## What's actually wrong on Catering Company Milan

Project `92b5f314…` — diagnosed from the database, not guessed:

- TB in `wizard_data` has **103 BS accounts and 0 IS accounts** (degenerate).
- COA has 117 accounts (synced from QB).
- `processed_data` has a real **General Ledger** (qbtojson, 121 records) plus 2 `gl_analysis` runs.
- `ai_edit_snapshots` shows the previous "AI balance TB" run (Jun 22 17:21) just plugged residuals to **Retained Earnings** for every 2024 month — that's the run you remember "fixing" the TB. It didn't fix anything; it hid the fact that every revenue and expense line was missing.
- Our follow-up hardening (the `validateTbStructure` guard you approved) now correctly **refuses** to auto-balance this TB and tells you to "rebuild from the General Ledger" — but **there is no button or AI tool that actually does that rebuild**. That's the dead end you hit.

So the answer to "I thought we gave the AI assistant powers to make changes?" is: it has reclassify / set-amount / plug / create-account tools, but it has no `rebuild_tb_from_gl` tool, and the wizard has no manual equivalent.

## Fix path

Two complementary pieces, both server-side so the AI can call them.

### 1. New edge function `rebuild-tb-from-gl`

Pure aggregation, no LLM. Inputs: `projectId`. Steps:

1. Load all `general_ledger` rows from `processed_data` (canonical_transactions if richer).
2. For each (account, period) bucket: sum signed amounts (debit +, credit −).
3. Resolve `fsType` / category for each account by lookup against:
   - COA (`wizard_data.chartOfAccounts.accounts`), then
   - canonical account-type heuristics from `chartOfAccountsUtils` as fallback.
4. Write the resulting accounts back into `wizard_data.trialBalance.accounts`, preserving any existing manual edits with a `source: 'gl_rebuild'` marker per row.
5. Snapshot before/after into `ai_edit_snapshots` (kind `rebuild_tb_from_gl`) so the existing undo button works.
6. Return `{ added, updated, bsCount, isCount, periodsCovered }`.

### 2. Wire it into both surfaces the user expects

- **TB section UI** — in `TrialBalanceSection.tsx`, when the structure validator flags `no_is_accounts` / `is_all_zero` (or whenever `general_ledger` exists in processed_data), show a primary action: **"Rebuild Trial Balance from General Ledger"**. Reuses the existing `AiBalancingButton` confirm/undo pattern.
- **AI agent tool** — add `rebuild_tb_from_gl` to the `TOOLS` array in `ai-balance-tb/index.ts`. The agent calls it first when `validateTbStructure` reports degenerate, then reruns the per-period imbalance check before plugging.

### 3. Make the existing guard actionable

Change the 400 response from `ai-balance-tb` when `status === 'degenerate'` to include `canRebuildFromGl: true` when `processed_data` has a `general_ledger` row, and surface a "Rebuild from GL" CTA in the existing error toast instead of a dead-end message.

## Technical notes

- Sign convention stays: debit positive, credit negative; BS+IS=0 per period.
- Period IDs come from `projects.periods` (34 periods on this project, monthly).
- Don't touch `canonical_transactions`; just read from `processed_data` where `data_type='general_ledger'`.
- All writes go through service-role client inside the edge function, with `has_project_access` check up front (same pattern as `ai-balance-tb`).
- Undo: reuse `ai-revert-snapshot` — no new function needed.

## Out of scope for this change

- Giving the chat panel (`AIChatPanel`) tool-calling powers. That's a separate, bigger refactor and you only asked about the GL-analysis flow.
- Touching the GL analyzer itself.

Approve and I'll build it.
