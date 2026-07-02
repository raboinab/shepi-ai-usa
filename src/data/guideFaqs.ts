/**
 * Per-guide FAQ content, structured so both:
 *   - the on-page <AccordionFAQ> (rendered in the guide) and
 *   - llms-full.txt (built by scripts/generate-discovery.ts)
 * pull from a single source of truth.
 *
 * Initial pass covers the six highest-traffic guides. Add more entries
 * over time; the llms.txt generator skips slugs without an entry, and
 * guide files opt in individually.
 */

export interface GuideFaqEntry {
  question: string;
  answer: string;
}

export interface GuideFaqBlock {
  slug: string; // pathname without leading slash, e.g. "guides/quality-of-earnings"
  title: string; // human title for the "FAQ — {title}" section header
  url: string; // absolute URL used in llms-full.txt
  faqs: GuideFaqEntry[];
}

export const GUIDE_FAQS: GuideFaqBlock[] = [
  {
    slug: "guides/quality-of-earnings",
    title: "Quality of Earnings",
    url: "https://shepi.ai/guides/quality-of-earnings",
    faqs: [
      {
        question: "What is a Quality of Earnings (QoE) report?",
        answer:
          "A QoE report is a financial due diligence analysis that normalizes a company's earnings to show what a buyer can realistically expect the business to earn post-close. It converts reported EBITDA into an adjusted, sustainable, recurring number by isolating owner add-backs, one-time items, and accounting anomalies.",
      },
      {
        question: "Who orders a QoE report?",
        answer:
          "Buyers order buy-side QoE reports to validate a target's earnings before closing. Sellers order sell-side QoE reports to defend asking price and pre-empt buyer adjustments. Lenders, especially SBA and acquisition lenders, often require a QoE as an underwriting condition.",
      },
      {
        question: "How long does a Quality of Earnings analysis take?",
        answer:
          "Traditional CPA-led QoE engagements take 3–6 weeks. AI-assisted platforms like Shepi can produce a first draft in hours once source documents are uploaded, with CPA review adding a few business days for the Done-For-You tier.",
      },
      {
        question: "Is a QoE the same as an audit?",
        answer:
          "No. An audit expresses an opinion on whether historical financial statements comply with GAAP. A QoE is a forward-looking valuation exercise focused on normalized, recurring EBITDA. See the QoE vs Audit guide for a full comparison.",
      },
    ],
  },
  {
    slug: "guides/ebitda-adjustments",
    title: "EBITDA Adjustments",
    url: "https://shepi.ai/guides/ebitda-adjustments",
    faqs: [
      {
        question: "What are EBITDA adjustments?",
        answer:
          "EBITDA adjustments are line-item changes that convert reported EBITDA into normalized EBITDA — the earnings a buyer will inherit. Common categories include owner compensation normalization, personal expense add-backs, one-time or non-recurring items, related-party transactions, and run-rate adjustments for recent changes.",
      },
      {
        question: "Which EBITDA add-backs will a lender accept?",
        answer:
          "SBA and acquisition lenders typically accept documented owner compensation normalization, verifiable personal expenses run through the business, and clearly non-recurring items (litigation, one-time consulting). They push back on speculative revenue add-backs, unverified cost savings, and pro-forma synergies.",
      },
      {
        question: "How do I document an EBITDA adjustment?",
        answer:
          "Each adjustment should reference source documents (payroll register, bank statements, invoices) and a written rationale. Buyers and lenders want to see the general ledger detail behind every number so they can trace it back to the underlying transaction.",
      },
      {
        question: "What EBITDA adjustments do buyers reject most often?",
        answer:
          "Buyers reject add-backs that lack documentation, adjustments for expenses the business will still incur under new ownership (e.g. rent to a related party at below-market rates), and forward-looking cost savings that depend on the buyer's own actions.",
      },
    ],
  },
  {
    slug: "guides/qoe-vs-audit",
    title: "Quality of Earnings vs Audit",
    url: "https://shepi.ai/guides/qoe-vs-audit",
    faqs: [
      {
        question: "Is a Quality of Earnings report an audit?",
        answer:
          "No. A QoE report is a financial due diligence analysis, not an audit. It does not express an opinion on whether financial statements comply with GAAP.",
      },
      {
        question: "Do I need an audit or a QoE for an M&A deal?",
        answer:
          "Most buyers and lenders require a QoE to underwrite the deal. Some also require audited financials, especially for larger transactions or SBA loans. The two documents answer different questions.",
      },
      {
        question: "Can audited financials replace a QoE?",
        answer:
          "No. Audited financials verify historical GAAP compliance; they do not normalize earnings for transaction purposes, identify owner add-backs, or set a working capital peg.",
      },
      {
        question: "Which is more expensive, a QoE or an audit?",
        answer:
          "Both vary by size and complexity. Traditional CPA-led QoE reports often start around $15K–$25K and can exceed $100K for complex deals. AI-assisted platforms like Shepi start at $1,000 per project. Audits range from $10K for small businesses to six figures for larger entities.",
      },
    ],
  },
  {
    slug: "guides/due-diligence-checklist",
    title: "Financial Due Diligence Checklist",
    url: "https://shepi.ai/guides/due-diligence-checklist",
    faqs: [
      {
        question: "What documents belong in a financial due diligence request list?",
        answer:
          "At minimum: 3–5 years of financial statements, monthly trial balances, general ledger detail, tax returns, bank statements, payroll registers, top customer and vendor lists, aged AR and AP, debt schedules, and material contracts. Specialized deals add inventory records, backlog reports, and forecast models.",
      },
      {
        question: "How long does financial due diligence take?",
        answer:
          "Traditional financial due diligence runs 3–6 weeks from receipt of a complete data room. Delays are almost always caused by incomplete documents, not analyst capacity. AI-assisted platforms compress the analysis phase but still depend on complete source data.",
      },
      {
        question: "What financial due diligence red flags matter most?",
        answer:
          "Revenue recognized before delivery, customer concentration above 25%, working capital that doesn't reconcile to bank activity, undocumented owner add-backs, related-party transactions at non-market rates, and general ledger accounts with unusual monthly patterns.",
      },
    ],
  },
  {
    slug: "guides/sellers-discretionary-earnings",
    title: "Seller's Discretionary Earnings (SDE)",
    url: "https://shepi.ai/guides/sellers-discretionary-earnings",
    faqs: [
      {
        question: "What is Seller's Discretionary Earnings (SDE)?",
        answer:
          "SDE is a small-business earnings metric that starts with EBITDA and adds back the full compensation and benefits of a single owner-operator, plus discretionary expenses. It represents the total financial benefit available to a single owner-operator buyer.",
      },
      {
        question: "SDE vs EBITDA — which one do buyers use?",
        answer:
          "Businesses under roughly $1M in earnings are typically valued on SDE (main-street brokerage deals). Businesses above that threshold are usually valued on adjusted EBITDA (lower-middle-market M&A). The line is fuzzy; some deals present both.",
      },
      {
        question: "What add-backs are included in SDE but not EBITDA?",
        answer:
          "SDE includes the owner's full W-2 compensation, payroll taxes, health insurance, retirement contributions, and personal-use expenses on top of standard EBITDA add-backs. EBITDA normalizes owner comp to a market-rate replacement salary rather than adding it back in full.",
      },
    ],
  },
  {
    slug: "guides/ebitda-bridge",
    title: "EBITDA Bridge",
    url: "https://shepi.ai/guides/ebitda-bridge",
    faqs: [
      {
        question: "What is an EBITDA bridge?",
        answer:
          "An EBITDA bridge is a schedule that walks from reported EBITDA to adjusted (normalized) EBITDA by listing each add-back and deduction in categories: owner compensation, personal expenses, one-time items, related-party, and run-rate adjustments. It is the centerpiece of any QoE report.",
      },
      {
        question: "How is an EBITDA bridge structured?",
        answer:
          "Start with reported EBITDA per the financial statements. Add or subtract each adjustment in labeled categories, with a source reference for each line. End with adjusted EBITDA. A well-built bridge lets a buyer or lender trace every number back to a source document.",
      },
      {
        question: "What EBITDA bridge mistakes trip up first-time preparers?",
        answer:
          "Double-counting adjustments (e.g., adjusting owner comp and separately adding back the owner's bonus), including forward-looking synergies as if they were current adjustments, and failing to document the source for each add-back so a reviewer cannot verify it.",
      },
    ],
  },
];

/** Look up FAQs for a guide by slug ("guides/..." without leading slash). */
export function getGuideFaqs(slug: string): GuideFaqEntry[] | null {
  const block = GUIDE_FAQS.find((b) => b.slug === slug);
  return block ? block.faqs : null;
}
