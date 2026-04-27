import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
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
  { id: "revenue-red-flags", label: "Revenue Red Flags" },
  { id: "expense-red-flags", label: "Expense Red Flags" },
  { id: "balance-sheet-red-flags", label: "Balance Sheet Red Flags" },
  { id: "cash-flow-red-flags", label: "Cash Flow Red Flags" },
  { id: "gl-red-flags", label: "GL-Level Red Flags" },
  { id: "operational-red-flags", label: "Operational Red Flags" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Financial Due Diligence Red Flags — Complete Checklist for M&A",
  description: "Comprehensive checklist of financial red flags in M&A due diligence: revenue, expense, balance sheet, cash flow, GL-level, and operational warning signs.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/financial-red-flags"
};
function FinancialRedFlags() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Financial Due Diligence Red Flags — Complete Checklist",
      seoTitle: "Financial Red Flags Checklist for M&A Due Diligence | Shepi",
      seoDescription: "Comprehensive checklist of financial red flags in acquisitions: revenue manipulation, expense anomalies, balance sheet risks, cash flow signals, GL-level warnings, and operational risks.",
      canonical: "https://shepi.ai/guides/financial-red-flags",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Financial Red Flags" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Red flags don't mean walk away — they mean dig deeper. The most expensive acquisitions are the ones where red flags were missed, not the ones where they were found." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "70%+", label: "Of deals have material adjustments" },
          { value: "3–5×", label: "Valuation impact of missed red flags" },
          { value: "Early", label: "Best time to catch them" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "During ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          ", red flags are early warning signals that warrant deeper investigation. They range from minor classification issues to deal-breaking findings. This checklist covers the most common red flags organized by financial statement area."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "revenue-red-flags", children: "Revenue Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Revenue hockey stick", description: "Dramatic revenue increase in the most recent period — often coincides with the decision to sell" },
          { title: "Customer concentration > 20%", description: "Single customer representing more than 20% of revenue creates significant key-customer risk" },
          { title: "Declining recurring revenue", description: "Subscription or contract revenue declining while total revenue grows — sustainability concern" },
          { title: "Revenue/AR disconnect", description: "Revenue growing but AR growing faster — signals collection issues or aggressive recognition" },
          { title: "Unusual period-end revenue", description: "Revenue spikes in the last week of each period suggest timing manipulation" },
          { title: "Related-party revenue", description: "Revenue from entities controlled by the seller may not continue post-acquisition" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "expense-red-flags", children: "Expense Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Declining maintenance spend", description: "Deferred maintenance inflates near-term earnings but creates future capital requirements" },
          { title: "Missing expenses", description: "Key cost categories (insurance, legal, accounting) with unusually low or zero balances" },
          { title: "Gross margin expansion", description: "Margins improving without clear operational explanation — may indicate cost deferral" },
          { title: "Owner comp well above market", description: "Signals potential add-back, but verify it's not compensating for underpaid staff" },
          { title: "Expense reclassification", description: "Operating expenses moved below the line to inflate operating income" },
          { title: "Excessive add-backs", description: "Total adjustments exceeding 30-40% of reported EBITDA warrant heavy scrutiny" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "balance-sheet-red-flags", children: "Balance Sheet Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Inventory build-up", description: "Inventory growing faster than revenue — potential obsolescence or overstatement" },
          { title: "Aging AR deterioration", description: "Increasing percentage of AR in 60+ day buckets signals collection problems" },
          { title: "Unrecorded liabilities", description: "Pending litigation, warranty obligations, or tax exposures not on the balance sheet" },
          { title: "Goodwill or intangibles", description: "Large intangible assets may indicate prior acquisitions with integration risk" },
          { title: "Related-party receivables", description: "Loans to owners or related entities that may not be collectible" },
          { title: "Inadequate reserves", description: "Bad debt, warranty, or inventory reserves below historical loss rates" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "cash-flow-red-flags", children: "Cash Flow Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Earnings/cash divergence", description: "Net income positive but operating cash flow negative — a classic manipulation signal" },
          { title: "Commingled personal funds", description: "Personal and business bank accounts intermingled — makes validation nearly impossible" },
          { title: "Unexplained cash movements", description: "Large transfers without clear business purpose" },
          { title: "GL-to-bank discrepancies", description: "Cash per the books doesn't match cash at the bank — see proof of cash" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "For detailed methodology, see our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/cash-proof-analysis", children: "cash and bank tie-out guide" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "gl-red-flags", children: "GL-Level Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Round-dollar journal entries", description: "Large round amounts suggest estimates or manual overrides" },
          { title: "Period-end entry clustering", description: "Many journal entries in the last days of the quarter — potential window dressing" },
          { title: "Entries without descriptions", description: "Journal entries lacking adequate explanation may be concealing their purpose" },
          { title: "Duplicate payments", description: "Same vendor, same amount, close dates — indicates weak controls or potential fraud" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Deep dive: ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/general-ledger-review", children: "General Ledger Review guide" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "operational-red-flags", children: "Operational Red Flags" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Key employee dependency", description: "Critical operations depending on 1-2 individuals who may leave post-acquisition" },
          { title: "Customer churn acceleration", description: "Customer loss rate increasing — revenue sustainability risk" },
          { title: "Supplier concentration", description: "Single-source suppliers create supply chain vulnerability" },
          { title: "Pending regulatory changes", description: "New regulations that could materially increase compliance costs" },
          { title: "Litigation exposure", description: "Active or threatened lawsuits with material potential liability" },
          { title: "Contract expirations", description: "Key contracts (leases, customer agreements) expiring near or after close" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Do red flags mean I shouldn't do the deal?", answer: "Not necessarily. Red flags mean you need to investigate further. Many red flags result in purchase price adjustments, deal structure changes (earnouts, indemnities), or additional representations and warranties — not deal termination." },
          { question: "How many red flags is too many?", answer: "There's no magic number. The severity matters more than the count. One material fraud finding may kill a deal, while twenty minor classification issues might just affect the adjustment schedule." },
          { question: "Can AI detect financial red flags?", answer: "AI excels at pattern-based detection — anomalies, duplicates, round-dollar analysis, trend breaks. It's particularly powerful for GL-level analysis where the volume of data makes manual review impractical." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/due-diligence-checklist", label: "Due Diligence Checklist" },
          { to: "/guides/general-ledger-review", label: "General Ledger Review" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" }
        ] })
      ]
    }
  );
}
export {
  FinancialRedFlags as default
};
