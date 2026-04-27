import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { u as useSEO, S as ShepiLogo, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, B as Button } from "../main.mjs";
import { CheckCircle, RefreshCcw, Loader2, ArrowRight } from "lucide-react";
import { u as useSubscription } from "./useSubscription-fJr4XAL_.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
const PaymentSuccess = () => {
  const __seoTags = useSEO({ title: "Payment Successful — shepi", noindex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription, hasActiveSubscription, paidProjects, projectCredits, loading } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const planType = searchParams.get("plan");
  const isPaymentConfirmed = planType === "per_project" || planType === "done_for_you" ? projectCredits > 0 || paidProjects.length > 0 || hasActiveSubscription : hasActiveSubscription;
  useEffect(() => {
    if (isPaymentConfirmed && !checking && !loading) {
      setRedirectCountdown(3);
    }
  }, [isPaymentConfirmed, checking, loading]);
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown === 0) {
      navigate("/dashboard");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev !== null ? prev - 1 : null);
    }, 1e3);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);
  useEffect(() => {
    const refreshStatus = async () => {
      setChecking(true);
      await checkSubscription();
      setChecking(false);
    };
    refreshStatus();
    const intervals = [2e3, 5e3, 1e4];
    const timers = intervals.map(
      (delay) => setTimeout(refreshStatus, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [checkSubscription]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
    __seoTags,
    /* @__PURE__ */ jsx("nav", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }) }) }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs(Card, { className: "max-w-md w-full text-center", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-primary" }) }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "Payment Successful!" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Thank you for your purchase. Your account has been updated." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-muted rounded-lg p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Payment Status" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => {
                  setChecking(true);
                  checkSubscription();
                  setTimeout(() => setChecking(false), 2e3);
                },
                disabled: checking || loading,
                className: "h-8 px-2",
                children: /* @__PURE__ */ jsx(RefreshCcw, { className: `w-4 h-4 ${checking || loading ? "animate-spin" : ""}` })
              }
            )
          ] }),
          checking || loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-foreground", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
            /* @__PURE__ */ jsx("span", { children: "Verifying..." })
          ] }) : isPaymentConfirmed ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-primary font-medium", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: planType === "per_project" ? "Project Credit Applied" : "Active" })
            ] }),
            redirectCountdown !== null && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground text-center", children: [
              "Redirecting to dashboard in ",
              redirectCountdown,
              "..."
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "text-foreground", children: "Processing... (may take a moment)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx(Link, { to: "/dashboard", className: "block", children: /* @__PURE__ */ jsxs(Button, { className: "w-full", size: "lg", children: [
            "Go to Dashboard",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "block", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "View Plans" }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "If your subscription status doesn't update within a few minutes, please refresh the page or contact support." })
      ] })
    ] }) })
  ] });
};
export {
  PaymentSuccess as default
};
