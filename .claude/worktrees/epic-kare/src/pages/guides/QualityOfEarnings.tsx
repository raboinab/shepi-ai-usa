import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "what-is-qoe", label: "What Is a QoE Report?" },
  { id: "why-qoe-matters", label: "Why QoE Matters" },
  { id: "when-you-need-one", label: "When You Need One" },
  { id: "components", label: "Key Components" },
  { id: "who-provides", label: "Who Provides QoE Reports" },
  { id: "process", label: "The QoE Process" },
  { id: "cost", label: "Cost & Timeline" },
  { id: "faq", label: "FAQ" },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Quality of Earnings report?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Quality of Earnings (QoE) report is a financial analysis that evaluates the sustainability and accuracy of a company's reported earnings. It identifies adjustments to EBITDA, analyzes revenue and expense trends, and provides buyers with a clearer picture of normalized, recurring earnings.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a Quality of Earnings report cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Traditional QoE reports from CPA firms cost $20,000–$100,000+ depending on deal size and complexity. AI-assisted platforms like Shepi offer professional-grade analysis starting at ${PRICING.perProject.display} per project, making QoE accessible for smaller deals.`,
      },
    },
    {
      "@type": "Question",
      name: "How long does a Quality of Earnings analysis take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional CPA firm QoE takes 4–8 weeks. AI-assisted tools can deliver initial analysis in 2–4 hours, with full analysis complete in days rather than weeks.",
      },
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is a Quality of Earnings Report? The Complete Guide",
  description: "Comprehensive guide to Quality of Earnings reports — what they are, why they matter in M&A, key components, who provides them, and how AI is changing QoE analysis.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/guides/quality-of-earnings",
};

