// Vercel Edge Middleware (framework-agnostic).
// Intercepts requests to our machine-readable JSON endpoints. If the request
// looks like a human browser, 302 to "/" so they don't see raw JSON.
// Bots (GPTBot, Claude, Perplexity, FB, Slack, etc.) and explicit JSON
// clients (curl, fetch, anything with Accept: application/json) pass through
// untouched so AI discoverability still works.
//
// Why this exists: AI chatbots cite /openapi.json or /.well-known/ai-plugin.json
// in their sources panel. Users click the citation and see raw JSON instead of
// the marketing site. See .lovable/plan.md.

import { isLikelyHumanBrowser } from "./src/lib/wellKnownGate";

export const config = {
  matcher: [
    "/openapi.json",
    "/mcp.json",
    "/.well-known/agent.json",
    "/.well-known/ai-plugin.json",
  ],
};

export default function middleware(request: Request): Response {
  if (
    isLikelyHumanBrowser(
      request.headers.get("accept"),
      request.headers.get("user-agent"),
    )
  ) {
    const url = new URL(request.url);
    url.pathname = "/";
    url.search = "";
    return Response.redirect(url.toString(), 302);
  }
  // Pass through — Vercel will serve the static file as JSON.
  return new Response(null, {
    headers: { "x-middleware-next": "1" },
  });
}
