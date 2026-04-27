import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StepList } from "./StepList-qzihzp1y.js";
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
  { id: "what-is-run-rate", label: "What Is Run-Rate EBITDA?" },
  { id: "vs-historical", label: "Run-Rate vs Historical" },
  { id: "when-to-use", label: "When to Use Each" },
  { id: "how-to-calculate", label: "How to Calculate" },
  { id: "common-adjustments", label: "Common Run-Rate Adjustments" },
  { id: "red-flags", label: "Red Flags" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Run-Rate EBITDA vs Historical EBITDA",
  description: "Understand the difference between run-rate and historical EBITDA in M&A. Learn when to use each, how to calculate run-rate EBITDA, common pro forma adjustments, and red flags.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/run-rate-ebitda"
};
function RunRateEBITDA() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Run-Rate EBITDA vs Historical EBITDA",
      seoTitle: "Run-Rate EBITDA vs Historical — Calculation & When to Use Each | Shepi",
      seoDescription: "Learn the difference between run-rate and historical EBITDA. How to calculate run-rate EBITDA, common pro forma adjustments, and red flags in M&A due diligence.",
      canonical: "https://shepi.ai/guides/run-rate-ebitda",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Run-Rate EBITDA" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Historical EBITDA tells you what happened. Run-rate EBITDA tells you what's happening now. In a deal, the difference can be worth millions." }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-run-rate", children: "What Is Run-Rate EBITDA?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Run-rate EBITDA projects the company's current ",
          /* @__PURE__ */ jsx("strong", { children: "annualized earning power" }),
          ' based on the most recent performance, adjusted for known changes. Unlike historical EBITDA (which looks backward at full fiscal years), run-rate EBITDA asks: "If the business continues at its current pace, what will it earn?"'
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "It's calculated by taking a recent sub-period (typically trailing 3 or 6 months), annualizing it, and applying ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "pro forma adjustments" }),
          " for changes that have already occurred or are certain to occur."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "vs-historical", children: "Run-Rate vs Historical EBITDA" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Dimension", "Historical EBITDA", "Run-Rate EBITDA"],
            rows: [
              ["Time frame", "Full fiscal year(s)", "Annualized recent period"],
              ["Basis", "Actual results", "Current trajectory + adjustments"],
              ["Looks", "Backward", "Forward"],
              ["Subjectivity", "Lower (based on actuals)", "Higher (requires assumptions)"],
              ["Usefulness when...", "Business is stable", "Business is changing"],
              ["Buyer preference", "More conservative", "Used when justified"],
              ["Lender acceptance", "Broadly accepted", "Requires strong support"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "when-to-use", children: "When to Use Each" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Historical: stable businesses", description: "When revenue, margins, and expenses are consistent year-over-year, historical EBITDA is the most reliable indicator" },
          { title: "Run-rate: growing businesses", description: "When trailing 12-month EBITDA understates current performance due to recent growth" },
          { title: "Run-rate: post-event changes", description: "After a major contract win, price increase, cost reduction, or facility change that alters the earnings profile" },
          { title: "Run-rate: mid-year transactions", description: "When the deal closes mid-year and the most recent complete fiscal year is outdated" },
          { title: "Both: comprehensive analysis", description: "Best practice is to present both — historical for credibility, run-rate for current trajectory" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "how-to-calculate", children: "How to Calculate Run-Rate EBITDA" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Select the base period", description: "Choose the most recent 3, 6, or 12 months that best represent current operations" },
          { title: "Annualize", description: "If using a sub-annual period, annualize: (Period EBITDA ÷ months) × 12" },
          { title: "Adjust for seasonality", description: "If the business is seasonal, ensure the annualization accounts for seasonal patterns" },
          { title: "Apply pro forma adjustments", description: "Add the full-year impact of changes that occurred during the period (see below)" },
          { title: "Apply normalization adjustments", description: "Standard QoE adjustments (owner comp, non-recurring items) applied to the run-rate figure" },
          { title: "Document assumptions", description: "Every run-rate assumption must be documented with supporting evidence" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "common-adjustments", children: "Common Run-Rate (Pro Forma) Adjustments" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "New contract annualization", description: "$500K contract signed in month 9 → annualize to $500K full-year impact (net of COGS)" },
          { title: "Price increase impact", description: "10% price increase effective month 6 → project full-year impact on revenue and margin" },
          { title: "Cost savings", description: "Eliminated a $120K/year position in month 4 → add back the partial-year salary already recorded" },
          { title: "Facility change", description: "Moved to a new lease in month 7 → pro forma to full-year at new rate" },
          { title: "Lost customer removal", description: "Top customer churned in month 3 → remove their revenue from the run-rate (reduces EBITDA)" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "red-flags", children: "Red Flags in Run-Rate Analysis" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Cherry-picked periods", description: "Using the best 3 months instead of the most recent or most representative period" },
          { title: "Unsupported 'pipeline' revenue", description: "Including revenue from prospects that haven't signed contracts yet" },
          { title: "Ignoring negative trends", description: "Showing run-rate growth while recent months are actually declining" },
          { title: "Double-counting", description: "Applying both historical normalization and run-rate adjustments to the same item" },
          { title: "No seasonality adjustment", description: "Annualizing the best quarter without adjusting for the business's seasonal patterns" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Do lenders accept run-rate EBITDA?", answer: "Some do, but most apply a haircut or require additional support. SBA lenders typically rely more heavily on historical EBITDA. Present both to give lenders confidence." },
          { question: "What's the difference between run-rate and TTM?", answer: "TTM (trailing twelve months) is simply the most recent 12 months of actual results. Run-rate takes a recent period, annualizes it, and applies pro forma adjustments — it's forward-looking, not just trailing." },
          { question: "When does run-rate EBITDA hurt the seller?", answer: "When recent performance is declining. If trailing 3 months show margin compression, run-rate EBITDA will be lower than historical. Sellers in this position prefer to rely on full-year historical figures." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ebitda-bridge", label: "EBITDA Bridge Analysis" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/features/ebitda-automation", label: "EBITDA Add-Back Automation" }
        ] })
      ]
    }
  );
}
export {
  RunRateEBITDA as default
};
