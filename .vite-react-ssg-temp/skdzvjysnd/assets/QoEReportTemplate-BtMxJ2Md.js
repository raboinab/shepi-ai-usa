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
  { id: "overview", label: "Report Structure Overview" },
  { id: "executive-summary", label: "Executive Summary" },
  { id: "ebitda-bridge", label: "EBITDA Adjustment Schedule" },
  { id: "revenue-section", label: "Revenue Analysis" },
  { id: "expense-section", label: "Expense Analysis" },
  { id: "working-capital", label: "Working Capital Schedule" },
  { id: "proof-of-cash", label: "Proof of Cash" },
  { id: "management-adjustments", label: "Management Adjustments" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE Report Template — Structure, Sections & Schedules",
  description: "Quality of Earnings report template with executive summary, EBITDA adjustment schedule, revenue and expense analysis, working capital schedule, proof of cash, and management adjustments.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/qoe-report-template"
};
function QoEReportTemplate() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QoE Report Template — Structure, Sections & Schedules",
      seoTitle: "QoE Report Template — Executive Summary, EBITDA Schedule & More | Shepi",
      seoDescription: "Quality of Earnings report template covering executive summary, EBITDA adjustment schedules, revenue and expense analysis, working capital, proof of cash, and management adjustments.",
      canonical: "https://shepi.ai/guides/qoe-report-template",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "QoE Report Template" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "A well-structured QoE report tells a clear story — from headline findings to the granular schedules that support them. Here's the template professional analysts use." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "7–10", label: "Sections in a standard QoE report" },
          { value: "3–5 years", label: "Typical analysis period" },
          { value: "20–50+", label: "Common EBITDA adjustments reviewed" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Report Structure Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "A ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings report" }),
          " follows a logical structure that starts with high-level findings and drills into supporting detail. Whether prepared by a Big 4 firm or generated on an AI-assisted platform, the core sections are consistent."
        ] }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Executive Summary", description: "Headline findings, adjusted EBITDA, key risks, and deal considerations" },
          { title: "EBITDA Adjustment Schedule", description: "Bridge from reported to adjusted EBITDA with categorized adjustments" },
          { title: "Revenue Analysis", description: "Revenue quality, concentration, recurring vs non-recurring, trends" },
          { title: "Expense Analysis", description: "COGS, operating expenses, owner compensation, SG&A trends" },
          { title: "Working Capital Schedule", description: "Normalized NWC, peg calculation, component analysis" },
          { title: "Proof of Cash", description: "GL-to-bank reconciliation validating completeness of recorded transactions" },
          { title: "Balance Sheet Review", description: "Asset quality, unrecorded liabilities, debt-like items" },
          { title: "Management Adjustments", description: "Seller-proposed adjustments with validation and supporting documentation" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "executive-summary", children: "Executive Summary" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The executive summary is what buyers, lenders, and deal committees read first. It should answer: ",
          /* @__PURE__ */ jsx("em", { children: '"What is the true earning power of this business?"' })
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Adjusted EBITDA range", description: "Present a range if certain adjustments are debatable, with a midpoint best estimate" },
          { title: "Key adjustments", description: "Highlight the 3–5 largest adjustments and their net impact" },
          { title: "Revenue quality summary", description: "One-paragraph assessment of revenue sustainability and concentration" },
          { title: "Risk factors", description: "Top 3–5 risks identified during analysis with potential financial impact" },
          { title: "Data quality assessment", description: "Comment on completeness and reliability of source data" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "ebitda-bridge", children: "EBITDA Adjustment Schedule" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The EBITDA bridge is the centerpiece of any QoE report. It starts with reported net income and systematically adds back interest, taxes, depreciation, and amortization, then applies ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "normalization adjustments" }),
          " to arrive at adjusted EBITDA."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Non-recurring items", description: "One-time legal fees, restructuring, PPP income, insurance settlements" },
          { title: "Owner adjustments", description: "Above-market compensation, personal expenses, related-party transactions" },
          { title: "Pro forma adjustments", description: "Known changes: new hires, lost customers, lease changes, regulatory costs" },
          { title: "Accounting adjustments", description: "Reclassifications, accrual corrections, timing differences" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "revenue-section", children: "Revenue Analysis Section" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The revenue section of a QoE report provides the analytical detail behind the executive summary's revenue quality assessment. See our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/revenue-quality-analysis", children: "complete revenue quality guide" }),
          " for detailed methodology."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "expense-section", children: "Expense Analysis Section" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "COGS validation", description: "Verify cost of goods sold is consistently calculated and accurately captures direct costs" },
          { title: "Payroll analysis", description: "Owner compensation normalization, headcount analysis, benefit costs" },
          { title: "Rent & occupancy", description: "Below-market related-party leases, upcoming lease renewals, deferred maintenance" },
          { title: "SG&A trends", description: "Identify unusual patterns, missing costs, or expenses that should be reclassified" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "working-capital", children: "Working Capital Schedule" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The working capital schedule is a standalone section that feeds into both the QoE analysis and the purchase agreement. See our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/working-capital-analysis", children: "working capital analysis guide" }),
          " for detailed methodology."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "proof-of-cash", children: "Proof of Cash" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Proof of cash reconciles the general ledger's recorded transactions to actual bank activity. It's a powerful completeness test — if cash in the GL doesn't match cash at the bank, something is missing. See our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/cash-proof-analysis", children: "cash and bank tie-out guide" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "management-adjustments", children: "Management Adjustments" }),
        /* @__PURE__ */ jsx("p", { children: "Sellers often propose their own adjustments — typically add-backs that increase EBITDA. The QoE report should evaluate each management adjustment:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Documentation review", description: "Is the adjustment supported by invoices, contracts, or other verifiable evidence?" },
          { title: "Reasonableness test", description: "Is the adjustment amount reasonable relative to the underlying transaction?" },
          { title: "Classification", description: "Is this truly non-recurring, or is the seller relabeling a normal operating cost?" },
          { title: "Validation status", description: "Validated, partially supported, insufficient evidence, or contradicted by data" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What should a QoE executive summary include?", answer: "The executive summary should include adjusted EBITDA (with a range if applicable), the 3-5 largest adjustments, a revenue quality assessment, top risk factors, and a data quality commentary." },
          { question: "How many periods should a QoE report cover?", answer: "Most QoE reports cover 3-5 fiscal years plus year-to-date interim periods. Monthly data for at least the trailing 24 months is standard for trend analysis." },
          { question: "What's the difference between a QoE report and an audit?", answer: "A QoE report is an analytical assessment focused on earnings quality and sustainability. An audit is a formal attestation that financial statements comply with accounting standards. QoE is forward-looking; audits are backward-looking." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/ebitda-bridge", label: "EBITDA Bridge Analysis" },
          { to: "/workbook/demo", label: "Try the Live Workbook Demo" }
        ] })
      ]
    }
  );
}
export {
  QoEReportTemplate as default
};
