## Two issues to address

### 1. Wrong heading on Cash Flow validation card (cosmetic, certain bug)

`FinancialStatementValidationCard.tsx` line 110-112 only branches between `balance_sheet` and "Income Statement (P&L)" — `cash_flow` falls through to the P&L label. That's why the card title reads **"Income Statement (P&L) Validation Results"** for your Cash Flow upload.

**Fix:** extend the ternary so `cash_flow` → "Cash Flow Statement". One line.

### 2. CF derivation still has significant variance (real bug)

The four buckets are now populated (no more zero stubs), but values disagree with the uploaded CFS by 13–60%:

| Bucket | TB-derived | Uploaded | Δ |
|---|---|---|---|
| OCF | $2,103,157 | $2,378,513 | +$275k |
| ICF | -$34,523 | -$13,495 | -$21k |
| FCF | $29,000 | $15,095 | +$14k |
| Net | $2,097,634 | $2,380,113 | +$282k |

Likely classification edge cases in `deriveTotalsFromTrialBalance` (lines 460–502):

- **Credit card balances** are currently routed to FCF (treated as debt). For most SMBs, operating credit card AP belongs in OCF working capital. Likely cause of the FCF and OCF gaps.
- **D&A back-out from ICF** assumes Accumulated Depreciation is bundled inside the fixed-asset rows. If the TB shows AccumDep as a separate contra-asset *and* the IS shows the same D&A expense, we subtract twice (or not at all, depending on how the TB labels rows). Likely cause of the ICF gap.
- **Cash equivalents** (money market, undeposited funds) may not match all the regexes, leaking into OCF working-capital deltas.
- **Owner draws / distributions** vs "retained earnings" — we exclude retained earnings but not other equity-suffixed accounts that are actually rollups.

### Plan

1. **UI:** add `cash_flow` → "Cash Flow Statement" in `documentTypeLabel`.

2. **Edge function `validate-financial-statement/index.ts`:**
   - Route credit-card liabilities to OCF (working capital), not FCF. Keep only explicit loans/notes/mortgages/lines of credit/bonds in FCF.
   - Smarter D&A handling: detect whether Accumulated Depreciation appears as a TB row. If yes → keep current `icfAcc - dna` adjustment. If no → don't subtract (ICF already excludes the non-cash piece because it isn't in the TB).
   - Broaden cash-detection regex to include "money market", "undeposited funds", "clearing".
   - Exclude "owner equity"/"distributions"/"draws"/"contributions" rollup parents from FCF when their children already account for the movement (parent inference, same pattern as the existing IS parent-bucket logic).
   - Add structured diagnostic logging: per-bucket list of `{accountName, delta, cashImpact, routedTo}` so the next variance investigation takes one log read instead of guesswork.

3. **No frontend logic changes beyond the label.** No new line items. No CFS-from-direct-method. No schema changes.

### Out of scope
- Surfacing the per-account CF breakdown in the UI (logs only for now).
- Reconciling `netChangeInCash` to actual ΔCash from the TB as a hard check.
- Direct-method CF.

### Files
- `src/components/wizard/shared/FinancialStatementValidationCard.tsx` — label fix.
- `supabase/functions/validate-financial-statement/index.ts` — classification refinements + logging.
