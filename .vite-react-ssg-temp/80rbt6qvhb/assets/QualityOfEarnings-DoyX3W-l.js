import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
import { S as StepList } from "./StepList-qzihzp1y.js";
import { P as PRICING } from "../main.mjs";
import "react";
import "lucide-react";
import "@radix-ui/react-slot";
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
  { id: "what-is-qoe", label: "What Is a QoE Report?" },
  { id: "why-qoe-matters", label: "Why QoE Matters" },
  { id: "when-you-need-one", label: "When You Need One" },
  { id: "components", label: "Key Components" },
  { id: "who-provides", label: "Who Provides QoE Reports" },
  { id: "process", label: "The QoE Process" },
  { id: "cost", label: "Cost & Timeline" },
  { id: "faq", label: "FAQ" }
];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Quality of Earnings report?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Quality of Earnings (QoE) report is a financial analysis that evaluates the sustainability and accuracy of a company's reported earnings. It identifies adjustments to EBITDA, analyzes revenue and expense trends, and provides buyers with a clearer picture of normalized, recurring earnings."
      }
    },
    {
      "@type": "Question",
      name: "How much does a Quality of Earnings report cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Traditional QoE reports from CPA firms cost $20,000+ depending on deal size and complexity. AI-assisted platforms like shepi offer professional-grade analysis starting at ${PRICING.perProject.display} per project, making QoE accessible for smaller deals.`
      }
    },
    {
      "@type": "Question",
      name: "How long does a Quality of Earnings analysis take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional CPA firm QoE takes 4+ weeks. AI-assisted tools can deliver initial analysis in 2–4 hours, with full analysis complete in days rather than weeks."
      }
    }
  ]
};
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is a Quality of Earnings Report? The Complete Guide",
  description: "Comprehensive guide to Quality of Earnings reports — what they are, why they matter in M&A, key components, who provides them, and how AI is changing QoE analysis.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/guides/quality-of-earnings"
};
function QualityOfEarnings() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "What Is a Quality of Earnings Report? The Complete Guide",
      seoTitle: "What Is a Quality of Earnings Report? Complete QoE Guide | Shepi",
      seoDescription: "Learn what a Quality of Earnings report is, why it matters in M&A transactions, key components, who provides QoE, costs, timelines, and how AI is transforming QoE analysis.",
      canonical: "https://shepi.ai/guides/quality-of-earnings",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Quality of Earnings Guide" }
      ],
      toc,
      jsonLd: { ...articleSchema, ...faqSchema },
      publishedDate: "February 2026",
      modifiedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "The financial equivalent of a home inspection — what's behind the walls? A QoE report tells you whether the earnings you're buying are real, recurring, and sustainable." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "$20K+", label: "Traditional CPA QoE cost" },
          { value: "2–4 hours", label: "AI-assisted initial analysis" },
          { value: PRICING.perProject.display, label: "Starting price per project" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-qoe", children: "What Is a Quality of Earnings Report?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "A Quality of Earnings report is a detailed financial analysis that goes beyond the face value of a company's income statement to determine whether reported earnings are ",
          /* @__PURE__ */ jsx("strong", { children: "sustainable, recurring, and accurately stated" }),
          ". It's the financial equivalent of a home inspection before purchasing a property — you want to know what's behind the walls."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "At its core, a QoE analysis answers one fundamental question: ",
          /* @__PURE__ */ jsx("em", { children: '"If I buy this business, what earnings should I actually expect going forward?"' })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The report accomplishes this by identifying and categorizing adjustments to the company's reported EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization), resulting in an ",
          /* @__PURE__ */ jsx("strong", { children: "adjusted or normalized EBITDA" }),
          " figure that more accurately reflects the business's true earning power."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-qoe-matters", children: "Why Quality of Earnings Matters in M&A" }),
        /* @__PURE__ */ jsx("p", { children: "In any acquisition, the purchase price is typically derived from a multiple of earnings — usually EBITDA. This means that every dollar of earnings misstatement is amplified by the valuation multiple. If EBITDA is overstated by $100,000 and the deal is priced at 5x EBITDA, the buyer overpays by $500,000." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Validates reported earnings", description: "Confirms that revenue and expenses are accurately recorded" },
          { title: "Identifies non-recurring items", description: "One-time costs, unusual revenue, extraordinary events" },
          { title: "Normalizes owner expenses", description: "Above-market compensation, personal expenses run through the business" },
          { title: "Reveals accounting choices", description: "Aggressive revenue recognition, deferred maintenance, capitalization practices" },
          { title: "Quantifies working capital", description: "DSO, DPO, DIO trends and their impact on cash requirements" },
          { title: "Surfaces risks & red flags", description: "Customer concentration, related-party transactions, pending liabilities" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "when-you-need-one", children: "When Do You Need a Quality of Earnings Report?" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Acquiring a business", description: "Whether a $500K SMB or a $500M enterprise" },
          { title: "Selling a business", description: "Sell-side QoE helps sellers control the narrative and accelerate timelines" },
          { title: "Securing financing", description: "Lenders and SBA require QoE to underwrite loans" },
          { title: "Evaluating deal terms", description: "Earnouts, seller notes, and equity rollovers depend on accurate earnings" },
          { title: "Screening targets", description: "Searchers and PE firms use QoE to quickly evaluate deal quality" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "components", children: "Key Components of a QoE Report" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Adjusted EBITDA Bridge", description: "Starts with reported earnings and systematically adds or subtracts adjustments to arrive at normalized EBITDA." },
          { title: "Revenue Analysis", description: "Examines sustainability, customer concentration, pricing trends, and revenue recognition policies." },
          { title: "Expense Analysis", description: "Reviews COGS, operating expenses, and overhead to identify trends, anomalies, and misclassifications." },
          { title: "Working Capital Analysis", description: "Evaluates AR, inventory, AP, and other current items to determine normalized working capital needs." },
          { title: "Balance Sheet Review", description: "Examines unrecorded liabilities, asset quality, debt-like items, and off-balance-sheet obligations." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "who-provides", children: "Who Provides Quality of Earnings Reports?" }),
        /* @__PURE__ */ jsx("p", { children: "Historically, QoE reports have been provided by:" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Big 4 accounting firms" }),
            " — for large-cap and upper-middle-market transactions"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Regional CPA firms" }),
            " with M&A practices — for mid-market and lower-middle-market deals"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Boutique transaction advisory firms" }),
            " — specialized QoE providers for various deal sizes"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "More recently, ",
          /* @__PURE__ */ jsxs("strong", { children: [
            "AI-assisted platforms like ",
            /* @__PURE__ */ jsx(Link, { to: "/", children: "Shepi" })
          ] }),
          " have emerged to democratize access to QoE analysis, enabling independent searchers, smaller PE firms, and deal advisors to conduct professional-grade analysis at a fraction of the traditional cost and timeline."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "process", children: "The Quality of Earnings Process" }),
        /* @__PURE__ */ jsx("p", { children: "Whether conducted by a CPA firm or through an AI-assisted platform, the QoE process generally follows these steps:" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Data gathering", description: "Collecting trial balances, financial statements, bank statements, tax returns, and supporting documents" },
          { title: "Account mapping", description: "Organizing chart of accounts data into standardized income statement and balance sheet formats" },
          { title: "Trend analysis", description: "Reviewing multi-period financial data for patterns, anomalies, and inconsistencies" },
          { title: "Adjustment identification", description: "Flagging items that require normalization and categorizing them" },
          { title: "Adjustment quantification", description: "Calculating the dollar impact of each adjustment with supporting documentation" },
          { title: "Working capital analysis", description: "Determining normalized working capital target and peg" },
          { title: "Report preparation", description: "Compiling findings into a clear, defensible format" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "cost", children: "Cost & Timeline" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Traditional QoE reports from CPA firms typically cost ",
          /* @__PURE__ */ jsx("strong", { children: "$20,000+" }),
          " and take ",
          /* @__PURE__ */ jsx("strong", { children: "4+ weeks" }),
          " to complete. The cost depends on deal size, business complexity, data quality, and the firm's billing rates."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "AI-assisted platforms like Shepi can deliver initial analysis in ",
          /* @__PURE__ */ jsx("strong", { children: "2–4 hours" }),
          " at a starting price of ",
          /* @__PURE__ */ jsxs("strong", { children: [
            PRICING.perProject.display,
            " per project"
          ] }),
          ", making QoE accessible for deals of all sizes. See our ",
          /* @__PURE__ */ jsx(Link, { to: "/compare/ai-qoe-vs-traditional", children: "AI QoE vs. Traditional comparison" }),
          " for a detailed breakdown."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What is a Quality of Earnings report?", answer: "A Quality of Earnings report is a financial analysis that evaluates the sustainability and accuracy of a company's reported earnings. It identifies adjustments to EBITDA and provides buyers with a clearer picture of normalized, recurring earnings." },
          { question: "How much does a Quality of Earnings report cost?", answer: `Traditional reports cost $20,000+. AI-assisted platforms like shepi start at ${PRICING.perProject.display} per project.` },
          { question: "How long does a Quality of Earnings analysis take?", answer: "Traditional CPA firm QoE takes 4+ weeks. AI-assisted tools deliver initial analysis in 2–4 hours." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments: Types, Examples & Best Practices" },
          { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist for M&A" },
          { to: "/guides/sell-side-vs-buy-side-qoe", label: "Sell-Side vs Buy-Side QoE" },
          { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report?" },
          { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE Analysis" }
        ] })
      ]
    }
  );
}
export {
  QualityOfEarnings as default
};
