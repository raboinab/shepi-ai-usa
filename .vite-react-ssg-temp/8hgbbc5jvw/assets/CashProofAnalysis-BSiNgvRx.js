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
  { id: "what-is-proof-of-cash", label: "What Is Proof of Cash?" },
  { id: "why-it-matters", label: "Why It Matters" },
  { id: "methodology", label: "Methodology" },
  { id: "bank-reconciliation", label: "Bank Reconciliation Review" },
  { id: "common-discrepancies", label: "Common Discrepancies" },
  { id: "commingled-expenses", label: "Commingled Expenses" },
  { id: "process", label: "Step-by-Step Process" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cash & Bank Tie-Out — Proof of Cash Analysis for M&A",
  description: "Complete guide to proof of cash analysis in M&A due diligence: GL-to-bank reconciliation, bank statement review, detecting unrecorded liabilities, commingled expenses, and suspicious transactions.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/cash-proof-analysis"
};
function CashProofAnalysis() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Cash & Bank Tie-Out — Proof of Cash Analysis for M&A",
      seoTitle: "Proof of Cash Analysis — GL-to-Bank Reconciliation for M&A | Shepi",
      seoDescription: "Master proof of cash analysis for acquisitions: GL-to-bank reconciliation, detecting unrecorded transactions, commingled personal expenses, and validating cash flow completeness.",
      canonical: "https://shepi.ai/guides/cash-proof-analysis",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Cash & Bank Tie-Out" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Cash doesn't lie — but the books might. Proof of cash is the ultimate validation test: if the GL and the bank don't agree, something is missing." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "100%", label: "Of transactions should tie to bank activity" },
          { value: "12–24 mo", label: "Typical proof of cash analysis period" },
          { value: "High", label: "Manipulation detection effectiveness" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-is-proof-of-cash", children: "What Is Proof of Cash?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Proof of cash (also called a ",
          /* @__PURE__ */ jsx("strong", { children: "cash proof" }),
          " or ",
          /* @__PURE__ */ jsx("strong", { children: "bank tie-out" }),
          ") is an analytical procedure that reconciles the general ledger's recorded cash activity to actual bank statements. It validates that all transactions flowing through the bank are recorded in the books — and vice versa."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "In ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE analysis" }),
          ", proof of cash serves as a ",
          /* @__PURE__ */ jsx("strong", { children: "completeness test" }),
          ". It catches unrecorded revenue, unrecorded expenses, off-books transactions, and intercompany transfers that might otherwise go undetected."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-it-matters", children: "Why Proof of Cash Matters" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Completeness validation", description: "Confirms all bank transactions are recorded in the GL — no off-books activity" },
          { title: "Revenue verification", description: "Bank deposits should match recorded revenue — discrepancies signal recognition issues" },
          { title: "Expense verification", description: "Bank disbursements should match recorded expenses — gaps may indicate unrecorded liabilities" },
          { title: "Fraud detection", description: "One of the most effective procedures for detecting financial manipulation" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "methodology", children: "Proof of Cash Methodology" }),
        /* @__PURE__ */ jsx("p", { children: "The proof of cash compares four elements between the GL and bank statements:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Beginning balance", description: "GL cash balance at period start = bank statement opening balance (adjusted for outstanding items)" },
          { title: "Receipts", description: "Total deposits per GL = total deposits per bank statement" },
          { title: "Disbursements", description: "Total payments per GL = total payments per bank statement" },
          { title: "Ending balance", description: "GL cash balance at period end = bank statement closing balance (adjusted for outstanding items)" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "bank-reconciliation", children: "Bank Reconciliation Review" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Outstanding checks", description: "Checks written but not yet cleared — verify they're legitimate and not stale-dated" },
          { title: "Deposits in transit", description: "Revenue collected but not yet deposited — confirm timely clearing" },
          { title: "Bank errors", description: "Rare but possible — verify bank-side corrections are properly reflected" },
          { title: "Reconciling items", description: "Items that explain differences between book and bank balances — should be reasonable and documented" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "common-discrepancies", children: "Common Discrepancies" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Unrecorded deposits", description: "Cash received but not posted to the GL — potential unrecorded revenue" },
          { title: "Unrecorded disbursements", description: "Payments made but not recorded — potential unrecorded expenses or liabilities" },
          { title: "Timing differences", description: "Transactions recorded in different periods between GL and bank — usually benign but verify" },
          { title: "Intercompany transfers", description: "Cash moving between related entities — ensure properly recorded on both sides" },
          { title: "Credit card activity", description: "Credit card expenses may bypass the bank account — ensure they're captured in the GL" },
          { title: "Cash transactions", description: "ATM withdrawals, cash payments received — hardest to verify and highest manipulation risk" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "commingled-expenses", children: "Commingled Expense Detection" }),
        /* @__PURE__ */ jsx("p", { children: "In owner-operated businesses, personal and business expenses are often commingled. The proof of cash helps identify:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Personal purchases on business accounts", description: "Retail, dining, travel, and entertainment that aren't business-related" },
          { title: "Personal bill payments", description: "Mortgage, car payments, personal insurance paid from business accounts" },
          { title: "Cash withdrawals", description: "ATM withdrawals and cash-back transactions with no documented business purpose" },
          { title: "Transfers to personal accounts", description: "Funds moved to owner's personal bank accounts beyond documented distributions" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "These items are typically ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA add-backs" }),
          " in the QoE analysis."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "process", children: "Step-by-Step Process" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Obtain bank statements", description: "Request complete bank statements for all accounts for the analysis period (12-24 months)" },
          { title: "Export GL cash activity", description: "Pull all transactions from GL cash accounts for the same period" },
          { title: "Reconcile opening balances", description: "Confirm GL and bank opening balances match (with reconciling items)" },
          { title: "Match deposits to revenue", description: "Tie bank deposits to GL revenue entries — investigate unmatched items" },
          { title: "Match disbursements to expenses", description: "Tie bank payments to GL expense entries — investigate unmatched items" },
          { title: "Reconcile closing balances", description: "Confirm GL and bank closing balances match (with reconciling items)" },
          { title: "Document discrepancies", description: "Create a schedule of all unresolved differences with proposed adjustments" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What is proof of cash in due diligence?", answer: "Proof of cash is a reconciliation procedure that ties the general ledger's cash activity to actual bank statements, validating that all transactions are recorded and the books are complete." },
          { question: "Why is proof of cash important for acquisitions?", answer: "It's one of the most effective tests for detecting unrecorded transactions, off-books activity, and financial manipulation. If the books and the bank don't agree, something is missing from the financial statements." },
          { question: "How far back should proof of cash cover?", answer: "Typically 12-24 months, matching the QoE analysis period. For businesses with seasonal patterns or known issues, a longer lookback may be warranted." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/general-ledger-review", label: "General Ledger Review" },
          { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/working-capital-analysis", label: "Working Capital Analysis" }
        ] })
      ]
    }
  );
}
export {
  CashProofAnalysis as default
};
