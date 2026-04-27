import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { C as ComparisonTable } from "./ComparisonTable-DuwES2f2.js";
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
  { id: "overview", label: "Overview" },
  { id: "buy-side", label: "Buy-Side QoE" },
  { id: "sell-side", label: "Sell-Side QoE" },
  { id: "comparison", label: "Side-by-Side Comparison" },
  { id: "when-to-use", label: "When You Need Each" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sell-Side vs Buy-Side QoE: Differences and When You Need Each",
  description: "Understand the key differences between sell-side and buy-side Quality of Earnings reports — scope, purpose, who commissions them, and when each type is appropriate.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/sell-side-vs-buy-side-qoe"
};
function SellSideVsBuySideQoE() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Sell-Side vs Buy-Side QoE: Differences and When You Need Each",
      seoTitle: "Sell-Side vs Buy-Side QoE — Key Differences Explained | Shepi",
      seoDescription: "Learn the differences between sell-side and buy-side Quality of Earnings reports. Understand scope, purpose, timing, and when each type of QoE is appropriate for your deal.",
      canonical: "https://shepi.ai/guides/sell-side-vs-buy-side-qoe",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Sell-Side vs Buy-Side QoE" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "A buy-side QoE protects the buyer. A sell-side QoE controls the narrative. Understanding when to use each is a strategic decision that can make or break a deal." }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Both sell-side and buy-side ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings reports" }),
          " analyze the same financial data, but they serve different purposes, are commissioned by different parties, and carry different strategic implications."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The core methodology is the same — normalizing EBITDA, analyzing revenue quality, reviewing working capital — but the ",
          /* @__PURE__ */ jsx("strong", { children: "framing, scope, and intended audience" }),
          " differ significantly."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "buy-side", children: "Buy-Side QoE" }),
        /* @__PURE__ */ jsx("p", { children: "The buy-side QoE is the traditional form — commissioned by the buyer (or their lender) to validate the seller's financial claims." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Purpose", description: "Protect the buyer by independently verifying earnings, identifying risks, and validating the purchase price" },
          { title: "Commissioned by", description: "The buyer, their PE sponsor, or the lending institution providing acquisition financing" },
          { title: "Tone", description: "Skeptical and conservative — designed to find problems and quantify risk" },
          { title: "Scope", description: "Typically broader — includes management interviews, industry context, and qualitative risk assessment" },
          { title: "Timeline", description: "Usually 4+ weeks, starting after LOI execution and data room access" },
          { title: "Deliverable", description: "Detailed report for deal team and lenders with adjustment schedules and risk commentary" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "sell-side", children: "Sell-Side QoE" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The sell-side QoE is a strategic tool — it lets sellers ",
          /* @__PURE__ */ jsx("strong", { children: "control the narrative" }),
          " before buyers conduct their own analysis."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Purpose", description: "Pre-empt buyer concerns, identify and address issues proactively, and accelerate the deal timeline" },
          { title: "Commissioned by", description: "The seller, their M&A advisor, or investment banker — usually pre-market or concurrent with marketing" },
          { title: "Tone", description: "Transparent and proactive — identifies the same issues a buyer would find, but frames them constructively" },
          { title: "Scope", description: "Focused on EBITDA normalization and financial presentation — less emphasis on risk commentary" },
          { title: "Timeline", description: "Ideally completed before going to market — gives sellers time to address issues" },
          { title: "Deliverable", description: "Clean financial presentation with documented adjustments that buyer's advisors can verify" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison", children: "Side-by-Side Comparison" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Dimension", "Buy-Side QoE", "Sell-Side QoE"],
            rows: [
              ["Who pays", "Buyer / PE / Lender", "Seller / Advisor"],
              ["When", "After LOI, during exclusivity", "Pre-market or concurrent"],
              ["Primary goal", "Protect the buyer", "Accelerate the deal"],
              ["Tone", "Skeptical, conservative", "Transparent, proactive"],
              ["Adjustment framing", "Identify risks and overstatements", "Document and explain adjustments"],
              ["Management access", "Extensive interviews", "Full cooperation (own company)"],
              ["Typical cost", "$25K–$100K+", "$15K–$60K (or AI-assisted)"],
              ["Strategic value", "Risk mitigation", "Deal velocity + price defense"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "when-to-use", children: "When You Need Each" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Seller going to market", description: "Sell-side QoE — identify issues before buyers do, support your asking price with documented adjustments" },
          { title: "Buyer under LOI", description: "Buy-side QoE — independent verification of seller claims, required by most lenders" },
          { title: "Competitive auction", description: "Sell-side QoE — speed up buyer diligence and reduce re-trade risk" },
          { title: "SBA or bank financing", description: "Buy-side QoE — lenders require independent analysis for underwriting" },
          { title: "Searcher screening deals", description: "Either — use AI-assisted analysis for preliminary assessment before engaging a CPA firm" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/deal-advisors", children: "M&A advisors" }),
          " increasingly recommend sell-side QoE as standard practice for deals above $3M enterprise value."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Does a sell-side QoE eliminate the need for buy-side?", answer: "Rarely. Most buyers still conduct their own analysis. However, a sell-side QoE compresses the buy-side timeline significantly because the buyer's advisors can verify rather than discover." },
          { question: "Can the same firm do both?", answer: "No. Independence requires different firms for buy-side and sell-side. The same firm advising the seller cannot provide the buyer's QoE." },
          { question: "Which costs more?", answer: "Buy-side QoE is typically more expensive ($25K-$100K+) due to broader scope and risk assessment. Sell-side is narrower in scope ($15K-$60K) or can be done with AI-assisted tools at a fraction of the cost." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/use-cases/deal-advisors", label: "QoE for M&A Advisors" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/features/qoe-software", label: "QoE Software Platform" }
        ] })
      ]
    }
  );
}
export {
  SellSideVsBuySideQoE as default
};
