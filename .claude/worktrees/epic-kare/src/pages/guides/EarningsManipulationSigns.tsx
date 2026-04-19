import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { StepList } from "@/components/content/StepList";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "revenue-manipulation", label: "Revenue Manipulation" },
  { id: "expense-manipulation", label: "Expense Manipulation" },
  { id: "balance-sheet-signals", label: "Balance Sheet Signals" },
  { id: "gl-level-indicators", label: "GL-Level Indicators" },
  { id: "detection-process", label: "Detection Process" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Signs of Earnings Manipulation in M&A",
  description: "How to detect earnings manipulation during M&A due diligence — revenue manipulation, expense timing, balance sheet signals, GL-level indicators, and systematic detection methods.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/earnings-manipulation-signs",
};

export default function EarningsManipulationSigns() {
  return (
    <ContentPageLayout
      title="Signs of Earnings Manipulation in M&A"
      seoTitle="Signs of Earnings Manipulation — Financial Statement Fraud Detection | Shepi"
      seoDescription="Learn to spot earnings manipulation in M&A due diligence. Revenue manipulation, expense timing, balance sheet red flags, GL-level indicators, and detection methods."
      canonical="https://shepi.ai/guides/earnings-manipulation-signs"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Earnings Manipulation Signs" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        Not all manipulation is fraud. Some sellers genuinely misunderstand GAAP, others make "optimistic" accounting choices ahead of a sale. Either way, your QoE analysis needs to catch it.
      </HeroCallout>

      <h2 id="overview">Overview</h2>
      <p>
        Earnings manipulation ranges from aggressive-but-legal accounting choices to outright fraud. In <Link to="/guides/quality-of-earnings">QoE analysis</Link>, the goal isn't to label the seller as fraudulent — it's to identify financial presentations that don't reflect the business's true earning power.
      </p>
      <p>
        The most common forms of manipulation in SMB and lower-middle-market transactions aren't sophisticated. They're often obvious once you know where to look.
      </p>

      <h2 id="revenue-manipulation">Revenue Manipulation Signs</h2>
      <BenefitGrid benefits={[
        { title: "Hockey stick revenue pattern", description: "Revenue flat for months, then spikes dramatically in the last month of a period — especially before a sale process" },
        { title: "Declining AR quality", description: "Revenue growing but AR aging deteriorating — suggests revenue recognized but not collectible" },
        { title: "Channel stuffing", description: "Unusually large shipments to distributors at period end, followed by returns in the next period" },
        { title: "Early recognition", description: "Revenue booked before delivery, installation, or performance obligation completion" },
        { title: "Bill-and-hold arrangements", description: "Revenue recognized without shipment — inventory still in the seller's warehouse" },
        { title: "Related-party revenue", description: "Revenue from entities controlled by the seller — may not represent arm's-length transactions" },
      ]} />

      <h2 id="expense-manipulation">Expense Manipulation Signs</h2>
      <BenefitGrid benefits={[
        { title: "Deferred maintenance", description: "Capex and maintenance spending declining ahead of a sale — reduces expenses but creates hidden liabilities" },
        { title: "Reclassifying COGS to CapEx", description: "Moving operating costs to the balance sheet through inappropriate capitalization — inflates EBITDA" },
        { title: "Reducing reserves", description: "Bad debt reserves, warranty reserves, or inventory reserves reduced without underlying improvement" },
        { title: "Delaying vendor payments", description: "AP aging increasing dramatically — expenses incurred but not paid, improving apparent cash flow" },
        { title: "Eliminating discretionary spending", description: "Cutting marketing, training, maintenance, and R&D to boost near-term earnings — not sustainable" },
        { title: "Prepaid expense manipulation", description: "Shifting current-period expenses to prepaid accounts to defer recognition" },
      ]} />

      <h2 id="balance-sheet-signals">Balance Sheet Signals</h2>
      <BenefitGrid benefits={[
        { title: "AR growing faster than revenue", description: "Days sales outstanding increasing suggests revenue recognition issues or collection problems" },
        { title: "Inventory build-up", description: "Inventory growing faster than COGS may indicate obsolescence or channel stuffing reversals" },
        { title: "Declining AP", description: "If AP is declining while revenue grows, the company may be paying vendors faster to hide financial stress" },
        { title: "Unusual other assets", description: "Growing 'other assets' or 'miscellaneous' balance sheet accounts may hide expenses being capitalized" },
        { title: "Off-balance-sheet obligations", description: "Operating leases, guarantees, or contingencies not reflected in the financials" },
      ]} />

      <h2 id="gl-level-indicators">GL-Level Indicators</h2>
      <BenefitGrid benefits={[
        { title: "Large round-dollar journal entries", description: "Manual entries in round amounts ($50,000, $100,000) suggest estimates or artificial adjustments" },
        { title: "Period-end entry clustering", description: "Concentration of manual entries in the last 3 days of a period is a classic manipulation signal" },
        { title: "Revenue journal entries", description: "Credits to revenue accounts from journal entries (not the billing system) warrant investigation" },
        { title: "Missing or vague descriptions", description: "Entries with no description or vague notes ('adjustment', 'correction') may be hiding their purpose" },
        { title: "Reversals in next period", description: "Large entries made at period end that reverse in the first week of the next period" },
      ]} />

      <h2 id="detection-process">Systematic Detection Process</h2>
      <StepList steps={[
        { title: "Compare trends to story", description: "Does the financial trajectory match the business narrative? Inconsistencies warrant investigation" },
        { title: "Analyze period-end activity", description: "Review all entries in the last 5 business days of each period — focus on manual journal entries" },
        { title: "Run ratio analysis", description: "DSO, DPO, DIO trends reveal timing manipulation. Margins that improve without operational explanation are suspicious" },
        { title: "Cross-reference external data", description: "Compare revenue to tax returns, bank deposits, and customer confirmations" },
        { title: "Apply AI anomaly detection", description: "Use AI to scan 100% of GL transactions for statistical anomalies, duplicates, and pattern deviations" },
        { title: "Review accounting policy changes", description: "Any change in revenue recognition, depreciation, or capitalization policy near the sale process is a red flag" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Is earnings manipulation the same as fraud?", answer: "Not necessarily. Fraud involves intentional deception. Earnings manipulation can range from aggressive-but-legal accounting choices to outright fraud. QoE analysis focuses on identifying the financial impact regardless of intent." },
        { question: "How common is manipulation in SMB acquisitions?", answer: "Some degree of 'optimistic' accounting is present in a majority of SMB sale processes. Obvious fraud is rare, but aggressive revenue recognition, deferred maintenance, and expense timing are common." },
        { question: "What should I do if I find manipulation?", answer: "Document the findings with supporting evidence, quantify the EBITDA impact, and present to your deal team. Depending on severity, options range from price adjustment to deal termination." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" },
        { to: "/guides/general-ledger-review", label: "General Ledger Review" },
        { to: "/guides/ai-accounting-anomaly-detection", label: "How AI Detects Anomalies" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
      ]} />
    </ContentPageLayout>
  );
}
