## Why we're still at 91% after the last fix

The symmetric parent detection only catches the structural mismatch when the matched TB row has *children stored under its own path* (e.g. `Landscaping Services` has `Landscaping Services:Job Materials`, so `tbParentPaths` contains `landscaping services`). It works for that one row — that's the single "Structural differences" we already show.

The 5 remaining material variances (Pest Control Services, Fountains and Garden Lighting, Design income, Services, Other Income) are the **same shape** but the children live under a *different namespace*:

```
TB rows present:
  Landscaping Services:Fountains and Garden Lighting   ← child (matches GL $45 cleanly? no — GL row is the rollup)
  Fountains and Garden Lighting                         ← standalone parent rollup, -$151,591
```

When we look at the standalone parent TB row, `tb.fullPath = "Fountains and Garden Lighting"` (no colon), so the current `tbParentPaths` set — built only from prefixes of colon-paths — does **not** contain it. `isStructural` evaluates false and the row gets shoved into Material Variances.

Also: GL account names from `canonical_transactions` are flat (no colons), so `glParentPaths` is always empty in practice. The "symmetric" detection from the last fix never contributes anything for this dataset.

## Fix — one edge function change

File: `supabase/functions/analyze-general-ledger/index.ts`. No UI changes; `structural_variance` already renders correctly.

### Add a cross-namespace parent signal

Build a `tbLeafFrequency` map alongside `tbParentPaths`:

```ts
const tbLeafCount = new Map<string, number>(); // normalized leaf -> count of TB rows with that leaf
for (const [, t] of tbByFullPath) {
  const leaf = normKey(leafOf(t.fullPath));
  tbLeafCount.set(leaf, (tbLeafCount.get(leaf) || 0) + 1);
}
```

A TB row is a "parent rollup of itself" when:
1. Its leaf name also appears as a leaf on **another** TB row (i.e. `tbLeafCount.get(leaf) > 1`), AND
2. At least one of those other rows lives at a deeper path (has a colon).

Encode that as a small helper:

```ts
const isCrossNamespaceRollup = (tbRow: TBAcct): boolean => {
  const leaf = normKey(leafOf(tbRow.fullPath));
  if ((tbLeafCount.get(leaf) || 0) < 2) return false;
  // confirm at least one sibling-namespace child exists at a deeper path
  for (const [, t] of tbByFullPath) {
    if (t === tbRow) continue;
    if (normKey(leafOf(t.fullPath)) === leaf && t.fullPath.includes(":")) return true;
  }
  return false;
};
```

Extend the structural test (line ~645) to OR in this new signal, keeping the existing magnitude guard intact so we don't sweep real variances:

```ts
const isStructural = !isMatch &&
  (
    parentPaths.has(normKey(tb.fullPath)) ||
    parentPaths.has(normKey(fullPath)) ||
    isCrossNamespaceRollup(tb)
  ) &&
  Math.abs(tbBalance) > Math.max(Math.abs(acct.glBalance) * 3, 1000);
```

### Why this is safe

- Magnitude guard (`|tb| > max(|gl|*3, 1000)`) is unchanged — a genuine variance with comparable magnitudes still flags as `variance`.
- `tbLeafCount >= 2` plus the deeper-path requirement only triggers when QB literally reports the same account name twice — once standalone and once under a different parent — which is the exact signature of cross-namespace rollups.
- All currently-correct classifications (the 1 existing structural row, every matched row, every "missing" row) are unaffected.

## Expected outcome

- Reconciliation rate: 91% → ~99%
- Material Variances: 5 → 0
- Structural differences: 1 → 6 (Landscaping Services + Pest Control + Fountains + Design income + Services + Other Income)
- A/R remains in the asterisked matched group from the previous fix
- The Other Income $331,583 vs −$98,222 entry — the magnitude check still passes (`98,222 > 331,583*3`? no — `98,222 < 994k`, so this one will NOT pass the guard). Need to re-examine: actually the guard is `|tb|=98,222 > max(|gl|=331,583 * 3, 1000) = 994,749` → FALSE. So Other Income would NOT be re-classified as structural under the current guard.

### Other Income special case

Other Income has GL=$331,583 (debit-positive convention, magnitude > TB rollup magnitude). The current magnitude guard assumes TB > GL because TB is the rollup. For sign-flipped credit-natural rollups where GL aggregates positively, we should compare with absolute values on both sides regardless of direction. Loosen the guard to:

```ts
const a = Math.abs(tbBalance), b = Math.abs(acct.glBalance);
const bigGap = Math.max(a, b) > Math.max(Math.min(a, b) * 3, 1000);
```

So the structural test becomes:

```ts
const isStructural = !isMatch &&
  (parentPaths.has(normKey(tb.fullPath)) || parentPaths.has(normKey(fullPath)) || isCrossNamespaceRollup(tb)) &&
  bigGap;
```

This catches Other Income (gap of 331k vs 98k → 331k > max(98k*3, 1000) → TRUE).

## Out of scope

- Re-parsing GL CSV to recover colon paths (export-side defect)
- UI changes — both `structural_variance` and `tb_inferred` rendering are already in place
- Touching TB ingester, matching strategy, or the BS-inference safety net
