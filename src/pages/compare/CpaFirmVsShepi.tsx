import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "the-choice", label: "The Choice" },
  { id: "side-by-side", label: "Side-by-Side" },
  { id: "when-cpa-firm", label: "When to Pick a CPA Firm" },
  { id: "when-shepi", label: "When to Pick Shepi" },
  { id: "hybrid", label: "The Hybrid Path" },
  { id: "faq", label: "FAQ" },
];

const faqItems = [
  {
    question: "What's the best QoE provider for an ETA buyer?",
    answer: `It depends on the deal stage. Pre-LOI screening: Shepi at ${PRICING.perProject.display} makes a real QoE economically viable where a $30K CPA engagement is not. During exclusivity on a lender-required formal QoE: a CPA firm or Shepi DFY (${PRICING.doneForYou.display}, includes CPA review of adjustments). For most ETA buyers, the hybrid is: screen with Shepi, then escalate to CPA review only if the deal advances and the lender requires it.`,
  },
  {
    question: "Why are CPA firms so expensive for QoE?",
    answer: "Roughly 80% of a traditional QoE engagement is data work — ingesting trial balances, mapping accounts, building schedules, scanning the GL — before any professional judgment is applied. That data work is billed at analyst rates over 4–8 weeks. Shepi automates the data layer so you only pay for judgment.",
  },
  {
    question: "Is Shepi a CPA firm?",
    answer: "No. Shepi is analytical QoE software. We do not issue audit opinions or formal CPA-attested QoE reports. Our Done-For-You tier includes a licensed CPA's review of the adjustments — they confirm accuracy of what the platform surfaced — but that is review work, not attestation.",
  },
  {
    question: "Will my SBA lender accept Shepi output?",
    answer: "Most SBA lenders care about the analysis, not the cover page. Shepi outputs the standard deliverables — EBITDA bridge, working-capital schedule, revenue quality, GL anomaly review — that lenders use to validate seller-reported earnings under SOP 50 10. Some deals (often non-SBA acquisition financing or institutional equity) require formal CPA attestation, in which case a CPA firm is the right path.",
  },
  {
    question: "Can I run Shepi and then bring in a CPA firm?",
    answer: "Yes — and this is increasingly common. The Shepi workbook ties back to the GL with full traceability, so a CPA firm engaged later can review the adjustments rather than rebuild them. Some searchers use Shepi to prep their data room and reduce the CPA's billable hours.",
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
  headline: "QoE Providers for ETA Buyers: CPA Firm vs Shepi",
  description: "Honest comparison of CPA-firm QoE engagements vs Shepi for ETA / search-fund buyers. Cost, timeline, lender acceptance, and when to pick which.",
  url: "https://shepi.ai/compare/cpa-firm-vs-shepi",
  author: { "@type": "Organization", name: "shepi" },
};

export default function CpaFirmVsShepi() {
  return (
    <ContentPageLayout
      title="QoE Providers for ETA Buyers: CPA Firm vs Shepi"
      seoTitle="Best QoE Providers for ETA: CPA Firm vs Shepi | Shepi"
      seoDescription="Compare CPA-firm QoE vs Shepi for ETA and search-fund buyers. Honest cost, timeline, lender acceptance, and when each option is the right call."
      canonical="https://shepi.ai/compare/cpa-firm-vs-shepi"
      breadcrumbs={[
        { label: "Compare", href: "/compare/ai-qoe-vs-traditional" },
        { label: "CPA Firm vs Shepi" },
      ]}
      toc={toc}
      jsonLd={[articleSchema, faqSchema]}
      heroAccent
    >
      <HeroCallout>
        Most ETA buyers don't have to pick one. The realistic answer is: screen with Shepi at {PRICING.perProject.display}, escalate to a CPA firm only when the deal advances and the lender or equity requires formal attestation.
      </HeroCallout>

      <StatRow stats={[
        { value: "$25K–$75K", label: "CPA QoE for ETA deals" },
        { value: PRICING.perProject.display, label: "Shepi per project" },
        { value: "4–8 wks → 24–48 hrs", label: "Timeline compression" },
      ]} />

      <h2 id="the-choice">The Choice</h2>
      <p>
        For an ETA or self-funded search acquisition in the $1M–$10M EBITDA band, the QoE decision used to be binary: pay a CPA firm $25,000–$75,000 and wait 4–8 weeks, or skip a real QoE entirely and underwrite on the seller's numbers.
      </p>
      <p>
        That's no longer the choice. Shepi runs the same analytical workload — EBITDA adjustments, GL anomaly review, working-capital, revenue quality, cash proof — in hours instead of weeks, at roughly 10% of CPA-firm pricing. CPA firms still own formal attestation work; Shepi owns everything else.
      </p>

      <h2 id="side-by-side">Side-by-Side</h2>
      <ComparisonTable
        headers={["Dimension", "CPA Firm QoE", "Shepi"]}
        rows={[
          ["Per-project cost", "$25,000–$75,000", `${PRICING.perProject.display} DIY · ${PRICING.doneForYou.display} DFY`],
          ["Timeline", "4–8 weeks", "24–48 hours"],
          ["GL coverage", "Sample-based (10–20%)", "100% of transactions"],
          ["Re-runs after data corrections", "Re-bill", "Included"],
          ["Pre-LOI screening", "Cost-prohibitive", "Routine"],
          ["Lender-ready PDF + Excel", "Yes", "Yes — Excel ties to GL"],
          ["CPA-led review of adjustments", "Yes", `Yes (DFY tier — review, not attestation)`],
          ["Formal CPA attestation opinion", "Yes", "No — analysis only"],
        ]}
      />

      <h2 id="when-cpa-firm">When to Pick a CPA Firm</h2>
      <BenefitGrid benefits={[
        { title: "Lender or equity requires attestation", description: "Larger SBA loans, non-SBA acquisition debt, or institutional equity sometimes require a formal CPA-attested QoE. Shepi doesn't issue attestation opinions." },
        { title: "Public-company target or carve-out", description: "Complex carve-out accounting, segment financials, or SEC-relevant work needs a firm." },
        { title: "Tax structuring opinions tied to the QoE", description: "338(h)(10), F-reorg analysis, NOL preservation — these need a tax advisor on the engagement." },
      ]} />

      <h2 id="when-shepi">When to Pick Shepi</h2>
      <BenefitGrid benefits={[
        { title: "Pre-LOI deal screening", description: "Validate seller-reported EBITDA before committing to an LOI. Pay per look, not per engagement." },
        { title: "Lower-middle-market ETA deals", description: "$1M–$10M EBITDA targets where CPA-firm fees are disproportionate to deal size." },
        { title: "SBA-financed acquisitions", description: "Most SBA lenders are comfortable underwriting on Shepi output. See our SBA loan QoE page for detail." },
        { title: "Sell-side prep", description: "Brokers and sellers preparing for market use Shepi to identify and document add-backs proactively." },
        { title: "IC memo / investor decks", description: "Internal use to support investment decisions — no third-party attestation required." },
      ]} />

      <h2 id="hybrid">The Hybrid Path (Most Common)</h2>
      <p>
        Most active searchers use Shepi for screening and pre-LOI work, then bring in a CPA firm during exclusivity if (and only if) the lender or equity requires formal attestation. Because Shepi's workbook ties back to the GL with full traceability, a CPA firm engaged later can <em>review</em> the adjustments rather than rebuild them from scratch — often reducing the CPA's bill materially.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={faqItems} />

      <h2>Related</h2>
      <RelatedResourceCards links={[
        { to: "/eta-qoe-cost", label: "ETA QoE Cost (2026)" },
        { to: "/sba-loan-qoe", label: "QoE for SBA Loans" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs Traditional CPA" },
        { to: "/scope", label: "Shepi Scope of Work" },
      ]} />
    </ContentPageLayout>
  );
}
