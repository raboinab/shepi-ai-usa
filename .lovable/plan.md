## Why LTM EBITDA shows negative

In the trial balance convention used everywhere in shepi, **income line items are stored as negative numbers** (credit-balance). `calcAdjustedEBITDA(...)` returns this raw TB-space value — so a profitable business produces a **negative** number, and only the display layer flips the sign.

Every workbook tab (Free Cash Flow, EBITDA Bridge, etc.) wraps EBITDA in a `negatedPeriodCells()` helper that flips it to the human-readable positive number. Example from `FreeCashFlowTab.tsx`:

```ts
{ id: "adj-ebitda", cells: { label: "Adjusted EBITDA",
   ...npc(p => calc.calcAdjustedEBITDA(...) + isReclass) } }  // npc = negated
```

The fix I just shipped to `NWCFCFSection.tsx` for the summary cards forgot that flip:

```ts
const ltmEBITDA = ltmPeriods.reduce(
  (s, p) => s + calc.calcAdjustedEBITDA(tb, adj, p.id, ab), 0
);  // raw TB-space → comes out negative for a profitable company
```

That is why the card reads **−$376,562** while the grids below (and the FCF line, which already negates EBITDA internally) look correct. Note `LTM FCF = +$358,095` is roughly `−(−376,562) − ΔNWC − taxes`, confirming the sign issue is isolated to the EBITDA card only.

## Fix

In `src/components/wizard/sections/NWCFCFSection.tsx`, negate the EBITDA sum so the headline matches the grids and the rest of the app:

```ts
const ltmEBITDA = ltmPeriods.reduce(
  (s, p) => s - calc.calcAdjustedEBITDA(tb, adj, p.id, ab), 0
);
```

No other change is needed:
- `currentNWC`, `t3mAvg`, `t6mAvg`, `t12mAvg` come from `calcNWCByMethod`, which already returns signed display values (no flip needed — Current NWC reads correctly at $69,334).
- `ltmFCF` already uses `-calcAdjustedEBITDA(...)` inside its per-period sum, so it is unaffected.
- `ltmCapEx` stays 0 (sourced from Proof of Cash classifications, not wired here).

After the change the card should read approximately **+$376,562** for this project, lining up with the Adjusted EBITDA row in the EBITDA Bridge and the implied EBITDA inside the FCF math.

## Optional follow-up (not in this fix)

`DealParametersCard` consumes the same `metrics.ltmEBITDA`. Once the sign is corrected here, anything downstream that reads `metrics.ltmEBITDA` (e.g. multiples, peg suggestions) will also read correctly — worth a quick visual check after the fix lands, but no code change expected.