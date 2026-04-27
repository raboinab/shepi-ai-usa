import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
import { S as StepList } from "./StepList-qzihzp1y.js";
import "react";
import "lucide-react";
import "../main.mjs";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
const toc = [
  { id: "why-brokers", label: "Why Brokers Should Care" },
  { id: "pre-listing", label: "Pre-Listing Assessment" },
  { id: "buyer-confidence", label: "Building Buyer Confidence" },
  { id: "workflow", label: "Broker Workflow" },
  { id: "time-to-close", label: "Accelerating Time to Close" },
  { id: "value-to-sellers", label: "Value to Sellers" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE for Business Brokers",
  description: "How business brokers use pre-listing financial assessments and QoE analysis to close more deals, build buyer confidence, and accelerate time to close.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-22",
  dateModified: "2026-02-22",
  mainEntityOfPage: "https://shepi.ai/use-cases/business-brokers"
};
function BusinessBrokers() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QoE for Business Brokers",
      seoTitle: "QoE for Business Brokers — Close More Deals, Faster | Shepi",
      seoDescription: "How business brokers use pre-listing financial assessments and Quality of Earnings analysis to close more deals, build buyer confidence, and compress diligence timelines.",
      canonical: "https://shepi.ai/use-cases/business-brokers",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Business Brokers" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Deals die in diligence — brokers who pre-analyze financials close more deals." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "Hours", label: "Pre-listing assessment time, not days" },
          { value: "1–2 weeks", label: "Buyer diligence vs. 4–6 traditional" },
          { value: "Fewer", label: "Late-stage retrades and broken deals" }
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg", children: "Deals die in diligence. For business brokers, the gap between a signed LOI and a successful close is where commissions are earned — or lost. Brokers who proactively assess the financial quality of their listings close more deals, command better pricing, and build reputations that attract premium mandates." }),
        /* @__PURE__ */ jsx("h2", { id: "why-brokers", children: "Why Brokers Should Care About QoE" }),
        /* @__PURE__ */ jsx("p", { children: "Most business brokers focus on marketing and matchmaking. But the highest-performing brokers go further. They understand the financials deeply enough to anticipate diligence findings, set realistic expectations with sellers, and maintain deal momentum when questions arise." }),
        /* @__PURE__ */ jsxs("p", { children: [
          "A ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          " gives brokers that financial fluency — without requiring a CPA license."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "pre-listing", children: "Pre-Listing Financial Assessment" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Set realistic pricing", description: "Understand true adjusted earnings before quoting a multiple" },
          { title: "Identify deal-killers early", description: "Revenue concentration, declining trends, or unusual expenses that will surface in buyer diligence" },
          { title: "Prepare the seller", description: "Address issues proactively — reclassify personal expenses, document one-time costs, normalize owner compensation" },
          { title: "Build your CIM", description: "Include credible financial analysis that goes beyond reformatted tax returns" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "buyer-confidence", children: "Building Buyer Confidence" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Buyers — especially first-time acquirers and ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/independent-searchers", children: "independent searchers" }),
          " — are naturally cautious. A broker who can present clean, pre-analyzed financials with documented ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA adjustments" }),
          " immediately distinguishes their listing."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "This transparency doesn't weaken the seller's position. It strengthens it. Buyers bid more confidently when they understand what they're buying, and lenders approve financing faster when the financial picture is clear." }),
        /* @__PURE__ */ jsx("h2", { id: "workflow", children: "Broker Workflow with Shepi" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Seller onboarding", description: "Connect to QuickBooks or upload financial statements during the listing engagement" },
          { title: "Financial screening", description: "Review the automated analysis to identify key adjustments, trends, and potential issues" },
          { title: "Seller conversation", description: "Walk through findings with the seller, gather context on unusual items, and agree on adjustments" },
          { title: "Listing preparation", description: "Incorporate adjusted earnings into pricing analysis and marketing materials" },
          { title: "Buyer diligence support", description: "Provide pre-analyzed financials to serious buyers, reducing back-and-forth during diligence" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "time-to-close", children: "Accelerating Time to Close" }),
        /* @__PURE__ */ jsx("p", { children: "Every week a deal spends in diligence is a week where something can go wrong. Compressing the diligence timeline directly increases close rates." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Buyer's QoE is faster", description: "When the buyer's QoE provider can start from structured data, analysis takes 1–2 weeks instead of 4–6" },
          { title: "Fewer information requests", description: "Common questions are already answered in the pre-analysis" },
          { title: "Lender comfort", description: "SBA lenders and acquisition financiers move faster when financial quality is pre-documented" },
          { title: "Reduced retrades", description: "When both parties understand the financials upfront, late-stage price adjustments are less likely" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "value-to-sellers", children: "Value to Sellers" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Higher realized prices", description: "Documented adjustments support higher multiples and reduce buyer discounting for uncertainty" },
          { title: "Shorter time on market", description: "Well-prepared listings attract serious buyers and close faster" },
          { title: "Lower professional fees", description: "When sell-side analysis is available, buyers may negotiate lower QoE fees or faster timelines" },
          { title: "Fewer failed deals", description: "Early identification of issues prevents mid-diligence surprises that kill transactions" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Do I need accounting expertise to use this?", answer: "No. Shepi is designed for deal professionals, not just accountants. The platform identifies adjustments and flags unusual items with plain-language explanations. You don't need to be a CPA — but you'll speak the language of one." },
          { question: "Won't sharing detailed financials weaken the seller's negotiating position?", answer: "The opposite is usually true. Transparency builds trust and attracts serious buyers who are ready to close. Buyers discount for uncertainty — when the financials are clear and documented, they bid with confidence." },
          { question: "How is this different from what a CPA would produce?", answer: "A full QoE from a CPA firm includes professional attestation and deeper procedural testing. Shepi provides the analytical foundation — the same structured analysis, adjustment identification, and financial trending — which can stand alone for smaller deals or serve as the starting point for a formal QoE engagement." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/use-cases/deal-advisors", label: "Sell-Side QoE for M&A Advisors" },
          { to: "/use-cases/lenders", label: "QoE for Lenders & SBA Lending" },
          { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" }
        ] })
      ]
    }
  );
}
export {
  BusinessBrokers as default
};
