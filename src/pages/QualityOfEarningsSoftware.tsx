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
  { id: "what", label: "What Is QoE Software" },
  { id: "features", label: "Core Features" },
  { id: "comparison", label: "Software vs Manual" },
  { id: "best-for", label: "Who It's Built For" },
  { id: "how", label: "How It Works" },
  { id: "best-software", label: "Best QoE Software" },
  { id: "faq", label: "FAQ" },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shepi — Quality of Earnings Software",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "AI-powered Quality of Earnings software for M&A due diligence. Automates EBITDA adjustments, GL analysis, working capital, and proof of cash.",
  url: "https://shepi.ai/quality-of-earnings-software",
  offers: { "@type": "Offer", price: PRICING.perProject.amount, priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is Quality of Earnings software?", acceptedAnswer: { "@type": "Answer", text: "QoE software automates the financial analysis used in M&A due diligence — account mapping, EBITDA adjustments, GL anomaly detection, working capital, and report generation. It replaces 4–8 weeks of manual CPA work with hours of AI-driven analysis." } },
    { "@type": "Question", name: "What is the best Quality of Earnings software?", acceptedAnswer: { "@type": "Answer", text: "Shepi is purpose-built for QoE on lower middle market and search-fund deals — full GL coverage, lender-ready reports, and flat $2,000 per-project pricing. Finsider serves a broader financial-intelligence use case." } },
    { "@type": "Question", name: "Can QoE software replace a CPA firm?", acceptedAnswer: { "@type": "Answer", text: "Software handles the data-intensive 80% of an engagement. For deals needing formal attestation, it complements CPA work. For screening, sell-side prep, and lower middle market deals, it can be the primary analysis tool." } },
  ],
};

