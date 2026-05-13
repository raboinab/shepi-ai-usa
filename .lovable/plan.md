## The honest starting point

Per Semrush, shepi.ai currently ranks for **1 keyword** ("normalizing ebitda", position 64) and gets ~0 organic traffic. The site has been live but essentially invisible. The good news: the content depth is already there (35+ guides, features, use-case, and compare pages). The problem is **discoverability**, not content volume.

Two critical findings:

1. **"quality of earnings software" has 0 search volume.** Buyers don't search for the category we're inventing. We have to rank for the *problems* searchers already type.
2. **Real demand lives in adjacent terms** (US, monthly volume, keyword difficulty):

| Keyword | Volume | KDI | Notes |
|---|---|---|---|
| quality of earnings | 1,600 | 30 (possible) | The big one |
| quality of earnings report | 720 | 27 (easy) | Money page target |
| seller's discretionary earnings | 1,000 | 16 (easy) | SMB acquirer's #1 metric — we have no page |
| qoe report | 140 | 17 (easy) | Easy win |
| ebitda adjustments | 210 | 10 (very easy) | We rank #64 already |
| sde calculator | 70 | 5 (very easy) | Interactive tool, backlink magnet |
| buying a small business | 880 | 31 | Top-of-funnel |

## Plan: 4 workstreams

### 1. Foundation fixes (do first — unblocks indexing)

- **Submit sitemap to Google Search Console.** Verification meta tag is already deployed; finish GSC setup, submit `https://shepi.ai/sitemap.xml`, request indexing on the 8–10 highest-priority URLs.
- **Submit to Bing Webmaster Tools** (powers ChatGPT search, DuckDuckGo, Copilot).
- **Audit sitemap coverage.** Static `public/sitemap.xml` is generated from `scripts/generate-discovery.ts`. Verify every page is listed and `lastmod` is current.
- **Add JSON-LD structured data** sitewide:
  - `Organization` + `SoftwareApplication` on home
  - `FAQPage` on the homepage FAQ (already exists in `src/data/homepageFaq.ts`)
  - `Article` on every `/guides/*` page
  - `BreadcrumbList` on deep pages (hook `useBreadcrumbJsonLd` already exists — apply it consistently)
- **Internal linking pass.** Most guides are orphaned from each other. Add a "Related guides" block at the bottom of every guide (the `RelatedResourceCards` component already exists) and contextual links between related topics. This is usually the single highest-leverage move for content-rich sites with no rankings.

### 2. Re-target existing pages to keywords that actually exist

Rewrite titles, H1s, and intros only — no content changes:

| Page | New primary keyword | Volume |
|---|---|---|
| `/features/qoe-software` | "quality of earnings report" + "qoe report" | 720 + 140 |
| `/guides/quality-of-earnings` | "quality of earnings" | 1,600 |
| `/guides/qoe-report-template` | "quality of earnings report template" | long-tail |
| `/guides/ebitda-adjustments` | push existing #64 ranking with stronger internal links | 210 |
| `/quality-of-earnings-cost` | "how much does a quality of earnings cost" | long-tail high-intent |
| `/guides/sell-side-vs-buy-side-qoe` | "buy side qoe" / "sell side qoe" | bottom-funnel |

### 3. New pages to fill demand gaps

- **`/guides/sellers-discretionary-earnings`** — targets SDE (1,000/mo, easy). The SMB acquirer's #1 metric and we have no page on it.
- **`/tools/sde-calculator`** — interactive calculator. Becomes a natural backlink magnet on r/sweatystartup, BizBuySell forums, etc.
- **`/tools/ebitda-adjustments-calculator`** — same playbook applied to our existing #64 keyword.
- **`/guides/buying-a-small-business-due-diligence`** — top-of-funnel capture for the 880/mo audience; funnels into the QoE pages.
- **`/guides/sba-loan-due-diligence`** — SBA buyers are a huge slice of self-funded searchers; almost no competition.

### 4. AI answer-engine optimization (AEO)

We have `llms.txt`, `llms-full.txt`, `agent.json`, `ai-plugin.json`, `mcp.json`, `openapi.json`, `/for-ai-agents` — strong baseline. To actually get cited:

- **Expand `llms-full.txt`** to include canonical Q&A from every guide (regenerated via `scripts/generate-discovery.ts`).
- **Add an "Answer block"** to the top of every guide — 2–3 sentence direct answer, then long-form below. This is what LLMs pull into citations.
- **FAQPage schema on every guide** with 5–8 questions specific to that topic.
- **External citations.** LLMs lean on Reddit (r/SmallBusiness, r/Entrepreneur, r/sweatystartup, r/businessbroker), G2/Capterra, Hacker News. Plan: one genuinely useful post per week on those forums; never spam.
- **Submit to directories LLMs scrape**: G2, Capterra, Product Hunt, AlternativeTo, There's An AI For That.

## What I need from you to start building

1. **Canonical domain confirmation.** Sitemap and JSON-LD use `shepi.ai`. Keeping that.
2. **Google Search Console access.** Verification meta tag is already deployed. I can submit the sitemap via the GSC connector once you confirm.
3. **Green light on the new pages and tools** in workstream 3 — those are real build work (~5 pages + 2 calculators).

## Suggested order

1. **Week 1:** Workstream 1 (foundations + JSON-LD + internal links + GSC/Bing submission). High leverage, low effort, unblocks everything else.
2. **Week 2:** Workstream 2 (rewrite existing pages for real keywords). Re-uses content we already have.
3. **Weeks 3–4:** Workstream 3 (new pages + calculators). The SDE calculator is the highest-ROI single asset.
4. **Ongoing:** Workstream 4 (AEO + external citations). Compounds over months.

Realistic timeline: meaningful Google traffic in 2–4 months; AI answer-engine citations earlier (4–8 weeks) because LLMs reindex faster than Google ranks.

Approve and I'll start with workstream 1.