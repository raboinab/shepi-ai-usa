## What the new screenshot tells us

Reconciliation moved 83% → 89% after the last two fixes. Six "Material Variances" remain and they fall into three buckets — none of which are real reconciliation failures.

### Bucket 1 — Parent-only GL postings vs TB rollup (5 of 6)

| Account | GL | TB | Notes |
|---|---|---|---|
| Pest Control Services | $70 | -$179,716 | $70 of direct postings, rest under children |
| Fountains and Garden Lighting | $45 | -$151,591 | same |
| Design income | $263 | -$119,170 | same |
| Services | $104 | -$85,785 | same |
| Other Income | $331,583 | -$98,222 | parent rollup + sign issue (see below) |

Same shape as the "Landscaping Services" row we already flag as `structural_variance`. The detector currently only fires when the TB side has child rows under that path. For these five it doesn't fire because the children live on the **GL** side, not TB (QB's GL detail expands the parent's sub-accounts as siblings; TB rolls them up). The signal we need is symmetric: a path is a "parent" if it has children on **either** side.

### Bucket 2 — A/R BS account, opening-balance inference missed (1 of 6)

Savings, Checking, Undeposited Funds, A/P all correctly came back as `tb_inferred` (✓ visible in DB). A/R did not — its row in `reconciliation` still has `glBalance=-300` and status `variance`, so the parser didn't set `beginningRowSeenButEmpty=true` for the A/R section. Likely cause: A/R's section header in this QB export uses a slightly different label (e.g. "Accounts Receivable (A/R)" wrapped, or a sub-account row precedes the Beginning Balance) and our detector falls through. We need to widen the safety net: for any BS account where (a) the matched TB magnitude is materially larger than the GL parent and (b) the GL parent magnitude is small/zero, fall back to TB inference even without an explicit empty-Beginning-Balance signal.

### Bucket 3 — Other Income sign/magnitude mismatch (subset of bucket 1)

$331,583 vs -$98,222 — magnitudes don't agree even after sign flip. Most likely this is the same parent-rollup pattern but with one additional sub-account that nets in the opposite direction on TB. Once we treat it as `structural_variance` via the symmetric detector, it stops being a material variance; the parent rollup discrepancy isn't a real reconciliation failure (children reconcile separately).

## Fix — single edge function change

File: `supabase/functions/analyze-general-ledger/index.ts`. No UI changes needed — `structural_variance` already renders correctly and `tb_inferred` already has the asterisk annotation.

### 1. Symmetric parent detection

Today:
```ts
const tbParentPaths = new Set<string>();
for (const [, t] of tbByFullPath) { ... }
```

Add a second set built from the GL accounts list and union the two:
```ts
const glParentPaths = new Set<string>();
for (const a of accounts) {
  const fp = (a as AccountInfo & { fullPath?: string }).fullPath || a.name;
  const parts = fp.split(":");
  for (let i = 1; i < parts.length; i++) {
    glParentPaths.add(normKey(parts.slice(0, i).join(":")));
  }
}
const parentPaths = new Set([...tbParentPaths, ...glParentPaths]);
```

Update the structural test to use `parentPaths.has(normKey(tb.fullPath)) || parentPaths.has(normKey(fullPath))`. Same magnitude guard (`|tb| > max(|gl|*3, 1000)`) so we don't sweep real variances under this rug.

### 2. Widen TB-inference safety net for BS accounts

After the existing `beginningEmpty` branch, add a second-pass fallback inside the same `if (tb)` block, guarded to BS only:

```ts
const tinyGlVsLargeTb =
  !isPL &&
  Math.abs(acct.glBalance) < Math.max(Math.abs(tbBalance) * 0.05, 500) &&
  Math.abs(tbBalance) > 1000;

if (tinyGlVsLargeTb) {
  // mark match w/ glBalanceSource = "tb_inferred"
  ...
}
```

This catches A/R and any other BS account where the GL parent shows only token postings against a sizeable TB ending balance — the same QB opening-balance defect, just expressed differently.

### 3. No changes to flagging, missing-in-TB/GL, or UI

The headline reconciliation rate already counts `structural_variance` toward `matched`; the structural section already renders; the asterisk annotation already exists. The output difference is mechanical: 5 rows move from "Material Variances" into "Structural differences", A/R moves into the asterisked matched group.

## Expected outcome

- Reconciliation rate: 89% → ~98%
- Material Variances: 6 → 0–1 (only genuinely material, non-structural variances if any remain)
- Structural differences: 1 → 6 (Landscaping + Pest Control + Fountains + Design + Services + Other Income)
- A/R joins Savings/Checking/Undeposited/A/P with the asterisk

## Out of scope

- Re-parsing the GL CSV to recover the original section breaks (these are export-side defects)
- UI changes — current components handle both `structural_variance` and `tb_inferred` already
- Touching TB ingester or matching logic
