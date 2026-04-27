import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { S as StatRow } from "./StatRow-RO-PbEai.js";
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
  { id: "data-request", label: "1. Data Request" },
  { id: "revenue", label: "2. Revenue Quality" },
  { id: "ebitda", label: "3. EBITDA Adjustments" },
  { id: "working-capital", label: "4. Working Capital" },
  { id: "proof-cash", label: "5. Proof of Cash" },
  { id: "gl-review", label: "6. General Ledger Review" },
  { id: "risks", label: "7. Risk Flags" },
  { id: "deliverables", label: "8. Deliverables" },
  { id: "faq", label: "FAQ" }
];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is on a Quality of Earnings checklist?", acceptedAnswer: { "@type": "Answer", text: "A complete QoE checklist covers: data request (TB, GL, bank statements, AR/AP aging), revenue quality, EBITDA adjustments, working capital schedule, proof of cash, GL anomaly review, risk flags, and final deliverables (report, Excel workbook, audit trail)." } },
    { "@type": "Question", name: "What documents are needed for Quality of Earnings?", acceptedAnswer: { "@type": "Answer", text: "Minimum data set: 3 years of trial balances plus TTM, full general ledger, bank statements for the same periods, AR and AP aging reports, payroll registers, and customer/vendor lists." } },
    { "@type": "Question", name: "How many transactions should a QoE review?", acceptedAnswer: { "@type": "Answer", text: "Traditional CPA QoE samples 10–20% of GL transactions. AI-powered QoE software like Shepi reviews 100% of transactions to surface anomalies and add-back candidates." } }
  ]
};
function QualityOfEarningsChecklist() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Quality of Earnings Checklist for M&A Due Diligence",
      seoTitle: "Quality of Earnings Checklist — Free QoE Diligence Checklist | Shepi",
      seoDescription: "Complete Quality of Earnings checklist covering data request, revenue quality, EBITDA adjustments, working capital, proof of cash, and lender-ready deliverables.",
      canonical: "https://shepi.ai/quality-of-earnings-checklist",
      breadcrumbs: [{ label: "Quality of Earnings Checklist" }],
      toc,
      jsonLd: faqSchema,
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "The complete QoE checklist used by deal teams, PE firms, and lenders. Walk through every section of a professional Quality of Earnings analysis — or let Shepi run all 8 sections for you." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "8", label: "Diligence sections" },
          { value: "100%", label: "GL coverage required" },
          { value: PRICING.perProject.display, label: "Done-for-you alternative" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "data-request", children: "1. Data Request Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "The minimum data set required to run a complete Quality of Earnings analysis:" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ Trial balances — 3 years plus TTM (monthly preferred)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ General ledger — full detail for the same periods" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Bank statements — all operating accounts for proof of cash" }),
          /* @__PURE__ */ jsx("li", { children: "☐ AR aging — current and 12-month historical snapshots" }),
          /* @__PURE__ */ jsx("li", { children: "☐ AP aging — current and 12-month historical snapshots" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Payroll register — for owner comp normalization" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Customer revenue detail — for concentration analysis" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Vendor spend detail — for related-party identification" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Tax returns — 3 years for book-to-tax reconciliation" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Loan agreements & lease schedules" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Capex history — to normalize maintenance vs growth" })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "revenue", children: "2. Revenue Quality Checklist" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Recognition policy review", description: "Confirm revenue is recognized when earned, not when billed or collected" },
          { title: "Recurring vs non-recurring", description: "Classify each revenue stream — one-time projects distort run-rate" },
          { title: "Customer concentration", description: "Top 10 customer % of revenue and trend over 3 years" },
          { title: "Pricing & volume trends", description: "Decompose revenue growth into price vs volume drivers" },
          { title: "AR aging quality", description: "Aging bucket trends and collectability of >90 day balances" },
          { title: "Channel & geography mix", description: "Identify shifts that affect future run-rate" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "ebitda", children: "3. EBITDA Adjustments Checklist" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Standard categories of ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA adjustments" }),
          " to identify:"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ Owner compensation normalization (above/below market)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Personal expenses run through the business" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Non-recurring revenue (one-time projects, COVID grants)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Non-recurring expenses (legal settlements, restructuring)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Related-party transactions at non-market terms" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Run-rate adjustments for new contracts and lost customers" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Accounting cleanup (out-of-period entries, accruals)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Stock-based compensation" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Rent normalization (owner-occupied real estate)" })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "working-capital", children: "4. Working Capital Checklist" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Trailing 12-month NWC", description: "Build monthly NWC schedule covering at least the last 12 months" },
          { title: "Turnover ratios", description: "DSO, DPO, and DIO trends to identify deteriorating quality" },
          { title: "Seasonality adjustments", description: "Identify and normalize seasonal swings that distort the peg" },
          { title: "Peg calculation", description: "Compute the normalized NWC peg used in the purchase agreement" },
          { title: "Excluded items", description: "Cash, debt-like items, and deferred revenue treatment" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "proof-cash", children: "5. Proof of Cash Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "The section where commingled expenses and missing liabilities surface:" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ Reconcile total bank deposits to GL revenue + other receipts" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Reconcile total disbursements to GL expenses + other payments" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Identify unrecorded liabilities (checks not yet posted)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Identify commingled personal expenses" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Verify intercompany / related-party transfer treatment" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Confirm period-end cut-off accuracy" })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "gl-review", children: "6. General Ledger Review Checklist" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Round-dollar transactions", description: "Large round-number entries that often signal estimates or accruals" },
          { title: "Period-end clustering", description: "Spike in entries on the last day of a period — earnings management signal" },
          { title: "Duplicate detection", description: "Same vendor + amount + date patterns" },
          { title: "Unusual journal entries", description: "Manual entries to revenue, COGS, or accruals" },
          { title: "Threshold flags", description: "Transactions over materiality reviewed individually" },
          { title: "Account drift", description: "Accounts with sudden activity changes year-over-year" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "risks", children: "7. Risk Flags Checklist" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ Customer concentration over 20% of revenue" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Vendor concentration creating supply risk" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Key person / employee dependency" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Recent loss of major customer or contract" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Outstanding litigation or regulatory issues" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Tax exposure (sales tax nexus, payroll tax)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Going-concern indicators" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Quality of accounting controls" })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "deliverables", children: "8. Final Deliverables Checklist" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ QoE report (PDF, lender-ready)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Adjusted EBITDA bridge (Excel)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Working capital schedule (Excel)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Proof of cash reconciliation (Excel)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Customer concentration analysis" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Flagged transactions with audit trail" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Full Excel workbook for buyer/lender review" })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Running through this checklist manually takes 4–8 weeks and $20K+. Shepi runs every section automatically from your QuickBooks file — starting at ",
          PRICING.perProject.display,
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "What is on a Quality of Earnings checklist?", answer: "Data request, revenue quality, EBITDA adjustments, working capital, proof of cash, GL anomaly review, risk flags, and final deliverables." },
          { question: "What documents are needed for QoE?", answer: "3 years of trial balances plus TTM, full GL, bank statements, AR/AP aging, payroll register, customer/vendor detail, and tax returns." },
          { question: "How many transactions should a QoE review?", answer: "Traditional CPA QoE samples 10–20%. AI-powered QoE reviews 100% of transactions." },
          { question: "How long does the checklist take to complete manually?", answer: "4–8 weeks of senior analyst time for a typical lower middle market deal." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/due-diligence-checklist", label: "Full Due Diligence Checklist" },
          { to: "/quality-of-earnings-template", label: "QoE Report Template" },
          { to: "/quality-of-earnings-cost", label: "QoE Cost Guide" },
          { to: "/quality-of-earnings-software", label: "QoE Software" }
        ] })
      ]
    }
  );
}
export {
  QualityOfEarningsChecklist as default
};
