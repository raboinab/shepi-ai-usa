# Fix: AI reclassifications lose From/To on accept

## What's actually happening

The data IS being saved when you click "Convert to Reclassification" — but the From/To dropdowns render blank because the values don't match any option in the list.

The Reclassifications section's From/To dropdowns are populated from a fixed list of 14 canonical FS line items in `src/lib/fsLineItems.ts`:

```
Revenue, Cost of Goods Sold, Operating expenses, Other expense (income),
Cash and cash equivalents, Accounts receivable, Other current assets,
Fixed assets, Other assets, Current liabilities, Other current liabilities,
Long term liabilities, Equity
```

The AI in `supabase/functions/process-reclassification-job/index.ts` is prompted with the schema fields `from_line_item` / `to_line_item` typed as free-form `string` (no enum constraint). Looking at your project's real rows in `flagged_transactions.ai_analysis`, the AI is returning things like:

| account_name | suggested_from_line_item | suggested_to_line_item |
| --- | --- | --- |
| Opening Balance Equity | `Equity - Opening Balance Equity` | `Retained Earnings / appropriate equity or source account` |
| Depreciation | `Operating Expenses` *(capital E)* | `Depreciation & Amortization (separate line)` |
| Job Expenses:Job Materials | `Operating Expenses` | `Cost of Goods Sold / Cost of Revenue` |
| Refunds-Allowances | `Revenue` ✅ | `Contra-Revenue (Returns & Allowances)` |

None of those — even "Operating Expenses" with a capital E — match the canonical "Operating expenses" exactly, so when `handleConvertToReclassification` in `ReclassificationsSection.tsx:81` writes them into `fromFsLineItem` / `toFsLineItem`, the shadcn `<Select>` can't find a matching `<SelectItem value=…>` and renders the placeholder. To you it looks empty; downstream the workbook also can't bucket the amount because the calculations key off the exact canonical string.

So it's two layered problems:
1. **AI prompt doesn't constrain output** to the 14 allowed values.
2. **Conversion doesn't normalize** what the AI returned.

## Fix

Both layers, in one PR.

### 1. Constrain the AI to the canonical 14 (prevents future drift)
In `supabase/functions/process-reclassification-job/index.ts`:
- Add an `FS_LINE_ITEMS` constant mirroring `src/lib/fsLineItems.ts`.
- Change the `from_line_item` and `to_line_item` schema entries from `{ type: "string" }` to `{ type: "string", enum: [...FS_LINE_ITEMS] }`.
- Add a brief line to the system prompt: *"`from_line_item` and `to_line_item` MUST be one of these exact strings: …"*.

### 2. Normalize at convert time (fixes the rows already in the DB)
In `src/components/wizard/sections/ReclassificationsSection.tsx`, before assigning `fromFsLineItem` / `toFsLineItem` in `handleConvertToReclassification` (lines 85–86), pass each value through a small `normalizeFsLineItem(s)` helper that:
- Returns the exact match if it's already canonical.
- Otherwise tries a case-insensitive match (catches "Operating Expenses" → "Operating expenses").
- Otherwise applies a tight keyword map covering the patterns I saw in your data:
  - `/cogs|cost of goods|cost of revenue|job cost|job material|job labor|cost of labor/i` → `Cost of Goods Sold`
  - `/operating expense|opex|sg&a|sga|overhead/i` → `Operating expenses`
  - `/depreciation|amortization|d&a/i` → `Operating expenses` *(D&A stays inside opex in our 14-line model)*
  - `/contra.?revenue|refund|return|allowance|discount/i` → `Revenue`
  - `/other income|interest earned|non.?operating|below.?the.?line/i` → `Other expense (income)`
  - `/equity|retained earnings|opening balance|owner.?s? draw/i` → `Equity`
  - `/current liab|sales tax payable|ap|accounts payable/i` → `Current liabilities`
  - `/long.?term|note payable|loan payable|debt/i` → `Long term liabilities`
  - `/fixed asset|pp&e|equipment|building|vehicle/i` → `Fixed assets`
  - `/cash/i` → `Cash and cash equivalents`
  - `/receivable|ar/i` → `Accounts receivable`
  - `/suspense|clearing|unapplied|deferred/i` → `Other current liabilities`
- Falls back to empty string if nothing matches (same as today's behavior — user picks manually).

The helper lives next to `FS_LINE_ITEMS` in `src/lib/fsLineItems.ts` so the edge function and the UI can share it (the edge function gets a copy since it can't import from `src/`).

### 3. Visible signal when normalization failed
If `normalizeFsLineItem` returns `""` (i.e., AI gave a string we couldn't map), set the row's description to prepend `"⚠️ Verify From/To — AI suggested: <original string> → <original string>"` so you know which converted rows need a manual pick rather than wondering why they're blank.

## What I'm NOT changing
- The `flagged_transactions` table or the 31 rows already there — re-running the AI analysis after the prompt change is enough, and the normalizer handles the existing converted rows the next time the user re-converts.
- The 14-item `FS_LINE_ITEMS` list itself. If you want D&A as its own line, that's a separate, larger change to the workbook bucketing.
- The accept/dismiss/convert state machine.

## Verification
- Re-run "Analyze with AI" on this project; confirm new `flagged_transactions` rows have `ai_analysis.suggested_from_line_item` / `_to_line_item` strictly in the 14-item list.
- Convert one of the existing rows (e.g. "Depreciation") and confirm the From dropdown shows "Operating expenses" and the To dropdown shows "Operating expenses" (since D&A maps there in our model) — the warning prefix appears on the description.
- Convert "Job Expenses:Job Materials" and confirm From = "Operating expenses", To = "Cost of Goods Sold".
- Open the workbook QoE tab and confirm the reclassification amount now actually moves between the two FS line items in the columns instead of being a no-op.
