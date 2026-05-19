# Why some visitors see JSON instead of the page

## What I verified

I probed production directly. The **root URL is fine** for every user-agent I tested (Chrome, curl, GPTBot, Facebook scraper) — Vercel returns `Content-Type: text/html` with the prerendered React app. No service worker is registered, no rogue rewrite, no SSR error. So nobody hitting `https://shepi.ai/` is actually getting JSON.

What *does* return JSON to a browser are these intentionally-public, machine-readable endpoints we ship in `public/`:

| Path | Purpose | Content-Type |
|---|---|---|
| `/openapi.json` | OpenAPI spec for AI tool-calling | application/json |
| `/mcp.json` | Model Context Protocol manifest | application/json |
| `/.well-known/agent.json` | Agent discovery (A2A) | application/json |
| `/.well-known/ai-plugin.json` | ChatGPT plugin manifest | application/json |

They're advertised to crawlers via `public/llms.txt`, `public/llms-full.txt`, and `robots.txt`. So the most likely paths to a human seeing raw JSON are:

1. **AI chatbot citations.** ChatGPT/Perplexity/Claude fetch `/.well-known/ai-plugin.json` or `/openapi.json` while answering "what is shepi?", then cite that URL in their sources panel. User clicks → JSON.
2. **Bookmark / share-link copy** from one of those AI tools.
3. **Search-engine indexing** of the JSON endpoints surfacing in results.
4. (Edge cases) Browser extensions, link-prefetchers, or a copy-paste that included a trailing path.

## Recommended fix

Add a tiny **content-negotiation middleware** in front of those four paths: if the request looks like a real browser (Accept header contains `text/html` and User-Agent isn't a known bot), 302 to `/`. Bots, curl, and any `Accept: application/json` client continue to receive the raw JSON unchanged.

This solves the "humans see JSON" problem without breaking AI discoverability (which is the whole reason those files exist).

### Implementation

1. Create `api/_well-known.ts` Vercel Edge Middleware (or a `middleware.ts` at repo root, which Vercel runs on every request). Pattern-match the four JSON paths; sniff `Accept` + `User-Agent`; redirect humans, pass through bots.
2. Add a small Vitest unit test for the UA/Accept decision function so we don't accidentally redirect GPTBot.
3. Leave `llms.txt`, `robots.txt`, and the JSON files themselves untouched.

```ts
// middleware.ts (sketch)
import { NextRequest, NextResponse } from "next/server"; // works on Vercel for Vite projects too via @vercel/edge
export const config = {
  matcher: ["/openapi.json", "/mcp.json", "/.well-known/agent.json", "/.well-known/ai-plugin.json"],
};
export default function middleware(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  const isBot = /(bot|crawler|spider|gpt|claude|perplexity|facebookexternalhit|slackbot|discordbot|twitterbot)/.test(ua);
  const wantsHtml = accept.includes("text/html") && !accept.includes("application/json");
  if (wantsHtml && !isBot) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 302);
  }
  return NextResponse.next();
}
```

(Will use `@vercel/edge` `Request`/`Response` directly since this isn't a Next project — same logic, no Next dependency.)

### Optional follow-up (not in this change)

Add request logging on those four paths (Vercel Analytics or a tiny edge log line) for a week so we can see how often humans actually land there and confirm the fix worked.

## What I am NOT changing

- Root `https://shepi.ai/` — already correct, returns HTML.
- `vercel.json` rewrites — already correct.
- The JSON files' contents — they're working as designed for AI agents.
- `robots.txt` / `llms.txt` — keeping AI discoverability intact.

If you'd rather just **delete** the AI-agent endpoints entirely (option 3 from my earlier question) instead of redirecting, say the word and I'll swap the plan.
