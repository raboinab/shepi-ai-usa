import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "what-lenders-need", label: "What SBA Lenders Need" },
  { id: "deliverables", label: "Deliverables" },
  { id: "timeline", label: "Timeline" },
  { id: "vs-traditional", label: "Shepi vs Traditional QoE" },
  { id: "faq", label: "FAQ" },
];

const faqItems = [
  {
    question: "Do SBA 7(a) lenders accept a Shepi QoE?",
    answer: "Lenders evaluate the underlying analysis, not the logo on the cover. Shepi outputs the standard QoE deliverables — adjusted EBITDA bridge, working-capital schedule, GL anomaly review, revenue quality — in formats lenders are used to seeing. Many lenders are comfortable underwriting on a Shepi analysis paired with tax returns. For deals where the lender requires CPA attestation, Shepi is analytical software and does not issue attestation opinions.",
  },
  {
    question: "How fast can I get a QoE for an SBA loan submission?",
    answer: "Shepi can produce a lender-ready EBITDA bridge and working-capital schedule within 24–48 hours of receiving trial balances. Traditional QoE engagements take 4–8 weeks, which is often a binding constraint on closing timelines.",
  },
  {
    question: "What's the cost difference?",
    answer: `Traditional CPA QoE for an SBA-financed acquisition typically runs $25,000–$50,000. Shepi starts at ${PRICING.perProject.display} per project. Done-For-You with CPA-led review of the adjustments is ${PRICING.doneForYou.display}.`,
  },
  {
    question: "Can the borrower run Shepi or does it have to be the lender?",
    answer: "Either. Many of our SBA-channel deals start with the borrower (searcher, buyer) running the initial analysis and sharing the workbook with their lender. The lender then reviews and may run their own scenarios. Shepi outputs are designed to be shareable.",
  },
  {
    question: "What about SBA SOP requirements?",
    answer: "SBA SOP 50 10 requires lenders to validate seller-reported cash flow and EBITDA for acquisition loans. Shepi's GL-level review, EBITDA adjustments with audit trail, and working-capital analysis directly support that validation — without you waiting weeks for a third-party engagement.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings for SBA Loans",
  description: "How Shepi accelerates QoE analysis for SBA 7(a) acquisition financing — EBITDA bridge, working-capital, GL review in 24–48 hours.",
  url: "https://shepi.ai/sba-loan-qoe",
  author: { "@type": "Organization", name: "shepi" },
};

export default function SbaLoanQoe() {
  return (
    <ContentPageLayout
      title="Quality of Earnings for SBA Loans"
      seoTitle="Quality of Earnings for SBA Loans | SBA 7(a) QoE | Shepi"
      seoDescription="Lender-ready QoE for SBA 7(a) acquisition loans. EBITDA bridge, working-capital schedule, and GL review in 24–48 hours instead of 4–8 weeks."
      canonical="https://shepi.ai/sba-loan-qoe"
      breadcrumbs={[
        { label: "Use Cases", href: "/use-cases/lenders" },
        { label: "QoE for SBA Loans" },
      ]}
      toc={toc}
      jsonLd={[articleSchema, faqSchema]}
      heroAccent
    >
      <HeroCallout>
        SBA acquisition lending lives or dies on the timeline to close. Shepi compresses the QoE phase from 4–8 weeks to 24–48 hours, with deliverables in the format SBA underwriting expects.
      </HeroCallout>

      <StatRow stats={[
        { value: "24–48 hrs", label: "Lender-ready output" },
        { value: PRICING.perProject.display, label: "Per project" },
        { value: "100%", label: "GL coverage" },
      ]} />

      <h2 id="what-lenders-need">What SBA Lenders Need from a QoE</h2>
      <p>
        SBA SOP 50 10 requires lenders on acquisition loans to independently validate the seller's reported earnings — they can't underwrite on the seller's word. In practice, this means a Quality of Earnings analysis that establishes:
      </p>
      <BenefitGrid benefits={[
        { title: "Adjusted EBITDA", description: "Reported EBITDA bridged to a defensible adjusted figure, with each add-back categorized and supported" },
        { title: "Revenue quality", description: "Recurring vs project revenue, customer concentration, AR aging, trend stability" },
        { title: "Working-capital peg", description: "Multi-period NWC build with turnover ratios and a normalized peg for the close" },
        { title: "Cash proof", description: "GL-to-bank reconciliation that surfaces unrecorded liabilities or commingled expenses" },
        { title: "Anomaly review", description: "Round-dollar entries, period-end clustering, duplicate detection across 100% of the GL" },
        { title: "Owner add-back support", description: "Personal expenses, owner compensation normalization, related-party transactions — each with source detail" },
      ]} />

      <h2 id="deliverables">Lender-Ready Deliverables</h2>
      <p>
        Shepi exports a PDF QoE report and a structured Excel workbook with every supporting schedule. The Excel ties out to the GL, so underwriting can drill into any adjustment without bouncing emails back and forth.
      </p>

      <h2 id="timeline">Timeline</h2>
      <ComparisonTable
        headers={["Phase", "Traditional CPA QoE", "Shepi"]}
        rows={[
          ["Engagement letter / kickoff", "1–2 weeks", "Same day"],
          ["Data ingestion & mapping", "1–2 weeks", "Hours"],
          ["Analysis & adjustments", "2–3 weeks", "Same day after ingestion"],
          ["Draft report", "1 week", "Same day"],
          ["Total", "4–8 weeks", "24–48 hours"],
        ]}
      />

      <h2 id="vs-traditional">Shepi vs Traditional QoE for SBA Deals</h2>
      <ComparisonTable
        headers={["Dimension", "Traditional CPA QoE", "Shepi"]}
        rows={[
          ["Cost", "$25,000–$50,000", `${PRICING.perProject.display}–${PRICING.doneForYou.display}`],
          ["Timeline impact on closing", "Often gating", "Removes the constraint"],
          ["Re-runs after data corrections", "Bill again", "Included"],
          ["Lender review workbook", "PDF + custom Excel", "PDF + structured Excel with GL traceability"],
          ["Attestation opinion", "Available", "Not offered — analysis only"],
        ]}
      />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={faqItems} />

      <h2>Related</h2>
      <RelatedResourceCards links={[
        { to: "/use-cases/lenders", label: "Shepi for Lenders" },
        { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
        { to: "/guides/working-capital-analysis", label: "Working Capital Analysis" },
        { to: "/guides/cash-proof-analysis", label: "Proof of Cash" },
      ]} />
    </ContentPageLayout>
  );
}
