/**
 * Curated cross-link map for guides ↔ use-cases ↔ compare pages.
 *
 * Keyed by canonical pathname (leading slash, no trailing slash).
 * Anchor text uses target-page keywords, not "click here".
 *
 * ContentPageLayout auto-renders "Continue reading" cards from this map
 * when the current canonical matches a key here. Guides that already
 * render their own manual "Related Resources" section still get this
 * extra block — the two are complementary (manual = editorially chosen,
 * auto = broader topical/use-case coverage). Duplicates within the same
 * page are fine for SEO.
 */

export interface RelatedLink {
  to: string;
  label: string;
}

// Common use-case bundles reused across many guides.
const BUYER_USE_CASES: RelatedLink[] = [
  { to: "/use-cases/independent-searchers", label: "For independent searchers and self-funded buyers" },
  { to: "/use-cases/pe-firms", label: "For private equity firms and family offices" },
];

const ADVISOR_USE_CASES: RelatedLink[] = [
  { to: "/use-cases/deal-advisors", label: "For M&A advisors and investment bankers" },
  { to: "/use-cases/accountants-cpa", label: "For CPAs and accounting firms" },
];

const LENDER_USE_CASES: RelatedLink[] = [
  { to: "/use-cases/lenders", label: "For SBA and acquisition lenders" },
  { to: "/use-cases/business-brokers", label: "For business brokers" },
];

