import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "pe-challenge", label: "The PE Challenge" },
  { id: "speed", label: "Speed Across Deal Volume" },
  { id: "consistency", label: "Consistency & Standardization" },
  { id: "portfolio-screening", label: "Portfolio Screening" },
  { id: "team-workflow", label: "Deal Team Workflow" },
  { id: "complement-cpa", label: "Complementing CPA Firms" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings for Private Equity & Deal Teams",
  description: "How PE firms and deal teams use AI-assisted QoE to screen deals faster, standardize analysis across the portfolio, and reduce diligence bottlenecks.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/pe-firms",
};

export default function PEFirms() {
  return (
    <ContentPageLayout
      title="Quality of Earnings for Private Equity & Deal Teams"
      seoTitle="QoE for Private Equity & Deal Teams | Shepi"
      seoDescription="How PE firms use AI-assisted Quality of Earnings to screen deals faster, standardize analysis across portfolios, and reduce due diligence bottlenecks."
      canonical="https://shepi.ai/use-cases/pe-firms"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "PE Firms" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        The bottleneck isn't finding deals — it's analyzing them fast enough to act.
      </HeroCallout>

      <StatRow stats={[
        { value: "2–4 hours", label: "Per target screening" },
        { value: "$30K–$100K", label: "External QoE cost avoided at screening stage" },
        { value: "Parallel", label: "Analyze multiple targets simultaneously" },
      ]} />

      <p className="text-lg">
        Private equity firms evaluate dozens — sometimes hundreds — of deals per year. Each one requires financial diligence. The bottleneck isn't finding deals; it's analyzing them fast enough to act. AI-assisted QoE gives deal teams the speed and consistency to screen more deals without adding headcount.
      </p>

      <h2 id="pe-challenge">The PE Challenge</h2>
      <p>
        Lower-middle-market and middle-market PE firms face a diligence capacity problem. External QoE engagements cost $30K–$100K each and take 4–8 weeks. You can't commission a full QoE on every deal you're considering — but you also can't afford to miss red flags because you skipped financial analysis on a promising target.
      </p>

      <h2 id="speed">Speed Across Deal Volume</h2>
      <p>
        Shepi enables a <strong>two-stage diligence approach</strong>: rapid internal screening with Shepi, followed by formal external QoE on deals that pass initial analysis.
      </p>
      <BenefitGrid benefits={[
        { title: "Pre-LOI screening", description: "2–4 hours per target vs. weeks of waiting for external QoE" },
        { title: "Parallel processing", description: "Analyze multiple targets simultaneously" },
        { title: "Data-driven decisions", description: "Make kill decisions based on actual financial analysis, not just CIM metrics" },
      ]} />

      <h2 id="consistency">Consistency & Standardization</h2>
      <p>One of PE's persistent challenges is ensuring consistent analysis quality across deal team members.</p>
      <BenefitGrid benefits={[
        { title: "Structured workflow", description: "Every analysis follows the same process — no missed steps" },
        { title: "Standard taxonomy", description: "Consistent categorization across all deals" },
        { title: "AI-assisted review", description: "Flags potential adjustments and red flags that less experienced analysts might miss" },
        { title: "Portfolio comparability", description: "Standardized output format makes it easy to compare targets" },
      ]} />

      <h2 id="portfolio-screening">Portfolio Screening</h2>
      <p>
        For platform companies making add-on acquisitions, speed is everything. The portfolio company's management team often does the initial financial review. Shepi gives them a structured framework without requiring deep M&A experience.
      </p>

      <h2 id="team-workflow">Deal Team Workflow</h2>
      <StepList steps={[
        { title: "Associate uploads financials", description: "Trial balance, income statement, balance sheet" },
        { title: "Shepi structures the data", description: "Auto-mapped accounts, multi-period analysis, preliminary findings" },
        { title: "Associate reviews and refines", description: "Validates adjustments, adds context, documents rationale" },
        { title: "VP/Partner reviews output", description: "Clean, consistent format for quick review and decision" },
        { title: "Go/no-go decision", description: "Based on normalized EBITDA, red flags, and working capital analysis" },
      ]} />

      <h2 id="complement-cpa">Complementing External QoE Providers</h2>
      <p>
        Shepi doesn't replace your relationship with CPA firms — it makes those engagements more efficient. When you commission external QoE, you can share Shepi's preliminary analysis as a starting point, reducing the CPA firm's ramp-up time and your costs.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "Can multiple team members work on the same project?", answer: "Projects can be shared with team members for collaborative analysis and review." },
        { question: "Is this suitable for deals above $50M enterprise value?", answer: "Shepi is optimized for lower-middle-market deals ($5M–$100M EV). For larger transactions, it serves as a screening and preparation tool that precedes formal external QoE." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/use-cases/deal-advisors", label: "Sell-Side QoE for Advisors" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" },
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
      ]} />
    </ContentPageLayout>
  );
}
