## PDF QA Pass

One focused loop on the production PDF builder. No new features.

### Steps

1. **Regenerate demo PDF** — run `bun run scripts/generate-demo-pdf.ts` so the on-disk file reflects the latest `pdfWorker.ts` + `exportNormalize.ts` changes (EBITDA bridge, seasonality, business overview, traceability prose).

2. **Rasterize every page** — `pdftoppm -r 120 public/demo/acme-sample-qoe.pdf /tmp/qa/page` and view each PNG. Check the full deck, not just page 1.

3. **Fix what I find.** Likely candidates:
   - Traceability prose: bold-label offsets, wrap math, paragraph spacing
   - EBITDA bridge: long adjustment titles colliding with number columns, totals foot
   - Seasonality: bar scaling, axis labels, empty-state when <6 months
   - Business overview: suppress empty section headers (risks, growth drivers)
   - Footer/page numbers consistent across new pages

4. **Re-regenerate + re-inspect** until clean.

5. **Done** — short report of what was checked and what was fixed. Stop touching the PDF after this unless a real user reports something.

### Scope guardrails

- Production builder only (`src/lib/pdf/pdfWorker.ts`). Demo PDF is just the QA fixture.
- No new sections, no copy rewrites, no data-pipeline changes.
- Time budget: ~one loop. If a fix balloons, I'll surface it instead of grinding.