export const RELATED_CONTENT: Record<string, RelatedLink[]> = {
  // ----- Core guides -----
  "/guides/quality-of-earnings": [
    { to: "/guides/ebitda-adjustments", label: "How EBITDA adjustments work" },
    { to: "/guides/qoe-vs-audit", label: "Quality of Earnings vs financial audit" },
    { to: "/guides/qoe-report-template", label: "What's inside a QoE report template" },
    ...BUYER_USE_CASES,
  ],
  "/guides/ebitda-adjustments": [
    { to: "/guides/ebitda-bridge", label: "Building the EBITDA bridge" },
    { to: "/guides/owner-compensation-normalization", label: "Normalizing owner compensation" },
    { to: "/guides/personal-expense-detection", label: "Detecting personal expenses in the P&L" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/ebitda-bridge": [
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments explained" },
    { to: "/guides/run-rate-ebitda", label: "Calculating run-rate EBITDA" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/due-diligence-checklist": [
    { to: "/guides/quality-of-earnings", label: "Quality of Earnings analysis, explained" },
    { to: "/guides/financial-red-flags", label: "Financial red flags to watch for" },
    ...BUYER_USE_CASES,
    ...LENDER_USE_CASES.slice(0, 1),
  ],
  "/guides/qoe-report-template": [
    { to: "/guides/quality-of-earnings", label: "What a Quality of Earnings analysis covers" },
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/qoe-vs-audit": [
    { to: "/guides/quality-of-earnings", label: "Quality of Earnings, in depth" },
    { to: "/guides/due-diligence-checklist", label: "Financial due diligence checklist" },
    ...BUYER_USE_CASES,
    ...LENDER_USE_CASES.slice(0, 1),
  ],
  "/guides/working-capital-analysis": [
    { to: "/guides/cash-proof-analysis", label: "Cash proof and bank reconciliation" },
    { to: "/guides/revenue-quality-analysis", label: "Revenue quality analysis" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/cash-proof-analysis": [
    { to: "/guides/revenue-quality-analysis", label: "Revenue quality analysis" },
    { to: "/guides/general-ledger-review", label: "General ledger review workflow" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/revenue-quality-analysis": [
    { to: "/guides/customer-concentration-risk", label: "Customer concentration risk" },
    { to: "/guides/cash-proof-analysis", label: "Cash proof analysis" },
    ...BUYER_USE_CASES,
  ],
  "/guides/general-ledger-review": [
    { to: "/guides/earnings-manipulation-signs", label: "Signs of earnings manipulation" },
    { to: "/guides/ai-accounting-anomaly-detection", label: "AI anomaly detection in accounting data" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/financial-red-flags": [
    { to: "/guides/earnings-manipulation-signs", label: "Signs of earnings manipulation" },
    { to: "/guides/due-diligence-checklist", label: "Financial due diligence checklist" },
    ...BUYER_USE_CASES,
  ],
  "/guides/owner-compensation-normalization": [
    { to: "/guides/personal-expense-detection", label: "Detecting personal expenses in the P&L" },
    { to: "/guides/sellers-discretionary-earnings", label: "Seller's Discretionary Earnings (SDE)" },
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
  ],
  "/guides/personal-expense-detection": [
    { to: "/guides/owner-compensation-normalization", label: "Normalizing owner compensation" },
    { to: "/guides/general-ledger-review", label: "General ledger review workflow" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/customer-concentration-risk": [
    { to: "/guides/revenue-quality-analysis", label: "Revenue quality analysis" },
    { to: "/guides/financial-red-flags", label: "Financial red flags" },
    ...BUYER_USE_CASES,
  ],
  "/guides/run-rate-ebitda": [
    { to: "/guides/ebitda-bridge", label: "Building the EBITDA bridge" },
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/sell-side-vs-buy-side-qoe": [
    { to: "/guides/quality-of-earnings", label: "Quality of Earnings, in depth" },
    ...BUYER_USE_CASES,
    { to: "/use-cases/deal-advisors", label: "For M&A advisors and investment bankers" },
  ],
  "/guides/sellers-discretionary-earnings": [
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
    { to: "/guides/owner-compensation-normalization", label: "Normalizing owner compensation" },
    { to: "/use-cases/business-brokers", label: "For business brokers" },
  ],
  "/guides/ai-wont-do-your-qoe": [
    { to: "/guides/can-ai-replace-qoe", label: "Can AI replace a Quality of Earnings analysis?" },
    { to: "/compare/ai-qoe-vs-traditional", label: "AI-assisted QoE vs traditional CPA firms" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/can-ai-replace-qoe": [
    { to: "/guides/ai-wont-do-your-qoe", label: "What AI won't do for your QoE" },
    { to: "/compare/ai-qoe-vs-traditional", label: "AI-assisted QoE vs traditional CPA firms" },
    ...BUYER_USE_CASES,
  ],
  "/guides/ai-accounting-anomaly-detection": [
    { to: "/guides/earnings-manipulation-signs", label: "Signs of earnings manipulation" },
    { to: "/guides/general-ledger-review", label: "General ledger review workflow" },
    ...ADVISOR_USE_CASES,
  ],
  "/guides/earnings-manipulation-signs": [
    { to: "/guides/financial-red-flags", label: "Financial red flags" },
    { to: "/guides/ai-accounting-anomaly-detection", label: "AI anomaly detection in accounting data" },
    ...BUYER_USE_CASES,
  ],

  // ----- Compare pages -----
  "/compare/cpa-firm-vs-shepi": [
    { to: "/compare/ai-qoe-vs-traditional", label: "AI-assisted QoE vs traditional CPA firms" },
    { to: "/guides/qoe-vs-audit", label: "Quality of Earnings vs financial audit" },
    ...BUYER_USE_CASES,
  ],
  "/compare/ai-qoe-vs-traditional": [
    { to: "/compare/cpa-firm-vs-shepi", label: "CPA firm vs Shepi comparison" },
    { to: "/guides/can-ai-replace-qoe", label: "Can AI replace a QoE?" },
    ...BUYER_USE_CASES,
  ],
  "/compare/shepi-vs-excel": [
    { to: "/features/qoe-software", label: "Purpose-built QoE software" },
    { to: "/guides/qoe-report-template", label: "What a QoE report looks like" },
    ...ADVISOR_USE_CASES,
  ],

  // ----- Use cases (reverse links back into guides) -----
  "/use-cases/independent-searchers": [
    { to: "/guides/quality-of-earnings", label: "Quality of Earnings analysis, explained" },
    { to: "/guides/due-diligence-checklist", label: "Financial due diligence checklist" },
    { to: "/guides/financial-red-flags", label: "Financial red flags to watch for" },
  ],
  "/use-cases/pe-firms": [
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
    { to: "/guides/working-capital-analysis", label: "Working capital analysis" },
    { to: "/guides/qoe-report-template", label: "QoE report template" },
  ],
  "/use-cases/deal-advisors": [
    { to: "/guides/sell-side-vs-buy-side-qoe", label: "Sell-side vs buy-side QoE" },
    { to: "/guides/qoe-report-template", label: "QoE report template" },
    { to: "/guides/ebitda-bridge", label: "Building the EBITDA bridge" },
  ],
  "/use-cases/accountants-cpa": [
    { to: "/guides/general-ledger-review", label: "General ledger review workflow" },
    { to: "/guides/ebitda-adjustments", label: "EBITDA adjustments reference" },
    { to: "/compare/cpa-firm-vs-shepi", label: "CPA firm vs Shepi comparison" },
  ],
  "/use-cases/business-brokers": [
    { to: "/guides/sellers-discretionary-earnings", label: "Seller's Discretionary Earnings" },
    { to: "/guides/sell-side-vs-buy-side-qoe", label: "Sell-side vs buy-side QoE" },
    { to: "/guides/qoe-report-template", label: "QoE report template" },
  ],
  "/use-cases/lenders": [
    { to: "/guides/qoe-vs-audit", label: "QoE vs financial audit" },
    { to: "/guides/cash-proof-analysis", label: "Cash proof analysis" },
    { to: "/guides/due-diligence-checklist", label: "Financial due diligence checklist" },
  ],
};

/**
 * Look up related links by canonical URL or pathname. Returns null when
 * no curated map exists (caller can skip rendering).
 */
export function getRelatedLinks(canonicalOrPath: string): RelatedLink[] | null {
  try {
    const path = canonicalOrPath.startsWith("http")
      ? new URL(canonicalOrPath).pathname
      : canonicalOrPath;
    const normalized = path.replace(/\/+$/, "") || "/";
    return RELATED_CONTENT[normalized] ?? null;
  } catch {
    return null;
  }
}
