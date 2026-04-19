import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "why-lenders", label: "Why Lenders Require QoE" },
  { id: "sba-lending", label: "SBA Lending & QoE" },
  { id: "underwriting", label: "Strengthening Underwriting" },
  { id: "workflow", label: "Lender Workflow" },
  { id: "risk-mitigation", label: "Risk Mitigation" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE for Lenders & SBA Lending",
  description: "How lenders and SBA loan officers use Quality of Earnings analysis to strengthen underwriting, mitigate acquisition loan risk, and accelerate deal timelines.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-22",
  dateModified: "2026-02-22",
  mainEntityOfPage: "https://shepi.ai/use-cases/lenders",
};

export default function Lenders() {
  return (
    <ContentPageLayout
      title="QoE for Lenders & SBA Lending"
      seoTitle="QoE for Lenders & SBA Lending — Stronger Underwriting | Shepi"
      seoDescription="How lenders and SBA loan officers use Quality of Earnings analysis to strengthen underwriting, mitigate acquisition loan risk, and accelerate deal closings."
      canonical="https://shepi.ai/use-cases/lenders"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Lenders" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        $5K QoE vs. $200K–$2M default exposure — the math is simple.
      </HeroCallout>

      <StatRow stats={[
        { value: "$5K–$25K", label: "QoE cost depending on complexity" },
        { value: "$200K–$2M+", label: "Default cost on a single bad loan" },
        { value: "Hours", label: "For preliminary analysis" },
      ]} />

      <p className="text-lg">
        The cost of a bad acquisition loan far exceeds the cost of a <Link to="/guides/quality-of-earnings">Quality of Earnings report</Link>. For lenders — especially those underwriting SBA 7(a) acquisition loans — QoE analysis has shifted from "nice to have" to a critical underwriting requirement.
      </p>

      <h2 id="why-lenders">Why Lenders Require QoE</h2>
      <p>
        Acquisition lending carries unique risks. Unlike traditional business loans where the borrower has an operating track record, acquisition loans fund a change of ownership — and the new owner's ability to service debt depends entirely on the accuracy of the target's financial picture.
      </p>
      <BenefitGrid benefits={[
        { title: "Earnings verification", description: "Confirms that reported EBITDA reflects actual, sustainable cash flow" },
        { title: "Adjustment transparency", description: "Identifies owner add-backs, one-time items, and discretionary expenses with documentation" },
        { title: "Trend analysis", description: "Reveals whether the business is growing, stable, or declining — critical for debt service projections" },
        { title: "Working capital assessment", description: "Ensures adequate working capital for ongoing operations post-acquisition" },
      ]} />

      <h2 id="sba-lending">SBA Lending & QoE Requirements</h2>
      <p>
        SBA lenders face heightened scrutiny from the SBA and their CDCs. While the SBA SOP doesn't explicitly mandate QoE reports, prudent lenders increasingly require them for acquisition loans above $500K — and many require them for all change-of-ownership transactions.
      </p>
      <p>
        The rationale is straightforward: SBA acquisition loans often involve borrowers with limited equity (as low as 10% injection) and long amortization periods. If reported earnings are overstated by even 15–20%, the debt service coverage ratio drops below acceptable thresholds. A QoE report catches these discrepancies before the loan closes.
      </p>

      <h2 id="underwriting">Strengthening Your Underwriting</h2>
      <BenefitGrid benefits={[
        { title: "Adjusted EBITDA bridge", description: "Clear reconciliation from reported to adjusted earnings, with each adjustment categorized and documented" },
        { title: "Revenue quality metrics", description: "Customer concentration, contract vs. project revenue, recurring revenue percentage" },
        { title: "Expense normalization", description: "Owner compensation benchmarking, related-party transaction analysis, discretionary vs. necessary spending" },
        { title: "Cash flow validation", description: "Proof of cash analysis reconciling reported income to bank deposits" },
        { title: "Working capital peg", description: "Normalized working capital target for the purchase agreement" },
      ]} />

      <h2 id="workflow">Lender Workflow with Shepi</h2>
      <StepList steps={[
        { title: "Pre-screening", description: "Run a quick financial assessment on the borrower's application package to evaluate deal viability before committing underwriting resources" },
        { title: "QoE coordination", description: "If you require a third-party QoE, recommend QoE providers who use Shepi for faster turnaround" },
        { title: "Underwriting integration", description: "Incorporate QoE findings into your credit analysis and debt service coverage calculations" },
        { title: "Committee presentation", description: "Use QoE-derived adjusted financials in your credit memo and loan committee materials" },
        { title: "Portfolio monitoring", description: "For ongoing covenant compliance, the same analytical framework supports periodic financial reviews" },
      ]} />

      <h2 id="risk-mitigation">Risk Mitigation</h2>
      <p>
        Every acquisition loan that defaults costs the institution far more than the QoE analysis would have. The math is simple:
      </p>
      <BenefitGrid benefits={[
        { title: "QoE cost", description: "Typically $5K–$25K depending on complexity" },
        { title: "Default cost", description: "Loss exposure of $200K–$2M+ on a single bad loan, plus workout costs and reputation risk" },
        { title: "Prevention value", description: "Catches earnings overstatements, undisclosed liabilities, and unsustainable trends that cause most acquisition loan failures" },
      ]} />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Should lenders commission QoE directly or require the borrower to provide one?", answer: "Both approaches are common. Some lenders maintain approved QoE provider lists and require borrowers to engage from that list. Others accept borrower-commissioned QoE reports from recognized firms. The key is ensuring the analysis is independent and comprehensive." },
        { question: "How does faster QoE turnaround benefit lenders?", answer: "Deal velocity matters in competitive lending. When a borrower has multiple lender options, the one that can complete underwriting fastest often wins the deal. AI-assisted QoE compresses the longest pole in the underwriting tent — financial due diligence — from weeks to days." },
        { question: "What about deals that are too small for traditional QoE?", answer: "AI-assisted analysis lowers the cost floor, making financial due diligence accessible for sub-$1M deals that make up the bulk of SBA lending volume." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/use-cases/accountants-cpa", label: "QoE for Accountants & CPA Firms" },
        { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
      ]} />
    </ContentPageLayout>
  );
}
