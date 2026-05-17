import { Link } from "react-router-dom";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { CpaApplicationForm } from "@/components/cpa/CpaApplicationForm";

const howItWorks = [
  {
    n: "1",
    title: "Apply and get verified.",
    body: "License check, background, brief interview. We're selective — typical admission rate around 5–10%.",
  },
  {
    n: "2",
    title: "Pick up engagements you want.",
    body: "Browse open DFY projects in our queue. Accept the ones that fit your schedule and clear your conflict screen. No quotas, no exclusivity.",
  },
  {
    n: "3",
    title: "Do the work, sign it, get paid.",
    body: "Use shepi's software to do the mechanical lifting. Bring your professional judgment. Sign the deliverable in your professional capacity. We handle billing and pay you per engagement.",
  },
];

const whatYouGet = [
  "Quality deals routed to you (we vet Clients before they reach you)",
  "Software that handles the keystroke work — focus on judgment, not data entry",
  "Professional liability covered by our $1M+ umbrella (no need for your own E&O policy)",
  "Predictable per-engagement payment, paid promptly after completion",
  "Your workpapers stay yours, downloadable anytime, forever",
  "Direct CPA-to-Client communication — no gatekeeping",
];

const whatWeAsk = [
  "Active, unrestricted CPA license in any US state",
  "If you have a day job at a CPA firm: you've checked that side work is permitted (or you're independent)",
  "You disclose independence conflicts before accepting any engagement",
  "You meet our response time and quality standards (we'll show you what those are at onboarding)",
];

export default function CpaPartners() {
  const __seoTags = useSEO({
    title: "Join the shepi Network — CPA Partners",
    description:
      "shepi connects licensed CPAs with M&A deal teams that need Quality of Earnings analyses. Stay independent, set your hours, put your license on real work — backed by our $1M+ professional liability umbrella.",
    canonical: "https://shepi.ai/cpa-partners",
  });

  return (
    <LegalPageLayout title="A modern way to pick up QoE work.">
      {__seoTags}

      <p className="text-lg text-muted-foreground mb-10">
        shepi connects licensed CPAs with M&amp;A deal teams that need Quality of Earnings analyses.
        You stay independent, set your hours, and put your license on real work — backed by our $1M+
        professional liability umbrella and our software that handles the mechanical heavy lifting.
      </p>

      <div className="not-prose mb-12">
        <Button asChild size="lg">
          <a href="#apply">Apply to the shepi Network</a>
        </Button>
      </div>

      <h2>How it works</h2>
      <ol className="not-prose space-y-6 my-8">
        {howItWorks.map((step) => (
          <li key={step.n} className="flex gap-4">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {step.n}
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2>What you get</h2>
      <ul className="not-prose space-y-3 my-6">
        {whatYouGet.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>

      <h2>What we ask</h2>
      <ul className="not-prose space-y-3 my-6">
        {whatWeAsk.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>

      <div className="not-prose mt-12 p-6 rounded-lg border border-border bg-muted/30">
        <h3 className="text-xl font-semibold mb-2">Ready to apply?</h3>
        <p className="text-muted-foreground mb-4">
          Send us your name, state of licensure, license number, and a short note about your QoE
          or transaction-services background. We'll come back within 3 business days.
        </p>
        <Button asChild>
          <a href="mailto:partners@shepi.ai?subject=shepi%20Network%20Application">
            Apply to the shepi Network
          </a>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-10">
        Questions before applying? Email{" "}
        <a href="mailto:partners@shepi.ai" className="text-primary hover:underline">
          partners@shepi.ai
        </a>{" "}
        or read our <Link to="/compare/ai-qoe-vs-traditional" className="text-primary hover:underline">DIY vs. DFY vs. Traditional comparison</Link> to see where Network CPAs fit.
      </p>
    </LegalPageLayout>
  );
}
