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
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "data-pulled", label: "Data Pulled" },
  { id: "benefits", label: "Key Benefits" },
  { id: "security", label: "Security & Privacy" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBooks Integration for Quality of Earnings",
  description: "How Shepi's QuickBooks integration streamlines QoE analysis — direct data pull, automatic account mapping, multi-period support, and secure OAuth connection.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/features/quickbooks-integration"
};
function QuickBooksIntegration() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QuickBooks Integration for Quality of Earnings",
      seoTitle: "QuickBooks Integration for QoE Analysis | Shepi",
      seoDescription: "Connect QuickBooks directly to Shepi for seamless QoE analysis. Automatic trial balance import, account mapping, multi-period data, and secure OAuth connection.",
      canonical: "https://shepi.ai/features/quickbooks-integration",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "QuickBooks Integration" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "From raw QuickBooks data to structured QoE analysis in minutes — not hours of manual export and cleanup." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "8–12 hours", label: "Saved on manual mapping" },
          { value: "3–5 years", label: "Of data in one click" },
          { value: "Zero", label: "Export errors" }
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "QuickBooks Online is the accounting system for millions of small and mid-size businesses — the exact businesses being acquired in lower-middle-market M&A. Shepi's native QuickBooks integration eliminates the manual data export step, getting you from raw books to structured ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          " in minutes."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsx("p", { children: `Traditionally, the first step in any QoE analysis is requesting a trial balance export from the target company's accountant. This introduces delays (waiting for the accountant), errors (wrong date range, wrong basis, missing accounts), and friction (multiple rounds of "can you re-export with...").` }),
        /* @__PURE__ */ jsx("p", { children: "Shepi's QuickBooks integration bypasses all of this. Connect directly to the target's QuickBooks account, select your periods, and pull clean, complete data automatically." }),
        /* @__PURE__ */ jsx("h2", { id: "how-it-works", children: "How It Works" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Connect", description: "Authenticate via QuickBooks OAuth — the target company or their accountant grants read-only access" },
          { title: "Select periods", description: "Choose the fiscal years and interim periods you need for analysis" },
          { title: "Import", description: "Shepi pulls trial balance, chart of accounts, and supporting data automatically" },
          { title: "Map", description: "Accounts are auto-mapped to standardized income statement and balance sheet categories" },
          { title: "Analyze", description: "Proceed directly to analysis with clean, structured data" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "data-pulled", children: "What Data Is Pulled" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Trial Balance", description: "Complete trial balance for each selected period" },
          { title: "Chart of Accounts", description: "Full account list with types and classifications" },
          { title: "Income Statement", description: "Multi-period P&L with account-level detail" },
          { title: "Balance Sheet", description: "Multi-period balance sheet with account-level detail" },
          { title: "Company Info", description: "Company name, fiscal year end, accounting method" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "benefits", children: "Key Benefits" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Eliminate export errors", description: "No more wrong date ranges, missing accounts, or cash-vs-accrual confusion" },
          { title: "Save 8–12 hours", description: "Skip the manual mapping process — accounts are auto-classified" },
          { title: "Multi-period in one click", description: "Pull 3–5 years of data simultaneously" },
          { title: "Real-time data", description: "Access current financials without waiting for accountant availability" },
          { title: "Consistent formatting", description: "Every import uses the same structure, enabling apples-to-apples comparison across deals" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "security", children: "Security & Privacy" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "OAuth 2.0", description: "Industry-standard authentication — Shepi never sees or stores QuickBooks credentials" },
          { title: "Read-only access", description: "Shepi can only read data; it cannot modify the QuickBooks file" },
          { title: "Encrypted transit", description: "All data transferred over TLS 1.3" },
          { title: "Project isolation", description: "Imported data is tied to your project and invisible to other users" },
          { title: "Revocable access", description: "The QuickBooks account owner can disconnect Shepi at any time from their settings" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Does this work with QuickBooks Desktop?", answer: "Currently, the direct integration supports QuickBooks Online. For Desktop users, you can export trial balance data to CSV or Excel and upload it to Shepi manually." },
          { question: "Does the target company need a Shepi account?", answer: "No. The target (or their accountant) only needs to authorize the QuickBooks connection. They don't need a Shepi account." },
          { question: "Can I disconnect after importing?", answer: "Yes. Once data is imported, you can disconnect the QuickBooks connection. The imported data remains in your project." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/due-diligence-checklist", label: "Due Diligence Checklist" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" }
        ] })
      ]
    }
  );
}
export {
  QuickBooksIntegration as default
};
