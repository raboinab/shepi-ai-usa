import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { C as ContentPageLayout } from "./ContentPageLayout-DCN4h0e5.js";
import { H as HeroCallout, B as BenefitGrid } from "./BenefitGrid-CqgEPSsd.js";
import { S as StepList } from "./StepList-CaZJInNM.js";
import { C as ComparisonTable } from "./ComparisonTable-CaWKj8lQ.js";
import { A as AccordionFAQ } from "./AccordionFAQ-Cju-RuPF.js";
import { R as RelatedResourceCards } from "./RelatedResourceCards-cyLzBc8L.js";
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
  { id: "the-30-second-answer", label: "The 30-Second Answer" },
  { id: "why-it-matters", label: "Why It Matters" },
  { id: "when-sde", label: "When SDE Is the Right Number" },
  { id: "when-adjusted-ebitda", label: "When Adjusted EBITDA Is the Right Number" },
  { id: "conversion", label: "Converting Between Them" },
  { id: "manager-comp", label: "What Counts as Market-Rate Manager Comp" },
  { id: "comparison", label: "Quick Comparison" },
  { id: "mistakes", label: "Common Novice Buyer Mistakes" },
  { id: "faq", label: "FAQ" }
];
const faqItems = [
  {
    question: "Is SDE the same as cash flow?",
    answer: "No. SDE is an earnings metric — it ignores working capital changes, capex, and debt service. Real cash flow to an owner is SDE minus capex, minus debt service, plus or minus changes in working capital."
  },
  {
    question: "Why do brokers prefer SDE?",
    answer: "SDE is almost always a higher number than Adjusted EBITDA (it adds back the owner's salary), which makes the trailing multiple look smaller and the asking price look more reasonable. For owner-operator buyers this is legitimate. For anyone hiring a manager, it overstates what the business actually returns."
  },
  {
    question: "Can a deal be priced on both?",
    answer: "Yes — and the better-prepared deals show both. A clean QoE will reconcile from net income to EBITDA to Adjusted EBITDA to SDE so each buyer type can underwrite to the number that matches their model."
  },
  {
    question: "Does Shepi produce SDE?",
    answer: "Shepi normalizes to Adjusted EBITDA — the institutional standard used by lenders, PE, search funds, and independent sponsors. SDE is one line above Adjusted EBITDA (add back owner compensation), so it's trivially derivable from a Shepi report when needed for an owner-operator comparison."
  },
  {
    question: "What multiple should I pay on SDE vs Adjusted EBITDA?",
    answer: "Multiples are not interchangeable. Main Street SDE multiples typically run 2–4×. Lower-middle-market Adjusted EBITDA multiples typically run 4–8×+ depending on size, growth, and quality. Applying an Adjusted EBITDA multiple to an SDE number — or vice versa — is one of the most expensive mistakes a first-time buyer can make."
  }
];
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Seller's Discretionary Earnings vs Adjusted EBITDA",
    description: "A novice buyer's guide to SDE vs Adjusted EBITDA: what each number means, when to use it, how to convert between them, and why mixing them up is the most expensive mistake in small-business M&A.",
    author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
    publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
    datePublished: "2026-05-14",
    dateModified: "2026-05-14",
    mainEntityOfPage: "https://shepi.ai/guides/sellers-discretionary-earnings"
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer }
    }))
  }
];
function SellersDiscretionaryEarnings() {
  return /* @__PURE__ */ jsxs(
    ContentPageLayout,
    {
      title: "Seller's Discretionary Earnings vs Adjusted EBITDA",
      seoTitle: "SDE vs Adjusted EBITDA: A Buyer's Guide | Shepi",
      seoDescription: "Brokers quote SDE. Lenders and PE buyers underwrite Adjusted EBITDA. Learn the difference and how to convert between them before overpaying.",
      canonical: "https://shepi.ai/guides/sellers-discretionary-earnings",
      breadcrumbs: [
        { label: "Resources", href: "/resources" },
        { label: "SDE vs Adjusted EBITDA" }
      ],
      toc,
      jsonLd,
      publishedDate: "May 2026",
      heroAccent: true,
      children: [
        /* @__PURE__ */ jsx(HeroCallout, { children: "Brokers quote SDE. Lenders and PE buyers underwrite to Adjusted EBITDA. They are not the same number — and the gap is usually the owner's paycheck." }),
        /* @__PURE__ */ jsx("h2", { id: "the-30-second-answer", children: "The 30-Second Answer" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Both SDE and Adjusted EBITDA are ",
          /* @__PURE__ */ jsx("em", { children: "normalized" }),
          " earnings — net income with the noise stripped out (interest, taxes, depreciation, one-time items, personal expenses run through the business). They differ on exactly one question: ",
          /* @__PURE__ */ jsx("strong", { children: "does the owner's salary count as a return to the buyer, or as a cost the buyer has to replace?" })
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Seller's Discretionary Earnings (SDE)" }),
            " is what the business earns ",
            /* @__PURE__ */ jsx("em", { children: "for an owner-operator" }),
            ". The owner's salary is treated as part of the buyer's return, because the buyer will be the one drawing it."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Adjusted EBITDA" }),
            " is what the business earns ",
            /* @__PURE__ */ jsx("em", { children: "as a standalone asset" }),
            ". The owner is replaced with a market-rate manager, and that manager's salary stays in as a real cost."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "The bridge in one line:" }),
            " ",
            /* @__PURE__ */ jsx("code", { children: "Adjusted EBITDA = SDE − market-rate manager compensation" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "why-it-matters", children: "Why It Matters: A Worked Example" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "A broker lists a business at ",
          /* @__PURE__ */ jsx("strong", { children: '"4× SDE of $500K = $2.0M asking."' }),
          " Sounds reasonable. Here's what's underneath:"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "Owner currently pays themselves a $150K salary plus $30K in benefits and payroll tax." }),
          /* @__PURE__ */ jsxs("li", { children: [
            "To replace the owner with a hired GM doing the same job: ",
            /* @__PURE__ */ jsx("strong", { children: "$120K all-in" }),
            " (per BLS / industry comp)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Adjusted EBITDA = $500K SDE − $120K manager comp = ",
            /* @__PURE__ */ jsx("strong", { children: "$380K" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "If you're an owner-operator planning to draw a paycheck, paying 4× SDE ($2.0M) can pencil. If you're hiring a GM and underwriting like a financial buyer, the same business at 4× ",
          /* @__PURE__ */ jsx("em", { children: "Adjusted EBITDA" }),
          " is worth ",
          /* @__PURE__ */ jsx("strong", { children: "$1.52M" }),
          ` — not $2.0M. The "multiple" only means something when it's attached to the right earnings number. Mixing them up is how first-time buyers overpay by 25–35% and don't realize it until year two.`
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "when-sde", children: "When SDE Is the Right Number" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "You'll be the operator", description: "You plan to work in the business full-time and draw a salary as part of your return on the deal." },
          { title: "Main Street size", description: "Single-location businesses, typically under ~$1M in earnings, where one owner can run the whole operation." },
          { title: "SBA 7(a) deals", description: "SBA underwriting for owner-operator acquisitions traditionally references SDE-style cash flow to the buyer." },
          { title: "BizBuySell-style listings", description: "Broker listings on BizBuySell, BizQuest, and similar platforms almost always quote SDE — that's the language of the marketplace." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "when-adjusted-ebitda", children: "When Adjusted EBITDA Is the Right Number" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "You're hiring a GM", description: "If you won't run the business day-to-day, the manager's salary is a real cost — not an add-back." },
          { title: "Lower-middle-market deals", description: "Roughly $1M+ of earnings, where the business is too big for a single owner-operator and trades as an institutional asset." },
          { title: "Equity partners involved", description: "PE, search funds, independent sponsors, family offices — every financial buyer underwrites to Adjusted EBITDA so multiples and IRR are comparable across deals." },
          { title: "Beyond SBA financing", description: "Bank cash-flow loans, mezz, unitranche, and seller notes layered on top all underwrite to Adjusted EBITDA and a debt-service coverage ratio." },
          { title: "Competitive processes", description: "When multiple buyers are bidding, the market converges on Adjusted EBITDA so bids are apples-to-apples." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "conversion", children: "Converting Between Them" }),
        /* @__PURE__ */ jsx("p", { children: "Both numbers are produced by the same normalization exercise — they just stop one line apart. Walk it from the bottom of the income statement up:" }),
        /* @__PURE__ */ jsx(StepList, { steps: [
          { title: "Start with reported net income", description: "The bottom line of the tax return or income statement, as filed." },
          { title: "Add back interest, taxes, depreciation, amortization", description: "This gives you reported EBITDA — operating earnings independent of capital structure and accounting choices." },
          { title: "Add back non-recurring and personal expenses", description: "One-time legal fees, owner's car, family on payroll doing nothing, vacation home run through the business — anything that won't transfer to the buyer. This gives you Adjusted EBITDA." },
          { title: "Add back the owner's full compensation", description: "W-2 salary plus benefits plus the employer payroll-tax portion. This gives you SDE." },
          { title: "To go SDE → Adjusted EBITDA, subtract market-rate replacement comp", description: "Determine what it would cost to hire a GM doing the owner's actual job, and subtract that. The result is Adjusted EBITDA." }
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The full reconciliation — Net Income → EBITDA → Adjusted EBITDA → SDE — is what a clean ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/quality-of-earnings", children: "QoE report" }),
          " shows on the ",
          /* @__PURE__ */ jsx(Link, { to: "/guides/ebitda-bridge", children: "EBITDA bridge" }),
          ". Every adjustment between those lines should be itemized, supported by source documents, and categorized."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "manager-comp", children: "What Counts as Market-Rate Manager Comp" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The owner's ",
          /* @__PURE__ */ jsx("em", { children: "current" }),
          " salary is almost never the right replacement number — owners routinely under-pay or over-pay themselves for tax reasons. Use a defensible market benchmark:"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "BLS Occupational Employment and Wage Statistics" }),
            " for the relevant SOC code and metro area (free, lender-friendly)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Industry comp surveys" }),
            " from trade associations — often the most accurate for niche operator roles."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Job-board comps" }),
            " for the actual posting you'd run to backfill the role."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Match the ",
          /* @__PURE__ */ jsx("em", { children: "scope" }),
          `, not the title: an "owner" who is also the lead salesperson, head technician, and bookkeeper isn't replaced by one $90K GM. Either price in multiple hires, or be honest that this is an owner-operator deal and quote SDE. See `,
          /* @__PURE__ */ jsx(Link, { to: "/guides/owner-compensation-normalization", children: "owner compensation normalization" }),
          " for the full methodology."
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "comparison", children: "Quick Comparison" }),
        /* @__PURE__ */ jsx(
          ComparisonTable,
          {
            headers: ["Dimension", "SDE", "Adjusted EBITDA"],
            rows: [
              ["Who uses it", "Owner-operator buyers, brokers", "PE, search funds, lenders, financial buyers"],
              ["Typical deal size", "Under ~$1M earnings", "~$1M+ earnings"],
              ["Owner comp treatment", "Added back as a return to the buyer", "Replaced with market-rate manager cost"],
              ["Typical multiple range", "~2–4×", "~4–8×+"],
              ["Lender acceptance", "SBA 7(a) standard", "Bank, mezz, unitranche standard"],
              ["What it answers", "What will I take home running this?", "What does this asset earn on its own?"]
            ]
          }
        ),
        /* @__PURE__ */ jsx("h2", { id: "mistakes", children: "Common Novice Buyer Mistakes" }),
        /* @__PURE__ */ jsx(BenefitGrid, { benefits: [
          { title: "Mixing the multiple with the metric", description: "Applying a 6× Adjusted EBITDA multiple to an SDE number — or a 3× SDE multiple to Adjusted EBITDA. Either direction misprices the deal by 25–50%." },
          { title: "Forgetting the spouse on payroll", description: "If the owner's spouse or family member is on the books for a no-show role, that's an add-back too — it's not part of replacement comp." },
          { title: "Using the owner's current salary as 'replacement'", description: "Owners routinely under-pay (S-corp distributions) or over-pay (income smoothing) themselves. Use a market benchmark, not what's on the W-2." },
          { title: "Applying SDE to a business too big for one operator", description: "If the business actually requires a GM plus ownership oversight, SDE overstates what a buyer can take home — there's no single seat to fill." },
          { title: "Letting the broker pick the metric", description: "Brokers default to whichever number makes the multiple look smaller. Insist on seeing both, with a documented reconciliation between them." }
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "faq", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(AccordionFAQ, { items: faqItems }),
        /* @__PURE__ */ jsx("h2", { children: "Related Resources" }),
        /* @__PURE__ */ jsx(RelatedResourceCards, { links: [
          { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments Guide" },
          { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization" },
          { to: "/guides/ebitda-bridge", label: "EBITDA Bridge Analysis" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" }
        ] })
      ]
    }
  );
}
export {
  SellersDiscretionaryEarnings as default
};
