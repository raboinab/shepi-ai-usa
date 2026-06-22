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
  { id: "what", label: "What Proof of Cash Is" },
  { id: "automates", label: "What Shepi Automates" },
  { id: "comparison", label: "Software vs Manual" },
  { id: "when", label: "When You Need It" },
  { id: "how", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shepi — Proof of Cash Software",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Proof of cash software that ties general ledger activity to bank statements automatically. Surfaces unrecorded liabilities, commingled expenses, and unsupported deposits across 100% of transactions.",
  url: "https://shepi.ai/proof-of-cash",
  offers: { "@type": "Offer", price: PRICING.perProject.amount, priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is proof of cash in M&A due diligence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Proof of cash is the diligence test that ties recorded GL activity back to actual bank statement activity period by period. When the books and the bank don't agree, the difference usually points to unrecorded liabilities, commingled owner spend, or revenue that never landed.",
      },
    },
    {
      "@type": "Question",
      name: "How does proof of cash software work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shepi ingests bank statements alongside the GL, matches every deposit and disbursement, and produces a period-by-period reconciliation schedule with the exceptions flagged for review.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a proof of cash analysis take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Manually, a 12–24 month proof of cash typically takes a CPA team one to two days per period of statements. Shepi produces the same schedule in minutes once the bank statements and GL are loaded.",
      },
    },
    {
      "@type": "Question",
      name: "Do lenders require proof of cash?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On most SBA and lower-middle-market deals, the lender or QoE provider expects a proof of cash schedule alongside the EBITDA bridge. It is the most direct validation that reported revenue actually hit the bank.",
      },
    },
    {
      "@type": "Question",
      name: "Is shepi's proof of cash a CPA-attested report?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Shepi is analytical software — the proof of cash workbook tab and PDF slide are workpapers and schedules, not an attestation or audit opinion. CPAs use them as the starting point for their own review.",
      },
    },
  ],
};

