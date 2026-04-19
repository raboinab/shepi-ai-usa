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
    // Per-page <head> tags are handled natively by vite-react-ssg's <Head>
    // component (react-helmet-async). No custom onPageRendered hook needed —
    // tags are collected during prerender and serialized into the static HTML.
  },
}));
