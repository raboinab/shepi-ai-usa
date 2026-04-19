import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const PRERENDER_PATHS = [
  "/",
  "/pricing",
  "/demo",
  "/privacy",
  "/terms",
  "/cookies",
  "/eula",
  "/subprocessors",
  "/dpa",
  "/resources",
  "/guides/quality-of-earnings",
  "/guides/ebitda-adjustments",
  "/guides/due-diligence-checklist",
  "/guides/revenue-quality-analysis",
  "/guides/working-capital-analysis",
  "/guides/qoe-report-template",
  "/guides/general-ledger-review",
  "/guides/ebitda-bridge",
  "/guides/financial-red-flags",
  "/guides/cash-proof-analysis",
  "/guides/sell-side-vs-buy-side-qoe",
  "/guides/owner-compensation-normalization",
  "/guides/personal-expense-detection",
  "/guides/customer-concentration-risk",
  "/guides/run-rate-ebitda",
  "/guides/can-ai-replace-qoe",
  "/guides/ai-accounting-anomaly-detection",
  "/guides/earnings-manipulation-signs",
  "/use-cases/independent-searchers",
  "/use-cases/pe-firms",
  "/use-cases/deal-advisors",
  "/use-cases/accountants-cpa",
  "/use-cases/business-brokers",
  "/use-cases/lenders",
  "/compare/shepi-vs-excel",
  "/compare/ai-qoe-vs-traditional",
  "/features/quickbooks-integration",
  "/features/ai-assistant",
  "/features/ai-due-diligence",
  "/features/qoe-software",
  "/features/ebitda-automation",
  "/quality-of-earnings-cost",
  "/quality-of-earnings-software",
  "/quality-of-earnings-template",
  "/quality-of-earnings-checklist",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssgOptions: {
    entry: "src/main.tsx",
    script: "async",
    formatting: "none",
    dirStyle: "nested",
    // Mock browser globals (window, document, localStorage, etc.) during
    // prerender so modules that touch them at import time (e.g. the Supabase
    // client's `storage: localStorage`) don't crash the build. Components
    // still re-execute on the client where the real APIs are available.
    mock: true,
    includedRoutes: () => PRERENDER_PATHS,
    // After every page renders, serialize the per-request Unhead instance
    // captured in HeadProvider and inject it into <head>. This is what gives
    // social crawlers and Googlebot per-page <title>, meta, and canonical
    // without executing any JS.
    onPageRendered: async (route: string, renderedHTML: string) => {
      const head = (globalThis as any).__SSR_HEAD__;
      // eslint-disable-next-line no-console
      console.log(`[ssg-head] route=${route} hasHead=${!!head}`);
      if (!head) return renderedHTML;
      const { renderSSRHead } = await import("unhead/server");
      const payload = await renderSSRHead(head);
      // eslint-disable-next-line no-console
      console.log(`[ssg-head] route=${route} headTagsLen=${payload.headTags?.length || 0}`);
      let html = renderedHTML;
      if (payload.headTags) {
        html = html.replace("</head>", `${payload.headTags}\n</head>`);
      }
      if (payload.bodyAttrs) {
        html = html.replace("<body", `<body ${payload.bodyAttrs}`);
      }
      if (payload.htmlAttrs) {
        html = html.replace("<html", `<html ${payload.htmlAttrs}`);
      }
      // Reset for next page
      (globalThis as any).__SSR_HEAD__ = undefined;
      return html;
    },
  },
}));
