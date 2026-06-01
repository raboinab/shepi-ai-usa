## Problem

The Phase 3 guide content for Reclassifications and DD Adjustments is swapped. The wizard router renders:

- `3-1` → **Reclassifications** section
- `3-2` → **DD Adjustments** section

But the guide content files have the labels reversed, so the in-page guide sidebar and welcome card show DD-Adjustment content on the Reclassifications page and vice-versa. The shared "Quick Decision" tree also points to the wrong section numbers.

Routes confirmed in:
- `src/components/wizard/WizardSidebar.tsx` (3-1 Reclassifications, 3-2 DD Adjustments)
- `src/components/wizard/WizardContent.tsx` `renderSection()` (same mapping)

Mismatched content lives in:
- `src/lib/adjustmentsGuideContent.ts` — `adjustmentsGuideContent["3-1"]` holds DD-Adjustments copy; `["3-2"]` holds Reclassifications copy. `sharedDecisionTree` navigates "Yes → DD Adjustments" to `section: 1` and "No → Reclassifications" to `section: 2` (both inverted).
- `src/components/wizard/shared/AdjustmentsWelcomeCard.tsx` — `getRecommendation` shows the DD-template/AI-Discovery hint on `3-1` and the reclassify hint on `3-2`.

## Fix

1. **`src/lib/adjustmentsGuideContent.ts`**
   - Swap the `"3-1"` and `"3-2"` entries in `adjustmentsGuideContent` so `3-1` = Reclassifications and `3-2` = DD Adjustments.
   - In `sharedDecisionTree`, swap `navigateTo` section numbers:
     - "Yes → DD Adjustments" → `section: 2`
     - "No → Reclassifications" → `section: 1`

2. **`src/components/wizard/shared/AdjustmentsWelcomeCard.tsx`**
   - Swap the `ctx.sectionKey === "3-1"` and `ctx.sectionKey === "3-2"` branches in `getRecommendation` so the reclassify hint shows on `3-1` and the DD-template/AI-Discovery hint shows on `3-2`.

No other files reference these section keys for guide content, and no route, sidebar, or persisted data changes are needed.

## Verification

- Load a project, open `Phase 3 → Reclassifications` (3-1): guide title should read "Reclassifications", welcome card should suggest adding an entry / asking AI what to reclassify.
- Navigate to `DD Adjustments` (3-2): guide title should read "DD Adjustments", welcome card should suggest "From template..." or AI-Discovery flagged items.
- Decision-tree "Go" buttons should jump to the correct section.