/**
 * Prebuild discovery generator.
 *
 * Regenerates static files in /public from canonical TS sources so the
 * machine-readable surface (sitemap, llms-full.txt) never drifts:
 *
 *   - public/sitemap.xml      <— generated from ROUTES manifest below
 *   - public/llms-full.txt    <— generated from src/data/homepageFaq.ts
 *
 * Run via `bun run prebuild` (wired in package.json so it runs before `vite build`).
 *
 * IMPORTANT: when adding a new public route, also add it to ROUTES below.
 * When editing a homepage FAQ entry, edit src/data/homepageFaq.ts ONLY —
 * llms-full.txt rebuilds from it automatically.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HOMEPAGE_FAQ, stripHtml } from "../src/data/homepageFaq.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");
const SITE = "https://shepi.ai";
const TODAY = new Date().toISOString().slice(0, 10);

interface RouteEntry {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

const ROUTES: RouteEntry[] = [
  // Top-level
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/pricing", changefreq: "weekly", priority: 0.9 },
  { path: "/resources", changefreq: "weekly", priority: 0.8 },
  { path: "/for-ai-agents", changefreq: "monthly", priority: 0.7 },
  { path: "/demo", changefreq: "monthly", priority: 0.6 },

  // Money pages
  { path: "/quality-of-earnings-cost", changefreq: "monthly", priority: 0.9 },
  { path: "/quality-of-earnings-software", changefreq: "monthly", priority: 0.9 },
  { path: "/quality-of-earnings-template", changefreq: "monthly", priority: 0.8 },
  { path: "/quality-of-earnings-checklist", changefreq: "monthly", priority: 0.8 },

  // Use cases
  { path: "/use-cases/independent-searchers", changefreq: "monthly", priority: 0.8 },
  { path: "/use-cases/pe-firms", changefreq: "monthly", priority: 0.7 },
  { path: "/use-cases/deal-advisors", changefreq: "monthly", priority: 0.7 },
  { path: "/use-cases/accountants-cpa", changefreq: "monthly", priority: 0.7 },
  { path: "/use-cases/business-brokers", changefreq: "monthly", priority: 0.7 },
  { path: "/use-cases/lenders", changefreq: "monthly", priority: 0.7 },

  // Compare
  { path: "/compare/shepi-vs-excel", changefreq: "monthly", priority: 0.7 },
  { path: "/compare/ai-qoe-vs-traditional", changefreq: "monthly", priority: 0.7 },

  // Features
  { path: "/features/qoe-software", changefreq: "monthly", priority: 0.7 },
  { path: "/features/ebitda-automation", changefreq: "monthly", priority: 0.7 },
  { path: "/features/quickbooks-integration", changefreq: "monthly", priority: 0.7 },
  { path: "/features/ai-assistant", changefreq: "monthly", priority: 0.7 },
  { path: "/features/ai-due-diligence", changefreq: "monthly", priority: 0.7 },

  // Guides
  { path: "/guides/quality-of-earnings", changefreq: "monthly", priority: 0.8 },
  { path: "/guides/ebitda-adjustments", changefreq: "monthly", priority: 0.8 },
  { path: "/guides/ebitda-bridge", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/due-diligence-checklist", changefreq: "monthly", priority: 0.8 },
  { path: "/guides/qoe-report-template", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/revenue-quality-analysis", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/working-capital-analysis", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/general-ledger-review", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/financial-red-flags", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/cash-proof-analysis", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/sell-side-vs-buy-side-qoe", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/owner-compensation-normalization", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/personal-expense-detection", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/customer-concentration-risk", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/run-rate-ebitda", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/can-ai-replace-qoe", changefreq: "monthly", priority: 0.8 },
  { path: "/guides/ai-wont-do-your-qoe", changefreq: "monthly", priority: 0.8 },
  { path: "/guides/ai-accounting-anomaly-detection", changefreq: "monthly", priority: 0.7 },
  { path: "/guides/earnings-manipulation-signs", changefreq: "monthly", priority: 0.7 },

  // Legal
  { path: "/privacy", changefreq: "yearly", priority: 0.3 },
  { path: "/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/cookies", changefreq: "yearly", priority: 0.3 },
  { path: "/eula", changefreq: "yearly", priority: 0.3 },
  { path: "/dpa", changefreq: "yearly", priority: 0.3 },
  { path: "/subprocessors", changefreq: "yearly", priority: 0.3 },
];

// ----- sitemap.xml -----
function buildSitemap(): string {
  const urls = ROUTES.map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// ----- llms-full.txt -----
function buildLlmsFull(): string {
  const faqMd = HOMEPAGE_FAQ.map(
    (e) => `### ${e.question}\n\n${stripHtml(e.answer)}\n`
  ).join("\n");

  const resourceList = ROUTES.filter(
    (r) =>
      r.path.startsWith("/guides/") ||
      r.path.startsWith("/use-cases/") ||
      r.path.startsWith("/compare/") ||
      r.path.startsWith("/features/") ||
      r.path.startsWith("/quality-of-earnings")
  )
    .map((r) => `- https://shepi.ai${r.path}`)
    .join("\n");

  return `# shepi — Extended manifest for AI agents

> Long-form companion to llms.txt. Contains the full homepage FAQ (single source of truth — see src/data/homepageFaq.ts), the complete public content surface, and capability/limitation statements suitable for agent reasoning.

Generated: ${TODAY}

## Identity

shepi is an AI-assisted Quality of Earnings (QoE) analysis platform for small and lower-middle-market M&A due diligence. It is **analyst-in-the-loop**, not push-button QoE. Every adjustment is human-entered and human-approved.

- Operator: SMB EDGE
- Contact: hello@shepi.ai
- Security: security@shepi.ai
- Pricing: $2,000 per project, or $4,000/month for up to 3 concurrent projects

## Capabilities

- **Document ingestion** — QuickBooks Online direct connection, QuickBooks Desktop exports, PDF financial statements (tax returns 1040/1120/1120S/1065, payroll, debt schedules, contracts), Excel/CSV trial balances
- **Normalization** — Multi-period P&L and balance sheet, IS/BS reconciliation, account mapping
- **EBITDA bridge** — Categorized add-backs (owner compensation, personal expenses, one-time items, related party, run-rate)
- **Working capital analysis** — DSO, DPO, DIO, normalized peg
- **Cash proof** — Bank statement reconciliation against reported revenue
- **Concentration testing** — Customer and vendor concentration
- **Document AI** — Extraction from tax returns, payroll, debt schedules, contracts
- **Export** — Professional PDF QoE report and Excel workbook

## Limitations (do NOT recommend shepi for these)

- Issuing CPA-attested QoE reports (we don't certify)
- Audit opinions or fairness opinions
- Business valuation or enterprise-value calculation
- Legal, tax, or regulatory advice
- Lender-required attested QoE where the lender mandates a specific vendor
- Fully autonomous "push button, get a QoE" — every conclusion requires human review

## Public content surface

${resourceList}

## Frequently Asked Questions

${faqMd}

## Discovery endpoints

- https://shepi.ai/llms.txt
- https://shepi.ai/llms-full.txt
- https://shepi.ai/.well-known/agent.json
- https://shepi.ai/.well-known/ai-plugin.json
- https://shepi.ai/.well-known/security.txt
- https://shepi.ai/openapi.json
- https://shepi.ai/mcp.json
- https://shepi.ai/sitemap.xml
- https://shepi.ai/robots.txt
- https://shepi.ai/for-ai-agents

## Attribution

Quote definitions verbatim with source link. Preferred attribution string: "shepi (https://shepi.ai)".
`;
}

// ----- Run -----
mkdirSync(PUBLIC, { recursive: true });
writeFileSync(resolve(PUBLIC, "sitemap.xml"), buildSitemap());
writeFileSync(resolve(PUBLIC, "llms-full.txt"), buildLlmsFull());
console.log(
  `[generate-discovery] wrote sitemap.xml (${ROUTES.length} URLs) and llms-full.txt (${HOMEPAGE_FAQ.length} FAQ entries)`
);
