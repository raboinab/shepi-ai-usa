import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-DCN4h0e5.js";
import { H as HeroCallout, B as BenefitGrid } from "./BenefitGrid-CqgEPSsd.js";
import { S as StatRow } from "./StatRow-D3wI_H-V.js";
import { S as StepList } from "./StepList-CaZJInNM.js";
import { A as AccordionFAQ } from "./AccordionFAQ-Cju-RuPF.js";
import { C as ComparisonTable } from "./ComparisonTable-CaWKj8lQ.js";
import { R as RelatedResourceCards } from "./RelatedResourceCards-cyLzBc8L.js";
import { P as PRICING } from "../main.mjs";
import "react";
import "lucide-react";
import "@radix-ui/react-slot";
import "./useBreadcrumbJsonLd-DC-feT7v.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
const toc = [
  { id: "challenge", label: "The Searcher's Challenge" },
  { id: "why-qoe", label: "Why Searchers Need QoE" },
  { id: "cost-barrier", label: "The Cost Barrier" },
  { id: "shepi-workflow", label: "How Shepi Fits" },
  { id: "searcher-checklist", label: "The Searcher's QoE Checklist" },
  { id: "search-fund-vs-self", label: "Search Fund vs. Self-Funded" },
  { id: "sba-requirements", label: "What SBA Lenders Want" },
  { id: "comparison", label: "Full QoE Firm vs. Shepi" },
  { id: "use-cases", label: "Searcher Use Cases" },
  { id: "when-cpa", label: "When You Still Need a CPA" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE Analysis for Independent Searchers & ETA",
  description: "How independent searchers and ETA professionals use AI-assisted Quality of Earnings analysis to screen deals faster, reduce costs, and make better acquisition decisions.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/independent-searchers"
};
function IndependentSearchers() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QoE Analysis for Independent Searchers & ETA",
      seoTitle: "Quality of Earnings for Independent Searchers & ETA | Shepi",
      seoDescription: "How independent searchers and ETA professionals use AI-assisted QoE to screen deals faster, reduce diligence costs, and build confidence in acquisition decisions.",
      canonical: "https://shepi.ai/use-cases/independent-searchers",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Independent Searchers" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Review 50 deals to close one — you can't spend $50K on QoE for every opportunity." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "$20K–$60K", label: "Traditional QoE cost" },
          { value: PRICING.perProject.display, label: "Per project with Shepi" },
          { value: "2–4 hours", label: "Initial analysis time" }
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg", children: "Independent searchers face a unique dilemma: you need professional-quality financial analysis to make confident acquisition decisions, but you're working with limited capital and often evaluating multiple deals simultaneously. Traditional QoE reports are priced for institutional buyers — not for searchers who might review 50 deals to close one." }),
        /* @__PURE__ */ jsx("h2", { id: "challenge", children: "The Searcher's Challenge" }),
        /* @__PURE__ */ jsx("p", { children: "Entrepreneurship Through Acquisition (ETA) has grown dramatically, with thousands of independent searchers actively looking for businesses to acquire. But the due diligence process hasn't evolved to match this new buyer profile." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "High volume, low conversion", description: "Reviewing 30–100 deals to close one means you can't spend $50K on QoE for every opportunity" },
          { title: "Self-funded diligence", description: "Unlike PE-backed buyers, searchers bear the cost of failed diligence themselves" },
          { title: "Limited M&A experience", description: "Many first-time buyers need guidance on what to look for" },
          { title: "Time pressure", description: "Sellers and brokers expect responsiveness; slow diligence kills deals" },
          { title: "Lender requirements", description: "SBA and other lenders increasingly require formal QoE, adding to costs" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-qoe", children: "Why Searchers Need Quality of Earnings" }),
        /* @__PURE__ */ jsx("p", { children: "Without QoE analysis, you're relying on the seller's financials at face value. This is risky because:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Overstated add-backs", description: "Owner add-backs may be overstated or fabricated" },
          { title: "Unsustainable revenue", description: "Revenue may include non-recurring or unsustainable items" },
          { title: "Hidden cash needs", description: "Working capital requirements may be understated, meaning more cash at closing" },
          { title: "Hidden liabilities", description: "Off-balance-sheet obligations or aggressive accounting may mask true performance" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "cost-barrier", children: "The Cost Barrier" }),
        /* @__PURE__ */ jsx("p", { children: "Traditional QoE from a CPA firm costs $20,000+ for a small business acquisition. For a searcher evaluating a $2M deal, that's 1–3% of enterprise value — a significant cost when the deal might not close. This creates two bad outcomes:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Skipping QoE entirely", description: "Proceeding without proper analysis and hoping for the best" },
          { title: "DIY in Excel", description: "Building ad-hoc spreadsheets without the structure or guidance of a professional analysis" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "shepi-workflow", children: "How Shepi Fits the Searcher Workflow" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Deal Screening (LOI Stage)", description: "Upload the seller's financials and get a structured analysis in hours, not weeks. Quickly identify whether earnings are real and sustainable before signing an LOI." },
          { title: "Due Diligence (Post-LOI)", description: "Deep-dive into multi-period analysis, build your EBITDA adjustment bridge, analyze working capital, and document findings professionally." },
          { title: "Negotiation Support", description: "Use documented analysis to negotiate the purchase price, working capital targets, and deal terms with credibility." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "searcher-checklist", children: "The Searcher's QoE Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "The diligence priorities for a sub-$10M search-fund or self-funded acquisition look different from an institutional PE deal. Here's what actually moves the needle on these transactions:" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Owner-comp normalization to a real replacement-CFO benchmark", description: "Don't just take the seller's add-back at face value. Benchmark against what a non-owner GM or CFO actually costs in your industry and market — typically $120K–$250K total comp for sub-$5M businesses, higher for skilled-trade or licensed-professional roles. The delta between owner draw and replacement cost is the legitimate add-back; everything else is at risk under buyer scrutiny." },
          { title: "Personal-expense add-backs with documented support", description: "Vehicle, phone, travel, meals, family payroll, country-club dues — these are common but each one needs a GL trace and a credible explanation. AI-assisted full-population review surfaces them; you decide which ones to defend." },
          { title: "Customer concentration disclosure (the SBA threshold)", description: "Any customer over 20% of revenue is a yellow flag for SBA lenders. Over 30% is a red flag that can kill the loan. Document concentration trends across the trailing 36 months — not just the latest year — and have a contingency narrative ready." },
          { title: "Working capital peg for sub-$5M deals", description: "Most LOIs at this size leave the WC peg vague. That's a $50K–$200K negotiation post-LOI. Calculate the trailing-12-month average net working capital, document the seasonality, and lock the peg in writing before signing." },
          { title: "Seller-financing and earnout diligence", description: "If part of consideration is a seller note or earnout tied to forward EBITDA, the QoE conclusions about sustainability of earnings directly drive the structure. Know what you're agreeing to before you sign the note." },
          { title: "3-year normalized cash-flow coverage for the lender", description: "SBA 7(a) underwriters want to see 1.25x debt service coverage on normalized historical cash flow. That's not a single number — it's a defensible bridge from reported net income through every adjustment to free cash flow. Build it once, defend it in underwriting." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "search-fund-vs-self", children: "Search Fund vs. Self-Funded: Different QoE Needs" }),
        /* @__PURE__ */ jsx("p", { children: '"Searcher" covers a wide range of buyer profiles, and the QoE requirements scale with the capital structure:' }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Self-funded searcher", description: "You're personally on the hook for diligence costs and the loan personal guarantee. Cost-efficiency matters most. AI-assisted analysis with your own review is usually the right structure unless your lender requires CPA attestation." },
          { title: "Traditional search fund (LP-backed)", description: "Your investors expect institutional-quality diligence. AI-assisted analysis still makes sense as the foundation, but most search funds engage a CPA firm for the final attested report — using AI-prepared workpapers to compress the engagement from $40K to $15–20K." },
          { title: "Independent sponsor / fundless sponsor", description: "You're raising deal-by-deal capital and the QoE is part of the LP marketing package. CPA attestation is usually expected. Use AI-assisted tooling to lengthen your runway between fundraising and close." },
          { title: "First-time direct buyer (no fund)", description: "If you're buying with personal capital and an SBA loan, your lender's requirements drive the format. Get the lender's QoE requirements in writing before you spend money on the engagement." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "sba-requirements", children: "What SBA Lenders Actually Want to See" }),
        /* @__PURE__ */ jsx("p", { children: "SBA 7(a) acquisition lending is the largest source of capital for sub-$5M business buyers. The underwriting requirements have tightened materially over the past two years. Here's what underwriters consistently ask for in a QoE — and where AI-assisted analysis can shorten the cycle:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "DSCR ≥ 1.25x on normalized cash flow", description: "Debt service coverage ratio calculated on the trailing-12-month or trailing-3-year normalized EBITDA, less capex, less working capital changes. Show the math, line by line, drillable to source." },
          { title: "3-year historical normalization", description: "Underwriters want to see how add-backs trended over time, not just a single-period snapshot. Inconsistent year-over-year add-backs are a red flag." },
          { title: "Customer concentration narrative", description: "If any customer is over 20% of revenue, you need a documented mitigation: contract length, switching costs, relationship depth, contingency plan if lost." },
          { title: "Quality of revenue (recurring vs. one-time)", description: "Underwriters increasingly ask for revenue broken down by recurring/contracted vs. project-based vs. one-time. Recurring revenue carries more credit weight." },
          { title: "Working capital peg with seasonality", description: "Show the monthly working capital trend across 24+ months. Lenders want to fund both the purchase price AND the working capital cycle, not just the purchase price." },
          { title: "Add-back support documentation", description: "Every material add-back needs a source citation — invoice, contract, GL line, or management representation. 'Owner discretionary' is not a documented add-back." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison", children: "Full QoE Firm vs. AI-Assisted with Shepi" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Dimension", "Traditional CPA QoE", "AI-Assisted with Shepi"],
            rows: [
              ["Cost per deal", "$20K–$60K", `${PRICING.perProject.display} per project`],
              ["Time to first findings", "3–6 weeks", "Hours to days"],
              ["Population coverage", "Sample-based (5–15% of GL)", "100% of GL transactions"],
              ["Best for LOI screening", "Too slow and expensive", "Yes — designed for it"],
              ["Best for SBA-attested QoE", "Yes (when lender requires CPA sign-off)", "Workpaper foundation; pair with CPA review"],
              ["Audit trail", "Workpapers, varies by firm", "Every adjustment traced to GL + source doc"],
              ["Reusability across deals", "Each deal is a new engagement", "One subscription covers unlimited deals"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { children: "The honest answer for most searchers: use AI-assisted analysis on every LOI you screen, then engage a CPA only on the deals you're actually closing — and only if your lender requires attestation. That's how you keep diligence cost proportional to deal value." }),
        /* @__PURE__ */ jsx("h2", { id: "use-cases", children: "Specific Searcher Use Cases" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Self-funded searchers", description: "Minimize diligence costs while maintaining professional standards" },
          { title: "Funded searchers", description: "Accelerate analysis to review more deals within your search window" },
          { title: "Search fund principals", description: "Provide institutional-quality analysis to your investor base" },
          { title: "First-time buyers", description: "Shepi's AI assistant provides guidance on what to look for and how to interpret findings" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "when-cpa", children: "When You Still Need a CPA Firm" }),
        /* @__PURE__ */ jsx("p", { children: "Shepi accelerates and structures your analysis, but some situations still call for a formal CPA engagement:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "SBA loan requirements", description: "Many lenders require QoE from an independent CPA firm" },
          { title: "Complex accounting issues", description: "Revenue recognition, construction accounting, or multi-entity consolidation" },
          { title: "Investor requirements", description: "Some investors mandate third-party QoE as a condition of funding" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Even in these cases, Shepi serves as the analytical foundation — your CPA firm can use Shepi's workpapers as a starting point, significantly reducing their engagement time and your cost. For a longer take on where AI fits and where human judgment remains essential, read",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ai-wont-do-your-qoe", className: "text-primary hover:underline", children: "AI Won't Do Your Quality of Earnings Analysis For You" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Do search funds need a QoE?", answer: "Yes — virtually every search fund LP base expects a QoE on any acquisition target. The question is usually format: traditional search funds typically engage a CPA firm for an attested report, while self-funded and fundless searchers often use AI-assisted analysis with their own sign-off, escalating to a CPA only when the lender requires it." },
          { question: "What does a QoE cost for a search fund or SBA deal?", answer: "Traditional CPA QoE for a sub-$10M deal typically runs $20K–$40K and takes 4–8 weeks. AI-assisted analysis with Shepi runs at our standard per-project pricing and takes hours to days. Many searchers use AI-assisted analysis at the LOI stage on every deal, then engage a CPA only on deals they're actually closing — keeping diligence cost proportional to deal value." },
          { question: "Can I do my own QoE as a searcher?", answer: "On smaller deals (under $3M, no institutional capital, lender doesn't require attestation): yes, many searchers run the analysis themselves with AI-assisted tooling and produce a defensible workbook. On larger deals or anything requiring SBA-lender CPA attestation, you'll want a CPA reviewing or signing — but you can still do most of the data work yourself, which compresses the CPA engagement significantly." },
          { question: "Is a sell-side QoE enough, or do I need my own buy-side?", answer: "Always do your own buy-side analysis. Sell-side QoE is prepared by the seller's advisors to put the business in the best light — it's a starting point, not a substitute. At minimum, run your own AI-assisted analysis to validate the sell-side numbers and identify anything they didn't surface." },
          { question: "How long does QoE take for a search fund deal?", answer: "AI-assisted analysis: hours to a few days from data receipt. Traditional CPA QoE for a search-fund-sized deal: typically 4–8 weeks. Most searchers run AI-assisted analysis during the exclusivity window and engage a CPA in parallel only if the deal is moving toward close." },
          { question: "Will SBA lenders accept AI-assisted QoE?", answer: "It depends on the lender and deal size. Many SBA preferred lenders accept AI-assisted analysis when reviewed and signed by the buyer or a CPA. Larger SBA acquisitions or institutional lenders typically still require CPA-attested QoE. Always get the QoE format requirement from your lender in writing before spending money on the engagement." },
          { question: "Can I share Shepi analysis with my lender?", answer: "Yes — Shepi exports to professional-format PDF reports and Excel workbooks suitable for lender review. If your lender requires CPA-attested QoE specifically, Shepi's output accelerates that engagement and significantly reduces the CPA's time and your cost." },
          { question: "How many deals can I analyze per month?", answer: "With a monthly subscription, you can analyze unlimited deals — designed for active searchers screening multiple opportunities at the LOI stage." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ai-wont-do-your-qoe", label: "AI Won't Do Your QoE Analysis For You" },
          { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
          { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
          { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
          { to: "/guides/customer-concentration-risk", label: "Customer Concentration Risk Analysis" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" }
        ] })
      ]
    }
  );
}
export {
  IndependentSearchers as default
};
