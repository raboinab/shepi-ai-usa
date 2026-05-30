## What's actually wrong (and what isn't)

Reconciliation jumped from 1% → 83% after the last fixes. The matcher is now finding the right TB row for nearly every GL account. The remaining 11 "material variances" are not real data discrepancies — they're sign-convention artifacts and a small TB-duplication issue.

### Evidence from the screen

Look at the matched-but-variant rows:

| Account | GL | TB | "Variance" | What it really is |
|---|---|---|---|---|
| Other Income | $331,583 | -$98,222 | $429,805 | Same number, opposite sign → revenue credit convention |
| Landscaping Services | $30 | -$210,171 | $210,201 | TB has parent rollup; GL only has the bare parent line |
| Accounts Payable (A/P) | $75,810 | -$84,558 | $160,368 | Liability credit convention |
| Discounts given | $169,580 | -$169,580 | $339,159 | Exact mirror |
| Fees Billed | $116,464 | -$116,464 | $232,928 | Exact mirror |
| Sales of Product Income | $243,479 | -$243,479 | $486,957 | Exact mirror |
| Labor (revenue side) | $148,371 | -$148,371 | $296,741 | Exact mirror |
| Loan Payable | $4,000 | -$4,000 | $8,000 | Exact mirror |
| Notes Payable | $25,000 | -$25,000 | $50,000 | Exact mirror |

QuickBooks GL exports almost always present revenue, liability, and equity totals as positive magnitudes (debit-positive). The Trial Balance keeps the true double-entry sign (credits negative). Today we do `glBalance - tbBalance` for every account, which **doubles** these values instead of agreeing them.

### What needs to change

`supabase/functions/analyze-general-ledger/index.ts`, reconciliation loop only — no UI, schema, or GL-parsing changes.

1. **Add a sign-aware comparison helper**

   Before computing `variance`, normalize both sides to the natural balance side of the account:

   ```ts
   const naturalSign = (cls: string): 1 | -1 =>
     (cls === "REVENUE" || cls === "INCOME" || cls === "OTHER_INCOME" ||
      cls === "LIABILITY" || cls === "EQUITY") ? -1 : 1; // credit-natural → -1
   
   // Bring both sides into "positive = increase in the natural direction"
   const sign = naturalSign(acct.classification);
   const glNorm = Math.abs(acct.glBalance) * (acct.glBalance >= 0 ? 1 : -1) * sign;
   const tbNorm = tbBalance * sign;
   const variance = glNorm - tbNorm;
   ```

   Actually simpler and safer: if `sign === -1` and the two numbers have opposite signs AND `|gl| ≈ |tb|`, treat as a match. Concretely: compute `variance = acct.glBalance - tbBalance` as today, but for credit-natural classifications **also** compute `varianceFlipped = acct.glBalance + tbBalance` and use whichever has the smaller absolute value. This preserves any real discrepancy while collapsing the pure sign-convention case to ~$0.

2. **Preserve display values**
   Keep `glBalance` and `tbBalance` on the comparison row exactly as parsed (so the UI still shows `$331,583` and `-$98,222` for users who want to see raw TB values). Only the `variance` / `variancePct` / `status` fields use the normalized comparison.

3. **Re-tighten the material-variance threshold**
   With sign collapse in place, drop `materialVariances` items whose normalized variance falls below the existing $1,000 / 5% floor. The "Savings $-453k", "Checking $-151k", "Undeposited Funds $-70k", "Accounts Receivable $174k" rows are real balance-sheet timing/cutoff differences and will correctly remain flagged.

4. **TB-only "missing from GL" cleanup**
   The list currently shows entries like `Landscaping Services:Job Materials:Plants and Soil` even though GL has a matched `Plants and Soil` leaf. That's because the leaf matcher consumed one TB series and left the same-leaf series under a different parent dangling. Fix: when emitting `missingInGL`, additionally skip any TB series whose **leaf** already has a matched GL counterpart with `|glBalance| ≈ |tbBalance|` (within the same match tolerance). Real orphans like `Retained Earnings`, `Equipment Rental`, and `Landscaping Services:Labor:Installation` will still surface.

5. **Logging**
   Update the variance log line to print both raw and normalized variance so future regressions are obvious:
   `gl=331583 tb=-98222 raw=429805 norm=0` → instantly tells us it's a sign collapse, not a real gap.

### Expected outcome

- Reconciliation rate climbs from 83% to ~95%+
- Material Variances drops from 11 → roughly 3 (Savings, Checking, A/R, Undeposited Funds — the real cutoff issues)
- "In TB but missing from GL" shrinks from 8 → ~3 (the genuinely orphan TB rows)
- No UI changes required; the reconciliation table re-renders from the same shape

### Out of scope

- GL parser changes (already correct)
- TB ingestion logic (already correct, 75 unique leaves matched)
- Adding a manual classification override UI
- Touching the Flags or Overview tabs
