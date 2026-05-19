/**
 * Decide whether an incoming request to one of our machine-readable JSON
 * endpoints (/openapi.json, /mcp.json, /.well-known/*.json) looks like a
 * real human in a browser — in which case we want to redirect them to "/"
 * instead of serving raw JSON.
 *
 * The rule is intentionally conservative: we only treat a request as
 * "human" if it BOTH (a) advertises text/html in Accept and (b) does not
 * look like a known bot/crawler UA. Anything that explicitly asks for JSON,
 * has no Accept header (curl/fetch/SDKs), or matches a bot UA passes through.
 */

// Keep this list narrow and high-signal. Matching is case-insensitive
// substring against the User-Agent. We deliberately include the catch-all
// "bot", "crawler", "spider" tokens — they cover the long tail.
const BOT_UA_TOKENS = [
  "bot",
  "crawler",
  "spider",
  "gpt", // GPTBot, ChatGPT-User
  "openai",
  "claude",
  "anthropic",
  "perplexity",
  "google",
  "bingpreview",
  "facebookexternalhit",
  "slackbot",
  "discordbot",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "applebot",
  "duckduckbot",
  "yandex",
  "baiduspider",
  "ahrefs",
  "semrush",
  "screaming frog",
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_UA_TOKENS.some((tok) => lower.includes(tok));
}

export function isLikelyHumanBrowser(
  accept: string | null | undefined,
  userAgent: string | null | undefined,
): boolean {
  // Bots — including AI crawlers we WANT to serve JSON to — always pass through.
  if (isBotUserAgent(userAgent)) return false;

  // No Accept header at all → almost certainly curl / fetch / an SDK.
  // Browsers always send Accept.
  if (!accept) return false;

  const lower = accept.toLowerCase();

  // Caller explicitly asked for JSON → respect that.
  if (lower.includes("application/json")) return false;

  // Browsers send "text/html,application/xhtml+xml,…" on top-level navigations.
  // That's our signal this is a real person clicking a link.
  return lower.includes("text/html");
}
