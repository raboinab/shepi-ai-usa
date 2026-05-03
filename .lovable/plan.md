## Goal

Close the biggest revenue leaks on the marketing site:
1. **Done-For-You is invisible** (only a contact-form dropdown today).
2. **Buyers can't tell what they're actually buying** — deliverables and boundaries are scattered across subpages.

Fix both with a homepage Scope-of-Work section + a dedicated `/scope` page formatted like a real QoE Statement of Work.

## What we'll build

### 1. New page: `src/pages/ScopeOfWork.tsx`

Wrapped in `ContentPageLayout` (same pattern as `QualityOfEarningsCost.tsx`). Nine sections in formal SOW order:

1. **Engagement Overview** — 1–2 paragraphs framing Shepi as data-intensive QoE work, not attestation.
2. **Inputs Required** — three columns (Required / Recommended / Optional), mirroring the "What You'll Need" markup already on the homepage.
3. **Procedures Performed** — `StepList`: 100% GL coverage, anomaly/red-flag detection, owner-comp normalization, personal-expense detection, customer/vendor concentration, working-capital build, proof of cash from bank statements, AI-suggested EBITDA adjustments (every adjustment human-reviewed).
4. **Deliverables** — `BenefitGrid` mapping the 27-tab workbook: Executive Summary, EBITDA Bridge, Revenue Quality, Working Capital, Proof of Cash, GL Findings, Customer/Vendor Concentration, Audit Trail, plus PDF + Excel export.
5. **Out of Scope** — `BenefitGrid` with negative-framed items: no CPA attestation/opinion, no valuation, no legal/tax advice, no replacement of fairness opinion or formal audit. Wording mirrors the existing Pricing FAQ.
6. **DIY vs Done-For-You** — `ComparisonTable` with rows: Who runs the analysis, Turnaround, CPA review, Onboarding, Ideal for, Pricing reference. Tier facts pulled from `Pricing.tsx`.
7. **Timeline & Cost** — `StatRow`: "2–4 hours vs 4–8 weeks", "$2K vs $20K–$100K".
8. **Pricing** — short paragraph + button to `/pricing`.
9. **Related resources** — `RelatedResourceCards` linking `/quality-of-earnings-cost`, `/compare/shepi-vs-excel`, `/quality-of-earnings-checklist`, `/quality-of-earnings-software`.

SEO via existing `useSEO` hook: title "Statement of Work | Shepi QoE", description summarizing engagement scope.

### 2. Wire the route in `src/App.tsx`

- Lazy import grouped with the other P0 pages (~line 66–70).
- Route `{ path: "scope", element: wrap(<ScopeOfWork />) }` (~line 191).
- Add `/scope` to `prerenderPaths` (~line 283) so vite-react-ssg statically prerenders it.

### 3. Homepage section in `src/pages/Index.tsx`

Insert between the closing `</section>` of Features (~line 656) and the opening of "How It Works" (~line 659). Use the existing inline section pattern (bg alternation, `max-w-6xl`, serif heading, eyebrow label) — **not** the typographic `content/` components, which would clash visually.

Anatomy:
- Eyebrow: **Engagement** · H2: **Scope of Work**
- Subhead: "What we're engaged to deliver, in the format you'd see from a traditional QoE firm."
- Three-column grid:
  - **Deliverables** (left, primary weight) — bulleted list of 9 deliverables. Caption: "Delivered as a 27-tab workbook."
  - **Procedures Performed** (middle) — 5–6 condensed bullets.
  - **Out of Scope** (right) — 4 negative-framed bullets, muted color / distinct icon.
- **DIY vs DFY strip** below the grid — two parallel cards (Self-Service / Done-For-You), 3–4 bullets each, CTA button each. **This single change closes the biggest revenue gap.**
- Footer CTAs: "View full Statement of Work →" → `/scope`, secondary "See pricing →" → `/pricing`.

Reuse icons already imported in `Index.tsx` (`CheckCircle`, `FileText`, `Layers`, etc.) — no new dependencies.

### 4. Homepage FAQ addition

Add one item to the existing accordion (~Index.tsx:774–795): **"What's the difference between Self-Service and Done-For-You?"** — short answer + link to `/scope#diy-vs-dfy`.

## Files

| Action | Path |
|---|---|
| Create | `src/pages/ScopeOfWork.tsx` |
| Modify | `src/App.tsx` (lazy import, route, prerender path) |
| Modify | `src/pages/Index.tsx` (new section + FAQ item) |

Reused (no changes): `ContentPageLayout`, `StepList`, `BenefitGrid`, `ComparisonTable`, `StatRow`, `RelatedResourceCards`, `useSEO`.

## Verification

- Dev: `/` shows the new section between Features and How It Works; "View full Statement of Work →" navigates to `/scope`; all 9 sections render; new FAQ expands.
- Build: succeeds; `dist/scope/index.html` exists and contains SOW headings; `dist/index.html` contains the new homepage section text.
- SEO: view-source on `/scope` shows the new `<title>` and `<meta name="description">`.
- Responsive: `/` and `/scope` look correct at desktop, tablet, mobile.

## Out of scope for this change

- No pricing changes.
- No new icon libraries or design tokens.
- No copy changes to existing Features or How-It-Works sections (separate pass if needed).
