
# SEO push: title fix + 3 new pages + directory submission copy

Three parallel workstreams. All visible homepage and existing-page copy stays unchanged unless explicitly listed.

## Part A — Ship the drafted title fix (Lever 1)

Apply the worktree plan at `.claude/worktrees/epic-kare/.lovable/plan.md` to main. The homepage `useSEO` title is currently "AI Quality of Earnings Software | QoE **Platform** | Shepi" — the drafted version says "QoE **Analysis** Platform". Aligning everything to the drafted strings.

1. **`index.html`** — no `<title>` or `<meta name="description">` currently live here (per-route owns them via `useSEO`). Update the static OG fallbacks only:
   - `og:title` → `AI Quality of Earnings Software | QoE Analysis Platform | Shepi`
   - `og:description` → `AI quality of earnings analysis for M&A due diligence. EBITDA adjustments, working-capital, and lender-ready QoE reports in hours. Quality of earnings AI for deal teams.`
   - `og:image:alt` mirrors the new title.
2. **`src/pages/Index.tsx`** — update `useSEO({...})`:
   - `title` → `AI Quality of Earnings Software | QoE Analysis Platform | Shepi`
   - `description` → `AI quality of earnings analysis for M&A due diligence. Upload financials, get EBITDA adjustments and lender-ready QoE reports in hours. Quality of earnings AI built for deal teams, PE firms, and searchers.`
   - SoftwareApplication JSON-LD `name` → `Shepi — AI Quality of Earnings Software`; `description` → same as above.
3. **`src/pages/features/QoESoftware.tsx`** — `seoTitle` → `Quality of Earnings AI Software | AI QoE Analysis Tool | Shepi` (58 chars); `seoDescription` rewritten to lead with "Quality of Earnings AI software" and stay 80–160 chars with terminal punctuation (to pass `src/test/seo-guides.test.ts`).
4. **`src/hooks/useSEO.tsx`** — unmount fallback title → `AI Quality of Earnings Software | QoE Analysis Platform | Shepi`.
5. **Guide test cleanup** — `src/pages/guides/CustomerConcentrationRisk.tsx` `seoTitle` is 62 chars, fails the ≤60 SEO regression test. Shorten to `Customer Concentration Risk in M&A Due Diligence | Shepi` (56 chars).
6. Delete `.claude/worktrees/epic-kare/.lovable/plan.md` (consumed).

## Part B — Three new searcher-intent pages (Lever 4)

Three new routes targeting queries we already get impressions for. Each ranks for a tight, high-intent term; existing parent pages stay live and get an internal link to the new dedicated page.

| Route | H1 | Primary keyword | Carved from |
| --- | --- | --- | --- |
| `/eta-qoe-cost` | "ETA Quality of Earnings Cost (2026)" | eta qoe cost | `/use-cases/independent-searchers` |
| `/sba-loan-qoe` | "Quality of Earnings for SBA Loans" | qoe sba lender | `/use-cases/lenders` |
| `/compare/cpa-firm-vs-shepi` | "QoE Providers for ETA Buyers: CPA Firm vs Shepi" | best qoe providers for eta | new comparison |

Each page uses the existing typographic content components (`ContentPageLayout`, `HeroCallout`, `StatRow`, `ComparisonTable`, `AccordionFAQ`, `RelatedResourceCards`) — same pattern as `src/pages/features/QoESoftware.tsx`. Standard structure:

- TOC + HeroCallout with one-sentence answer to the search query (so it can win a featured snippet)
- Cost/comparison table grounded in `PRICING` (no hardcoded numbers — import from `src/lib/pricing.ts`)
- 4–6 FAQ items rendered as visible Accordion AND emitted as FAQPage JSON-LD via `useSEO({ jsonLd })` (same dual-source pattern Index.tsx uses)
- Article + BreadcrumbList JSON-LD
- RelatedResourceCards back to the parent use-case page + 2 relevant guides
- `seoTitle` ≤60 chars ending `| Shepi`, `seoDescription` 80–160 chars ending in `.` (passes `src/test/seo-guides.test.ts` — extend the test glob to cover these new files)

Wiring:
- Register routes in `src/App.tsx` (same `wrap()` pattern around line 172/177).
- Add to the prerender list (`src/App.tsx` around line 285 and any SSG entry list).
- Add 3 entries to `public/sitemap.xml` with `priority` 0.8.
- Add an internal link from `/use-cases/independent-searchers` → `/eta-qoe-cost`, `/use-cases/lenders` → `/sba-loan-qoe`, homepage pricing/FAQ area → `/compare/cpa-firm-vs-shepi`.

Content sourcing: pull facts/numbers/phrasing from the existing parent use-case pages and `src/data/homepageFaq.ts` so we don't invent claims. Tone matches the rest of the marketing site (analytical QoE software, **not** CPA attestation — per project memory).

## Part C — Directory submission copy (no code changes)

Write `/mnt/documents/shepi-directory-submissions.md` with reusable copy blocks ready to paste into each directory's submission form:

- Vendor identity: name, tagline, website, support email, founded year, HQ, employees range
- 50-char description, 160-char description, 500-char description, 1500-char description
- Category taxonomy mapped per directory (G2: "Quality of Earnings"/"M&A Due Diligence"/"Financial Analysis"; Capterra similar; TAAFT/AI Tool Hunt: "AI for Finance"/"Accounting AI"; Product Hunt: "Productivity"/"FinTech")
- Feature bullets (8), use-case bullets (5)
- Pricing summary from `src/lib/pricing.ts`
- Screenshot shot-list (5 specific app surfaces to capture) with target dimensions per directory
- One paragraph per directory tailored to its audience (G2 reviewer-focused, Product Hunt launch-narrative, TAAFT AI-angle)
- Submission URL + account-creation notes per directory

Delivered as a `<presentation-artifact>`; the user pastes from it.

## Out of scope

- Lever 2 (Request Indexing in GSC) — manual click work in Search Console, not codeable here. We can wire the GSC connector and script `urlInspection.index.publish` later if the user wants automation.
- Lever 3 execution itself — Part C produces the *copy*; submitting to each directory is manual.
- Lever 5 (backlink outreach) — out of scope for code.

## Verification

- `bun test src/test/seo-guides.test.ts` passes (CustomerConcentrationRisk shortened; new pages conform).
- `bunx tsc --noEmit` clean.
- Manually visit `/eta-qoe-cost`, `/sba-loan-qoe`, `/compare/cpa-firm-vs-shepi` in preview: TOC works, FAQ accordion renders, internal links resolve, `<title>` matches `seoTitle`, `view-source` shows JSON-LD.
- `public/sitemap.xml` includes the 3 new URLs with `https://shepi.ai` host.
- `/mnt/documents/shepi-directory-submissions.md` exists and renders.
