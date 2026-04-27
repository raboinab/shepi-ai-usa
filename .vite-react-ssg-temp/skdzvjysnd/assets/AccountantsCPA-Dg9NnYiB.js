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
  { id: "growing-opportunity", label: "The Growing Opportunity" },
  { id: "scaling", label: "Scaling Your Practice" },
  { id: "workflow", label: "Firm Workflow" },
  { id: "deliverables", label: "Client-Ready Deliverables" },
  { id: "winning-engagements", label: "Winning More Engagements" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE for Accountants, CPAs & QoE Firms",
  description: "How accounting firms and QoE providers use AI-assisted analysis to scale their practice, deliver faster, and win more engagements.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-22",
  dateModified: "2026-02-22",
  mainEntityOfPage: "https://shepi.ai/use-cases/accountants-cpa"
};
function AccountantsCPA() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QoE for Accountants, CPAs & QoE Firms",
      seoTitle: "QoE for Accountants, CPAs & QoE Firms | Shepi",
      seoDescription: "How accounting firms and QoE providers use AI-assisted Quality of Earnings analysis to scale their practice, deliver preliminary findings in 48 hours, and win more engagements.",
      canonical: "https://shepi.ai/use-cases/accountants-cpa",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Accountants & CPAs" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Preliminary findings in 48 hours — complete reports in 1–2 weeks instead of 4–6." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "2–3x", label: "More engagements without proportional hiring" },
          { value: "48 hours", label: "Preliminary findings turnaround" },
          { value: "1–2 weeks", label: "Complete reports vs. 4–6 traditional" }
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "Demand for ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          " is surging as more M&A transactions — especially in the lower middle market — require independent financial due diligence. For accounting firms, CPA practices, and dedicated QoE providers, this represents both an enormous opportunity and a staffing challenge."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "growing-opportunity", children: "The Growing Opportunity" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Private equity firms, ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/independent-searchers", children: "independent searchers" }),
          ", and ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/lenders", children: "lenders" }),
          " increasingly require QoE reports before closing acquisitions. The lower middle market alone sees thousands of transactions annually, and the pool of firms capable of delivering quality analysis hasn't kept pace with demand."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "For firms that can deliver quickly and consistently, the economics are compelling: QoE engagements command premium fees, generate repeat business from deal-active clients, and create cross-selling opportunities for tax and advisory work." }),
        /* @__PURE__ */ jsx("h2", { id: "scaling", children: "Scaling Without Proportional Headcount" }),
        /* @__PURE__ */ jsx("p", { children: "The traditional bottleneck is staffing. A senior analyst might spend 80–120 hours on a single QoE engagement, limiting most firms to a handful of concurrent projects. When deal flow spikes, firms either turn away work or burn out their teams." }),
        /* @__PURE__ */ jsx("p", { children: "AI-assisted analysis changes this equation. By automating the data ingestion, normalization, and initial adjustment identification, firms can handle 2–3x more engagements without proportional hiring. The analyst's time shifts from spreadsheet construction to judgment-intensive work: evaluating adjustment reasonableness, assessing business quality, and advising clients." }),
        /* @__PURE__ */ jsx("h2", { id: "workflow", children: "Firm Workflow with Shepi" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Data ingestion", description: "Connect directly to QuickBooks or upload financial statements. Shepi normalizes the data and maps accounts automatically." },
          { title: "Automated analysis", description: "The platform identifies potential EBITDA adjustments, flags unusual transactions, and builds multi-period trending." },
          { title: "Analyst review", description: "Your team reviews AI-identified adjustments, applies professional judgment, and adds deal-specific context." },
          { title: "Report generation", description: "Export lender-ready QoE reports with supporting schedules, adjustment summaries, and working capital analysis." },
          { title: "Client delivery", description: "Present findings with confidence, backed by comprehensive analysis and clean documentation." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "deliverables", children: "Client-Ready Deliverables" }),
        /* @__PURE__ */ jsx("p", { children: "The output matters as much as the analysis. Shepi produces institutional-quality deliverables:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Adjusted EBITDA bridge", description: "Clear walk from reported to adjusted earnings with categorized adjustments" },
          { title: "Working capital analysis", description: "Normalized working capital with peg calculations" },
          { title: "Revenue quality assessment", description: "Customer concentration, recurring vs. non-recurring revenue analysis" },
          { title: "Supporting schedules", description: "Detailed backup for every adjustment, ready for lender review" },
          { title: "Management discussion points", description: "Key questions and areas requiring further investigation" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "winning-engagements", children: "Winning More Engagements" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "In a competitive market, turnaround time is often the deciding factor. When a ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/pe-firms", children: "PE firm" }),
          " or searcher has a deal under LOI with a 60-day exclusivity window, they can't afford to wait three weeks for the QoE firm to even start. Firms that can demonstrate rapid turnaround win more mandates."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "AI-assisted analysis also enables competitive pricing. Lower per-engagement labor costs mean firms can offer compelling pricing without sacrificing margins." }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Does AI replace the CPA's judgment?", answer: "No. AI handles the data-intensive groundwork — normalization, trend identification, anomaly detection — while the CPA focuses on professional judgment, client relationships, and the qualitative aspects of the analysis that require experience. Think of it as an exceptionally fast analyst who never gets tired of spreadsheet work." },
          { question: "How does this compare to traditional QoE workflows?", answer: "Traditional workflows involve significant manual data entry, spreadsheet construction, and formatting. AI-assisted analysis automates those steps, letting your team start from a structured analysis rather than a blank workbook." },
          { question: "Can I use this for both buy-side and sell-side engagements?", answer: "Yes. The platform supports both buy-side QoE (for acquirers and their lenders) and sell-side QoE (for sellers and their advisors). The underlying analysis is the same; the framing and deliverables are tailored to each audience." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI-Assisted vs. Traditional QoE" },
          { to: "/use-cases/lenders", label: "QoE for Lenders & SBA Lending" }
        ] })
      ]
    }
  );
}
export {
  AccountantsCPA as default
};
