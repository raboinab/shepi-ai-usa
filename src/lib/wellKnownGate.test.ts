import { describe, expect, it } from "vitest";
import { isBotUserAgent, isLikelyHumanBrowser } from "./wellKnownGate";

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const HTML_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

describe("isBotUserAgent", () => {
  it.each([
    ["GPTBot/1.0 (+https://openai.com/gptbot)"],
    ["ChatGPT-User/1.0"],
    ["Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"],
    ["PerplexityBot/1.0"],
    ["facebookexternalhit/1.1"],
    ["Slackbot-LinkExpanding 1.0"],
    ["Twitterbot/1.0"],
    ["Mozilla/5.0 (compatible; Googlebot/2.1)"],
    ["Mozilla/5.0 (compatible; bingbot/2.0)"],
    ["Mozilla/5.0 (compatible; AhrefsBot/7.0)"],
  ])("flags %s as a bot", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it.each([[CHROME_UA], [SAFARI_UA], ["curl/8.4.0"], [""], [null], [undefined]])(
    "does not flag %s as a bot",
    (ua) => {
      expect(isBotUserAgent(ua as string | null | undefined)).toBe(false);
    },
  );
});

describe("isLikelyHumanBrowser", () => {
  it("redirects a real Chrome navigation", () => {
    expect(isLikelyHumanBrowser(HTML_ACCEPT, CHROME_UA)).toBe(true);
  });

  it("redirects a real iOS Safari navigation", () => {
    expect(isLikelyHumanBrowser(HTML_ACCEPT, SAFARI_UA)).toBe(true);
  });

  it("does NOT redirect GPTBot even if it sends text/html", () => {
    expect(isLikelyHumanBrowser(HTML_ACCEPT, "GPTBot/1.0")).toBe(false);
  });

  it("does NOT redirect ClaudeBot", () => {
    expect(
      isLikelyHumanBrowser(HTML_ACCEPT, "Mozilla/5.0 (compatible; ClaudeBot/1.0)"),
    ).toBe(false);
  });

  it("does NOT redirect when caller asks for application/json", () => {
    expect(isLikelyHumanBrowser("application/json", CHROME_UA)).toBe(false);
  });

  it("does NOT redirect curl (no Accept header)", () => {
    expect(isLikelyHumanBrowser(null, "curl/8.4.0")).toBe(false);
    expect(isLikelyHumanBrowser(undefined, "curl/8.4.0")).toBe(false);
  });

  it("does NOT redirect an SDK with */* Accept", () => {
    expect(isLikelyHumanBrowser("*/*", "MyApp/1.0")).toBe(false);
  });

  it("does NOT redirect facebookexternalhit link preview", () => {
    expect(isLikelyHumanBrowser(HTML_ACCEPT, "facebookexternalhit/1.1")).toBe(
      false,
    );
  });
});