export default function QualityOfEarningsSoftware() {
  return (
    <ContentPageLayout
      title="Quality of Earnings Software"
      seoTitle="Quality of Earnings Software — AI-Powered QoE in Hours | Shepi"
      seoDescription="Quality of Earnings software that automates EBITDA adjustments, GL analysis, working capital, and lender-ready QoE reports. Built for M&A. From $2,000/project."
      canonical="https://shepi.ai/quality-of-earnings-software"
      breadcrumbs={[{ label: "Quality of Earnings Software" }]}
      toc={toc}
      jsonLd={{ ...softwareSchema, ...faqSchema }}
      heroAccent
    >
      <HeroCallout>
        The QoE platform built for deal professionals. Upload financials, get adjustment candidates and risk flags in minutes, export lender-ready reports — all for {PRICING.perProject.display} per project.
      </HeroCallout>

      <StatRow stats={[
        { value: "100%", label: "GL transaction coverage" },
        { value: "2–4 hrs", label: "Initial analysis" },
        { value: PRICING.perProject.display, label: "Per project, flat" },
      ]} />

      <h2 id="what">What Is Quality of Earnings Software?</h2>
      <p>
        Quality of Earnings software automates the financial analysis at the center of every M&A transaction. Instead of analysts manually building Excel workbooks for 4–8 weeks, QoE software ingests trial balances and general ledgers, maps the chart of accounts, identifies <Link to="/guides/ebitda-adjustments">EBITDA adjustments</Link>, surfaces anomalies, and generates structured deliverables ready for lenders and deal parties.
      </p>
      <p>
        Unlike general-purpose accounting tools or BI platforms, true QoE software is purpose-built for the diligence workflow — from data ingestion to adjusted EBITDA bridge to <Link to="/proof-of-cash">proof of cash</Link>.
      </p>

      <h2 id="features">Core Features of QoE Software</h2>
      <BenefitGrid benefits={[
        { title: "Automated account mapping", description: "Chart of accounts mapped to standardized QoE categories without manual templating" },
        { title: "EBITDA adjustment engine", description: "AI scans the GL for non-recurring items, owner expenses, and add-back candidates" },
        { title: "GL anomaly detection", description: "Round-dollar, period-end clustering, duplicates, and threshold flags across 100% of transactions" },
        { title: "Working capital schedules", description: "Multi-period NWC with turnover ratios, peg calculation, and seasonality adjustments" },
        { title: "Proof of cash", description: "GL-to-bank reconciliation that surfaces unrecorded liabilities and commingled expenses" },
        { title: "Customer concentration", description: "Top customer analysis with revenue concentration and recurring vs non-recurring scoring" },
        { title: "QuickBooks integration", description: "Direct connection or file upload — no manual data extraction" },
        { title: "Lender-ready exports", description: "Structured QoE reports plus full Excel workbook for sharing" },
      ]} />

      <h2 id="comparison">QoE Software vs Manual Excel Process</h2>
      <ComparisonTable
        headers={["Dimension", "Manual / Excel", "Shepi QoE Software"]}
        rows={[
          ["Setup time", "Days (templates, mapping)", "Minutes"],
          ["GL coverage", "10–20% sample", "100% of transactions"],
          ["Anomaly detection", "Analyst intuition", "Systematic pattern analysis"],
          ["Consistency", "Varies by analyst", "Standardized framework"],
          ["Timeline", "4–8 weeks", "Hours to days"],
          ["Cost", "$20K+ (CPA firm)", `${PRICING.perProject.display}`],
          ["Revisions", "Billed hourly", "Unlimited"],
          ["Audit trail", "Manual workpapers", "Built-in traceability"],
        ]}
      />

      <h2 id="best-for">Who QoE Software Is Built For</h2>
      <BenefitGrid benefits={[
        { title: "Independent searchers", description: "Affordable diligence on search-fund-economics deals" },
        { title: "Private equity firms", description: "Standardize portfolio screening without adding headcount" },
        { title: "M&A advisors", description: "Sell-side QoE prep that controls the deal narrative" },
        { title: "CPAs & QoE firms", description: "Handle 2–3× more engagements with AI doing the heavy lifting" },
        { title: "Business brokers", description: "Pre-listing financial assessments to compress diligence" },
        { title: "Lenders", description: "Faster underwriting with standardized financial analysis" },
      ]} />

      <h2 id="how">How Shepi's QoE Software Works</h2>
      <StepList steps={[
        { title: "Connect data", description: "Upload financials, connect QuickBooks directly, or import trial balance files" },
        { title: "AI processes & maps", description: "Automatic account classification, multi-period alignment, and normalization" },
        { title: "Review findings", description: "AI surfaces adjustment candidates, anomalies, and risk indicators" },
        { title: "Apply judgment", description: "Accept, modify, or reject — you control the final analysis" },
        { title: "Export deliverables", description: "QoE reports, EBITDA bridges, working capital schedules, and Excel workbook" },
      ]} />

      <h2 id="best-software">Choosing the Best Quality of Earnings Software</h2>
      <p>
        The QoE software category is new — most "M&A platforms" are general financial-intelligence tools retrofitted for diligence. When evaluating, look for:
      </p>
      <ul>
        <li><strong>Full GL coverage</strong> — sample-based tools miss the long tail of personal expenses and one-time items</li>
        <li><strong>Lender-ready output</strong> — structured reports formatted the way lenders and deal parties expect</li>
        <li><strong>Proof of cash</strong> — most platforms skip this; it's where commingled expenses surface</li>
        <li><strong>Flat pricing</strong> — per-project pricing eliminates surprise invoices and rush premiums</li>
        <li><strong>Audit trail</strong> — every adjustment should trace back to source transactions</li>
      </ul>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is Quality of Earnings software?", answer: "Software that automates the financial analysis used in M&A due diligence — account mapping, EBITDA adjustments, anomaly detection, and report generation." },
        { question: "What is the best QoE software?", answer: "Shepi is purpose-built for QoE on lower middle market and search-fund deals with full GL coverage, lender-ready reports, and flat $2,000/project pricing." },
        { question: "How much does QoE software cost?", answer: `Shepi starts at ${PRICING.perProject.display} per project. See the full QoE cost breakdown.` },
        { question: "Can QoE software replace a CPA firm?", answer: "It handles 80% of the data-intensive work. For formal attestation, it complements CPA work; for screening and lower middle market deals it can be the primary tool." },
        { question: "Does QoE software work with QuickBooks?", answer: "Yes — Shepi connects directly to QuickBooks Online or accepts file uploads." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/quality-of-earnings-cost", label: "QoE Report Cost Guide" },
        { to: "/quality-of-earnings-template", label: "Free QoE Template" },
        { to: "/quality-of-earnings-checklist", label: "QoE Checklist" },
        { to: "/features/qoe-software", label: "Platform Capabilities" },
      ]} />
    </ContentPageLayout>
  );
}
