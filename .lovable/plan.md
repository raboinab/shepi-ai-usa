## Pushback on the user's diagnosis

The user's prompt assumes `src/hooks/useSEO.ts` exists and uses `useEffect` + `document.querySelector`. **That file does not exist in this repo right now** — it was deleted in the previous turn. Only `src/hooks/useSEO.tsx` exists, and it already uses `<Head>` from `vite-react-ssg` (render-phase, no `useEffect`, no DOM manipulation). The user is reading a stale view (probably from `shepi-ai-usa` published HTML, not the current source).

The user's proposed fix — `import { useHead } from "@unhead/react"` — also **would not compile** as written, because `@unhead/react` is not in `package.json`. Only `vite-react-ssg` is installed.

So before changing any code, I need to figure out which of three scenarios is actually true.

## Diagnostic plan (Phase 1 — must run first)

I'll run, in order:

1. `bun run build` and inspect `dist/quality-of-earnings-cost/index.html` directly. This is the only ground truth. If the title is correct in `dist/` HTML, the source code is fine and the user is looking at a stale deploy.
2. `cat node_modules/vite-react-ssg/package.json` — confirm whether v0.9 ships `react-helmet-async` or has switched to `unhead` internally. This decides which head API actually gets serialized at prerender.
3. `rg "HelmetProvider|UnheadProvider|createHead" src/` — confirm whether the required head provider is mounted in the app tree. `<Head>` from `vite-react-ssg` is a no-op without its provider.
4. `rg "useSEO\(" src/ -l` then spot-check 3 call sites — confirm every caller actually renders the returned `__seoTags` JSX. If any caller does `useSEO({...})` without using the return value, that page emits zero head tags regardless of how `useSEO` is implemented.
5. `rg "auth-middleware" src/ vite.config.ts` — find what keeps regenerating `src/integrations/supabase/auth-middleware.ts` (it imports `@tanstack/react-start`, which isn't installed, and breaks every build). This needs a permanent stop, not another delete.

## Fix plan (Phase 2 — branches on diagnostic results)

### Scenario A — `dist/` HTML is correct, only `shepi.ai` is stale
No source code change. Tell the user to redeploy (or wait for the deploy that the previous turn already triggered to propagate) and re-curl. The user's "production curl" evidence is from a build that doesn't include the previous fix yet.

### Scenario B — `dist/` HTML is generic, and `vite-react-ssg` v0.9 uses `unhead` internally
The user's instinct is right but their import is wrong. Replace `useSEO.tsx` to call `useHead()` from the unhead instance that `vite-react-ssg` re-exports, **not** from a separately-installed `@unhead/react`. Likely import path: `vite-react-ssg/utils` or `vite-react-ssg`'s own re-export — I'll grep `node_modules/vite-react-ssg/dist` to find the exact named export.

### Scenario C — `dist/` HTML is generic, and `<Head>` is correct but `HelmetProvider`/`UnheadProvider` is missing from the tree
Add the provider in `src/main.tsx` (and also in the SSG entry if vite-react-ssg requires it on both sides). Source of `useSEO.tsx` stays as-is — it's already using the right primitive, it just has nothing collecting its output.

### Scenario D — `dist/` HTML is generic because call sites don't render `{__seoTags}`
Audit all 17 call sites. For any that don't render the return value, either fix the call site or convert `useSEO` from a JSX-returning shim into a side-effect hook (which requires Scenario B's `useHead()` approach).

## Auth-middleware permanent fix (Phase 3, parallel)

`src/integrations/supabase/auth-middleware.ts` keeps getting auto-regenerated with imports for `@tanstack/react-start` — a framework this project doesn't use. Every regeneration breaks the build. Options to stop it permanently:

1. Stub the file with valid TypeScript that exports nothing useful (so future regeneration overwrites a working stub but never breaks compile until then), or
2. Add it to `tsconfig.json`'s `exclude` list so the broken imports don't fail typecheck, or
3. Replace its content with a no-op that's compatible with the rest of the codebase (a plain function that throws "not implemented" — no framework imports).

I'll pick option 3 — it's the most resilient. The file becomes a thin no-op the auto-scaffolder will keep overwriting, but at least *while* it has the no-op content the build passes.

## What I will NOT do

- I will **not** add `@unhead/react` as a separate dependency. `vite-react-ssg` already owns the head pipeline; introducing a second one risks two providers and double-rendered tags.
- I will **not** rewrite `useSEO` to use `useEffect` + `document.querySelector`. The user is right that this approach is broken for SSG.
- I will **not** migrate to TanStack Start. Already declined twice.
- I will **not** push without verifying the local `dist/` HTML shows the correct per-page title. The user's verification step is non-negotiable and I'll run it before declaring done.

## Deliverable

After Phase 1 diagnosis, I'll report back with:
- Exact contents of `dist/quality-of-earnings-cost/index.html`'s `<title>` and `<link rel="canonical">`
- Which scenario (A/B/C/D) is true
- The minimal source change required (could be zero)
- Confirmation that `auth-middleware.ts` is stubbed so it stops breaking builds

Then I implement the minimal fix and re-run the build verification before finishing.
