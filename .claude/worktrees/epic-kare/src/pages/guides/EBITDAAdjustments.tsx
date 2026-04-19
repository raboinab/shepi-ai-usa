import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "what-are-adjustments", label: "What Are EBITDA Adjustments?" },
  { id: "categories", label: "Adjustment Categories" },
  { id: "common-examples", label: "Common Examples" },
  { id: "documentation", label: "How to Document" },
  { id: "red-flags", label: "Red Flags" },
  { id: "best-practices", label: "Best Practices" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EBITDA Adjustments: Types, Examples & Best Practices",
  description: "Comprehensive guide to EBITDA adjustments in QoE analysis — categories, common examples, documentation best practices, and red flags to watch for.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/guides/ebitda-adjustments",
};

export default function EBITDAAdjustments() {
  return (
    <ContentPageLayout
      title="EBITDA Adjustments: Types, Examples & Best Practices"
      seoTitle="EBITDA Adjustments Guide — Types, Examples & Best Practices | Shepi"
      seoDescription="Master EBITDA adjustments for Quality of Earnings analysis. Learn adjustment categories, common examples, documentation standards, and red flags in M&A due diligence."
      canonical="https://shepi.ai/guides/ebitda-adjustments"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "EBITDA Adjustments Guide" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      modifiedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        Every dollar of earnings misstatement is amplified by the valuation multiple. At 5x EBITDA, a $100K overstatement costs the buyer $500K.
      </HeroCallout>

      <p className="text-lg">
        EBITDA adjustments are the heart of every <Link to="/guides/quality-of-earnings">Quality of Earnings analysis</Link>. They transform reported earnings into <strong>normalized EBITDA</strong> — the figure that actually determines what a business is worth. Getting adjustments right (and documenting them properly) is the difference between a defensible analysis and a deal that falls apart in diligence.
      </p>

      <h2 id="what-are-adjustments">What Are EBITDA Adjustments?</h2>
      <p>
        EBITDA adjustments are modifications to a company's reported earnings that account for items that don't reflect the business's <strong>ongoing, normalized earning power</strong>. In M&A, the adjusted EBITDA figure is what buyers use to determine enterprise value — typically by applying a valuation multiple.
      </p>
      <p>
        Adjustments can increase or decrease EBITDA. An add-back (e.g., owner's above-market salary) increases adjusted EBITDA, while a subtraction (e.g., below-market rent from a related party) decreases it.
      </p>

      <h2 id="categories">EBITDA Adjustment Categories</h2>
      <p>Professional QoE analyses organize adjustments into standard categories:</p>

      <BenefitGrid benefits={[
        { title: "Owner / Seller Discretionary", description: "Above-market owner compensation, personal expenses, family members on payroll, owner-funded benefits" },
        { title: "Non-Recurring / One-Time", description: "Litigation settlements, disaster costs, one-time professional fees, COVID disruptions, insurance proceeds" },
        { title: "Pro Forma Adjustments", description: "Annualizing mid-period contracts, price increases, new hires/terminations, facility changes" },
        { title: "Related-Party Transactions", description: "Below/above-market rent, non-arm's-length services, management fees to holding companies" },
        { title: "Accounting Policy", description: "Revenue recognition timing, capitalization vs. expensing, inventory valuation, accrual vs. cash differences" },
      ]} />

      <h2 id="common-examples">Common EBITDA Adjustment Examples</h2>
      <p>Here are the adjustments that appear in nearly every QoE analysis:</p>
      <ul>
        <li><strong>Owner compensation normalization:</strong> Replace owner's actual compensation ($400K) with market-rate for a GM ($175K) = $225K add-back</li>
        <li><strong>One-time legal fees:</strong> $85K settlement and legal fees for a resolved lawsuit = $85K add-back</li>
        <li><strong>Related-party rent:</strong> Company pays $3K/month rent to owner; market rate is $5K = $24K subtraction (annual)</li>
        <li><strong>Personal vehicle expenses:</strong> Owner's personal vehicle lease, insurance, and fuel = $18K add-back</li>
        <li><strong>PPP loan forgiveness:</strong> $150K recognized as other income = $150K subtraction (non-recurring revenue)</li>
        <li><strong>New contract annualization:</strong> $500K contract signed in month 9 = pro forma to $500K full year revenue impact</li>
      </ul>

      <h2 id="documentation">How to Document EBITDA Adjustments</h2>
      <p>Every adjustment should include:</p>
      <StepList steps={[
        { title: "Description", description: "Clear explanation of what the adjustment is and why it's necessary" },
        { title: "Category", description: "Which type of adjustment (owner, non-recurring, pro forma, etc.)" },
        { title: "Amount", description: "The dollar impact on EBITDA for each period analyzed" },
        { title: "Direction", description: "Whether it's an add-back or subtraction" },
        { title: "Supporting evidence", description: "Source documents, calculations, third-party comparables" },
        { title: "Rationale", description: "Why a reasonable buyer would agree this adjustment is appropriate" },
      ]} />
      <p>
        <Link to="/features/ai-assistant">Shepi's AI assistant</Link> helps structure adjustment documentation and flags when supporting evidence is insufficient.
      </p>

      <h2 id="red-flags">Red Flags in EBITDA Adjustments</h2>
      <BenefitGrid benefits={[
        { title: "Adjustments exceed 30–40% of EBITDA", description: "Raises questions about the reliability of the underlying financials" },
        { title: '"Non-recurring" items that recur', description: "If legal fees or equipment repairs appear every year, they're recurring" },
        { title: "Missing documentation", description: "Adjustments without evidence are just assertions" },
        { title: "Aggressive revenue add-backs", description: 'Claiming lost revenue that "should have" occurred' },
        { title: "Inconsistent methodology", description: "Applying different standards across periods" },
        { title: "Round numbers everywhere", description: "Real adjustments rarely land on neat figures" },
      ]} />

      <h2 id="best-practices">Best Practices</h2>
      <BenefitGrid benefits={[
        { title: "Be conservative", description: "When in doubt, err on the side of not making an adjustment. Aggressive add-backs undermine credibility." },
        { title: "Use multiple periods", description: "Analyze 3+ years to identify trends and validate non-recurring claims." },
        { title: "Document everything", description: "If you can't support it, don't adjust for it." },
        { title: "Consider the buyer's perspective", description: "Would a reasonable buyer agree this adjustment is appropriate?" },
        { title: "Separate opinion from fact", description: "Clearly distinguish between adjustments based on hard evidence vs. judgment calls." },
        { title: "Use consistent categories", description: "Standardized taxonomy makes it easier to communicate findings to all deal parties." },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What's the difference between add-backs and adjustments?", answer: '"Add-backs" are a subset of adjustments that increase adjusted EBITDA. Not all adjustments are add-backs — some reduce EBITDA (e.g., below-market related-party rent).' },
        { question: "How many adjustments are normal in a QoE?", answer: "There's no fixed number. A clean business might have 5–10 adjustments; a complex one could have 30+. The key is that each adjustment is justified and documented." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
        { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE" },
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
      ]} />
    </ContentPageLayout>
  );
}
