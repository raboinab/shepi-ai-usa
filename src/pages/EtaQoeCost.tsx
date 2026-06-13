import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "what-it-costs", label: "What ETA QoE Costs" },
  { id: "cost-breakdown", label: "Cost Breakdown" },
  { id: "shepi-vs-cpa", label: "Shepi vs CPA Firm" },
  { id: "when-cpa", label: "When You Still Need a CPA" },
  { id: "faq", label: "FAQ" },
];

const faqItems = [
  {
    question: "What does a Quality of Earnings cost for an ETA / search-fund deal?",
    answer: `A traditional CPA-led QoE for an ETA deal in the $1M–$10M EBITDA range typically runs $25,000–$75,000 and takes 4–8 weeks. Shepi handles the same analytical workload — EBITDA adjustments, GL review, working-capital, revenue quality — starting at ${PRICING.perProject.display} per project, with output in hours.`,
  },
  {
    question: "Why is ETA QoE cheaper with Shepi?",
    answer: "Shepi automates the data-intensive 80% of a traditional engagement: ingesting trial balances, mapping accounts to QoE categories, scanning the full GL for add-back candidates, building working-capital schedules. You apply judgment on flagged items instead of paying analyst hours to build them from scratch.",
  },
  {
    question: "Is this analysis acceptable to SBA lenders?",
    answer: "Shepi outputs lender-ready EBITDA bridges, working-capital schedules, and supporting workbooks that mirror the format SBA lenders expect. Many lenders are comfortable underwriting on a Shepi analysis paired with the borrower's tax returns. For deals requiring a formal CPA-attested QoE, our Done-For-You tier adds CPA review of the adjustments.",
  },
  {
    question: "Should I run QoE before LOI or after?",
    answer: "Most searchers run a screening pass before LOI to validate seller-reported EBITDA, then a deeper pass during exclusivity. Shepi's per-project pricing makes the pre-LOI pass economical — historically, that was cost-prohibitive at $25K+ per look.",
  },
  {
    question: "What about Done-For-You?",
    answer: `Shepi DFY is ${PRICING.doneForYou.display} per project and includes a licensed CPA's review of the adjustments — they confirm accuracy of what Shepi surfaced. It is review work, not formal attestation. Use DFY when you want a second set of eyes before sending to a lender or investor.`,
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
  headline: "ETA Quality of Earnings Cost (2026)",
  description: "What QoE costs for an ETA / search-fund acquisition, why CPA firms charge $25K–$75K, and how to run the same analysis for a fraction with Shepi.",
  url: "https://shepi.ai/eta-qoe-cost",
  author: { "@type": "Organization", name: "shepi" },
};

export default function EtaQoeCost() {
  return (
    <ContentPageLayout
      title="ETA Quality of Earnings Cost (2026)"
      seoTitle="ETA Quality of Earnings Cost — Search Fund QoE | Shepi"
      seoDescription="What a QoE costs for an ETA or search fund acquisition. Traditional CPA QoE runs $25K–$75K. Shepi handles the same analysis from $2,000."
      canonical="https://shepi.ai/eta-qoe-cost"
      breadcrumbs={[
        { label: "Use Cases", href: "/use-cases/independent-searchers" },
        { label: "ETA QoE Cost" },
      ]}
      toc={toc}
      jsonLd={[articleSchema, faqSchema]}
      heroAccent
    >
      <HeroCallout>
        ETA-stage QoE engagements have historically run $25,000–$75,000. Shepi runs the same analytical workload starting at {PRICING.perProject.display} per project — pre-LOI screening becomes economically viable.
      </HeroCallout>

      <StatRow stats={[
        { value: "$25K–$75K", label: "Traditional CPA QoE" },
        { value: PRICING.perProject.display, label: "Shepi per project" },
        { value: "2–4 hrs", label: "Initial analysis time" },
      ]} />

      <h2 id="what-it-costs">What ETA QoE Costs</h2>
      <p>
        For an Entrepreneur-Through-Acquisition (ETA) or self-funded search deal — typically $1M–$10M in EBITDA — a traditional QoE engagement from a regional CPA firm runs between $25,000 and $75,000. National firms charge more. The work takes 4–8 weeks, with analyst time consumed by data normalization, account mapping, and GL review before any judgment is applied.
      </p>
      <p>
        That cost structure made <em>screening</em> with a real QoE impossible. Searchers had to commit to LOI on seller-reported numbers, then absorb the $30K+ surprise during exclusivity if EBITDA didn't hold up.
      </p>

      <h2 id="cost-breakdown">Where the $25K–$75K Goes</h2>
      <ComparisonTable
        headers={["Phase", "Traditional CPA QoE", "What it costs"]}
        rows={[
          ["Data ingestion & mapping", "Manual COA mapping, trial balance normalization", "~30% of fee"],
          ["EBITDA adjustments", "Analyst combs the GL line-by-line", "~25% of fee"],
          ["Working capital schedule", "Multi-period NWC build-out", "~15% of fee"],
          ["Revenue quality", "Customer concentration, recurring classification", "~10% of fee"],
          ["Report drafting & review", "Partner review, formatting, narrative", "~20% of fee"],
        ]}
      />

      <h2 id="shepi-vs-cpa">Shepi vs CPA Firm — Cost Side-by-Side</h2>
      <ComparisonTable
        headers={["Dimension", "CPA Firm QoE", "Shepi"]}
        rows={[
          ["Per-project cost", "$25,000–$75,000", `${PRICING.perProject.display} (DIY) / ${PRICING.doneForYou.display} (DFY with CPA review)`],
          ["Timeline", "4–8 weeks", "Hours to days"],
          ["Pre-LOI screening", "Cost-prohibitive", "Routine"],
          ["GL coverage", "Sample-based", "100% of transactions"],
          ["Re-runs after data corrections", "Bill again", "Included"],
          ["Output format", "PDF + custom Excel", "Lender-ready PDF + structured Excel export"],
          ["CPA attestation", "Available", "Not offered — analysis only"],
        ]}
      />

      <h2 id="when-cpa">When You Still Need a CPA</h2>
      <BenefitGrid benefits={[
        { title: "Lender requires formal attestation", description: "Some larger SBA 7(a) loans or non-SBA acquisition financing require a CPA-attested QoE. Shepi is analytical software and does not issue attestation opinions." },
        { title: "Tax structuring opinions", description: "Asset vs stock, 338(h)(10) elections, NOL preservation — these need a tax advisor, not QoE software." },
        { title: "Audit-level assurance", description: "If equity investors or your lender want audit-level work over QoE-level analysis, that's a different engagement entirely." },
      ]} />
      <p>
        For the other 90% of ETA deals — screening, validating seller numbers, building the EBITDA bridge for your IC memo, pre-LOI diligence — Shepi covers it.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={faqItems} />

      <h2>Related</h2>
      <RelatedResourceCards links={[
        { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
        { to: "/quality-of-earnings-cost", label: "Quality of Earnings Cost Guide" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs Traditional CPA" },
        { to: "/pricing", label: "Shepi Pricing" },
      ]} />
    </ContentPageLayout>
  );
}
