## Goal

Stand up `/proof-of-cash` as a top-level **category landing page** so shepi owns the term head-to-head with QoEAgent. Capability already ships (ProofOfCashTab, builder, PDF slide) and the deep methodology already lives at `/guides/cash-proof-analysis` — this page is the product/category claim layer above the guide.

## Why top-level (not under /guides or /features)

QoEAgent uses "Proof of Cash AI" as their headline category. A guide at `/guides/...` competes for informational queries; a top-level money page at `/proof-of-cash` competes for category and product queries. Pattern matches existing `/quality-of-earnings-software`, `/quality-of-earnings-cost`, `/quality-of-earnings-template` — same depth, same ContentPageLayout shell.

It also fixes the existing broken in-app link from `QualityOfEarningsSoftware.tsx:70` which already points at `/proof-of-cash`.

## What to build

### New file: `src/pages/ProofOfCash.tsx`

Use `ContentPageLayout` with the same shell as `QualityOfEarningsSoftware.tsx`:

- `seoTitle`: "Proof of Cash Software — GL-to-Bank Tie-Out Automated | Shepi"
- `seoDescription`: under 160 chars, leads with "Proof of cash software that ties GL to bank statements automatically..."
- `canonical`: `https://shepi.ai/proof-of-cash`
- JSON-LD: `SoftwareApplication` + `FAQPage` (stacked, same pattern as QoE Software page)
- Breadcrumbs: `[{ label: "Proof of Cash" }]`
- `heroAccent`

Section outline (TOC drives anchors):

1. **What is proof of cash** — one-paragraph plain definition. Reframes the category in shepi's voice (GL-to-bank tie-out), then says "see the methodology guide" with a link to `/guides/cash-proof-analysis`.
2. **What shepi's proof of cash automates** — 4-up `BenefitGrid`: bank statement ingestion → GL match → exception flagging → period-tying schedule. Each item maps to something the product actually does (no roadmap claims).
3. **Software vs manual** — `ComparisonTable` (manual: 1–2 days, sampling, Excel pivots; shepi: minutes, 100% transactions, exception list with drill-through).
4. **When you need it** — `BenefitGrid` of 3 deal types: search-fund/SBA (lenders require it), PE add-on screen, sell-side prep.
5. **How it works** — `StepList`: upload bank statements + GL → automatic matching → review exceptions → export the proof-of-cash workbook tab + PDF slide.
6. **Pricing CTA** — references `PRICING.perProject.display`, mirroring other money pages.
7. **FAQ** — `AccordionFAQ` (4–5 Q&As, doubled into FAQPage JSON-LD).
8. **Related** — `RelatedResourceCards` linking to the methodology guide, QoE Software, and QoE Checklist.

No insurance/attestation/CPA-opinion language. Frame the deliverable as a workpaper/schedule — consistent with Core memory rules.

### Routing

`src/App.tsx` — add `{ path: "proof-of-cash", element: wrap(<ProofOfCash />) }` alongside the other P0 money pages (after `quality-of-earnings-template`). Lazy-import at top.

### Sitemap

`public/sitemap.xml` — add `<url><loc>https://shepi.ai/proof-of-cash</loc>...</url>` near the existing `/quality-of-earnings-software` entry. Keep `https://shepi.ai` apex per memory rule.

### Cross-links (low-risk, high-leverage)

- `src/pages/QualityOfEarningsSoftware.tsx:70` — broken link to `/proof-of-cash` becomes live automatically; no edit needed.
- `src/pages/guides/CashProofAnalysis.tsx` — add one sentence near the top linking up to `/proof-of-cash` as the product page (so the guide funnels to the category page and vice versa).
- `src/pages/Index.tsx` — in the existing FAQ / "what you get" sections that mention "proof of cash" in plain text, convert the first mention to a `<Link to="/proof-of-cash">` so the homepage feeds equity into the new URL. One link only; don't over-link.

### Out of scope (explicitly)

- No `og:image` (avoiding placeholders per head-meta guidance).
- No nav menu changes — existing footer/links surface the page once it's in the sitemap and cross-linked.
- No `/agreement-extraction` or `/contract-extraction` page — capability isn't shipped.
- No `BSDetailedTab` rework (carry-over from the prior plan).

## Verification

- Visit `/proof-of-cash` in the preview: hero renders, TOC anchors jump, FAQ accordion opens, related-card links work.
- Visit `/quality-of-earnings-software`: the in-text "proof of cash" link now resolves (was broken).
- `view-source:` the page: confirm `<title>`, `<meta name="description">`, `canonical`, `og:url`, and stacked JSON-LD all self-reference `/proof-of-cash`.
- Spot-check the new sitemap entry parses (no malformed XML).

## Technical notes

- Pure additive: one new page file, one route line, one sitemap entry, ≤3 small cross-link edits. No schema/db changes, no new dependencies.
- Uses existing `src/components/content/*` primitives (HeroCallout, StatRow, BenefitGrid, ComparisonTable, StepList, AccordionFAQ, RelatedResourceCards) and the `ContentPageLayout` shell — consistent with the typographic-SEO-page pattern in memory.
