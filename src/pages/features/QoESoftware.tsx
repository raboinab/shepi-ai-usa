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
  { id: "what-is-qoe-software", label: "What Is QoE Software?" },
  { id: "who-its-for", label: "Who It's For" },
  { id: "capabilities", label: "Platform Capabilities" },
  { id: "how-it-works", label: "How It Works" },
  { id: "vs-manual", label: "QoE Software vs Manual" },
  { id: "output", label: "What You Get" },
  { id: "faq", label: "FAQ" },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Quality of Earnings software?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Quality of Earnings software automates the financial analysis process used in M&A due diligence. It ingests financial data, maps accounts, identifies EBITDA adjustments, flags anomalies, and generates lender-ready QoE reports — work that traditionally takes CPA firms 4-8 weeks.",
      },
    },
    {
      "@type": "Question",
      name: "Can QoE software replace a CPA firm?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QoE software handles the data-intensive analysis that consumes 80% of a traditional engagement. For deals requiring formal attestation, it complements CPA work. For deal screening, sell-side prep, and lower middle market transactions, it can serve as the primary analysis tool.",
      },
    },
    {
      "@type": "Question",
      name: "How much does QoE software cost compared to a CPA firm?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Traditional CPA QoE engagements cost $20,000+. shepi's AI-powered QoE platform starts at ${PRICING.perProject.display} per project, making professional-grade analysis accessible for deals of all sizes.`,
      },
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shepi — AI-Powered Quality of Earnings Software",
  applicationCategory: "FinanceApplication",
  description: "AI-powered Quality of Earnings software that automates EBITDA adjustments, GL analysis, and QoE report generation for M&A due diligence.",
  url: "https://shepi.ai",
  offers: {
    "@type": "Offer",
    price: PRICING.perProject.amount,
    priceCurrency: "USD",
  },
};

