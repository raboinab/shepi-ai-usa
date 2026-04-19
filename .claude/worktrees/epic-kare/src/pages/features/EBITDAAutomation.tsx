import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "what-is-ebitda-automation", label: "What Is EBITDA Automation?" },
  { id: "what-gets-automated", label: "What Gets Automated" },
  { id: "adjustment-types", label: "Adjustment Types Detected" },
  { id: "how-it-works", label: "How It Works" },
  { id: "vs-manual", label: "Automated vs Manual" },
  { id: "use-cases", label: "Use Cases" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EBITDA Normalization & Add-Back Automation",
  description: "How AI automates EBITDA normalization and add-back identification for M&A due diligence — from GL scanning to categorized adjustment schedules.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/features/ebitda-automation",
};

export default function EBITDAAutomation() {
  return (
    <ContentPageLayout
      title="EBITDA Normalization & Add-Back Automation"
      seoTitle="EBITDA Add-Back Automation — Normalize EBITDA with AI | Shepi"
      seoDescription="Automate EBITDA normalization and add-back identification. AI scans your GL for non-recurring items, owner expenses, and pro forma adjustments — in minutes, not weeks."
      canonical="https://shepi.ai/features/ebitda-automation"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "EBITDA Automation" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      heroAccent
    >
      <HeroCallout>
        Upload your GL and let Shepi surface add-back candidates automatically. Every transaction analyzed, every adjustment categorized, every finding documented.
      </HeroCallout>

      <StatRow stats={[
        { value: "100%", label: "GL transactions scanned" },
        { value: "5 categories", label: "Adjustment taxonomy" },
        { value: "Minutes", label: "To first adjustment candidates" },
      ]} />

      <h2 id="what-is-ebitda-automation">What Is EBITDA Automation?</h2>
      <p>
        EBITDA normalization is the process of adjusting reported earnings to reflect the <strong>true, recurring earning power</strong> of a business. Traditionally, this means an analyst manually reviewing every account, every vendor, and every transaction to identify items that don't represent ongoing operations.
      </p>
      <p>
        Shepi automates this by scanning 100% of GL transactions using AI pattern recognition, categorizing potential adjustments using a <Link to="/guides/ebitda-adjustments">standardized taxonomy</Link>, and presenting findings for your review — with supporting evidence attached.
      </p>

      <h2 id="what-gets-automated">What Gets Automated</h2>
      <BenefitGrid benefits={[
        { title: "GL scanning", description: "Every transaction reviewed for adjustment candidates — not a sample, the entire ledger" },
        { title: "Pattern recognition", description: "AI identifies recurring vs non-recurring items, seasonal patterns, and anomalies" },
        { title: "Categorization", description: "Each candidate automatically classified: owner/seller, non-recurring, pro forma, related party, or accounting policy" },
        { title: "Quantification", description: "Dollar impact calculated across all analysis periods with period-over-period trending" },
        { title: "Documentation scaffolding", description: "Each adjustment linked to source transactions with suggested rationale" },
        { title: "Bridge generation", description: "Net income to adjusted EBITDA bridge built automatically as adjustments are confirmed" },
      ]} />

      <h2 id="adjustment-types">Adjustment Types Detected</h2>
      <BenefitGrid benefits={[
        { title: "Owner compensation", description: "Above-market salary, bonuses, benefits, personal expenses — normalized to market-rate replacement" },
        { title: "Non-recurring expenses", description: "Litigation, one-time consulting, disaster costs, COVID impacts, restructuring charges" },
        { title: "Non-recurring revenue", description: "PPP forgiveness, insurance proceeds, asset sales, one-time contract revenue" },
        { title: "Pro forma adjustments", description: "Annualized contracts, mid-period price changes, new hires/terminations" },
        { title: "Related party transactions", description: "Below/above-market rent, management fees, non-arm's-length vendor arrangements" },
        { title: "Accounting policy", description: "Revenue recognition timing, capitalization vs expensing, accrual differences" },
      ]} />

      <h2 id="how-it-works">How It Works</h2>
      <StepList steps={[
        { title: "Ingest financial data", description: "Connect QuickBooks, upload trial balance, or import GL export" },
        { title: "AI scans the ledger", description: "Pattern recognition identifies adjustment candidates across all accounts and periods" },
        { title: "Review candidates", description: "Each finding presented with category, amount, confidence score, and source transactions" },
        { title: "Apply judgment", description: "Accept, modify, or reject — you control the final adjusted EBITDA" },
        { title: "Export the bridge", description: "Generate a formatted EBITDA bridge with supporting detail for deal parties" },
      ]} />

      <h2 id="vs-manual">Automated vs Manual EBITDA Normalization</h2>
      <ComparisonTable
        headers={["Dimension", "Manual Process", "Shepi Automation"]}
        rows={[
          ["Coverage", "Sample-based review", "100% of transactions"],
          ["Time to first findings", "1–2 weeks", "Minutes"],
          ["Categorization", "Analyst judgment only", "AI + analyst judgment"],
          ["Consistency", "Varies by engagement", "Standardized taxonomy"],
          ["Documentation", "Built manually in Excel", "Auto-generated with source links"],
          ["Period comparison", "Separate analysis per period", "Multi-period analysis built-in"],
        ]}
      />

      <h2 id="use-cases">Use Cases</h2>
      <BenefitGrid benefits={[
        { title: "Pre-LOI screening", description: "Run a quick EBITDA normalization before committing to a deal — know what you're buying" },
        { title: "Sell-side preparation", description: "Identify and document add-backs before buyers do — control the narrative" },
        { title: "CPA engagement acceleration", description: "Start with AI-identified candidates, let the CPA focus on judgment calls" },
        { title: "Portfolio monitoring", description: "Track normalized EBITDA across portfolio companies with consistent methodology" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Does the AI automatically apply adjustments?", answer: "No. Shepi identifies and categorizes adjustment candidates, but you decide which adjustments to accept. Professional judgment is always in the loop." },
        { question: "What if the AI misses an adjustment?", answer: "You can manually add adjustments at any time. The AI handles the bulk of scanning; you bring the deal context and industry expertise." },
        { question: "How does categorization work?", answer: "Shepi uses a standardized 5-category taxonomy (owner/seller, non-recurring, pro forma, related party, accounting policy) consistent with professional QoE practices." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/guides/ebitda-bridge", label: "EBITDA Bridge Analysis" },
        { to: "/guides/general-ledger-review", label: "General Ledger Review" },
        { to: "/features/qoe-software", label: "QoE Software Platform" },
      ]} />
    </ContentPageLayout>
  );
}
