## What GSC actually shows (pulled live from your Search Console)

Three findings explain almost the entire "Why pages aren't indexed" report.

### 1. Three live hostnames serving the same content, no canonical host

- `https://shepi.ai/` → 200 ✓
- `https://www.shepi.ai/` → 200 (NOT redirected to apex) ✗
- `https://shepi-ai-usa.lovable.app/` → 200 (NOT redirected) ✗

**Two sitemaps are submitted to GSC** — `shepi.ai/sitemap.xml` AND `www.shepi.ai/sitemap.xml`. Google indexes www and apex variants of every page, then forces itself to pick a canonical, sending the loser to the **Duplicate without canonical (1)** and **Alternate page with proper canonical (2)** buckets. The lone **Page with redirect (1)** is the same root cause.

### 2. Legacy URLs Google still has indexed that no longer exist

```text
www.shepi.ai/limit-use            14 impressions / 90d
www.shepi.ai/blog                  2
www.shepi.ai/terms-of-service      3   (now /terms)
www.shepi.ai/resources             8   (www variant)
shepi.ai/#features                14   (legacy SPA anchor)
shepi.ai/#how-it-works            14
shepi.ai/#our-story               14
shepi.ai/#contact                  2
```

Hash-anchor URLs return the homepage HTML → Google reads "duplicate of /" → **Soft 404 (7)**. Dead paths return SPA fallback or 404 → **Soft 404** + **Not found (2)**. Counts line up exactly.

### 3. 17 commercially-relevant pages have zero impressions in 90 days

Almost certainly the **Crawled-not-indexed (18)** + **Discovered-not-indexed (15)** buckets:

```text
Money pages (3):  /quality-of-earnings-software, /quality-of-earnings-template,
                  /quality-of-earnings-checklist
Use cases (3):    /use-cases/accountants-cpa, /use-cases/lenders, /use-cases/pe-firms
Features (1):     /features/ebitda-automation
Guides (10):      /guides/ai-accounting-anomaly-detection,
                  /guides/ai-wont-do-your-qoe,
                  /guides/due-diligence-checklist,
                  /guides/earnings-manipulation-signs,
                  /guides/ebitda-bridge,
                  /guides/financial-red-flags,
                  /guides/general-ledger-review,
                  /guides/personal-expense-detection,
                  /guides/sellers-discretionary-earnings  (just rewritten — needs reindex)
                  /guides/working-capital-analysis
Marketing (3):    /demo, /for-ai-agents, /scope
Legal (5):        /privacy, /terms, /cookies, /eula, /dpa  (fine to leave un-indexed)
```

Legal exclusion is correct. The 17 commercial URLs are the painful ones.

---

## The sequenced fix ("all three, in that order" — plus a STEP 4)

### STEP 1 — Kill host duplication (root cause for ~half the report)

Highest leverage. Done at DNS/hosting, not in code.

- **a.** 301 `www.shepi.ai/*` → `https://shepi.ai/$1` via Cloudflare Bulk Redirect (your repo shows Cloudflare DNS → Vercel). I'll write the exact rule + dashboard click-path.
- **b.** Set `shepi.ai` as **Primary** in Lovable Project Settings → Domains. Lovable then auto-301s the `.lovable.app` URL.
- **c.** Delete the www sitemap submission via the GSC API (one call, I have the connection).
- **d.** Submit removal requests for the 8 dead URLs in GSC → Removals (manual; API doesn't expose it).

**Expected impact:** Soft 404 (7) + Not found (2) + Page with redirect (1) + Duplicate (1) + Alternate (2) ≈ 13 of 33 problem URLs resolve once Google recrawls (2–6 weeks).

### STEP 2 — Audit the 17 un-indexed commercial pages

Read all 17 side-by-side, score each against the SDE rewrite template (bridge intent, novice framing, distinctive H1, worked example, FAQ schema). Output is one table:

```text
Page                              Verdict                     Action
/guides/ebitda-bridge             ?                           ?
/use-cases/pe-firms               ?                           ?
/quality-of-earnings-software     ?                           ?
... (17 rows)
```

Verdicts: **OK (just needs links)** / **Thin (expand)** / **Duplicative of X (reframe)** / **Wrong intent (rewrite)**. Output is a **prioritized rewrite list**; actual rewrites happen in follow-up plans, one page at a time.

### STEP 3 — Fix internal linking for orphaned pages

For each of the 17, check linkage from `/`, `/resources`, sibling guides, and main nav. Output: orphan score per page + a concrete batch of internal-link additions, then implement them in one PR.

### STEP 4 — Re-request indexing

After STEPS 1–3 ship, manually request indexing on the 17 commercial pages via GSC URL Inspection (10/day quota).

---

## Why this order

Rewriting 17 pages while three hostnames compete for canonical wastes the work. STEP 1 = hygiene. STEP 2 = uniqueness. STEP 3 = link equity. STEP 4 = nudge Google. Out of order, each step is partly wasted.

## Out of scope

- Actual page rewrites (separate plans, one per page, after the audit)
- Migrating canonical away from shepi.ai
- Touching `/dashboard`, `/auth` (correct `noindex`)
- New content (STEP 2 may surface gaps, addressed separately)

---

## Two confirmations before STEP 1

1. **Cloudflare access** — ready? If yes, I'll write the exact Bulk Redirect rule + click-path.
2. **shepi-ai-usa.lovable.app** — 301 to shepi.ai (recommended) or keep reachable as a preview URL?
