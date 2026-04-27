import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { u as useSEO, B as Button, a as clearOAuthProcessedFlag, h as hasOAuthCallback, s as supabase, g as trySetSessionFromUrlHash, c as cleanupOAuthHash } from "../main.mjs";
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
const getStoredRedirect = () => {
  const path = localStorage.getItem("shepi_auth_redirect");
  localStorage.removeItem("shepi_auth_redirect");
  return path && path.startsWith("/") ? path : "/dashboard";
};
const AuthCallback = () => {
  const __seoTags = useSEO({
    title: "Completing Sign In — Shepi",
    noindex: true
  });
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  useEffect(() => {
    const info = [
      `Origin: ${window.location.origin}`,
      `Path: ${window.location.pathname}`,
      `Has hash: ${window.location.hash.length > 1}`,
      `Has access_token: ${window.location.hash.includes("access_token")}`
    ].join("\n");
    setDebugInfo(info);
    console.log("[AuthCallback] Page loaded:", info);
    let isMounted = true;
    let timeoutId;
    const processCallback = async () => {
      if (!hasOAuthCallback()) {
        console.log("[AuthCallback] No OAuth tokens in hash, checking session");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("[AuthCallback] Existing session found, redirecting");
          navigate(getStoredRedirect(), { replace: true });
        } else {
          console.log("[AuthCallback] No session, redirecting to auth");
          navigate("/auth", { replace: true });
        }
        return;
      }
      console.log("[AuthCallback] Processing OAuth tokens...");
      const result = await trySetSessionFromUrlHash();
      if (!isMounted) return;
      if (result.success) {
        console.log("[AuthCallback] Session established successfully");
        navigate(getStoredRedirect(), { replace: true });
        return;
      }
      if (result.error === "already_processing") {
        console.log("[AuthCallback] Tokens being processed elsewhere, waiting...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("[AuthCallback] Auth state change:", event);
          if (event === "SIGNED_IN" && session?.user && isMounted) {
            cleanupOAuthHash();
            subscription.unsubscribe();
            navigate(getStoredRedirect(), { replace: true });
          }
        });
        timeoutId = setTimeout(() => {
          if (isMounted) {
            subscription.unsubscribe();
            setError("Authentication timed out. Please try again.");
          }
        }, 1e4);
        return;
      }
      console.error("[AuthCallback] Failed to process tokens:", result.error);
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
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4", children: [
      __seoTags,
      /* @__PURE__ */ jsxs("div", { className: "text-center max-w-md", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-foreground mb-2", children: "Sign-in Error" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: error }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              onClick: () => {
                clearOAuthProcessedFlag();
                navigate("/auth", { replace: true });
              },
              children: "Back to Sign In"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => {
                clearOAuthProcessedFlag();
                window.location.href = "/auth";
              },
              children: "Try Again"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("details", { className: "mt-6 text-left text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Debug Info" }),
          /* @__PURE__ */ jsx("pre", { className: "mt-2 p-2 bg-muted rounded text-xs overflow-auto", children: debugInfo })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Completing sign-in..." }),
    /* @__PURE__ */ jsxs("details", { className: "mt-4 text-xs text-muted-foreground max-w-md", children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Debug Info" }),
      /* @__PURE__ */ jsx("pre", { className: "mt-2 p-2 bg-muted rounded text-xs overflow-auto", children: debugInfo })
    ] })
  ] });
};
export {
  AuthCallback as default
};
