import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "data-pulled", label: "Data Pulled" },
  { id: "benefits", label: "Key Benefits" },
  { id: "security", label: "Security & Privacy" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBooks Integration for Quality of Earnings",
  description: "How Shepi's QuickBooks integration streamlines QoE analysis — direct data pull, automatic account mapping, multi-period support, and secure OAuth connection.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/features/quickbooks-integration",
};

export default function QuickBooksIntegration() {
  return (
    <ContentPageLayout
      title="QuickBooks Integration for Quality of Earnings"
      seoTitle="QuickBooks Integration for QoE Analysis | Shepi"
      seoDescription="Connect QuickBooks directly to Shepi for seamless QoE analysis. Automatic trial balance import, account mapping, multi-period data, and secure OAuth connection."
      canonical="https://shepi.ai/features/quickbooks-integration"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "QuickBooks Integration" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        From raw QuickBooks data to structured QoE analysis in minutes — not hours of manual export and cleanup.
      </HeroCallout>

      <StatRow stats={[
        { value: "8–12 hours", label: "Saved on manual mapping" },
        { value: "3–5 years", label: "Of data in one click" },
        { value: "Zero", label: "Export errors" },
      ]} />

      <p className="text-lg">
        QuickBooks Online is the accounting system for millions of small and mid-size businesses — the exact businesses being acquired in lower-middle-market M&A. Shepi's native QuickBooks integration eliminates the manual data export step, getting you from raw books to structured <Link to="/guides/quality-of-earnings">QoE analysis</Link> in minutes.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Traditionally, the first step in any QoE analysis is requesting a trial balance export from the target company's accountant. This introduces delays (waiting for the accountant), errors (wrong date range, wrong basis, missing accounts), and friction (multiple rounds of "can you re-export with...").
      </p>
      <p>
        Shepi's QuickBooks integration bypasses all of this. Connect directly to the target's QuickBooks account, select your periods, and pull clean, complete data automatically.
      </p>

      <h2 id="how-it-works">How It Works</h2>
      <StepList steps={[
        { title: "Connect", description: "Authenticate via QuickBooks OAuth — the target company or their accountant grants read-only access" },
        { title: "Select periods", description: "Choose the fiscal years and interim periods you need for analysis" },
        { title: "Import", description: "Shepi pulls trial balance, chart of accounts, and supporting data automatically" },
        { title: "Map", description: "Accounts are auto-mapped to standardized income statement and balance sheet categories" },
        { title: "Analyze", description: "Proceed directly to analysis with clean, structured data" },
      ]} />

      <h2 id="data-pulled">What Data Is Pulled</h2>
      <BenefitGrid benefits={[
        { title: "Trial Balance", description: "Complete trial balance for each selected period" },
        { title: "Chart of Accounts", description: "Full account list with types and classifications" },
        { title: "Income Statement", description: "Multi-period P&L with account-level detail" },
        { title: "Balance Sheet", description: "Multi-period balance sheet with account-level detail" },
        { title: "Company Info", description: "Company name, fiscal year end, accounting method" },
      ]} />

      <h2 id="benefits">Key Benefits</h2>
      <BenefitGrid benefits={[
        { title: "Eliminate export errors", description: "No more wrong date ranges, missing accounts, or cash-vs-accrual confusion" },
        { title: "Save 8–12 hours", description: "Skip the manual mapping process — accounts are auto-classified" },
        { title: "Multi-period in one click", description: "Pull 3–5 years of data simultaneously" },
        { title: "Real-time data", description: "Access current financials without waiting for accountant availability" },
        { title: "Consistent formatting", description: "Every import uses the same structure, enabling apples-to-apples comparison across deals" },
      ]} />

      <h2 id="security">Security & Privacy</h2>
      <BenefitGrid benefits={[
        { title: "OAuth 2.0", description: "Industry-standard authentication — Shepi never sees or stores QuickBooks credentials" },
        { title: "Read-only access", description: "Shepi can only read data; it cannot modify the QuickBooks file" },
        { title: "Encrypted transit", description: "All data transferred over TLS 1.3" },
        { title: "Project isolation", description: "Imported data is tied to your project and invisible to other users" },
        { title: "Revocable access", description: "The QuickBooks account owner can disconnect Shepi at any time from their settings" },
      ]} />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Does this work with QuickBooks Desktop?", answer: "Currently, the direct integration supports QuickBooks Online. For Desktop users, you can export trial balance data to CSV or Excel and upload it to Shepi manually." },
        { question: "Does the target company need a Shepi account?", answer: "No. The target (or their accountant) only needs to authorize the QuickBooks connection. They don't need a Shepi account." },
        { question: "Can I disconnect after importing?", answer: "Yes. Once data is imported, you can disconnect the QuickBooks connection. The imported data remains in your project." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/due-diligence-checklist", label: "Due Diligence Checklist" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" },
      ]} />
    </ContentPageLayout>
  );
}
