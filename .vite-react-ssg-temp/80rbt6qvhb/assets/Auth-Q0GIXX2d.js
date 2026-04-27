import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { u as useSEO, s as supabase, c as cleanupOAuthHash, a as clearOAuthProcessedFlag, h as hasOAuthCallback, B as Button, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, t as toast, g as trySetSessionFromUrlHash, i as trackEvent } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { z } from "zod";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-label";
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional()
});
const Auth = () => {
  const __seoTags = useSEO({
    title: "Sign In — shepi",
    description: "Sign in or create your Shepi account to access AI-assisted Quality of Earnings analysis.",
    canonical: "https://shepi.ai/auth",
    noindex: true
  });
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const isSignUp = view === "signup";
  const isForgot = view === "forgot";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const hasProcessedAuth = useRef(false);
  const getRedirectPath = () => {
    const redirect = searchParams.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
  };
  useEffect(() => {
    let authTimeout;
    let isMounted = true;
    authTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth] Timeout - forcing page load");
        setAuthError("Authentication timed out");
        setIsCheckingAuth(false);
      }
    }, 8e3);
    const processAuth = async () => {
      if (hasOAuthCallback()) {
        console.log("[Auth] Hash tokens detected, attempting setSession");
        const result = await trySetSessionFromUrlHash();
        if (result.success) {
          console.log("[Auth] setSession succeeded, navigating to dashboard");
          clearTimeout(authTimeout);
          if (isMounted) {
            navigate(getRedirectPath(), { replace: true });
          }
          return;
        }
        if (result.error && result.error !== "already_processing") {
          console.error("[Auth] setSession failed:", result.error);
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
        console.log("[Auth] Tokens being processed, waiting for auth state change");
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] State change:", event, session?.user?.email);
      if (event === "SIGNED_IN" && session?.user) {
        cleanupOAuthHash();
        clearTimeout(authTimeout);
        if (isMounted) {
          navigate(getRedirectPath(), { replace: true });
        }
      } else if (event === "SIGNED_OUT") {
        clearOAuthProcessedFlag();
        clearTimeout(authTimeout);
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          clearTimeout(authTimeout);
          if (isMounted) {
            navigate(getRedirectPath(), { replace: true });
          }
        } else if (!hasOAuthCallback()) {
          clearTimeout(authTimeout);
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
      }
    });
    if (!hasProcessedAuth.current) {
      hasProcessedAuth.current = true;
      processAuth();
    } else if (!hasOAuthCallback()) {
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
        options: { redirectTo: `${window.location.origin}/auth` }
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validated = authSchema.parse({
        email,
        password,
        fullName: isSignUp ? fullName : void 0
      });
      if (isSignUp) {
        localStorage.setItem("shepi_auth_redirect", getRedirectPath());
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: validated.fullName }
          }
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
          password: validated.password
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
  if (isCheckingAuth) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center gap-4", children: [
      __seoTags,
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: authError ? authError : "Checking authentication..." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => {
              clearOAuthProcessedFlag();
              cleanupOAuthHash();
              setIsCheckingAuth(false);
            },
            children: "Cancel"
          }
        ),
        authError && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              clearOAuthProcessedFlag();
              cleanupOAuthHash();
              window.location.reload();
            },
            children: "Try again"
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsx("div", { className: "text-center mb-8", children: /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-primary rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-primary-foreground font-bold text-xl", children: "S" }) }),
      /* @__PURE__ */ jsx("span", { className: "font-serif text-2xl font-bold text-foreground", children: "Shepi.ai" })
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { className: "border-border", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "text-center", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: isForgot ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back" }),
        /* @__PURE__ */ jsx(CardDescription, { children: isForgot ? "Enter your email and we'll send a reset link" : isSignUp ? "Start your QoE journey today" : "Log in to access your projects" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: isForgot ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
          e.preventDefault();
          setResetLoading(true);
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            toast({ title: "Check your email", description: "We sent a password reset link to your email." });
          } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to send reset link", variant: "destructive" });
          } finally {
            setResetLoading(false);
          }
        }, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "reset-email", children: "Email" }),
            /* @__PURE__ */ jsx(Input, { id: "reset-email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: resetLoading, children: resetLoading ? "Sending..." : "Send Reset Link" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setView("login"), className: "text-primary hover:underline text-sm", children: "Back to login" }) })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            className: "w-full mb-4",
            onClick: handleGoogleSignIn,
            disabled: googleLoading,
            children: [
              /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
                /* @__PURE__ */ jsx("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
                /* @__PURE__ */ jsx("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
                /* @__PURE__ */ jsx("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
              ] }),
              googleLoading ? "Connecting..." : "Continue with Google"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-border" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-card px-2 text-muted-foreground", children: "Or continue with email" }) })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          isSignUp && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "fullName", children: "Full Name" }),
            /* @__PURE__ */ jsx(Input, { id: "fullName", placeholder: "John Smith", value: fullName, onChange: (e) => setFullName(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx(Input, { id: "email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
              !isSignUp && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setView("forgot"), className: "text-primary hover:underline text-xs", children: "Forgot password?" })
            ] }),
            /* @__PURE__ */ jsx(Input, { id: "password", type: "password", placeholder: "••••••••", value: password, onChange: (e) => setPassword(e.target.value), required: true })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setView(isSignUp ? "login" : "signup"), className: "text-primary hover:underline text-sm", children: isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up" }) })
      ] }) })
    ] })
  ] }) });
};
export {
  Auth as default
};
