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
  { id: "typical-cost", label: "Typical QoE Cost" },
  { id: "cost-factors", label: "What Drives Cost" },
  { id: "why-expensive", label: "Why It Costs So Much" },
  { id: "ai-alternative", label: "AI-Powered Alternative" },
  { id: "comparison", label: "Cost Comparison" },
  { id: "who-pays", label: "Who Pays for QoE" },
  { id: "faq", label: "FAQ" }
];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does a Quality of Earnings report cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional CPA-led QoE reports typically cost $20,000 to $100,000 depending on deal size, complexity, and timeline. Lower middle market deals usually fall in the $25K–$50K range. AI-powered platforms like Shepi deliver comparable analysis starting at $2,000 per project."
      }
    },
    {
      "@type": "Question",
      name: "Who pays for the Quality of Earnings report?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On buy-side deals, the buyer typically commissions and pays for the QoE report. On sell-side, the seller pays for a sell-side QoE to validate financials before going to market. Lenders may also require a QoE for acquisition financing."
      }
    },
    {
      "@type": "Question",
      name: "How long does a QoE report take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional CPA QoE engagements take 4–8 weeks. AI-powered QoE platforms can produce a first-pass analysis in hours and a finalized report in days."
      }
    },
    {
      "@type": "Question",
      name: "Why is a Quality of Earnings report so expensive?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional QoE costs reflect 4–8 weeks of senior-analyst time spent on manual data gathering, account mapping, GL sampling, EBITDA adjustments, and report writing — work that AI now automates."
      }
    }
  ]
};
function QualityOfEarningsCost() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "How Much Does a Quality of Earnings Report Cost?",
      seoTitle: "Quality of Earnings Cost in 2026 — Cut QoE Cost by 80% | Shepi",
      seoDescription: "Quality of Earnings reports cost $20K–$100K from CPA firms. See the full cost breakdown, what drives pricing, and how AI-powered QoE cuts cost by 80%.",
      canonical: "https://shepi.ai/quality-of-earnings-cost",
      breadcrumbs: [{ label: "Quality of Earnings Cost" }],
      toc,
      jsonLd: faqSchema,
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsxs(HeroCallout, { children: [
          "Traditional CPA Quality of Earnings reports cost $20,000–$100,000 and take 4–8 weeks. Shepi delivers the same lender-ready analysis starting at ",
          PRICING.perProject.display,
          " — in hours, not weeks."
        ] }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "$25K–$50K", label: "Typical lower middle market QoE" },
          { value: "4–8 wks", label: "Traditional engagement timeline" },
          { value: PRICING.perProject.display, label: "Shepi per-project pricing" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "typical-cost", children: "Typical Quality of Earnings Report Cost" }),
        /* @__PURE__ */ jsx("p", { children: "Quality of Earnings reports are the most-Googled cost question in M&A diligence — and for good reason. The traditional pricing model puts QoE out of reach for most lower middle market and search-fund deals. Here's what buyers actually pay in 2026:" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Deal Size / Provider", "Typical QoE Cost", "Timeline"],
            rows: [
              ["Under $5M EV — Regional CPA / boutique", "$15,000 – $30,000", "3–5 weeks"],
              ["$5M – $25M EV — Mid-market CPA firm", "$25,000 – $50,000", "4–6 weeks"],
              ["$25M – $100M EV — National CPA", "$50,000 – $100,000", "6–8 weeks"],
              ["Over $100M EV — Big 4 transaction services", "$100,000 – $300,000+", "6–10 weeks"],
              ["Any size — Shepi (AI-powered)", `${PRICING.perProject.display} per project`, "Hours to days"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "cost-factors", children: "What Drives Quality of Earnings Cost" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Deal size & complexity", description: "Larger revenue, more entities, and multi-location operations all increase analyst hours" },
          { title: "Data quality", description: "Messy QuickBooks files, missing reconciliations, and cash-basis books drive cost up" },
          { title: "Number of periods", description: "Most QoE engagements analyze 3 trailing years plus TTM — more periods means more work" },
          { title: "Industry complexity", description: "Construction WIP, SaaS deferred revenue, and inventory-heavy businesses require specialized work" },
          { title: "Timeline pressure", description: "Rush engagements (under 4 weeks) typically carry a 25–50% premium" },
          { title: "Scope of analysis", description: "Full QoE with proof of cash, working capital, and customer concentration costs more than EBITDA-only" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-expensive", children: "Why Traditional QoE Costs So Much" }),
        /* @__PURE__ */ jsx("p", { children: "A traditional CPA-led QoE engagement is fundamentally a labor model. Senior analysts manually pull trial balances, map charts of accounts, sample 10–20% of GL transactions, build EBITDA bridges in Excel, and write narrative reports. With blended rates of $250–$500/hour and 100–300 hours per engagement, the math gets to $25K–$100K quickly." }),
        /* @__PURE__ */ jsx("p", { children: "On top of analyst time, firms layer partner review, quality control, report production, and Big-4 brand premiums. None of this scales — every QoE starts from a blank workbook." }),
        /* @__PURE__ */ jsx("h2", { id: "ai-alternative", children: "The AI-Powered Alternative" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Shepi automates 80% of the work that drives traditional QoE cost. Account mapping, GL anomaly detection across ",
          /* @__PURE__ */ jsx("strong", { children: "100% of transactions" }),
          ", EBITDA adjustment candidates, working capital schedules, and proof of cash are all generated automatically. You apply judgment on the findings — but you're not paying analysts to build templates from scratch."
        ] }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "100% GL coverage", description: "AI scans every transaction — not the 10–20% sample a manual team has time for" },
          { title: "Hours, not weeks", description: "First-pass analysis in 2–4 hours; finalized deliverables in days" },
          { title: `${PRICING.perProject.display} per project`, description: "Flat pricing — no hourly billing, no surprise invoices, no rush premiums" },
          { title: "Lender-ready output", description: "Structured QoE reports, EBITDA bridges, and Excel exports formatted for lenders and deal parties" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison", children: "Cost Comparison: Traditional vs AI-Powered" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Dimension", "Traditional CPA QoE", "Shepi AI-Powered QoE"],
            rows: [
              ["Base price", "$20,000 – $100,000+", `${PRICING.perProject.display}`],
              ["Pricing model", "Hourly billing", "Flat per-project"],
              ["Timeline", "4–8 weeks", "Hours to days"],
              ["GL transaction coverage", "10–20% sample", "100% of transactions"],
              ["Rush premium", "25–50% surcharge", "None"],
              ["Revisions", "Billed hourly", "Included"],
              ["Lender acceptance", "Yes", "Yes — same structure & narrative"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "who-pays", children: "Who Pays for the QoE Report?" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "On ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/sell-side-vs-buy-side-qoe", children: "buy-side transactions" }),
          ", the buyer commissions the QoE as part of confirmatory diligence. On sell-side, sellers commission a sell-side QoE before going to market to validate the EBITDA story and accelerate buyer diligence. Lenders financing acquisitions frequently require a QoE for underwriting — and accept Shepi reports the same as traditional CPA work."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "How much does a Quality of Earnings report cost?", answer: "Traditional CPA QoE costs $20K–$100K depending on deal size and complexity. AI-powered platforms like Shepi start at $2,000 per project." },
          { question: "Why is a QoE so expensive?", answer: "Traditional QoE is a labor model — 100–300 hours of senior analyst time at $250–$500/hour, plus partner review and brand premium." },
          { question: "Who pays for the QoE?", answer: "Buy-side: the buyer. Sell-side: the seller. Lenders may require one for acquisition financing but the deal party usually pays." },
          { question: "How long does a QoE take?", answer: "Traditional: 4–8 weeks. AI-powered: hours for first pass, days for finalized deliverables." },
          { question: "Can a cheaper QoE still be lender-ready?", answer: "Yes. Shepi reports follow the same structure lenders expect — adjusted EBITDA bridge, working capital schedule, proof of cash, and customer concentration analysis." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/features/qoe-software", label: "QoE Software Platform" },
          { to: "/quality-of-earnings-template", label: "Free QoE Report Template" },
          { to: "/quality-of-earnings-checklist", label: "QoE Diligence Checklist" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" }
        ] })
      ]
    }
  );
}
export {
  QualityOfEarningsCost as default
};
