import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { C as ComparisonTable } from "./ComparisonTable-DuwES2f2.js";
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
  { id: "overview", label: "Overview" },
  { id: "what-ai-does", label: "What AI QoE Does" },
  { id: "what-cpa-does", label: "What CPA Firms Provide" },
  { id: "cost-comparison", label: "Cost Comparison" },
  { id: "speed", label: "Speed & Timeline" },
  { id: "when-to-use", label: "When to Use Each" },
  { id: "complement", label: "How They Complement" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI-Assisted QoE vs. Traditional CPA Firm QoE",
  description: "Honest comparison of AI-assisted Quality of Earnings analysis vs. traditional CPA firm QoE — cost, speed, scope, and when each approach is appropriate.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/compare/ai-qoe-vs-traditional"
};
function AIvsTraditional() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "AI-Assisted QoE vs. Traditional CPA Firm QoE",
      seoTitle: "AI QoE vs. Traditional CPA Firm — Honest Comparison | Shepi",
      seoDescription: "Compare AI-assisted and traditional CPA firm Quality of Earnings: cost, speed, scope, accuracy, and when each approach is the right choice for your deal.",
      canonical: "https://shepi.ai/compare/ai-qoe-vs-traditional",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "AI QoE vs. Traditional" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "AI and CPA QoE aren't competitors — they serve different points on the diligence spectrum." }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "The emergence of AI-assisted ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings" }),
          " platforms has created a new option for deal professionals. But when should you use AI-assisted QoE, and when do you need a traditional CPA firm? Here's an honest comparison."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsx("p", { children: "AI-assisted QoE and traditional CPA firm QoE aren't competitors — they serve different points on the diligence spectrum. Understanding their strengths helps you choose the right tool for each situation." }),
        /* @__PURE__ */ jsx("h2", { id: "what-ai-does", children: "What AI-Assisted QoE Does" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Structured framework", description: "Guided workflow through the complete QoE process" },
          { title: "Automated data processing", description: "Account mapping, multi-period alignment, calculations" },
          { title: "AI-powered assistance", description: "Red flag identification, adjustment suggestions, educational guidance" },
          { title: "Professional output", description: "Institutional-quality workpapers exported to shareable formats" },
          { title: "Speed", description: "Hours instead of weeks" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-cpa-does", children: "What CPA Firms Provide" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Professional attestation", description: "A signed report from an independent accounting firm" },
          { title: "Liability coverage", description: "E&O insurance backing the analysis" },
          { title: "Management interviews", description: "In-depth discussions with target company management" },
          { title: "Independent verification", description: "Third-party confirmation of key assumptions and data" },
          { title: "Regulatory acceptance", description: "Reports accepted by lenders, courts, and regulatory bodies" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "cost-comparison", children: "Cost Comparison" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Factor", "AI-Assisted (Shepi)", "Traditional CPA Firm"],
            rows: [
              ["Cost per project", `${PRICING.perProject.display}`, "$20,000+"],
              ["Timeline", "2–4 hours (analysis)", "4+ weeks"],
              ["Professional attestation", "No", "Yes"],
              ["Liability coverage", "No", "Yes (E&O)"],
              ["Management interviews", "Not included", "Included"],
              ["Lender acceptance", "Varies", "Generally accepted"],
              ["Multi-deal pricing", `${PRICING.monthly.display}/month`, "Per-engagement"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "speed", children: "Speed & Timeline" }),
        /* @__PURE__ */ jsx("p", { children: "The most dramatic difference is speed. AI-assisted QoE delivers initial analysis in hours, enabling real-time decision-making during deal negotiations. Traditional QoE's 4–8 week timeline often creates deal risk — targets may accept competing offers while your diligence is still in progress." }),
        /* @__PURE__ */ jsx("h2", { id: "when-to-use", children: "When to Use Each Approach" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "AI for screening pre-LOI", description: "Decide whether to pursue before committing to formal diligence" },
          { title: "AI for budget-limited deals", description: "Especially for independent searchers evaluating multiple targets" },
          { title: "AI for speed-critical deals", description: "Competitive auctions or fast-moving deal environments" },
          { title: "CPA for lender requirements", description: "SBA or other lender requires independent CPA-attested QoE" },
          { title: "CPA for large deals", description: "Deal size warrants the cost ($10M+ EV where $30K QoE is immaterial)" },
          { title: "CPA for regulatory needs", description: "Complex accounting, litigation risk, or board/investor mandates" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "complement", children: "How They Complement Each Other" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The smartest approach is often ",
          /* @__PURE__ */ jsx("strong", { children: "both" }),
          ". Use AI-assisted QoE for rapid screening and preliminary analysis, then commission traditional QoE on the deal you're actually closing. Your CPA firm benefits from the preliminary work — shorter engagement, lower fees, faster turnaround."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Will AI replace CPA firm QoE?", answer: "No — not for situations requiring professional attestation or regulatory compliance. AI-assisted QoE expands access to financial analysis for deals and situations where traditional QoE was never practical." },
          { question: "Can I upgrade from Shepi analysis to formal CPA QoE?", answer: "Yes. Share Shepi's exported workpapers with your CPA firm as a starting point. This can significantly reduce their engagement time and your cost since they're building on structured analysis rather than starting from scratch." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/use-cases/pe-firms", label: "QoE for PE Firms" },
          { to: "/use-cases/deal-advisors", label: "QoE for Deal Advisors" }
        ] })
      ]
    }
  );
}
export {
  AIvsTraditional as default
};
