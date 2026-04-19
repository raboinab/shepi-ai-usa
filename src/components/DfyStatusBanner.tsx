import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Eye, CheckCircle, MessageCircle } from "lucide-react";
import { EngagementChat } from "@/components/EngagementChat";
import { toast } from "@/hooks/use-toast";
import { PRICING } from "@/lib/pricing";

interface DfyStatusBannerProps {
  projectId: string;
  serviceTier: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  unclaimed: {
    label: "Awaiting Assignment",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Your project is in our queue and will be assigned to a professional analyst shortly.",
  },
  in_progress: {
    label: "In Progress",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "A professional analyst is actively working on your Quality of Earnings analysis.",
  },
  review: {
    label: "Under Review",
    icon: Eye,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Your analysis is being reviewed for quality assurance before delivery.",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Your professional analysis has been completed and delivered.",
  },
};

export const DfyStatusBanner = ({ projectId, serviceTier }: DfyStatusBannerProps) => {
  const [status, setStatus] = useState<string>("unclaimed");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [isUpgradeEligible, setIsUpgradeEligible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (serviceTier === "done_for_you") {
        const { data } = await supabase
          .from("cpa_claims")
          .select("status")
          .eq("project_id", projectId)
          .maybeSingle();
        setStatus(data?.status || "unclaimed");
      } else {
        // Check if project is eligible for prorated upgrade ($1,500 vs $3,500)
        const [{ data: payment }, { data: project }] = await Promise.all([
          supabase
            .from("project_payments")
            .select("status")
            .eq("project_id", projectId)
            .eq("status", "paid")
            .maybeSingle(),
          supabase
            .from("projects")
            .select("funded_by_credit")
            .eq("id", projectId)
            .maybeSingle(),
        ]);
        setIsUpgradeEligible(!!payment || !!project?.funded_by_credit);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId, serviceTier]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", description: "You need to be signed in to upgrade.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planType: "done_for_you", projectId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Upgrade failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return null;

  // Show upgrade CTA for non-DFY projects
  if (serviceTier !== "done_for_you") {
    const upgradePrice = isUpgradeEligible ? PRICING.dfyUpgradeFromPerProject.display : PRICING.doneForYou.display;
    return (
      <Alert className="bg-accent/50 border-accent mb-4 mx-4 mt-4">
        <Briefcase className="h-4 w-4" />
        <AlertTitle>Want a professional analyst?</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            Upgrade to Done-For-You and let a CPA handle your Quality of Earnings analysis end-to-end.
            {isUpgradeEligible && (
              <span className="block text-xs text-muted-foreground mt-1">
                $2,000 credit applied from your existing project payment.
              </span>
            )}
          </span>
          <Button
            variant="default"
            size="sm"
            className="shrink-0"
            onClick={handleUpgrade}
            disabled={upgrading}
          >
            {upgrading ? "Redirecting…" : `Upgrade — ${upgradePrice}`}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const config = statusConfig[status] || statusConfig.unclaimed;
  const Icon = config.icon;

  return (
    <>
    <Alert className={`${config.color} border mb-4`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Done-For-You Analysis
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{config.description}</span>
        {status !== "unclaimed" && (
          <Button
            variant="outline"
            size="sm"
            className="ml-4 shrink-0 gap-1"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Message Your Analyst
          </Button>
        )}
      </AlertDescription>
    </Alert>
    {chatOpen && status !== "unclaimed" && (
      <div className="mb-4">
        <EngagementChat
          projectId={projectId}
          onClose={() => setChatOpen(false)}
          selfLabel="You"
          otherLabel="Analyst"
        />
      </div>
    )}
    </>
  );
};
