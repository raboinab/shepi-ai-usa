# Shepi Overwhelm Audit (read-only)

Goal: find the specific places in the current shepi flow where users get overwhelmed, then judge what a Claude skill would actually relieve vs. just relocate. No code changes in this pass.

## Scope

Cover the full first-time user path, signup through first deliverable:

1. Landing / signup / onboarding
2. Deal creation + intake (industry, worries, scope choices)
3. Data ingestion (QuickBooks connect, file uploads, manual entry)
4. Wizard / adjustment flow (where workbook logic forces decisions)
5. Review + export (PDF/XLSX)

For each stage capture:
- What the user has to decide
- What they have to type or upload
- Where the UI branches or gates them
- Where workbook math forces a choice they may not have context for
- Where copy assumes accounting fluency

## Method

Pure read of source + routes. No browser session, no data changes.

- Walk `src/pages/*` and `src/components/wizard/*` (or equivalent) in route order
- Read the deal intake + QBO connection components
- Read the adjustment definitions and any "required field" gates
- Read export builders (`buildPDFReport`, `TAB_GRID_BUILDERS`) only to confirm what the user must have completed for export to succeed
- Cross-reference with the homepage/marketing promise so we can see the gap between what we sold and what we ask for

## Deliverable

A single written findings doc (in chat, not committed) with:

1. **Stage-by-stage friction list** — 3–7 concrete overwhelm points, each with file/route reference
2. **Root-cause grouping** — which are UX (fixable in shepi), which are inherent to QoE rigor (can't remove), which are scope creep (cuttable)
3. **Skill relevance check** — for each friction point, whether a Claude skill would (a) actually relieve it, (b) just move it, or (c) make it worse by detaching from the workbook
4. **Recommended next move** — smallest change that removes the most friction, plus an explicit call on whether skill planning should resume

## Out of scope

- No code edits
- No new features designed
- No assembler / server-side work
- No skill scaffolding
- No security/SEO sweeps

## Exit criteria

You read the findings doc and decide one of: fix friction in shepi, design the worry-driven intake, plan the assembler move, plan the skill anyway, or shelve.
