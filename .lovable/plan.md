
# Harden `ai-balance-tb` against degenerate trial balances

The Milano project exposed a real failure mode: the TB had **103 BS accounts and 0 IS accounts** because it was reconstructed from a Balance Sheet alone. `BS + IS = 0` was trivially satisfied by the BS rows already netting to zero, so the agent plugged $344–$1,721/month into Retained Earnings to clean up rounding — producing a "balanced" but structurally meaningless TB.

The agent must refuse to plug when the inputs are structurally degenerate and surface a clear error to the user instead.

## What we change

### 1. Pre-flight structural validation (server-side, before any AI call)

In `supabase/functions/ai-balance-tb/index.ts`, add a `validateTbStructure(accounts, periods)` check that runs after loading `wizard_data` and **before** the Anthropic call. It returns one of:

- `ok` — proceed with the agent loop as today.
- `degenerate` — return HTTP 400 with a structured error; the agent never runs.

A TB is `degenerate` when **any** of these hold:

| Rule | Threshold | Reason |
| --- | --- | --- |
| Zero IS accounts | `is_count === 0` | Can't reconcile a TB with no income statement (the Milano case). |
| Zero BS accounts | `bs_count === 0` | Mirror case. |
| IS rows exist but every IS value is 0 across all periods | `sum(abs(IS values)) === 0` | All revenue/expense rolled into RE. |
| Total imbalance ≪ smallest revenue or expense magnitude | `max(|check|) < 0.001 * max(|IS row sums|)` AND `is_count > 0` | TB is essentially already balanced — a "fix" would just be rounding noise; surface a "no meaningful imbalance to fix" message instead. |
| All imbalances would resolve to a single equity account with `|plug| < $100/period` | computed | Same noise case — refuse silently-cosmetic plugs. |

### 2. Structured error response

When `degenerate`, return:

```json
{
  "ok": false,
  "code": "TB_STRUCTURE_DEGENERATE",
  "reason": "no_is_accounts" | "no_bs_accounts" | "is_all_zero" | "imbalance_is_noise",
  "diagnostics": {
    "bsAccounts": 103,
    "isAccounts": 0,
    "maxAbsImbalance": 1721,
    "periodsChecked": 29
  },
  "message": "Trial balance has 103 Balance Sheet accounts and 0 Income Statement accounts. The TB appears to have been derived from a Balance Sheet only — net income was folded into Retained Earnings instead of decomposed into revenue/expense rows. Rebuild the TB from the General Ledger before auto-balancing."
}
```

### 3. UI surfacing in `TrialBalanceSection.tsx`

In `handleAiBalance`, when the response is `ok: false` with `code: "TB_STRUCTURE_DEGENERATE"`:

- Show a destructive `sonner.error` toast with the human `message`.
- Render the `reason`-specific call to action inline on the out-of-balance alert (replacing the existing "Auto-balance with AI" button when applicable):
  - `no_is_accounts` / `is_all_zero` → "Rebuild TB from General Ledger" button (opens GL re-import flow).
  - `imbalance_is_noise` → quiet info banner: "Trial balance is balanced within rounding tolerance. No action needed."
  - `no_bs_accounts` → "Upload Balance Sheet" link.

### 4. Tests

Add `supabase/functions/ai-balance-tb/index_test.ts` covering each `degenerate` reason. Use Deno's test runner with synthetic `wizard_data` fixtures — no live Anthropic call needed (extract `validateTbStructure` as a pure function).

## Why we are NOT touching the Milano project data here

The user picked "harden the agent first." This plan does not undo the Milano plugs, does not rebuild Milano's TB from the GL, and does not change the snapshot/undo behavior. Once the guard ships, the user can undo the Milano AI edit via the existing snapshot and decide on the data-fix path separately.

## Files touched

- `supabase/functions/ai-balance-tb/index.ts` — add `validateTbStructure`, early-return on `degenerate`, extract pure helper for testing.
- `supabase/functions/ai-balance-tb/index_test.ts` — new, structural-validation cases only.
- `src/components/wizard/sections/TrialBalanceSection.tsx` — handle the new `TB_STRUCTURE_DEGENERATE` response in `handleAiBalance` and adjust the alert UI.

No database migration. No change to `ai-revert-snapshot`. No change to the doctrine — this is purely a refusal/guardrail.

## Out of scope (deliberately)

- Rebuilding the Milano TB from the GL (separate decision).
- Decomposing P&L into IS rows (separate decision).
- The broader proactive-agent roadmap from the prior plan (separate workstream).

