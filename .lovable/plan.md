
# Two new resource pages + searcher page expansion

Three deliverables in one loop, all using existing `ContentPageLayout` (so they inherit working SEO automatically — no infra work needed). Targets the actual long-tail queries surfacing in GSC plus the credibility-building manifesto angle.

## A. New guide: "AI Won't Do Your Quality of Earnings Analysis For You"

A founder-voice manifesto piece that builds credibility by underpromising. Companion to the existing `CanAIReplaceQoE` (balanced overview).

### Title & meta
- **H1**: "AI Won't Do Your Quality of Earnings Analysis For You — But It Can Make You Much Better At It"
- **seoTitle**: "AI Won't Do Your QoE Analysis (And Why That's the Point) | Shepi"
- **seoDescription**: Honest take from an AI QoE company on what AI can and can't do in financial due diligence — and why "AI-assisted" beats "AI-generated" every time.
- **canonical**: `https://shepi.ai/guides/ai-wont-do-your-qoe`
- **publishedDate**: April 2026

### Content sections
1. **The promise and the misconception** — AI is changing FDD, but QoE is a judgment exercise, not a spreadsheet exercise.
2. **What AI can do well** (`BenefitGrid`) — ingest messy exports, scan full GL population, surface anomalies, draft adjustment support, build structured schedules.
3. **What AI cannot do for you** (`BenefitGrid`) — judge addback validity, assess credibility of explanations, conduct management interviews, take responsibility for the conclusion. Key line: "QoE is about supporting a deal decision — and there's nobody to sue when the AI is wrong."
4. **AI-generated vs AI-assisted** (`ComparisonTable`) — Who owns the conclusion / Who reviews adjustments / Who handles management Q&A / Who signs / Defensibility.
5. **The better model: analyst-in-the-loop** — Full population review instead of sampling. Concrete examples drawn from product (adjustment tracing, GL→bank reconcile, anomaly surfacing) framed as "what the analyst gets to start from."
6. **Who this matters most for** — Searchers, independent sponsors, SBA buyers, lower-middle-market deal teams, lenders.
7. **Conclusion + positioning** — "Shepi is not 'AI does QoE.' Shepi is 'AI gives every buyer a structured diligence workflow that used to require a full transaction advisory team.'"
8. **FAQ** (`AccordionFAQ`) — Can I use Shepi without a CPA? / Will lenders accept an AI-assisted QoE? / What's the difference between AI-generated and AI-assisted? / Does this replace my QoE provider? / What if the AI is wrong about an adjustment?
9. **Related resources** (`RelatedResourceCards`) — link to `CanAIReplaceQoE`, `EBITDAAdjustments`, `GeneralLedgerReview`, `DueDiligenceChecklist`, `/use-cases/independent-searchers`, `/use-cases/lenders`.

### Files
- **New**: `src/pages/guides/AIWontDoYourQoE.tsx` (modeled on `CanAIReplaceQoE.tsx` structure)
- **Edit**: `src/App.tsx` — register `/guides/ai-wont-do-your-qoe` route alongside other guide routes
- **Edit**: `src/pages/Resources.tsx` — add to Educational Guides section at the top of the list
- **Edit**: `src/pages/guides/CanAIReplaceQoE.tsx` — add a single callout near the top: "Want the shorter, opinionated take? Read AI Won't Do Your QoE Analysis For You."
- **Edit**: `public/sitemap.xml` if guides are listed individually (will check pattern first)

## B. Expand `/use-cases/independent-searchers`

Currently ranks position 8-9 on long-tail searcher queries with 24 impressions. Page is structurally fine but thin. Goal: push to page 1 by adding depth on the exact queries already showing impressions.

### Sections to add
- **"The Searcher's QoE Checklist"** (`StepList`) — SBA-specific addback rules, seller-financing diligence requirements, working capital peg conventions for sub-$5M deals, customer concentration thresholds that kill SBA loans, owner-comp normalization for searchers (replacement-CFO benchmark by industry/size).
- **"Search Fund vs Independent Searcher: QoE Differences"** — Self-funded searchers vs traditional search fund LP-backed searchers have different diligence needs. Brief framing block.
- **"What SBA Lenders Actually Want to See"** — Pulls from real SBA 7(a) underwriting requirements: 3-year cash flow coverage, debt service coverage ratio (DSCR ≥ 1.25x), historical owner-comp normalization, customer concentration disclosure.
- **Expanded FAQ** targeting these long-tails: "Do search funds need a QoE?" / "What does an SBA QoE cost?" / "Can I do my own QoE as a searcher?" / "Is a sell-side QoE enough or do I need my own buy-side?" / "How long does QoE take for a search fund deal?"
- **Comparison block** (`ComparisonTable`) — Full QoE firm ($25-60K, 4-8 weeks) vs AI-assisted with Shepi (existing PRICING value, days) — across rows: Cost, Timeline, Population review, Lender acceptance, Best for.
- **Cross-link to the new "AI Won't Do Your QoE" guide** in the existing "When You Still Need a CPA" section.

### TOC additions
After existing items, add: "SBA Requirements", "Searcher Checklist", and ensure new FAQ items appear in the existing FAQ section.

### Files
- **Edit**: `src/pages/use-cases/IndependentSearchers.tsx` — append new sections, expand FAQ, add cross-link
- No new components, no new routes.

## C. (Optional, light) Companion update to `CanAIReplaceQoE`

One-line cross-link callout near the top pointing to the new manifesto piece. That's it — keep the balanced piece intact for users searching neutral terms.

## Out of scope (explicit)

- No SEO infra changes — `ContentPageLayout` already handles `useSEO` for all three deliverables.
- No new shared components.
- No changes to navigation/header.
- No changes to the 19 "BROKEN" auth-only pages (admin, account, demos) — they shouldn't be indexed anyway and a future cleanup pass can add `noindex` if desired.
- Vercel deployment trigger — user's manual action, outside Lovable sandbox.
- GSC indexing requests — user's manual action.
- GA4 Singapore filter — user's manual action.

## Acceptance check

- New `/guides/ai-wont-do-your-qoe` route loads, has unique title/description/canonical (verify via curl after Vercel deploys).
- `/resources` lists the new guide at the top of Educational Guides.
- `CanAIReplaceQoE` has the cross-link callout.
- `/use-cases/independent-searchers` has 4 new content sections, expanded FAQ, and SBA-specific content matching the long-tail queries currently surfacing in GSC.
- All three pages inherit working per-page SEO via `ContentPageLayout` (no manual `useSEO` wiring needed).
- Build passes, no TS errors.
