import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
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
  { id: "time", label: "Time Comparison" },
  { id: "consistency", label: "Consistency & Errors" },
  { id: "structure", label: "Structure & Guidance" },
  { id: "output", label: "Output Quality" },
  { id: "when-excel", label: "When Excel Works" },
  { id: "comparison-table", label: "Side-by-Side" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Shepi vs. Excel for Quality of Earnings Analysis",
  description: "Detailed comparison of AI-assisted QoE platforms vs. Excel spreadsheets for Quality of Earnings analysis — time, accuracy, consistency, and output quality.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/compare/shepi-vs-excel"
};
function ShepiVsExcel() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Shepi vs. Excel for Quality of Earnings Analysis",
      seoTitle: "Shepi vs. Excel for QoE Analysis — Detailed Comparison | Shepi",
      seoDescription: "Should you use AI-assisted QoE software or Excel spreadsheets? Compare time, accuracy, consistency, output quality, and cost for Quality of Earnings analysis.",
      canonical: "https://shepi.ai/compare/shepi-vs-excel",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Shepi vs. Excel" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "2–4 hours vs. 40+ hours — same analysis, different century." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "40+ hours", label: "In Excel from scratch" },
          { value: "2–4 hours", label: "With Shepi" },
          { value: "Up to 88%", label: "Of complex spreadsheets contain errors" }
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "Excel is the default tool for financial analysis — and for good reason. It's flexible, powerful, and universally understood. But for ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          ", Excel's flexibility is also its weakness. Here's an honest comparison."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "The Core Difference" }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Excel gives you a blank canvas." }),
          " You decide the structure, formulas, layout, and methodology. This is powerful for experienced analysts who know exactly what they're building — but it means starting from scratch every time."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Shepi gives you a guided process." }),
          " The structure, calculations, and workflow are built in. You bring the data and judgment; Shepi handles the framework."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "time", children: "Time Comparison" }),
        /* @__PURE__ */ jsx("p", { children: "The biggest difference is setup time. Building a QoE workbook in Excel from scratch takes an experienced analyst 15–25 hours before any actual analysis begins:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Template setup", description: "4–6 hours to build the workbook structure, formulas, and formatting" },
          { title: "Account mapping", description: "8–12 hours to map chart of accounts to standardized categories" },
          { title: "Reconciliation", description: "2–4 hours to verify data integrity and trace back to source" },
          { title: "Formatting", description: "2–3 hours to make the output presentable" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "With Shepi, these steps are automated or pre-built. Total time from data upload to professional output is typically ",
          /* @__PURE__ */ jsx("strong", { children: "2–4 hours vs. 40+ hours" }),
          " in Excel."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "consistency", children: "Consistency & Error Reduction" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Formula errors", description: "Research shows up to 88% of complex spreadsheets contain errors (Panko, 2008)" },
          { title: "Inconsistent methodology", description: "Each analyst builds differently; quality varies" },
          { title: "Version confusion", description: `"QoE_final_v3_REVISED_JB_edits.xlsx" — everyone's been there` },
          { title: "Broken references", description: "Copy-paste errors, circular references, mislinked cells" }
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Shepi eliminates these issues with validated calculations, standardized workflows, and a single source of truth for each project." }),
        /* @__PURE__ */ jsx("h2", { id: "structure", children: "Structure & Guidance" }),
        /* @__PURE__ */ jsx("p", { children: "For experienced analysts, Excel's lack of structure is a feature. For everyone else, it's a significant barrier:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "No adjustment guidance", description: "Excel doesn't tell you which adjustments to look for" },
          { title: "No red flag detection", description: "Excel doesn't flag potential inconsistencies" },
          { title: "No logical workflow", description: "Excel doesn't guide you through the analysis in order" },
          { title: "No context or education", description: "Excel doesn't explain why something matters" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Shepi's ",
          /* @__PURE__ */ jsx(Link, { to: "/features/ai-assistant", children: "AI assistant" }),
          " provides real-time guidance, explains concepts, and helps identify adjustments you might miss."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "output", children: "Output Quality" }),
        /* @__PURE__ */ jsx("p", { children: "A well-built Excel QoE can look extremely professional — but it takes significant effort. Shepi produces consistently professional output that exports to PDF and Excel, ready to share with lenders, investors, or deal parties." }),
        /* @__PURE__ */ jsx("h2", { id: "when-excel", children: "When Excel Still Makes Sense" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Existing templates", description: "A firm with mature, tested QoE templates may not need to switch" },
          { title: "Highly custom analysis", description: "Unusual deal structures or industry-specific calculations" },
          { title: "Team already proficient", description: "If your team is fast and consistent in Excel, the marginal benefit of switching is lower" },
          { title: "Integration requirements", description: "When QoE needs to integrate with other proprietary models" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison-table", children: "Side-by-Side Comparison" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Factor", "Excel", "Shepi"],
            rows: [
              ["Setup time", "15–25 hours", "Minutes"],
              ["Total analysis time", "40+ hours", "2–4 hours"],
              ["Account mapping", "Manual", "Automated"],
              ["Error risk", "High (up to 88% of complex spreadsheets)", "Validated calculations"],
              ["AI assistance", "None", "Real-time guidance"],
              ["Consistency across projects", "Depends on analyst", "Built-in"],
              ["Learning curve", "High (build your own)", "Low (guided workflow)"],
              ["Cost", "Free (+ labor)", `${PRICING.perProject.display}/project or ${PRICING.monthly.display}/month`],
              ["Customization", "Unlimited", "Structured framework"],
              ["Output format", "Excel file", "PDF & Excel export"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Can I still use Excel alongside Shepi?", answer: "Absolutely. Many users export Shepi's output to Excel and perform additional custom analysis there. Shepi handles the structure and heavy lifting; you can extend it however you want." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA Firm" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
          { to: "/features/quickbooks-integration", label: "QuickBooks Integration" }
        ] })
      ]
    }
  );
}
export {
  ShepiVsExcel as default
};
