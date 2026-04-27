import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
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
  { id: "sell-side-qoe", label: "Sell-Side QoE" },
  { id: "why-advisors", label: "Why Advisors Need QoE" },
  { id: "winning-mandates", label: "Winning Mandates" },
  { id: "workflow", label: "Advisor Workflow" },
  { id: "value-prop", label: "Value to Clients" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sell-Side QoE for M&A Advisors & Investment Bankers",
  description: "How M&A advisors and investment bankers use AI-assisted QoE to prepare sellers, accelerate deals, and differentiate their advisory practice.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/deal-advisors"
};
function DealAdvisors() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Sell-Side QoE for M&A Advisors & Investment Bankers",
      seoTitle: "Sell-Side QoE for M&A Advisors & Investment Bankers | Shepi",
      seoDescription: "How M&A advisors use AI-assisted Quality of Earnings to prepare sellers, control the narrative, accelerate deal timelines, and differentiate their practice.",
      canonical: "https://shepi.ai/use-cases/deal-advisors",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Deal Advisors" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Control the narrative — don't let the buyer's QoE tell the story." }),
        /* @__PURE__ */ jsx("p", { className: "text-lg", children: "Sell-side Quality of Earnings — also called vendor due diligence (VDD) — is becoming a competitive advantage for M&A advisors. By preparing a QoE report before going to market, advisors help sellers control the narrative, accelerate deal timelines, and demonstrate professionalism that wins mandates." }),
        /* @__PURE__ */ jsx("h2", { id: "sell-side-qoe", children: "What Is Sell-Side QoE?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Sell-side QoE is a ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          " commissioned by the seller (or their advisor) before the business goes to market. Instead of waiting for the buyer's QoE to surface issues, the seller proactively identifies and addresses adjustments, provides clean documentation, and sets realistic earnings expectations."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Controlled narrative", description: "Frame the story around normalized earnings rather than reacting to buyer's findings" },
          { title: "Faster deal timelines", description: "Buy-side diligence is shorter when key analysis is already available" },
          { title: "Fewer surprises", description: "Issues surface early, giving time to address them before they become deal-killers" },
          { title: "Higher valuations", description: "Well-documented adjustments and clean financials increase buyer confidence" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-advisors", children: "Why Advisors Should Offer QoE" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Mandate differentiation", description: "Show sellers you're more than a matchmaker — you prepare them for diligence" },
          { title: "Better pricing outcomes", description: "Documented earnings lead to more confident buyers and stronger offers" },
          { title: "Reduced deal risk", description: "Fewer retrades and broken deals when financials are pre-analyzed" },
          { title: "Revenue opportunity", description: "Offer QoE as a value-added service, bundled with advisory or as standalone" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "winning-mandates", children: "Winning Mandates with QoE" }),
        /* @__PURE__ */ jsx("p", { children: `When pitching for sell-side mandates, advisors who can say "we'll prepare a preliminary QoE to maximize your value and minimize diligence risk" have a compelling advantage. Shepi makes this feasible by reducing the cost and time required to produce that analysis.` }),
        /* @__PURE__ */ jsx("h2", { id: "workflow", children: "Advisor Workflow with Shepi" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Pre-engagement", description: "Use Shepi to quickly assess a prospect's financials before accepting the mandate" },
          { title: "Seller preparation", description: "Build the QoE analysis, identify adjustments, and work with the seller to gather supporting documentation" },
          { title: "Marketing materials", description: "Incorporate key QoE findings into the CIM and management presentation" },
          { title: "Data room", description: "Include the QoE analysis as part of the buyer diligence package" },
          { title: "Buyer Q&A", description: "Use the analysis as a reference point for responding to buyer diligence questions" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "value-prop", children: "Value to Your Clients" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Lower diligence costs", description: "When buyers can rely on sell-side QoE, their own diligence is faster and cheaper" },
          { title: "Faster close", description: "Deals close weeks sooner when financial analysis is pre-packaged" },
          { title: "Negotiation leverage", description: "Documented, defensible earnings give sellers stronger standing at the table" },
          { title: "Professionalism", description: "Institutional-quality analysis demonstrates the seller and advisor take the process seriously" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Can I white-label Shepi's output for my clients?", answer: "Shepi exports to PDF and Excel, which you can customize with your firm's branding and formatting before sharing with clients or buyers." },
          { question: "How does sell-side QoE affect deal timeline?", answer: "Sell-side QoE can compress diligence by 2–4 weeks since buyers start from structured analysis rather than building from scratch. This reduces deal risk and keeps timelines on track." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/use-cases/pe-firms", label: "QoE for PE Firms" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" }
        ] })
      ]
    }
  );
}
export {
  DealAdvisors as default
};
