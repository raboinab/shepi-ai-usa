import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";

// Supabase Auth OAuth namespace is beta; provide a small typed wrapper.
interface OAuthAuthorizationApi {
  getAuthorizationDetails: (authorizationId: string) => Promise<{
    data: {
      redirect_url?: string;
      redirect_to?: string;
      client?: { name?: string };
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (authorizationId: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (authorizationId: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
}

function oauthApi(): OAuthAuthorizationApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthAuthorizationApi;
}

export default function OAuthConsent() {
  const __seoTags = useSEO({
    title: "Connect an AI assistant — Shepi",
    description: "Approve an AI assistant to access your Shepi data via the Model Context Protocol.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const authorizationId = searchParams.get("authorization_id") ?? "";
  const [details, setDetails] = useState<{
    client?: { name?: string };
    redirect_url?: string;
    redirect_to?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!authorizationId) {
        return setError("Missing authorization_id");
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the full consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?redirect=" + encodeURIComponent(next);
        return;
      }

      const api = oauthApi();
      if (!api) {
        return setError("OAuth authorization API is not available.");
      }

      const { data, error: apiError } = await api.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (apiError) return setError(apiError.message);

      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }

      setDetails(data);
    })();

    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    if (!api) {
      setBusy(false);
      return setError("OAuth authorization API is not available.");
    }

    const { data, error: apiError } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);

    if (apiError) {
      setBusy(false);
      return setError(apiError.message);
    }

    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }

    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {__seoTags}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connection request</CardTitle>
            <CardDescription>Could not load this authorization request.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {__seoTags}
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading authorization request…</p>
        </div>
      </div>
    );
  }

  const clientName = details.client?.name ?? "an app";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {__seoTags}
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Connect {clientName} to Shepi</CardTitle>
          <CardDescription>
            {clientName} wants to use the Shepi Intelligent Quality of Earnings Platform as you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            If you approve, {clientName} will be able to read your Shepi projects, documents, adjustments, and
            QoE summaries, and create or update projects and adjustments on your behalf. It cannot issue audit
            opinions or attestation reports.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Deny
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
