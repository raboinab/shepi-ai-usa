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
  { id: "what-is-concentration", label: "What Is Customer Concentration?" },
  { id: "why-it-matters", label: "Why It Matters in M&A" },
  { id: "thresholds", label: "Risk Thresholds" },
  { id: "analysis-framework", label: "Analysis Framework" },
  { id: "mitigating-factors", label: "Mitigating Factors" },
  { id: "deal-impact", label: "Impact on Deal Terms" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Customer Concentration Risk Analysis for M&A",
  description: "How to analyze customer concentration risk during acquisitions — thresholds, analysis framework, mitigating factors, and how concentration affects deal structure and valuation.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/customer-concentration-risk"
};
function CustomerConcentrationRisk() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Customer Concentration Risk Analysis for M&A",
      seoTitle: "Customer Concentration Risk — Analysis Guide for M&A | Shepi",
      seoDescription: "Learn how to analyze customer concentration risk during acquisitions. Understand thresholds, build a top customer analysis, evaluate mitigating factors, and structure deals around concentration risk.",
      canonical: "https://shepi.ai/guides/customer-concentration-risk",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Customer Concentration Risk" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "If your top customer walks, can the business survive? Customer concentration is the silent deal-killer in M&A — and one of the most important risk factors in any QoE analysis." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "10–15%", label: "Single-customer risk threshold" },
          { value: "50%+", label: "Top-5 concentration that concerns buyers" },
          { value: "1–2× turns", label: "Typical valuation discount for high concentration" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-concentration", children: "What Is Customer Concentration?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Customer concentration measures how dependent a business is on its largest customers. In ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          ", it's a critical component of ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/revenue-quality-analysis", children: "revenue quality" }),
          " because concentrated revenue streams carry higher risk of disruption."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "A business where the top customer represents 40% of revenue is fundamentally riskier than one where no customer exceeds 5% — even if total revenue is identical." }),
        /* @__PURE__ */ jsx("h2", { id: "why-it-matters", children: "Why It Matters in M&A" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Key-person risk", description: "If the customer relationship depends on the selling owner, it may not survive the transition" },
          { title: "Negotiating leverage", description: "Large customers who know they're critical may demand price concessions post-acquisition" },
          { title: "Revenue sustainability", description: "Concentrated revenue can't be assumed to continue at the same level — it's a binary risk" },
          { title: "Lender concerns", description: "SBA and bank lenders view high concentration as a material underwriting risk" },
          { title: "Valuation impact", description: "Buyers discount valuations by 1–2× EBITDA turns for significant concentration risk" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "thresholds", children: "Risk Thresholds" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Low risk: <10% any single customer", description: "No customer dominates — revenue is diversified and resilient" },
          { title: "Moderate: 10–20% single customer", description: "Manageable with long-term contracts, but warrants attention and potential deal protections" },
          { title: "Elevated: 20–35% single customer", description: "Material risk — expect valuation discount or earnout tied to customer retention" },
          { title: "High: >35% single customer", description: "Deal-breaker territory for many buyers unless strong mitigating factors exist" },
          { title: "Top-5 concentration >50%", description: "Even without a single dominant customer, heavy top-5 concentration signals limited diversification" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "analysis-framework", children: "Analysis Framework" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Build top 10/20 customer revenue analysis", description: "Revenue by customer across all analysis periods — calculate percentage of total and trend direction" },
          { title: "Analyze retention and churn", description: "Track which top customers are growing, stable, declining, or lost over the analysis period" },
          { title: "Review contract terms", description: "Long-term contracts reduce risk; at-will arrangements increase it. Check expiration dates" },
          { title: "Assess relationship dependency", description: "Does the relationship depend on the owner? Interview key customer contacts if possible" },
          { title: "Evaluate replacement economics", description: "If the top customer leaves, how quickly could the business replace that revenue? At what cost?" },
          { title: "Benchmark against industry", description: "Some industries (government contracting, B2B services) naturally have higher concentration" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "mitigating-factors", children: "Mitigating Factors" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Long-term contracts", description: "Multi-year agreements with renewal provisions significantly reduce churn risk" },
          { title: "High switching costs", description: "If the customer is deeply integrated (embedded technology, training investment), they're less likely to leave" },
          { title: "Growing relationship", description: "A concentrated customer that's growing is different from one that's declining" },
          { title: "Multiple contacts", description: "Relationships spanning multiple people at the customer organization (not just the owner)" },
          { title: "Industry norms", description: "If concentration is typical for the industry, buyers are more accepting" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "deal-impact", children: "Impact on Deal Terms" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Valuation discount", description: "Buyers apply lower multiples to businesses with high concentration — typically 1–2× turns lower" },
          { title: "Earnout structure", description: "Portion of purchase price tied to retention of key customers for 12–24 months post-close" },
          { title: "Seller note", description: "Seller financing that can be reduced if key customers are lost during the transition period" },
          { title: "Customer consent", description: "Some deals require key customer consent or confirmation before closing" },
          { title: "Transition services", description: "Seller agrees to extended transition involvement to maintain key customer relationships" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What's the acceptable level of customer concentration?", answer: "Most buyers prefer no single customer exceeding 10-15% of revenue. However, this varies by industry — government contractors and B2B specialists may be acceptable at higher levels with proper contracts." },
          { question: "Does customer concentration always reduce valuation?", answer: "Yes, in most cases. Even with mitigating factors, concentrated revenue introduces binary risk that buyers discount for. The discount is smaller with strong contracts and low owner dependency." },
          { question: "How do lenders view customer concentration?", answer: "SBA lenders and banks view it as a material risk factor. High concentration can result in loan denial, higher interest rates, or requirements for customer contracts as loan covenants." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/revenue-quality-analysis", label: "Revenue Quality Analysis" },
          { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/features/qoe-software", label: "QoE Software Platform" }
        ] })
      ]
    }
  );
}
export {
  CustomerConcentrationRisk as default
};
