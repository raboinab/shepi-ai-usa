## Goal

Close the `A − L − E − NI = -$4,169,125` gap by deriving the missing beginning Retained Earnings (RE) / Opening Balance Equity (OBE) plug, instead of showing a raw imbalance to the user.

## Why this works

The accounting identity `A − L − E − NI = 0` only holds when Equity already contains **prior-period retained earnings**. QuickBooks GL exports for a mid-life company almost always understate Equity because:

- The GL activity we ingest is for the analysis window only (e.g., 2023–2026), so it excludes all retained earnings accumulated before the window.
- QBO's auto-generated "Retained Earnings" account often has $0 activity in the window and no snapshot balance in the export — it lives only on the Balance Sheet report.
- "Opening Balance Equity" from QBO setup may never have been closed to RE.

So the `-$4.17M` isn't a books error — it's a **known missing opening equity component**. We can back into it: `Implied Beginning RE = A − L − E_current − NI`.

## Plan

### 1. Compute the implied opening equity plug in `analyze-general-ledger`

In the reconciliation rollup step (`supabase/functions/analyze-general-ledger/`), after we compute A, L, E, NI:

- `impliedOpeningEquity = A − L − E − NI`
- Also try to pull the **Balance Sheet retained earnings** value from `processed_data` (financial statements already parsed) for the earliest period in scope. If it exists, compare `impliedOpeningEquity` vs BS RE and report the delta separately (that residual is the true unexplained variance).
- Persist both values on the reconciliation summary row (new columns: `implied_opening_equity`, `bs_retained_earnings`, `residual_variance`).

### 2. Reclassify the identity display

In `GeneralLedgerInsightsCard.tsx`:

- Replace the single `A − L − E − NI` number with a small ledger:
  ```
  Assets                 $X
  − Liabilities          $Y
  − Equity (in-window)   $Z
  − Net Income           $N
  ─────────────────────────
  Implied Opening RE     $4,169,125   ← was the "imbalance"
  BS Retained Earnings   $4,150,000   (from uploaded BS, if available)
  ─────────────────────────
  Residual Variance      $19,125      (<1% — reconciled)
  ```
- If no BS RE is available, label the plug as *"Implied Beginning Retained Earnings (no BS to confirm)"* and mark it informational, not an error.

### 3. Tooltip / explainer

Short inline note next to the number: *"QuickBooks GL exports typically exclude retained earnings accumulated before the analysis window. This is the implied opening RE required for the books to balance. If a Balance Sheet was uploaded, we compare it to that value."*

### 4. Fold into the 93% reconciliation headline

- Once the residual is <1%, the reconciliation status treats the identity as **reconciled** (green), rather than showing a scary red $4.17M imbalance.
- Add a `RECONCILED_VIA_IMPLIED_RE` reason code alongside the other `ReconReason` codes for auditability.

## Files touched

- `supabase/functions/analyze-general-ledger/index.ts` — compute plug, compare to BS RE, persist.
- Migration on `gl_reconcile_accounts` (or the summary row it writes to): add `implied_opening_equity`, `bs_retained_earnings`, `residual_variance` numeric columns.
- `src/components/wizard/sections/GeneralLedgerInsightsCard.tsx` — new identity breakdown block, tooltip, green state when residual < 1%.

## What this is NOT

- Not changing any GL activity numbers.
- Not fabricating equity — the plug is explicitly labeled as *implied* and cross-checked against the uploaded BS when possible.
- Not touching the Reconciliation account list or the 93% number (those already work).

## Open question before I build

Do you want me to also **write the implied RE back into the Balance Sheet workbook** as an "Opening Balance Equity — derived" line so downstream tabs (NWC, FCF, Proof of Cash) see a balanced BS? Or keep it read-only inside the GL insights card for now?
