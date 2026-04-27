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
  { id: "overview", label: "Why It Matters" },
  { id: "common-categories", label: "Common Categories" },
  { id: "detection-methods", label: "Detection Methods" },
  { id: "keyword-search", label: "GL Keyword Search" },
  { id: "process", label: "Step-by-Step Process" },
  { id: "documentation", label: "Documenting Add-Backs" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Detect Personal Expenses in a Business",
  description: "Methods for identifying personal expenses running through a business during M&A due diligence — GL keyword searches, pattern analysis, account-level review, and AI-powered detection.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/personal-expense-detection"
};
function PersonalExpenseDetection() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "How to Detect Personal Expenses in a Business",
      seoTitle: "Personal Expense Detection — Find Owner Add-Backs in M&A | Shepi",
      seoDescription: "Learn how to detect personal expenses running through a business. GL keyword searches, pattern analysis, and AI-powered detection methods for EBITDA add-backs in M&A due diligence.",
      canonical: "https://shepi.ai/guides/personal-expense-detection",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Personal Expense Detection" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "In owner-operated businesses, personal expenses hiding in the GL are among the largest — and most commonly missed — EBITDA add-backs. Finding them requires systematic detection, not just intuition." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "$50K–$200K", label: "Typical personal expense add-backs (SMB)" },
          { value: "15–30", label: "GL accounts where personal expenses hide" },
          { value: "5–10×", label: "More findings with AI vs manual review" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "overview", children: "Why Personal Expense Detection Matters" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Owner-operated businesses routinely run personal expenses through the company. This is legal (with proper tax treatment) but distorts the business's true ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "adjusted EBITDA" }),
          ". Every personal expense identified becomes an add-back that ",
          /* @__PURE__ */ jsx("strong", { children: "increases the value of the business" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "For sellers, proactively identifying these items supports a higher asking price. For buyers, catching them all protects against overpayment." }),
        /* @__PURE__ */ jsx("h2", { id: "common-categories", children: "Common Personal Expense Categories" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Vehicles", description: "Personal car leases, fuel, insurance, maintenance, registration — often the largest single category" },
          { title: "Travel & entertainment", description: "Family vacations, personal dining, sporting events, concerts, non-business travel" },
          { title: "Insurance", description: "Personal life insurance, umbrella policies, health insurance for non-employees" },
          { title: "Memberships", description: "Country clubs, gym memberships, personal subscriptions, professional associations" },
          { title: "Home office & utilities", description: "Home internet, phone, utilities, repairs, and furnishings charged to the business" },
          { title: "Personal services", description: "Estate planning, personal legal, financial advising, tax preparation" },
          { title: "Family payroll", description: "Spouse, children, or relatives receiving compensation for minimal or no work" },
          { title: "Retail & online", description: "Amazon, Target, personal shopping coded as office supplies or business expenses" },
          { title: "Cash & ATM", description: "Cash withdrawals and ATM transactions with no documented business purpose" },
          { title: "Charitable contributions", description: "Personal donations made through the business" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "detection-methods", children: "Detection Methods" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "GL keyword search", description: "Search transaction descriptions for personal expense indicators (see keyword list below)" },
          { title: "Vendor analysis", description: "Review all vendors for personal service providers — country clubs, gyms, personal attorneys" },
          { title: "Account-level review", description: "Focus on accounts where personal expenses commonly hide: T&E, auto, insurance, miscellaneous" },
          { title: "Credit card analysis", description: "Review corporate credit card statements for personal purchases" },
          { title: "Pattern analysis", description: "Regular recurring charges that don't match business operations" },
          { title: "AI-powered scanning", description: "AI reviews 100% of transactions and flags personal expense patterns across all accounts simultaneously" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "keyword-search", children: "GL Keyword Search Targets" }),
        /* @__PURE__ */ jsx("p", { children: "Search transaction descriptions and vendor names for these common indicators:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Vehicle keywords", description: "BMW, Mercedes, Tesla, AutoNation, CarMax, fuel, gas station, car wash, Jiffy Lube" },
          { title: "Travel keywords", description: "Airline, hotel, resort, vacation, cruise, Expedia, Airbnb, VRBO, Uber, Lyft" },
          { title: "Entertainment", description: "Restaurant (personal), Ticketmaster, StubHub, ESPN, Netflix, Spotify, golf, marina" },
          { title: "Retail", description: "Amazon (non-business), Target, Walmart, Costco, Home Depot, clothing stores" },
          { title: "Insurance", description: "Life insurance, umbrella, personal policy, disability (owner-only)" },
          { title: "Cash", description: "ATM, cash withdrawal, cashier's check, money order" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "process", children: "Step-by-Step Detection Process" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Export the complete GL", description: "Get all transactions with descriptions, vendors, amounts, and account codes" },
          { title: "Run keyword searches", description: "Search for personal expense indicator keywords across all transaction descriptions" },
          { title: "Review flagged accounts", description: "Focus on T&E, auto, insurance, miscellaneous, and office supplies accounts" },
          { title: "Analyze credit card statements", description: "Request and review corporate card statements for personal purchases" },
          { title: "Interview management", description: "Ask about personal use of business resources — owners often volunteer information" },
          { title: "Quantify and categorize", description: "Total each category of personal expense by period for the adjustment schedule" },
          { title: "Cross-reference tax returns", description: "Compare to personal and business tax returns for consistency" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "documentation", children: "Documenting Personal Expense Add-Backs" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Transaction-level detail", description: "Each personal expense linked to specific GL transactions with dates, amounts, and descriptions" },
          { title: "Category subtotals", description: "Personal expenses grouped by type (vehicles, T&E, insurance, etc.) for clean presentation" },
          { title: "Period-over-period consistency", description: "Show the same analysis across all periods to demonstrate recurring nature" },
          { title: "Owner acknowledgment", description: "When possible, obtain seller confirmation that identified items are personal" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Are personal expenses always add-backs?", answer: "Yes, if the expense is genuinely personal and won't continue post-acquisition, it's an add-back. The key is documentation — you need to demonstrate the expense is personal, not business-related." },
          { question: "What if the owner disputes an item?", answer: "Some items are judgment calls. If the owner claims a Country Club membership is for business development, evaluate whether the replacement manager would maintain it. If not, it's still an add-back." },
          { question: "How much do personal expenses typically add back?", answer: "In SMB acquisitions ($1M–$10M revenue), personal expense add-backs typically range from $50K–$200K annually. Combined with owner compensation normalization, total owner-related add-backs often reach $150K–$400K." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
          { to: "/guides/general-ledger-review", label: "General Ledger Review" },
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/features/ebitda-automation", label: "EBITDA Add-Back Automation" }
        ] })
      ]
    }
  );
}
export {
  PersonalExpenseDetection as default
};
