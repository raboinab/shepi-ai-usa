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
  { id: "what-is-ebitda-bridge", label: "What Is an EBITDA Bridge?" },
  { id: "structure", label: "Bridge Structure" },
  { id: "adjustment-categories", label: "Adjustment Categories" },
  { id: "reconciliation", label: "Net Income to EBITDA" },
  { id: "run-rate", label: "Run-Rate EBITDA" },
  { id: "documentation", label: "Supporting Documentation" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EBITDA Bridge Analysis — From Net Income to Adjusted EBITDA",
  description: "Complete guide to building an EBITDA bridge for M&A transactions: net income to EBITDA reconciliation, adjustment categories, run-rate calculations, and documentation standards.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/ebitda-bridge"
};
function EBITDABridge() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "EBITDA Bridge Analysis — From Net Income to Adjusted EBITDA",
      seoTitle: "EBITDA Bridge — Net Income to Adjusted EBITDA Reconciliation | Shepi",
      seoDescription: "Learn how to build an EBITDA bridge for M&A: net income to EBITDA reconciliation, categorized adjustments, run-rate calculations, and documentation standards for lender-ready output.",
      canonical: "https://shepi.ai/guides/ebitda-bridge",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "EBITDA Bridge Analysis" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "The EBITDA bridge is the single most important schedule in any QoE report. It tells you exactly how reported earnings become the adjusted EBITDA that drives valuation." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "4–6×", label: "Typical SMB EBITDA multiple" },
          { value: "$500K", label: "Overpayment from $100K error at 5× multiple" },
          { value: "20–50+", label: "Adjustments reviewed in a typical QoE" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-ebitda-bridge", children: "What Is an EBITDA Bridge?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "An EBITDA bridge (also called an ",
          /* @__PURE__ */ jsx("strong", { children: "EBITDA reconciliation" }),
          " or ",
          /* @__PURE__ */ jsx("strong", { children: "adjustment schedule" }),
          ") is a structured walk from a company's reported net income to its adjusted EBITDA. Each line item represents a specific adjustment — add-back or deduction — with categorization and supporting documentation."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The bridge is the centerpiece of any ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings report" }),
          " and the primary basis for purchase price negotiations."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "structure", children: "Bridge Structure" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Reported Net Income", description: "Starting point from the company's income statement" },
          { title: "+ Interest Expense", description: "Add back interest — EBITDA is pre-interest" },
          { title: "+ Income Tax Expense", description: "Add back taxes — EBITDA is pre-tax" },
          { title: "+ Depreciation & Amortization", description: "Add back D&A — these are non-cash charges" },
          { title: "= Reported EBITDA", description: "The unadjusted EBITDA figure" },
          { title: "+/- Normalization Adjustments", description: "Non-recurring, owner, pro forma, and accounting adjustments" },
          { title: "= Adjusted EBITDA", description: "The normalized earning power used for valuation" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "adjustment-categories", children: "Adjustment Categories" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Non-recurring adjustments", description: "One-time events: litigation settlements, restructuring costs, natural disaster expenses, PPP income. Items that won't repeat under new ownership." },
          { title: "Owner/related-party adjustments", description: "Above-market owner compensation, personal expenses, below-market rent from related entities, family member payroll for non-working positions." },
          { title: "Pro forma adjustments", description: "Known future changes: new contract revenue, lost customers, new hire costs, lease renewals at market rates, regulatory compliance costs." },
          { title: "Accounting adjustments", description: "Reclassifications, accrual corrections, revenue recognition timing, inventory method changes, capitalization vs expensing inconsistencies." }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "For a deep dive into each category, see our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA adjustments guide" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "reconciliation", children: "Net Income to EBITDA Reconciliation" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The reconciliation must be precise and traceable. Every number should tie back to a specific line in the financial statements or a specific transaction in the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/general-ledger-review", children: "general ledger" }),
          "."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Multi-period presentation", description: "Show the bridge for each analysis period (typically 3-5 years + YTD) to reveal trends in adjustments" },
          { title: "Gross vs net presentation", description: "Show adjustments on a gross basis (add-backs separate from deductions) for clarity" },
          { title: "Tax-effecting", description: "Some buyers prefer tax-effected adjustments — clarify the convention used" },
          { title: "Annualization", description: "For partial periods, annualize the run-rate impact of adjustments" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "run-rate", children: "Run-Rate EBITDA" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Run-rate EBITDA takes adjusted EBITDA one step further by incorporating ",
          /* @__PURE__ */ jsx("strong", { children: "known future changes" }),
          " that will impact earnings going forward:"
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "New revenue", description: "Contracts won but not yet fully reflected in historical financials" },
          { title: "Lost revenue", description: "Known customer losses or contract expirations" },
          { title: "Cost changes", description: "Planned hires, facility expansions, or cost reduction initiatives" },
          { title: "Market adjustments", description: "Owner compensation normalized to market replacement cost" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "documentation", children: "Supporting Documentation" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Invoice/receipt", description: "Source document proving the transaction occurred and the amount is accurate" },
          { title: "Management representation", description: "Written confirmation from the seller explaining the nature and non-recurrence" },
          { title: "Third-party verification", description: "Independent confirmation — bank statements, legal correspondence, vendor quotes" },
          { title: "Trend analysis", description: "Historical data showing the item didn't recur in other periods, supporting the non-recurring claim" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What is an EBITDA bridge?", answer: "An EBITDA bridge is a structured reconciliation from reported net income to adjusted EBITDA, showing each add-back and deduction with categorization and supporting documentation. It's the central schedule in a QoE report." },
          { question: "How do you calculate adjusted EBITDA?", answer: "Start with net income, add back interest, taxes, depreciation, and amortization to get reported EBITDA. Then apply normalization adjustments (non-recurring, owner-related, pro forma, and accounting) to arrive at adjusted EBITDA." },
          { question: "What's the difference between EBITDA and adjusted EBITDA?", answer: "EBITDA is earnings before interest, taxes, depreciation, and amortization. Adjusted EBITDA further normalizes for non-recurring items, owner discretionary expenses, and other items that won't continue under new ownership." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/qoe-report-template", label: "QoE Report Template" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/workbook/demo", label: "Try the Live Workbook Demo" }
        ] })
      ]
    }
  );
}
export {
  EBITDABridge as default
};
