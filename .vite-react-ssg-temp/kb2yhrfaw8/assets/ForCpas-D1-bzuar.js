import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-DCN4h0e5.js";
import { H as HeroCallout, B as BenefitGrid } from "./BenefitGrid-CqgEPSsd.js";
import { S as StepList } from "./StepList-CaZJInNM.js";
import { A as AccordionFAQ } from "./AccordionFAQ-Cju-RuPF.js";
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
import "./useBreadcrumbJsonLd-DC-feT7v.js";
const toc = [
  { id: "who", label: "Who this is for" },
  { id: "how", label: "How it works" },
  { id: "what-you-do", label: "What you actually do" },
  { id: "what-this-is-not", label: "What this is not" },
  { id: "compensation", label: "Compensation" },
  { id: "faq", label: "FAQ" }
];
const faqItems = [
  {
    question: "How much time does a typical review take?",
    answer: "Most engagements take 2–4 hours of focused review work, depending on the size and complexity of the target. You see the scope before you claim."
  },
  {
    question: "How and when do I get paid?",
    answer: "Reviewers are paid per engagement after the completion summary is submitted and accepted. Payment is issued via ACH on a regular cadence shared at onboarding. You're an independent contractor; Shepi issues a 1099-NEC at year end where applicable."
  },
  {
    question: "Do I sign the work? Am I issuing an opinion?",
    answer: "You sign your professional judgment on each adjustment — confirm, modify, or reject with reasoning — and that signed reviewer record is part of the DFY deliverable the buyer receives. What you are NOT doing is issuing a formal attestation, audit opinion, review report under SSARS, or any other CPA-firm-branded attest report. Shepi is analytical software, not a CPA firm, and does not produce attest deliverables through the platform."
  },
  {
    question: "Do I need malpractice / E&O coverage?",
    answer: "Yes. You must carry your own professional liability insurance and provide proof during onboarding. Shepi does not extend its coverage to reviewers — each party carries its own."
  },
  {
    question: "Can I work on Shepi alongside my firm job?",
    answer: "Only if your primary employer's policy permits outside engagements. You'll disclose this during application and it's your responsibility to keep it accurate."
  },
  {
    question: "What if I have a conflict with the target or buyer?",
    answer: "Disclose it before claiming. Each engagement shows the buyer and target up front so you can run an independence and conflict check. If there's a conflict, pass on the match — there's no obligation to claim."
  },
  {
    question: "How is the target's financial data handled?",
    answer: "All review happens inside Shepi. Target data stays on the platform — you don't need to download files locally. You're bound by Shepi's reviewer NDA, which covers buyer, target, and engagement-specific information."
  },
  {
    question: "What if I disagree with an AI-generated adjustment?",
    answer: "That's exactly the point of the review. Modify or reject any adjustment with a short note explaining your reasoning. The final deliverable reflects your confirmed judgment, not the AI's draft — your review is what makes the DFY output defensible."
  },
  {
    question: "How quickly do I need to respond when matched to a project?",
    answer: "Initial claim or pass within a reasonable window. Once claimed, engagements have SLAs we share during onboarding. You can always pass on a match."
  },
  {
    question: "Can I work with clients from any state?",
    answer: "You set your states served during onboarding. We match engagements based on your licensure and stated coverage."
  },
  {
    question: "Can I be removed from the reviewer network?",
    answer: "Yes. Grounds include license lapse or discipline, repeated missed SLAs, low-quality reviews flagged in QA, or breach of the provider agreement. We share the quality bar transparently at onboarding."
  }
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: "https://shepi.ai/for-cpas",
  name: "For CPAs — Review QoE Adjustments on Shepi",
  description: "Independent CPAs and small-firm partners can earn side income reviewing AI-generated Quality of Earnings adjustments on Shepi's Done-For-You engagements.",
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer }
  }))
};
function ForCpas() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Review QoE Adjustments. Earn Side Income.",
      seoTitle: "For CPAs — Review QoE Adjustments on Shepi",
      seoDescription: "Independent CPAs and small-firm partners review AI-generated Quality of Earnings adjustments on Shepi's Done-For-You engagements. Apply to join the reviewer network.",
      canonical: "https://shepi.ai/for-cpas",
      breadcrumbs: [{ label: "For CPAs" }],
      toc,
      jsonLd,
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Shepi handles the heavy lifting. You bring the professional judgment — and get paid per engagement." }),
        /* @__PURE__ */ jsx("p", { className: "text-lg", children: "Shepi is analytical Quality of Earnings software used by searchers, PE firms, lenders, and advisors. When a client buys our Done-For-You tier, a licensed CPA reviews the AI-generated adjustments before delivery. We're building a network of CPAs to handle that review work on a per-engagement basis." }),
        /* @__PURE__ */ jsx("h2", { id: "who", children: "Who this is for" }),
        /* @__PURE__ */ jsx("p", { children: "Independent CPAs, small-firm partners with capacity between client work, and QoE-experienced professionals who want flexible, project-based work without the overhead of business development." }),
        /* @__PURE__ */ jsx(
          BenefitGrid,
          {
            benefits: [
              {
                title: "Active CPA license",
                description: "You must hold a current CPA license in good standing in at least one US state."
              },
              {
                title: "QoE or financial-analysis background",
                description: "Comfort with adjustments, normalizations, working capital, and reading a general ledger."
              },
              {
                title: "Side-work permitted",
                description: "Your primary employer must allow outside engagements (or you're independent)."
              },
              {
                title: "Capacity for 1–3 concurrent reviews",
                description: "Each engagement is bounded — typically a few hours of focused review."
              }
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "how", children: "How it works" }),
        /* @__PURE__ */ jsx(
          StepList,
          {
            steps: [
              {
                title: "Apply",
                description: "Submit a short application with your license details, background, and any conflicts disclosure. We review within a few business days."
              },
              {
                title: "Onboard",
                description: "Upload your license, proof of liability coverage, and a W-9. Acknowledge the provider agreement."
              },
              {
                title: "Claim an engagement",
                description: "When a new Done-For-You project matches your industry and state, you'll see it in your queue. Claim it if you have capacity."
              },
              {
                title: "Review adjustments",
                description: "Walk through each AI-flagged adjustment. Confirm, modify, or reject — with a short note explaining your judgment."
              },
              {
                title: "Submit & get paid",
                description: "Send your completion summary. Payment is issued per engagement."
              }
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "what-you-do", children: "What you actually do" }),
        /* @__PURE__ */ jsx("p", { children: "Shepi's platform ingests the target's financials, identifies adjustment candidates, gathers supporting evidence, and drafts narrative explanations. Your job is the part software can't do credibly: applying professional judgment to whether each adjustment is reasonable and supportable." }),
        /* @__PURE__ */ jsxs("p", { children: [
          "For each adjustment proposal, you'll see the AI's rationale, the supporting evidence, and the proposed dollar impact. You decide: ",
          /* @__PURE__ */ jsx("strong", { children: "confirm" }),
          " ",
          "(the adjustment stands as-is), ",
          /* @__PURE__ */ jsx("strong", { children: "modify" }),
          " (adjust the amount or period allocation with a note), or ",
          /* @__PURE__ */ jsx("strong", { children: "reject" }),
          " (with a reason). That's the review work — disciplined, bounded, and focused on judgment."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "what-this-is-not", children: "What this is not" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We're explicit about scope to protect you and the platform. Reviewing adjustments on Shepi is ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          ":"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "An attest or audit engagement. You are not issuing an audit opinion, a review report under SSARS, or any other form of formal attestation through the platform." }),
          /* @__PURE__ */ jsx("li", { children: "A signed CPA report. Shepi does not produce CPA-firm-branded reports. The deliverable is the Shepi analysis, with your review captured as confirmed professional judgment on each adjustment." }),
          /* @__PURE__ */ jsx("li", { children: "A client-of-yours relationship. The Shepi customer is the buyer; you are contracted by Shepi to provide review services on the platform." })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "This keeps the work inside the scope defined by Shepi's terms of service and your own professional liability coverage, and keeps you clear of unauthorized-practice and scope-creep risk." }),
        /* @__PURE__ */ jsx("h2", { id: "compensation", children: "Compensation" }),
        /* @__PURE__ */ jsx("p", { children: "Reviewers are paid per engagement. Rates are competitive for the time involved — most reviews take a few focused hours. Specific rates are shared during onboarding and may vary by engagement complexity." }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "FAQ" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: faqItems }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 rounded-2xl border border-border bg-secondary/40 p-8 text-center", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-serif mb-3", children: "Ready to apply?" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6 max-w-xl mx-auto", children: "The application takes about 5 minutes. We'll review and get back to you within a few business days." }),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/cpa-partners",
              className: "inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
              children: "Start your application →"
            }
          )
        ] })
      ]
    }
  );
}
export {
  ForCpas as default
};
