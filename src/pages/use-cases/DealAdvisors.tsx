import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "sell-side-qoe", label: "Sell-Side QoE" },
  { id: "why-advisors", label: "Why Advisors Need QoE" },
  { id: "winning-mandates", label: "Winning Mandates" },
  { id: "workflow", label: "Advisor Workflow" },
  { id: "value-prop", label: "Value to Clients" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sell-Side QoE for M&A Advisors & Investment Bankers",
  description: "How M&A advisors and investment bankers use AI-assisted QoE to prepare sellers, accelerate deals, and differentiate their advisory practice.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/deal-advisors",
};

export default function DealAdvisors() {
  return (
    <ContentPageLayout
      title="Sell-Side QoE for M&A Advisors & Investment Bankers"
      seoTitle="Sell-Side QoE for M&A Advisors & Investment Bankers | Shepi"
      seoDescription="How M&A advisors use AI-assisted Quality of Earnings to prepare sellers, control the narrative, accelerate deal timelines, and differentiate their practice."
      canonical="https://shepi.ai/use-cases/deal-advisors"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Deal Advisors" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        Control the narrative — don't let the buyer's QoE tell the story.
      </HeroCallout>

      <p className="text-lg">
        Sell-side Quality of Earnings — also called vendor due diligence (VDD) — is becoming a competitive advantage for M&A advisors. By preparing a QoE report before going to market, advisors help sellers control the narrative, accelerate deal timelines, and demonstrate professionalism that wins mandates.
      </p>

      <h2 id="sell-side-qoe">What Is Sell-Side QoE?</h2>
      <p>
        Sell-side QoE is a <Link to="/guides/quality-of-earnings">Quality of Earnings analysis</Link> commissioned by the seller (or their advisor) before the business goes to market. Instead of waiting for the buyer's QoE to surface issues, the seller proactively identifies and addresses adjustments, provides clean documentation, and sets realistic earnings expectations.
      </p>
      <BenefitGrid benefits={[
        { title: "Controlled narrative", description: "Frame the story around normalized earnings rather than reacting to buyer's findings" },
        { title: "Faster deal timelines", description: "Buy-side diligence is shorter when key analysis is already available" },
        { title: "Fewer surprises", description: "Issues surface early, giving time to address them before they become deal-killers" },
        { title: "Higher valuations", description: "Well-documented adjustments and clean financials increase buyer confidence" },
      ]} />

      <h2 id="why-advisors">Why Advisors Should Offer QoE</h2>
      <BenefitGrid benefits={[
        { title: "Mandate differentiation", description: "Show sellers you're more than a matchmaker — you prepare them for diligence" },
        { title: "Better pricing outcomes", description: "Documented earnings lead to more confident buyers and stronger offers" },
        { title: "Reduced deal risk", description: "Fewer retrades and broken deals when financials are pre-analyzed" },
        { title: "Revenue opportunity", description: "Offer QoE as a value-added service, bundled with advisory or as standalone" },
      ]} />

      <h2 id="winning-mandates">Winning Mandates with QoE</h2>
      <p>
        When pitching for sell-side mandates, advisors who can say "we'll prepare a preliminary QoE to maximize your value and minimize diligence risk" have a compelling advantage. Shepi makes this feasible by reducing the cost and time required to produce that analysis.
      </p>

      <h2 id="workflow">Advisor Workflow with Shepi</h2>
      <StepList steps={[
        { title: "Pre-engagement", description: "Use Shepi to quickly assess a prospect's financials before accepting the mandate" },
        { title: "Seller preparation", description: "Build the QoE analysis, identify adjustments, and work with the seller to gather supporting documentation" },
        { title: "Marketing materials", description: "Incorporate key QoE findings into the CIM and management presentation" },
        { title: "Data room", description: "Include the QoE analysis as part of the buyer diligence package" },
        { title: "Buyer Q&A", description: "Use the analysis as a reference point for responding to buyer diligence questions" },
      ]} />

      <h2 id="value-prop">Value to Your Clients</h2>
      <BenefitGrid benefits={[
        { title: "Lower diligence costs", description: "When buyers can rely on sell-side QoE, their own diligence is faster and cheaper" },
        { title: "Faster close", description: "Deals close weeks sooner when financial analysis is pre-packaged" },
        { title: "Negotiation leverage", description: "Documented, defensible earnings give sellers stronger standing at the table" },
        { title: "Professionalism", description: "Institutional-quality analysis demonstrates the seller and advisor take the process seriously" },
      ]} />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Can I white-label Shepi's output for my clients?", answer: "Shepi exports to PDF and Excel, which you can customize with your firm's branding and formatting before sharing with clients or buyers." },
        { question: "How does sell-side QoE affect deal timeline?", answer: "Sell-side QoE can compress diligence by 2–4 weeks since buyers start from structured analysis rather than building from scratch. This reduces deal risk and keeps timelines on track." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/use-cases/pe-firms", label: "QoE for PE Firms" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" },
      ]} />
    </ContentPageLayout>
  );
}
