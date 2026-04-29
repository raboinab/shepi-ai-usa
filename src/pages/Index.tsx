import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Play, Mail, Phone, MapPin, Upload, Sparkles, FileText, CheckCircle, Bot, TrendingUp, Shield, Layers, Menu, X, Loader2, Target, AlertTriangle, MessageSquare, BarChart3, Clock, DollarSign, Lock, Database, GitBranch, Users, Package, Calculator, PieChart, ClipboardCheck, FileOutput, Zap } from "lucide-react";
import ShepiLogo from "@/components/ShepiLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { hasOAuthCallback } from "@/lib/authUtils";
import { PRICING } from "@/lib/pricing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";


const Index = () => {
  const __seoTags = useSEO({
    title: "AI Quality of Earnings Software | QoE Analysis Platform | shepi",
    description: "AI quality of earnings analysis for M&A due diligence. Upload financials, get EBITDA adjustments and lender-ready QoE reports in hours. Quality of earnings AI built for deal teams, PE firms, and searchers.",
    canonical: "https://shepi.ai/",
    ogImage: "/og-image.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "shepi",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI-assisted Quality of Earnings analysis for M&A due diligence. Upload financials, get EBITDA adjustments, working capital analysis, and lender-ready QoE reports in hours.",
      url: "https://shepi.ai/",
      publisher: {
        "@type": "Organization",
        name: "shepi",
        url: "https://shepi.ai/",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "0",
        availability: "https://schema.org/InStock",
        url: "https://shepi.ai/pricing",
      },
    },
  });

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", company: "", role: "", interest: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;

    // If there are OAuth tokens in the hash, redirect to the callback page
    // This handles cases where OAuth might accidentally land here
    if (hasOAuthCallback()) {
      console.log('[Index] OAuth tokens detected, redirecting to /auth/callback');
      const hash = window.location.hash;
      window.location.replace(`/auth/callback${hash}`);
      return;
    }

    // Check for existing session
    const checkSession = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
        ]);

        if (result && 'data' in result && result.data.session?.user && isMounted) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error('[Index] Session check error:', error);
      }
      
      if (isMounted) {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const location = useLocation();

  // Handle hash scroll after auth check completes (DOM is ready)
  useEffect(() => {
    if (isCheckingAuth) return;
    const hash = location.hash;
    if (!hash) return;
    const id = hash.replace('#', '');
    requestAnimationFrame(() => {
      const el = document.getElementById(id) || document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [isCheckingAuth, location.hash]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: contactForm,
      });

      if (error) throw error;

      trackEvent("generate_lead", {
        form_location: "homepage_contact",
        has_company: !!contactForm.company,
        interest: contactForm.interest || undefined,
      });

      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setContactForm({ name: "", email: "", message: "", company: "", role: "", interest: "" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({ title: "Failed to send message", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOTE: All JSON-LD (SoftwareApplication, FAQPage) is now emitted via
  // useSEO({ jsonLd: ... }) at the top of this component using React 19
  // metadata hoisting, so it appears in the prerendered HTML for crawlers
  // without requiring JS execution. The Organization + WebSite schema is
  // declared statically in index.html.

  // Show loading spinner while checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary gap-4">
        {__seoTags}
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-foreground mx-auto mb-4" />
          <p className="text-primary-foreground/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Bleed Blue */}
      <section className="bg-primary min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="py-6 px-6 md:px-12 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <ShepiLogo variant="light" size="lg" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                How It Works
              </a>
              <a href="#our-story" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                About
              </a>
              <Link to="/resources" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Resources
              </Link>
              <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Pricing
              </Link>
              <a href="#contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Contact
              </a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Log In
                </Button>
              </Link>
              <Link to="/pricing">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Get Started
                </Button>
              </Link>
            </div>
            {/* Mobile hamburger button */}
            <button 
              className="md:hidden p-2 text-primary-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-primary border-t border-primary-foreground/10 py-6 px-6 z-50">
              <div className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a 
                  href="#our-story" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </a>
                <Link 
                  to="/resources" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Resources
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <a 
                  href="#contact" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
                <div className="flex flex-col gap-3 pt-4 border-t border-primary-foreground/10">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full text-primary-foreground hover:bg-primary-foreground/10">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-4xl text-center">
            <p className="text-lg md:text-xl text-primary-foreground/70 font-medium tracking-wide mb-4">
              Your Due Diligence Shepherd
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-primary-foreground mb-6 leading-tight text-center">
              AI-Assisted
              <br />
              Quality of Earnings Analysis
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-4 max-w-3xl mx-auto">
              From raw financials to lender-ready conclusions — in hours, not weeks.
            </p>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-6 max-w-3xl mx-auto">
              shepi lets you run a professional-grade Quality of Earnings analysis — identifying adjustments, risks, and normalized earnings through a structured, traceable workflow.
            </p>
            <p className="text-base md:text-lg text-primary-foreground/60 mb-10 max-w-2xl mx-auto italic">
              Built for deal professionals who need speed without sacrificing credibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 text-lg px-8 py-6">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard/demo">
                <Button size="lg" variant="outline" className="border-secondary text-secondary bg-transparent hover:bg-secondary/10 gap-2 text-lg px-8 py-6">
                  <Play className="w-5 h-5" /> Try Live Demo
                </Button>
              </Link>
              <Link to="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-secondary text-secondary bg-transparent hover:bg-secondary/10 gap-2 text-lg px-8 py-6"
                >
                  🎥 Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* The Problem Section */}
      <section className="bg-foreground py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-secondary/60 uppercase tracking-wider mb-4 block">The Problem</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-secondary mb-6">
              Due Diligence Shouldn't Slow Your Deal
            </h2>
            <p className="text-lg text-secondary/70 max-w-2xl mx-auto">
              For most buyers and advisors, Quality of Earnings analysis remains out of reach — too expensive, too slow, and too complex.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 border border-secondary/20 rounded-lg">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">$20K+</div>
              <p className="text-secondary/70">Traditional QoE costs are prohibitive for many buyers and smaller deals</p>
            </div>
            <div className="text-center p-8 border border-secondary/20 rounded-lg">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">4+ Weeks</div>
              <p className="text-secondary/70">Deals move fast — buyers can't wait months for proper due diligence</p>
            </div>
            <div className="text-center p-8 border border-secondary/20 rounded-lg">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">Limited Access</div>
              <p className="text-secondary/70">Only large PE firms and institutions can afford proper QoE analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Is Shepi? — The Solution */}
      <section className="bg-background py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">The Solution</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
              Too Small for Big 4. Too Complex for Excel.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Some deals under $10M may not get a proper Quality of Earnings analysis. shepi changes that.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">QoE Software, Not a Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                shepi produces the same structured analysis — EBITDA adjustments, working capital, proof of cash — without the traditional engagement timeline or price tag. Starting at $2,000 per deal.
              </p>
            </Card>

             <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Direct Accounting Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your accounting software, import trial balance, chart of accounts, and GL data in minutes. No manual exports or spreadsheet cleanup.
              </p>
            </Card>

            <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Structured, Lender-Ready Output</h3>
              <p className="text-muted-foreground leading-relaxed">
                EBITDA bridge, working capital, proof of cash, balance sheet — formatted for lender review and deal documentation.
              </p>
            </Card>
          </div>

          <p className="text-center text-muted-foreground italic max-w-3xl mx-auto mb-16">
            Think of it as the TurboTax of due diligence — structured, guided, and built for deals that don't need a lengthy accounting engagement.
          </p>


          {/* Competitive wedge */}
          <p className="text-center text-lg font-medium text-foreground mb-16">
            You control the timeline. No engagement letters, no waiting. Run your analysis today.
          </p>

          {/* Built For — persona blocks */}
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Built For</span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              From Screening to Close
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Independent Searchers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Screen deals in hours, not weeks. Get structured analysis before committing to a full engagement.
              </p>
            </Card>
            <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Brokers & Advisors</h3>
              <p className="text-muted-foreground leading-relaxed">
                Offer sell-side QoE as a differentiator. Help your clients present clean financials to buyers.
              </p>
            </Card>
            <Card className="p-8 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Accountants & CPAs</h3>
              <p className="text-muted-foreground leading-relaxed">
                Extend your capacity without adding headcount. Use shepi's workpapers as a head start on engagements.
              </p>
            </Card>
          </div>

          {/* CPA FAQ */}
          <div className="max-w-3xl mx-auto mb-16">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cpa-faq">
                <AccordionTrigger className="text-left text-foreground text-lg">
                  Does this replace a CPA engagement?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  For deals under $10M, many buyers don't need a formally attested QoE report — they need structured analysis they can trust. shepi produces that: EBITDA bridge, working capital, proof of cash, all from the same source data. If your lender requires CPA attestation, shepi's workpapers give your accountant a significant head start. For self-funded deals, search fund screening, and internal decision-making, shepi's output stands on its own.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Section CTA */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
              Due Diligence Shouldn't Take Weeks
            </h3>
            <p className="text-lg text-muted-foreground mb-6">$2,000 per project, results in hours.</p>
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="our-story" className="bg-secondary py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Our Story</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-8">
              A Systems Engineer Meets an M&A Professional
            </h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed mb-6 text-center">
              When a systems engineer searching for a business to buy met an M&A professional, they discovered a shared frustration: <span className="text-foreground font-semibold">Quality of Earnings analysis was too expensive and took too long.</span>
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 text-center">
              Traditional QoE reports cost $20K+ and take 4+ weeks — putting proper due diligence out of reach for searchers, slowing down deals, and forcing buyers to choose between speed and credibility.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              <span className="text-foreground font-semibold">We built shepi to change that.</span> By combining a structured analysis framework designed by M&A professionals, automated data processing, and AI-assisted insights, we're making QoE accessible, affordable, and fast — without sacrificing quality.
            </p>
          </div>
        </div>
      </section>

      {/* Why Shepi Section - Split Panel (formerly Our Journey) */}
      <section id="why-shepi" className="grid lg:grid-cols-2 min-h-[80vh]">
        {/* Left - Cream */}
        <div className="bg-secondary p-12 md:p-16 lg:p-20 flex flex-col justify-center">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Our Approach</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Why shepi
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            At shepi, we believe Quality of Earnings should be:
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">Fast</span> — Complete your analysis in hours, not weeks</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">Consistent</span> — Follow a proven methodology every time</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">Defensible</span> — Every adjustment is documented and traceable</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">Accessible</span> — Professional-grade analysis at a fraction of the cost</span>
            </li>
          </ul>
        </div>

        {/* Right - Primary/Blue */}
        <div className="bg-primary p-12 md:p-16 lg:p-20 flex flex-col justify-center">
          <span className="text-sm font-semibold text-primary-foreground/60 uppercase tracking-wider mb-4">Our Commitment</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-6">
            Built for Deal Professionals
          </h2>
          <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8">
            We understand the pressure of due diligence timelines. That's why we've built shepi to help you move faster while maintaining the rigor that lenders and investors expect.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">2–4 hrs</div>
              <p className="text-primary-foreground/70 text-sm">Initial analysis time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">100%</div>
              <p className="text-primary-foreground/70 text-sm">Adjustment traceability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-secondary py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Features</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              Everything You Need for QoE
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From data ingestion to final report, shepi provides a complete workflow for Quality of Earnings analysis.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Data Organization */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Structured Data Organization</h3>
              <p className="text-muted-foreground mb-4">Import trial balances, bank statements, and supporting documents. shepi organizes everything into a consistent framework.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Accounting Software integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Document parsing & extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Multi-period analysis
                </li>
              </ul>
            </div>

            {/* Feature 2 - Analysis Framework */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <GitBranch className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Professional Analysis Framework</h3>
              <p className="text-muted-foreground mb-4">Follow a structured methodology designed by M&A professionals. Every step is guided and documented.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  EBITDA adjustments workflow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Working capital analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Proof of cash reconciliation
                </li>
              </ul>
            </div>

            {/* Feature 3 - AI Insights */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI-Assisted Insights</h3>
              <p className="text-muted-foreground mb-4">Let AI help you identify anomalies, suggest adjustments, and validate your analysis against source documents.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Anomaly detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Adjustment suggestions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Document validation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-background py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Process</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps from raw data to professional QoE deliverables.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl">1</div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Import Data</h3>
              <p className="text-sm text-muted-foreground">Connect accounting software or upload trial balances and supporting documents.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl">2</div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Structure Analysis</h3>
              <p className="text-sm text-muted-foreground">shepi organizes your data and guides you through the QoE framework.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl">3</div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">Get AI-suggested adjustments and validate findings against source documents.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl">4</div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Deliver Results</h3>
              <p className="text-sm text-muted-foreground">Export professional QoE workbooks and reports ready for lenders.</p>
            </div>
          </div>

          {/* What You'll Need callout */}
          <div className="mt-16 border border-border rounded-xl bg-card p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground text-center mb-2">What You'll Need</h3>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              Most of this comes from the seller's data room. Start with the Required items — add the rest as you receive them.
            </p>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Required */}
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-destructive mb-3">Required</span>
                <ul className="space-y-2">
                  {["Trial Balance", "Chart of Accounts", "Bank Statements", "General Ledger"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Recommended */}
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">Recommended</span>
                <ul className="space-y-2">
                  {["AR & AP Aging", "Payroll Reports", "Fixed Asset Schedule", "Tax Returns (3 years)", "Journal Entries", "Credit Card Statements", "Customer & Vendor Lists", "Inventory Records", "Debt Schedule", "Material Contracts & Leases", "Supporting Documents", "Job Cost Reports / WIP Schedule"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Optional */}
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Optional</span>
                <ul className="space-y-2">
                  {["Income Statements", "Balance Sheets", "Cash Flow Statements", "CIM / Offering Memo"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-secondary py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
          </div>
          
          {/* Data & Security */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Data & Security</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="security-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  How is my deal data protected?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your deal information is isolated to your account with strict access controls. We use enterprise-grade infrastructure with SOC 2 Type II compliant hosting. Only you can access your projects — not even our support team can view your analysis without explicit permission.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Is my deal data used to train AI models?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  No. Your deal data is never used to train AI models. Period. Your financial information, adjustments, and analysis remain completely private. The AI assistance you receive is powered by models trained on public financial knowledge — not your confidential deal information.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security-3" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can other users see my analysis or data?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  No. Each project is completely isolated to your account. There's no shared database, no cross-user visibility, and no way for other users to access your work. When you export your analysis, you control who has access to those files.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security-4" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can I delete my data after completing a project?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes. You can delete any project at any time, which permanently removes all associated data including uploaded documents, analysis, and adjustments. Once deleted, the data cannot be recovered. We also automatically purge deleted data from our backups within 30 days.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* What Shepi Is */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">What shepi Is</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="what-is-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  What exactly does shepi do?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi is a QoE analysis platform built on three pillars: a structured analysis framework designed by M&A professionals, automated data processing that transforms raw financials in minutes, and AI-powered document extraction for complex forms. Connect to QuickBooks for automatic data import, or upload PDFs — our AI extracts structured data from tax returns, payroll reports, and contracts without manual data entry. The result: data room files become analysis-ready in minutes, not days.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="what-is-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  How is shepi different from using Excel templates?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Excel templates give you a blank structure and hours of manual work. shepi gives you automated processing plus a guided workflow. Key differences: Connect to QuickBooks and import mapped data instantly — work that takes 8-12 hours manually. AI extracts structured data from tax returns, payroll, debt schedules, and contracts — no manual data entry. Multi-period normalization and IS/BS reconciliation happen automatically. A proven 6-phase workflow mirrors how experienced analysts work. You focus on analysis and judgment, not data wrangling.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* What shepi Is NOT */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">What shepi Is NOT</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="not-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Does shepi replace a formal Quality of Earnings report from a CPA firm?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi produces comprehensive QoE analysis from the same source data a CPA firm would use — trial balances, financial statements, and supporting documents. For transactions requiring CPA attestation (lender requirements, regulatory compliance), shepi accelerates that engagement by producing CPA-ready workpapers. The difference between shepi and a CPA firm isn't the analysis methodology — it's the attestation letter and professional liability coverage.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="not-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Does shepi calculate final EBITDA or provide a valuation?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi helps you build an EBITDA bridge by tracking and categorizing your adjustments, but the final numbers reflect YOUR judgment, not ours. We don't calculate valuation multiples or opine on what a business is worth. Our role is to help you organize and document the analysis — the conclusions are yours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="not-3" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can I show shepi output directly to lenders or investors?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes — shepi output is complete, professional-quality QoE analysis that exports to PDF and Excel for sharing. For investor presentations and internal decision-making, shepi delivers institutional-grade workpapers. If your lender specifically requires CPA-attested reports for financing, shepi provides the analytical foundation that accelerates that formal engagement.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="not-4" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Does shepi certify or guarantee the accuracy of the analysis?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  No. shepi structures your analysis and provides AI-powered suggestions, but every adjustment is entered and approved by you. We don't audit source documents, verify management representations, or certify results. The accuracy of your analysis depends on the quality of data you provide and the judgment calls you make.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="not-5" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  How reliable is shepi's analysis compared to what a CPA firm would produce?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi's methodology and spreadsheet structure were developed by an M&A professional with years of hands-on QoE experience. The workflow, adjustment categories, and output format mirror what you'd see from a quality accounting firm. For clean deals with good data and careful analysis, shepi produces results that are functionally equivalent to what a CPA firm would deliver. The difference isn't in methodology — it's in who signs off on it. That said, garbage in, garbage out. shepi is a tool that structures and accelerates your analysis — it doesn't fix bad data or substitute for sound judgment.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* How It Works */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">How It Works</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="how-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  What documents do I need to get started?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-3">Once you have access to the seller's data room (typically after LOI), you'll gather documents in three tiers:</p>
                  <p className="mb-2"><strong className="text-foreground">Required</strong> — You need these to begin:</p>
                  <ul className="list-disc list-inside mb-3 ml-2 space-y-1">
                    <li>Detailed Trial Balance (QuickBooks export or Excel)</li>
                    <li>Chart of Accounts</li>
                    <li>Bank Statements (covering full review period)</li>
                    <li>General Ledger</li>
                  </ul>
                  <p className="mb-2"><strong className="text-foreground">Recommended</strong> — For a professional-grade analysis:</p>
                  <ul className="list-disc list-inside mb-3 ml-2 space-y-1">
                    <li>AR & AP Aging Reports</li>
                    <li>Payroll Reports/Registers</li>
                    <li>Fixed Asset / Depreciation Schedule</li>
                    <li>Tax Returns (3 years)</li>
                    <li>Journal Entries</li>
                    <li>Credit Card Statements</li>
                    <li>Customer & Vendor Lists</li>
                    <li>Inventory Records</li>
                    <li>Debt Schedule</li>
                    <li>Material Contracts & Lease Agreements</li>
                    <li>Supporting Documents</li>
                  </ul>
                  <p className="mb-2"><strong className="text-foreground">Optional</strong> — For verification & reference:</p>
                  <ul className="list-disc list-inside mb-3 ml-2 space-y-1">
                    <li>Income Statements</li>
                    <li>Balance Sheets</li>
                    <li>Cash Flow Statements</li>
                    <li>CIM / Offering Memo</li>
                  </ul>
                  <p>Start with the Required documents — you can add Recommended and Optional items as you receive them.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  How many years of financial data are required?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi requires 3 full fiscal years of historical data plus the current year-to-date period. This enables proper trending analysis, LTM (Last Twelve Months) calculations, and year-over-year comparisons that lenders and buyers expect.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-3" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  What file formats can I upload?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi is optimized for QuickBooks — the accounting system used by 80%+ of small businesses in the US. Connect directly to QuickBooks Online for automatic data import, or upload QuickBooks Desktop exports. We also accept PDF financial statements for AI extraction (tax returns, payroll reports, contracts, debt schedules) and standard Excel/CSV files for trial balance data.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-4" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can I connect directly to QuickBooks?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes — QuickBooks is our primary integration since it powers the vast majority of small business accounting in the US. Connect your client's QuickBooks Online account, select the periods you need, and shepi imports trial balance, chart of accounts, and general ledger data automatically. No manual exports, no format issues.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-5" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  How quickly can I complete an analysis?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Most users complete initial analysis in 2-4 hours vs. 40+ hours manually. The biggest time savings come from automatic account mapping (saves 8-12 hours), built-in calculations and reconciliations, and structured workflow that eliminates setup time. Your actual time depends on deal complexity and data quality, but expect 80-90% time reduction compared to building from scratch in Excel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-6" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  What do I get at the end?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  A complete analysis package including: EBITDA bridge with categorized adjustments, multi-period income statement and balance sheet analysis, working capital analysis with DSO/DPO/DIO metrics, customer and vendor concentration analysis, documented adjustment rationales with proof attachments. Everything exports to a professional PDF report and Excel workbook for sharing with stakeholders, lenders, or advisors.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-7" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                   What role does AI actually play in shepi?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p className="mb-3">AI in shepi serves four functions:</p>
                  <p className="mb-2"><strong className="text-foreground">Document Extraction</strong> — When you upload complex documents like tax returns (1040, 1120, 1120S, 1065), payroll reports, debt schedules, or material contracts, AI reads and extracts structured data automatically. No manual data entry required.</p>
                  <p className="mb-2"><strong className="text-foreground">Identification</strong> — AI scans your general ledger and bank transactions to surface potential adjustments (personal expenses, non-recurring items, related party transactions) for your review.</p>
                  <p className="mb-2"><strong className="text-foreground">Education</strong> — Explains QoE concepts, adjustment types, and industry norms in plain language so you understand the "why" behind every step.</p>
                  <p className="mb-3"><strong className="text-foreground">Assistance</strong> — The QoE Assistant answers questions about your specific analysis in real-time, helping you understand what experienced analysts would look for.</p>
                  <p><strong className="text-foreground">Important:</strong> AI never auto-generates adjustments or final numbers. Every adjustment is human-entered and human-approved. AI surfaces possibilities — you make the decisions.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-8" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  What happens if my financial data is messy or incomplete?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Real deals are messy — we get it. shepi will warn you about potential issues (missing periods, unbalanced accounts, incomplete trial balances) but won't block your progress. You can proceed with imperfect data and document your assumptions. The warnings help you know what to address, but you decide what's acceptable for your analysis.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Pricing & Value */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pricing & Value</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="pricing-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Why does shepi cost {PRICING.perProject.display} per project?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Consider the alternatives: DIY in Excel with a junior analyst at $50-100/hour spending 40+ hours = $2,000-4,000 in labor; Outsourcing to a CPA firm for sell-side QoE runs $15,000-50,000+; With shepi, complete analysis in hours, not weeks, for {PRICING.perProject.display}. At {PRICING.perProject.display}, you're paying roughly $100-200/hour for the time you actually spend — but you're getting the structure, consistency, and AI assistance that would otherwise require an experienced analyst.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pricing-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  When should I choose per-project vs. monthly?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Per-project ({PRICING.perProject.display}): Best if you're analyzing 1-4 deals and want to pay only for what you use. Monthly ({PRICING.monthly.display}): Best if you're actively searching and expect 5+ deals, or if you want the flexibility to revisit analyses without worrying about project limits.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pricing-3" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Is there a free trial?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We don't currently offer a free trial, but we're confident in the value. If you complete an analysis and don't find it valuable, reach out to our team — we stand behind the product.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Who It's For */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Who It's For</h3>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="who-1" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Is shepi right for independent searchers doing their own diligence?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes — searchers are one of our primary users. shepi is designed for post-LOI due diligence, once the seller opens the data room and you have access to financials. With just the core documents (trial balance, chart of accounts, bank statements, and general ledger), you can start your analysis immediately and add supporting documents as they arrive. Use shepi to complete your analysis in hours instead of weeks, build professional EBITDA bridges with documented adjustments, identify red flags while you still have negotiating leverage, and create work product you can share with lenders or partners. For self-funded deals, this may be all the QoE you need. If your deal requires SBA or other lender financing, you'll likely still need formal QoE from a CPA firm — but having done the work in shepi puts you ahead and helps you catch issues early.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="who-2" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can I compare analysis across multiple deals?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes. Your dashboard shows all your projects with key metrics for quick comparison. While each analysis is independent, you can easily reference previous deals to calibrate your approach. Many searchers find this valuable for developing pattern recognition across similar businesses or industries.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="who-3" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Does shepi handle industry-specific adjustments?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi's adjustment framework covers common categories across industries — owner compensation, one-time expenses, related party transactions, etc. The AI assistant understands industry-specific considerations (SaaS metrics, manufacturing working capital, healthcare reimbursement) and can guide you on what to look for. The structure is flexible enough to capture any adjustment type, and industry context helps the AI provide more relevant suggestions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="who-4" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Can accounting firms and advisors use shepi?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Absolutely. Firms use shepi to extend capacity without adding headcount, standardize QoE output across team members, accelerate sell-side QoE preparation, and train junior staff on QoE methodology. The Enterprise plan includes features specifically for teams: collaboration tools, custom templates, and volume pricing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="who-5" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-foreground">
                  Who should NOT use shepi?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  shepi may not be right for you if: You need a CPA-certified QoE report (we don't provide certification); Your lender has specific QoE vendor requirements; You're looking for a valuation tool (we focus on earnings quality, not valuation); You want the AI to "do it for you" (we assist, you decide).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="bg-background py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Our Approach</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              Three Pillars of shepi
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines professional methodology, intelligent automation, and AI assistance to deliver fast, reliable QoE analysis.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Structured Framework</h3>
              <p className="text-muted-foreground mb-4">
                A methodology designed by M&A professionals ensures consistency and completeness in every analysis.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Proven QoE methodology
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Guided step-by-step workflow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Built-in best practices
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Intelligent Data Processing</h3>
              <p className="text-muted-foreground mb-4">
                Automated data extraction and organization eliminates hours of manual work and reduces errors.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Automatic data extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Smart document parsing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Cross-reference validation
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI-Powered Insights</h3>
              <p className="text-muted-foreground mb-4">
                AI assists with anomaly detection, adjustment suggestions, and document validation — all with full transparency.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Anomaly detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Adjustment recommendations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Source document validation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-primary-foreground mb-6">
            Ready to Transform Your Due Diligence?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join the professionals who are already using shepi to deliver faster, more consistent Quality of Earnings analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 text-lg px-8 py-6">
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline" className="border-secondary text-secondary bg-transparent hover:bg-secondary/10 text-lg px-8 py-6">
                Request a Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-secondary py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Contact</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Get in Touch
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Have questions about shepi? Want to see a demo? We'd love to hear from you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href="mailto:hello@shepi.ai" className="text-foreground hover:text-primary">hello@shepi.ai</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-lg border border-border">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">Company</label>
                  <input
                    type="text"
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your company (optional)"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">I am a…</label>
                    <select
                      id="role"
                      value={contactForm.role}
                      onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select your role</option>
                      <option value="Searcher / Buyer">Searcher / Buyer</option>
                      <option value="Broker / Advisor">Broker / Advisor</option>
                      <option value="Accountant / CPA">Accountant / CPA</option>
                      <option value="PE / Family Office">PE / Family Office</option>
                      <option value="Lender">Lender</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-foreground mb-2">Interested in…</label>
                    <select
                      id="interest"
                      value={contactForm.interest}
                      onChange={(e) => setContactForm({ ...contactForm, interest: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a plan</option>
                      <option value="Per Project">Per Project</option>
                      <option value="Done-For-You">Done-For-You</option>
                      <option value="Monthly Subscription">Monthly Subscription</option>
                      <option value="Firm Edition">Firm Edition</option>
                      <option value="Just Exploring">Just Exploring</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">Message *</label>
                  <textarea
                    id="message"
                    rows={6}
                    maxLength={5000}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    placeholder="How can we help?"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">{contactForm.message.length.toLocaleString()} / 5,000</p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="bg-background py-10 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-2">Prefer a live conversation?</p>
          <a
            href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2qE2ZwYpCRi1MB-Ms9GnB1K7K3PpPCYankr9qdPiyVQYN8TqT9ZnkFuBz4mGlT4Lj0OukzYIrG?gv=true"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-4 transition-colors"
          >
            View available times →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div>
              <ShepiLogo variant="light" size="md" />
              <p className="text-secondary/70 mt-4 text-sm">
                AI-assisted Quality of Earnings analysis for modern deal professionals.
              </p>
            </div>
            <div>
              <h4 className="text-secondary font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-secondary/70 hover:text-secondary text-sm">Features</a></li>
                <li><a href="#how-it-works" className="text-secondary/70 hover:text-secondary text-sm">How It Works</a></li>
                <li><Link to="/pricing" className="text-secondary/70 hover:text-secondary text-sm">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-secondary font-semibold mb-4">Quality of Earnings</h4>
              <ul className="space-y-2">
                <li><Link to="/quality-of-earnings-cost" className="text-secondary/70 hover:text-secondary text-sm">QoE Cost</Link></li>
                <li><Link to="/quality-of-earnings-software" className="text-secondary/70 hover:text-secondary text-sm">QoE Software</Link></li>
                <li><Link to="/quality-of-earnings-template" className="text-secondary/70 hover:text-secondary text-sm">QoE Template</Link></li>
                <li><Link to="/quality-of-earnings-checklist" className="text-secondary/70 hover:text-secondary text-sm">QoE Checklist</Link></li>
                <li><Link to="/resources" className="text-secondary/70 hover:text-secondary text-sm">All Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-secondary font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#our-story" className="text-secondary/70 hover:text-secondary text-sm">About</a></li>
                <li><a href="#contact" className="text-secondary/70 hover:text-secondary text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-secondary font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-secondary/70 hover:text-secondary text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-secondary/70 hover:text-secondary text-sm">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-secondary/70 hover:text-secondary text-sm">Cookie Policy</Link></li>
                <li><Link to="/eula" className="text-secondary/70 hover:text-secondary text-sm">EULA</Link></li>
                <li><Link to="/dpa" className="text-secondary/70 hover:text-secondary text-sm">DPA</Link></li>
                <li><Link to="/subprocessors" className="text-secondary/70 hover:text-secondary text-sm">Subprocessors</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary/20 pt-8">
            <p className="text-secondary/60 text-sm text-center">
              © 2026 SMB EDGE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
