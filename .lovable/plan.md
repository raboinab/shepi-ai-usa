## Problem

Publishing fails with "Website info could not be saved." The Lovable publish flow reads the site title and meta description from `index.html`'s `<head>` when saving website info. Our `index.html` intentionally omits both `<title>` and `<meta name="description">` (see the comment block around lines 73–83) so `useSEO()` can inject per-route metadata via React 19's native document metadata. With nothing to read at publish time, the "save website info" step errors and blocks the deploy.

## Fix

Add a minimal, site-wide default `<title>` and `<meta name="description">` (plus matching `og:title` / `og:description` / `twitter:card`) to `index.html`. `useSEO()` will still override these per route at runtime and in the prerendered per-route HTML, so SEO behavior is unchanged — but the publish flow now has valid defaults to persist.

### Values

- Title: `Shepi — AI Quality of Earnings Software for SMB M&A` (≤ 60 chars)
- Description: `AI-assisted Quality of Earnings analysis for SMB M&A due diligence. Built for independent searchers, lower-middle-market PE, CPA firms, and SBA lenders.` (≤ 160 chars)

### Edits

1. `index.html` — inside `<head>`, add:
   - `<title>` with the value above
   - `<meta name="description">`
   - `<meta property="og:title">`, `<meta property="og:description">`
   - `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title">`, `<meta name="twitter:description">`
2. Update the existing HTML comment (lines 73–83) to note these are site-wide *defaults* overridden per route by `useSEO()`, so future editors don't strip them again.

### Verify

- Retry Publish; the "Website info could not be saved" error should be gone.
- Spot-check a couple of routes in the preview to confirm `useSEO()` still overrides `<title>` (e.g. `/guides/ebitda-adjustments` should not show the default title).

## Not doing

- No changes to `useSEO()`, per-page metadata, or the SEO test suite.
- No DNS / custom-domain work (separate follow-up once publish succeeds).
