import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "what-is-sde", label: "What Is SDE?" },
  { id: "sde-vs-ebitda", label: "SDE vs EBITDA" },
  { id: "formula", label: "SDE Formula" },
  { id: "add-backs", label: "Common SDE Add-Backs" },
  { id: "multiples", label: "SDE Multiples" },
  { id: "example", label: "Worked Example" },
  { id: "mistakes", label: "Common Mistakes" },
  { id: "faq", label: "FAQ" },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Seller's Discretionary Earnings (SDE): Formula, Add-Backs & Examples",
  description:
    "Complete guide to Seller's Discretionary Earnings (SDE) — what it is, how to calculate it, how it differs from EBITDA, common add-backs, and typical SMB valuation multiples.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-05-13",
  dateModified: "2026-05-13",
  mainEntityOfPage: "https://shepi.ai/guides/sellers-discretionary-earnings",
};

const faqItems = [
  {
    question: "What is Seller's Discretionary Earnings?",
    answer:
      "Seller's Discretionary Earnings (SDE) is a measure of total financial benefit a single full-time owner-operator receives from a small business. It equals pre-tax net income plus interest, taxes, depreciation, amortization, owner's compensation, and discretionary or non-recurring expenses. SDE is the standard earnings metric used to value owner-operated SMBs under roughly $5M in revenue.",
  },
  {
    question: "What's the difference between SDE and EBITDA?",
    answer:
      "SDE adds back the owner's full compensation and benefits; EBITDA does not. SDE assumes one working owner. EBITDA assumes the owner is replaced with a market-rate manager and only adds back the portion above market. SDE is used for owner-operated small businesses; EBITDA is used for larger businesses where management is already a paid expense.",
  },
  {
    question: "What is a typical SDE multiple for a small business?",
    answer:
      "Most main-street small businesses sell for 2.0×–3.5× SDE. Service businesses and asset-light companies often land at 2.0×–2.5×. Established businesses with recurring revenue, low owner dependency, or strong brand can reach 3.5×–4.5×. Multiples above 4× SDE are uncommon and usually require unusual growth, contracts, or moats.",
  },
  {
    question: "When should I use SDE instead of EBITDA?",
    answer:
      "Use SDE when valuing an owner-operated business with one working owner and revenue under roughly $5M. Use EBITDA when the business has professional management in place, multiple owner-operators, or revenue above $5M where buyers will underwrite to a hired-CEO scenario.",
  },
  {
    question: "Do lenders accept SDE for SBA loans?",
    answer:
      "Yes. SBA 7(a) lenders routinely underwrite acquisition loans on SDE for owner-operated businesses, typically requiring SDE coverage of debt service of at least 1.25×. Lenders will scrutinize add-backs and require documentation for each one.",
  },
  {
    question: "Can SDE be negative?",
    answer:
      "Yes. A business with persistent losses even after adding back owner compensation has negative SDE and is generally not financeable through a traditional acquisition loan. Buyers in that situation are typically buying assets, customer lists, or turnaround opportunities rather than cash flow.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function SellersDiscretionaryEarnings() {
  return (
    <ContentPageLayout
      title="Seller's Discretionary Earnings (SDE): Formula, Add-Backs & Examples"
      seoTitle="Seller's Discretionary Earnings (SDE) — Formula & Examples | Shepi"
      seoDescription="Learn what Seller's Discretionary Earnings (SDE) is, how to calculate it, how it differs from EBITDA, common add-backs, and SMB valuation multiples."
      canonical="https://shepi.ai/guides/sellers-discretionary-earnings"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Seller's Discretionary Earnings" },
      ]}
      toc={toc}
      jsonLd={[articleSchema, faqSchema]}
      publishedDate="May 2026"
      modifiedDate="May 2026"
      heroAccent
    >
      <HeroCallout>
        Seller's Discretionary Earnings is the single most important number in valuing an owner-operated business — and the easiest one for a seller to inflate. Buyers who can't defend their SDE calculation overpay.
      </HeroCallout>

      <p className="text-lg">
        <strong>Seller's Discretionary Earnings (SDE)</strong> is the total cash benefit a single full-time owner receives from a small business — pre-tax net income plus interest, taxes, depreciation, amortization, the owner's full compensation and benefits, and any non-recurring or discretionary expenses. It is the standard earnings metric for valuing owner-operated SMBs.
      </p>

      <h2 id="what-is-sde">What Is Seller's Discretionary Earnings?</h2>
      <p>
        SDE answers a simple question: <em>how much money would one full-time working owner make from this business in a normal year?</em> It rolls up every form of economic benefit the owner receives — paycheck, payroll taxes, health insurance, retirement match, vehicle, phone, meals — into a single figure that buyers and lenders use to underwrite the deal.
      </p>
      <p>
        SDE is most often used for businesses with revenue under roughly $5M where one owner-operator runs the company. Above that threshold, buyers typically switch to <Link to="/guides/ebitda-adjustments">adjusted EBITDA</Link>, which assumes the owner is replaced with a market-rate manager.
      </p>

      <h2 id="sde-vs-ebitda">SDE vs EBITDA: What's the Difference?</h2>
      <p>
        The two metrics look similar but make opposite assumptions about owner labor:
      </p>
      <BenefitGrid benefits={[
        { title: "SDE", description: "Adds back 100% of owner compensation and benefits. Assumes one working owner who is part of the deal economics." },
        { title: "EBITDA", description: "Adds back only owner compensation above market rate. Assumes a hired manager replaces the owner at fair market salary." },
        { title: "Used for", description: "SDE: main-street SMBs under ~$5M revenue. EBITDA: lower-middle-market and up, or absentee-owner businesses." },
        { title: "Multiples", description: "SDE: typically 2.0×–3.5×. EBITDA: typically 4×–8× for lower-middle-market." },
      ]} />
      <p>
        A $1.5M-revenue HVAC business with $300K owner pay might show $400K SDE but only $175K adjusted EBITDA — same business, different lens. The SDE buyer plans to run it themselves; the EBITDA buyer plans to hire a GM.
      </p>

      <h2 id="formula">The SDE Formula</h2>
      <p>The standard SDE calculation:</p>
      <BenefitGrid benefits={[
        { title: "Start with", description: "Pre-tax net income (from the P&L)" },
        { title: "Add back", description: "Interest expense" },
        { title: "Add back", description: "Income taxes (federal and state)" },
        { title: "Add back", description: "Depreciation and amortization" },
        { title: "Add back", description: "Owner's W-2 compensation, payroll taxes, and benefits" },
        { title: "Add back", description: "Discretionary and non-recurring expenses" },
      ]} />
      <p>
        Only <strong>one</strong> owner's compensation is added back. If a husband-and-wife team both work full time, the second owner's pay must be replaced with a market-rate equivalent, not added back in full.
      </p>

      <h2 id="add-backs">Common SDE Add-Backs</h2>
      <p>Beyond the formula items, these adjustments routinely appear in SDE calculations:</p>
      <ul>
        <li><strong>Owner health insurance and retirement contributions</strong> — full add-back</li>
        <li><strong>Owner vehicle expenses</strong> — lease, fuel, insurance, repairs</li>
        <li><strong>Owner phone, meals, travel</strong> — personal portion only</li>
        <li><strong>Family members on payroll above market</strong> — the above-market portion</li>
        <li><strong>One-time legal or professional fees</strong> — lawsuits, restructuring, prior-owner disputes</li>
        <li><strong>Non-recurring repairs or capital expenses</strong> — items the new owner won't repeat</li>
        <li><strong>Charitable contributions</strong> — discretionary, owner-driven</li>
        <li><strong>Above-market related-party rent or services</strong> — normalized to market</li>
      </ul>
      <p>
        For a deeper treatment of how these are documented and defended, see our guides on <Link to="/guides/owner-compensation-normalization">owner compensation normalization</Link> and <Link to="/guides/personal-expense-detection">personal expense detection</Link>.
      </p>

      <h2 id="multiples">SDE Multiples by Business Type</h2>
      <p>
        Multiples vary by industry, size, owner dependency, recurring revenue, and growth. Approximate ranges from broker market data:
      </p>
      <BenefitGrid benefits={[
        { title: "Service businesses", description: "2.0×–2.8× SDE — landscaping, cleaning, contractors with high owner dependency" },
        { title: "Trades & home services", description: "2.5×–3.5× SDE — HVAC, plumbing, electrical with established crews and call volume" },
        { title: "Retail & restaurants", description: "1.5×–2.5× SDE — depends heavily on lease terms and brand" },
        { title: "E-commerce & online", description: "2.5×–4.0× SDE — higher for SaaS-like recurring revenue or strong brand" },
        { title: "B2B services & manufacturing", description: "3.0×–4.5× SDE — recurring contracts, customer diversification, less owner dependency" },
        { title: "Professional practices", description: "1.0×–3.0× SDE — heavily dependent on transferability of client relationships" },
      ]} />

      <h2 id="example">Worked Example: Calculating SDE</h2>
      <p>A $2.4M-revenue commercial cleaning business reports $185K of pre-tax net income. The SDE build-up:</p>
      <ul>
        <li>Pre-tax net income: <strong>$185,000</strong></li>
        <li>+ Interest expense: $22,000</li>
        <li>+ Depreciation: $48,000</li>
        <li>+ Owner W-2 compensation: $145,000</li>
        <li>+ Owner payroll taxes: $11,000</li>
        <li>+ Owner health insurance & 401(k) match: $24,000</li>
        <li>+ Owner vehicle (lease, fuel, insurance): $14,000</li>
        <li>+ One-time legal fees (resolved dispute): $18,000</li>
        <li>+ Charitable contributions: $6,000</li>
      </ul>
      <p>
        <strong>SDE = $473,000.</strong> At a 2.8× multiple, the indicated business value is $1,324,000 plus inventory and working capital adjustments per the LOI.
      </p>

      <h2 id="mistakes">Common SDE Mistakes</h2>
      <BenefitGrid benefits={[
        { title: "Adding back two owners' pay in full", description: "Only one owner's compensation is fully added back. The second is replaced with a market-rate equivalent." },
        { title: "Calling recurring expenses one-time", description: "If legal fees, repairs, or 'consulting' show up every year, they're recurring — not add-backs." },
        { title: "Ignoring required reinvestment", description: "Maintenance capex and equipment replacement are real costs. SDE that ignores them overstates buyer cash flow." },
        { title: "Over-aggressive personal expenses", description: "Inflating personal expense add-backs is the most common way sellers and brokers overstate SDE. Buyers should require documentation." },
        { title: "Mixing SDE and EBITDA", description: "Quoting an SDE multiple against an EBITDA-style number (or vice versa) leads to either overpaying or undervaluing by 30%+." },
        { title: "Single-year SDE", description: "One good year is not the business. Use 3-year trailing SDE and a TTM figure to smooth volatility." },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={faqItems} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
        { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
        { to: "/guides/personal-expense-detection", label: "Personal Expense Detection" },
        { to: "/guides/qoe-report-template", label: "QoE Report Template & Structure" },
      ]} />
    </ContentPageLayout>
  );
}