export default function QualityOfEarnings() {
  return (
    <ContentPageLayout
      title="What Is a Quality of Earnings Report? The Complete Guide"
      seoTitle="What Is a Quality of Earnings Report? Complete QoE Guide | Shepi"
      seoDescription="Learn what a Quality of Earnings report is, why it matters in M&A transactions, key components, who provides QoE, costs, timelines, and how AI is transforming QoE analysis."
      canonical="https://shepi.ai/guides/quality-of-earnings"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Quality of Earnings Guide" },
      ]}
      toc={toc}
      jsonLd={{ ...articleSchema, ...faqSchema }}
      publishedDate="February 2026"
      modifiedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        The financial equivalent of a home inspection — what's behind the walls? A QoE report tells you whether the earnings you're buying are real, recurring, and sustainable.
      </HeroCallout>

      <StatRow stats={[
        { value: "$20K–$100K+", label: "Traditional CPA QoE cost" },
        { value: "2–4 hours", label: "AI-assisted initial analysis" },
        { value: PRICING.perProject.display, label: "Starting price per project" },
      ]} />

      <h2 id="what-is-qoe">What Is a Quality of Earnings Report?</h2>
      <p>
        A Quality of Earnings report is a detailed financial analysis that goes beyond the face value of a company's income statement to determine whether reported earnings are <strong>sustainable, recurring, and accurately stated</strong>. It's the financial equivalent of a home inspection before purchasing a property — you want to know what's behind the walls.
      </p>
      <p>
        At its core, a QoE analysis answers one fundamental question: <em>"If I buy this business, what earnings should I actually expect going forward?"</em>
      </p>
      <p>
        The report accomplishes this by identifying and categorizing adjustments to the company's reported EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization), resulting in an <strong>adjusted or normalized EBITDA</strong> figure that more accurately reflects the business's true earning power.
      </p>

      <h2 id="why-qoe-matters">Why Quality of Earnings Matters in M&A</h2>
      <p>
        In any acquisition, the purchase price is typically derived from a multiple of earnings — usually EBITDA. This means that every dollar of earnings misstatement is amplified by the valuation multiple. If EBITDA is overstated by $100,000 and the deal is priced at 5x EBITDA, the buyer overpays by $500,000.
      </p>

      <BenefitGrid benefits={[
        { title: "Validates reported earnings", description: "Confirms that revenue and expenses are accurately recorded" },
        { title: "Identifies non-recurring items", description: "One-time costs, unusual revenue, extraordinary events" },
        { title: "Normalizes owner expenses", description: "Above-market compensation, personal expenses run through the business" },
        { title: "Reveals accounting choices", description: "Aggressive revenue recognition, deferred maintenance, capitalization practices" },
        { title: "Quantifies working capital", description: "DSO, DPO, DIO trends and their impact on cash requirements" },
        { title: "Surfaces risks & red flags", description: "Customer concentration, related-party transactions, pending liabilities" },
      ]} />

      <h2 id="when-you-need-one">When Do You Need a Quality of Earnings Report?</h2>
      <BenefitGrid benefits={[
        { title: "Acquiring a business", description: "Whether a $500K SMB or a $500M enterprise" },
        { title: "Selling a business", description: "Sell-side QoE helps sellers control the narrative and accelerate timelines" },
        { title: "Securing financing", description: "Lenders and SBA require QoE to underwrite loans" },
        { title: "Evaluating deal terms", description: "Earnouts, seller notes, and equity rollovers depend on accurate earnings" },
        { title: "Screening targets", description: "Searchers and PE firms use QoE to quickly evaluate deal quality" },
      ]} />

      <h2 id="components">Key Components of a QoE Report</h2>
      <BenefitGrid benefits={[
        { title: "Adjusted EBITDA Bridge", description: "Starts with reported earnings and systematically adds or subtracts adjustments to arrive at normalized EBITDA." },
        { title: "Revenue Analysis", description: "Examines sustainability, customer concentration, pricing trends, and revenue recognition policies." },
        { title: "Expense Analysis", description: "Reviews COGS, operating expenses, and overhead to identify trends, anomalies, and misclassifications." },
        { title: "Working Capital Analysis", description: "Evaluates AR, inventory, AP, and other current items to determine normalized working capital needs." },
        { title: "Balance Sheet Review", description: "Examines unrecorded liabilities, asset quality, debt-like items, and off-balance-sheet obligations." },
      ]} />

      <h2 id="who-provides">Who Provides Quality of Earnings Reports?</h2>
      <p>Historically, QoE reports have been provided by:</p>
      <ul>
        <li><strong>Big 4 accounting firms</strong> — for large-cap and upper-middle-market transactions</li>
        <li><strong>Regional CPA firms</strong> with M&A practices — for mid-market and lower-middle-market deals</li>
        <li><strong>Boutique transaction advisory firms</strong> — specialized QoE providers for various deal sizes</li>
      </ul>
      <p>
        More recently, <strong>AI-assisted platforms like <Link to="/">Shepi</Link></strong> have emerged to democratize access to QoE analysis, enabling independent searchers, smaller PE firms, and deal advisors to conduct professional-grade analysis at a fraction of the traditional cost and timeline.
      </p>

      <h2 id="process">The Quality of Earnings Process</h2>
      <p>Whether conducted by a CPA firm or through an AI-assisted platform, the QoE process generally follows these steps:</p>
      <StepList steps={[
        { title: "Data gathering", description: "Collecting trial balances, financial statements, bank statements, tax returns, and supporting documents" },
        { title: "Account mapping", description: "Organizing chart of accounts data into standardized income statement and balance sheet formats" },
        { title: "Trend analysis", description: "Reviewing multi-period financial data for patterns, anomalies, and inconsistencies" },
        { title: "Adjustment identification", description: "Flagging items that require normalization and categorizing them" },
        { title: "Adjustment quantification", description: "Calculating the dollar impact of each adjustment with supporting documentation" },
        { title: "Working capital analysis", description: "Determining normalized working capital target and peg" },
        { title: "Report preparation", description: "Compiling findings into a clear, defensible format" },
      ]} />

      <h2 id="cost">Cost & Timeline</h2>
      <p>
        Traditional QoE reports from CPA firms typically cost <strong>$20,000–$100,000+</strong> and take <strong>4–8 weeks</strong> to complete. The cost depends on deal size, business complexity, data quality, and the firm's billing rates.
      </p>
      <p>
        AI-assisted platforms like Shepi can deliver initial analysis in <strong>2–4 hours</strong> at a starting price of <strong>{PRICING.perProject.display} per project</strong>, making QoE accessible for deals of all sizes. See our <Link to="/compare/ai-qoe-vs-traditional">AI QoE vs. Traditional comparison</Link> for a detailed breakdown.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is a Quality of Earnings report?", answer: "A Quality of Earnings report is a financial analysis that evaluates the sustainability and accuracy of a company's reported earnings. It identifies adjustments to EBITDA and provides buyers with a clearer picture of normalized, recurring earnings." },
        { question: "How much does a Quality of Earnings report cost?", answer: `Traditional reports cost $20,000–$100,000+. AI-assisted platforms like Shepi start at ${PRICING.perProject.display} per project.` },
        { question: "How long does a Quality of Earnings analysis take?", answer: "Traditional CPA firm QoE takes 4–8 weeks. AI-assisted tools deliver initial analysis in 2–4 hours." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments: Types, Examples & Best Practices" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist for M&A" },
        { to: "/guides/sell-side-vs-buy-side-qoe", label: "Sell-Side vs Buy-Side QoE" },
        { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report?" },
        { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE Analysis" },
      ]} />
    </ContentPageLayout>
  );
}
