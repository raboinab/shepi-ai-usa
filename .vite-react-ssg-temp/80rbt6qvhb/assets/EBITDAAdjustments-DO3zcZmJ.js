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
  { id: "what-are-adjustments", label: "What Are EBITDA Adjustments?" },
  { id: "categories", label: "Adjustment Categories" },
  { id: "common-examples", label: "Common Examples" },
  { id: "documentation", label: "How to Document" },
  { id: "red-flags", label: "Red Flags" },
  { id: "best-practices", label: "Best Practices" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EBITDA Adjustments: Types, Examples & Best Practices",
  description: "Comprehensive guide to EBITDA adjustments in QoE analysis — categories, common examples, documentation best practices, and red flags to watch for.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/guides/ebitda-adjustments"
};
function EBITDAAdjustments() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "EBITDA Adjustments: Types, Examples & Best Practices",
      seoTitle: "EBITDA Adjustments Guide — Types, Examples & Best Practices | Shepi",
      seoDescription: "Master EBITDA adjustments for Quality of Earnings analysis. Learn adjustment categories, common examples, documentation standards, and red flags in M&A due diligence.",
      canonical: "https://shepi.ai/guides/ebitda-adjustments",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "EBITDA Adjustments Guide" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      modifiedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Every dollar of earnings misstatement is amplified by the valuation multiple. At 5x EBITDA, a $100K overstatement costs the buyer $500K." }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "EBITDA adjustments are the heart of every ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings analysis" }),
          ". They transform reported earnings into ",
          /* @__PURE__ */ jsx("strong", { children: "normalized EBITDA" }),
          " — the figure that actually determines what a business is worth. Getting adjustments right (and documenting them properly) is the difference between a defensible analysis and a deal that falls apart in diligence."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-are-adjustments", children: "What Are EBITDA Adjustments?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "EBITDA adjustments are modifications to a company's reported earnings that account for items that don't reflect the business's ",
          /* @__PURE__ */ jsx("strong", { children: "ongoing, normalized earning power" }),
          ". In M&A, the adjusted EBITDA figure is what buyers use to determine enterprise value — typically by applying a valuation multiple."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Adjustments can increase or decrease EBITDA. An add-back (e.g., owner's above-market salary) increases adjusted EBITDA, while a subtraction (e.g., below-market rent from a related party) decreases it." }),
        /* @__PURE__ */ jsx("h2", { id: "categories", children: "EBITDA Adjustment Categories" }),
        /* @__PURE__ */ jsx("p", { children: "Professional QoE analyses organize adjustments into standard categories:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Owner / Seller Discretionary", description: "Above-market owner compensation, personal expenses, family members on payroll, owner-funded benefits" },
          { title: "Non-Recurring / One-Time", description: "Litigation settlements, disaster costs, one-time professional fees, COVID disruptions, insurance proceeds" },
          { title: "Pro Forma Adjustments", description: "Annualizing mid-period contracts, price increases, new hires/terminations, facility changes" },
          { title: "Related-Party Transactions", description: "Below/above-market rent, non-arm's-length services, management fees to holding companies" },
          { title: "Accounting Policy", description: "Revenue recognition timing, capitalization vs. expensing, inventory valuation, accrual vs. cash differences" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "common-examples", children: "Common EBITDA Adjustment Examples" }),
        /* @__PURE__ */ jsx("p", { children: "Here are the adjustments that appear in nearly every QoE analysis:" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Owner compensation normalization:" }),
            " Replace owner's actual compensation ($400K) with market-rate for a GM ($175K) = $225K add-back"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "One-time legal fees:" }),
            " $85K settlement and legal fees for a resolved lawsuit = $85K add-back"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Related-party rent:" }),
            " Company pays $3K/month rent to owner; market rate is $5K = $24K subtraction (annual)"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Personal vehicle expenses:" }),
            " Owner's personal vehicle lease, insurance, and fuel = $18K add-back"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "PPP loan forgiveness:" }),
            " $150K recognized as other income = $150K subtraction (non-recurring revenue)"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "New contract annualization:" }),
            " $500K contract signed in month 9 = pro forma to $500K full year revenue impact"
          ] })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "documentation", children: "How to Document EBITDA Adjustments" }),
        /* @__PURE__ */ jsx("p", { children: "Every adjustment should include:" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Description", description: "Clear explanation of what the adjustment is and why it's necessary" },
          { title: "Category", description: "Which type of adjustment (owner, non-recurring, pro forma, etc.)" },
          { title: "Amount", description: "The dollar impact on EBITDA for each period analyzed" },
          { title: "Direction", description: "Whether it's an add-back or subtraction" },
          { title: "Supporting evidence", description: "Source documents, calculations, third-party comparables" },
          { title: "Rationale", description: "Why a reasonable buyer would agree this adjustment is appropriate" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx(Link, { to: "/features/ai-assistant", children: "Shepi's AI assistant" }),
          " helps structure adjustment documentation and flags when supporting evidence is insufficient."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "red-flags", children: "Red Flags in EBITDA Adjustments" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Adjustments exceed 30–40% of EBITDA", description: "Raises questions about the reliability of the underlying financials" },
          { title: '"Non-recurring" items that recur', description: "If legal fees or equipment repairs appear every year, they're recurring" },
          { title: "Missing documentation", description: "Adjustments without evidence are just assertions" },
          { title: "Aggressive revenue add-backs", description: 'Claiming lost revenue that "should have" occurred' },
          { title: "Inconsistent methodology", description: "Applying different standards across periods" },
          { title: "Round numbers everywhere", description: "Real adjustments rarely land on neat figures" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "best-practices", children: "Best Practices" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Be conservative", description: "When in doubt, err on the side of not making an adjustment. Aggressive add-backs undermine credibility." },
          { title: "Use multiple periods", description: "Analyze 3+ years to identify trends and validate non-recurring claims." },
          { title: "Document everything", description: "If you can't support it, don't adjust for it." },
          { title: "Consider the buyer's perspective", description: "Would a reasonable buyer agree this adjustment is appropriate?" },
          { title: "Separate opinion from fact", description: "Clearly distinguish between adjustments based on hard evidence vs. judgment calls." },
          { title: "Use consistent categories", description: "Standardized taxonomy makes it easier to communicate findings to all deal parties." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What's the difference between add-backs and adjustments?", answer: '"Add-backs" are a subset of adjustments that increase adjusted EBITDA. Not all adjustments are add-backs — some reduce EBITDA (e.g., below-market related-party rent).' },
          { question: "How many adjustments are normal in a QoE?", answer: "There's no fixed number. A clean business might have 5–10 adjustments; a complex one could have 30+. The key is that each adjustment is justified and documented." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?" },
          { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
          { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE" },
          { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" }
        ] })
      ]
    }
  );
}
export {
  EBITDAAdjustments as default
};