export default function QoESoftware() {
  return (
    <ContentPageLayout
      title="AI-Powered Quality of Earnings Software"
      seoTitle="Quality of Earnings AI Software | AI QoE Analysis Tool | Shepi"
      seoDescription="Quality of Earnings AI software that automates EBITDA adjustments, GL anomaly detection, revenue analysis, and lender-ready QoE reports — in hours, not weeks. AI quality of earnings built for M&A."
      canonical="https://shepi.ai/features/qoe-software"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "QoE Software" },
      ]}
      toc={toc}
      jsonLd={{ ...articleSchema, ...faqSchema }}
      heroAccent
    >
      <HeroCallout>
        Upload your financials. Get adjustment candidates and risk flags in minutes. Shepi is the QoE platform built for deal professionals who move fast.
      </HeroCallout>

      <StatRow stats={[
        { value: "2–4 hrs", label: "Initial analysis time" },
        { value: "100%", label: "GL transaction coverage" },
        { value: PRICING.perProject.display, label: "Per project pricing" },
      ]} />

      <h2 id="what-is-qoe-software">What Is Quality of Earnings Software?</h2>
      <p>
        Quality of Earnings software automates the financial analysis process at the center of every M&A transaction. Instead of analysts manually building spreadsheets over weeks, QoE software ingests financial data, maps accounts to standardized categories, identifies <Link to="/guides/ebitda-adjustments">EBITDA adjustments</Link>, flags anomalies, and generates lender-ready deliverables.
      </p>
      <p>
        Shepi is purpose-built for this workflow — from data ingestion through <Link to="/features/quickbooks-integration">QuickBooks integration</Link> or file upload, to AI-powered analysis, to exportable QoE reports. It's not a general-purpose accounting tool retrofitted for M&A; it's a <strong>diligence engine built for transactions</strong>.
      </p>

      <h2 id="who-its-for">Who Uses QoE Software?</h2>
      <BenefitGrid benefits={[
        { title: "Independent searchers", description: "Screen deals faster and reduce diligence costs before committing to a CPA engagement" },
        { title: "PE firms & deal teams", description: "Standardize analysis across portfolio screening without adding headcount" },
        { title: "M&A advisors", description: "Prepare sell-side QoE packages that accelerate timelines and control the narrative" },
        { title: "CPAs & QoE firms", description: "Handle 2–3× more engagements with AI doing the data-intensive work" },
        { title: "Business brokers", description: "Pre-listing financial assessments that compress diligence and close more deals" },
        { title: "Lenders", description: "Faster underwriting with standardized financial analysis for acquisition loans" },
      ]} />

      <h2 id="capabilities">Platform Capabilities</h2>
      <BenefitGrid benefits={[
        { title: "Automated account mapping", description: "Chart of accounts mapped to standardized QoE categories — eliminating days of manual work" },
        { title: "EBITDA adjustment engine", description: "AI scans the GL for non-recurring items, personal expenses, owner compensation, and add-back candidates" },
        { title: "GL anomaly detection", description: "Round-dollar analysis, duplicate detection, period-end clustering, and threshold flagging across 100% of transactions" },
        { title: "Revenue quality scoring", description: "Customer concentration, recurring vs non-recurring classification, AR aging, and trend analysis" },
        { title: "Working capital analysis", description: "Multi-period NWC schedules with turnover ratios, peg calculations, and seasonality adjustments" },
        { title: "Proof of cash", description: "GL-to-bank reconciliation that identifies unrecorded liabilities and commingled expenses" },
      ]} />

      <h2 id="how-it-works">How It Works</h2>
      <StepList steps={[
        { title: "Connect your data", description: "Upload financials, connect QuickBooks directly, or import trial balance data" },
        { title: "AI processes & maps", description: "Automatic account classification, multi-period alignment, and data normalization" },
        { title: "Review flagged items", description: "AI surfaces adjustment candidates, anomalies, and risk indicators for your review" },
        { title: "Apply your judgment", description: "Accept, modify, or reject findings — you're always in control of the analysis" },
        { title: "Export deliverables", description: "Generate lender-ready QoE reports, EBITDA bridges, and working capital schedules" },
      ]} />

      <h2 id="vs-manual">QoE Software vs Manual Analysis</h2>
      <ComparisonTable
        headers={["Dimension", "Manual / Excel", "Shepi QoE Software"]}
        rows={[
          ["Setup time", "Days (build templates, map accounts)", "Minutes (automated mapping)"],
          ["GL coverage", "Sample-based (10–20%)", "100% of transactions"],
          ["Anomaly detection", "Relies on analyst intuition", "Systematic pattern analysis"],
          ["Consistency", "Varies by analyst", "Standardized framework"],
          ["Timeline", "4+ weeks", "Hours to days"],
          ["Cost", "$20K+ (CPA firm)", `Starting at ${PRICING.perProject.display}`],
          ["Deliverables", "Custom Excel workbooks", "Structured reports + Excel export"],
        ]}
      />

      <h2 id="output">What You Get</h2>
      <BenefitGrid benefits={[
        { title: "Adjusted EBITDA bridge", description: "Net income to adjusted EBITDA with categorized adjustments and supporting detail" },
        { title: "Revenue analysis", description: "Customer concentration, recurring classification, trend analysis, and AR aging" },
        { title: "Working capital schedule", description: "Multi-period NWC with turnover ratios and normalized peg calculation" },
        { title: "Flagged transactions", description: "Categorized anomalies with confidence scores and suggested adjustment amounts" },
        { title: "Exportable workbook", description: "Full analysis exportable to Excel for sharing with deal parties and lenders" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is Quality of Earnings software?", answer: "QoE software automates the financial analysis used in M&A due diligence — account mapping, EBITDA adjustments, anomaly detection, and report generation — work that traditionally takes CPA firms weeks." },
        { question: "Can QoE software replace a CPA firm?", answer: "It handles the data-intensive 80% of a traditional engagement. For formal attestation, it complements CPA work. For screening, sell-side prep, and lower middle market deals, it can serve as the primary tool." },
        { question: "How much does QoE software cost?", answer: `Traditional CPA QoE costs $20K+. shepi starts at ${PRICING.perProject.display} per project.` },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/qoe-report-template", label: "QoE Report Template & Structure" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs Traditional CPA" },
        { to: "/features/ai-due-diligence", label: "AI for Financial Due Diligence" },
      ]} />
    </ContentPageLayout>
  );
}
