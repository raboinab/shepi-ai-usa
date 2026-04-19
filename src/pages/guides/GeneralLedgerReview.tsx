import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Why Review the GL?" },
  { id: "anomaly-detection", label: "Anomaly Detection" },
  { id: "journal-entries", label: "Unusual Journal Entries" },
  { id: "personal-expenses", label: "Personal Expense Detection" },
  { id: "related-party", label: "Related Party Transactions" },
  { id: "reclassification", label: "Account Reclassification" },
  { id: "process", label: "GL Review Process" },
  { id: "ai-advantage", label: "AI-Powered GL Review" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "General Ledger Review for M&A Due Diligence",
  description: "How to review a general ledger during acquisitions — anomaly detection, unusual journal entries, personal expense identification, related party transactions, and AI-powered GL analysis.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/general-ledger-review",
};

export default function GeneralLedgerReview() {
  return (
    <ContentPageLayout
      title="General Ledger Review for M&A Due Diligence"
      seoTitle="General Ledger Review — Anomaly Detection, Journal Entries & AI Analysis | Shepi"
      seoDescription="Master GL-level due diligence: anomaly detection, unusual journal entries, personal expense identification, related party transactions, and how AI accelerates GL review."
      canonical="https://shepi.ai/guides/general-ledger-review"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "General Ledger Review" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        The general ledger is where the truth lives. Every adjustment, every add-back, and every red flag starts with a transaction in the GL.
      </HeroCallout>

      <StatRow stats={[
        { value: "10,000+", label: "Typical GL transactions per year (SMB)" },
        { value: "5–15%", label: "Transactions that typically warrant review" },
        { value: "Hours vs weeks", label: "AI review vs manual review time" },
      ]} />

      <h2 id="overview">Why Review the General Ledger?</h2>
      <p>
        Financial statements summarize; the general ledger tells the full story. During <Link to="/guides/quality-of-earnings">QoE analysis</Link>, the GL is the source of truth for identifying:
      </p>
      <BenefitGrid benefits={[
        { title: "Hidden add-backs", description: "Personal expenses, one-time costs, and discretionary spending buried in operating accounts" },
        { title: "Misclassifications", description: "Revenue coded as other income, COGS mixed with operating expenses, capital expenditures expensed" },
        { title: "Manipulation signals", description: "Round-dollar entries, end-of-period journal entries, unusual vendor payments" },
        { title: "Completeness gaps", description: "Missing accruals, unrecorded liabilities, off-books transactions" },
      ]} />

      <h2 id="anomaly-detection">Anomaly Detection Techniques</h2>
      <BenefitGrid benefits={[
        { title: "Round-dollar analysis", description: "Transactions in round amounts ($5,000, $10,000) may indicate estimates rather than actual transactions — flag for review" },
        { title: "Benford's Law", description: "The first-digit distribution of transaction amounts should follow a predictable pattern — deviations suggest data manipulation" },
        { title: "Duplicate detection", description: "Same amount, same vendor, same date — potential duplicate payments that inflate expenses" },
        { title: "Threshold analysis", description: "Transactions just below approval thresholds suggest deliberate structuring to avoid oversight" },
        { title: "Period-end clustering", description: "Unusual concentration of entries in the last days of a period may indicate earnings management" },
        { title: "Variance from average", description: "Individual transactions significantly larger than the account average warrant investigation" },
      ]} />

      <h2 id="journal-entries">Unusual Journal Entries</h2>
      <p>
        Journal entries — especially manual ones — are a primary tool for earnings manipulation. Focus on:
      </p>
      <BenefitGrid benefits={[
        { title: "Manual entries", description: "Entries not generated by the accounting system's normal processes" },
        { title: "Top-side entries", description: "Adjustments made after the trial balance is pulled — often for 'corrections'" },
        { title: "Revenue-affecting entries", description: "JEs that credit revenue accounts outside the normal billing process" },
        { title: "Round amounts", description: "Large round-dollar JEs suggest estimates or manual overrides" },
        { title: "Off-hours entries", description: "Entries posted on weekends, holidays, or outside business hours" },
        { title: "Missing descriptions", description: "JEs without adequate descriptions may be hiding their purpose" },
      ]} />

      <h2 id="personal-expenses">Personal Expense Detection</h2>
      <p>
        In owner-operated businesses, personal expenses running through the company are one of the most common <Link to="/guides/ebitda-adjustments">EBITDA add-backs</Link>. Common keywords and patterns to search for:
      </p>
      <BenefitGrid benefits={[
        { title: "Travel & entertainment", description: "Vacation travel, family dinners, sporting events, personal memberships" },
        { title: "Vehicle expenses", description: "Personal vehicle payments, fuel for non-business use, luxury vehicles" },
        { title: "Insurance", description: "Personal life insurance, health insurance for non-employees, umbrella policies" },
        { title: "Professional services", description: "Personal legal fees, financial planning, estate planning" },
        { title: "Retail & online purchases", description: "Amazon, retail stores, personal subscriptions coded as business expenses" },
        { title: "ATM & cash withdrawals", description: "Cash withdrawals with no business purpose documentation" },
      ]} />

      <h2 id="related-party">Related Party Transactions</h2>
      <p>
        Related party transactions are not inherently problematic, but they require scrutiny because they may not be at arm's length:
      </p>
      <BenefitGrid benefits={[
        { title: "Below-market rent", description: "Company leasing property from the owner at below-market rates — creates a pro forma adjustment" },
        { title: "Management fees", description: "Fees paid to related entities for services that may not be necessary post-acquisition" },
        { title: "Vendor relationships", description: "Suppliers owned by the seller's family — verify pricing is competitive" },
        { title: "Intercompany charges", description: "Shared services, cost allocations, and transfers between related entities" },
      ]} />

      <h2 id="reclassification">Account Reclassification</h2>
      <BenefitGrid benefits={[
        { title: "COGS vs OpEx", description: "Direct costs misclassified as operating expenses (or vice versa) distort gross margin" },
        { title: "CapEx vs expense", description: "Capital expenditures expensed inflate operating costs; repairs capitalized understate them" },
        { title: "Revenue classification", description: "Operating revenue vs other income — impacts core earnings analysis" },
        { title: "Below-the-line items", description: "Ensure non-operating items are properly separated from operating results" },
      ]} />

      <h2 id="process">GL Review Process</h2>
      <StepList steps={[
        { title: "Export the complete GL", description: "Get the full general ledger with all fields: date, account, amount, description, vendor, entry type" },
        { title: "Profile the data", description: "Count transactions, identify accounts with highest volume, flag accounts with unusual activity" },
        { title: "Run anomaly scans", description: "Apply round-dollar, duplicate, threshold, and period-end clustering tests" },
        { title: "Keyword search", description: "Search transaction descriptions for personal expense indicators" },
        { title: "Review large transactions", description: "Examine all transactions above a materiality threshold" },
        { title: "Analyze journal entries", description: "Focus on manual, top-side, and round-dollar journal entries" },
        { title: "Quantify adjustments", description: "Calculate the EBITDA impact of identified items" },
      ]} />

      <h2 id="ai-advantage">AI-Powered GL Review</h2>
      <p>
        Traditional GL review means an analyst manually scanning thousands of transactions. AI changes the equation:
      </p>
      <BenefitGrid benefits={[
        { title: "Pattern recognition", description: "AI identifies anomalous patterns across the entire ledger simultaneously" },
        { title: "Keyword intelligence", description: "Natural language processing catches variations human searchers miss" },
        { title: "Continuous learning", description: "Each review improves the detection of industry-specific patterns" },
        { title: "Comprehensive coverage", description: "Every transaction reviewed — not just a sample" },
      ]} />
      <p>
        Learn more about how <Link to="/features/ai-assistant">Shepi's AI assistant</Link> accelerates GL-level analysis.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "How long does a manual GL review take?", answer: "For a typical SMB with 10,000-50,000 annual transactions, a thorough manual GL review takes 2-4 weeks. AI-assisted review can complete initial flagging in hours." },
        { question: "What percentage of GL transactions typically need review?", answer: "In a typical SMB acquisition, 5-15% of transactions warrant closer examination. AI helps identify this subset quickly, so analysts can focus their expertise where it matters." },
        { question: "Can AI replace human judgment in GL review?", answer: "No. AI excels at pattern detection and flagging, but determining whether a flagged transaction is truly an adjustment requires professional judgment, business context, and deal-specific considerations." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/personal-expense-detection", label: "Personal Expense Detection" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" },
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
      ]} />
    </ContentPageLayout>
  );
}
