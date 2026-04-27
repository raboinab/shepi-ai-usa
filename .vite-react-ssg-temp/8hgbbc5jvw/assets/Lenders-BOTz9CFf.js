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
  { id: "why-lenders", label: "Why Lenders Require QoE" },
  { id: "sba-lending", label: "SBA Lending & QoE" },
  { id: "underwriting", label: "Strengthening Underwriting" },
  { id: "workflow", label: "Lender Workflow" },
  { id: "risk-mitigation", label: "Risk Mitigation" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QoE for Lenders & SBA Lending",
  description: "How lenders and SBA loan officers use Quality of Earnings analysis to strengthen underwriting, mitigate acquisition loan risk, and accelerate deal timelines.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-22",
  dateModified: "2026-02-22",
  mainEntityOfPage: "https://shepi.ai/use-cases/lenders"
};
function Lenders() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "QoE for Lenders & SBA Lending",
      seoTitle: "QoE for Lenders & SBA Lending — Stronger Underwriting | Shepi",
      seoDescription: "How lenders and SBA loan officers use Quality of Earnings analysis to strengthen underwriting, mitigate acquisition loan risk, and accelerate deal closings.",
      canonical: "https://shepi.ai/use-cases/lenders",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Lenders" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "$5K QoE vs. $200K–$2M default exposure — the math is simple." }),
        /* @__PURE__ */ jsx(StatRow, { stats: [
          { value: "$5K–$25K", label: "QoE cost depending on complexity" },
          { value: "$200K–$2M+", label: "Default cost on a single bad loan" },
          { value: "Hours", label: "For preliminary analysis" }
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          "The cost of a bad acquisition loan far exceeds the cost of a ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings report" }),
          '. For lenders — especially those underwriting SBA 7(a) acquisition loans — QoE analysis has shifted from "nice to have" to a critical underwriting requirement.'
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-lenders", children: "Why Lenders Require QoE" }),
        /* @__PURE__ */ jsx("p", { children: "Acquisition lending carries unique risks. Unlike traditional business loans where the borrower has an operating track record, acquisition loans fund a change of ownership — and the new owner's ability to service debt depends entirely on the accuracy of the target's financial picture." }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Earnings verification", description: "Confirms that reported EBITDA reflects actual, sustainable cash flow" },
          { title: "Adjustment transparency", description: "Identifies owner add-backs, one-time items, and discretionary expenses with documentation" },
          { title: "Trend analysis", description: "Reveals whether the business is growing, stable, or declining — critical for debt service projections" },
          { title: "Working capital assessment", description: "Ensures adequate working capital for ongoing operations post-acquisition" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "sba-lending", children: "SBA Lending & QoE Requirements" }),
        /* @__PURE__ */ jsx("p", { children: "SBA lenders face heightened scrutiny from the SBA and their CDCs. While the SBA SOP doesn't explicitly mandate QoE reports, prudent lenders increasingly require them for acquisition loans above $500K — and many require them for all change-of-ownership transactions." }),
        /* @__PURE__ */ jsx("p", { children: "The rationale is straightforward: SBA acquisition loans often involve borrowers with limited equity (as low as 10% injection) and long amortization periods. If reported earnings are overstated by even 15–20%, the debt service coverage ratio drops below acceptable thresholds. A QoE report catches these discrepancies before the loan closes." }),
        /* @__PURE__ */ jsx("h2", { id: "underwriting", children: "Strengthening Your Underwriting" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Adjusted EBITDA bridge", description: "Clear reconciliation from reported to adjusted earnings, with each adjustment categorized and documented" },
          { title: "Revenue quality metrics", description: "Customer concentration, contract vs. project revenue, recurring revenue percentage" },
          { title: "Expense normalization", description: "Owner compensation benchmarking, related-party transaction analysis, discretionary vs. necessary spending" },
          { title: "Cash flow validation", description: "Proof of cash analysis reconciling reported income to bank deposits" },
          { title: "Working capital peg", description: "Normalized working capital target for the purchase agreement" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "workflow", children: "Lender Workflow with Shepi" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Pre-screening", description: "Run a quick financial assessment on the borrower's application package to evaluate deal viability before committing underwriting resources" },
          { title: "QoE coordination", description: "If you require a third-party QoE, recommend QoE providers who use Shepi for faster turnaround" },
          { title: "Underwriting integration", description: "Incorporate QoE findings into your credit analysis and debt service coverage calculations" },
          { title: "Committee presentation", description: "Use QoE-derived adjusted financials in your credit memo and loan committee materials" },
          { title: "Portfolio monitoring", description: "For ongoing covenant compliance, the same analytical framework supports periodic financial reviews" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "risk-mitigation", children: "Risk Mitigation" }),
        /* @__PURE__ */ jsx("p", { children: "Every acquisition loan that defaults costs the institution far more than the QoE analysis would have. The math is simple:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "QoE cost", description: "Typically $5K–$25K depending on complexity" },
          { title: "Default cost", description: "Loss exposure of $200K–$2M+ on a single bad loan, plus workout costs and reputation risk" },
          { title: "Prevention value", description: "Catches earnings overstatements, undisclosed liabilities, and unsustainable trends that cause most acquisition loan failures" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Should lenders commission QoE directly or require the borrower to provide one?", answer: "Both approaches are common. Some lenders maintain approved QoE provider lists and require borrowers to engage from that list. Others accept borrower-commissioned QoE reports from recognized firms. The key is ensuring the analysis is independent and comprehensive." },
          { question: "How does faster QoE turnaround benefit lenders?", answer: "Deal velocity matters in competitive lending. When a borrower has multiple lender options, the one that can complete underwriting fastest often wins the deal. AI-assisted QoE compresses the longest pole in the underwriting tent — financial due diligence — from weeks to days." },
          { question: "What about deals that are too small for traditional QoE?", answer: "AI-assisted analysis lowers the cost floor, making financial due diligence accessible for sub-$1M deals that make up the bulk of SBA lending volume." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/use-cases/accountants-cpa", label: "QoE for Accountants & CPA Firms" },
          { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" }
        ] })
      ]
    }
  );
}
export {
  Lenders as default
};
