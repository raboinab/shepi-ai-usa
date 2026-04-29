/**
 * Single source of truth for the homepage FAQ.
 *
 * Used by:
 * - <Index> page to render the visible Accordion
 * - useSEO({ jsonLd }) on <Index> to emit FAQPage Schema.org JSON-LD
 * - scripts/generate-discovery.mjs to populate the FAQ section of llms-full.txt
 *
 * Keeping these synced from one array prevents the visible content from
 * drifting out of sync with the structured data — a Google manual-action risk.
 *
 * `answer` may include simple inline HTML (<strong>, <p>, <ul>, <li>). The
 * Accordion renderer uses dangerouslySetInnerHTML to support this; the JSON-LD
 * generator strips tags to keep Schema.org `text` plain.
 *
 * Pricing strings reference PRICING.* tokens — kept as ${PERPROJECT}/${MONTHLY}
 * placeholders so the build script can substitute them at generation time.
 */

import { PRICING } from "@/lib/pricing";

export interface FaqEntry {
  /** Stable slug used as Accordion item value and JSON-LD anchor */
  id: string;
  /** Section heading rendered above the Accordion */
  category: string;
  question: string;
  /** Accepts inline HTML for visible rendering; tags stripped for JSON-LD */
  answer: string;
}

const PERPROJECT = PRICING.perProject.display;
const MONTHLY = PRICING.monthly.display;

