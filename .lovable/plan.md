
## Why Landscaping worked and VampireFreaks didn't

Both projects load TB from the same `qbtojson` shape: each row's first `colData` cell is a string like `"1005 Cash"` (account number + name). The COA is also `qbtojson`, with each account having `id`, `name`, `acctNum`, and `fullyQualifiedName` (FQN).

The two datasets differ in three ways that all cut against VampireFreaks:

**1. Landscaping's COA is flat; VampireFreaks' COA is hierarchical.**
- Landscaping: 89 accounts, **0 with `acctNum`**, names are unique leaves like `"Cash"`, `"Checking"`. After the matcher strips the leading digits from `"1005 Cash"` → `"Cash"`, it hits the COA by **name**. Every TB row lands on a COA account.
- VampireFreaks: 141 accounts, only 67 with `acctNum`. The revenue/COGS tree is nested — parents have numbers (`4000 RETAIL`, `5000 COGS-Shopify`), **children/grandchildren don't** (`z_Shopify Sales`, `T-Shirt COGS`, `Shopify Discounts`). TB rows for sub-accounts arrive as `"4000 RETAIL:z_Shopify Sales"` — the FQN with the *parent's* number prefixed. The current matcher:
  - strips `"4000"` → sets `accountNumber="4000"` and cleans the name to `"RETAIL:z_Shopify Sales"`,
  - looks up by that number in `coaByNumber` → hits **parent `RETAIL`** (also `acctNum=4000`),
  - so every Shopify sub-account collapses into `RETAIL`, and the FQN map is only consulted as a fallback when no number match exists. Result: the largest revenue/COGS buckets never map to their real leaf accounts, and the P&L validator has nothing on the TB side to compare against.

**2. Landscaping has a live QuickBooks connection; VampireFreaks doesn't.**
- Landscaping has 14 `unified_api` monthly TB reports in `processed_data` alongside the qbtojson upload. When the wizard falls back to the API shape, IDs in TB (`AccountRef`) match the COA `id` field 1:1 — no name/number parsing required.
- VampireFreaks has only the qbtojson upload, so name/number parsing is the only path.

**3. `qbtojson` populated `fsType` on the COA correctly for both, but the TB fanout uses whichever COA rules first match.** With VampireFreaks' sub-accounts being merged into the parent, the classifier is judging inflated buckets, which is why Total Revenue and COGS still show as $0 on the TB side of the P&L validator even after the server rebuild reported 152 matches (those matches counted the parent hit, not the intended leaf).

## Fix

Prefer FQN over number when the TB row's cleaned name contains a `:` (i.e. the row is a sub-account), and only fall back to number-only matching for leaves.

### `src/lib/trialBalanceUtils.ts` — parser

When splitting `"4000 RETAIL:z_Shopify Sales"`:
- keep the extracted leading number as `parentAcctNum` (not `accountNumber`) when the remainder contains `:`,
- set `accountName` = the remainder (`"RETAIL:z_Shopify Sales"`), and leave `accountNumber` unset for the child so it can't false-match to the parent.

### `src/lib/trialBalanceUtils.ts` — `crossReferenceWithCOA`

Reorder the resolution:
1. If TB row has `qbAccountId` and it exists in `coaById` → use it.
2. If `accountName` contains `:` → look up by **FQN** (case-insensitive, exact). If hit → use it.
3. Else if `accountNumber` is set → look up by number.
4. Else look up by leaf name (last segment after `:`), then full name.
5. Last resort: leading-digit extraction (existing fallback).

Also index the COA by `fqn` lowercased and by leaf name (`name` = last `:` segment) so step 2 and step 4 are O(1).

### `supabase/functions/rebuild-project-tb/index.ts`

Mirror the same precedence inside `crossReferenceCOA` so the server-side rebuild reports honest match counts (today it reports 152 matches while children silently collapse into parents).

### Verification

- Re-run TB rebuild + P&L validation on `621a6c9f-…`. Expected: `Revenue`, `COGS`, `Gross Profit` populate on the TB side; validator match rate jumps from 0% to near-100%.
- Re-run on `fa0768ca-…` (Landscaping) to confirm no regression — flat COA still resolves by name.
- Spot-check that `z_Shopify Sales` and `T-Shirt COGS` map to their leaf COA rows, not `RETAIL`/`COGS-Shopify` parents.

### Not in scope

- Rewriting `qbtojson` output to emit the leaf `AccountRef.id` in TB `colData[0].id` (would remove the need for this reconciliation entirely, but requires changes to the external converter).
- Changing how the P&L validator sums parents vs. children — that logic is already correct once the child rows are mapped.
