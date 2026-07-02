## Goal
Ship five small SEO wins across the guide corpus.

## 1. Add the three missing routes to prerender (tiny)
Add to `PRERENDER_PATHS` in `vite.config.ts`:
- `/guides/ai-wont-do-your-qoe`
- `/guides/sellers-discretionary-earnings`
- `/compare/cpa-firm-vs-shepi`

These are already in `App.tsx` routes and `sitemap.xml`, but missing from the SSG include list, so they never get static HTML. This is the highest-leverage item.

## 2. Named author + Author schema on articles (small)
- Add a real named author to guide JSON-LD. Proposal: **"Shepi Editorial Team"** as `Person`-typed author with `url: https://shepi.ai/about` and short bio, unless you want a specific human name (see question).
- Create `src/lib/seo/authors.ts` exporting the author object + bio string.
- Add a small visible byline component (`GuideByline.tsx`) rendered at the top of every guide: "By {name} · Updated {dateModified}". This satisfies E-E-A-T and matches the JSON-LD.
- Update all ~21 guides + compare pages to import and render it, and to reference the shared author object in their JSON-LD instead of the current `Organization`.

## 3. Auto dateModified (small)
Guides currently hardcode `datePublished`/`dateModified` (mostly `2026-02-21`).
- Add a build-time constant `BUILD_DATE` injected via Vite `define` in `vite.config.ts` (ISO date from `new Date()`).
- Guides keep their real `datePublished` but set `dateModified: BUILD_DATE`. Byline shows the same date.
- Result: every rebuild refreshes the freshness signal automatically. No per-guide maintenance.

## 4. Cross-link guides ↔ use-cases in body copy (small)
Add a `RelatedReading` component that renders 3-5 contextual internal links at the end of each guide (before the CTA). Curated mapping in `src/lib/seo/relatedLinks.ts` keyed by slug — each guide gets 2 sibling guides + 1-2 relevant use-case pages, and each use-case gets 2-3 guide links. Anchor text uses target-page keywords (not "click here").

## 5. Per-guide FAQ blocks in llms-full.txt (small)
Extend `scripts/generate-llms-txt.ts` (or the existing generator) to append a `## FAQ — {guide title}` section per guide, sourced from a new `faq` export in each guide file (3-5 Q&A pairs). Same FAQ powers on-page `FAQPage` JSON-LD, so we get both AI citation surface and rich results from one source of truth.

For guides that don't yet have FAQ content, this ships iteratively — the generator skips guides without a `faq` export. Initial pass: add FAQs to the 6 highest-traffic guides (quality-of-earnings, ebitda-adjustments, qoe-vs-audit, due-diligence-checklist, sellers-discretionary-earnings, ebitda-bridge).

## Technical notes
- No new dependencies.
- No route or URL changes.
- All 21 guide files touched for #2 and #3; edits are mechanical (import + one JSX line + swap two schema fields). Batched via parallel edits.
- Verify with a build; confirm the three new prerendered HTML files exist under `dist/`.

## Question before I build
Do you want the author byline to be **"Shepi Editorial Team"** (safe, no personal PII), or should it name a specific person (e.g. you)? A real named human with a bio ranks stronger for YMYL topics but requires a real `/about` bio page.
