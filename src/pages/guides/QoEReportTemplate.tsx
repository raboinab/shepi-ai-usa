import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Report Structure Overview" },
  { id: "executive-summary", label: "Executive Summary" },
  { id: "ebitda-bridge", label: "EBITDA Adjustment Schedule" },
  { id: "revenue-section", label: "Revenue Analysis" },
  { id: "expense-section", label: "Expense Analysis" },
  { id: "working-capital", label: "Working Capital Schedule" },
  { id: "proof-of-cash", label: "Proof of Cash" },
  { id: "management-adjustments", label: "Management Adjustments" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE Report Template — Structure, Sections & Schedules",
  description: "Quality of Earnings report template with executive summary, EBITDA adjustment schedule, revenue and expense analysis, working capital schedule, proof of cash, and management adjustments.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/qoe-report-template",
};

export default function QoEReportTemplate() {
  return (
    <ContentPageLayout
      title="QoE Report Template — Structure, Sections & Schedules"
      seoTitle="QoE Report Template — Executive Summary, EBITDA Schedule & More | Shepi"
      seoDescription="Quality of Earnings report template covering executive summary, EBITDA adjustment schedules, revenue and expense analysis, working capital, proof of cash, and management adjustments."
      canonical="https://shepi.ai/guides/qoe-report-template"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "QoE Report Template" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        A well-structured QoE report tells a clear story — from headline findings to the granular schedules that support them. Here's the template professional analysts use.
      </HeroCallout>

      <StatRow stats={[
        { value: "7–10", label: "Sections in a standard QoE report" },
        { value: "3–5 years", label: "Typical analysis period" },
        { value: "20–50+", label: "Common EBITDA adjustments reviewed" },
      ]} />

      <h2 id="overview">Report Structure Overview</h2>
      <p>
        A <Link to="/guides/quality-of-earnings">Quality of Earnings report</Link> follows a logical structure that starts with high-level findings and drills into supporting detail. Whether prepared by a Big 4 firm or generated on an AI-assisted platform, the core sections are consistent.
      </p>
      <StepList steps={[
        { title: "Executive Summary", description: "Headline findings, adjusted EBITDA, key risks, and deal considerations" },
        { title: "EBITDA Adjustment Schedule", description: "Bridge from reported to adjusted EBITDA with categorized adjustments" },
        { title: "Revenue Analysis", description: "Revenue quality, concentration, recurring vs non-recurring, trends" },
        { title: "Expense Analysis", description: "COGS, operating expenses, owner compensation, SG&A trends" },
        { title: "Working Capital Schedule", description: "Normalized NWC, peg calculation, component analysis" },
        { title: "Proof of Cash", description: "GL-to-bank reconciliation validating completeness of recorded transactions" },
        { title: "Balance Sheet Review", description: "Asset quality, unrecorded liabilities, debt-like items" },
        { title: "Management Adjustments", description: "Seller-proposed adjustments with validation and supporting documentation" },
      ]} />

      <h2 id="executive-summary">Executive Summary</h2>
      <p>
        The executive summary is what buyers, lenders, and deal committees read first. It should answer: <em>"What is the true earning power of this business?"</em>
      </p>
      <BenefitGrid benefits={[
        { title: "Adjusted EBITDA range", description: "Present a range if certain adjustments are debatable, with a midpoint best estimate" },
        { title: "Key adjustments", description: "Highlight the 3–5 largest adjustments and their net impact" },
        { title: "Revenue quality summary", description: "One-paragraph assessment of revenue sustainability and concentration" },
        { title: "Risk factors", description: "Top 3–5 risks identified during analysis with potential financial impact" },
        { title: "Data quality assessment", description: "Comment on completeness and reliability of source data" },
      ]} />

      <h2 id="ebitda-bridge">EBITDA Adjustment Schedule</h2>
      <p>
        The EBITDA bridge is the centerpiece of any QoE report. It starts with reported net income and systematically adds back interest, taxes, depreciation, and amortization, then applies <Link to="/guides/ebitda-adjustments">normalization adjustments</Link> to arrive at adjusted EBITDA.
      </p>
      <BenefitGrid benefits={[
        { title: "Non-recurring items", description: "One-time legal fees, restructuring, PPP income, insurance settlements" },
        { title: "Owner adjustments", description: "Above-market compensation, personal expenses, related-party transactions" },
        { title: "Pro forma adjustments", description: "Known changes: new hires, lost customers, lease changes, regulatory costs" },
        { title: "Accounting adjustments", description: "Reclassifications, accrual corrections, timing differences" },
      ]} />

      <h2 id="revenue-section">Revenue Analysis Section</h2>
      <p>
        The revenue section of a QoE report provides the analytical detail behind the executive summary's revenue quality assessment. See our <Link to="/guides/revenue-quality-analysis">complete revenue quality guide</Link> for detailed methodology.
      </p>

      <h2 id="expense-section">Expense Analysis Section</h2>
      <BenefitGrid benefits={[
        { title: "COGS validation", description: "Verify cost of goods sold is consistently calculated and accurately captures direct costs" },
        { title: "Payroll analysis", description: "Owner compensation normalization, headcount analysis, benefit costs" },
        { title: "Rent & occupancy", description: "Below-market related-party leases, upcoming lease renewals, deferred maintenance" },
        { title: "SG&A trends", description: "Identify unusual patterns, missing costs, or expenses that should be reclassified" },
      ]} />

      <h2 id="working-capital">Working Capital Schedule</h2>
      <p>
        The working capital schedule is a standalone section that feeds into both the QoE analysis and the purchase agreement. See our <Link to="/guides/working-capital-analysis">working capital analysis guide</Link> for detailed methodology.
      </p>

      <h2 id="proof-of-cash">Proof of Cash</h2>
      <p>
        Proof of cash reconciles the general ledger's recorded transactions to actual bank activity. It's a powerful completeness test — if cash in the GL doesn't match cash at the bank, something is missing. See our <Link to="/guides/cash-proof-analysis">cash and bank tie-out guide</Link>.
      </p>

      <h2 id="management-adjustments">Management Adjustments</h2>
      <p>
        Sellers often propose their own adjustments — typically add-backs that increase EBITDA. The QoE report should evaluate each management adjustment:
      </p>
      <BenefitGrid benefits={[
        { title: "Documentation review", description: "Is the adjustment supported by invoices, contracts, or other verifiable evidence?" },
        { title: "Reasonableness test", description: "Is the adjustment amount reasonable relative to the underlying transaction?" },
        { title: "Classification", description: "Is this truly non-recurring, or is the seller relabeling a normal operating cost?" },
        { title: "Validation status", description: "Validated, partially supported, insufficient evidence, or contradicted by data" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What should a QoE executive summary include?", answer: "The executive summary should include adjusted EBITDA (with a range if applicable), the 3-5 largest adjustments, a revenue quality assessment, top risk factors, and a data quality commentary." },
        { question: "How many periods should a QoE report cover?", answer: "Most QoE reports cover 3-5 fiscal years plus year-to-date interim periods. Monthly data for at least the trailing 24 months is standard for trend analysis." },
        { question: "What's the difference between a QoE report and an audit?", answer: "A QoE report is an analytical assessment focused on earnings quality and sustainability. An audit is a formal attestation that financial statements comply with accounting standards. QoE is forward-looking; audits are backward-looking." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/guides/ebitda-bridge", label: "EBITDA Bridge Analysis" },
        { to: "/workbook/demo", label: "Try the Live Workbook Demo" },
      ]} />
    </ContentPageLayout>
  );
}
