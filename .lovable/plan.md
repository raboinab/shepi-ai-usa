## Plan: P1 rewrite — `/quality-of-earnings-checklist`

Target keyword: **"quality of earnings checklist"** (vol 70/mo, KDI 9). Ship 7 on-page fixes + a static, downloadable PDF.

### File changes

**1. `src/pages/QualityOfEarningsChecklist.tsx`** — single edit, presentation-only.

- **SEO title** → `Quality of Earnings Checklist: 8-Section M&A Due Diligence Guide (2026) | Shepi`
- **Meta description** (≤160 chars, leads with keyword + verb) →
  `Free Quality of Earnings checklist covering data request, revenue, EBITDA, working capital, proof of cash & deliverables. Download the 8-section PDF.`
- **Featured-snippet intro** — new 60–80 word paragraph above §1 (under the HeroCallout/StatRow), defining what a QoE checklist is and what the 8 sections cover. Targets the "what is on a QoE checklist?" PAA.
- **"Last updated: February 2026"** line under H1 (use `publishedDate` prop on `ContentPageLayout`, matching `WorkingCapitalAnalysis.tsx` pattern).
- **5 new internal links** woven into existing section copy (no layout change):
  - §2 Revenue → `/guides/customer-concentration-risk`
  - §3 EBITDA → `/guides/owner-compensation-normalization` (alongside the existing ebitda-adjustments link)
  - §4 Working Capital → `/guides/working-capital-analysis`
  - §5 Proof of Cash → `/guides/cash-proof-analysis`
  - §8 Deliverables → `/guides/ebitda-bridge`
- **Expanded section blurbs** — add a 1–2 sentence intro paragraph above each of the 8 H2s that currently jumps straight to the list/grid (raises word count from ~600 → ~1,400, matches competitor depth).
- **Download CTA block** — new component-free section after intro: prominent button linking to `/qoe-checklist.pdf` with `download` attribute. Mirror StatRow visual weight.
- **JSON-LD** — extend existing `faqSchema` to also emit an `Article` schema (headline, datePublished `2026-02-23`, dateModified, author Shepi) like `WorkingCapitalAnalysis.tsx` does.

**2. `public/qoe-checklist.pdf`** — new static asset.

Generate one-time via a new script `scripts/generate-qoe-checklist-pdf.ts`:
- Use `reportlab`-equivalent in TS: **`pdf-lib`** (already in deps via demo-pdf script) or **`@react-pdf/renderer`** (already used in `src/components/pdf-slides/`).
- Recommended: minimal `pdf-lib` script that draws the 8 checklists as plain text + checkboxes — no React PDF runtime needed for a static handout.
- Branded header: Shepi logo (`src/assets/shepi-dog.svg` rasterized) + title + "shepi.ai/quality-of-earnings-checklist" footer on every page.
- Output ~3–4 pages, A4 + Letter compatible.
- Run script once; commit `public/qoe-checklist.pdf`. Document regen command in script header.

**3. `public/sitemap.xml`** — verify `/quality-of-earnings-checklist` entry has fresh `<lastmod>2026-02-23</lastmod>`. Update if stale.

### Out of scope (deferred)

- Changing slug/URL (keep `/quality-of-earnings-checklist`, no redirect needed).
- Other 16 pages in the queue — proceed to P2 (`/quality-of-earnings-software` reposition) only after this lands.
- STEP 4 reindex request — happens after P1–P6 all land.
- Print stylesheet (rejected in favor of static PDF).

### QA before declaring done

1. `code--view` the rewritten page; confirm all 5 internal links resolve to existing route files.
2. Generate the PDF, then convert page 1 to image with `pdftoppm` and visually inspect — confirm no clipped text, working logo, correct footer URL.
3. Confirm the page renders in preview at `/quality-of-earnings-checklist` with the new title in the tab and download button visible.

### Technical notes

- `ContentPageLayout` already accepts `publishedDate` and `jsonLd` (array form supported per `WorkingCapitalAnalysis.tsx`) — no layout changes.
- This codebase still uses React Router DOM + `useSEO`/`ContentPageLayout` for content pages (not TanStack `head()`), so SEO meta flows through the existing `seoTitle`/`seoDescription` props. Do not migrate to `head()` here.
- PDF script will live alongside `scripts/generate-demo-workbook.ts` and follow the same `bun run scripts/...` invocation convention noted in project memory.