export const HOMEPAGE_FAQ: FaqEntry[] = [
  // Data & Security
  {
    id: "security-1",
    category: "Data & Security",
    question: "How is my deal data protected?",
    answer:
      "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your deal information is isolated to your account with strict access controls. We use enterprise-grade infrastructure with SOC 2 Type II compliant hosting. Only you can access your projects — not even our support team can view your analysis without explicit permission.",
  },
  {
    id: "security-2",
    category: "Data & Security",
    question: "Is my deal data used to train AI models?",
    answer:
      "No. Your deal data is never used to train AI models. Period. Your financial information, adjustments, and analysis remain completely private. The AI assistance you receive is powered by models trained on public financial knowledge — not your confidential deal information.",
  },
  {
    id: "security-3",
    category: "Data & Security",
    question: "Can other users see my analysis or data?",
    answer:
      "No. Each project is completely isolated to your account. There's no shared database, no cross-user visibility, and no way for other users to access your work. When you export your analysis, you control who has access to those files.",
  },
  {
    id: "security-4",
    category: "Data & Security",
    question: "Can I delete my data after completing a project?",
    answer:
      "Yes. You can delete any project at any time, which permanently removes all associated data including uploaded documents, analysis, and adjustments. Once deleted, the data cannot be recovered. We also automatically purge deleted data from our backups within 30 days.",
  },

  // What shepi Is
  {
    id: "what-is-1",
    category: "What shepi Is",
    question: "What exactly does shepi do?",
    answer:
      "shepi is a QoE analysis platform built on three pillars: a structured analysis framework designed by M&A professionals, automated data processing that transforms raw financials in minutes, and AI-powered document extraction for complex forms. Connect to QuickBooks for automatic data import, or upload PDFs — our AI extracts structured data from tax returns, payroll reports, and contracts without manual data entry. The result: data room files become analysis-ready in minutes, not days.",
  },
  {
    id: "what-is-2",
    category: "What shepi Is",
    question: "How is shepi different from using Excel templates?",
    answer:
      "Excel templates give you a blank structure and hours of manual work. shepi gives you automated processing plus a guided workflow. Key differences: Connect to QuickBooks and import mapped data instantly — work that takes 8-12 hours manually. AI extracts structured data from tax returns, payroll, debt schedules, and contracts — no manual data entry. Multi-period normalization and IS/BS reconciliation happen automatically. A proven 6-phase workflow mirrors how experienced analysts work. You focus on analysis and judgment, not data wrangling.",
  },

  // What shepi Is NOT
  {
    id: "not-1",
    category: "What shepi Is NOT",
    question: "Does shepi replace a formal Quality of Earnings report from a CPA firm?",
    answer:
      "shepi produces comprehensive QoE analysis from the same source data a CPA firm would use — trial balances, financial statements, and supporting documents. For transactions requiring CPA attestation (lender requirements, regulatory compliance), shepi accelerates that engagement by producing CPA-ready workpapers. The difference between shepi and a CPA firm isn't the analysis methodology — it's the attestation letter and professional liability coverage.",
  },
  {
    id: "not-2",
    category: "What shepi Is NOT",
    question: "Does shepi calculate final EBITDA or provide a valuation?",
    answer:
      "shepi helps you build an EBITDA bridge by tracking and categorizing your adjustments, but the final numbers reflect YOUR judgment, not ours. We don't calculate valuation multiples or opine on what a business is worth. Our role is to help you organize and document the analysis — the conclusions are yours.",
  },
  {
    id: "not-3",
    category: "What shepi Is NOT",
    question: "Can I show shepi output directly to lenders or investors?",
    answer:
      "Yes — shepi output is complete, professional-quality QoE analysis that exports to PDF and Excel for sharing. For investor presentations and internal decision-making, shepi delivers institutional-grade workpapers. If your lender specifically requires CPA-attested reports for financing, shepi provides the analytical foundation that accelerates that formal engagement.",
  },
  {
    id: "not-4",
    category: "What shepi Is NOT",
    question: "Does shepi certify or guarantee the accuracy of the analysis?",
    answer:
      "No. shepi structures your analysis and provides AI-powered suggestions, but every adjustment is entered and approved by you. We don't audit source documents, verify management representations, or certify results. The accuracy of your analysis depends on the quality of data you provide and the judgment calls you make.",
  },
  {
    id: "not-5",
    category: "What shepi Is NOT",
    question: "How reliable is shepi's analysis compared to what a CPA firm would produce?",
    answer:
      "shepi's methodology and spreadsheet structure were developed by an M&A professional with years of hands-on QoE experience. The workflow, adjustment categories, and output format mirror what you'd see from a quality accounting firm. For clean deals with good data and careful analysis, shepi produces results that are functionally equivalent to what a CPA firm would deliver. The difference isn't in methodology — it's in who signs off on it. That said, garbage in, garbage out. shepi is a tool that structures and accelerates your analysis — it doesn't fix bad data or substitute for sound judgment.",
  },

  // How It Works
  {
    id: "how-1",
    category: "How It Works",
    question: "What documents do I need to get started?",
    answer:
      "<p>Once you have access to the seller's data room (typically after LOI), you'll gather documents in three tiers:</p><p><strong>Required</strong> — You need these to begin: Detailed Trial Balance (QuickBooks export or Excel), Chart of Accounts, Bank Statements (covering full review period), General Ledger.</p><p><strong>Recommended</strong> — For a professional-grade analysis: AR & AP Aging Reports, Payroll Reports/Registers, Fixed Asset / Depreciation Schedule, Tax Returns (3 years), Journal Entries, Credit Card Statements, Customer & Vendor Lists, Inventory Records, Debt Schedule, Material Contracts & Lease Agreements.</p><p><strong>Optional</strong> — For verification & reference: Income Statements, Balance Sheets, Cash Flow Statements, CIM / Offering Memo.</p><p>Start with the Required documents — you can add Recommended and Optional items as you receive them.</p>",
  },
  {
    id: "how-2",
    category: "How It Works",
    question: "How many years of financial data are required?",
    answer:
      "shepi requires 3 full fiscal years of historical data plus the current year-to-date period. This enables proper trending analysis, LTM (Last Twelve Months) calculations, and year-over-year comparisons that lenders and buyers expect.",
  },
  {
    id: "how-3",
    category: "How It Works",
    question: "What file formats can I upload?",
    answer:
      "shepi is optimized for QuickBooks — the accounting system used by 80%+ of small businesses in the US. Connect directly to QuickBooks Online for automatic data import, or upload QuickBooks Desktop exports. We also accept PDF financial statements for AI extraction (tax returns, payroll reports, contracts, debt schedules) and standard Excel/CSV files for trial balance data.",
  },
  {
    id: "how-4",
    category: "How It Works",
    question: "Can I connect directly to QuickBooks?",
    answer:
      "Yes — QuickBooks is our primary integration since it powers the vast majority of small business accounting in the US. Connect your client's QuickBooks Online account, select the periods you need, and shepi imports trial balance, chart of accounts, and general ledger data automatically. No manual exports, no format issues.",
  },
  {
    id: "how-5",
    category: "How It Works",
    question: "How quickly can I complete an analysis?",
    answer:
      "Most users complete initial analysis in 2-4 hours vs. 40+ hours manually. The biggest time savings come from automatic account mapping (saves 8-12 hours), built-in calculations and reconciliations, and structured workflow that eliminates setup time. Your actual time depends on deal complexity and data quality, but expect 80-90% time reduction compared to building from scratch in Excel.",
  },
  {
    id: "how-6",
    category: "How It Works",
    question: "What do I get at the end?",
    answer:
      "A complete analysis package including: EBITDA bridge with categorized adjustments, multi-period income statement and balance sheet analysis, working capital analysis with DSO/DPO/DIO metrics, customer and vendor concentration analysis, documented adjustment rationales with proof attachments. Everything exports to a professional PDF report and Excel workbook for sharing with stakeholders, lenders, or advisors.",
  },
  {
    id: "how-7",
    category: "How It Works",
    question: "What role does AI actually play in shepi?",
    answer:
      "<p>AI in shepi serves four functions:</p><p><strong>Document Extraction</strong> — When you upload complex documents like tax returns (1040, 1120, 1120S, 1065), payroll reports, debt schedules, or material contracts, AI reads and extracts structured data automatically. No manual data entry required.</p><p><strong>Identification</strong> — AI scans your general ledger and bank transactions to surface potential adjustments (personal expenses, non-recurring items, related party transactions) for your review.</p><p><strong>Education</strong> — Explains QoE concepts, adjustment types, and industry norms in plain language so you understand the 'why' behind every step.</p><p><strong>Assistance</strong> — The QoE Assistant answers questions about your specific analysis in real-time, helping you understand what experienced analysts would look for.</p><p><strong>Important:</strong> AI never auto-generates adjustments or final numbers. Every adjustment is human-entered and human-approved. AI surfaces possibilities — you make the decisions.</p>",
  },
  {
    id: "how-8",
    category: "How It Works",
    question: "What happens if my financial data is messy or incomplete?",
    answer:
      "Real deals are messy — we get it. shepi will warn you about potential issues (missing periods, unbalanced accounts, incomplete trial balances) but won't block your progress. You can proceed with imperfect data and document your assumptions. The warnings help you know what to address, but you decide what's acceptable for your analysis.",
  },

  // Pricing & Value
  {
    id: "pricing-1",
    category: "Pricing & Value",
    question: `Why does shepi cost ${PERPROJECT} per project?`,
    answer: `Consider the alternatives: DIY in Excel with a junior analyst at $50-100/hour spending 40+ hours = $2,000-4,000 in labor; Outsourcing to a CPA firm for sell-side QoE runs $15,000-50,000+; With shepi, complete analysis in hours, not weeks, for ${PERPROJECT}. At ${PERPROJECT}, you're paying roughly $100-200/hour for the time you actually spend — but you're getting the structure, consistency, and AI assistance that would otherwise require an experienced analyst.`,
  },
  {
    id: "pricing-2",
    category: "Pricing & Value",
    question: "When should I choose per-project vs. monthly?",
    answer: `Per-project (${PERPROJECT}): Best if you're analyzing 1-4 deals and want to pay only for what you use. Monthly (${MONTHLY}): Best if you're actively searching and expect 5+ deals, or if you want the flexibility to revisit analyses without worrying about project limits.`,
  },
  {
    id: "pricing-3",
    category: "Pricing & Value",
    question: "Is there a free trial?",
    answer:
      "We don't currently offer a free trial, but we're confident in the value. If you complete an analysis and don't find it valuable, reach out to our team — we stand behind the product.",
  },

  // Who It's For
  {
    id: "who-1",
    category: "Who It's For",
    question: "Is shepi right for independent searchers doing their own diligence?",
    answer:
      "Yes — searchers are one of our primary users. shepi is designed for post-LOI due diligence, once the seller opens the data room and you have access to financials. With just the core documents (trial balance, chart of accounts, bank statements, and general ledger), you can start your analysis immediately and add supporting documents as they arrive. Use shepi to complete your analysis in hours instead of weeks, build professional EBITDA bridges with documented adjustments, identify red flags while you still have negotiating leverage, and create work product you can share with lenders or partners. For self-funded deals, this may be all the QoE you need. If your deal requires SBA or other lender financing, you'll likely still need formal QoE from a CPA firm — but having done the work in shepi puts you ahead and helps you catch issues early.",
  },
  {
    id: "who-2",
    category: "Who It's For",
    question: "Can I compare analysis across multiple deals?",
    answer:
      "Yes. Your dashboard shows all your projects with key metrics for quick comparison. While each analysis is independent, you can easily reference previous deals to calibrate your approach. Many searchers find this valuable for developing pattern recognition across similar businesses or industries.",
  },
  {
    id: "who-3",
    category: "Who It's For",
    question: "Does shepi handle industry-specific adjustments?",
    answer:
      "shepi's adjustment framework covers common categories across industries — owner compensation, one-time expenses, related party transactions, etc. The AI assistant understands industry-specific considerations (SaaS metrics, manufacturing working capital, healthcare reimbursement) and can guide you on what to look for. The structure is flexible enough to capture any adjustment type, and industry context helps the AI provide more relevant suggestions.",
  },
  {
    id: "who-4",
    category: "Who It's For",
    question: "Can accounting firms and advisors use shepi?",
    answer:
      "Absolutely. Firms use shepi to extend capacity without adding headcount, standardize QoE output across team members, accelerate sell-side QoE preparation, and train junior staff on QoE methodology. The Enterprise plan includes features specifically for teams: collaboration tools, custom templates, and volume pricing.",
  },
  {
    id: "who-5",
    category: "Who It's For",
    question: "Who should NOT use shepi?",
    answer:
      "shepi may not be right for you if: You need a CPA-certified QoE report (we don't provide certification); Your lender has specific QoE vendor requirements; You're looking for a valuation tool (we focus on earnings quality, not valuation); You want the AI to 'do it for you' (we assist, you decide).",
  },
];

/** Strip simple inline HTML so JSON-LD `text` stays plain. */
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|li|ul)>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a Schema.org FAQPage object from the FAQ array. */
export function buildFaqJsonLd(entries: FaqEntry[] = HOMEPAGE_FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(e.answer),
      },
    })),
  };
}

/** Group FAQ entries by `category`, preserving original order. */
export function groupFaqByCategory(entries: FaqEntry[] = HOMEPAGE_FAQ): Array<{
  category: string;
  items: FaqEntry[];
}> {
  const groups: Array<{ category: string; items: FaqEntry[] }> = [];
  for (const entry of entries) {
    let group = groups.find((g) => g.category === entry.category);
    if (!group) {
      group = { category: entry.category, items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }
  return groups;
}
