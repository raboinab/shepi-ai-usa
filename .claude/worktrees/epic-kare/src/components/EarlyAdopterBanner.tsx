import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const EarlyAdopterBanner = () => {
  const [spots, setSpots] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from("promo_config")
        .select("value")
        .eq("key", "early_adopter_spots")
        .single();

      if (!error && data) {
        setSpots(data.value as number);
      }
    };
    fetchSpots();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText("EARLY50");
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Promo code EARLY50 copied to clipboard." });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Hide while loading or when sold out
  if (spots === null || spots <= 0) return null;

  const progressPercent = (spots / 50) * 100;

  return (
    <section className="relative overflow-hidden py-12 md:py-16 px-6 md:px-12 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border-y border-amber-500/20">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge with LIVE indicator */}
        <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Limited Time Offer
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-3">
          Founder Pricing — 50% Off, Limited Spots
        </h2>
        <p className="text-muted-foreground mb-2 max-w-2xl mx-auto">
          Lock in exclusive pricing before rates increase. Only <strong className="text-foreground">{spots} of 50</strong> spots remaining.
        </p>

        {spots <= 15 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
            {spots <= 5 ? "Only a few spots left." : "Availability is limited."}
          </p>
        )}

        {/* Progress bar */}
        <div className="max-w-md mx-auto mb-8">
          <Progress value={progressPercent} className="h-3 bg-muted" />
          <p className="text-xs text-muted-foreground mt-2">{spots} spots remaining</p>
        </div>

        {/* Promo code */}
        <div className="flex justify-center mb-8">
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 text-base font-mono bg-amber-500/10 border border-amber-500/20 rounded-lg px-5 py-2.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            EARLY50
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Promo cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          {/* Per Project */}
          <div className="rounded-xl border border-amber-500/30 bg-card p-6 text-left shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 block">Per Project</span>
            <div className="text-3xl font-bold text-foreground mb-1">$1,000</div>
            <p className="text-sm text-muted-foreground">
              <span className="line-through">$2,000</span> — 50% off per project
            </p>
          </div>

          {/* Monthly */}
          <div className="rounded-xl border border-amber-500/30 bg-card p-6 text-left shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 block">Monthly Plan</span>
            <div className="text-3xl font-bold text-foreground mb-1">$2,000<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <p className="text-sm text-muted-foreground">
              <span className="line-through">$4,000/mo</span> — 50% off for 12 months
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link to="/pricing">
          <Button size="lg" className="gap-2 text-lg px-8 py-6">
            View Pricing <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default EarlyAdopterBanner;
