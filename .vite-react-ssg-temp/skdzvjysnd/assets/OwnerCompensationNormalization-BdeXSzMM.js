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
  { id: "what-is-normalization", label: "What Is Normalization?" },
  { id: "why-it-matters", label: "Why It Matters" },
  { id: "components", label: "What Gets Normalized" },
  { id: "how-to-calculate", label: "How to Calculate" },
  { id: "common-mistakes", label: "Common Mistakes" },
  { id: "documentation", label: "Documentation Standards" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Owner Compensation Normalization for M&A",
  description: "How to normalize owner compensation in Quality of Earnings analysis — what to include, how to calculate market-rate replacement, common mistakes, and documentation requirements.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/owner-compensation-normalization"
};
function OwnerCompensationNormalization() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Owner Compensation Normalization for M&A",
      seoTitle: "Owner Compensation Normalization — How to Normalize Owner Salary for M&A | Shepi",
      seoDescription: "Learn how to normalize owner compensation for Quality of Earnings analysis. Covers salary, benefits, personal expenses, market-rate replacement, and documentation standards.",
      canonical: "https://shepi.ai/guides/owner-compensation-normalization",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Owner Compensation Normalization" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Owner compensation is the single largest EBITDA adjustment in most SMB acquisitions. Get it wrong, and you're overpaying — or undervaluing the deal." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "#1", label: "Most common QoE adjustment" },
          { value: "$100K–$300K", label: "Typical add-back range (SMB)" },
          { value: "5×", label: "Multiplied through valuation" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-normalization", children: "What Is Owner Compensation Normalization?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Owner compensation normalization replaces the owner's ",
          /* @__PURE__ */ jsx("strong", { children: "actual total compensation package" }),
          " with the ",
          /* @__PURE__ */ jsx("strong", { children: "market-rate cost of hiring a professional manager" }),
          " to run the business post-acquisition. The difference between actual and market rate becomes an ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA add-back" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "In owner-operated businesses, owners typically pay themselves above or below market rate — and frequently run personal expenses through the business. Normalization captures both dimensions." }),
        /* @__PURE__ */ jsx("h2", { id: "why-it-matters", children: "Why It Matters" }),
        /* @__PURE__ */ jsx("p", { children: "At a 5× EBITDA multiple, every $100K of owner compensation add-back translates to $500K of enterprise value. This makes owner comp the highest-stakes adjustment in most QoE analyses." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Buyer perspective", description: "What will it actually cost to replace the owner? If EBITDA is overstated, the purchase price is too high" },
          { title: "Seller perspective", description: "Properly documented owner comp add-backs maximize the adjusted EBITDA and support a higher valuation" },
          { title: "Lender perspective", description: "Lenders want to ensure the business generates enough cash flow to service debt after paying a market-rate manager" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "components", children: "What Gets Normalized" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Base salary", description: "Owner's W-2 salary or guaranteed payments vs market-rate GM/CEO compensation" },
          { title: "Bonuses & distributions", description: "Discretionary bonuses, profit distributions taken as compensation, year-end payouts" },
          { title: "Benefits", description: "Health insurance, retirement contributions, life insurance, disability — compare to standard employee benefits" },
          { title: "Vehicle expenses", description: "Personal vehicle lease, fuel, insurance, maintenance charged to the business" },
          { title: "Travel & entertainment", description: "Personal travel, meals, memberships, and entertainment coded as business expenses" },
          { title: "Family payroll", description: "Spouses, children, or relatives on payroll performing minimal or no work" },
          { title: "Personal services", description: "Personal legal, accounting, financial planning, and consulting fees paid by the business" },
          { title: "Other perquisites", description: "Country club memberships, personal subscriptions, home office costs, charitable contributions" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "how-to-calculate", children: "How to Calculate the Add-Back" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Identify total owner compensation", description: "Aggregate all forms: salary, bonuses, distributions, benefits, personal expenses, family payroll" },
          { title: "Determine market-rate replacement", description: "Research GM/CEO compensation for the industry, geography, and company size — use salary surveys, job postings, and industry data" },
          { title: "Calculate the add-back", description: "Add-back = Total owner compensation − Market-rate replacement cost (including standard benefits)" },
          { title: "Apply across all periods", description: "Calculate for each analysis period to show consistency and trend" },
          { title: "Document supporting evidence", description: "Attach salary survey data, comparable job postings, and itemized personal expense detail" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "common-mistakes", children: "Common Mistakes" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Ignoring benefits", description: "Only adjusting salary but forgetting health insurance, retirement, and other benefits the replacement will need" },
          { title: "Unrealistic market rate", description: "Using too low a replacement salary — the business needs a competent manager, not an entry-level hire" },
          { title: "Missing personal expenses", description: "Only adjusting salary but not scanning the GL for personal expenses running through various accounts" },
          { title: "Forgetting multiple owners", description: "Some businesses have two or more owners — each must be normalized separately" },
          { title: "Ignoring the replacement gap", description: "If the owner works 70 hours/week, the replacement may need an assistant or additional staff" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "documentation", children: "Documentation Standards" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Salary survey data", description: "Third-party compensation benchmarks for the role, industry, geography, and revenue size" },
          { title: "Itemized personal expenses", description: "GL-level detail of each personal expense with account, amount, and description" },
          { title: "Tax return cross-reference", description: "Verify W-2 and K-1 amounts match the GL compensation figures" },
          { title: "Family payroll analysis", description: "Document each family member's role, hours, and market-rate equivalent" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What if the owner is underpaid?", answer: "If the owner takes below-market compensation (common in growth-stage businesses), the normalization is a subtraction — adjusted EBITDA decreases to reflect the true cost of management." },
          { question: "How do I find market-rate compensation?", answer: "Use salary surveys (BLS, PayScale, Glassdoor, Robert Half), comparable job postings, and industry-specific compensation studies. Document your sources." },
          { question: "Do distributions count as compensation?", answer: "S-Corp distributions above a reasonable salary are typically excluded from the add-back calculation. However, if distributions are being used in lieu of salary, they should be included in total owner compensation." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/personal-expense-detection", label: "Personal Expense Detection" },
          { to: "/guides/general-ledger-review", label: "General Ledger Review" },
          { to: "/features/ebitda-automation", label: "EBITDA Add-Back Automation" }
        ] })
      ]
    }
  );
}
export {
  OwnerCompensationNormalization as default
};
