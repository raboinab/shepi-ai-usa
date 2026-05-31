## Problem

On the Journal Entries upload step, clicking "Run Journal Entry Analysis" finishes successfully on the server (edge function logs confirm 3,099 entries processed and two `journal_entry_analysis` rows were written to `processed_data` for project `fa0768ca-…`), but the UI keeps showing the "Ready to analyze Journal Entry" empty state.

Root cause: the `AnalysisRunButton` for JE in `src/components/wizard/sections/DocumentUploadSection.tsx` (around line 1989) is not given an `onComplete` callback, so after the function returns, `jeAnalysis` state never re-fetches. The General Ledger button right above it correctly passes `onComplete={fetchGLAnalysis}` — JE just missed the wiring.

## Fix

1. In `DocumentUploadSection.tsx`, add `onComplete={fetchJEAnalysis}` to the JE `AnalysisRunButton` (mirroring the GL pattern).
2. No edge-function or DB changes — the analysis itself works and the insights card already renders correctly when `jeAnalysis` is populated.

## Note on shepi.ai

The site at `shepi.ai` is the published build, which is older than the preview. After this fix, a republish is required for production users to benefit. The preview will reflect the fix immediately.

## Files touched

- `src/components/wizard/sections/DocumentUploadSection.tsx` — one-line prop addition.
