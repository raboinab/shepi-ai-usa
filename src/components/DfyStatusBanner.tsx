import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase, Clock, Eye, CheckCircle, MessageCircle, UserCheck, ShieldCheck,
} from "lucide-react";
import { EngagementChat } from "@/components/EngagementChat";
import { toast } from "@/hooks/use-toast";
import { PRICING } from "@/lib/pricing";

interface DfyStatusBannerProps {
  projectId: string;
  serviceTier: string;
}

type ClaimStatus =
  | "unclaimed"
  | "proposed"
  | "accepted"
  | "in_review"
  | "completed"
  | "withdrawn"
  // legacy
  | "in_progress"
  | "review"
  | "delivered";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  unclaimed: {
    label: "Awaiting CPA",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Your project is in our queue. A licensed CPA reviewer will claim it shortly.",
  },
  proposed: {
    label: "CPA Assigned — Pending Your Approval",
    icon: UserCheck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "A CPA has been matched to your project. Review their profile and accept to begin.",
  },
  accepted: {
    label: "CPA Confirmed",
    icon: ShieldCheck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Your CPA reviewer is confirmed and will begin reviewing adjustments shortly.",
  },
  in_review: {
    label: "Under CPA Review",
    icon: Eye,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Your CPA reviewer is working through each AI-flagged adjustment.",
  },
  completed: {
    label: "Review Complete",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Your CPA reviewer has completed the engagement.",
  },
  withdrawn: {
    label: "Reassigning CPA",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "The previous CPA stepped back. We're matching you with another reviewer.",
  },
  // legacy aliases — render gracefully if old data still exists
  in_progress: {
    label: "In Progress",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Your CPA reviewer is actively working on your Quality of Earnings analysis.",
  },
  review: {
    label: "Under Review",
    icon: Eye,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Your analysis is being reviewed for quality assurance.",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Your analysis has been completed and delivered.",
  },
};

interface ReviewerProfile {
  full_name: string;
  state_of_licensure: string;
  years_experience: number | null;
  bio: string | null;
}

export const DfyStatusBanner = ({ projectId, serviceTier }: DfyStatusBannerProps) => {
  const [status, setStatus] = useState<ClaimStatus>("unclaimed");
  const [claimId, setClaimId] = useState<string | null>(null);
  const [autoAccepted, setAutoAccepted] = useState(false);
  const [reviewer, setReviewer] = useState<ReviewerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [isUpgradeEligible, setIsUpgradeEligible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (serviceTier === "done_for_you") {
        const { data: claim } = await supabase
          .from("cpa_claims")
          .select("id, status, cpa_user_id, accepted_by_user_id, accepted_at")
          .eq("project_id", projectId)
          .order("claimed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (claim) {
          setClaimId(claim.id);
          setStatus((claim.status as ClaimStatus) || "unclaimed");
          setAutoAccepted(
            !!claim.accepted_at && claim.accepted_by_user_id == null,
          );
          // RLS: project members can view assigned CPA profile
          const { data: profile } = await supabase
            .from("cpa_profiles")
            .select("full_name, state_of_licensure, years_experience, bio")
            .eq("user_id", claim.cpa_user_id)
            .maybeSingle();
          if (profile) setReviewer(profile as ReviewerProfile);
        } else {
          setStatus("unclaimed");
        }
      } else {
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

  const handleAccept = async () => {
    if (!claimId) return;
    setAccepting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("cpa_claims")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: user?.id,
        })
        .eq("id", claimId);
      if (error) throw error;
      setStatus("accepted");
      toast({ title: "Reviewer confirmed", description: "Your CPA will begin reviewing shortly." });
    } catch (err: any) {
      toast({ title: "Could not accept", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  const handleRequestDifferent = async () => {
    if (!claimId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("cpa_notifications").insert({
        user_id: user!.id, // self-notify; admin will see via RLS policy "Admins view all"
        event_type: "client_requested_reassignment",
        title: "Client requested a different reviewer",
        body: `Project ${projectId} client asked for a different CPA.`,
        link: `/admin/dfy-engagements`,
        payload: { project_id: projectId, claim_id: claimId },
      });
      toast({
        title: "Request sent",
        description: "Our team will match you with another reviewer.",
      });
    } catch (err: any) {
      toast({ title: "Could not send request", description: err.message, variant: "destructive" });
    }
  };

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
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Upgrade failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return null;

  // Non-DFY upgrade CTA
  if (serviceTier !== "done_for_you") {
    const upgradePrice = isUpgradeEligible ? PRICING.dfyUpgradeFromPerProject.display : PRICING.doneForYou.display;
    return (
      <Alert className="bg-accent/50 border-accent mb-4 mx-4 mt-4">
        <Briefcase className="h-4 w-4" />
        <AlertTitle>Want a CPA reviewer on your analysis?</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            Upgrade to Done-For-You and have a licensed CPA review every adjustment before delivery.
            {isUpgradeEligible && (
              <span className="block text-xs text-muted-foreground mt-1">
                {PRICING.perProject.display} credit applied from your existing project payment.
              </span>
            )}
          </span>
          <Button variant="default" size="sm" className="shrink-0" onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? "Redirecting…" : `Upgrade — ${upgradePrice}`}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const config = statusConfig[status] || statusConfig.unclaimed;
  const Icon = config.icon;
  const isActive = ["accepted", "in_review", "completed", "in_progress", "review", "delivered"].includes(status);

  return (
    <div className="mb-4 space-y-3">
      <Alert className={`${config.color} border`}>
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Done-For-You Analysis
          <Badge variant="outline" className={config.color}>{config.label}</Badge>
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{config.description}</span>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0 gap-1"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Message Reviewer
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {reviewer && status !== "unclaimed" && status !== "withdrawn" && (
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your CPA Reviewer</p>
              <p className="font-semibold text-foreground">{reviewer.full_name}, CPA</p>
              <p className="text-sm text-muted-foreground">
                Licensed in {reviewer.state_of_licensure}
                {reviewer.years_experience ? ` • ${reviewer.years_experience}+ yrs experience` : ""}
              </p>
              {reviewer.bio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{reviewer.bio}</p>
              )}
            </div>
            {status === "proposed" && (
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button size="sm" onClick={handleAccept} disabled={accepting}>
                  {accepting ? "Confirming…" : "Confirm reviewer"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleRequestDifferent}>
                  Request different reviewer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {chatOpen && isActive && (
        <EngagementChat
          projectId={projectId}
          onClose={() => setChatOpen(false)}
          selfLabel="You"
          otherLabel="Reviewer"
        />
      )}
    </div>
  );
};
