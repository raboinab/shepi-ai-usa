import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "what-is-nwc", label: "What Is Net Working Capital?" },
  { id: "why-it-matters", label: "Why It Matters in M&A" },
  { id: "working-capital-peg", label: "Working Capital Peg" },
  { id: "components", label: "Key Components" },
  { id: "turnover-ratios", label: "Turnover Ratios" },
  { id: "seasonality", label: "Seasonality Adjustments" },
  { id: "process", label: "Analysis Process" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Working Capital Analysis for M&A — NWC Peg, Turnover & Seasonality",
  description: "Complete guide to net working capital analysis in acquisitions: NWC calculation, working capital pegs, AR/AP turnover, inventory analysis, and seasonality adjustments.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/working-capital-analysis",
};

export default function WorkingCapitalAnalysis() {
  return (
    <ContentPageLayout
      title="Working Capital Analysis for M&A Due Diligence"
      seoTitle="Working Capital Analysis — NWC Peg, Turnover Ratios & Seasonality | Shepi"
      seoDescription="Master net working capital analysis for acquisitions. Learn NWC calculation, working capital peg negotiation, AR/AP/inventory turnover, and how seasonality affects the peg."
      canonical="https://shepi.ai/guides/working-capital-analysis"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Working Capital Analysis" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        Working capital is the cash engine of a business. Getting the peg wrong means you're either overpaying at close or underfunding the business post-acquisition.
      </HeroCallout>

      <StatRow stats={[
        { value: "12–24 mo", label: "Typical NWC peg lookback period" },
        { value: "DSO + DIO − DPO", label: "Cash conversion cycle formula" },
        { value: "#1", label: "Most negotiated QoE line item" },
      ]} />

      <h2 id="what-is-nwc">What Is Net Working Capital?</h2>
      <p>
        Net working capital (NWC) is the difference between a company's <strong>current operating assets</strong> and <strong>current operating liabilities</strong>. It represents the capital required to fund day-to-day operations.
      </p>
      <p>
        In M&A, NWC excludes cash, debt, and debt-like items — it focuses on the operating cycle: accounts receivable, inventory, prepaid expenses, accounts payable, accrued liabilities, and deferred revenue.
      </p>

      <h2 id="why-it-matters">Why Working Capital Matters in M&A</h2>
      <BenefitGrid benefits={[
        { title: "Purchase price adjustment", description: "Most deals include a working capital mechanism — the purchase price adjusts if NWC at close differs from the agreed peg" },
        { title: "Cash at close", description: "A buyer who underestimates NWC needs may face a cash crunch immediately post-acquisition" },
        { title: "Manipulation risk", description: "Sellers can inflate NWC pre-close by delaying AP payments or accelerating AR collections" },
        { title: "Seasonal businesses", description: "NWC swings dramatically in seasonal businesses — the peg methodology matters significantly" },
      ]} />

      <h2 id="working-capital-peg">Working Capital Peg Calculation</h2>
      <p>
        The working capital peg (or target) is the <strong>normalized level of NWC</strong> the seller agrees to deliver at closing. If actual NWC at close exceeds the peg, the buyer pays the surplus. If it falls short, the purchase price is reduced dollar-for-dollar.
      </p>
      <BenefitGrid benefits={[
        { title: "Trailing average", description: "Most common method — average NWC over the trailing 12 or 24 months" },
        { title: "Median approach", description: "Uses median rather than mean to reduce the impact of outlier months" },
        { title: "Normalized approach", description: "Adjusts individual components for known anomalies before averaging" },
        { title: "Collar mechanism", description: "Some deals use a collar (e.g., ±$50K) where small deviations don't trigger adjustments" },
      ]} />

      <h2 id="components">Key Components of NWC</h2>
      <BenefitGrid benefits={[
        { title: "Accounts receivable", description: "Amounts owed by customers — review aging, concentration, and bad debt reserves" },
        { title: "Inventory", description: "Raw materials, WIP, and finished goods — watch for obsolescence and slow-moving items" },
        { title: "Prepaid expenses", description: "Insurance, rent, and other prepayments — ensure they reflect normal operating levels" },
        { title: "Accounts payable", description: "Amounts owed to suppliers — verify payment terms are maintained at historical levels" },
        { title: "Accrued liabilities", description: "Wages, taxes, and other accruals — confirm they're adequate and consistently applied" },
        { title: "Deferred revenue", description: "Prepayments from customers for future services — a current liability that reduces NWC" },
      ]} />

      <h2 id="turnover-ratios">Turnover Ratios & Cash Conversion</h2>
      <p>
        Turnover ratios reveal how efficiently the business converts working capital into cash:
      </p>
      <BenefitGrid benefits={[
        { title: "Days Sales Outstanding (DSO)", description: "AR ÷ Revenue × 365 — how quickly customers pay. Rising DSO signals collection issues" },
        { title: "Days Inventory Outstanding (DIO)", description: "Inventory ÷ COGS × 365 — how long inventory sits. Rising DIO may indicate obsolescence" },
        { title: "Days Payable Outstanding (DPO)", description: "AP ÷ COGS × 365 — how slowly the company pays suppliers. Falling DPO may indicate strained vendor relationships" },
        { title: "Cash Conversion Cycle", description: "DSO + DIO − DPO — the total days from cash out to cash in. Lower is better" },
      ]} />

      <h2 id="seasonality">Seasonality Adjustments</h2>
      <p>
        Seasonal businesses require special attention in NWC analysis. A landscaping company's NWC in January looks very different from July. Using a simple trailing average without adjusting for seasonality produces a misleading peg.
      </p>
      <BenefitGrid benefits={[
        { title: "Monthly NWC mapping", description: "Chart NWC by month to visualize seasonal patterns" },
        { title: "Same-month comparison", description: "Compare each month to the same month in prior years" },
        { title: "Close date awareness", description: "If closing in a high-NWC month, a trailing average peg may be unfair to the seller" },
        { title: "Normalized peg", description: "Some deals use a seasonally-adjusted peg formula rather than a fixed dollar amount" },
      ]} />

      <h2 id="process">Working Capital Analysis Process</h2>
      <StepList steps={[
        { title: "Define included accounts", description: "Agree on which balance sheet accounts are in vs out of NWC (exclude cash, debt, tax-related)" },
        { title: "Build monthly NWC schedule", description: "Calculate NWC for each month in the analysis period (typically 24 months)" },
        { title: "Identify anomalies", description: "Flag months with unusual spikes or dips — investigate root causes" },
        { title: "Normalize components", description: "Adjust individual line items for known one-time events" },
        { title: "Calculate the peg", description: "Apply the agreed methodology (trailing average, median, normalized)" },
        { title: "Analyze turnover trends", description: "Review DSO, DIO, DPO trends for signs of manipulation or deterioration" },
        { title: "Assess seasonality", description: "Determine if seasonal adjustments are needed based on the closing timeline" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is a working capital peg?", answer: "A working capital peg is the agreed-upon level of net working capital the seller must deliver at closing. The purchase price adjusts dollar-for-dollar for any shortfall or surplus relative to the peg." },
        { question: "How do you calculate normalized working capital?", answer: "Normalized NWC is calculated by taking the trailing 12-24 month average of operating current assets minus operating current liabilities, after adjusting for one-time items, seasonal anomalies, and known changes." },
        { question: "Why is working capital so heavily negotiated?", answer: "Because it directly affects the cash the buyer pays at close. Every dollar of NWC above or below the peg adjusts the purchase price, making it one of the highest-stakes items in deal negotiations." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/guides/revenue-quality-analysis", label: "Revenue Quality Analysis" },
        { to: "/guides/cash-proof-analysis", label: "Cash & Bank Tie-Out Guide" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
      ]} />
    </ContentPageLayout>
  );
}
