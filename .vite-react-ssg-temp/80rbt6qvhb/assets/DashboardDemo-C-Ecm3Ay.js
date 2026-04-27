import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "react-router-dom";
import { B as Button, S as ShepiLogo, n as Tooltip, o as TooltipTrigger, p as TooltipContent, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent } from "../main.mjs";
import { D as DemoAuthGate } from "./DemoAuthGate-DDTOHLYa.js";
import { ArrowRight, Plus, Lock, FileEdit } from "lucide-react";
import "vite-react-ssg";
import "react";
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
import "./TermsAcceptanceModal-DCI1QJ_5.js";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "./spinner-DXdBpr08.js";
function DashboardDemo() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx(DemoAuthGate, { page: "dashboard", children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-destructive/10 border-b border-destructive/20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive font-medium", children: "🎬 Demo mode — this is a preview of the Shepi dashboard. No real data." }),
      /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-2", children: [
        "Sign Up Free ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground hidden sm:block", children: "Explore a fully populated QoE analysis" }),
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { size: "sm", className: "gap-2", children: "Sign Up Free" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-serif font-bold", children: "Your Projects" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your Quality of Earnings analyses" })
        ] }),
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", disabled: true, children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " New Project",
            /* @__PURE__ */ jsx(Lock, { className: "w-3 h-3 ml-1" })
          ] }) }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Sign up to create your own projects" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            onClick: () => navigate("/wizard/demo"),
            className: "cursor-pointer",
            children: /* @__PURE__ */ jsxs(Card, { className: "hover:border-primary transition-colors h-full", children: [
              /* @__PURE__ */ jsxs(CardHeader, { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Acme Industrial Supply Co." }),
                  /* @__PURE__ */ jsx(FileEdit, { className: "w-5 h-5 text-muted-foreground shrink-0" })
                ] }),
                /* @__PURE__ */ jsx(CardDescription, { children: "Buy-Side QoE Analysis" })
              ] }),
              /* @__PURE__ */ jsxs(CardContent, { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Buy-Side" }),
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Phase 7/7" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-primary transition-all",
                    style: { width: "100%" }
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Jan 2022 – Dec 2024" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-primary", children: "Click to explore →" })
                ] })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx("div", { className: "cursor-not-allowed", children: /* @__PURE__ */ jsxs(Card, { className: "opacity-40 h-full border-dashed", children: [
            /* @__PURE__ */ jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                /* @__PURE__ */ jsx(CardTitle, { className: "text-lg text-muted-foreground", children: "Your project here" }),
                /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5 text-muted-foreground shrink-0" })
              ] }),
              /* @__PURE__ */ jsx(CardDescription, { children: "Sign up to create real projects" })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded-full" }) })
          ] }) }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Sign up to create your own projects" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Ready to run your own Quality of Earnings analysis?" }),
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "gap-2", children: [
          "Get Started Free ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] }) })
      ] })
    ] })
  ] }) });
}
export {
  DashboardDemo as default
};
