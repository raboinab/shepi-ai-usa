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
  { id: "what-is-revenue-quality", label: "What Is Revenue Quality?" },
  { id: "why-it-matters", label: "Why It Matters in M&A" },
  { id: "customer-concentration", label: "Customer Concentration" },
  { id: "recurring-vs-nonrecurring", label: "Recurring vs Non-Recurring" },
  { id: "revenue-recognition", label: "Revenue Recognition Issues" },
  { id: "ar-aging", label: "AR Aging Analysis" },
  { id: "trend-analysis", label: "Revenue Trend Analysis" },
  { id: "process", label: "How to Analyze Revenue Quality" },
  { id: "faq", label: "FAQ" }
];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is revenue quality analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Revenue quality analysis evaluates whether a company's reported revenue is sustainable, recurring, and accurately recognized. It identifies customer concentration risks, non-recurring revenue, recognition timing issues, and collectibility concerns."
      }
    },
    {
      "@type": "Question",
      name: "Why does customer concentration matter in an acquisition?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If a single customer represents more than 10-15% of revenue, losing that customer could materially impact earnings. Buyers discount valuations or require seller protections when concentration risk is high."
      }
    },
    {
      "@type": "Question",
      name: "What is the difference between recurring and non-recurring revenue?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Recurring revenue comes from ongoing contracts, subscriptions, or repeat customer relationships. Non-recurring revenue includes one-time projects, PPP loans, insurance settlements, or extraordinary sales. Only recurring revenue is typically valued at full multiples."
      }
    }
  ]
};
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Revenue Quality Analysis for M&A Due Diligence",
  description: "Complete guide to analyzing revenue quality during acquisitions — customer concentration, recurring vs non-recurring revenue, AR aging, recognition issues, and trend analysis.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/revenue-quality-analysis"
};
function RevenueQualityAnalysis() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Revenue Quality Analysis for M&A Due Diligence",
      seoTitle: "Revenue Quality Analysis for M&A — Customer Concentration, AR Aging & More | Shepi",
      seoDescription: "Learn how to evaluate revenue quality during acquisitions. Covers customer concentration, recurring vs non-recurring revenue, AR aging analysis, revenue recognition issues, and trend analysis.",
      canonical: "https://shepi.ai/guides/revenue-quality-analysis",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Revenue Quality Analysis" }
      ],
      toc,
      jsonLd: { ...articleSchema, ...faqSchema },
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Revenue is the top line — but not all revenue is created equal. In M&A, the quality of revenue matters more than the quantity." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "10–15%", label: "Concentration threshold for single customer" },
          { value: "2–4×", label: "Valuation premium for recurring revenue" },
          { value: "90+ days", label: "AR aging that signals collection risk" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-revenue-quality", children: "What Is Revenue Quality?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Revenue quality analysis evaluates whether a company's reported revenue is ",
          /* @__PURE__ */ jsx("strong", { children: "sustainable, recurring, and accurately recognized" }),
          ". It goes beyond the top-line number to understand the composition, source, and reliability of revenue streams."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "In a ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          ", revenue quality is often the most scrutinized area because it directly drives the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "adjusted EBITDA" }),
          " that determines purchase price."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-it-matters", children: "Why Revenue Quality Matters in M&A" }),
        /* @__PURE__ */ jsx("p", { children: "Purchase prices are typically calculated as a multiple of earnings. Revenue quality issues compound through this multiple — a $200,000 revenue overstatement at a 50% margin and 5× multiple means the buyer overpays by $500,000." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Valuation accuracy", description: "Non-recurring revenue inflates EBITDA and overstates enterprise value" },
          { title: "Risk assessment", description: "Customer concentration creates key-person or key-customer dependency" },
          { title: "Cash flow predictability", description: "Recurring revenue provides reliable cash flow forecasts" },
          { title: "Deal structure", description: "Revenue quality issues often lead to earnout structures or price adjustments" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "customer-concentration", children: "Customer Concentration Analysis" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Customer concentration is one of the most common and impactful revenue quality issues. If a single customer represents more than ",
          /* @__PURE__ */ jsx("strong", { children: "10–15% of revenue" }),
          ", the acquisition carries meaningful key-customer risk."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Top 10 analysis", description: "Examine the top 10 customers by revenue contribution across all analysis periods — look for trends in concentration" },
          { title: "Contract terms", description: "Are key customers under long-term contracts or purchasing on a spot basis? Contracted revenue is more defensible" },
          { title: "Relationship risk", description: "Does the customer relationship depend on the owner? If the seller leaves, does the customer stay?" },
          { title: "Industry benchmarks", description: "B2B services businesses often have higher concentration; retail/e-commerce should have lower" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "recurring-vs-nonrecurring", children: "Recurring vs Non-Recurring Revenue" }),
        /* @__PURE__ */ jsx("p", { children: "Not all revenue deserves the same valuation multiple. Buyers and lenders assign higher multiples to predictable, recurring revenue streams and discount one-time or non-recurring sources." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Contractual recurring", description: "Subscriptions, retainers, maintenance agreements — highest quality" },
          { title: "Repeat non-contractual", description: "Customers who return regularly without formal contracts — strong but less certain" },
          { title: "Project-based", description: "Individual engagements that may or may not repeat — moderate quality" },
          { title: "One-time / non-recurring", description: "PPP forgiveness, insurance proceeds, asset sales, extraordinary events — should be excluded from normalized earnings" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "revenue-recognition", children: "Revenue Recognition Issues" }),
        /* @__PURE__ */ jsx("p", { children: "Revenue recognition timing can materially misstate earnings. Common issues include:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Early recognition", description: "Recognizing revenue before performance obligations are satisfied — inflates current period earnings" },
          { title: "Deferred revenue", description: "Prepaid services or products not yet delivered — understated liability if not properly accrued" },
          { title: "Percentage of completion", description: "Long-term projects recognized over time — estimates can be manipulated" },
          { title: "Channel stuffing", description: "Pushing excess inventory to distributors near period end — inflates revenue temporarily" },
          { title: "Bill-and-hold", description: "Invoicing before delivery — revenue without cash collection risk" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "ar-aging", children: "AR Aging Analysis" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Accounts receivable aging reveals the ",
          /* @__PURE__ */ jsx("strong", { children: "collectibility" }),
          " of recognized revenue. Revenue that can't be collected isn't real revenue."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Current (0–30 days)", description: "Healthy — normal collection cycle" },
          { title: "31–60 days", description: "Monitor — may indicate billing disputes or customer cash flow issues" },
          { title: "61–90 days", description: "Elevated risk — follow up on specific invoices and customer status" },
          { title: "90+ days", description: "High risk — likely requires bad debt reserve adjustment" }
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Compare the bad debt reserve to historical write-off rates. An under-reserved AR balance is a common QoE adjustment." }),
        /* @__PURE__ */ jsx("h2", { id: "trend-analysis", children: "Revenue Trend Analysis" }),
        /* @__PURE__ */ jsx("p", { children: "Monthly and quarterly revenue trends reveal seasonality, growth trajectory, and potential anomalies:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Growth trajectory", description: "Is revenue accelerating, decelerating, or flat? The trend matters as much as the level" },
          { title: "Seasonality", description: "Understand seasonal patterns to avoid misinterpreting normal fluctuations as growth or decline" },
          { title: "Revenue CAGR", description: "Compound annual growth rate across analysis periods provides normalized growth perspective" },
          { title: "Cohort analysis", description: "Track revenue from specific customer cohorts to understand retention and expansion" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "process", children: "How to Analyze Revenue Quality" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Decompose revenue by source", description: "Break total revenue into product lines, service types, or business segments" },
          { title: "Identify top customers", description: "Build a top 10/20 customer analysis across all periods" },
          { title: "Classify recurring vs non-recurring", description: "Tag each revenue stream as contractual, repeat, project-based, or one-time" },
          { title: "Review recognition policies", description: "Understand when and how revenue is recognized — compare to industry standards" },
          { title: "Analyze AR aging", description: "Review aging buckets and compare reserves to historical write-off rates" },
          { title: "Plot trends", description: "Chart monthly revenue by source to identify seasonality, anomalies, and trajectory" },
          { title: "Quantify adjustments", description: "Calculate the impact of non-recurring items and recognition timing issues on normalized EBITDA" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What is revenue quality analysis?", answer: "Revenue quality analysis evaluates whether a company's reported revenue is sustainable, recurring, and accurately recognized. It identifies customer concentration risks, non-recurring revenue, recognition timing issues, and collectibility concerns." },
          { question: "Why does customer concentration matter in an acquisition?", answer: "If a single customer represents more than 10-15% of revenue, losing that customer could materially impact earnings. Buyers discount valuations or require seller protections when concentration risk is high." },
          { question: "What is the difference between recurring and non-recurring revenue?", answer: "Recurring revenue comes from ongoing contracts, subscriptions, or repeat relationships. Non-recurring includes one-time projects, PPP loans, or extraordinary sales. Only recurring revenue is typically valued at full multiples." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/customer-concentration-risk", label: "Customer Concentration Risk Analysis" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/working-capital-analysis", label: "Working Capital Analysis" },
          { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" }
        ] })
      ]
    }
  );
}
export {
  RevenueQualityAnalysis as default
};
