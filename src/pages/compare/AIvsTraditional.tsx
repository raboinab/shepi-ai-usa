import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "three-options", label: "Three Options" },
  { id: "cost-comparison", label: "Side-by-Side" },
  { id: "speed", label: "Speed & Timeline" },
  { id: "when-to-use", label: "When to Use Each" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "shepi DIY vs. shepi DFY vs. Traditional CPA Firm QoE",
  description: "Honest three-way comparison of shepi's self-serve software, shepi's matched-CPA Done-For-You tier, and a traditional CPA firm engagement — cost, speed, attestation, liability, and lender acceptance.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-05-17",
  mainEntityOfPage: "https://shepi.ai/compare/ai-qoe-vs-traditional",
};

export default function AIvsTraditional() {
  return (
    <ContentPageLayout
      title="shepi DIY vs. shepi DFY vs. Traditional CPA Firm"
      seoTitle="shepi DIY vs. DFY vs. Traditional CPA Firm — Honest QoE Comparison | Shepi"
      seoDescription="Three ways to get a Quality of Earnings analysis: shepi DIY ($2,000 software), shepi DFY ($4,000 matched-CPA-signed), or a traditional CPA firm ($20K+). Compare cost, speed, attestation, and liability."
      canonical="https://shepi.ai/compare/ai-qoe-vs-traditional"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "shepi DIY vs. DFY vs. Traditional" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="May 2026"
      heroAccent
    >
      <HeroCallout>
        There are now three real ways to get a QoE. They serve different deal sizes, budgets, and risk profiles.
      </HeroCallout>

      <p className="text-lg">
        Quality of Earnings analysis used to be a binary choice: do it yourself in Excel, or hire a CPA firm. shepi added a software option, and now a Done-For-You tier where a matched, licensed CPA signs the deliverable. Here's how the three stack up.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        <Link to="/guides/quality-of-earnings">Quality of Earnings</Link> work spans a spectrum — from a buyer kicking the tires pre-LOI to a lender-mandated, firm-attested report on a $50M deal. The right tool depends on where your deal sits on that spectrum.
      </p>

      <h2 id="three-options">The Three Options</h2>
      <BenefitGrid benefits={[
        { title: "shepi DIY — $2,000 / project", description: "Self-serve software. You upload data, the platform structures the workflow, you apply judgment and produce the workbook. 2–4 hours of your time." },
        { title: "shepi DFY — $4,000 / project", description: "A licensed CPA from the shepi Network is matched to your deal in 1–2 business days, prepares the QoE end-to-end on our software, and signs the deliverable in their professional capacity." },
        { title: "Traditional CPA Firm — $20,000+", description: "Full engagement with an accounting firm. Includes management interviews, independent verification, firm letterhead, and firm-level E&O. 4+ weeks from kickoff." },
      ]} />

      <h2 id="cost-comparison">Side-by-Side</h2>
      <ComparisonTable
        headers={["Factor", "shepi DIY", "shepi DFY", "Traditional CPA Firm"]}
        rows={[
          ["Cost per project", "$2,000", "$4,000", "$20,000+"],
          ["Timeline", "2–4 hours of work", "48–72 hours from match", "4+ weeks"],
          ["Professional attestation", "No", "Yes (CPA-signed)", "Yes"],
          ["Liability coverage", "No", "Yes (shepi E&O umbrella + CPA's professional standing)", "Yes (firm's E&O)"],
          ["Lender acceptance", "Varies", "Generally accepted with CPA signature", "Generally accepted"],
          ["Management interviews", "Not included", "Not included by default; available as upgrade", "Included"],
          ["Who does the work", "You", "Matched licensed CPA, on shepi software", "Firm staff"],
          ["Deliverable letterhead", "Your branding", "CPA letterhead", "Firm letterhead"],
        ]}
      />

      <h2 id="speed">Speed & Timeline</h2>
      <p>
        DIY is the fastest path to <em>some</em> answer — a few hours of your own work. DFY trades a couple of days for a CPA-signed deliverable: 1–2 business days to get matched, then 48–72 hours once the CPA has what they need. A traditional firm engagement runs 4+ weeks from kickoff and often longer in busy season, which can put deals at risk in competitive auctions.
      </p>

      <h2 id="when-to-use">When to Use Each Approach</h2>
      <BenefitGrid benefits={[
        { title: "DIY for screening pre-LOI", description: "You're deciding whether to pursue a deal and need fast directional analysis you control end-to-end." },
        { title: "DIY for analysts who do this often", description: "You have the chops and just want better tooling than Excel templates." },
        { title: "DFY for SBA and most lender financing", description: "You need a CPA's name on the report but the deal economics don't justify a $20K+ firm engagement." },
        { title: "DFY for searchers and brokers", description: "Closing a deal and want a real CPA's professional accountability without the four-week wait." },
        { title: "Traditional firm for $10M+ EV deals", description: "A $20K–$50K QoE is immaterial relative to deal size, and you want full management interviews and independent verification." },
        { title: "Traditional firm for regulatory or board mandates", description: "Specific firm requirements, complex accounting issues, litigation exposure, or board/investor mandates." },
      ]} />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Is shepi DFY the same as a Big 4 audit?", answer: "No. DFY is a consulting engagement under AICPA SSCS-100, signed by a licensed CPA in their professional capacity. It is not an attestation engagement. For SMB and lower-mid-market M&A, this is what most lenders, buyers, and brokers want — a real CPA standing behind real work, faster and cheaper than a traditional firm engagement." },
        { question: "Can I start with DIY and upgrade to DFY?", answer: "Yes. Many users screen deals with DIY pre-LOI and upgrade to DFY once a deal is real. Your DIY workbook becomes the starting point for the matched CPA, which is why DFY can turn around in 48–72 hours instead of weeks." },
        { question: "Will DFY replace traditional CPA firm engagements?", answer: "Not for every situation. Large deals, regulated industries, and engagements requiring firm-level attestation or full management interviews still call for a traditional firm. DFY fits the large middle of the market where firm pricing didn't pencil but a pure software output isn't enough." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/pricing", label: "Compare shepi DIY and DFY pricing" },
        { to: "/compare/shepi-vs-excel", label: "shepi vs. Excel" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/use-cases/deal-advisors", label: "QoE for Deal Advisors" },
      ]} />
    </ContentPageLayout>
  );
}
