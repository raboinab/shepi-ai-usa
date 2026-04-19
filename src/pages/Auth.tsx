import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  hasOAuthCallback, 
  trySetSessionFromUrlHash, 
  handle412Error, 
  clearOAuthProcessedFlag, 
  cleanupOAuthHash 
} from "@/lib/authUtils";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

type AuthView = "login" | "signup" | "forgot";

const Auth = () => {
  const __seoTags = useSEO({
    title: "Sign In — shepi",
    description: "Sign in or create your Shepi account to access AI-assisted Quality of Earnings analysis.",
    canonical: "https://shepi.ai/auth",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>(searchParams.get("mode") === "signup" ? "signup" : "login");
  const isSignUp = view === "signup";
  const isForgot = view === "forgot";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [resetLoading, setResetLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const hasProcessedAuth = useRef(false);

  // Helper: get redirect path from query params (with open-redirect protection)
  const getRedirectPath = () => {
    const redirect = searchParams.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
  };

  useEffect(() => {
    let authTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;
    
    // Safety timeout
    authTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth] Timeout - forcing page load");
        setAuthError("Authentication timed out");
        setIsCheckingAuth(false);
      }
    }, 8000);

    const processAuth = async () => {
      // First, check if there are OAuth tokens in the hash
      if (hasOAuthCallback()) {
        console.log('[Auth] Hash tokens detected, attempting setSession');
        
        const result = await trySetSessionFromUrlHash();
        
        if (result.success) {
          console.log('[Auth] setSession succeeded, navigating to dashboard');
          clearTimeout(authTimeout);
          if (isMounted) {
            navigate(getRedirectPath(), { replace: true });
          }
          return;
        }
        
        if (result.error && result.error !== 'already_processing') {
          console.error('[Auth] setSession failed:', result.error);
          clearTimeout(authTimeout);
          cleanupOAuthHash();
          if (isMounted) {
            toast({ 
              title: "Sign-in failed", 
              description: "Could not complete authentication. Please try again.", 
              variant: "destructive" 
            });
            setIsCheckingAuth(false);
          }
          return;
        }
        
        // If already_processing, fall through to onAuthStateChange listener
        console.log('[Auth] Tokens being processed, waiting for auth state change');
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] State change:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        cleanupOAuthHash();
        clearTimeout(authTimeout);
        if (isMounted) {
          navigate(getRedirectPath(), { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        clearOAuthProcessedFlag();
        clearTimeout(authTimeout);
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          clearTimeout(authTimeout);
          if (isMounted) {
            navigate(getRedirectPath(), { replace: true });
          }
        } else if (!hasOAuthCallback()) {
          // No session and no hash tokens - show the page
          clearTimeout(authTimeout);
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
        // If hash tokens exist, processAuth will handle it
      }
    });

    // Process auth after listener is set up
    if (!hasProcessedAuth.current) {
      hasProcessedAuth.current = true;
      processAuth();
    } else if (!hasOAuthCallback()) {
      // No OAuth callback and already processed - just check session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          clearTimeout(authTimeout);
          if (isMounted) {
            navigate(getRedirectPath(), { replace: true });
          }
        } else {
          clearTimeout(authTimeout);
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
      }).catch(() => {
        clearTimeout(authTimeout);
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });
    }

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      clearOAuthProcessedFlag();
      localStorage.setItem("shepi_auth_redirect", getRedirectPath());

      trackEvent("sign_up", { method: "google" });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
      });

      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to initiate Google sign-in", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.parse({
        email,
        password,
        fullName: isSignUp ? fullName : undefined,
      });

      if (isSignUp) {
        // Persist redirect so it survives email confirmation flow
        localStorage.setItem("shepi_auth_redirect", getRedirectPath());
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: validated.fullName },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Account exists", description: "This email is already registered. Please log in.", variant: "destructive" });
          } else {
            throw error;
          }
        } else {
          trackEvent("sign_up", { method: "password" });
          toast({ title: "Check your email", description: `We sent a verification link to ${validated.email}. Please verify your email to sign in.` });
          setView("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (error) {
          toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
        } else {
          trackEvent("login", { method: "password" });
          toast({ title: "Welcome back!", description: "Redirecting to dashboard..." });
          navigate(getRedirectPath(), { replace: true });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.issues[0]?.message || "Invalid input", variant: "destructive" });
      } else if (error instanceof Error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        {__seoTags}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">
          {authError ? authError : "Checking authentication..."}
        </p>
        <div className="flex gap-3 mt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              clearOAuthProcessedFlag();
              cleanupOAuthHash();
              setIsCheckingAuth(false);
            }}
          >
            Cancel
          </Button>
          {authError && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                clearOAuthProcessedFlag();
                cleanupOAuthHash();
                window.location.reload();
              }}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="font-serif text-2xl font-bold text-foreground">Shepi.ai</span>
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isForgot ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
            <CardDescription>{isForgot ? "Enter your email and we'll send a reset link" : isSignUp ? "Start your QoE journey today" : "Log in to access your projects"}</CardDescription>
          </CardHeader>
          <CardContent>
            {isForgot ? (
              <>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setResetLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast({ title: "Check your email", description: "We sent a password reset link to your email." });
                  } catch (err) {
                    toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to send reset link", variant: "destructive" });
                  } finally {
                    setResetLoading(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setView("login")} className="text-primary hover:underline text-sm">
                    Back to login
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="John Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <button type="button" onClick={() => setView("forgot")} className="text-primary hover:underline text-xs">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In"}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setView(isSignUp ? "login" : "signup")} className="text-primary hover:underline text-sm">
                    {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
