import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { 
  trySetSessionFromUrlHash, 
  hasOAuthCallback,
  cleanupOAuthHash,
  clearOAuthProcessedFlag
} from "@/lib/authUtils";

/**
 * Dedicated OAuth callback handler page.
 * This page exists solely to process OAuth tokens from the URL hash
 * and redirect to the dashboard on success.
 */
/** Read and clear the stored redirect path (set by Auth.tsx before OAuth/email signup). */
const getStoredRedirect = (): string => {
  const path = localStorage.getItem("shepi_auth_redirect");
  localStorage.removeItem("shepi_auth_redirect");
  return path && path.startsWith("/") ? path : "/dashboard";
};

const AuthCallback = () => {
  useSEO({
    title: "Completing Sign In — Shepi",
    noindex: true,
  });

  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    // Capture debug info immediately
    const info = [
      `Origin: ${window.location.origin}`,
      `Path: ${window.location.pathname}`,
      `Has hash: ${window.location.hash.length > 1}`,
      `Has access_token: ${window.location.hash.includes('access_token')}`,
    ].join('\n');
    setDebugInfo(info);
    console.log('[AuthCallback] Page loaded:', info);

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const processCallback = async () => {
      // Check if we have OAuth tokens
      if (!hasOAuthCallback()) {
        console.log('[AuthCallback] No OAuth tokens in hash, checking session');
        
        // Maybe user navigated here directly - check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('[AuthCallback] Existing session found, redirecting');
          navigate(getStoredRedirect(), { replace: true });
        } else {
          console.log('[AuthCallback] No session, redirecting to auth');
          navigate("/auth", { replace: true });
        }
        return;
      }

      console.log('[AuthCallback] Processing OAuth tokens...');
      
      const result = await trySetSessionFromUrlHash();
      
      if (!isMounted) return;

      if (result.success) {
        console.log('[AuthCallback] Session established successfully');
        navigate(getStoredRedirect(), { replace: true });
        return;
      }

      if (result.error === 'already_processing') {
        console.log('[AuthCallback] Tokens being processed elsewhere, waiting...');
        // Set up listener for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[AuthCallback] Auth state change:', event);
          if (event === 'SIGNED_IN' && session?.user && isMounted) {
            cleanupOAuthHash();
            subscription.unsubscribe();
            navigate(getStoredRedirect(), { replace: true });
          }
        });
        
        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          if (isMounted) {
            subscription.unsubscribe();
            setError("Authentication timed out. Please try again.");
          }
        }, 10000);
        
        return;
      }

      // Error occurred
      console.error('[AuthCallback] Failed to process tokens:', result.error);
      cleanupOAuthHash();
      setError(result.error || "Failed to complete sign-in. Please try again.");
    };

    processCallback();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">Sign-in Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline"
              onClick={() => {
                clearOAuthProcessedFlag();
                navigate("/auth", { replace: true });
              }}
            >
              Back to Sign In
            </Button>
            <Button 
              onClick={() => {
                clearOAuthProcessedFlag();
                window.location.href = "/auth";
              }}
            >
              Try Again
            </Button>
          </div>
          
          {/* Debug info - collapsible */}
          <details className="mt-6 text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {debugInfo}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Completing sign-in...</p>
      
      {/* Debug info - visible during loading */}
      <details className="mt-4 text-xs text-muted-foreground max-w-md">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
          {debugInfo}
        </pre>
      </details>
    </div>
  );
};

export default AuthCallback;
