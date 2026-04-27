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
  { id: "overview", label: "Overview" },
  { id: "financial-statements", label: "Financial Statements" },
  { id: "tax-documents", label: "Tax Documents" },
  { id: "revenue-analysis", label: "Revenue & Customers" },
  { id: "expense-analysis", label: "Expenses & Payroll" },
  { id: "balance-sheet", label: "Balance Sheet Items" },
  { id: "legal-compliance", label: "Legal & Compliance" },
  { id: "red-flags", label: "Red Flags" },
  { id: "timeline", label: "Timeline" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Financial Due Diligence Checklist for M&A Transactions",
  description: "Complete checklist for financial due diligence in M&A — document requests, analysis steps, red flags, and common mistakes to avoid.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/guides/due-diligence-checklist"
};
function DueDiligenceChecklist() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Financial Due Diligence Checklist for M&A Transactions",
      seoTitle: "Financial Due Diligence Checklist for M&A | Shepi",
      seoDescription: "Complete financial due diligence checklist for M&A transactions. Document requests, analysis steps, red flags, timeline planning, and common mistakes to avoid.",
      canonical: "https://shepi.ai/guides/due-diligence-checklist",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Due Diligence Checklist" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      modifiedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Understand the business well enough to make an informed investment decision and price the deal correctly." }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "Financial due diligence is the process of verifying a target company's financial position before completing an acquisition. This checklist covers the essential documents, analyses, and red flags that every buyer should address — whether you're an ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/independent-searchers", children: "independent searcher" }),
          " or a ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/pe-firms", children: "PE deal team" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Effective financial due diligence requires a structured approach. The goal isn't to check every box — it's to understand the business well enough to make an informed investment decision and price the deal correctly. A ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          " is the centerpiece of this process."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "financial-statements", children: "Financial Statements" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Income statements", description: "3–5 years, audited if available, plus year-to-date interim" },
          { title: "Balance sheets", description: "3–5 years with monthly/quarterly detail for most recent 2 years" },
          { title: "Trial balance exports", description: "From accounting system (QuickBooks, Xero, etc.) with chart of accounts" },
          { title: "Cash flow & bank statements", description: "Cash flow statements or bank statements for proof of cash analysis" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Tip:" }),
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/features/quickbooks-integration", children: "Shepi's QuickBooks integration" }),
          " can pull trial balance data directly, eliminating manual export errors."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "tax-documents", children: "Tax Documents" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Income tax returns", description: "3–5 years of federal and state returns" },
          { title: "Sales & payroll tax", description: "Sales tax returns, 940/941 payroll tax returns" },
          { title: "IRS correspondence", description: "Any audit history or correspondence" },
          { title: "Property tax", description: "Assessments and payment history" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "revenue-analysis", children: "Revenue & Customer Analysis" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Revenue by customer", description: "Top 10–20 customers with concentration analysis" },
          { title: "Revenue by segment", description: "Product/service line, geography, and channel breakdown" },
          { title: "Contracts & backlog", description: "Customer contracts, MSAs, backlog, and pipeline reports" },
          { title: "Pricing & retention", description: "Pricing history, upcoming changes, churn and retention metrics" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "expense-analysis", children: "Expense & Payroll Analysis" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Payroll detail", description: "Payroll register with employee-level detail and officer compensation history" },
          { title: "Benefits & contractors", description: "Health, retirement, PTO summaries plus 1099 contractor payments" },
          { title: "Vendor concentration", description: "Top 10 vendors by spend with lease and insurance agreements" },
          { title: "Expense classification", description: "Discretionary vs. non-discretionary expense breakdown" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "balance-sheet", children: "Balance Sheet Items" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Receivables & payables", description: "AR aging schedule and AP aging schedule" },
          { title: "Inventory & fixed assets", description: "Inventory detail, valuation methodology, fixed asset register with depreciation" },
          { title: "Debt & liabilities", description: "Debt schedule, accrued liabilities detail, prepaid expenses and deposits" },
          { title: "Off-balance-sheet", description: "Guarantees, commitments, and other off-balance-sheet obligations" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "legal-compliance", children: "Legal & Compliance" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Contracts & litigation", description: "Material contracts, pending or threatened litigation" },
          { title: "Licenses & permits", description: "Regulatory licenses, environmental compliance records" },
          { title: "IP & related parties", description: "Intellectual property documentation and related-party transaction disclosures" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "red-flags", children: "Common Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Revenue concentration", description: "More than 20% of revenue from a single customer" },
          { title: "Declining margins", description: "Gross or operating margins trending down without clear explanation" },
          { title: "Working capital trends", description: "DSO increasing, suggesting collection issues" },
          { title: "Related-party transactions", description: "Significant transactions with entities owned by the seller" },
          { title: "Tax vs. financial gaps", description: "Material differences between tax returns and financials not explained" },
          { title: "Deferred maintenance", description: "CapEx significantly below depreciation for extended periods" },
          { title: "Accounting changes", description: "Frequent method switches, reclassifications, or restated periods" },
          { title: "Missing records", description: "Gaps in documentation raise questions about what else might be missing" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "timeline", children: "Due Diligence Timeline" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Week 1", description: "Submit document request list and begin data collection" },
          { title: "Week 2–3", description: "Initial data review, account mapping, and preliminary analysis" },
          { title: "Week 3–4", description: "Detailed analysis, management Q&A, follow-up requests" },
          { title: "Week 4–6", description: "Draft findings, adjustment quantification, working capital analysis" },
          { title: "Week 6–8", description: "Final report, negotiation support, closing adjustments" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "With ",
          /* @__PURE__ */ jsx(Link, { to: "/", children: "Shepi's AI-assisted platform" }),
          ", the analysis phase (weeks 2–4) can be compressed to days rather than weeks."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "How long should due diligence take?", answer: "Traditional due diligence takes 4+ weeks for financial DD alone. AI-assisted tools can significantly compress the analysis timeline, though document collection from the seller remains a common bottleneck." },
          { question: "Can I do my own due diligence?", answer: "Yes, especially for smaller deals. Tools like shepi provide the structure and guidance to conduct professional-grade analysis independently. For larger or more complex transactions, consider supplementing with professional advisors." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
          { to: "/use-cases/pe-firms", label: "QoE for PE Firms" }
        ] })
      ]
    }
  );
}
export {
  DueDiligenceChecklist as default
};
