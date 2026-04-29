## Context — what the audit is actually telling us

The Robauto AI Signal scan ran against the **currently deployed** version of `https://shepi.ai/`, which is stale. Two independent signals confirm this:

1. The audit reports a 63-char title and 205-char description — the older copy. Our codebase (`src/pages/Index.tsx`) already uses the shorter, optimized version.
2. `curl https://shepi.ai/` returns a static `<title>` and `<meta name="description">` from a previous `index.html`. The current `index.html` no longer has either — they were intentionally removed so per-page `useSEO` can own them. The live HTML also has **no canonical, no og:title, no og:description, no twitter:* tags** — yet our `useSEO` hook emits all of those, and every page (including `Index.tsx`) renders the returned tags via `{__seoTags}`. So the code is right; the deployment is old.

A fresh Vercel/Lovable rebuild will fix: title length, description length, missing canonical, missing OG, missing Twitter Card. That alone moves P1 substantially.

The remaining P1 gaps the audit flagged are real and need new work:
- **JSON-LD / Schema.org** structured data (Organization + SoftwareApplication on `/`, Article on guides)
- **`/llms.txt`** (and optionally `llms-full.txt`)
- **`/.well-known/security.txt`**
- **`/.well-known/ai-plugin.json`** (low value, but cheap)

The `llms.txt` and structured data are the highest-leverage items for AI engine recognition (ChatGPT/Gemini "No" recognition).

## Plan

### Step 1 — Force a fresh deploy (unblocks 5 of 7 audit fixes)
Empty commit `chore: trigger rebuild for SEO meta` to force Vercel/Lovable to redeploy the latest prerendered HTML. After this, re-running the audit should show: correct shorter title, correct shorter description, canonical present, OG tags present, Twitter Card present.

### Step 2 — Add `public/llms.txt`
Create a Markdown-style `llms.txt` following the [llmstxt.org](https://llmstxt.org) spec. Sections:
- **shepi** (one-paragraph identity: AI-assisted QoE for SMB M&A; analyst-in-the-loop, not push-button)
- **Core capabilities** (financial normalization, EBITDA add-backs, lender-ready QoE export)
- **Who we serve** (independent searchers, lower-middle-market PE, CPA firms, lenders)
- **Key resources** (links to top guides: `/guides/can-ai-replace-qoe`, `/guides/ai-wont-do-your-qoe`, `/guides/ebitda-adjustments`, `/use-cases/independent-searchers`, `/quality-of-earnings-cost`)
- **What we are not** (not a replacement for a CPA's professional opinion; not auditor-signed)

### Step 3 — Add `public/.well-known/security.txt`
Standard RFC 9116 format: `Contact: mailto:security@shepi.ai`, `Expires: 2027-01-01T00:00:00Z`, `Preferred-Languages: en`, `Canonical: https://shepi.ai/.well-known/security.txt`. Use the project's actual security inbox if one exists; otherwise `support@` or `hello@` — confirm during build.

### Step 4 — Add JSON-LD structured data
Inject site-wide `Organization` + `WebSite` JSON-LD into `index.html` (static, identical for every page). Inject per-page schema via `useSEO` extension:
- Homepage: add `SoftwareApplication` schema (name, description, applicationCategory: "BusinessApplication", offers, aggregateRating only if we actually have reviews — skip if not).
- Guide pages (via `ContentPageLayout`): add `Article` / `TechArticle` schema with `headline`, `datePublished`, `author: { "@type": "Organization", "name": "shepi" }`.

Implementation: extend `SEOProps` with optional `jsonLd?: object | object[]`, and render `<script type="application/ld+json">{JSON.stringify(...)}</script>` inside the `SEO` component (React 19 hoists scripts in `<head>` too when typed as `application/ld+json`). Verify hoisting works in our prerender; if not, fall back to injecting JSON-LD at prerender time via a small wrapper. Wire it into `Index.tsx`, `ContentPageLayout.tsx`, and `Pricing.tsx`.

### Step 5 — Add `public/.well-known/ai-plugin.json` (low priority, fast)
Minimal manifest pointing to a future `/openapi.yaml` or just a description-only entry. Include `name_for_human: "shepi"`, `name_for_model: "shepi_qoe"`, `description_for_model`, `contact_email`, `legal_info_url: "/terms"`, `logo_url`. We won't actually expose tools yet — this is a discoverability beacon.

### Step 6 — Re-run the audit
After the rebuild + new files ship, re-scan `shepi.ai`. Expected P1 score: 49 → ~85+. The remaining gap will be "AI Recognition" (ChatGPT/Gemini training cutoffs), which only time + citations can fix.

## What we are NOT doing

- **Robauto pixel**: That's their tracking install — only worth adding if you actually want to use their P2-P5 dashboard. Skipping unless you confirm.
- **Aggregate review schema**: We don't have public reviews. Faking schema is a manual-action risk with Google.
- **Adding back static `<title>` to `index.html`**: That would re-create the duplicate-title bug we already fixed.

## Technical details

**Files created:**
- `public/llms.txt`
- `public/.well-known/security.txt`
- `public/.well-known/ai-plugin.json`

**Files modified:**
- `src/hooks/useSEO.tsx` — add optional `jsonLd` prop, emit `<script type="application/ld+json">`
- `src/pages/Index.tsx` — pass `SoftwareApplication` JSON-LD
- `src/components/ContentPageLayout.tsx` — pass `Article` JSON-LD derived from page props
- `index.html` — add static `Organization` + `WebSite` JSON-LD `<script>` block in `<head>`

**Verification after deploy:**
```
curl -s https://shepi.ai/ | grep -E 'canonical|og:title|application/ld'
curl -s https://shepi.ai/llms.txt | head
curl -s https://shepi.ai/.well-known/security.txt
```
All three should return populated content.

Approve to implement.