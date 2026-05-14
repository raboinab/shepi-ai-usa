## STEP 2 — Scored audit of the 17 un-indexed commercial pages

### Headline finding (read this first)

- **GSC, last 90 days: 0 pages on shepi.ai received any impressions.** The "17 un-indexed" framing understates the problem — the entire site is functionally invisible to Google right now. Until STEP 1 (canonical host, sitemap, removals) propagates, no rewrite ranks. This audit is the queue to execute *as* indexing comes back online.
- **Semrush: only `/guides/ebitda-adjustments` ranks at all** — position 64 for "normalizing ebitda". Everything else: zero.
- **Several existing slugs target keywords with literally 0 search volume** ("qoe software", "qoe template"). No on-page work fixes a page nobody searches for — slug/intent must change.

### The 17 pages — scored

Score logic: `volume × intent_fit ÷ difficulty`. Verdict explains what to do, not just what's wrong.

| # | Page | Best target keyword | Vol/mo | KDI | Verdict | Priority |
|---|---|---|---|---|---|---|
| 1 | /quality-of-earnings-software | qoe software | 0 | — | **REPOSITION** → "quality of earnings analysis" (390/mo, KDI 22). Keep slug, rewrite H1 + intro. | P2 |
| 2 | /quality-of-earnings-template | qoe template | 0 | — | **REPOSITION** → "quality of earnings report" (720/mo, KDI 27). Pivot from template-bait to "what a QoE report contains" + sample preview. | P3 |
| 3 | /quality-of-earnings-checklist | qoe checklist | **70** | **9** | **KEEP & REWRITE** — best ROI on the site. Apply SDE template: clear H1, downloadable list, FAQ schema, 8-12 internal links. | **P1** |
| 4 | /use-cases/accountants-cpa | qoe for accountants | 0 | — | **REPOSITION** → "white label qoe" / "qoe for cpa firms" — verify volume first via keyword_research. | P7 |
| 5 | /use-cases/lenders | qoe for lenders | 0 | — | **REPOSITION** → "sba quality of earnings" or "lender due diligence" — verify volume. | P8 |
| 6 | /use-cases/pe-firms | qoe for pe | 0 | — | **REPOSITION** → "private equity due diligence software" — verify volume. | P9 |
| 7 | /features/ebitda-automation | ebitda automation | 0 | — | **REPOSITION** → "ebitda adjustments" (210/mo, KDI 10) or "ebitda normalization" (110/mo, KDI 0). Both winnable. | **P4** |
| 8 | /guides/ai-accounting-anomaly-detection | ai accounting anomaly | — | — | **THIN — expand**. Long-tail informational; ride coattails of "ai due diligence". Keep, add depth + internal links. | P10 |
| 9 | /guides/ai-wont-do-your-qoe | (opinion piece) | — | — | **OK — link-build**. Strong POV, no kw target. Promote internally + on LinkedIn, don't rewrite. | P15 |
| 10 | /guides/due-diligence-checklist | due diligence checklist | **1,300** | **35** | **KEEP & REWRITE** — second-highest ceiling. KDI 35 is competitive but doable with depth + downloadable. SERP analysis required first. | **P5** |
| 11 | /guides/earnings-manipulation-signs | earnings manipulation | — | — | **THIN — expand**. Editorial-style topic; wins on freshness + examples. Add 3-5 case patterns. | P11 |
| 12 | /guides/ebitda-bridge | ebitda bridge | **260** | **11** | **KEEP & REWRITE** — clean kw, low difficulty, decent volume. Worked example + downloadable bridge template. | **P6** |
| 13 | /guides/financial-red-flags | financial red flags | — | — | **THIN — expand**. Listicle format; ride "financial statement red flags" long tail. | P12 |
| 14 | /guides/general-ledger-review | general ledger review | — | — | **THIN — expand**. Informational; pair with download. | P13 |
| 15 | /guides/personal-expense-detection | personal expenses business | 0 | — | **REPOSITION** → "owner personal expenses tax deductible" or similar — needs research. | P14 |
| 16 | /guides/sellers-discretionary-earnings | seller's discretionary earnings | **1,000** | **16** | **JUST REWRITTEN — request reindex only**. No further work needed; this is the SDE template that informs the others. | (already done) |
| 17 | /guides/working-capital-analysis | working capital analysis | **170** | **31** | **KEEP — light polish**. Decent kw but KDI mid. Add worked example + 5 internal links. | P16 |

### Prioritized rewrite queue (top 6 — execute in order)

1. **P1 — /quality-of-earnings-checklist** — 70/mo, KDI 9. Cleanest win on the site. Slug correct.
2. **P2 — /quality-of-earnings-software → "quality of earnings analysis"** — 390/mo, KDI 22.
3. **P3 — /quality-of-earnings-template → "quality of earnings report"** — 720/mo, KDI 27. Slug change + 301.
4. **P4 — /features/ebitda-automation → "ebitda adjustments"** — 210/mo, KDI 10. Repurpose existing page.
5. **P5 — /guides/due-diligence-checklist** — 1,300/mo, KDI 35. Highest volume, hardest fight.
6. **P6 — /guides/ebitda-bridge** — 260/mo, KDI 11. Clean win, fast.

P7–P16 are batch-2 work — most need keyword research before commit (the use-case pages especially).

### Cumulative addressable demand from the top 6

~3,480 monthly searches once these rank (today: 0). Realistic 12-month capture with proper rewrites + STEP 1 hygiene fixed: 15-25% of that = **~600-870 organic visits/month** from these six pages alone.

### What I need from you

1. **Confirm the queue order** — particularly that P5 (due diligence checklist) is worth the heavier lift before P6.
2. **Use-cases pages** — choose the path:
   - **(a)** Repurpose each into the closest real keyword (research per page, ~30 min each)
   - **(b)** Demote to nav-only / no-index, freeing crawl budget for pages that can rank

Once you confirm, I'll start P1: run `serp_analysis` on "quality of earnings checklist", read the current page, and come back with a proposed rewrite for your approval before any code changes.

### Out of scope (separate plans)

- Actual page rewrites (one plan per page, after you approve this queue)
- STEP 3 internal-linking work (depends on which pages survive STEP 2)
- STEP 4 reindex requests (last; after STEPS 1–3 land)
