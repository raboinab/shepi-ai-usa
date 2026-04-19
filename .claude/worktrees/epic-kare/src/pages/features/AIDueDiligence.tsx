import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "what-ai-automates", label: "What AI Automates" },
  { id: "workflow", label: "AI-Assisted Workflow" },
  { id: "gl-analysis", label: "GL-Level Analysis" },
  { id: "vs-traditional", label: "AI vs Traditional" },
  { id: "when-to-use", label: "When to Use AI" },
  { id: "limitations", label: "Honest Limitations" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI for Financial Due Diligence — Automate Quality of Earnings Analysis",
  description: "How AI transforms financial due diligence: automated EBITDA add-backs, GL anomaly detection, revenue analysis, and working capital calculations. When to use AI vs traditional CPA.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/features/ai-due-diligence",
};

export default function AIDueDiligence() {
  return (
    <ContentPageLayout
      title="AI for Financial Due Diligence — Automate Quality of Earnings"
      seoTitle="AI for Financial Due Diligence — Automate QoE Analysis | Shepi"
      seoDescription="How AI accelerates M&A due diligence: automated EBITDA adjustments, GL anomaly detection, revenue quality analysis, and working capital calculations. Compare AI vs traditional CPA firms."
      canonical="https://shepi.ai/features/ai-due-diligence"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "AI for Due Diligence" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        AI doesn't replace the analyst — it gives every analyst the throughput of a team. Screen more deals, catch more issues, close faster.
      </HeroCallout>

      <StatRow stats={[
        { value: "2–4 hrs", label: "Initial analysis time" },
        { value: "100%", label: "Transaction coverage (not sampling)" },
        { value: PRICING.perProject.display, label: "Starting price per project" },
      ]} />

      <h2 id="overview">Overview</h2>
      <p>
        AI-powered financial due diligence applies machine learning, natural language processing, and structured analysis to the <Link to="/guides/quality-of-earnings">Quality of Earnings process</Link>. Instead of analysts manually reviewing thousands of transactions, AI handles the data-intensive work while humans focus on judgment, context, and deal strategy.
      </p>

      <h2 id="what-ai-automates">What AI Automates in Due Diligence</h2>
      <BenefitGrid benefits={[
        { title: "Account mapping & classification", description: "Automatically maps chart of accounts to standardized QoE categories — a task that typically takes days" },
        { title: "EBITDA adjustment identification", description: "Scans the GL for non-recurring items, personal expenses, and potential add-backs using pattern recognition" },
        { title: "Anomaly detection", description: "Identifies unusual transactions, round-dollar entries, duplicates, and period-end clustering across the entire ledger" },
        { title: "Revenue quality scoring", description: "Analyzes customer concentration, recurring vs non-recurring classification, and trend patterns" },
        { title: "Working capital calculation", description: "Builds multi-period NWC schedules with turnover ratios and peg calculations automatically" },
        { title: "Proof of cash reconciliation", description: "Matches GL activity to bank statement data to identify unrecorded transactions" },
      ]} />

      <h2 id="workflow">AI-Assisted Due Diligence Workflow</h2>
      <StepList steps={[
        { title: "Connect data sources", description: "Upload financial statements, connect QuickBooks, or import trial balance data" },
        { title: "AI processes & maps", description: "Automatic account classification, period alignment, and data normalization" },
        { title: "Review flagged items", description: "AI surfaces potential adjustments, anomalies, and red flags for analyst review" },
        { title: "Apply professional judgment", description: "Accept, modify, or reject AI suggestions based on deal context and expertise" },
        { title: "Generate deliverables", description: "Produce lender-ready QoE reports, EBITDA bridges, and working capital schedules" },
      ]} />

      <h2 id="gl-analysis">GL-Level AI Analysis</h2>
      <p>
        The <Link to="/guides/general-ledger-review">general ledger</Link> is where AI delivers the most dramatic improvement over manual processes:
      </p>
      <BenefitGrid benefits={[
        { title: "Full coverage", description: "Every transaction reviewed — not a sample. AI doesn't get tired or skip entries" },
        { title: "Pattern detection", description: "Identifies suspicious patterns across thousands of transactions that human reviewers would miss" },
        { title: "Keyword intelligence", description: "NLP-powered search for personal expenses, related-party transactions, and unusual descriptions" },
        { title: "Cross-account analysis", description: "Correlates activity across accounts to identify reclassification opportunities and intercompany flows" },
      ]} />

      <h2 id="vs-traditional">AI vs Traditional Due Diligence</h2>
      <ComparisonTable
        headers={["Dimension", "Traditional CPA", "AI-Assisted"]}
        rows={[
          ["Timeline", "4–8 weeks", "Days (initial analysis in hours)"],
          ["Cost", "$20K–$100K+", `Starting at ${PRICING.perProject.display}`],
          ["Transaction coverage", "Sample-based", "100% of GL"],
          ["Consistency", "Analyst-dependent", "Standardized framework"],
          ["Scalability", "Linear (more deals = more staff)", "Parallel processing"],
          ["Professional judgment", "Senior partner review", "Human analyst + AI insights"],
          ["Certifiable opinion", "Yes (CPA attestation)", "No (analysis assistance)"],
        ]}
      />

      <h2 id="when-to-use">When to Use AI Due Diligence</h2>
      <BenefitGrid benefits={[
        { title: "Deal screening", description: "Quickly evaluate whether a target's financials warrant deeper investigation — before committing $30K+ to a CPA firm" },
        { title: "Lower middle market", description: "Deals under $10M where traditional QoE costs are disproportionate to deal size" },
        { title: "Sell-side preparation", description: "Sellers preparing for due diligence — identify and address issues before buyers find them" },
        { title: "Time-critical deals", description: "Competitive situations where speed is a strategic advantage" },
        { title: "Portfolio monitoring", description: "PE firms monitoring existing portfolio company performance" },
        { title: "Complement to CPA", description: "Use AI for initial analysis, then engage a CPA firm for formal attestation if needed" },
      ]} />

      <h2 id="limitations">Honest Limitations</h2>
      <p>
        We believe in transparency about what AI can and cannot do:
      </p>
      <BenefitGrid benefits={[
        { title: "No attestation", description: "AI-assisted analysis is not a certified audit or attestation. Lenders requiring formal CPA opinions still need a firm" },
        { title: "Judgment-dependent items", description: "Items requiring business context (Is this expense truly non-recurring?) need human judgment" },
        { title: "Data quality dependency", description: "AI analysis is only as good as the input data — garbage in, garbage out applies" },
        { title: "Complex structures", description: "Multi-entity carve-outs, international transactions, and highly customized deals may need specialist expertise" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Can AI fully replace a CPA for due diligence?", answer: "Not today. AI excels at data processing, pattern detection, and standardized analysis. It dramatically reduces the time and cost of due diligence, but professional judgment, management interviews, and formal attestation still require human expertise." },
        { question: "Is AI-assisted QoE accepted by lenders?", answer: "Many lenders accept AI-assisted analysis for preliminary assessment and smaller deals. For larger transactions or SBA loans, lenders may still require a formal CPA-prepared QoE. AI analysis can complement the CPA engagement by providing faster initial findings." },
        { question: "How accurate is AI anomaly detection?", answer: "AI achieves higher detection rates than manual sampling because it reviews 100% of transactions. However, not every flagged item is a true adjustment — the false positive rate is managed by presenting findings for human review rather than auto-applying." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report?" },
        { to: "/guides/ai-accounting-anomaly-detection", label: "How AI Detects Accounting Anomalies" },
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs Traditional CPA" },
        { to: "/guides/general-ledger-review", label: "General Ledger Review" },
      ]} />
    </ContentPageLayout>
  );
}
