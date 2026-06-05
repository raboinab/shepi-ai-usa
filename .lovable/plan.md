## Problem

There is no way to re-run the Tax Return Analysis after the initial upload. If GL/financial data is added later (or the comparator logic improves), users must re-upload the 1120-S to get fresh comparisons.

## Fix

Add a **Re-analyze** button to the Tax Return Analysis card header that re-invokes the existing `parse-tax-return` edge function for the same `documentId` and replaces the analysis in place.

### 1. `TaxReturnInsightsCard.tsx`
- Add optional `onReanalyze?: (documentId: string) => Promise<void>` prop.
- In `CardHeader`, next to the year/form badges, render a small ghost button: `<RefreshCw />` "Re-analyze" (hidden if no handler passed).
- Local `isReanalyzing` state disables the button and spins the icon while the parent runs the handler.
- Show `analyzedAt` timestamp next to the button as muted text ("Analyzed {relative time}").

### 2. `DocumentUploadSection.tsx`
- Add `handleReanalyzeTaxReturn(documentId)` that:
  - Sets `parsingTaxReturn = true` for that document (reuse existing localStorage key pattern).
  - Calls `supabase.functions.invoke('parse-tax-return', { body: { documentId, projectId } })`.
  - On success, replaces the matching entry in `taxReturnInsights` (same merge logic already used at line 1235).
  - Toasts success/failure using the same messages as the upload path (rate limit / credits / generic).
- Pass `onReanalyze={handleReanalyzeTaxReturn}` into each `<TaxReturnInsightsCard />` at line 2070.

### Out of scope
- No edge function changes (it already accepts `{ documentId, projectId }` and is idempotent — overwrites prior analysis).
- No DB schema, no new tables.
- No bulk "Re-analyze all" — single button per card.

### Files touched
- `src/components/wizard/sections/TaxReturnInsightsCard.tsx`
- `src/components/wizard/sections/DocumentUploadSection.tsx`
