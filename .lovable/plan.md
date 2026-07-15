## Root cause

`analyze-general-ledger` treats `header.colData[0].id` as a stable QuickBooks account identifier and keys the aggregation map on `id:${acctId}`. In this project's exports (and in general for qbToJson output on this account) that field is actually a **per-export sequential row number** — the same numeric id points to completely different accounts across the four yearly GL files.

Verified from the raw JSON:

| `id` | 2023            | 2024                 | 2025                            | 2026                 |
|------|-----------------|----------------------|---------------------------------|----------------------|
| 75   | z_Shopify Sales | T-Shirt Sales        | 6085 Office Supplies & Software | 6140 Phone/Internet  |
| 78   | Sezzle Refund   | Shopify Sales – WS   | 6140 Phone/Internet             | 6503 Wages           |
| 102  | AfterPay Fee    | 6140 Phone/Internet  | –                               | –                    |
| 129  | 6140 Phone/Internet | –                | –                               | –                    |

So per-year Phone/Internet activity (real totals $1,678 / $2,262 / $1,890 / $696 = $6,527) lands in **four different key buckets**, each of which also collects a chunk of z_Shopify Sales, T-Shirt Sales, Office Supplies, Wages, AfterPay Fees, and Sezzle Refunds from other years. The later name-collision merge only re-unites rows that already share a name, so it can't unwind this pollution.

That single bug produces:

- $8.5M "Phone/Internet", $3.7M "Rent & Lease", $5.2M "TikTok Sales", $3.2M "Interest Income", etc.
- Cross-class contamination (revenue amounts leaking into expense accounts and vice versa) which is why classifications look reasonable but magnitudes and signs don't match TB.
- The $17.3M A−L−E−NI identity gap.

TB is fine (already keyed on `acctId`, which in the TB feed *is* stable), so once GL is keyed correctly the reconciliation table should snap into place.

## Fix

Single file: `supabase/functions/analyze-general-ledger/index.ts`.

1. **Stop using GL `acctId` as the aggregation key.** Where the per-section key is built today:
   ```ts
   const key = acctId ? `id:${acctId}` : `name:${acctName.toLowerCase()}`;
   ```
   Replace with a key derived from the account *name / number*, which is stable across exports:
   - Extract a leading account-number prefix (`/^(\d{3,})/`) from `acctName` when present → `num:${prefix}` (e.g. `num:6140`).
   - Otherwise fall back to a normalized name key: `name:${normName(acctName)}`.
   - Do NOT include `acctId` in the key at all.
2. **Keep COA lookup working.** COA is currently matched by `acctNum` and by `name` — no change needed there. The section still records `acctNumber` from the leading numeric prefix (already implemented via `coaByAcctNum` fallback) so classification stays authoritative.
3. **Drop the id-preferring branch in the name-collision merge.** After step 1, key collisions between `id:` and `name:` entries won't exist, so the `keys.find(k => k.startsWith("id:"))` preference at lines 484–517 becomes dead code. Simplify by picking the first key as canonical; behaviour is unchanged when only one key per name exists.
4. **Same fix for the fallback `canonical_transactions` path** if it currently uses any per-row id as a key (it already keys on `name.toLowerCase()` — verify, no change expected).
5. **Bump per-export DIAG.** Add one `console.log` per export listing the count of DISTINCT names parsed vs. total sections, so we can catch a future qbToJson change that emits real stable ids and revisit the strategy.

No changes to TB parsing, matching (leaf/fullPath), classification, sign normalization, or the identity math. Those were already correct once the aggregation isn't polluted.

## Verify

After deploy, re-run **Analyze GL** on project `621a6c9f-1c25-40fa-92fa-6762ae3fe72b` and check:

- `6140 Phone/Internet` GL ≈ **$6,527**, matches TB ($6,527).
- `6105 Rent & Lease` GL ≈ **$224,291**, matches TB ($224,291).
- `TikTok Sales` GL magnitude drops to a plausible annual × 4 figure and its sign flips to credit-natural after normalization.
- `A − L − E − NI` collapses toward ~$0 (some residual is expected until specific structural rollups clear, but not $17M).
- Reconciliation rate rises well above 34%.

If any of the above still misbehaves, the diagnosis will now be visible against clean per-account numbers instead of pollution-masked ones.

## Out of scope

- No UI changes.
- No migrations.
- No touch to `process-quickbooks-file`, TB parser, or COA ingestion.
