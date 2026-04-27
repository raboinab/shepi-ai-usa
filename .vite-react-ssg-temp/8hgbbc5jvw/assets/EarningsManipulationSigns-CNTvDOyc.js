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
  { id: "revenue-manipulation", label: "Revenue Manipulation" },
  { id: "expense-manipulation", label: "Expense Manipulation" },
  { id: "balance-sheet-signals", label: "Balance Sheet Signals" },
  { id: "gl-level-indicators", label: "GL-Level Indicators" },
  { id: "detection-process", label: "Detection Process" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Signs of Earnings Manipulation in M&A",
  description: "How to detect earnings manipulation during M&A due diligence — revenue manipulation, expense timing, balance sheet signals, GL-level indicators, and systematic detection methods.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/earnings-manipulation-signs"
};
function EarningsManipulationSigns() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Signs of Earnings Manipulation in M&A",
      seoTitle: "Signs of Earnings Manipulation — Financial Statement Fraud Detection | Shepi",
      seoDescription: "Learn to spot earnings manipulation in M&A due diligence. Revenue manipulation, expense timing, balance sheet red flags, GL-level indicators, and detection methods.",
      canonical: "https://shepi.ai/guides/earnings-manipulation-signs",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Earnings Manipulation Signs" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: 'Not all manipulation is fraud. Some sellers genuinely misunderstand GAAP, others make "optimistic" accounting choices ahead of a sale. Either way, your QoE analysis needs to catch it.' }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Earnings manipulation ranges from aggressive-but-legal accounting choices to outright fraud. In ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          ", the goal isn't to label the seller as fraudulent — it's to identify financial presentations that don't reflect the business's true earning power."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "The most common forms of manipulation in SMB and lower-middle-market transactions aren't sophisticated. They're often obvious once you know where to look." }),
        /* @__PURE__ */ jsx("h2", { id: "revenue-manipulation", children: "Revenue Manipulation Signs" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Hockey stick revenue pattern", description: "Revenue flat for months, then spikes dramatically in the last month of a period — especially before a sale process" },
          { title: "Declining AR quality", description: "Revenue growing but AR aging deteriorating — suggests revenue recognized but not collectible" },
          { title: "Channel stuffing", description: "Unusually large shipments to distributors at period end, followed by returns in the next period" },
          { title: "Early recognition", description: "Revenue booked before delivery, installation, or performance obligation completion" },
          { title: "Bill-and-hold arrangements", description: "Revenue recognized without shipment — inventory still in the seller's warehouse" },
          { title: "Related-party revenue", description: "Revenue from entities controlled by the seller — may not represent arm's-length transactions" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "expense-manipulation", children: "Expense Manipulation Signs" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Deferred maintenance", description: "Capex and maintenance spending declining ahead of a sale — reduces expenses but creates hidden liabilities" },
          { title: "Reclassifying COGS to CapEx", description: "Moving operating costs to the balance sheet through inappropriate capitalization — inflates EBITDA" },
          { title: "Reducing reserves", description: "Bad debt reserves, warranty reserves, or inventory reserves reduced without underlying improvement" },
          { title: "Delaying vendor payments", description: "AP aging increasing dramatically — expenses incurred but not paid, improving apparent cash flow" },
          { title: "Eliminating discretionary spending", description: "Cutting marketing, training, maintenance, and R&D to boost near-term earnings — not sustainable" },
          { title: "Prepaid expense manipulation", description: "Shifting current-period expenses to prepaid accounts to defer recognition" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "balance-sheet-signals", children: "Balance Sheet Signals" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "AR growing faster than revenue", description: "Days sales outstanding increasing suggests revenue recognition issues or collection problems" },
          { title: "Inventory build-up", description: "Inventory growing faster than COGS may indicate obsolescence or channel stuffing reversals" },
          { title: "Declining AP", description: "If AP is declining while revenue grows, the company may be paying vendors faster to hide financial stress" },
          { title: "Unusual other assets", description: "Growing 'other assets' or 'miscellaneous' balance sheet accounts may hide expenses being capitalized" },
          { title: "Off-balance-sheet obligations", description: "Operating leases, guarantees, or contingencies not reflected in the financials" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "gl-level-indicators", children: "GL-Level Indicators" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Large round-dollar journal entries", description: "Manual entries in round amounts ($50,000, $100,000) suggest estimates or artificial adjustments" },
          { title: "Period-end entry clustering", description: "Concentration of manual entries in the last 3 days of a period is a classic manipulation signal" },
          { title: "Revenue journal entries", description: "Credits to revenue accounts from journal entries (not the billing system) warrant investigation" },
          { title: "Missing or vague descriptions", description: "Entries with no description or vague notes ('adjustment', 'correction') may be hiding their purpose" },
          { title: "Reversals in next period", description: "Large entries made at period end that reverse in the first week of the next period" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "detection-process", children: "Systematic Detection Process" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Compare trends to story", description: "Does the financial trajectory match the business narrative? Inconsistencies warrant investigation" },
          { title: "Analyze period-end activity", description: "Review all entries in the last 5 business days of each period — focus on manual journal entries" },
          { title: "Run ratio analysis", description: "DSO, DPO, DIO trends reveal timing manipulation. Margins that improve without operational explanation are suspicious" },
          { title: "Cross-reference external data", description: "Compare revenue to tax returns, bank deposits, and customer confirmations" },
          { title: "Apply AI anomaly detection", description: "Use AI to scan 100% of GL transactions for statistical anomalies, duplicates, and pattern deviations" },
          { title: "Review accounting policy changes", description: "Any change in revenue recognition, depreciation, or capitalization policy near the sale process is a red flag" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Is earnings manipulation the same as fraud?", answer: "Not necessarily. Fraud involves intentional deception. Earnings manipulation can range from aggressive-but-legal accounting choices to outright fraud. QoE analysis focuses on identifying the financial impact regardless of intent." },
          { question: "How common is manipulation in SMB acquisitions?", answer: "Some degree of 'optimistic' accounting is present in a majority of SMB sale processes. Obvious fraud is rare, but aggressive revenue recognition, deferred maintenance, and expense timing are common." },
          { question: "What should I do if I find manipulation?", answer: "Document the findings with supporting evidence, quantify the EBITDA impact, and present to your deal team. Depending on severity, options range from price adjustment to deal termination." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" },
          { to: "/guides/general-ledger-review", label: "General Ledger Review" },
          { to: "/guides/ai-accounting-anomaly-detection", label: "How AI Detects Anomalies" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" }
        ] })
      ]
    }
  );
}
export {
  EarningsManipulationSigns as default
};
