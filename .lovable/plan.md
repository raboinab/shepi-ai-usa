# Reclass Review + EBITDA Reclass Visibility

## Context

After the EBITDA reclass policy fix (only cross-line reclasses shift EBITDA), Reported EBITDA on this deal dropped because two AI-suggested reclasses move amounts from `Revenue` → `Other expense (income)`:

| # | Amount | Rationale (AI) |
|---|--------|----------------|
| 1 | $4,224 | "Portfolio/investment income is non-operating… belongs below the line." |
| 2 | $69,018 | "Large catch-all credit, may contain gains on asset sales / one-time items." |

Both are **directionally correct QoE treatment** if the underlying accounts really are non-operating. The $69k one is flagged by the AI itself as "investigate" — it could be legitimate other income, or it could be misclassified operating revenue. Either way, the user needs an easy way to see and audit cross-line reclasses.

## Part A — Manual review surface (the "is this correct" workflow)

Today the reclass list shows every reclass uniformly; nothing visually flags which ones change EBITDA. Add a lightweight callout in the **Reclassifications** wizard section:

1. Filter reclasses where `fromFsLineItem` and `toFsLineItem` land on opposite sides of the EBITDA line (using the same `EBITDA_CATEGORIES` set from `reclassHelpers.ts`).
2. Render an amber `Card` at the top of the section titled **"Cross-line reclasses (affect EBITDA)"** listing each with: amount, from → to, source (AI vs manual), and description.
3. Each row has **Approve / Revert** buttons that call the existing reclass mutation helpers (no new data model).

Source of truth: the existing `reclassifications` array; no schema change.

## Part B — QoE Summary visibility

In `src/components/wizard/sections/QoESummarySection.tsx`:

1. Compute `crossLineReclassImpact` = `reclassAwareReportedEBITDA - reclassAwareReportedEBITDA-without-reclass`. Since `EBITDA_CATEGORIES` overlay only fires for cross-line moves, this equals the EBITDA delta caused by reclasses.
2. Insert a new bar **"Reclass impact"** into `ebitdaComparison` between "Reported" and "Adjustments", so the bridge becomes:
   `Reported (pre-reclass) → Reclass impact → Adjustments → Adjusted`.
3. The "Reported EBITDA" summary card gets a tooltip / subtitle: *"Includes $X from N cross-line reclasses"* when non-zero, linking to the Reclassifications section.

## Part C — Per-reclass EBITDA delta in the workbook (read-only)

In the reclassifications grid (`src/components/workbook/tabs/…` — locate the existing reclass tab), add a derived "EBITDA Δ" column:
- `0` for intra-EBITDA rows
- `±amount` for cross-line rows (sign per from/to direction)

No data model change; purely a display column.

## Out of Scope

- Changing the policy itself (already approved last turn).
- Rewriting AI reclass suggestion logic.
- Per-period EBITDA bridge waterfalls in the PDF exporter — defer.
- Net Income surfaces — already correctly reflect all reclasses.

## Verification

1. On project `fa0768ca-…`: the new amber callout in Reclassifications lists exactly the two Revenue → Other (income) reclasses.
2. QoE Summary EBITDA Bridge shows a visible "Reclass impact" bar matching the delta between pre- and post-reclass Reported EBITDA.
3. Reverting one of the two cross-line reclasses immediately removes its row from the callout and shrinks the "Reclass impact" bar.
4. Reverting a purely intra-EBITDA reclass leaves "Reclass impact" unchanged (still zero contribution from that reclass).
5. Existing `reclassEbitda.test.ts` continues to pass; add one test asserting `crossLineReclassImpact` equals the sum of cross-line reclass amounts (with correct signs).
