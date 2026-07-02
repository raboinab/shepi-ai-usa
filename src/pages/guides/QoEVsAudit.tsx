import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "financial-audit", label: "What Is a Financial Audit?" },
  { id: "quality-of-earnings", label: "What Is a Quality of Earnings Analysis?" },
  { id: "comparison", label: "QoE vs Audit Comparison" },
  { id: "why-it-matters", label: "Why the Difference Matters in M&A" },
  { id: "when-to-use", label: "When You Need Each" },
  { id: "replace", label: "Can a QoE Replace an Audit?" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings vs. Financial Audit: What's the Difference?",
  description: "Understand the difference between a Quality of Earnings analysis and a traditional financial audit. QoE is prospective and valuation-oriented; audits are historical and compliance-oriented.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-07-02",
  dateModified: "2026-07-02",
  mainEntityOfPage: "https://shepi.ai/guides/qoe-vs-audit",
};

export default function QoEVsAudit() {
  return (
    <ContentPageLayout
      title="Quality of Earnings vs. Financial Audit: What's the Difference?"
      seoTitle="Quality of Earnings vs Audit — Key Differences | Shepi"
      seoDescription="Quality of Earnings vs audit: learn how a QoE analysis differs from a financial audit. QoE is prospective and valuation-focused; audits are historical and compliance-focused."
      canonical="https://shepi.ai/guides/qoe-vs-audit"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "QoE vs Audit" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="July 2026"
      heroAccent
    >
      <HeroCallout>
        A financial audit asks, "Did the numbers happen?" A Quality of Earnings analysis asks, "What will the earnings look like after the deal closes?" They answer different questions — and in M&A, the second one usually matters more.
      </HeroCallout>

      <h2 id="overview">Overview</h2>
      <p>
        Buyers and sellers in M&A often ask whether they need a <strong>Quality of Earnings (QoE) analysis</strong> or a <strong>financial audit</strong>. The confusion is understandable: both involve CPAs, financial statements, and a close look at the numbers. But the two services have fundamentally different purposes, standards, and outputs.
      </p>
      <p>
        A financial audit is a <strong>backward-looking compliance exercise</strong> designed to verify that historical financial statements are presented fairly in accordance with GAAP. A Quality of Earnings analysis is a <strong>forward-looking, valuation-oriented exercise</strong> designed to show what a buyer can realistically expect the target to earn going forward.
      </p>

      <h2 id="financial-audit">What Is a Financial Audit?</h2>
      <p>
        A financial audit is an independent examination of a company's financial statements, performed by a licensed CPA firm, to express an opinion on whether those statements are presented fairly, in all material respects, in accordance with generally accepted accounting principles (GAAP).
      </p>
      <BenefitGrid benefits={[
        { title: "Primary purpose", description: "Provide reasonable assurance that historical financial statements are free of material misstatement" },
        { title: "Orientation", description: "Historical and compliance-focused — covers a period that has already ended" },
        { title: "Standard", description: "Performed under GAAS (Generally Accepted Auditing Standards) and PCAOB or AICPA rules" },
        { title: "Output", description: "An audit opinion letter — unqualified, qualified, adverse, or disclaimer" },
        { title: "Scope", description: "Material misstatement risk, internal controls, and conformity with GAAP" },
        { title: "Typical users", description: "Lenders, regulators, investors, board members, and external stakeholders" },
      ]} />

      <h2 id="quality-of-earnings">What Is a Quality of Earnings Analysis?</h2>
      <p>
        A <Link to="/guides/quality-of-earnings">Quality of Earnings analysis</Link> is a financial diligence exercise focused on normalizing and evaluating a company's earnings stream. Its goal is to determine how sustainable, recurring, and transferable the target's earnings are to a new owner.
      </p>
      <BenefitGrid benefits={[
        { title: "Primary purpose", description: "Identify normalized EBITDA and quantify earnings that a buyer can expect post-close" },
        { title: "Orientation", description: "Prospective and valuation-focused — models future earnings power" },
        { title: "Standard", description: "Agreed-upon procedures (AUP) or transaction advisory scope, not a formal audit opinion" },
        { title: "Output", description: "Analytical report with EBITDA adjustments, risk commentary, and working capital analysis" },
        { title: "Scope", description: "Revenue quality, expense normalization, owner add-backs, working capital peg, and proof of cash" },
        { title: "Typical users", description: "Buyers, sellers, private equity, searchers, lenders, and M&A advisors" },
      ]} />

      <h2 id="comparison">QoE vs Audit: Side-by-Side Comparison</h2>
      <ComparisonTable
        headers={["Dimension", "Financial Audit", "Quality of Earnings Analysis"]}
        rows={[
          ["Core question", "Did the numbers happen and are they GAAP-compliant?", "What will the business earn going forward?"],
          ["Time orientation", "Historical — covers a closed reporting period", "Prospective — focused on future earnings power"],
          ["Primary goal", "Compliance and assurance", "Valuation and deal negotiation"],
          ["Key output", "Audit opinion letter", "Normalized EBITDA and adjustment schedules"],
          ["Standards", "GAAP / GAAS / PCAOB", "Agreed-upon procedures or transaction advisory scope"],
          ["Earnings focus", "Reported net income under GAAP", "Adjusted, recurring, cash-supported EBITDA"],
          ["Owner add-backs", "Generally not analyzed", "Central to the analysis"],
          ["Working capital", "Disclosed as-is on balance sheet", "Normalized peg and trend analysis"],
          ["Revenue quality", "Recognized per GAAP", "Tested for sustainability and concentration"],
          ["Typical timing", "Annual, often required by lenders/investors", "Deal-driven, during exclusivity or pre-market"],
          ["Cost range", "$10K–$100K+ depending on size and complexity", `${PRICING.perProject.display}–$50K+ depending on approach and firm`],
          ["Who pays", "Company, lender, or investor", "Buyer, seller, or advisor depending on side"],
        ]}
      />

      <h2 id="why-it-matters">Why the Difference Matters in M&A</h2>
      <p>
        A company can have clean, audited financials and still be a risky acquisition. Audits verify that revenue was recorded correctly — but they do not necessarily tell you whether that revenue will recur after the seller leaves, whether the owner's salary is above-market, or whether the working capital needs are sustainable.
      </p>
      <p>
        Conversely, a QoE analysis does not provide assurance that last year's statements were audit-clean. It starts with the financials and reconstructs them to answer a different question: <em>what is the economic earning power of this business under new ownership?</em>
      </p>
      <BenefitGrid benefits={[
        { title: "Valuation accuracy", description: "Every uncaught EBITDA misstatement is multiplied by the purchase multiple. QoE protects against overpaying." },
        { title: "Deal structure", description: "Earnouts, seller notes, and equity rollovers depend on reliable earnings definitions." },
        { title: "Lender requirements", description: "SBA and acquisition lenders often require QoE in addition to historical financial statements." },
        { title: "Negotiation leverage", description: "Documented adjustments give buyers a concrete basis for price renegotiation." },
      ]} />

      <h2 id="when-to-use">When You Need an Audit vs. a QoE</h2>
      <BenefitGrid benefits={[
        { title: "Get a QoE when", description: "You are buying, selling, or financing a business and need to understand normalized, recurring earnings." },
        { title: "Get an audit when", description: "You need independent assurance that historical financial statements comply with GAAP — often for lenders, regulators, or investors." },
        { title: "Get both when", description: "The deal is material and lenders want historical assurance plus forward-looking earnings analysis." },
        { title: "Use Shepi's self-service when", description: "You need a fast, seller-prepared diligence package for initial screening or smaller deals." },
        { title: "Upgrade to DFY when", description: "The lender or buyer requires a CPA-reviewed QoE report." },
      ]} />
      <p>
        For most acquisitions and SBA-financed deals, the QoE is the more important document at closing — but it is not a substitute for audited financials when the lender or purchase agreement explicitly requires them.
      </p>

      <h2 id="replace">Can a Quality of Earnings Analysis Replace an Audit?</h2>
      <p>
        No — a QoE analysis and a financial audit are different tools. A QoE does not express an opinion on GAAP compliance, and an audit does not produce normalized EBITDA or deal-specific adjustments.
      </p>
      <p>
        That said, many lenders and buyers will accept a strong QoE report plus internally prepared financials when an audit is not otherwise required. The key is understanding what each document proves:
      </p>
      <ul>
        <li><strong>Audit:</strong> "We believe these historical statements are fairly stated."</li>
        <li><strong>QoE:</strong> "Here is what the business is likely to earn going forward, and here is why."</li>
      </ul>
      <p>
        In lower-middle-market M&A, the QoE is often the higher-value document because the deal price is driven by future earnings, not last year's GAAP net income.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Is a Quality of Earnings report an audit?", answer: "No. A QoE report is a financial due diligence analysis, not an audit. It does not express an opinion on whether financial statements comply with GAAP." },
        { question: "Do I need an audit or a QoE for an M&A deal?", answer: "Most buyers and lenders require a QoE to underwrite the deal. Some also require audited financials, especially for larger transactions or SBA loans. The two documents answer different questions." },
        { question: "Which is more expensive, a QoE or an audit?", answer: "Both vary by size and complexity. Traditional CPA-led QoE reports often start around $15K–$25K and can exceed $100K for complex deals. AI-assisted platforms like Shepi start at " + PRICING.perProject.display + " per project. Audits range from $10K for small businesses to six figures for larger entities." },
        { question: "Can audited financials replace a QoE?", answer: "No. Audited financials verify historical GAAP compliance; they do not normalize earnings for transaction purposes, identify owner add-backs, or set a working capital peg." },
        { question: "Who performs a Quality of Earnings analysis?", answer: "Traditionally, CPA firms with transaction advisory practices. AI-assisted platforms like Shepi can also produce QoE analysis, with optional CPA review for lender-ready outputs." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI-Assisted QoE vs Traditional CPA Firm" },
        { to: "/features/qoe-software", label: "AI-Powered QoE Software" },
      ]} />
    </ContentPageLayout>
  );
}
