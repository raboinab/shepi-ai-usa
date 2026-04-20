

## What's actually wrong

The user's described files (`HeadProvider.tsx`, `__SSR_HEAD__`, `onPageRendered`) no longer exist in this codebase — that cleanup already happened. But the symptom is real: prerendered HTML for all 4 P0 pages still shows the bootstrap `<title>` from `index.html`.

The root cause is a **duplicate `useSEO` module**:

- `src/hooks/useSEO.tsx` — correct version. Renders `<Head>` from `vite-react-ssg` (react-helmet-async). Tags get serialized into prerendered HTML.
- `src/hooks/useSEO.ts` — broken version. Mutates `document.head` inside `useEffect`. `useEffect` does NOT run during SSG prerender, so it produces zero head tags in the static HTML.

Vite/TypeScript module resolution prefers `.ts` over `.tsx` when an import has no extension. Every `import { useSEO } from "@/hooks/useSEO"` in the project (17 files including `ContentPageLayout.tsx`, which all 4 P0 pages use) resolves to the `.ts` file. So during prerender, no head tags are emitted, and the bootstrap title in `index.html` survives unchanged for every static page.

## The fix

**Single change: delete `src/hooks/useSEO.ts`.**

That makes the import resolve to `useSEO.tsx`, which already:
- Exports a `useSEO()` shim returning `<SEO {...props} />`
- Renders `<Head>` from `vite-react-ssg` so tags are collected during prerender and written into the static HTML for each route

All 17 call sites already capture the return value as `__seoTags` and render `{__seoTags}` (verified across `ContentPageLayout`, `Index`, `Pricing`, `Auth`, all legal pages, etc.) — except `PaymentSuccess.tsx` line 11, which doesn't capture the return value. That page is `noindex` and not in the prerender list, so it doesn't affect SEO, but I'll fix it for consistency.

## Why this matches the GSC symptoms

Once `.ts` is gone:
- Each P0 page's `<ContentPageLayout seoTitle="..." seoDescription="..." canonical="...">` flows into `useSEO.tsx` → `<Head>` → vite-react-ssg's helmet integration writes unique `<title>`, `<meta description>`, `<link rel=canonical>`, OG, and Twitter tags into `dist/quality-of-earnings-{cost,software,template,checklist}/index.html`.
- Google's duplicate-suppression unsticks because each URL's raw HTML now has distinct title + description + canonical.

## Files changed

1. **Delete** `src/hooks/useSEO.ts`
2. **Edit** `src/pages/PaymentSuccess.tsx` — capture and render `{__seoTags}` like every other page (one-line consistency fix; doesn't affect P0 SEO)

That's it. No vite.config changes, no main.tsx changes, no provider changes — those are already correct in this codebase.

## Local verification (matches the user's curl test)

```bash
bun run build
for p in cost software template checklist; do
  echo "--- /$p ---"
  grep -oE '<title>[^<]*</title>' dist/quality-of-earnings-$p/index.html | head -1
  grep -oE '<meta name="description" content="[^"]*"' dist/quality-of-earnings-$p/index.html | head -1
  grep -oE '<link rel="canonical" href="[^"]*"' dist/quality-of-earnings-$p/index.html | head -1
done
```

Expected: each page shows its own `seoTitle`, `seoDescription`, and `canonical` from its `ContentPageLayout` props (e.g. `Quality of Earnings Cost in 2026 — Cut QoE Cost by 80% | Shepi`). If any page still shows the bootstrap title, the prerender isn't picking up `<Head>` and we investigate vite-react-ssg's helmet wiring next.

## On the separate /checklist GSC question

Yes — clicking "Request Indexing" in GSC for `/checklist` is safe to do right now in parallel. It's purely a crawl-queue nudge and doesn't depend on the deploy. But Google will only re-evaluate uniqueness on its next crawl, so requesting it before the fix ships risks Google re-confirming the duplicate. Recommended order: ship the fix → curl-verify titles are unique → then Request Indexing on `/template` and `/checklist`.

