## Fix copy in Export Center "AI Analyst Commentary" card

**File:** `src/components/pdf-narratives/NarrativePanel.tsx` (lines 94-97)

**Current:**
> Generate Kyle/AKB-style narrative for each slide. Numbers are auto-verified against your data; unverified figures are stripped. Edit freely before exporting.

**Proposed replacement:**
> Generate analyst-style commentary for each slide. Numbers are auto-verified against your data; unverified figures are stripped. Edit freely before exporting.

Drops the internal "Kyle/AKB" reference (meaningless to users), keeps the verification + editability messaging. No other behavior changes.