import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { P as PRICING, B as Button } from "../main.mjs";
import { C as ContentPageLayout } from "./ContentPageLayout-DCN4h0e5.js";
import { H as HeroCallout, B as BenefitGrid } from "./BenefitGrid-CqgEPSsd.js";
import { S as StatRow } from "./StatRow-D3wI_H-V.js";
import { C as ComparisonTable } from "./ComparisonTable-CaWKj8lQ.js";
import { S as StepList } from "./StepList-CaZJInNM.js";
import { R as RelatedResourceCards } from "./RelatedResourceCards-cyLzBc8L.js";
import { CheckCircle, XCircle } from "lucide-react";
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
  { id: "engagement-overview", label: "Engagement Overview" },
  { id: "inputs-required", label: "Inputs Required" },
  { id: "procedures", label: "Procedures Performed" },
  { id: "deliverables", label: "Deliverables" },
  { id: "out-of-scope", label: "Out of Scope" },
  { id: "diy-vs-dfy", label: "DIY vs Done-For-You" },
  { id: "timeline", label: "Timeline & Cost" },
  { id: "pricing", label: "Pricing" },
  { id: "related", label: "Related" }
];
const required = ["Trial Balance", "Chart of Accounts", "Bank Statements", "General Ledger"];
const recommended = [
  "AR & AP Aging",
  "Payroll Reports",
  "Fixed Asset Schedule",
  "Tax Returns (3 years)",
  "Journal Entries",
  "Credit Card Statements",
  "Customer & Vendor Lists",
  "Inventory Records",
  "Debt Schedule",
  "Material Contracts & Leases",
  "Supporting Documents",
  "Job Cost Reports / WIP Schedule"
];
const optional = ["Income Statements", "Balance Sheets", "Cash Flow Statements", "CIM / Offering Memo"];
function ScopeOfWork() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Statement of Work",
      seoTitle: "Statement of Work | Shepi Quality of Earnings Engagement",
      seoDescription: "Formal scope of a Shepi QoE engagement: inputs required, procedures performed, deliverables, out-of-scope items, and DIY vs Done-For-You options.",
      canonical: "https://shepi.ai/scope",
      breadcrumbs: [{ label: "Statement of Work" }],
      toc,
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "What Shepi is engaged to deliver, in the format you'd see from a traditional QoE firm — inputs, procedures, deliverables, and what we explicitly do not cover." }),
        /* @__PURE__ */ jsx("h2", { id: "engagement-overview", children: "Engagement Overview" }),
        /* @__PURE__ */ jsx("p", { children: "Shepi is engaged to perform a data-intensive Quality of Earnings analysis on the target company's financial records. The engagement covers 100% of general-ledger transactions across the historical period, builds an adjusted-EBITDA bridge, and produces a structured 27-tab workbook plus PDF report consistent with the format buyers, lenders, and sellers expect from a QoE deliverable." }),
        /* @__PURE__ */ jsxs("p", { children: [
          "This engagement is ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          " a CPA attestation, audit, or review. It is the analytical foundation that traditional QoE firms produce — minus the attestation letter. See ",
          /* @__PURE__ */ jsx("a", { href: "#out-of-scope", children: "Out of Scope" }),
          " for the full boundary statement."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "inputs-required", children: "Inputs Required" }),
        /* @__PURE__ */ jsx("p", { children: "Most of these come from the seller's data room. Begin with the Required tier; add the rest as received." }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose grid md:grid-cols-3 gap-6 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg bg-card p-5", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-destructive mb-3", children: "Required" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: required.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg bg-card p-5", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3", children: "Recommended" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: recommended.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg bg-card p-5", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: "Optional" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: optional.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "procedures", children: "Procedures Performed" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "100% GL coverage and account mapping", description: "Every transaction in the general ledger is ingested and mapped to a standardized chart of accounts — not the 10–20% sample a manual team typically reviews." },
          { title: "Anomaly and red-flag detection", description: "AI scans the GL for unusual patterns: round-number entries, weekend postings, duplicate vendors, and other markers consistent with earnings-management or personal-expense activity." },
          { title: "Owner-compensation normalization", description: "Identify owner salary, benefits, and related-party payments; calculate market-rate replacement compensation for the EBITDA bridge." },
          { title: "Personal-expense detection", description: "Surface candidate personal expenses (auto, travel, meals, country club, family payroll) for analyst review and adjustment." },
          { title: "Customer and vendor concentration", description: "Quantify revenue and spend concentration; flag single-customer or single-vendor exposure above standard thresholds." },
          { title: "Working-capital build", description: "Multi-period DSO / DPO / DIO schedule and net working capital target consistent with how buyers structure purchase-price adjustments." },
          { title: "Proof of cash from bank statements", description: "Reconcile reported revenue and operating cash flow to actual bank deposits across the review period." },
          { title: "AI-suggested EBITDA adjustments — every adjustment human-reviewed", description: "AI surfaces candidates with rationale and supporting transactions; you accept, modify, or reject. No adjustment lands in the bridge without human sign-off." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "deliverables", children: "Deliverables" }),
        /* @__PURE__ */ jsx("p", { children: "The engagement produces four named artifacts, in the format a real engagement letter would use:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "QoE Workbook", description: "Excel · 27 tabs covering Executive Summary, EBITDA Bridge, Revenue Quality, Working Capital, Proof of Cash, GL Findings, and Customer / Vendor Concentration." },
          { title: "Executive Summary", description: "PDF · adjusted EBITDA, key findings, and risk callouts — lender- and LP-ready." },
          { title: "Source-Cited Audit Trail", description: "Every adjustment traceable to the underlying transaction and rationale." },
          { title: "Bank Reconciliation Pack", description: "Proof of cash reconciling reported revenue and EBITDA to processed bank statements." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "out-of-scope", children: "Out of Scope" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "What this engagement does ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          " cover:"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8", children: [
          { title: "No CPA attestation or opinion", description: "Shepi does not issue an audit, review, or attest opinion. There is no signed letter from a licensed CPA firm." },
          { title: "No valuation", description: "We do not opine on enterprise value, multiples, or what the business is worth." },
          { title: "No legal or tax advice", description: "Tax exposure, structuring, and legal risk are outside scope. Engage qualified counsel and tax advisors separately." },
          { title: "No fairness opinion or formal audit", description: "This is not a substitute for a fairness opinion, GAAP audit, or any regulatory filing." }
        ].map((b) => /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg p-5 bg-muted/20", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground mb-1.5 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-muted-foreground mt-1 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: b.title })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: b.description })
        ] }, b.title)) }),
        /* @__PURE__ */ jsx("h2", { id: "diy-vs-dfy", children: "DIY vs Done-For-You" }),
        /* @__PURE__ */ jsx("p", { children: "The same scope is available two ways: you run the analysis yourself, or our team runs it for you." }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["", "Self-Service", "Done-For-You"],
            rows: [
              ["Who runs the analysis", "You, in the Shepi platform", "Shepi team, with you in review"],
              ["CPA review", "Optional add-on", "CPA-led review"],
              ["Turnaround", "2–4 hours hands-on", "Days, not weeks"],
              ["Onboarding", "Self-serve", "Guided kickoff & data-room walkthrough"],
              ["Ideal for", "Searchers and operators with finance fluency", "Buyers who want the deliverable produced for them"],
              ["Pricing", `${PRICING.perProject.display} per project`, `${PRICING.doneForYou.display} per project`]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "timeline", children: "Timeline & Cost" }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "2–4 hrs", label: "Self-Service hands-on time" },
          { value: "Days", label: "Done-For-You turnaround" },
          { value: "$20K–$100K", label: "Traditional CPA QoE cost it replaces" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "pricing", children: "Pricing" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Self-Service is ",
          /* @__PURE__ */ jsx("strong", { children: PRICING.perProject.display }),
          " per project. Done-For-You is ",
          /* @__PURE__ */ jsx("strong", { children: PRICING.doneForYou.display }),
          " per project. Monthly subscription available at ",
          PRICING.monthly.display,
          "/month including ",
          PRICING.monthly.includedProjects,
          " projects."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "not-prose mb-8", children: /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { size: "lg", children: "See full pricing" }) }) }),
        /* @__PURE__ */ jsx("h2", { id: "related", children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/quality-of-earnings-cost", label: "How much does a QoE cost?" },
          { to: "/compare/shepi-vs-excel", label: "Shepi vs Excel templates" },
          { to: "/quality-of-earnings-checklist", label: "QoE diligence checklist" },
          { to: "/quality-of-earnings-software", label: "QoE software platform" }
        ] })
      ]
    }
  );
}
export {
  ScopeOfWork as default
};
