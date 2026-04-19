import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTosAcceptance } from "@/hooks/useTosAcceptance";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";

interface DemoAuthGateProps {
  page: string;
  children: ReactNode;
}

export function DemoAuthGate({ page, children }: DemoAuthGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { hasAccepted, loading: tosLoading, recordAcceptance } = useTosAcceptance();
  const viewLogged = useRef(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate(`/auth?mode=signup&redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else {
        setIsAuthed(true);
      }
      setAuthChecked(true);
    });
  }, [navigate, location.pathname]);

  // Log demo view once auth + ToS are both satisfied
  useEffect(() => {
    if (!isAuthed || !hasAccepted || viewLogged.current) return;
    viewLogged.current = true;

    // GA4: demo started
    trackEvent("demo_started", { page });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("demo_views" as any)
        .insert({ user_id: session.user.id, page })
        .then(({ error }) => {
          if (error) console.error("[DemoAuthGate] Failed to log demo view:", error);
        });

      // Fire-and-forget admin notification
      const userEmail = session.user.email ?? "unknown";
      const userName = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "Unknown";
      supabase.functions.invoke("notify-admin", {
        body: { event_type: "demo_view", user_email: userEmail, user_name: userName, page },
      }).catch((err) => console.error("[DemoAuthGate] notify-admin error:", err));
    });
  }, [isAuthed, hasAccepted, page]);

  // Show spinner while checking auth or ToS
  if (!authChecked || tosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  // Not authed — redirect already fired
  if (!isAuthed) return null;

  // ToS not accepted — show blocking modal
  if (!hasAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TermsAcceptanceModal
          open={true}
          onOpenChange={() => {}} // non-dismissable
          onAccepted={() => {
            // Force re-render by triggering a state update — useTosAcceptance will re-check
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
