# Resolve SEO findings (shepi.ai is the correct domain)

## Decision

Keep sitemap and robots pointing at `https://shepi.ai`. The two failing findings (`http:robots`, `http:sitemap`) are false positives — the SEO scanner only knows about the lovable preview host and doesn't know shepi.ai is the published custom domain.

## Action

Mark both findings as fixed via `seo_chat--update_findings` with an explanation noting that shepi.ai is the intentional production domain and matches every canonical/og:url across the codebase. No file changes.

## Save a project memory

Add a Core memory rule so future scans don't loop on this:

> Production domain is `https://shepi.ai` (apex, no www). All canonicals, og:url, sitemap.xml, and robots.txt Sitemap directive must use shepi.ai — not the lovable preview host. SEO findings flagging shepi.ai as "wrong domain" are false positives; mark them fixed.

## Out of scope

- No edits to `public/sitemap.xml` or `public/robots.txt`.
- No edits to `useSEO` defaults or per-page canonicals.
- No www variant.
