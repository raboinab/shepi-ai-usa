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
  { id: "challenge", label: "The Searcher's Challenge" },
  { id: "why-qoe", label: "Why Searchers Need QoE" },
  { id: "cost-barrier", label: "The Cost Barrier" },
  { id: "shepi-workflow", label: "How Shepi Fits" },
  { id: "use-cases", label: "Searcher Use Cases" },
  { id: "when-cpa", label: "When You Still Need a CPA" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE Analysis for Independent Searchers & ETA",
  description: "How independent searchers and ETA professionals use AI-assisted Quality of Earnings analysis to screen deals faster, reduce costs, and make better acquisition decisions.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/independent-searchers",
};

export default function IndependentSearchers() {
  return (
    <ContentPageLayout
      title="QoE Analysis for Independent Searchers & ETA"
      seoTitle="Quality of Earnings for Independent Searchers & ETA | Shepi"
      seoDescription="How independent searchers and ETA professionals use AI-assisted QoE to screen deals faster, reduce diligence costs, and build confidence in acquisition decisions."
      canonical="https://shepi.ai/use-cases/independent-searchers"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Independent Searchers" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        Review 50 deals to close one — you can't spend $50K on QoE for every opportunity.
      </HeroCallout>

      <StatRow stats={[
        { value: "$20K–$60K", label: "Traditional QoE cost" },
        { value: PRICING.perProject.display, label: "Per project with Shepi" },
        { value: "2–4 hours", label: "Initial analysis time" },
      ]} />

      <p className="text-lg">
        Independent searchers face a unique dilemma: you need professional-quality financial analysis to make confident acquisition decisions, but you're working with limited capital and often evaluating multiple deals simultaneously. Traditional QoE reports are priced for institutional buyers — not for searchers who might review 50 deals to close one.
      </p>

      <h2 id="challenge">The Searcher's Challenge</h2>
      <p>
        Entrepreneurship Through Acquisition (ETA) has grown dramatically, with thousands of independent searchers actively looking for businesses to acquire. But the due diligence process hasn't evolved to match this new buyer profile.
      </p>

      <BenefitGrid benefits={[
        { title: "High volume, low conversion", description: "Reviewing 30–100 deals to close one means you can't spend $50K on QoE for every opportunity" },
        { title: "Self-funded diligence", description: "Unlike PE-backed buyers, searchers bear the cost of failed diligence themselves" },
        { title: "Limited M&A experience", description: "Many first-time buyers need guidance on what to look for" },
        { title: "Time pressure", description: "Sellers and brokers expect responsiveness; slow diligence kills deals" },
        { title: "Lender requirements", description: "SBA and other lenders increasingly require formal QoE, adding to costs" },
      ]} />

      <h2 id="why-qoe">Why Searchers Need Quality of Earnings</h2>
      <p>Without QoE analysis, you're relying on the seller's financials at face value. This is risky because:</p>
      <BenefitGrid benefits={[
        { title: "Overstated add-backs", description: "Owner add-backs may be overstated or fabricated" },
        { title: "Unsustainable revenue", description: "Revenue may include non-recurring or unsustainable items" },
        { title: "Hidden cash needs", description: "Working capital requirements may be understated, meaning more cash at closing" },
        { title: "Hidden liabilities", description: "Off-balance-sheet obligations or aggressive accounting may mask true performance" },
      ]} />

      <h2 id="cost-barrier">The Cost Barrier</h2>
      <p>
        Traditional QoE from a CPA firm costs $20,000+ for a small business acquisition. For a searcher evaluating a $2M deal, that's 1–3% of enterprise value — a significant cost when the deal might not close. This creates two bad outcomes:
      </p>
      <BenefitGrid benefits={[
        { title: "Skipping QoE entirely", description: "Proceeding without proper analysis and hoping for the best" },
        { title: "DIY in Excel", description: "Building ad-hoc spreadsheets without the structure or guidance of a professional analysis" },
      ]} />

      <h2 id="shepi-workflow">How Shepi Fits the Searcher Workflow</h2>
      <StepList steps={[
        { title: "Deal Screening (LOI Stage)", description: "Upload the seller's financials and get a structured analysis in hours, not weeks. Quickly identify whether earnings are real and sustainable before signing an LOI." },
        { title: "Due Diligence (Post-LOI)", description: "Deep-dive into multi-period analysis, build your EBITDA adjustment bridge, analyze working capital, and document findings professionally." },
        { title: "Negotiation Support", description: "Use documented analysis to negotiate the purchase price, working capital targets, and deal terms with credibility." },
      ]} />

      <h2 id="use-cases">Specific Searcher Use Cases</h2>
      <BenefitGrid benefits={[
        { title: "Self-funded searchers", description: "Minimize diligence costs while maintaining professional standards" },
        { title: "Funded searchers", description: "Accelerate analysis to review more deals within your search window" },
        { title: "Search fund principals", description: "Provide institutional-quality analysis to your investor base" },
        { title: "First-time buyers", description: "Shepi's AI assistant provides guidance on what to look for and how to interpret findings" },
      ]} />

      <h2 id="when-cpa">When You Still Need a CPA Firm</h2>
      <p>Shepi accelerates and structures your analysis, but some situations still call for a formal CPA engagement:</p>
      <BenefitGrid benefits={[
        { title: "SBA loan requirements", description: "Many lenders require QoE from an independent CPA firm" },
        { title: "Complex accounting issues", description: "Revenue recognition, construction accounting, or multi-entity consolidation" },
        { title: "Investor requirements", description: "Some investors mandate third-party QoE as a condition of funding" },
      ]} />
      <p>
        Even in these cases, Shepi serves as the analytical foundation — your CPA firm can use Shepi's workpapers as a starting point, significantly reducing their engagement time and your cost.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Can I share Shepi analysis with my lender?", answer: "Yes — Shepi exports to professional-format PDF reports and Excel workbooks suitable for lender review. If your lender requires CPA-attested QoE specifically, Shepi's output accelerates that engagement." },
        { question: "How many deals can I analyze per month?", answer: "With a monthly subscription, you can analyze unlimited deals — perfect for active searchers evaluating multiple opportunities." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" },
      ]} />
    </ContentPageLayout>
  );
}
