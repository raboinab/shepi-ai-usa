import { jsxs, jsx } from "react/jsx-runtime";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
import { S as StepList } from "./StepList-qzihzp1y.js";
import "react-router-dom";
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
  { id: "pe-challenge", label: "The PE Challenge" },
  { id: "speed", label: "Speed Across Deal Volume" },
  { id: "consistency", label: "Consistency & Standardization" },
  { id: "portfolio-screening", label: "Portfolio Screening" },
  { id: "team-workflow", label: "Deal Team Workflow" },
  { id: "complement-cpa", label: "Complementing CPA Firms" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings for Private Equity & Deal Teams",
  description: "How PE firms and deal teams use AI-assisted QoE to screen deals faster, standardize analysis across the portfolio, and reduce diligence bottlenecks.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/use-cases/pe-firms"
};
function PEFirms() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Quality of Earnings for Private Equity & Deal Teams",
      seoTitle: "QoE for Private Equity & Deal Teams | Shepi",
      seoDescription: "How PE firms use AI-assisted Quality of Earnings to screen deals faster, standardize analysis across portfolios, and reduce due diligence bottlenecks.",
      canonical: "https://shepi.ai/use-cases/pe-firms",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "PE Firms" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "The bottleneck isn't finding deals — it's analyzing them fast enough to act." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "2–4 hours", label: "Per target screening" },
          { value: "$30K–$100K", label: "External QoE cost avoided at screening stage" },
          { value: "Parallel", label: "Analyze multiple targets simultaneously" }
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg", children: "Private equity firms evaluate dozens — sometimes hundreds — of deals per year. Each one requires financial diligence. The bottleneck isn't finding deals; it's analyzing them fast enough to act. AI-assisted QoE gives deal teams the speed and consistency to screen more deals without adding headcount." }),
        /* @__PURE__ */ jsx("h2", { id: "pe-challenge", children: "The PE Challenge" }),
        /* @__PURE__ */ jsx("p", { children: "Lower-middle-market and middle-market PE firms face a diligence capacity problem. External QoE engagements cost $30K–$100K each and take 4+ weeks. You can't commission a full QoE on every deal you're considering — but you also can't afford to miss red flags because you skipped financial analysis on a promising target." }),
        /* @__PURE__ */ jsx("h2", { id: "speed", children: "Speed Across Deal Volume" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Shepi enables a ",
          /* @__PURE__ */ jsx("strong", { children: "two-stage diligence approach" }),
          ": rapid internal screening with Shepi, followed by formal external QoE on deals that pass initial analysis."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Pre-LOI screening", description: "2–4 hours per target vs. weeks of waiting for external QoE" },
          { title: "Parallel processing", description: "Analyze multiple targets simultaneously" },
          { title: "Data-driven decisions", description: "Make kill decisions based on actual financial analysis, not just CIM metrics" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "consistency", children: "Consistency & Standardization" }),
        /* @__PURE__ */ jsx("p", { children: "One of PE's persistent challenges is ensuring consistent analysis quality across deal team members." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Structured workflow", description: "Every analysis follows the same process — no missed steps" },
          { title: "Standard taxonomy", description: "Consistent categorization across all deals" },
          { title: "AI-assisted review", description: "Flags potential adjustments and red flags that less experienced analysts might miss" },
          { title: "Portfolio comparability", description: "Standardized output format makes it easy to compare targets" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "portfolio-screening", children: "Portfolio Screening" }),
        /* @__PURE__ */ jsx("p", { children: "For platform companies making add-on acquisitions, speed is everything. The portfolio company's management team often does the initial financial review. Shepi gives them a structured framework without requiring deep M&A experience." }),
        /* @__PURE__ */ jsx("h2", { id: "team-workflow", children: "Deal Team Workflow" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Associate uploads financials", description: "Trial balance, income statement, balance sheet" },
          { title: "Shepi structures the data", description: "Auto-mapped accounts, multi-period analysis, preliminary findings" },
          { title: "Associate reviews and refines", description: "Validates adjustments, adds context, documents rationale" },
          { title: "VP/Partner reviews output", description: "Clean, consistent format for quick review and decision" },
          { title: "Go/no-go decision", description: "Based on normalized EBITDA, red flags, and working capital analysis" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "complement-cpa", children: "Complementing External QoE Providers" }),
        /* @__PURE__ */ jsx("p", { children: "Shepi doesn't replace your relationship with CPA firms — it makes those engagements more efficient. When you commission external QoE, you can share Shepi's preliminary analysis as a starting point, reducing the CPA firm's ramp-up time and your costs." }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Can multiple team members work on the same project?", answer: "Projects can be shared with team members for collaborative analysis and review." },
          { question: "Is this suitable for deals above $50M enterprise value?", answer: "Shepi is optimized for lower-middle-market deals ($5M–$100M EV). For larger transactions, it serves as a screening and preparation tool that precedes formal external QoE." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/use-cases/deal-advisors", label: "Sell-Side QoE for Advisors" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" },
          { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" }
        ] })
      ]
    }
  );
}
export {
  PEFirms as default
};
