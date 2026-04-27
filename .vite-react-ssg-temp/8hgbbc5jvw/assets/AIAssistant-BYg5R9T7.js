import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
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
  { id: "what-it-does", label: "What the AI Does" },
  { id: "what-it-doesnt", label: "What It Doesn't Do" },
  { id: "red-flags", label: "Red Flag Detection" },
  { id: "education", label: "Educational Guidance" },
  { id: "privacy", label: "Data Privacy" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI-Powered QoE Analysis Assistant",
  description: "How Shepi's AI assistant helps with Quality of Earnings analysis — red flag identification, adjustment guidance, educational support, and what the AI doesn't do.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/features/ai-assistant"
};
function AIAssistant() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "AI-Powered QoE Analysis Assistant",
      seoTitle: "AI-Powered Quality of Earnings Assistant | Shepi",
      seoDescription: "How Shepi's AI assistant accelerates QoE analysis — red flag identification, EBITDA adjustment guidance, educational support, and clear boundaries on what AI does and doesn't do.",
      canonical: "https://shepi.ai/features/ai-assistant",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "AI Assistant" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "AI assists, you decide — every adjustment, conclusion, and judgment call is yours." }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "Shepi's AI assistant is designed with a clear philosophy: ",
          /* @__PURE__ */ jsx("strong", { children: "AI assists, you decide" }),
          ". The AI helps you work faster and catch more issues, but every adjustment, conclusion, and judgment call is yours. Here's exactly what the AI does — and what it doesn't."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The AI assistant is available throughout the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          " workflow. It operates in three modes: identification (surfacing potential issues), education (explaining concepts and context), and assistance (answering questions about your specific analysis)."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-it-does", children: "What the AI Does" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Identifies potential adjustments", description: "Reviews financial data to flag items that commonly require EBITDA adjustments: unusual transactions, related-party items, owner discretionary expenses, and non-recurring events." },
          { title: "Surfaces red flags", description: "Anomalies, trends, and patterns that warrant attention — revenue concentration, margin compression, working capital swings, accounting inconsistencies." },
          { title: "Explains concepts", description: 'Not sure what "normalized working capital" means? The AI provides clear, contextual explanations drawn from QoE best practices and M&A industry knowledge.' },
          { title: "Answers questions", description: `Ask in real-time: "Is this revenue trend concerning?" or "What's a typical owner comp adjustment for a services business?" The AI provides informed perspectives.` }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-it-doesnt", children: "What the AI Doesn't Do" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Transparency matters. Here's what our AI explicitly does ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          " do:"
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Does not auto-calculate adjustments", description: "Every number in your analysis is entered and approved by you" },
          { title: "Does not certify or attest", description: "Provides analysis assistance, not professional certification" },
          { title: "Does not audit source documents", description: "Works with the data you provide; doesn't verify management representations" },
          { title: "Does not replace professional judgment", description: "A tool that makes you faster — not a substitute for financial expertise" },
          { title: "Does not train on your data", description: "Your deal information is never used to train AI models" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "red-flags", children: "Red Flag Detection" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Revenue quality", description: "Customer concentration, seasonal anomalies, aggressive recognition" },
          { title: "Expense patterns", description: "Missing costs, below-market related-party charges, deferred maintenance" },
          { title: "Working capital", description: "DSO/DPO trends that suggest timing manipulation or collection issues" },
          { title: "Balance sheet", description: "Unusual accruals, inventory build-up, unrecorded liabilities" },
          { title: "Trend analysis", description: "Margin shifts, revenue trajectory breaks, expense reclassifications" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "education", children: "Educational Guidance" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "One of the most valuable aspects of the AI assistant is its educational role. For ",
          /* @__PURE__ */ jsx(Link, { to: "/use-cases/independent-searchers", children: "independent searchers" }),
          " and first-time buyers, the AI serves as a knowledgeable mentor:"
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Industry-specific guidance", description: "Explains QoE considerations relevant to your target's industry" },
          { title: "Benchmarking context", description: `Provides context on what's "normal" for adjustment categories` },
          { title: "Step-by-step process", description: "Guides users through the analytical process in logical order" },
          { title: "Best practices", description: "References established QoE methodology and industry standards" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "privacy", children: "Data Privacy" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "No model training", description: "Your deal data is never used to train AI models" },
          { title: "Encrypted at rest & in transit", description: "All data protected with industry-standard encryption" },
          { title: "Project isolation", description: "No cross-user visibility — your data stays yours" },
          { title: "Full deletion control", description: "Delete a project and all associated data is permanently removed" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What AI model powers Shepi's assistant?", answer: "Shepi uses enterprise-grade AI models optimized for financial analysis. The specific models may be updated over time to leverage the latest capabilities." },
          { question: "Can I turn off AI suggestions?", answer: "Yes. The AI assistant is an optional feature — you can use Shepi's structured workflow without AI assistance if you prefer." },
          { question: "Is the AI reliable for financial analysis?", answer: "The AI is a powerful tool for identification and guidance, but it's not infallible. That's why every AI suggestion is presented for your review and approval — never auto-applied. Think of it as a very fast, very well-read junior analyst that still needs senior review." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/features/quickbooks-integration", label: "QuickBooks Integration" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" },
          { to: "/use-cases/pe-firms", label: "QoE for PE Firms" }
        ] })
      ]
    }
  );
}
export {
  AIAssistant as default
};
