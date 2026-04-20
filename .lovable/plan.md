
## Goal

Improve how the PDF presents adjustments, findings, and risk items so it reads like an executive deliverable instead of a truncated data dump.

## What will change

### 1. Redesign the “Key Findings / Attention Areas” slide
Replace the current dense card list with a cleaner executive-summary format that emphasizes:
- finding title
- adjustment direction / impact
- short plain-English rationale
- next step / diligence follow-up
- consistent priority indicator

This will make the page look much closer to the style in your screenshot and less like compressed raw system output.

### 2. Improve the DD Adjustments slide
Refactor the current table-heavy slide so adjustments are easier to scan:
- shorten columns to the most decision-relevant fields
- surface amount and adjustment type more prominently
- reduce reliance on long truncated descriptions
- group similar adjustments more clearly
- add a cleaner summary at the top or bottom

### 3. Clean the source content before rendering
The current export pipeline is feeding the PDF a mix of:
- hypotheses
- WIP findings
- adjustment proposals
- raw adjustment descriptions

That is producing awkward titles, repetitive rationale, and generic follow-up text. I’ll tighten the shaping logic so each exported item has a deliberate structure:
- headline
- optional amount / impact
- “why it matters”
- “what to verify next”

### 4. Keep both PDF engines visually aligned
There are two parallel PDF implementations in this project:
- React slide components used for client-side PDF generation
- pdf-lib layout code used in shared/server export paths

Both need to be updated so the new adjustment presentation is consistent everywhere.

## Files to update

### Content shaping / export payload
- `src/components/wizard/sections/ExportCenterSection.tsx`
  - refine how `attentionItems` are built
  - refine how `ddAdjustments` are enriched and summarized

### Client slide rendering
- `src/components/pdf-slides/AttentionAreasSlide.tsx`
- `src/components/pdf-slides/DDAdjustmentsSlide.tsx`
- `src/components/pdf-slides/shared/SlideTable.tsx` if table behavior/styling needs light support changes

### Shared/server PDF renderer
- `src/lib/pdf/pdfWorker.ts`
- `supabase/functions/_shared/pdf-builder.ts`

### Optional supporting types only if needed
- `src/lib/pdf/reportTypes.ts`

## Recommended layout direction

### Attention Areas page
Use a more executive-card style:
```text
[Priority stripe]  Finding title                    Impact / label
                  One short rationale line
                  Verification / follow-up action
```

Improvements:
- more whitespace
- stronger hierarchy
- less text per card
- severity and impact treated as metadata, not buried in prose

### DD Adjustments page
Likely switch from a wide dense table to one of these:
1. compact “ranked adjustments” list with amount badges, or
2. a simplified 4-column table plus a narrative summary band

Preferred structure:
```text
Adjustment title      Type / block      Amount
Short reason / support note
```

This will make the adjustment section feel more like deal commentary than spreadsheet export.

## Technical details

### Current issues found
- `AttentionAreasSlide.tsx` renders two-column mini cards with tight truncation.
- `pdfWorker.ts` and `pdf-builder.ts` render older fixed-height cards that clip nuance and flatten hierarchy.
- `DDAdjustmentsSlide.tsx` still pushes too much detail into a single compact table.
- `ExportCenterSection.tsx` assembles attention items from multiple sources with generic fallback rationale and follow-up copy, which makes the output feel repetitive and mechanical.

### Implementation approach
- introduce normalization helpers for exported findings/adjustments
- add clearer display labels for block, severity, and impact
- limit each item to one concise rationale line and one explicit next-step line
- rank items so the most important ones appear first
- ensure long descriptions degrade gracefully instead of awkward hard truncation

## Acceptance criteria

- The “Key Findings / Attention Areas” page reads cleanly at a glance.
- Adjustment cards no longer feel cramped or overly truncated.
- DD adjustments are understandable without reading every description.
- Amounts and risk priority are visually obvious.
- The same improved structure appears in both client-side and shared/server PDF generation paths.
- No schema changes or data migrations are needed.

## Deliverable after implementation

A revised PDF export with:
- cleaner executive-summary findings page
- improved adjustment presentation
- better narrative shaping from underlying data
- matched formatting across the project’s two PDF renderers
