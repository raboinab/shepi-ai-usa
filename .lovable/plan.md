## Problem

Three different surfaces compute "total adjustments" three different ways. Today they happen to agree because every stored adjustment in real data uses `intent: "remove_expense"` (sign = +1). The moment a user picks `remove_revenue`, `add_expense`, or any non-default intent in the wizard, the EBITDA bridge and Insights tiles will silently flip sign and disagree with the workbook grid, the QoE tab, and the file the user downloads. That's the kind of bug that destroys credibility on a single deal.

## Ground truth (verified against real data: BC, BC Copy, Landscaping Biz)

- Adjustments are stored with shape `{ intent, periodValues, effectType, description, linkedAccountNumber, status, ... }`.
- `src/lib/projectToDealAdapter.ts` translates them into the workbook `Adjustment` shape `{ amounts, intent, type, label, tbAccountNumber, effectType }` and **pre-applies the intent sign** (line 374: `amounts[k] = numVal * sign`). So by the time anything in the workbook code sees `adj.amounts`, the sign is already baked in.
- Single source of truth: **after the adapter runs, `Σ amounts[period]` is the correct EBITDA-impact total. Don't apply sign again.**

## Surfaces audited

| Surface | Behavior today | Verdict |
|---|---|---|
| Workbook DD Adjustments grid | Sums `amounts` directly | Correct |
| IS / QoE / FCF / NWC / ProofOfCash tabs | `calcAdjustmentTotal` sums `amounts` | Correct |
| In-browser XLSX/PDF export (current production path) | Uses `workbook-grid-builders.ts` which sums `amounts` | Correct |
| `QuickInsights` "Total Adjustments" tile | Calls `signedAdjustmentTotal(adj)` on adapter output → multiplies by sign **again** | Wrong, currently masked |
| `ChartPanel` EBITDA bridge | Same double-sign | Wrong, currently masked |
| `AdjustmentsSummary` table | Same double-sign | Wrong, currently masked |
| `AdjustmentTraceSheet` header total | `Σ Object.values(amounts)` with no NonQoE filter | Wrong header number; doesn't tie to bridge |
| Edge function `export-pdf` | Reads stored `periodValues` and sums unsigned | Latent bug — function is currently unused (only referenced in `useEdgeFunctionHealth`) |
| Edge functions `compute-workbook`, `export-workbook-xlsx` | Receive `raw.adjustments` with no adapter | Latent bug — also currently unused |

## Fix (single source of truth: pre-signed `amounts`)

### 1. Delete the misused helper

- Delete `src/lib/adjustmentSignUtils.ts`
- Delete `supabase/functions/_shared/workbook/adjustmentSignUtils.ts`

The helper was written for the *raw stored* shape (`periodValues` + `intent`). Nothing in the rendering pipeline ever sees that shape — the adapter always runs first. Keeping it around is the trap.

### 2. Fix the three Insights call sites to sum `amounts` directly

All three changes are one-liners. Pattern: replace `signedAdjustmentTotal(adj)` with `Object.values(adj.amounts).reduce((s, v) => s + (v || 0), 0)` (or a small local `sumAmounts(adj)` helper colocated in `src/lib/calculations.ts`).

- `src/components/insights/QuickInsights.tsx` (line 163, plus the import)
- `src/components/insights/ChartPanel.tsx` (lines 94, 103, plus the import)
- `src/components/insights/AdjustmentsSummary.tsx` (line 29, plus the import)

While here: optionally exclude `effectType === "NonQoE"` rows from the EBITDA bridge and the "Total Adjustments" tile (they're already excluded from `calcAdjustedEBITDA` in the workbook), so the chart and the workbook tile show the same number.

### 3. Fix `AdjustmentTraceSheet` header (the user-visible bit you asked about)

In `src/components/workbook/AdjustmentTraceSheet.tsx` around line 45–48:

- Replace the absolute sum with the signed sum: `Σ adjustment.amounts[p]` (already pre-signed by adapter).
- When `adjustment.effectType === "NonQoE"`, don't show a dollar number in the header — show a small badge: "Presentation only — not in Adjusted EBITDA". This prevents the trace from claiming a $X impact that the bridge doesn't reflect.
- Keep the per-period breakdown rendering as-is (those are the same signed values).

### 4. Centralize so this can't drift again

Add a tiny exported helper in `src/lib/calculations.ts` (and re-export from the server `_shared/workbook/calculations.ts`):

```ts
export function sumAdjustmentAmounts(adj: Adjustment, opts?: { excludeNonQoE?: boolean }): number {
  if (opts?.excludeNonQoE && adj.effectType === "NonQoE") return 0;
  let total = 0;
  for (const v of Object.values(adj.amounts)) total += v || 0;
  return total;
}
```

Use this from Insights, the trace sheet, and anywhere else summing one adjustment. (Existing `calcAdjustmentTotal(adjustments[], type, periodId, excludeNonQoE)` stays as-is — it's the multi-adjustment, per-period helper that the workbook tabs already use correctly.)

### 5. Sweep the latent bombs in the edge functions

Even though `export-pdf` / `export-workbook-xlsx` / `compute-workbook` aren't called from the UI today, they will be used eventually and they currently compute the wrong number. Two options:

- **(a) Stub them out** with a clear `throw new Error("Server export disabled — use in-browser export. See plan: route through projectToDealAdapter before computing.")` so a future hookup fails loudly instead of silently returning unsigned totals.
- **(b) Port `projectToDealAdapter` to `_shared/workbook/` and call it at the entry of each edge function** so `dealData.adjustments` is pre-signed before any sum runs.

Recommend **(a)** for this change (smallest surface, prevents regression), and open a follow-up task for **(b)** when server-side export is actually wired up.

### 6. QA checklist before shipping

Manual smoke test on a real project (BC works since it has 50+ adjustments):

1. Open the deal, look at Insights "Total Adjustments" tile and the EBITDA bridge waterfall — confirm both numbers exactly match the "Total Adjustments" row at the bottom of the DD Adjustments tab.
2. Click into one DD adjustment to open the trace sheet — header total matches the row you clicked from in the bridge.
3. Edit one adjustment in the wizard, change `intent` from `remove_expense` to `remove_revenue`, save, reload. Confirm the bridge now shows that adjustment as a negative bar and the Insights tile decreases by the right amount. (This is the regression test that today's code would fail.)
4. Mark one adjustment `effectType: "NonQoE"`, confirm: it disappears from the bridge total, disappears from the tile, and shows the "Presentation only" badge in the trace sheet header.
5. Download XLSX/PDF (in-browser path) — totals match the screen.

## What this does not change

- Database schema, stored data, or wizard input UX (no migration, no user re-entry).
- The workbook calculation engine (`calculations.ts`, grid builders) — those are already correct.
- The wizard / discovery / proposals flow — those operate on the raw stored shape and don't go through the adapter.

## Estimated scope

5 files edited, 2 files deleted, ~40 lines net change. No DB migration. ~30 min of work + 15 min of QA on a real deal.