export default function ProofOfCash() {
  return (
    <ContentPageLayout
      title="Proof of Cash Software"
      seoTitle="Proof of Cash Software — GL-to-Bank Tie-Out Automated | Shepi"
      seoDescription="Proof of cash software that ties GL to bank statements automatically, across 100% of transactions. Built for M&A due diligence. From $1,000 per project."
      canonical="https://shepi.ai/proof-of-cash"
      breadcrumbs={[{ label: "Proof of Cash" }]}
      toc={toc}
      jsonLd={{ ...softwareSchema, ...faqSchema }}
      heroAccent
    >
      <HeroCallout>
        Cash doesn't lie. Shepi ties every dollar in the GL back to the bank — period by period, 100% of transactions, exceptions flagged — so commingled owner spend, unrecorded liabilities, and missing deposits surface before they kill the deal.
      </HeroCallout>

      <StatRow stats={[
        { value: "100%", label: "Of bank activity matched to GL" },
        { value: "Minutes", label: "Per period, after upload" },
        { value: PRICING.perProject.display, label: "Per project, flat" },
      ]} />

      <h2 id="what">What Proof of Cash Is</h2>
      <p>
        Proof of cash is the diligence test that asks a simple question: does the money that hit the bank match what the books say happened? Tie out the GL against the bank statements period by period and the answer tells you whether reported revenue is real, whether owner spend is sitting in operating expenses, and whether there are liabilities the seller never recorded.
      </p>
      <p>
        For a deeper walk-through of the methodology — bank reconciliation review, common discrepancies, commingled expenses — see the <Link to="/guides/cash-proof-analysis">proof of cash analysis guide</Link>. This page is about how shepi automates it.
      </p>

      <h2 id="automates">What Shepi's Proof of Cash Automates</h2>
      <BenefitGrid benefits={[
        { title: "Bank statement ingestion", description: "PDF and CSV statements from every operating account, normalized into a single transaction stream" },
        { title: "GL-to-bank matching", description: "Every deposit and disbursement matched against GL activity across the full diligence window" },
        { title: "Exception flagging", description: "Unmatched deposits, unsupported disbursements, transfers between accounts, and round-dollar patterns surfaced for review" },
        { title: "Period-by-period schedule", description: "A ready-to-export proof of cash workbook tab and PDF slide that ties to the EBITDA bridge and working capital schedule" },
      ]} />

      <h2 id="comparison">Proof of Cash Software vs Manual Excel</h2>
      <ComparisonTable
        headers={["Dimension", "Manual / Excel", "Shepi Proof of Cash"]}
        rows={[
          ["Coverage", "Sampling — a few months", "100% of transactions, full diligence window"],
          ["Time per period", "Half a day to a day of analyst work", "Minutes after statements upload"],
          ["Exception detection", "Eyeballing pivot tables", "Systematic match + flag against the GL"],
          ["Tie-out to EBITDA", "Separate workbook, re-keyed", "Same data spine as the EBITDA bridge"],
          ["Deliverable", "One-off Excel tab", "Workbook tab + PDF slide + audit trail"],
          ["Revisions", "Re-do the pivot", "Re-run after the GL or statements update"],
        ]}
      />

      <h2 id="when">When You Need a Proof of Cash</h2>
      <BenefitGrid benefits={[
        { title: "Search-fund and SBA deals", description: "Lenders and QoE providers expect a proof of cash schedule before close — it's the most direct validation of reported revenue" },
        { title: "PE add-on screening", description: "Run proof of cash on a target before committing diligence dollars; cash-vs-GL gaps are the cheapest reason to walk" },
        { title: "Sell-side prep", description: "Tie the books to the bank before going to market, so the buyer's diligence doesn't surface surprises that re-trade the deal" },
      ]} />

      <h2 id="how">How Shepi's Proof of Cash Works</h2>
      <StepList steps={[
        { title: "Upload bank statements and GL", description: "Connect your accounting integration for the GL, drop in PDF or CSV bank statements for each operating account" },
        { title: "Automatic matching", description: "Every deposit and disbursement matched to GL entries; transfers between owned accounts collapsed so they don't double-count" },
        { title: "Review the exception list", description: "Unmatched items, unsupported disbursements, and pattern flags surface in a single review queue with drill-through to source" },
        { title: "Export the schedule", description: "Proof of cash workbook tab and PDF slide export alongside the rest of the diligence deliverables — same source data, no re-keying" },
      ]} />

      <h2 id="pricing">Pricing</h2>
      <p>
        Proof of cash is included in every shepi project — flat <strong>{PRICING.perProject.display}</strong> per deal, no add-ons for the schedule or the PDF slide. See the full <Link to="/pricing">pricing page</Link> for what's included.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is proof of cash in M&A due diligence?", answer: "It's the diligence test that ties recorded GL activity back to actual bank statement activity period by period. When the two don't agree, the gap usually points to unrecorded liabilities, commingled owner spend, or revenue that never landed." },
        { question: "How does proof of cash software work?", answer: "Shepi ingests bank statements alongside the GL, matches every deposit and disbursement, and produces a period-by-period reconciliation schedule with the exceptions flagged for review." },
        { question: "How long does a proof of cash analysis take?", answer: "Manually, a 12–24 month proof of cash typically takes a CPA team one to two days per period of statements. Shepi produces the same schedule in minutes once the bank statements and GL are loaded." },
        { question: "Do lenders require proof of cash?", answer: "On most SBA and lower-middle-market deals, the lender or QoE provider expects a proof of cash schedule alongside the EBITDA bridge. It's the most direct validation that reported revenue actually hit the bank." },
        { question: "Is shepi's proof of cash a CPA-attested report?", answer: "No. Shepi is analytical software — the proof of cash workbook tab and PDF slide are workpapers and schedules, not an attestation or audit opinion. CPAs use them as the starting point for their own review." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/cash-proof-analysis", label: "Proof of Cash Methodology Guide" },
        { to: "/quality-of-earnings-software", label: "Quality of Earnings Software" },
        { to: "/quality-of-earnings-checklist", label: "QoE Checklist" },
        { to: "/guides/qoe-report-template", label: "QoE Report Template" },
      ]} />
    </ContentPageLayout>
  );
}
