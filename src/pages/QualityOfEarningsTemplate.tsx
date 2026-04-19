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
  { id: "what-included", label: "What's in the Template" },
  { id: "sections", label: "Standard QoE Sections" },
  { id: "how-to-use", label: "How to Use It" },
  { id: "skip-template", label: "Skip the Template" },
  { id: "faq", label: "FAQ" },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What should a Quality of Earnings template include?", acceptedAnswer: { "@type": "Answer", text: "A complete QoE template includes: Executive Summary, Adjusted EBITDA Bridge, Revenue Quality Analysis, Customer Concentration, Working Capital Schedule, Proof of Cash, GL Anomaly Findings, and supporting schedules with audit trail." } },
    { "@type": "Question", name: "Is there a free Quality of Earnings template?", acceptedAnswer: { "@type": "Answer", text: "Yes — Shepi offers a free downloadable QoE report template covering all standard sections used by deal professionals and lenders." } },
    { "@type": "Question", name: "Can I use an Excel QoE template instead of software?", acceptedAnswer: { "@type": "Answer", text: "Excel templates work for one-off deals but require manual data entry, sample-based GL review, and 40–80 hours of analyst time. QoE software automates the data work and uses the same report structure." } },
  ],
};

export default function QualityOfEarningsTemplate() {
  return (
    <ContentPageLayout
      title="Free Quality of Earnings Report Template"
      seoTitle="Quality of Earnings Template — Free QoE Report Template | Shepi"
      seoDescription="Free Quality of Earnings report template covering EBITDA bridge, working capital, proof of cash, and revenue quality. Download or generate a real QoE in hours."
      canonical="https://shepi.ai/quality-of-earnings-template"
      breadcrumbs={[{ label: "Quality of Earnings Template" }]}
      toc={toc}
      jsonLd={faqSchema}
      heroAccent
    >
      <HeroCallout>
        A complete QoE report template covering every section lenders and deal parties expect — or skip the template entirely and generate a real QoE report from your QuickBooks file in hours.
      </HeroCallout>

      <StatRow stats={[
        { value: "8", label: "Standard QoE sections" },
        { value: "Excel + PDF", label: "Template formats" },
        { value: "Free", label: "To download" },
      ]} />

      <h2 id="what-included">What's in the Quality of Earnings Template</h2>
      <p>
        The Shepi Quality of Earnings template covers the standard structure used by CPA firms, deal advisors, and lenders. Use it as a workpaper framework for manual diligence, or as a reference for what your QoE report should contain.
      </p>
      <BenefitGrid benefits={[
        { title: "Executive Summary", description: "One-page deal overview with adjusted EBITDA, key adjustments, and risk flags" },
        { title: "Adjusted EBITDA Bridge", description: "Net income → EBITDA → Adjusted EBITDA with categorized adjustments" },
        { title: "Revenue Quality", description: "Recurring vs non-recurring, customer concentration, AR aging, and trend analysis" },
        { title: "Working Capital Schedule", description: "Multi-period NWC with turnover ratios and normalized peg calculation" },
        { title: "Proof of Cash", description: "GL-to-bank reconciliation surfacing unrecorded liabilities and commingled items" },
        { title: "GL Anomaly Findings", description: "Flagged transactions with confidence scores and suggested adjustment amounts" },
        { title: "Supporting Schedules", description: "Account-level detail, vendor analysis, and trial balance walkthroughs" },
        { title: "Audit Trail", description: "Every adjustment traceable to source GL transactions" },
      ]} />

      <h2 id="sections">Standard QoE Report Sections Explained</h2>
      <p>
        Most professional QoE reports follow a predictable structure. Here's what each section contains and why it matters:
      </p>
      <ul>
        <li><strong>Executive Summary</strong> — Adjusted EBITDA, headline adjustments, and the 3–5 most material risks. This is what most readers actually read.</li>
        <li><strong>EBITDA Bridge</strong> — Walks from reported net income to adjusted EBITDA with every add-back categorized (owner comp normalization, non-recurring, personal, accounting cleanup).</li>
        <li><strong>Revenue Analysis</strong> — Trends, recurring classification, customer concentration, and any one-time revenue items that distort run-rate.</li>
        <li><strong>Working Capital</strong> — Trailing-twelve NWC schedule, turnover ratios, and the normalized peg amount used in the purchase agreement.</li>
        <li><strong>Proof of Cash</strong> — Reconciles total bank deposits and disbursements to GL — the section where commingled expenses and missing liabilities surface.</li>
        <li><strong>Findings & Risks</strong> — Anomalies that don't roll into adjustments but still affect deal terms (e.g., poor segregation of duties, late filings).</li>
      </ul>

      <h2 id="how-to-use">How to Use the QoE Template</h2>
      <StepList steps={[
        { title: "Download the template", description: "Get the Excel + PDF reference pack tailored to lower middle market deals" },
        { title: "Pull your trial balance", description: "Multi-year TB plus current TTM is the minimum data set required" },
        { title: "Map the chart of accounts", description: "Map each account to the QoE categories defined in the template" },
        { title: "Build the EBITDA bridge", description: "Identify add-backs and document each one with supporting evidence" },
        { title: "Layer in working capital and proof of cash", description: "Use the schedules to compute peg and reconcile to bank statements" },
        { title: "Write the narrative", description: "Translate the numbers into the executive summary and findings sections" },
      ]} />

      <h2 id="skip-template">Or Skip the Template Entirely</h2>
      <p>
        Excel templates are great for understanding QoE structure — but they require 40–80 hours of analyst work to fill out for a single deal. Shepi generates a complete, lender-ready QoE report from your QuickBooks file in hours, using the same standard structure the template defines.
      </p>
      <p>
        Starting at <strong>{PRICING.perProject.display} per project</strong> — versus $20K+ for a CPA-led engagement using the same template structure.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Is there a free Quality of Earnings template?", answer: "Yes — Shepi offers a free downloadable QoE report template covering all standard sections." },
        { question: "What should a QoE template include?", answer: "Executive summary, EBITDA bridge, revenue quality, customer concentration, working capital schedule, proof of cash, GL anomaly findings, and supporting schedules." },
        { question: "Can I use an Excel template instead of QoE software?", answer: "Yes for one-off deals — but it requires 40–80 hours of manual analyst work. Software automates the data work using the same report structure." },
        { question: "What's the difference between a QoE report and an audit?", answer: "A QoE focuses on EBITDA quality and deal-relevant adjustments; an audit issues an opinion on financial statement accuracy. Both have a place in diligence." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/qoe-report-template", label: "QoE Report Structure Deep Dive" },
        { to: "/quality-of-earnings-checklist", label: "QoE Diligence Checklist" },
        { to: "/quality-of-earnings-cost", label: "QoE Report Cost Guide" },
        { to: "/quality-of-earnings-software", label: "QoE Software Platform" },
      ]} />
    </ContentPageLayout>
  );
}
