## AI Narrative Layer for PDF Export (v1)

Mirror the QoE provider's voice (Kyle Plumbing 2023 + Artistic Kitchen & Bath 2025): tight, scannable bullets with bold-label callouts on analysis slides; multi-paragraph Observation / Recommendation prose on Attention Areas. Powered by Anthropic Claude with hard guards against number hallucination. **No management notes in v1** (added later when input UX exists). **No human review gate** — guards + analyst-editable UI are the trust mechanism.

### 1. Database

New table `project_narratives`:
- `id`, `project_id` (FK)
- `slide_key` text (`qoe`, `revenue_detail`, `working_capital`, `attention_areas`, `executive_summary`, etc.)
- `content` jsonb — `{ bullets: string[], callouts: [{label, text}], paragraphs?: [{topic, observation, recommendation?}] }`
- `source_hash` text — hash of input rawData/attentionItems (staleness flag, non-blocking)
- `model`, `generated_at`, `edited_at`, `edited_by`
- Unique on `(project_id, slide_key)`
- RLS via `has_project_access(project_id)`

### 2. Server functions

`src/server/narratives.server.ts` — Anthropic SDK call + verification guard.
`src/server/narratives.functions.ts` — `generateNarrative`, `saveNarrative`, `getNarratives`.

`generateNarrative` uses Claude (claude-sonnet) with structured tool-calling per slide type:
- **Analysis slides**: returns `{ bullets[3-5], callouts[{label,text}] }` (Kyle style)
- **Attention Areas**: returns `{ paragraphs: [{topic, observation, recommendation?}] }` (AKB style — no `driver` field since no mgmt notes)

System prompt: only reference numbers visible in `rawData`; never invent drivers or attribute claims to management; describe what the numbers show.

**Number-verification guard** (the trust mechanism):
Regex-extract every `$X`, `XK`, `XM`, `X%` from the AI output and verify each appears (with rounding tolerance) in the source `rawData` string. Strip any bullet/paragraph containing an unmatched number. If >50% stripped, retry once with a stricter prompt; if still bad, fall back to a deterministic data summary.

### 3. UI: per-slide narrative editor

`src/components/pdf-narratives/NarrativePanel.tsx`, mounted in the PDF preview/export area:
- "Generate" / "Regenerate" button per slide
- Editable bullet, callout (label + text), and paragraph fields
- Stale-source warning (non-blocking)
- Save persists to `project_narratives`

### 4. Slide rendering updates

- Extend `SlideNarrativeBox.tsx` to render bullets, bolded label callouts (label in teal, body in dark gray), and multi-paragraph prose.
- Update slides to read `data.narrative` and render via the shared box:
  - `QoESlide`, `RevenueDetailSlide`, `WorkingCapitalSlide`, `QoEExecutiveSummarySlide`, `AttentionAreasSlide` (paragraph format), plus COGS/OpEx/Cash Flow slides if present.
- `buildClientPDF` / `pdfWorker`: hydrate `data.narrative` per slide from `project_narratives` before export.

### 5. Files

**New**
- `supabase/migrations/<ts>_project_narratives.sql`
- `src/server/narratives.server.ts`
- `src/server/narratives.functions.ts`
- `src/components/pdf-narratives/NarrativePanel.tsx`

**Modified**
- `src/components/pdf-slides/shared/SlideNarrativeBox.tsx`
- 5–8 slide components above
- `src/lib/pdf/buildClientPDF.ts` (hydrate narratives)
- PDF preview page (mount `NarrativePanel`)

### Decisions locked in
- **Provider**: Anthropic Claude (`ANTHROPIC_API_KEY` already set).
- **Management notes**: deferred — schema's `content` jsonb is extensible to add a `drivers` field later without migration churn.
- **Review gate**: none. Guards = number-verification regex + tool-calling schema + analyst-editable UI.

### Out of scope (v1)
- Management notes input + driver attribution
- Industry benchmarks
- Auto-regen on data change (manual button only)
