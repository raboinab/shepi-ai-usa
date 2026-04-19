import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowLeft, Loader2, Settings, ChevronDown, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import ShepiLogo from "@/components/ShepiLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PRICING } from "@/lib/pricing";
import type { User } from "@supabase/supabase-js";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { useTosAcceptance } from "@/hooks/useTosAcceptance";
import { trackEvent } from "@/lib/analytics";

const Pricing = () => {
  const __seoTags = useSEO({
    title: "Pricing — shepi QoE Platform",
    description: "Flexible pricing for every deal volume. Per-project or monthly plans for independent searchers, deal teams, PE firms, and advisors.",
    canonical: "https://shepi.ai/pricing",
    ogImage: "/og-image.png",
  });

  const [user, setUser] = useState<User | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [pendingPlanType, setPendingPlanType] = useState<'monthly' | 'per_project' | 'done_for_you' | null>(null);
  const [showMonthlyPromo, setShowMonthlyPromo] = useState(false);
  const [monthlyPromoCode, setMonthlyPromoCode] = useState("");
  const [searchParams] = useSearchParams();
  const { hasActiveSubscription, checkSubscription } = useSubscription();
  const { hasAccepted, loading: tosLoading } = useTosAcceptance();

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

  const proceedToCheckout = async (planType: 'monthly' | 'per_project' | 'done_for_you') => {
    setCheckoutLoading(planType);
    trackEvent("begin_checkout", { plan: planType });
    try {
      const body: Record<string, string> = { planType };
      if (planType === 'monthly' && monthlyPromoCode.trim()) {
        body.promoCode = monthlyPromoCode.trim();
      }
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body
      });

      if (error) {
        const msg = (data as any)?.error || error.message || "Failed to start checkout";
        throw new Error(msg);
      }
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCheckout = (planType: 'monthly' | 'per_project' | 'done_for_you') => {
    if (!user) {
      window.location.href = '/auth?mode=signup';
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
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open subscription management",
        variant: "destructive",
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
          a: "shepi may not be right for you if: You need a CPA-certified QoE report (we don't provide certification); Your lender has specific QoE vendor requirements; You're looking for a valuation tool (we focus on earnings quality, not valuation); You want the AI to \"do it for you\" (we assist, you decide)."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {__seoTags}
      <TermsAcceptanceModal
        open={tosModalOpen}
        onOpenChange={setTosModalOpen}
        onAccepted={() => {
          if (pendingPlanType) {
            proceedToCheckout(pendingPlanType);
            setPendingPlanType(null);
          }
        }}
      />
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/resources" className="text-muted-foreground hover:text-foreground transition-colors">
              Resources
            </Link>
            <Link to="/pricing" className="text-foreground font-medium">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">Professional QoE Analysis. Fraction of the Cost.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your deal flow. Clear pricing, professional results.
          </p>
          {hasActiveSubscription && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">You have an active subscription</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch">
          {/* Per Project */}
          <Card className="border border-border flex flex-col">
            <CardHeader>
              <CardTitle>Per Project</CardTitle>
              <CardDescription>For targeted engagements</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">{PRICING.perProject.display}</span>
                <span className="text-muted-foreground">{PRICING.perProject.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One deal, one price — no recurring commitment</p>
            </CardHeader>
            <CardContent className="flex flex-col h-full space-y-4">
              <ul className="space-y-3">
                {[
                  "Full 6-phase guided QoE workflow",
                  "AI assistant with real-time guidance",
                  "QuickBooks direct integration",
                  "All standard adjustments & schedules",
                  "AI-powered adjustment verification",
                  "Advanced analytics dashboard",
                  "Export to PDF & Excel",
                  "90-day project access",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-4">
                {user ? (
                  hasActiveSubscription ? (
                    <Button variant="outline" className="w-full" disabled>
                      Covered by Your Plan
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCheckout('per_project')}
                      disabled={checkoutLoading === 'per_project'}
                    >
                      {checkoutLoading === 'per_project' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </Button>
                  )
                ) : (
                  <Link to="/auth?mode=signup" className="block">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Best for 1–3 deals or first-time users
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Done-For-You */}
          <Card className="border-2 border-accent relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                CPA-Led
              </span>
            </div>
            <CardHeader>
              <CardTitle>Done-For-You</CardTitle>
              <CardDescription>For buyers, sellers, brokers, or PE firms who need it done right</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">{PRICING.doneForYou.display}</span>
                <span className="text-muted-foreground">{PRICING.doneForYou.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Everything included in Per Project, plus:</p>
              <ul className="space-y-3">
                {[
                  "CPA-led QoE review",
                  "End-to-end project completion",
                  "EBITDA adjustment summary memo",
                  "Working capital analysis",
                  "Lender-ready QoE workbook",
                  "Direct CPA communication",
                  "48–72 hour turnaround",
                  "White-glove onboarding",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-4">
                {user ? (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout('done_for_you')}
                    disabled={checkoutLoading === 'done_for_you'}
                  >
                    {checkoutLoading === 'done_for_you' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy Now'
                    )}
                  </Button>
                ) : (
                  <Link to="/auth?mode=signup" className="block">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Ideal for buyers, sellers, brokers, or PE firms who need speed, clarity, and lender-ready diligence.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="border-2 border-primary relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                Best Value
              </span>
            </div>
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>For active deal professionals</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">{PRICING.monthly.display}</span>
                <span className="text-muted-foreground">{PRICING.monthly.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full space-y-4">
              <ul className="space-y-3">
                {[
                  "Everything in Per Project",
                  "Up to 3 concurrent projects",
                  "Priority support",
                  "Custom report templates",
                  "Early feature access",
                  "Team collaboration (as released)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-4">
                {hasActiveSubscription ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleCheckout('monthly')}
                    disabled={checkoutLoading === 'monthly'}
                  >
                    {checkoutLoading === 'monthly' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                )}
                {!hasActiveSubscription && (
                  <div className="mt-2">
                    {!showMonthlyPromo ? (
                      <button
                        type="button"
                        onClick={() => setShowMonthlyPromo(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Tag className="w-3 h-3" />
                        Have a promo code?
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={monthlyPromoCode}
                          onChange={(e) => setMonthlyPromoCode(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Best for brokers, accountants, searchers, and PE teams with ongoing deal flow
                </p>
                <p className="text-xs text-muted-foreground text-center italic">
                  Additional deals: $1,000 per project
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Firm Edition */}
          <Card className="border border-border flex flex-col">
            <CardHeader>
              <CardTitle>Firm Edition</CardTitle>
              <CardDescription>For advisory firms delivering QoE and deal diligence</CardDescription>
              <div className="mt-4">
                <span className="text-2xl font-semibold text-foreground">Custom pricing</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Everything in Monthly, plus:</p>
              <ul className="space-y-3">
                {[
                  { label: "Unlimited concurrent deal analysis", desc: "Run multiple diligence projects across your team without limits." },
                  { label: "White-label QoE workbooks", desc: "Deliver Shepi outputs under your firm's brand." },
                  { label: "Team seats & role-based access", desc: "Partners, managers, and analysts can collaborate across deals." },
                  { label: "Dedicated account manager", desc: "Support for onboarding your team and scaling workflows." },
                  { label: "Custom reporting templates", desc: "Align Shepi outputs with your firm's diligence format." },
                  { label: "Priority support & SLA", desc: "Faster response times for active deals." },
                  { label: "API access & integrations", desc: "Connect Shepi to internal tools and workflows." },
                ].map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">{feature.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-4">
                <a href="/#contact" className="block">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  Increase QoE capacity without hiring more analysts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive FAQ */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to know about what Shepi is, what it isn't, and how to get the most value from it.
          </p>
          
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xl font-semibold mb-4 text-primary">{category.title}</h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${category.title}-${index}`} className="border border-border rounded-lg px-4">
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">Ready to accelerate your deal analysis?</h2>
          <p className="text-muted-foreground mb-6">Start your first project today.</p>
          <Link to="/auth?mode=signup">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Pricing;