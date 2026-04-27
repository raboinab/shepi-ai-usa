import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useSEO, t as toast, s as supabase, S as ShepiLogo, B as Button, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, P as PRICING, f as CardContent, A as Accordion, j as AccordionItem, k as AccordionTrigger, l as AccordionContent, i as trackEvent } from "../main.mjs";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Settings, Loader2 } from "lucide-react";
import { u as useSubscription } from "./useSubscription-fJr4XAL_.js";
import { u as useTosAcceptance, T as TermsAcceptanceModal } from "./TermsAcceptanceModal-DCI1QJ_5.js";
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
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
const Pricing = () => {
  const __seoTags = useSEO({
    title: "Pricing — shepi QoE Platform",
    description: "Flexible pricing for every deal volume. Per-project or monthly plans for independent searchers, deal teams, PE firms, and advisors.",
    canonical: "https://shepi.ai/pricing",
    ogImage: "/og-image.png"
  });
  const [user, setUser] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [pendingPlanType, setPendingPlanType] = useState(null);
  const [showMonthlyPromo, setShowMonthlyPromo] = useState(false);
  const [monthlyPromoCode, setMonthlyPromoCode] = useState("");
  const [searchParams] = useSearchParams();
  const { hasActiveSubscription, checkSubscription } = useSubscription();
  const { hasAccepted } = useTosAcceptance();
  useEffect(() => {
    if (searchParams.get("payment") === "cancelled") {
      toast({ title: "Payment cancelled", description: "You can try again when you're ready." });
    }
  }, [searchParams]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);
  const proceedToCheckout = async (planType) => {
    setCheckoutLoading(planType);
    trackEvent("begin_checkout", { plan: planType });
    try {
      const body = { planType };
      if (planType === "monthly" && monthlyPromoCode.trim()) {
        body.promoCode = monthlyPromoCode.trim();
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body
      });
      if (error) {
        const msg = data?.error || error.message || "Failed to start checkout";
        throw new Error(msg);
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(null);
    }
  };
  const handleCheckout = (planType) => {
    if (!user) {
      window.location.href = "/auth?mode=signup";
      return;
    }
    if (!hasAccepted) {
      setPendingPlanType(planType);
      setTosModalOpen(true);
      return;
    }
    proceedToCheckout(planType);
  };
  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open subscription management",
        variant: "destructive"
      });
    }
  };
  const faqCategories = [
    {
      title: "Data & Security",
      questions: [
        {
          q: "How is my deal data protected?",
          a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your deal information is isolated to your account with strict access controls. We use enterprise-grade infrastructure with SOC 2 Type II compliant hosting. Only you can access your projects — not even our support team can view your analysis without explicit permission."
        },
        {
          q: "Is my deal data used to train AI models?",
          a: "No. Your deal data is never used to train AI models. Period. Your financial information, adjustments, and analysis remain completely private. The AI assistance you receive is powered by models trained on public financial knowledge — not your confidential deal information."
        },
        {
          q: "Can other users see my analysis or data?",
          a: "No. Each project is completely isolated to your account. There's no shared database, no cross-user visibility, and no way for other users to access your work. When you export your analysis, you control who has access to those files."
        },
        {
          q: "Can I delete my data after completing a project?",
          a: "Yes. You can delete any project at any time, which permanently removes all associated data including uploaded documents, analysis, and adjustments. Once deleted, the data cannot be recovered. We also automatically purge deleted data from our backups within 30 days."
        }
      ]
    },
    {
      title: "What shepi Is",
      questions: [
        {
          q: "What exactly does shepi do?",
          a: "shepi is an AI-assisted platform that structures and accelerates Quality of Earnings (QoE) analysis for M&A transactions. It guides you through the complete QoE workflow — from uploading financial statements to producing a professional EBITDA bridge with documented adjustments. Think of it as having an experienced analyst looking over your shoulder, helping you organize data, identify adjustments, and produce consistent, defensible output."
        },
        {
          q: "How is shepi different from using Excel templates?",
          a: "Excel templates give you a blank structure — shepi gives you a guided process. The key differences: Guided workflow through 6 phases that mirror how experienced analysts work; AI assistance with real-time explanations and red flag identification; Consistency across every project; Time savings measured in hours, not weeks; Built-in calculations with no formula errors."
        }
      ]
    },
    {
      title: "What shepi Is NOT",
      questions: [
        {
          q: "Does shepi replace a formal Quality of Earnings report from a CPA firm?",
          a: "shepi produces comprehensive QoE analysis from the same source data a CPA firm would use — trial balances, financial statements, and supporting documents. For transactions requiring CPA attestation (lender requirements, regulatory compliance), shepi accelerates that engagement by producing CPA-ready workpapers. The difference between shepi and a CPA firm isn't the analysis methodology — it's the attestation letter and professional liability coverage."
        },
        {
          q: "Does shepi calculate final EBITDA or provide a valuation?",
          a: "shepi helps you build an EBITDA bridge by tracking and categorizing your adjustments, but the final numbers reflect YOUR judgment, not ours. We don't calculate valuation multiples or opine on what a business is worth. Our role is to help you organize and document the analysis — the conclusions are yours."
        },
        {
          q: "Can I show shepi output directly to lenders or investors?",
          a: "Yes — shepi output is complete, professional-quality QoE analysis that exports to PDF and Excel for sharing. For investor presentations and internal decision-making, shepi delivers institutional-grade workpapers. If your lender specifically requires CPA-attested reports for financing, shepi provides the analytical foundation that accelerates that formal engagement."
        },
        {
          q: "Does shepi certify or guarantee the accuracy of the analysis?",
          a: "No. shepi structures your analysis and provides AI-powered suggestions, but every adjustment is entered and approved by you. We don't audit source documents, verify management representations, or certify results. The accuracy of your analysis depends on the quality of data you provide and the judgment calls you make."
        },
        {
          q: "How reliable is shepi's analysis compared to what a CPA firm would produce?",
          a: "shepi's methodology and spreadsheet structure were developed by an M&A professional with years of hands-on QoE experience. The workflow, adjustment categories, and output format mirror what you'd see from a quality accounting firm. Here's the truth: for clean deals with good data and careful analysis, shepi produces results that are functionally equivalent to what a CPA firm would deliver. The difference isn't in methodology — it's in who signs off on it. That said, the old adage applies: garbage in, garbage out. shepi is a tool that structures and accelerates your analysis — it doesn't fix bad data or substitute for sound judgment. If you bring messy books and rush through the workflow, you'll get unreliable output. If you bring clean financials and apply appropriate diligence, you'll get institutional-quality analysis."
        }
      ]
    },
    {
      title: "How It Works",
      questions: [
        {
          q: "What file formats can I upload?",
          a: "Shepi accepts trial balance exports from most accounting systems (QuickBooks, Xero, Sage, NetSuite), CSV and Excel files, and PDF financial statements. We support multi-period data in single files or separate uploads. For best results, export your trial balance directly from QuickBooks or your accounting system — we'll handle the mapping automatically."
        },
        {
          q: "Can I connect directly to QuickBooks?",
          a: "Yes. Our QuickBooks integration lets you pull trial balance data directly without manual exports. Connect your client's QuickBooks account, select the periods you need, and shepi imports the data automatically. This eliminates export errors and ensures you're working with clean, current financials."
        },
        {
          q: "How quickly can I complete an analysis?",
          a: "Most users complete initial analysis in 2-4 hours vs. 40+ hours manually. The biggest time savings come from automatic account mapping (saves 8-12 hours), built-in calculations and reconciliations, and structured workflow that eliminates setup time. Your actual time depends on deal complexity and data quality."
        },
        {
          q: "What do I get at the end?",
          a: "A complete analysis package including: EBITDA bridge with categorized adjustments, multi-period income statement and balance sheet analysis, working capital analysis with DSO/DPO/DIO metrics, customer and vendor concentration analysis, documented adjustment rationales with proof attachments. Everything exports to a professional PDF report and Excel workbook for sharing with stakeholders, lenders, or advisors."
        },
        {
          q: "What role does AI actually play in shepi?",
          a: "Our AI serves three functions: Education — explains QoE concepts, adjustment types, and industry norms in plain language; Identification — reviews your data to surface potential adjustments and red flags you might miss; Assistance — answers questions about your specific analysis in real-time. Importantly, the AI never writes adjustments for you or auto-calculates results. Every number in your analysis is human-entered and human-approved. The AI suggests and explains — you decide."
        },
        {
          q: "What happens if my financial data is messy or incomplete?",
          a: "Real deals are messy — we get it. shepi will warn you about potential issues (missing periods, unbalanced accounts, incomplete trial balances) but won't block your progress. You can proceed with imperfect data and document your assumptions. The warnings help you know what to address, but you decide what's acceptable for your analysis."
        }
      ]
    },
    {
      title: "Pricing & Value",
      questions: [
        {
          q: `Why does shepi cost ${PRICING.perProject.display} per project?`,
          a: `Consider the alternatives: DIY in Excel with a junior analyst at $50-100/hour spending 40+ hours = $2,000-4,000 in labor; Outsourcing to a CPA firm for sell-side QoE runs $15,000-50,000+; With shepi, complete analysis in hours, not weeks, for ${PRICING.perProject.display}. At ${PRICING.perProject.display}, you're paying roughly $100-200/hour for the time you actually spend — but you're getting the structure, consistency, and AI assistance that would otherwise require an experienced analyst.`
        },
        {
          q: "When should I choose per-project vs. monthly?",
          a: `Per-project (${PRICING.perProject.display}): Best if you're analyzing 1–3 deals and want to pay only for what you use. Monthly (${PRICING.monthly.display}/month): Includes up to 3 concurrent projects. Additional projects are $1,000 each. Best for brokers, accountants, searchers, and PE teams with ongoing deal flow.`
        },
        {
          q: "Is there a free trial?",
          a: "We don't currently offer a free trial, but we're confident in the value. If you complete an analysis and don't find it valuable, reach out to our team — we stand behind the product."
        }
      ]
    },
    {
      title: "Who It's For",
      questions: [
        {
          q: "Is shepi right for independent searchers doing their own diligence?",
          a: "Yes — searchers are one of our primary users. If you're evaluating deals and need to understand the quality of earnings before making an offer, shepi helps you screen deals faster (hours, not weeks), build confidence in your own analysis, document your work professionally, and identify red flags before you're too deep. Just remember: if your deal requires lender financing, you'll likely still need formal QoE from a CPA firm for closing."
        },
        {
          q: "Can I compare analysis across multiple deals?",
          a: "Yes. Your dashboard shows all your projects with key metrics for quick comparison. While each analysis is independent, you can easily reference previous deals to calibrate your approach. Many searchers find this valuable for developing pattern recognition across similar businesses or industries."
        },
        {
          q: "Does shepi handle industry-specific adjustments?",
          a: "shepi's adjustment framework covers common categories across industries — owner compensation, one-time expenses, related party transactions, etc. The AI assistant understands industry-specific considerations (SaaS metrics, manufacturing working capital, healthcare reimbursement) and can guide you on what to look for. The structure is flexible enough to capture any adjustment type, and industry context helps the AI provide more relevant suggestions."
        },
        {
          q: "Can accounting firms and advisors use shepi?",
          a: "Absolutely. Firms use shepi to extend capacity without adding headcount, standardize QoE output across team members, accelerate sell-side QoE preparation, and train junior staff on QoE methodology. Contact us to discuss team pricing and collaboration features."
        },
        {
          q: "Who should NOT use shepi?",
          a: `shepi may not be right for you if: You need a CPA-certified QoE report (we don't provide certification); Your lender has specific QoE vendor requirements; You're looking for a valuation tool (we focus on earnings quality, not valuation); You want the AI to "do it for you" (we assist, you decide).`
        }
      ]
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    __seoTags,
    /* @__PURE__ */ jsx(
      TermsAcceptanceModal,
      {
        open: tosModalOpen,
        onOpenChange: setTosModalOpen,
        onAccepted: () => {
          if (pendingPlanType) {
            proceedToCheckout(pendingPlanType);
            setPendingPlanType(null);
          }
        }
      }
    ),
    /* @__PURE__ */ jsx("nav", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-8", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-muted-foreground hover:text-foreground transition-colors", children: "Home" }),
        /* @__PURE__ */ jsx(Link, { to: "/resources", className: "text-muted-foreground hover:text-foreground transition-colors", children: "Resources" }),
        /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-foreground font-medium", children: "Pricing" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: user ? /* @__PURE__ */ jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsx(Button, { children: "Go to Dashboard" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Log In" }) }),
        /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsx(Button, { children: "Get Started" }) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-16", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Home"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-serif font-bold mb-4", children: "Professional QoE Analysis. Fraction of the Cost." }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-muted-foreground max-w-2xl mx-auto", children: "Choose the plan that fits your deal flow. Clear pricing, professional results." }),
        hasActiveSubscription && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "You have an active subscription" })
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: handleManageSubscription, children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 mr-2" }),
            "Manage Subscription"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch", children: [
        /* @__PURE__ */ jsxs(Card, { className: "border border-border flex flex-col", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Per Project" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "For targeted engagements" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xl font-bold text-primary", children: PRICING.perProject.display }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: PRICING.perProject.period })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "One deal, one price — no recurring commitment" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col h-full space-y-4", children: [
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
              "Full 6-phase guided QoE workflow",
              "AI assistant with real-time guidance",
              "QuickBooks direct integration",
              "All standard adjustments & schedules",
              "AI-powered adjustment verification",
              "Advanced analytics dashboard",
              "Export to PDF & Excel",
              "90-day project access"
            ].map((feature) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: feature })
            ] }, feature)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-auto space-y-4", children: [
              user ? hasActiveSubscription ? /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", disabled: true, children: "Covered by Your Plan" }) : /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  className: "w-full",
                  onClick: () => handleCheckout("per_project"),
                  disabled: checkoutLoading === "per_project",
                  children: checkoutLoading === "per_project" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                    "Processing..."
                  ] }) : "Buy Now"
                }
              ) : /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", className: "block", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "Get Started" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Best for 1–3 deals or first-time users" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border-2 border-accent relative flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsx("span", { className: "bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap", children: "CPA-Led" }) }),
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Done-For-You" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "For anyone who needs it done right" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xl font-bold text-primary", children: PRICING.doneForYou.display }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: PRICING.doneForYou.period })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col h-full space-y-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Everything included in Per Project, plus:" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
              "CPA-led QoE review",
              "End-to-end project completion",
              "EBITDA adjustment summary memo",
              "Working capital analysis",
              "Lender-ready QoE workbook",
              "Direct CPA communication",
              "48–72 hour turnaround",
              "White-glove onboarding"
            ].map((feature) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: feature })
            ] }, feature)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-auto space-y-4", children: [
              user ? /* @__PURE__ */ jsx(
                Button,
                {
                  className: "w-full",
                  onClick: () => handleCheckout("done_for_you"),
                  disabled: checkoutLoading === "done_for_you",
                  children: checkoutLoading === "done_for_you" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                    "Processing..."
                  ] }) : "Buy Now"
                }
              ) : /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", className: "block", children: /* @__PURE__ */ jsx(Button, { className: "w-full", children: "Get Started" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Ideal for anyone who needs speed, clarity, and lender-ready diligence." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border-2 border-primary relative flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsx("span", { className: "bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap", children: "Best Value" }) }),
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Monthly" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "For active deal professionals" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xl font-bold text-primary", children: PRICING.monthly.display }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: PRICING.monthly.period })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col h-full space-y-4", children: [
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
              "Everything in Per Project",
              "Up to 3 concurrent projects",
              "Priority support",
              "Custom report templates",
              "Early feature access",
              "Team collaboration (as released)"
            ].map((feature) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: feature })
            ] }, feature)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-auto space-y-4", children: [
              hasActiveSubscription ? /* @__PURE__ */ jsx(Button, { className: "w-full", disabled: true, children: "Current Plan" }) : /* @__PURE__ */ jsx(
                Button,
                {
                  className: "w-full",
                  onClick: () => handleCheckout("monthly"),
                  disabled: checkoutLoading === "monthly",
                  children: checkoutLoading === "monthly" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                    "Processing..."
                  ] }) : "Subscribe Now"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Best for brokers, accountants, searchers, and PE teams with ongoing deal flow" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center italic", children: "Additional deals: $1,000 per project" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border border-border flex flex-col", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Firm Edition" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "For advisory firms delivering QoE and deal diligence" }),
            /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-semibold text-foreground", children: "Custom pricing" }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col h-full space-y-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Everything in Monthly, plus:" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
              { label: "Unlimited concurrent deal analysis", desc: "Run multiple diligence projects across your team without limits." },
              { label: "White-label QoE workbooks", desc: "Deliver Shepi outputs under your firm's brand." },
              { label: "Team seats & role-based access", desc: "Partners, managers, and analysts can collaborate across deals." },
              { label: "Dedicated account manager", desc: "Support for onboarding your team and scaling workflows." },
              { label: "Custom reporting templates", desc: "Align Shepi outputs with your firm's diligence format." },
              { label: "Priority support & SLA", desc: "Faster response times for active deals." },
              { label: "API access & integrations", desc: "Connect Shepi to internal tools and workflows." }
            ].map((feature) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground", children: feature.label }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: feature.desc })
              ] })
            ] }, feature.label)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-auto space-y-4", children: [
              /* @__PURE__ */ jsx("a", { href: "/#contact", className: "block", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "Contact Sales" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Increase QoE capacity without hiring more analysts." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-24 max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-serif font-bold text-center mb-4", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground mb-12 max-w-2xl mx-auto", children: "Everything you need to know about what Shepi is, what it isn't, and how to get the most value from it." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-8", children: faqCategories.map((category) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-4 text-primary", children: category.title }),
          /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "space-y-2", children: category.questions.map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `${category.title}-${index}`, className: "border border-border rounded-lg px-4", children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left font-medium hover:no-underline", children: faq.q }),
            /* @__PURE__ */ jsx(AccordionContent, { className: "text-muted-foreground leading-relaxed", children: faq.a })
          ] }, index)) })
        ] }, category.title)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-20 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold mb-4", children: "Ready to accelerate your deal analysis?" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Start your first project today." }),
        /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsx(Button, { size: "lg", children: "Get Started" }) })
      ] })
    ] })
  ] });
};
export {
  Pricing as default
};
