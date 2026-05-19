import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { P as PRICING, B as Button } from "../main.mjs";
import { C as ContentPageLayout } from "./ContentPageLayout-DCN4h0e5.js";
import { H as HeroCallout, B as BenefitGrid } from "./BenefitGrid-CqgEPSsd.js";
import { S as StatRow } from "./StatRow-D3wI_H-V.js";
import { A as AccordionFAQ } from "./AccordionFAQ-Cju-RuPF.js";
import { R as RelatedResourceCards } from "./RelatedResourceCards-cyLzBc8L.js";
import "vite-react-ssg";
import "react";
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
import "./useBreadcrumbJsonLd-DC-feT7v.js";
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
    { "@type": "Question", name: "What is on a Quality of Earnings checklist?", acceptedAnswer: { "@type": "Answer", text: "A complete QoE checklist covers eight sections: data request (TB, GL, bank statements, AR/AP aging), revenue quality, EBITDA adjustments, working capital schedule, proof of cash, GL anomaly review, risk flags, and final deliverables (report, Excel workbook, audit trail)." } },
    { "@type": "Question", name: "What documents are needed for Quality of Earnings?", acceptedAnswer: { "@type": "Answer", text: "Minimum data set: 3 years of trial balances plus TTM, full general ledger, bank statements for the same periods, AR and AP aging reports, payroll registers, and customer/vendor lists." } },
    { "@type": "Question", name: "How many transactions should a QoE review?", acceptedAnswer: { "@type": "Answer", text: "Traditional CPA QoE samples 10–20% of GL transactions. AI-powered QoE software like Shepi reviews 100% of transactions to surface anomalies and add-back candidates." } }
  ]
};
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings Checklist: 8-Section M&A Due Diligence Guide",
  description: "Free Quality of Earnings checklist covering data request, revenue, EBITDA, working capital, proof of cash, GL review, risk flags, and deliverables.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-05-15",
  mainEntityOfPage: "https://shepi.ai/quality-of-earnings-checklist"
};
function QualityOfEarningsChecklist() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Quality of Earnings Checklist for M&A Due Diligence",
      seoTitle: "Quality of Earnings Checklist: 8-Section M&A Due Diligence Guide (2026) | Shepi",
      seoDescription: "Free Quality of Earnings checklist covering data request, revenue, EBITDA, working capital, proof of cash & deliverables. Download the 8-section PDF.",
      canonical: "https://shepi.ai/quality-of-earnings-checklist",
      breadcrumbs: [{ label: "Quality of Earnings Checklist" }],
      toc,
      jsonLd: [faqSchema, articleSchema],
      modifiedDate: "May 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "The complete QoE checklist used by deal teams, PE firms, and lenders. Walk through every section of a professional Quality of Earnings analysis — or let Shepi run all 8 sections for you." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "8", label: "Diligence sections" },
          { value: "100%", label: "GL coverage required" },
          { value: PRICING.perProject.display, label: "Done-for-you alternative" }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "A ",
          /* @__PURE__ */ jsx("strong", { children: "Quality of Earnings (QoE) checklist" }),
          " is the working document deal teams use to verify a target company's reported earnings before closing an acquisition. A complete checklist walks through eight diligence sections: the data request, revenue quality, EBITDA adjustments, working capital, proof of cash, general ledger anomalies, risk flags, and final deliverables. Use the checklist below as a free standalone resource, or download the PDF for offline use."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground mb-1", children: "Download the 8-section QoE checklist (PDF)" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Print-ready, share with your deal team. No email required." })
          ] }),
          /* @__PURE__ */ jsx("a", { href: "/qoe-checklist.pdf", download: true, children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            " Download PDF"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "data-request", children: "1. Data Request Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "Before any analysis begins, the deal team must collect a complete data set covering at least three full years plus the trailing twelve months. Missing or incomplete data is the single largest cause of QoE delays — request everything below at kickoff to avoid costly back-and-forth later." }),
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
        /* @__PURE__ */ jsxs("p", { children: [
          "Revenue quality is about more than the top-line number — it tests whether reported revenue is recurring, properly recognized, and concentrated in a healthy mix of customers. Pay particular attention to ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/customer-concentration-risk", children: "customer concentration risk" }),
          ", which is the most common deal-killer surfaced in this section."
        ] }),
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
          "Adjusted EBITDA is the headline number every deal is priced on. Standard categories of ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-adjustments", children: "EBITDA adjustments" }),
          " include owner compensation, personal expenses, and one-time items. The largest single add-back on most lower-middle-market deals is ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/owner-compensation-normalization", children: "owner compensation normalization" }),
          " — review it line by line."
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
        /* @__PURE__ */ jsxs("p", { children: [
          "The working capital peg drives the dollar-for-dollar purchase-price adjustment at close — getting it wrong means leaving cash on the table or underfunding operations day one. The full methodology is in our ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/working-capital-analysis", children: "working capital analysis guide" }),
          "; the section-level checklist is below."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Trailing 12-month NWC", description: "Build monthly NWC schedule covering at least the last 12 months" },
          { title: "Turnover ratios", description: "DSO, DPO, and DIO trends to identify deteriorating quality" },
          { title: "Seasonality adjustments", description: "Identify and normalize seasonal swings that distort the peg" },
          { title: "Peg calculation", description: "Compute the normalized NWC peg used in the purchase agreement" },
          { title: "Excluded items", description: "Cash, debt-like items, and deferred revenue treatment" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "proof-cash", children: "5. Proof of Cash Checklist" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Proof of cash is the section where commingled expenses, unrecorded liabilities, and cash-basis surprises surface. Tying every bank deposit and disbursement back to the GL is non-negotiable — see the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/cash-proof-analysis", children: "proof of cash analysis guide" }),
          " for the full reconciliation methodology."
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "☐ Reconcile total bank deposits to GL revenue + other receipts" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Reconcile total disbursements to GL expenses + other payments" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Identify unrecorded liabilities (checks not yet posted)" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Identify commingled personal expenses" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Verify intercompany / related-party transfer treatment" }),
          /* @__PURE__ */ jsx("li", { children: "☐ Confirm period-end cut-off accuracy" })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "gl-review", children: "6. General Ledger Review Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "Sampling 10–20% of GL transactions misses most red flags. A modern QoE reviews 100% of journal entries against a panel of anomaly tests — round dollars, period-end clustering, duplicates, manual entries to revenue, and unexplained account drift. Each test below should be run across the full GL, not a sample." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Round-dollar transactions", description: "Large round-number entries that often signal estimates or accruals" },
          { title: "Period-end clustering", description: "Spike in entries on the last day of a period — earnings management signal" },
          { title: "Duplicate detection", description: "Same vendor + amount + date patterns" },
          { title: "Unusual journal entries", description: "Manual entries to revenue, COGS, or accruals" },
          { title: "Threshold flags", description: "Transactions over materiality reviewed individually" },
          { title: "Account drift", description: "Accounts with sudden activity changes year-over-year" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "risks", children: "7. Risk Flags Checklist" }),
        /* @__PURE__ */ jsx("p", { children: "Risk flags are the qualitative findings that sit alongside the quantitative adjustments. Any single flag below can re-trade or kill a deal — surface them early so the buyer's reps & warranties insurance, escrow, and indemnity terms can be negotiated against real evidence." }),
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
        /* @__PURE__ */ jsxs("p", { children: [
          "The deliverable set is what the lender, buyer, and IC actually read. A defensible QoE ships a narrative PDF, supporting Excel workbook, and a transaction-level audit trail — all anchored to the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-bridge", children: "adjusted EBITDA bridge" }),
          " that walks reported earnings to the closing number."
        ] }),
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
