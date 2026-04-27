import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-BZlcp1Ma.js";
import { H as HeroCallout, B as BenefitGrid, A as AccordionFAQ, R as RelatedResourceCards } from "./RelatedResourceCards-Dsn1QZYy.js";
import { C as ComparisonTable } from "./ComparisonTable-DuwES2f2.js";
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
  { id: "the-question", label: "The Question" },
  { id: "what-ai-does-well", label: "What AI Does Well" },
  { id: "what-ai-cant-do", label: "What AI Can't Do (Yet)" },
  { id: "comparison", label: "AI vs CPA Firm" },
  { id: "hybrid-model", label: "The Hybrid Model" },
  { id: "future", label: "Where This Is Headed" },
  { id: "faq", label: "FAQ" }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Can AI Replace a Quality of Earnings Report?",
  description: "An honest assessment of AI's capabilities and limitations in Quality of Earnings analysis — what AI does well, what still requires human judgment, and the hybrid model that's emerging.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/can-ai-replace-qoe"
};
function CanAIReplaceQoE() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Can AI Replace a Quality of Earnings Report?",
      seoTitle: "Can AI Replace a QoE Report? Honest Assessment | Shepi",
      seoDescription: "An honest look at whether AI can replace traditional Quality of Earnings reports. What AI does well, where human judgment is still essential, and the hybrid model emerging in M&A.",
      canonical: "https://shepi.ai/guides/can-ai-replace-qoe",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "Can AI Replace QoE?" }
      ],
      toc,
      jsonLd,
      publishedDate: "February 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "If you're preparing for a transaction, here's how to think about AI in the QoE process — not as a replacement for expertise, but as a force multiplier for deal velocity." }),
        /* @__PURE__ */ jsx("h2", { id: "the-question", children: "The Question" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "As AI tools enter the M&A landscape, deal professionals are asking a straightforward question: can AI replace the traditional ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "Quality of Earnings" }),
          " engagement performed by a CPA firm?"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The honest answer is ",
          /* @__PURE__ */ jsx("strong", { children: "nuanced" }),
          `. AI can automate the data-intensive work that consumes 70–80% of a traditional QoE engagement. But certain elements — professional judgment, management interviews, formal attestation — still require human expertise. The real question isn't "replace or not" — it's `,
          /* @__PURE__ */ jsx("em", { children: "how to combine AI and human judgment for better, faster outcomes" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-ai-does-well", children: "What AI Does Well" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Data processing at scale", description: "AI reviews 100% of GL transactions where humans can only sample. More coverage means fewer missed issues" },
          { title: "Pattern recognition", description: "Identifies anomalies, duplicates, round-dollar entries, and period-end clustering across thousands of transactions" },
          { title: "Account mapping", description: "Automatically classifies chart of accounts into standardized QoE categories — work that takes analysts days" },
          { title: "Calculation consistency", description: "Working capital ratios, EBITDA bridges, and trend analyses computed identically every time" },
          { title: "Speed", description: "Initial analysis in hours vs weeks — critical for competitive deal timelines" },
          { title: "Keyword intelligence", description: "NLP-powered detection of personal expenses, related-party indicators, and adjustment candidates in transaction descriptions" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-ai-cant-do", children: "What AI Can't Do (Yet)" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Management interviews", description: "Understanding why a number is what it is requires conversation, body language, and follow-up questions" },
          { title: "Business context", description: "Knowing that a $200K expense is truly non-recurring requires understanding the business, the industry, and the deal context" },
          { title: "Formal attestation", description: "Lenders and institutions that require a CPA's signature and professional liability coverage can't accept AI-only analysis" },
          { title: "Judgment calls", description: "Is a recurring legal expense truly non-recurring? Is the owner's salary replacement $150K or $200K? These require human judgment" },
          { title: "Relationship navigation", description: "Negotiating adjustment positions with the other side of the deal is inherently human" },
          { title: "Complex structures", description: "Multi-entity carve-outs, international tax structures, and bespoke accounting require specialist expertise" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison", children: "AI vs CPA Firm: Where Each Excels" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Capability", "AI-Assisted", "Traditional CPA"],
            rows: [
              ["Transaction coverage", "100% of GL", "Sample-based"],
              ["Time to first findings", "Hours", "Weeks"],
              ["Cost", "Fraction of traditional", "$20K+"],
              ["Consistency", "Standardized methodology", "Varies by team"],
              ["Management interviews", "Not applicable", "Deep qualitative insight"],
              ["Professional attestation", "No", "Yes (CPA liability coverage)"],
              ["Complex judgment calls", "Flags for review", "Expert resolution"],
              ["Scalability", "Parallel processing", "Linear (headcount)"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "hybrid-model", children: "The Hybrid Model" }),
        /* @__PURE__ */ jsx("p", { children: "The most effective approach combines AI automation with human expertise. This isn't a compromise — it's a genuinely better outcome for all parties:" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "AI handles data processing", description: "Account mapping, anomaly detection, initial adjustment identification, calculations — the 70-80% of work that's data-intensive" },
          { title: "Humans provide judgment", description: "Evaluating flagged items, conducting management interviews, making nuanced decisions about adjustment treatment" },
          { title: "Faster deal timelines", description: "Preliminary AI findings available in hours, giving the team a head start before formal engagement begins" },
          { title: "Better coverage", description: "100% transaction review by AI + focused human analysis on flagged items = more thorough than either alone" }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "future", children: "Where This Is Headed" }),
        /* @__PURE__ */ jsx("p", { children: "The trajectory is clear: AI will handle an increasing share of the analytical work in QoE, while human judgment remains essential for the subjective, relational, and attestation components. The firms and professionals who adopt AI tools will outcompete those who don't — not because AI replaces them, but because it makes them faster, more thorough, and more scalable." }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx(Link, { to: "/features/ai-due-diligence", children: "Learn how Shepi implements this hybrid approach" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: [
          { question: "Should I use AI or hire a CPA firm?", answer: "It depends on the deal. For screening, sell-side prep, and deals under $5M, AI-assisted analysis may be sufficient. For deals requiring formal attestation or lender-mandated CPA review, use AI for initial analysis and a CPA firm for formal reporting." },
          { question: "Will lenders accept AI-generated QoE?", answer: "Many lenders accept AI-assisted analysis for preliminary assessment and smaller deals. For larger SBA loans and institutional lending, formal CPA-prepared QoE is typically required. AI analysis can accelerate the CPA engagement." },
          { question: "Is AI-assisted QoE less reliable?", answer: "For data-intensive tasks (anomaly detection, calculation accuracy, transaction coverage), AI is actually more reliable than manual processes. For judgment-dependent tasks, human expertise remains superior. The combination is strongest." }
        ] }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/features/ai-due-diligence", label: "AI for Financial Due Diligence" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs Traditional CPA" },
          { to: "/guides/ai-accounting-anomaly-detection", label: "How AI Detects Accounting Anomalies" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" }
        ] })
      ]
    }
  );
}
export {
  CanAIReplaceQoE as default
};
