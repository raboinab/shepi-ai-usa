
# Plan: Make accuracy a front-door positioning pillar

## The argument we're making

A human doing QoE in Excel **will** make errors. Not might — will. Broken references, sign flips, fat-finger transpositions, formula drift when a row gets inserted, copy/paste between tabs that silently drops a number. shepi removes that surface area: data flows from source → structured ledger → adjustments → outputs without a human retyping numbers, and every computation is the same deterministic formula every time. That is a real, defensible, differentiating claim.

What we will **not** claim:
- "The computer is never wrong" (warranty exposure, contradicts Terms)
- "Error-free QoE" or "guaranteed accuracy" (UPL/E&O risk, collides with the core memory rule that shepi is analytical software, not attestation)
- Anything implying outputs don't need human review (contradicts DFY review value prop and the AI-assist FAQ)

Safe, sharp framing we *will* use: **"No retyping. No broken formulas. Same math, every time."** Plus the concrete failure modes Excel/manual workflows have that shepi structurally prevents.

## What ships

### 1. New page: `/accuracy` (a.k.a. "Why shepi is more accurate than a human in Excel")
Full content page, in the SEO content-page pattern (uses `ContentPageLayout`, `HeroCallout`, `ComparisonTable`, `BenefitGrid`, `StepList`, `AccordionFAQ`, `RelatedResourceCards`). Sections:

- **Hero callout**: "A spreadsheet trusts whoever typed last. shepi doesn't."
- **The human-error surface in a manual QoE** — concrete list: broken cell refs, inserted-row formula drift, sign convention flips, tab-to-tab copy/paste, manual reclass entries, period misalignment, hand-keyed bank tie-outs.
- **What shepi removes structurally** — source-doc → parsed ledger (no retype), one canonical chart-of-accounts mapping, deterministic adjustment engine (same inputs → same outputs every run), single source of truth feeding workbook + PDF + dashboards (no export drift), full audit trail on every number.
- **Comparison table**: failure mode × Excel/manual × shepi DIY × shepi DFY.
- **Where humans still belong** — judgment calls (which adjustments qualify, normalization assumptions, narrative). DFY adds a licensed CPA reviewing those judgments. Frames human-in-the-loop as a feature, not a hedge.
- **FAQ**: "Does shepi guarantee accuracy?" (No — and here's the honest reason), "What about the AI?" (AI suggests, humans approve, math is deterministic), "Is this an audit?" (No — link to /scope).
- **JSON-LD Article**, canonical `https://shepi.ai/accuracy`, breadcrumbs, related-resource cards to `/compare/shepi-vs-excel`, `/compare/ai-qoe-vs-traditional`, `/guides/quality-of-earnings`, `/pricing`.

### 2. Homepage: add an "Accuracy" section
Inline section on `Index.tsx` using the existing bg-background/bg-secondary alternation + serif heading + eyebrow pattern (per memory). Three-bullet structure:
- No retyping — data flows from source documents into the model
- No broken formulas — deterministic engine, same math every time
- One source of truth — workbook, PDF, dashboards all read the same numbers

CTA → `/accuracy`.

### 3. Strengthen `/compare/shepi-vs-excel`
Reframe the existing Excel comparison around the same error-surface argument and link to `/accuracy` as the deeper read. Keep current structure, sharpen the copy.

### 4. Routing + SEO plumbing
- Add `/accuracy` to `src/App.tsx`
- Add to `PRERENDER_PATHS` (so it static-renders for crawlers)
- Add to `public/sitemap.xml` with `lastmod` today
- SEO title under 60 chars, meta description under 160 chars, single H1, JSON-LD Article schema

### 5. Light nav surfacing
Add "Accuracy" as a link in the resources/footer nav so it's reachable without search.

## Out of scope (deliberately)

- Any "guarantee," "error-free," "100% accurate," "computer is never wrong" language — flagged and rejected upfront.
- Touching Terms, /scope, or the AI-Won't-Do-Your-QoE guide. Those exist precisely to keep us legally clean and are doing their job.
- Removing the DFY CPA-review value prop. Accuracy positioning *strengthens* DFY ("the math is deterministic; a CPA reviews the judgment calls").
- Backend/wizard/workbook code changes. This is positioning + presentation only.

## Files to be touched

- **New**: `src/pages/Accuracy.tsx`
- **Edit**: `src/App.tsx` (route + PRERENDER_PATHS), `public/sitemap.xml`, `src/pages/Index.tsx` (new section), `src/pages/compare/ShepiVsExcel.tsx` (sharpen copy + cross-link), nav/footer component (add link)

## Success criteria

- `/accuracy` live, prerendered, in sitemap, indexable
- Homepage has a visible Accuracy section above the fold of the mid-page scroll
- ShepiVsExcel cross-links to /accuracy
- No language anywhere implies warranty, attestation, or "error-free" outputs
- Build passes, no broken links
