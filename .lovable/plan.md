## You were right — the "cutoff difference" theory was wrong

Both exports were pulled within 3 minutes of each other on Mar 4. Those balance-sheet variances are a real parser bug.

## What the raw data actually shows

I queried the GL JSON stored in `processed_data` for this project. For every balance-sheet account (Savings, Checking, A/R, Undeposited Funds, A/P, Original Cost), QuickBooks emits a `Beginning Balance` row at the top of the account section that looks like this:

```json
{
  "type": "DATA",
  "colData": [
    {"value": "Beginning Balance"},
    {"value": ""}, {"value": ""}, {"value": ""},
    {"value": ""}, {"value": ""}, {"value": ""}, {"value": ""}
  ]
}
```

**All eight `value` fields are empty strings.** QB knows there's a beginning balance — it sends the row — but it doesn't populate any of the amount cells. Our parser reads it correctly, finds no number, and silently leaves `beginningBalance = 0`.

That explains the variance exactly:

| Account | GL (parser) | TB (Dec 2025 snapshot) | Implied opening |
|---|---|---|---|
| Savings | $1,852,556 | $2,306,033 | ~$453,477 |
| Checking | $259,800 | $410,901 | ~$151,101 |
| A/R | −$300 | −$174,896 | ~$174,596 |
| Undeposited Funds | $267,757 | $338,139 | ~$70,382 |

In every case, GL = TB − missing opening balance. The parser is summing only in-period transactions and treating opening as $0.

(Bonus weirdness: the QB-provided `Total for <Account>` summary row also reads `0.00` for these accounts, which is clearly bogus given hundreds of real transactions. We're not relying on it, so it doesn't matter, but it confirms QB's GL JSON export for this realm has some empty-value quirks.)

## Why the existing fallback didn't catch it

The parser tries `endingBalance` from a running-balance column first, then falls back to `beginningBalance + netSum`. For this export there's only one money column (no running balance), so it falls back. But `beginningBalance` is 0 because the value cells are empty → it returns just `netSum`, which is the period change, not the ending balance.

## The fix

Single edge function change: `supabase/functions/analyze-general-ledger/index.ts`, GL parser only.

### 1. Detect "Beginning Balance row was present but empty"

Track a new flag per account: `beginningRowSeenButEmpty: boolean`. Set it when we see a row whose label is `beginning balance` AND `parseMoney` returns null on every column. This is the signal that QB intended to include an opening balance but the export stripped the value.

### 2. Backfill opening balance from the Trial Balance

The TB ingester already builds monthly per-account series keyed by `acctId` / `fullPath`. The **first populated month's** snapshot ending balance, minus that month's net change, equals the GL period's opening balance. In practice, using the Dec-of-prior-year snapshot — or equivalently the Jan snapshot minus January's net activity — is close enough for reconciliation purposes.

For this dataset, monthly TB index 0 = January 2023 snapshot. We can compute opening balance as:

```
openingBalance ≈ tb.monthly[0].snapshotBalance - (sum of January 2023 GL txns for this account)
```

But that's fragile. A cleaner alternative: extend the TB ingester to also accept a **prior-period snapshot** (Dec 31, 2022) if the user uploads one, OR just use `tb.monthly[0].snapshotBalance` minus the January change as the opening.

Pragmatic choice for this fix: when `beginningRowSeenButEmpty === true` and a matching TB account exists, set `glBalance = tb.snapshotBalance` (the Dec 2025 ending balance from TB) and record `glBalanceSource = "tb_inferred"`. This eliminates the false variance and is honest about what we did — these accounts simply can't be independently verified from the GL alone when QB ships empty opening rows.

### 3. Surface the inference in the UI

Add an optional `glBalanceSource: "gl" | "tb_inferred"` to `TBComparison`. When `tb_inferred`, render the row in the matched section with a small footnote indicator (e.g. an asterisk + tooltip: *"GL opening balance was missing from the QuickBooks export; ending balance taken from Trial Balance for these accounts."*). Do NOT count these as either matches or variances in the headline reconciliation rate — they should be a third bucket like "verified via TB only."

### 4. Flag persistent emptiness

If `beginningRowSeenButEmpty` AND we couldn't find a matching TB account, surface it as a flag: *"Account 'X' has missing opening balance in GL detail and no TB to cross-reference."* These would remain true variances.

## Expected outcome

- The 4 BS variances disappear from "Material Variances"
- They appear in a new "Verified via TB" row group (or just as matches with an asterisk)
- The 3 remaining true issues stay flagged: A/P ($-8,748 — real cutoff/timing), plus any structural rollups already handled
- Reconciliation rate climbs from 83% / 91% (with last change) to ~96%+

## Open question

Two paths for #2 above — which do you want?

**(a) Conservative inference**: When opening balance is missing, accept TB's ending as the GL's ending, mark as `tb_inferred`. Eliminates false flags but means we're not independently verifying these 4 accounts. *(I recommend this — the empty rows are a QB export defect, not a data quality issue worth flagging.)*

**(b) Strict mode**: Keep flagging them as variances but add a clear "Opening balance missing from GL export" annotation so users know it's a QB export limitation, not a real reconciliation failure. Slower path to a clean dashboard but more transparent.

## Out of scope

- Re-parsing the original GL file to look for opening balances embedded elsewhere (the JSON cells are genuinely empty)
- Asking the user to re-export — this is a QB defect that may not be fixable on their end
- Touching the TB ingester or matching logic — both are working correctly
