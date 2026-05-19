import { ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Component, useEffect, useState, lazy, Suspense } from "react";
import { useLocation, useNavigate, Link, Outlet } from "react-router-dom";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, LoaderCircle, OctagonX, TriangleAlert, Info, CircleCheck, ChevronDown, Loader2, Menu, ArrowRight, Play, DollarSign, Clock, Lock, PieChart, Database, Shield, Target, Users, Calculator, CheckCircle, GitBranch, Bot, FileText, Layers, Upload, Sparkles, Zap, Mail } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "next-themes";
import { Toaster as Toaster$2 } from "sonner";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "@radix-ui/react-slot";
import { createClient } from "@supabase/supabase-js";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
const isNode = typeof process !== "undefined" && !!process.versions && !!process.versions.node && typeof globalThis.window === "undefined";
globalThis.__IS_SSG__ = isNode;
if (isNode) {
  const noopStorage = {
    getItem: () => null,
    setItem: () => {
    },
    removeItem: () => {
    },
    clear: () => {
    },
    key: () => null,
    length: 0
  };
  globalThis.localStorage = noopStorage;
  globalThis.sessionStorage = noopStorage;
  globalThis.window = globalThis;
  globalThis.document = {
    addEventListener: () => {
    },
    removeEventListener: () => {
    },
    createElement: () => ({}),
    documentElement: { style: {} },
    head: {},
    body: {}
  };
  globalThis.navigator = { userAgent: "ssg" };
}
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t)
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
const useToast$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  reducer,
  toast,
  useToast
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(ToastPrimitives.Root, { ref, className: cn(toastVariants({ variant }), className), ...props });
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Title, { ref, className: cn("text-sm font-semibold", className), ...props }));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Description, { ref, className: cn("text-sm opacity-90", className), ...props }));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster$1() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$2,
    {
      theme,
      className: "toaster group",
      icons: {
        success: /* @__PURE__ */ jsx(CircleCheck, { className: "h-4 w-4" }),
        info: /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
        warning: /* @__PURE__ */ jsx(TriangleAlert, { className: "h-4 w-4" }),
        error: /* @__PURE__ */ jsx(OctagonX, { className: "h-4 w-4" }),
        loading: /* @__PURE__ */ jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" })
      },
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 origin-[--radix-tooltip-content-transform-origin] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  handleReload = () => {
    window.location.reload();
  };
  handleGoHome = () => {
    window.location.href = "/";
  };
  handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message || "Unknown error"}

Stack: ${this.state.error?.stack || "No stack trace"}

Component Stack: ${this.state.errorInfo?.componentStack || "No component stack"}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert("Error details copied to clipboard");
    });
  };
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsx("div", { style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0f",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px"
      }, children: /* @__PURE__ */ jsxs("div", { style: {
        textAlign: "center",
        maxWidth: "500px"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          fontSize: "48px",
          marginBottom: "16px"
        }, children: "⚠️" }),
        /* @__PURE__ */ jsx("h1", { style: {
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "12px",
          color: "#ffffff"
        }, children: "Something went wrong" }),
        /* @__PURE__ */ jsx("p", { style: {
          fontSize: "14px",
          color: "#a0a0a0",
          marginBottom: "24px",
          lineHeight: 1.5
        }, children: "We encountered an unexpected error. Please try reloading the page." }),
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap"
        }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: this.handleReload,
              style: {
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "#6366f1",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.2s"
              },
              onMouseOver: (e) => e.currentTarget.style.backgroundColor = "#4f46e5",
              onMouseOut: (e) => e.currentTarget.style.backgroundColor = "#6366f1",
              children: "Reload Page"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: this.handleGoHome,
              style: {
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "transparent",
                color: "#a0a0a0",
                border: "1px solid #333",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s"
              },
              onMouseOver: (e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.color = "#ffffff";
              },
              onMouseOut: (e) => {
                e.currentTarget.style.borderColor = "#333";
                e.currentTarget.style.color = "#a0a0a0";
              },
              children: "Go to Home"
            }
          )
        ] }),
        false
      ] }) });
    }
    return this.props.children;
  }
}
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className), ...props }));
Card.displayName = "Card";
const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("h3", { ref, className: cn("text-2xl font-semibold leading-none tracking-tight", className), ...props })
);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
const ShepiLogo = ({
  className,
  size = "md",
  variant = "dark"
}) => {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  };
  const textColor = variant === "light" ? "text-shepi-cream" : "text-shepi-blue";
  return /* @__PURE__ */ jsx("div", { className: cn("flex items-center", className), children: /* @__PURE__ */ jsx("span", { className: cn("font-serif font-bold lowercase", sizes[size], textColor), children: "shepi" }) });
};
const SUPABASE_URL = "https://mdgmessqbfebrbvjtndz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});
const OAUTH_PROCESSED_KEY = "shepi_oauth_processed";
const OAUTH_PROCESSED_TIMESTAMP_KEY = "shepi_oauth_processed_ts";
const PROCESSING_WINDOW_MS = 1e4;
function hasOAuthCallback() {
  return window.location.hash.includes("access_token");
}
function parseHashTokens() {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) {
    return null;
  }
  try {
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      console.log("[Auth] Parsed tokens from URL hash");
      return { access_token, refresh_token };
    }
    console.warn("[Auth] Hash contains access_token but parsing failed");
    return null;
  } catch (error) {
    console.error("[Auth] Error parsing hash tokens:", error);
    return null;
  }
}
async function trySetSessionFromUrlHash() {
  const tokens = parseHashTokens();
  if (!tokens) {
    return { success: false, hasHash: hasOAuthCallback() };
  }
  const processedToken = sessionStorage.getItem(OAUTH_PROCESSED_KEY);
  const processedTimestamp = sessionStorage.getItem(OAUTH_PROCESSED_TIMESTAMP_KEY);
  const tokenFingerprint = tokens.access_token.slice(-20);
  if (processedToken === tokenFingerprint && processedTimestamp) {
    const elapsed = Date.now() - parseInt(processedTimestamp, 10);
    if (elapsed < PROCESSING_WINDOW_MS) {
      console.log("[Auth] Tokens already being processed, skipping duplicate");
      return { success: false, hasHash: true, error: "already_processing" };
    }
  }
  sessionStorage.setItem(OAUTH_PROCESSED_KEY, tokenFingerprint);
  sessionStorage.setItem(OAUTH_PROCESSED_TIMESTAMP_KEY, Date.now().toString());
  console.log("[Auth] Attempting setSession with parsed tokens");
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
    if (error) {
      console.error("[Auth] setSession failed:", error.message);
      clearOAuthProcessedFlag();
      return { success: false, hasHash: true, error: error.message };
    }
    if (data.session?.user) {
      console.log("[Auth] setSession success:", data.session.user.email);
      cleanupOAuthHash();
      return { success: true, hasHash: true };
    }
    console.warn("[Auth] setSession returned no session");
    clearOAuthProcessedFlag();
    return { success: false, hasHash: true, error: "no_session_returned" };
  } catch (err) {
    console.error("[Auth] setSession exception:", err);
    clearOAuthProcessedFlag();
    return {
      success: false,
      hasHash: true,
      error: err instanceof Error ? err.message : "unknown_error"
    };
  }
}
function cleanupOAuthHash() {
  if (window.location.hash.includes("access_token")) {
    console.log("[Auth] Cleaning up OAuth hash from URL");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
function clearOAuthProcessedFlag() {
  sessionStorage.removeItem(OAUTH_PROCESSED_KEY);
  sessionStorage.removeItem(OAUTH_PROCESSED_TIMESTAMP_KEY);
}
const Accordion = AccordionPrimitive.Root;
const AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Item, { ref, className: cn("border-b", className), ...props }));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
function SEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = "/og-image.png",
  ogType = "website",
  jsonLd
}) {
  const absoluteImage = ogImage.startsWith("http") ? ogImage : `https://shepi.ai${ogImage}`;
  const resolvedCanonical = canonical || (typeof window !== "undefined" ? `https://shepi.ai${window.location.pathname}` : "https://shepi.ai/");
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const googlebotContent = noindex ? "noindex, nofollow" : "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("title", { children: title }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: resolvedCanonical }),
    description && /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    description && /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    description && /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "robots", content: robotsContent }),
    /* @__PURE__ */ jsx("meta", { name: "googlebot", content: googlebotContent }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: title }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: title }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: ogType }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: resolvedCanonical }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:url", content: resolvedCanonical }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: absoluteImage }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: absoluteImage }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((obj, i) => /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(obj) }
      },
      `jsonld-${i}`
    ))
  ] });
}
function useSEO(props) {
  return /* @__PURE__ */ jsx(SEO, { ...props });
}
function trackEvent(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
  }
}
const PRICING = {
  perProject: {
    amount: 2e3,
    display: "$2,000",
    period: "/project"
  },
  doneForYou: {
    display: "$4,000",
    period: "/project"
  },
  dfyUpgradeFromPerProject: {
    display: "$2,000"
  },
  monthly: {
    display: "$5,000",
    period: "/month",
    includedProjects: 3,
    overagePerProject: 1e3
  }
};
const PERPROJECT = PRICING.perProject.display;
const MONTHLY = PRICING.monthly.display;
const HOMEPAGE_FAQ = [
  // Data & Security
  {
    id: "security-1",
    category: "Data & Security",
    question: "How is my deal data protected?",
    answer: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your deal information is isolated to your account with strict access controls. We use enterprise-grade infrastructure with SOC 2 Type II compliant hosting. Only you can access your projects — not even our support team can view your analysis without explicit permission."
  },
  {
    id: "security-2",
    category: "Data & Security",
    question: "Is my deal data used to train AI models?",
    answer: "No. Your deal data is never used to train AI models. Period. Your financial information, adjustments, and analysis remain completely private. The AI assistance you receive is powered by models trained on public financial knowledge — not your confidential deal information."
  },
  {
    id: "security-3",
    category: "Data & Security",
    question: "Can other users see my analysis or data?",
    answer: "No. Each project is completely isolated to your account. There's no shared database, no cross-user visibility, and no way for other users to access your work. When you export your analysis, you control who has access to those files."
  },
  {
    id: "security-4",
    category: "Data & Security",
    question: "Can I delete my data after completing a project?",
    answer: "Yes. You can delete any project at any time, which permanently removes all associated data including uploaded documents, analysis, and adjustments. Once deleted, the data cannot be recovered. We also automatically purge deleted data from our backups within 30 days."
  },
  // What shepi Is
  {
    id: "what-is-1",
    category: "What shepi Is",
    question: "What exactly does shepi do?",
    answer: "shepi is a QoE analysis platform built on three pillars: a structured analysis framework designed by M&A professionals, automated data processing that transforms raw financials in minutes, and AI-powered document extraction for complex forms. Connect to QuickBooks for automatic data import, or upload PDFs — our AI extracts structured data from tax returns, payroll reports, and contracts without manual data entry. The result: data room files become analysis-ready in minutes, not days."
  },
  {
    id: "what-is-2",
    category: "What shepi Is",
    question: "How is shepi different from using Excel templates?",
    answer: "Excel templates give you a blank structure and hours of manual work. shepi gives you automated processing plus a guided workflow. Key differences: Connect to QuickBooks and import mapped data instantly — work that takes 8-12 hours manually. AI extracts structured data from tax returns, payroll, debt schedules, and contracts — no manual data entry. Multi-period normalization and IS/BS reconciliation happen automatically. A proven 6-phase workflow mirrors how experienced analysts work. You focus on analysis and judgment, not data wrangling."
  },
  {
    id: "what-is-3",
    category: "What shepi Is",
    question: "What's the difference between Self-Service and Done-For-You?",
    answer: `Self-Service (${PERPROJECT}/project): you run the analysis inside the Shepi platform — typically 2–4 hours of hands-on time. Done-For-You (${PRICING.doneForYou.display}/project, includes CPA-led review): the Shepi team produces the deliverable for you and you review the output — turnaround in days. Both produce the same 27-tab workbook and PDF report. <a href="/scope#diy-vs-dfy">See the full Scope of Work →</a>`
  },
  // What shepi Is NOT
  {
    id: "not-1",
    category: "What shepi Is NOT",
    question: "Does shepi replace a formal Quality of Earnings report from a CPA firm?",
    answer: "shepi produces comprehensive QoE analysis from the same source data a CPA firm would use — trial balances, financial statements, and supporting documents. For transactions requiring CPA attestation (lender requirements, regulatory compliance), shepi accelerates that engagement by producing CPA-ready workpapers. The difference between shepi and a CPA firm isn't the analysis methodology — it's the attestation letter and professional liability coverage."
  },
  {
    id: "not-2",
    category: "What shepi Is NOT",
    question: "Does shepi calculate final EBITDA or provide a valuation?",
    answer: "shepi helps you build an EBITDA bridge by tracking and categorizing your adjustments, but the final numbers reflect YOUR judgment, not ours. We don't calculate valuation multiples or opine on what a business is worth. Our role is to help you organize and document the analysis — the conclusions are yours."
  },
  {
    id: "not-3",
    category: "What shepi Is NOT",
    question: "Can I show shepi output directly to lenders or investors?",
    answer: "Yes — shepi output is complete, professional-quality QoE analysis that exports to PDF and Excel for sharing. For investor presentations and internal decision-making, shepi delivers institutional-grade workpapers. If your lender specifically requires CPA-attested reports for financing, shepi provides the analytical foundation that accelerates that formal engagement."
  },
  {
    id: "not-4",
    category: "What shepi Is NOT",
    question: "Does shepi certify or guarantee the accuracy of the analysis?",
    answer: "No. shepi structures your analysis and provides AI-powered suggestions, but every adjustment is entered and approved by you. We don't audit source documents, verify management representations, or certify results. The accuracy of your analysis depends on the quality of data you provide and the judgment calls you make."
  },
  {
    id: "not-5",
    category: "What shepi Is NOT",
    question: "How reliable is shepi's analysis compared to what a CPA firm would produce?",
    answer: "shepi's methodology and spreadsheet structure were developed by an M&A professional with years of hands-on QoE experience. The workflow, adjustment categories, and output format mirror what you'd see from a quality accounting firm. For clean deals with good data and careful analysis, shepi produces results that are functionally equivalent to what a CPA firm would deliver. The difference isn't in methodology — it's in who signs off on it. That said, garbage in, garbage out. shepi is a tool that structures and accelerates your analysis — it doesn't fix bad data or substitute for sound judgment."
  },
  // How It Works
  {
    id: "how-1",
    category: "How It Works",
    question: "What documents do I need to get started?",
    answer: "<p>Once you have access to the seller's data room (typically after LOI), you'll gather documents in three tiers:</p><p><strong>Required</strong> — You need these to begin: Detailed Trial Balance (QuickBooks export or Excel), Chart of Accounts, Bank Statements (covering full review period), General Ledger.</p><p><strong>Recommended</strong> — For a professional-grade analysis: AR & AP Aging Reports, Payroll Reports/Registers, Fixed Asset / Depreciation Schedule, Tax Returns (3 years), Journal Entries, Credit Card Statements, Customer & Vendor Lists, Inventory Records, Debt Schedule, Material Contracts & Lease Agreements.</p><p><strong>Optional</strong> — For verification & reference: Income Statements, Balance Sheets, Cash Flow Statements, CIM / Offering Memo.</p><p>Start with the Required documents — you can add Recommended and Optional items as you receive them.</p>"
  },
  {
    id: "how-2",
    category: "How It Works",
    question: "How many years of financial data are required?",
    answer: "shepi requires 3 full fiscal years of historical data plus the current year-to-date period. This enables proper trending analysis, LTM (Last Twelve Months) calculations, and year-over-year comparisons that lenders and buyers expect."
  },
  {
    id: "how-3",
    category: "How It Works",
    question: "What file formats can I upload?",
    answer: "shepi is optimized for QuickBooks — the accounting system used by 80%+ of small businesses in the US. Connect directly to QuickBooks Online for automatic data import, or upload QuickBooks Desktop exports. We also accept PDF financial statements for AI extraction (tax returns, payroll reports, contracts, debt schedules) and standard Excel/CSV files for trial balance data."
  },
  {
    id: "how-4",
    category: "How It Works",
    question: "Can I connect directly to QuickBooks?",
    answer: "Yes — QuickBooks is our primary integration since it powers the vast majority of small business accounting in the US. Connect your client's QuickBooks Online account, select the periods you need, and shepi imports trial balance, chart of accounts, and general ledger data automatically. No manual exports, no format issues."
  },
  {
    id: "how-5",
    category: "How It Works",
    question: "How quickly can I complete an analysis?",
    answer: "Most users complete initial analysis in 2-4 hours vs. 40+ hours manually. The biggest time savings come from automatic account mapping (saves 8-12 hours), built-in calculations and reconciliations, and structured workflow that eliminates setup time. Your actual time depends on deal complexity and data quality, but expect 80-90% time reduction compared to building from scratch in Excel."
  },
  {
    id: "how-6",
    category: "How It Works",
    question: "What do I get at the end?",
    answer: "A complete analysis package including: EBITDA bridge with categorized adjustments, multi-period income statement and balance sheet analysis, working capital analysis with DSO/DPO/DIO metrics, customer and vendor concentration analysis, documented adjustment rationales with proof attachments. Everything exports to a professional PDF report and Excel workbook for sharing with stakeholders, lenders, or advisors."
  },
  {
    id: "how-7",
    category: "How It Works",
    question: "What role does AI actually play in shepi?",
    answer: "<p>AI in shepi serves four functions:</p><p><strong>Document Extraction</strong> — When you upload complex documents like tax returns (1040, 1120, 1120S, 1065), payroll reports, debt schedules, or material contracts, AI reads and extracts structured data automatically. No manual data entry required.</p><p><strong>Identification</strong> — AI scans your general ledger and bank transactions to surface potential adjustments (personal expenses, non-recurring items, related party transactions) for your review.</p><p><strong>Education</strong> — Explains QoE concepts, adjustment types, and industry norms in plain language so you understand the 'why' behind every step.</p><p><strong>Assistance</strong> — The QoE Assistant answers questions about your specific analysis in real-time, helping you understand what experienced analysts would look for.</p><p><strong>Important:</strong> AI never auto-generates adjustments or final numbers. Every adjustment is human-entered and human-approved. AI surfaces possibilities — you make the decisions.</p>"
  },
  {
    id: "how-8",
    category: "How It Works",
    question: "What happens if my financial data is messy or incomplete?",
    answer: "Real deals are messy — we get it. shepi will warn you about potential issues (missing periods, unbalanced accounts, incomplete trial balances) but won't block your progress. You can proceed with imperfect data and document your assumptions. The warnings help you know what to address, but you decide what's acceptable for your analysis."
  },
  // Pricing & Value
  {
    id: "pricing-1",
    category: "Pricing & Value",
    question: `Why does shepi cost ${PERPROJECT} per project?`,
    answer: `Consider the alternatives: DIY in Excel with a junior analyst at $50-100/hour spending 40+ hours = $2,000-4,000 in labor; Outsourcing to a CPA firm for sell-side QoE runs $15,000-50,000+; With shepi, complete analysis in hours, not weeks, for ${PERPROJECT}. At ${PERPROJECT}, you're paying roughly $100-200/hour for the time you actually spend — but you're getting the structure, consistency, and AI assistance that would otherwise require an experienced analyst.`
  },
  {
    id: "pricing-2",
    category: "Pricing & Value",
    question: "When should I choose per-project vs. monthly?",
    answer: `Per-project (${PERPROJECT}): Best if you're analyzing 1-4 deals and want to pay only for what you use. Monthly (${MONTHLY}): Best if you're actively searching and expect 5+ deals, or if you want the flexibility to revisit analyses without worrying about project limits.`
  },
  {
    id: "pricing-3",
    category: "Pricing & Value",
    question: "Is there a free trial?",
    answer: "We don't currently offer a free trial, but we're confident in the value. If you complete an analysis and don't find it valuable, reach out to our team — we stand behind the product."
  },
  // Who It's For
  {
    id: "who-1",
    category: "Who It's For",
    question: "Is shepi right for independent searchers doing their own diligence?",
    answer: "Yes — searchers are one of our primary users. shepi is designed for post-LOI due diligence, once the seller opens the data room and you have access to financials. With just the core documents (trial balance, chart of accounts, bank statements, and general ledger), you can start your analysis immediately and add supporting documents as they arrive. Use shepi to complete your analysis in hours instead of weeks, build professional EBITDA bridges with documented adjustments, identify red flags while you still have negotiating leverage, and create work product you can share with lenders or partners. For self-funded deals, this may be all the QoE you need. If your deal requires SBA or other lender financing, you'll likely still need formal QoE from a CPA firm — but having done the work in shepi puts you ahead and helps you catch issues early."
  },
  {
    id: "who-2",
    category: "Who It's For",
    question: "Can I compare analysis across multiple deals?",
    answer: "Yes. Your dashboard shows all your projects with key metrics for quick comparison. While each analysis is independent, you can easily reference previous deals to calibrate your approach. Many searchers find this valuable for developing pattern recognition across similar businesses or industries."
  },
  {
    id: "who-3",
    category: "Who It's For",
    question: "Does shepi handle industry-specific adjustments?",
    answer: "shepi's adjustment framework covers common categories across industries — owner compensation, one-time expenses, related party transactions, etc. The AI assistant understands industry-specific considerations (SaaS metrics, manufacturing working capital, healthcare reimbursement) and can guide you on what to look for. The structure is flexible enough to capture any adjustment type, and industry context helps the AI provide more relevant suggestions."
  },
  {
    id: "who-4",
    category: "Who It's For",
    question: "Can accounting firms and advisors use shepi?",
    answer: "Absolutely. Firms use shepi to extend capacity without adding headcount, standardize QoE output across team members, accelerate sell-side QoE preparation, and train junior staff on QoE methodology. The Enterprise plan includes features specifically for teams: collaboration tools, custom templates, and volume pricing."
  },
  {
    id: "who-5",
    category: "Who It's For",
    question: "Who should NOT use shepi?",
    answer: "shepi may not be right for you if: You need a CPA-certified QoE report (we don't provide certification); Your lender has specific QoE vendor requirements; You're looking for a valuation tool (we focus on earnings quality, not valuation); You want the AI to 'do it for you' (we assist, you decide)."
  }
];
function stripHtml(html) {
  return html.replace(/<\/(p|li|ul)>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function buildFaqJsonLd(entries = HOMEPAGE_FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(e.answer)
      }
    }))
  };
}
function groupFaqByCategory(entries = HOMEPAGE_FAQ) {
  const groups = [];
  for (const entry of entries) {
    let group = groups.find((g) => g.category === entry.category);
    if (!group) {
      group = { category: entry.category, items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }
  return groups;
}
const Index = () => {
  const __seoTags = useSEO({
    title: "AI Quality of Earnings Software | QoE Platform | Shepi",
    description: "AI quality of earnings analysis for M&A due diligence. Upload financials and get EBITDA adjustments and lender-ready QoE reports in hours.",
    canonical: "https://shepi.ai/",
    ogImage: "/og-image.png",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "shepi",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "AI-assisted Quality of Earnings analysis for M&A due diligence. Upload financials, get EBITDA adjustments, working capital analysis, and lender-ready QoE reports in hours.",
        url: "https://shepi.ai/",
        publisher: {
          "@type": "Organization",
          name: "shepi",
          url: "https://shepi.ai/"
        },
        offers: [
          {
            "@type": "Offer",
            name: "Per Project",
            priceCurrency: "USD",
            price: "2000",
            description: "Single project access to full QoE analysis workflow"
          },
          {
            "@type": "Offer",
            name: "Monthly",
            priceCurrency: "USD",
            price: "4000",
            description: "Monthly subscription with 3 included projects per month"
          }
        ]
      },
      // FAQPage schema is generated from the SAME HOMEPAGE_FAQ array used to
      // render the visible Accordion below — single source of truth.
      buildFaqJsonLd(HOMEPAGE_FAQ)
    ]
  });
  const __faqGroups = groupFaqByCategory(HOMEPAGE_FAQ);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", company: "", role: "", interest: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  useEffect(() => {
    let isMounted = true;
    if (hasOAuthCallback()) {
      console.log("[Index] OAuth tokens detected, redirecting to /auth/callback");
      const hash = window.location.hash;
      window.location.replace(`/auth/callback${hash}`);
      return;
    }
    const checkSession = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) => setTimeout(() => resolve(null), 1e3))
        ]);
        if (result && "data" in result && result.data.session?.user && isMounted) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("[Index] Session check error:", error);
      }
      if (isMounted) {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  const location = useLocation();
  useEffect(() => {
    if (isCheckingAuth) return;
    const hash = location.hash;
    if (!hash) return;
    const id = hash.replace("#", "");
    requestAnimationFrame(() => {
      const el = document.getElementById(id) || document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, [isCheckingAuth, location.hash]);
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: contactForm
      });
      if (error) throw error;
      trackEvent("generate_lead", {
        form_location: "homepage_contact",
        has_company: !!contactForm.company,
        interest: contactForm.interest || void 0
      });
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setContactForm({ name: "", email: "", message: "", company: "", role: "", interest: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast({ title: "Failed to send message", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isCheckingAuth) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-primary gap-4", children: [
      __seoTags,
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary-foreground mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/80", children: "Loading..." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsxs("section", { className: "bg-primary min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxs("nav", { className: "py-6 px-6 md:px-12 relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(ShepiLogo, { variant: "light", size: "lg" }),
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-8", children: [
            /* @__PURE__ */ jsx("a", { href: "#features", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "Features" }),
            /* @__PURE__ */ jsx("a", { href: "#how-it-works", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "How It Works" }),
            /* @__PURE__ */ jsx("a", { href: "#our-story", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "About" }),
            /* @__PURE__ */ jsx(Link, { to: "/resources", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "Resources" }),
            /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "Pricing" }),
            /* @__PURE__ */ jsx("a", { href: "#contact", className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors", children: "Contact" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "text-primary-foreground hover:bg-primary-foreground/10", children: "Log In" }) }),
            /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { className: "bg-secondary text-secondary-foreground hover:bg-secondary/90", children: "Get Started" }) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "md:hidden p-2 text-primary-foreground",
              onClick: () => setMobileMenuOpen(!mobileMenuOpen),
              "aria-label": "Toggle menu",
              children: mobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" })
            }
          )
        ] }),
        mobileMenuOpen && /* @__PURE__ */ jsx("div", { className: "md:hidden absolute top-full left-0 right-0 bg-primary border-t border-primary-foreground/10 py-6 px-6 z-50", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "#features",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "Features"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "#how-it-works",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "How It Works"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "#our-story",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "About"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/resources",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "Resources"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/pricing",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "Pricing"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "#contact",
              className: "text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2",
              onClick: () => setMobileMenuOpen(false),
              children: "Contact"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 pt-4 border-t border-primary-foreground/10", children: [
            /* @__PURE__ */ jsx(Link, { to: "/auth", onClick: () => setMobileMenuOpen(false), children: /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "w-full text-primary-foreground hover:bg-primary-foreground/10", children: "Log In" }) }),
            /* @__PURE__ */ jsx(Link, { to: "/pricing", onClick: () => setMobileMenuOpen(false), children: /* @__PURE__ */ jsx(Button, { className: "w-full bg-secondary text-secondary-foreground hover:bg-secondary/90", children: "Get Started" }) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/70 font-medium tracking-wide mb-4", children: "Your Due Diligence Shepherd" }),
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-primary-foreground mb-6 leading-tight text-center", children: [
          "AI-Assisted",
          /* @__PURE__ */ jsx("br", {}),
          "Quality of Earnings Analysis"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xl md:text-2xl text-primary-foreground/80 mb-4 max-w-3xl mx-auto", children: "From raw financials to lender-ready conclusions — in hours, not weeks." }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/70 mb-6 max-w-3xl mx-auto", children: "shepi lets you run a professional-grade Quality of Earnings analysis — identifying adjustments, risks, and normalized earnings through a structured, traceable workflow." }),
        /* @__PURE__ */ jsx("p", { className: "text-base md:text-lg text-primary-foreground/60 mb-10 max-w-2xl mx-auto italic", children: "Built for deal professionals who need speed without sacrificing credibility." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center", children: [
          /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 text-lg px-8 py-6", children: [
            "Get Started ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/dashboard/demo", children: /* @__PURE__ */ jsxs(Button, { size: "lg", variant: "outline", className: "border-secondary text-secondary bg-transparent hover:bg-secondary/10 gap-2 text-lg px-8 py-6", children: [
            /* @__PURE__ */ jsx(Play, { className: "w-5 h-5" }),
            " Try Live Demo"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/demo", children: /* @__PURE__ */ jsx(
            Button,
            {
              size: "lg",
              variant: "outline",
              className: "border-secondary text-secondary bg-transparent hover:bg-secondary/10 gap-2 text-lg px-8 py-6",
              children: "🎥 Watch Demo"
            }
          ) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "bg-foreground py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-secondary/60 uppercase tracking-wider mb-4 block", children: "The Problem" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-secondary mb-6", children: "Due Diligence Shouldn't Slow Your Deal" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-secondary/70 max-w-2xl mx-auto", children: "For most buyers and advisors, Quality of Earnings analysis remains out of reach — too expensive, too slow, and too complex." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center p-8 border border-secondary/20 rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(DollarSign, { className: "w-8 h-8 text-secondary" }) }),
          /* @__PURE__ */ jsx("div", { className: "text-4xl md:text-5xl font-bold text-secondary mb-2", children: "$20K+" }),
          /* @__PURE__ */ jsx("p", { className: "text-secondary/70", children: "Traditional QoE costs are prohibitive for many buyers and smaller deals" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center p-8 border border-secondary/20 rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Clock, { className: "w-8 h-8 text-secondary" }) }),
          /* @__PURE__ */ jsx("div", { className: "text-4xl md:text-5xl font-bold text-secondary mb-2", children: "4+ Weeks" }),
          /* @__PURE__ */ jsx("p", { className: "text-secondary/70", children: "Deals move fast — buyers can't wait months for proper due diligence" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center p-8 border border-secondary/20 rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-secondary" }) }),
          /* @__PURE__ */ jsx("div", { className: "text-4xl md:text-5xl font-bold text-secondary mb-2", children: "Limited Access" }),
          /* @__PURE__ */ jsx("p", { className: "text-secondary/70", children: "Only large PE firms and institutions can afford proper QoE analysis" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "The Solution" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4", children: "Too Small for Big 4. Too Complex for Excel." }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Some deals under $10M may not get a proper Quality of Earnings analysis. shepi changes that." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 mb-12", children: [
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(PieChart, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "QoE Software, Not a Service" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "shepi produces the same structured analysis — EBITDA adjustments, working capital, proof of cash — without the traditional engagement timeline or price tag. Starting at $2,000 per deal." })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Database, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "Direct Accounting Integration" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "Connect your accounting software, import trial balance, chart of accounts, and GL data in minutes. No manual exports or spreadsheet cleanup." })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "Structured, Lender-Ready Output" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "EBITDA bridge, working capital, proof of cash, balance sheet — formatted for lender review and deal documentation." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground italic max-w-3xl mx-auto mb-16", children: "Think of it as the TurboTax of due diligence — structured, guided, and built for deals that don't need a lengthy accounting engagement." }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-lg font-medium text-foreground mb-16", children: "You control the timeline. No engagement letters, no waiting. Run your analysis today." }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Built For" }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-serif font-bold text-foreground", children: "From Screening to Close" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 mb-16", children: [
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Target, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "Independent Searchers" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "Screen deals in hours, not weeks. Get structured analysis before committing to a full engagement." })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "Brokers & Advisors" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "Offer sell-side QoE as a differentiator. Help your clients present clean financials to buyers." })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "p-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5", children: /* @__PURE__ */ jsx(Calculator, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground mb-3", children: "Accountants & CPAs" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: "Extend your capacity without adding headcount. Use shepi's workpapers as a head start on engagements." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto mb-16", children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "w-full", children: /* @__PURE__ */ jsxs(AccordionItem, { value: "cpa-faq", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left text-foreground text-lg", children: "Does this replace a CPA engagement?" }),
        /* @__PURE__ */ jsx(AccordionContent, { className: "text-muted-foreground leading-relaxed", children: "For deals under $10M, many buyers don't need a formally attested QoE report — they need structured analysis they can trust. shepi produces that: EBITDA bridge, working capital, proof of cash, all from the same source data. If your lender requires CPA attestation, shepi's workpapers give your accountant a significant head start. For self-funded deals, search fund screening, and internal decision-making, shepi's output stands on its own." })
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-serif font-bold text-foreground mb-3", children: "Due Diligence Shouldn't Take Weeks" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-6", children: "$2,000 per project, results in hours." }),
        /* @__PURE__ */ jsx(Button, { size: "lg", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/auth", children: [
          "Get Started ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "ml-2 w-4 h-4" })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "our-story", className: "bg-secondary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Our Story" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-8", children: "A Systems Engineer Meets an M&A Professional" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "prose prose-lg max-w-none", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xl text-muted-foreground leading-relaxed mb-6 text-center", children: [
          "When a systems engineer searching for a business to buy met an M&A professional, they discovered a shared frustration: ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: "Quality of Earnings analysis was too expensive and took too long." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground leading-relaxed mb-6 text-center", children: "Traditional QoE reports cost $20K+ and take 4+ weeks — putting proper due diligence out of reach for searchers, slowing down deals, and forcing buyers to choose between speed and credibility." }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg text-muted-foreground leading-relaxed text-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: "We built shepi to change that." }),
          " By combining a structured analysis framework designed by M&A professionals, automated data processing, and AI-assisted insights, we're making QoE accessible, affordable, and fast — without sacrificing quality."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { id: "why-shepi", className: "grid lg:grid-cols-2 min-h-[80vh]", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-secondary p-12 md:p-16 lg:p-20 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4", children: "Our Approach" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "Why shepi" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground leading-relaxed mb-6", children: "At shepi, we believe Quality of Earnings should be:" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-3 mb-8", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "Fast" }),
              " — Complete your analysis in hours, not weeks"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "Consistent" }),
              " — Follow a proven methodology every time"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "Defensible" }),
              " — Every adjustment is documented and traceable"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "Accessible" }),
              " — Professional-grade analysis at a fraction of the cost"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-primary p-12 md:p-16 lg:p-20 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-primary-foreground/60 uppercase tracking-wider mb-4", children: "Our Commitment" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-6", children: "Built for Deal Professionals" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-primary-foreground/80 leading-relaxed mb-8", children: "We understand the pressure of due diligence timelines. That's why we've built shepi to help you move faster while maintaining the rigor that lenders and investors expect." }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-bold text-secondary mb-2", children: "2–4 hrs" }),
            /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/70 text-sm", children: "Initial analysis time" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-bold text-secondary mb-2", children: "100%" }),
            /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/70 text-sm", children: "Adjustment traceability" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { id: "features", className: "bg-secondary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Features" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "Everything You Need for QoE" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "From data ingestion to final report, shepi provides a complete workflow for Quality of Earnings analysis." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Database, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "Structured Data Organization" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Import trial balances, bank statements, and supporting documents. shepi organizes everything into a consistent framework." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Accounting Software integration"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Document parsing & extraction"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Multi-period analysis"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(GitBranch, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "Professional Analysis Framework" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Follow a structured methodology designed by M&A professionals. Every step is guided and documented." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "EBITDA adjustments workflow"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Working capital analysis"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Proof of cash reconciliation"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Bot, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "AI-Assisted Insights" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Let AI help you identify anomalies, suggest adjustments, and validate your analysis against source documents." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Anomaly detection"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Adjustment suggestions"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Document validation"
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "scope-of-work", className: "bg-secondary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Engagement" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "Scope of Work" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "What we're engaged to deliver, in the format you'd see from a traditional QoE firm." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-6 mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-6 md:p-7 ring-1 ring-primary/20", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground", children: "Deliverables" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2 mb-4", children: [
            "Executive Summary",
            "EBITDA Bridge",
            "Revenue Quality",
            "Working Capital Analysis",
            "Proof of Cash",
            "GL Findings & Red Flags",
            "Customer / Vendor Concentration",
            "Full Audit Trail",
            "PDF + Excel export"
          ].map((d) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: d })
          ] }, d)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-6 md:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground", children: "Procedures Performed" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: [
            "100% GL coverage and account mapping",
            "Anomaly and red-flag detection",
            "Owner-compensation normalization",
            "Personal-expense detection",
            "Customer / vendor concentration",
            "Working capital & proof of cash",
            "AI-suggested EBITDA adjustments — every one human-reviewed"
          ].map((p) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: p })
          ] }, p)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-6 md:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground", children: "Out of Scope" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: [
            "No CPA attestation or opinion",
            "No valuation",
            "No legal or tax advice",
            "No replacement for a fairness opinion or formal audit"
          ].map((o) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-muted-foreground mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: o })
          ] }, o)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { id: "diy-vs-dfy", className: "grid md:grid-cols-2 gap-6 mb-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-6 md:p-8 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Self-Service" }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-serif font-bold text-foreground", children: "You run the analysis" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2 mb-6 flex-1", children: [
            "You drive the workflow inside the Shepi platform",
            "2–4 hours of hands-on analyst time",
            "Same 27-tab workbook & PDF deliverables",
            "Best for searchers and operators with finance fluency"
          ].map((b) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: b })
          ] }, b)) }),
          /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", className: "block", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "Start Self-Service →" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border-2 border-primary rounded-xl p-6 md:p-8 flex flex-col relative", children: [
          /* @__PURE__ */ jsx(Badge, { className: "absolute -top-3 left-6 bg-primary text-primary-foreground", children: "Done-For-You" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2", children: "DFY Engagement" }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-serif font-bold text-foreground", children: "Our team runs it for you" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2 mb-6 flex-1", children: [
            "CPA-led review of every adjustment",
            "Shepi team produces the deliverable, you review",
            "Days, not weeks — no ongoing analyst time required",
            "Guided kickoff and data-room walkthrough",
            "Best for buyers who want the artifact produced for them"
          ].map((b) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: b })
          ] }, b)) }),
          /* @__PURE__ */ jsx(Link, { to: "/pricing#done-for-you", className: "block", children: /* @__PURE__ */ jsx(Button, { className: "w-full", children: "See Done-For-You pricing →" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/scope", className: "text-primary font-medium hover:underline inline-flex items-center gap-1", children: [
          "View full Statement of Work ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground hidden sm:inline", children: "·" }),
        /* @__PURE__ */ jsxs(Link, { to: "/pricing", className: "text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
          "See pricing ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "how-it-works", className: "bg-background py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Process" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "How It Works" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Four simple steps from raw data to professional QoE deliverables." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl", children: "1" }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Upload, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground mb-2", children: "Import Data" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Connect accounting software or upload trial balances and supporting documents." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl", children: "2" }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Layers, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground mb-2", children: "Structure Analysis" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "shepi organizes your data and guides you through the QoE framework." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl", children: "3" }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground mb-2", children: "AI Insights" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Get AI-suggested adjustments and validate findings against source documents." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-2xl", children: "4" }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground mb-2", children: "Deliver Results" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Export professional QoE workbooks and reports ready for lenders." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-16 border border-border rounded-xl bg-card p-8 md:p-10", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl md:text-2xl font-serif font-bold text-foreground text-center mb-2", children: "What You'll Need" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center mb-8 max-w-2xl mx-auto", children: "Most of this comes from the seller's data room. Start with the Required items — add the rest as you receive them." }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-6 md:gap-8", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-destructive mb-3", children: "Required" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: ["Trial Balance", "Chart of Accounts", "Bank Statements", "General Ledger"].map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3", children: "Recommended" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: ["AR & AP Aging", "Payroll Reports", "Fixed Asset Schedule", "Tax Returns (3 years)", "Journal Entries", "Credit Card Statements", "Customer & Vendor Lists", "Inventory Records", "Debt Schedule", "Material Contracts & Leases", "Supporting Documents", "Job Cost Reports / WIP Schedule"].map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: "Optional" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: ["Income Statements", "Balance Sheets", "Cash Flow Statements", "CIM / Offering Memo"].map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "faq", className: "bg-secondary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "FAQ" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "Frequently Asked Questions" })
      ] }),
      __faqGroups.map((group) => /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4", children: group.category }),
        /* @__PURE__ */ jsx(Accordion, { type: "multiple", className: "space-y-2", children: group.items.map((item) => /* @__PURE__ */ jsxs(
          AccordionItem,
          {
            value: item.id,
            className: "border border-border rounded-lg px-4 bg-card",
            children: [
              /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left font-medium hover:no-underline text-foreground", children: item.question }),
              /* @__PURE__ */ jsx(AccordionContent, { className: "text-muted-foreground leading-relaxed", children: /* @__PURE__ */ jsx(
                "div",
                {
                  dangerouslySetInnerHTML: { __html: item.answer }
                }
              ) })
            ]
          },
          item.id
        )) })
      ] }, group.category))
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Our Approach" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6", children: "Three Pillars of shepi" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Our platform combines professional methodology, intelligent automation, and AI assistance to deliver fast, reliable QoE analysis." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Target, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "Structured Framework" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "A methodology designed by M&A professionals ensures consistency and completeness in every analysis." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Proven QoE methodology"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Guided step-by-step workflow"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Built-in best practices"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Zap, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "Intelligent Data Processing" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "Automated data extraction and organization eliminates hours of manual work and reduces errors." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Automatic data extraction"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Smart document parsing"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Cross-reference validation"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card p-8 rounded-lg border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Bot, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground mb-3", children: "AI-Powered Insights" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "AI assists with anomaly detection, adjustment suggestions, and document validation — all with full transparency." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Anomaly detection"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Adjustment recommendations"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }),
              "Source document validation"
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-primary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-primary-foreground mb-6", children: "Ready to Transform Your Due Diligence?" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto", children: "Join the professionals who are already using shepi to deliver faster, more consistent Quality of Earnings analysis." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
        /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 text-lg px-8 py-6", children: [
          "Get Started ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
        ] }) }),
        /* @__PURE__ */ jsx("a", { href: "#contact", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", className: "border-secondary text-secondary bg-transparent hover:bg-secondary/10 text-lg px-8 py-6", children: "Request a Demo" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "contact", className: "bg-secondary py-20 md:py-28 px-6 md:px-12", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 block", children: "Contact" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-serif font-bold text-foreground mb-6", children: "Get in Touch" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-8", children: "Have questions about shepi? Want to see a demo? We'd love to hear from you." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Email" }),
            /* @__PURE__ */ jsx("a", { href: "mailto:hello@shepi.ai", className: "text-foreground hover:text-primary", children: "hello@shepi.ai" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-card p-8 rounded-lg border border-border", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleContactSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-foreground mb-2", children: "Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "name",
                value: contactForm.name,
                onChange: (e) => setContactForm({ ...contactForm, name: e.target.value }),
                className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                placeholder: "Your name"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-foreground mb-2", children: "Email *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                value: contactForm.email,
                onChange: (e) => setContactForm({ ...contactForm, email: e.target.value }),
                className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                placeholder: "you@company.com"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "company", className: "block text-sm font-medium text-foreground mb-2", children: "Company" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "company",
              value: contactForm.company,
              onChange: (e) => setContactForm({ ...contactForm, company: e.target.value }),
              className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
              placeholder: "Your company (optional)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-foreground mb-2", children: "I am a…" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "role",
                value: contactForm.role,
                onChange: (e) => setContactForm({ ...contactForm, role: e.target.value }),
                className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select your role" }),
                  /* @__PURE__ */ jsx("option", { value: "Searcher / Buyer", children: "Searcher / Buyer" }),
                  /* @__PURE__ */ jsx("option", { value: "Broker / Advisor", children: "Broker / Advisor" }),
                  /* @__PURE__ */ jsx("option", { value: "Accountant / CPA", children: "Accountant / CPA" }),
                  /* @__PURE__ */ jsx("option", { value: "PE / Family Office", children: "PE / Family Office" }),
                  /* @__PURE__ */ jsx("option", { value: "Lender", children: "Lender" }),
                  /* @__PURE__ */ jsx("option", { value: "Other", children: "Other" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "interest", className: "block text-sm font-medium text-foreground mb-2", children: "Interested in…" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "interest",
                value: contactForm.interest,
                onChange: (e) => setContactForm({ ...contactForm, interest: e.target.value }),
                className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select a plan" }),
                  /* @__PURE__ */ jsx("option", { value: "Per Project", children: "Per Project" }),
                  /* @__PURE__ */ jsx("option", { value: "Done-For-You", children: "Done-For-You" }),
                  /* @__PURE__ */ jsx("option", { value: "Monthly Subscription", children: "Monthly Subscription" }),
                  /* @__PURE__ */ jsx("option", { value: "Firm Edition", children: "Firm Edition" }),
                  /* @__PURE__ */ jsx("option", { value: "Just Exploring", children: "Just Exploring" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-foreground mb-2", children: "Message *" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "message",
              rows: 6,
              maxLength: 5e3,
              value: contactForm.message,
              onChange: (e) => setContactForm({ ...contactForm, message: e.target.value }),
              className: "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y",
              placeholder: "How can we help?"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground text-right mt-1", children: [
            contactForm.message.length.toLocaleString(),
            " / 5,000"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Sending..." : "Send Message" })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-10 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Prefer a live conversation?" }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2qE2ZwYpCRi1MB-Ms9GnB1K7K3PpPCYankr9qdPiyVQYN8TqT9ZnkFuBz4mGlT4Lj0OukzYIrG?gv=true",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-sm text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-4 transition-colors",
          children: "View available times →"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-secondary py-16 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground mb-3", children: "For CPAs" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-serif text-foreground mb-3", children: "Review QoE adjustments. Earn side income." }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Licensed CPAs review AI-generated adjustments on Shepi's Done-For-You engagements. Flexible, per-engagement work — no business development required." })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/for-cpas",
          className: "inline-flex items-center justify-center rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-colors shrink-0",
          children: "Learn more →"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "bg-foreground py-12 px-6 md:px-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-5 gap-8 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(ShepiLogo, { variant: "light", size: "md" }),
          /* @__PURE__ */ jsx("p", { className: "text-secondary/70 mt-4 text-sm", children: "AI-assisted Quality of Earnings analysis for modern deal professionals." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-secondary font-semibold mb-4", children: "Product" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#features", className: "text-secondary/70 hover:text-secondary text-sm", children: "Features" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#how-it-works", className: "text-secondary/70 hover:text-secondary text-sm", children: "How It Works" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-secondary/70 hover:text-secondary text-sm", children: "Pricing" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-secondary font-semibold mb-4", children: "Quality of Earnings" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/quality-of-earnings-cost", className: "text-secondary/70 hover:text-secondary text-sm", children: "QoE Cost" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/quality-of-earnings-software", className: "text-secondary/70 hover:text-secondary text-sm", children: "QoE Software" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/quality-of-earnings-template", className: "text-secondary/70 hover:text-secondary text-sm", children: "QoE Template" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/quality-of-earnings-checklist", className: "text-secondary/70 hover:text-secondary text-sm", children: "QoE Checklist" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/resources", className: "text-secondary/70 hover:text-secondary text-sm", children: "All Resources" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-secondary font-semibold mb-4", children: "Company" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#our-story", className: "text-secondary/70 hover:text-secondary text-sm", children: "About" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#contact", className: "text-secondary/70 hover:text-secondary text-sm", children: "Contact" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/for-cpas", className: "text-secondary/70 hover:text-secondary text-sm", children: "For CPAs" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-secondary font-semibold mb-4", children: "Legal" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-secondary/70 hover:text-secondary text-sm", children: "Privacy Policy" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-secondary/70 hover:text-secondary text-sm", children: "Terms of Service" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/cookies", className: "text-secondary/70 hover:text-secondary text-sm", children: "Cookie Policy" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/eula", className: "text-secondary/70 hover:text-secondary text-sm", children: "EULA" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/dpa", className: "text-secondary/70 hover:text-secondary text-sm", children: "DPA" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/subprocessors", className: "text-secondary/70 hover:text-secondary text-sm", children: "Subprocessors" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-secondary/20 pt-8", children: /* @__PURE__ */ jsx("p", { className: "text-secondary/60 text-sm text-center", children: "© 2026 SMB EDGE. All rights reserved." }) })
    ] }) })
  ] });
};
const Auth = lazy(() => import("./assets/Auth-CfzDvP2A.js"));
const AuthCallback = lazy(() => import("./assets/AuthCallback-Dgg9EOFX.js"));
const Dashboard = lazy(() => import("./assets/Dashboard-CnCU8Clb.js"));
const Project = lazy(() => import("./assets/Project-DdUtjSDA.js"));
const Workbook = lazy(() => import("./assets/Workbook-ih54A7ge.js"));
const ResetPassword = lazy(() => import("./assets/ResetPassword-C9ulBA59.js"));
const Pricing = lazy(() => import("./assets/Pricing-yCWnxR3z.js"));
const PaymentSuccess = lazy(() => import("./assets/PaymentSuccess-DPyXQHKS.js"));
const Account = lazy(() => import("./assets/Account-C-HgOyaz.js"));
const WorkbookDemo = lazy(() => import("./assets/WorkbookDemo-BeSc6_3G.js"));
const WizardDemo = lazy(() => import("./assets/WizardDemo-DBoXGeaX.js"));
const DashboardDemo = lazy(() => import("./assets/DashboardDemo-DrsEXSAd.js"));
const DemoVideo = lazy(() => import("./assets/DemoVideo-BdlGvb_S.js"));
const NotFound = lazy(() => import("./assets/NotFound-BmJNuIwC.js"));
const Privacy = lazy(() => import("./assets/Privacy-CHMbrrUw.js"));
const Terms = lazy(() => import("./assets/Terms-CtQyOdsr.js"));
const Cookies = lazy(() => import("./assets/Cookies-Bpi_tI3n.js"));
const EULA = lazy(() => import("./assets/EULA-BLuQh3Gr.js"));
const Subprocessors = lazy(() => import("./assets/Subprocessors-BypQLp-S.js"));
const DPA = lazy(() => import("./assets/DPA-UV0cvimK.js"));
const Resources = lazy(() => import("./assets/Resources-CXTnmn6Y.js"));
const QualityOfEarnings = lazy(() => import("./assets/QualityOfEarnings-BGoFLUJq.js"));
const EBITDAAdjustments = lazy(() => import("./assets/EBITDAAdjustments-BfDIDV3f.js"));
const DueDiligenceChecklist = lazy(() => import("./assets/DueDiligenceChecklist-C6LrYicQ.js"));
const IndependentSearchers = lazy(() => import("./assets/IndependentSearchers-D7NedLNG.js"));
const PEFirms = lazy(() => import("./assets/PEFirms-B_jjiHOe.js"));
const DealAdvisors = lazy(() => import("./assets/DealAdvisors-B60GuS9B.js"));
const AccountantsCPA = lazy(() => import("./assets/AccountantsCPA-_CPsjX8d.js"));
const BusinessBrokers = lazy(() => import("./assets/BusinessBrokers-Bd5vKI8Y.js"));
const Lenders = lazy(() => import("./assets/Lenders-DT5IERjk.js"));
const ShepiVsExcel = lazy(() => import("./assets/ShepiVsExcel-BSeei5g7.js"));
const AIvsTraditional = lazy(() => import("./assets/AIvsTraditional-8juC7PNu.js"));
const QuickBooksIntegrationPage = lazy(() => import("./assets/QuickBooksIntegration-k4eiOdeO.js"));
const AIAssistantPage = lazy(() => import("./assets/AIAssistant-AIR6VLQs.js"));
const AIDueDiligencePage = lazy(() => import("./assets/AIDueDiligence-CfMAfgVn.js"));
const RevenueQualityAnalysis = lazy(() => import("./assets/RevenueQualityAnalysis-CcFV4IZw.js"));
const WorkingCapitalAnalysis = lazy(() => import("./assets/WorkingCapitalAnalysis-DFfBQ01O.js"));
const QoEReportTemplate = lazy(() => import("./assets/QoEReportTemplate-CJ4lZ4QH.js"));
const GeneralLedgerReview = lazy(() => import("./assets/GeneralLedgerReview-DThSPLjv.js"));
const EBITDABridge = lazy(() => import("./assets/EBITDABridge-CXpaCRPr.js"));
const FinancialRedFlags = lazy(() => import("./assets/FinancialRedFlags-uYqwf4NO.js"));
const CashProofAnalysis = lazy(() => import("./assets/CashProofAnalysis-C1spw9K6.js"));
const QoESoftware = lazy(() => import("./assets/QoESoftware-Tvv1U09u.js"));
const EBITDAAutomation = lazy(() => import("./assets/EBITDAAutomation-CaCdWlFF.js"));
const SellSideVsBuySideQoE = lazy(() => import("./assets/SellSideVsBuySideQoE-Bz0emrtV.js"));
const OwnerCompensationNormalization = lazy(() => import("./assets/OwnerCompensationNormalization-DcO48Wd-.js"));
const PersonalExpenseDetection = lazy(() => import("./assets/PersonalExpenseDetection-DwLK-Prm.js"));
const CustomerConcentrationRisk = lazy(() => import("./assets/CustomerConcentrationRisk-eZVfWSqW.js"));
const RunRateEBITDA = lazy(() => import("./assets/RunRateEBITDA-CfoKWXiV.js"));
const CanAIReplaceQoE = lazy(() => import("./assets/CanAIReplaceQoE-BzW-XizR.js"));
const AIWontDoYourQoE = lazy(() => import("./assets/AIWontDoYourQoE-B1dW3H8q.js"));
const AIAccountingAnomalyDetection = lazy(() => import("./assets/AIAccountingAnomalyDetection-GLG4m-R4.js"));
const EarningsManipulationSigns = lazy(() => import("./assets/EarningsManipulationSigns-BCUrxSbu.js"));
const SellersDiscretionaryEarnings = lazy(() => import("./assets/SellersDiscretionaryEarnings-CzxbKt0Z.js"));
const QualityOfEarningsCost = lazy(() => import("./assets/QualityOfEarningsCost-DBixQzA8.js"));
const QualityOfEarningsSoftware = lazy(() => import("./assets/QualityOfEarningsSoftware-CFyoZgeb.js"));
const QualityOfEarningsTemplate = lazy(() => import("./assets/QualityOfEarningsTemplate-BCsSUKLi.js"));
const QualityOfEarningsChecklist = lazy(() => import("./assets/QualityOfEarningsChecklist-B40itGew.js"));
const ScopeOfWork = lazy(() => import("./assets/ScopeOfWork-CE7LoGG5.js"));
const ForAiAgents = lazy(() => import("./assets/ForAiAgents-BT25jZ5l.js"));
const CpaPartners = lazy(() => import("./assets/CpaPartners-CF78s16n.js"));
const ForCpas = lazy(() => import("./assets/ForCpas-D1-bzuar.js"));
const AdminLayout = lazy(() => import("./assets/AdminLayout--Gofbnjr.js").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./assets/AdminDashboard-0eCEFntx.js"));
const AdminUsers = lazy(() => import("./assets/AdminUsers-cgwQY8cC.js"));
const AdminProjects = lazy(() => import("./assets/AdminProjects-DqZKNLBD.js"));
const AdminSubscriptions = lazy(() => import("./assets/AdminSubscriptions-z60SmTM1.js"));
const AdminContacts = lazy(() => import("./assets/AdminContacts-VYHfkks2.js"));
const AdminRAGUpload = lazy(() => import("./assets/AdminRAGUpload-B751uVXT.js"));
const AdminWhitelist = lazy(() => import("./assets/AdminWhitelist-B6-v8oi6.js"));
const AdminDiagnostics = lazy(() => import("./assets/AdminDiagnostics-B_jTnkIZ.js"));
const AdminDocuments = lazy(() => import("./assets/AdminDocuments-C4DbRXSL.js"));
const AdminDataExport = lazy(() => import("./assets/AdminDataExport-D5eFvfnJ.js"));
const AdminDFYEngagements = lazy(() => import("./assets/AdminDFYEngagements-CZKSZy3_.js"));
const AdminCpaApplications = lazy(() => import("./assets/AdminCpaApplications-lMKvbmSU.js"));
const AdminMigration = lazy(() => import("./assets/AdminMigration-B7TVMZ4s.js"));
const CpaLayout = lazy(() => import("./assets/CpaLayout-BaEnWr0w.js").then((m) => ({ default: m.CpaLayout })));
const CpaQueue = lazy(() => import("./assets/CpaQueue-KrvsDzFx.js"));
const CpaEngagements = lazy(() => import("./assets/CpaEngagements-BswzWVlY.js"));
const CpaEngagement = lazy(() => import("./assets/CpaEngagement-CQ9rYIBt.js"));
const CpaOnboarding = lazy(() => import("./assets/CpaOnboarding-DiNlyjGG.js"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1e3,
      retry: 1,
      refetchOnWindowFocus: true
    }
  }
});
const SuspenseFallback = () => /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f", color: "#a0a0a0", fontFamily: "system-ui, -apple-system, sans-serif" }, children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
  /* @__PURE__ */ jsx("div", { style: { width: 40, height: 40, border: "3px solid #333", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" } }),
  /* @__PURE__ */ jsx("div", { style: { fontSize: 14 }, children: "Loading..." })
] }) });
const wrap = (node) => /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(SuspenseFallback, {}), children: node });
const RootLayout = () => /* @__PURE__ */ jsx(AppErrorBoundary, { children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
  /* @__PURE__ */ jsx(Toaster$1, {}),
  /* @__PURE__ */ jsx(Toaster, {}),
  /* @__PURE__ */ jsx(ScrollToTop, {}),
  /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(SuspenseFallback, {}), children: /* @__PURE__ */ jsx(Outlet, {}) })
] }) }) });
const routes = [
  {
    path: "/",
    element: /* @__PURE__ */ jsx(RootLayout, {}),
    children: [
      { index: true, element: /* @__PURE__ */ jsx(Index, {}), entry: "src/pages/Index.tsx" },
      { path: "auth", element: wrap(/* @__PURE__ */ jsx(Auth, {})) },
      { path: "auth/callback", element: wrap(/* @__PURE__ */ jsx(AuthCallback, {})) },
      { path: "reset-password", element: wrap(/* @__PURE__ */ jsx(ResetPassword, {})) },
      { path: "dashboard", element: wrap(/* @__PURE__ */ jsx(Dashboard, {})) },
      { path: "project/:id", element: wrap(/* @__PURE__ */ jsx(Project, {})) },
      { path: "project/:id/workbook", element: wrap(/* @__PURE__ */ jsx(Workbook, {})) },
      { path: "workbook/demo", element: wrap(/* @__PURE__ */ jsx(WorkbookDemo, {})) },
      { path: "wizard/demo", element: wrap(/* @__PURE__ */ jsx(WizardDemo, {})) },
      { path: "dashboard/demo", element: wrap(/* @__PURE__ */ jsx(DashboardDemo, {})) },
      { path: "demo", element: wrap(/* @__PURE__ */ jsx(DemoVideo, {})) },
      { path: "pricing", element: wrap(/* @__PURE__ */ jsx(Pricing, {})) },
      { path: "payment-success", element: wrap(/* @__PURE__ */ jsx(PaymentSuccess, {})) },
      { path: "account", element: wrap(/* @__PURE__ */ jsx(Account, {})) },
      { path: "privacy", element: wrap(/* @__PURE__ */ jsx(Privacy, {})) },
      { path: "terms", element: wrap(/* @__PURE__ */ jsx(Terms, {})) },
      { path: "cookies", element: wrap(/* @__PURE__ */ jsx(Cookies, {})) },
      { path: "eula", element: wrap(/* @__PURE__ */ jsx(EULA, {})) },
      { path: "subprocessors", element: wrap(/* @__PURE__ */ jsx(Subprocessors, {})) },
      { path: "dpa", element: wrap(/* @__PURE__ */ jsx(DPA, {})) },
      { path: "cpa-partners", element: wrap(/* @__PURE__ */ jsx(CpaPartners, {})) },
      { path: "for-cpas", element: wrap(/* @__PURE__ */ jsx(ForCpas, {})) },
      // SEO Content Pages
      { path: "resources", element: wrap(/* @__PURE__ */ jsx(Resources, {})) },
      { path: "guides/quality-of-earnings", element: wrap(/* @__PURE__ */ jsx(QualityOfEarnings, {})) },
      { path: "guides/ebitda-adjustments", element: wrap(/* @__PURE__ */ jsx(EBITDAAdjustments, {})) },
      { path: "guides/due-diligence-checklist", element: wrap(/* @__PURE__ */ jsx(DueDiligenceChecklist, {})) },
      { path: "use-cases/independent-searchers", element: wrap(/* @__PURE__ */ jsx(IndependentSearchers, {})) },
      { path: "use-cases/pe-firms", element: wrap(/* @__PURE__ */ jsx(PEFirms, {})) },
      { path: "use-cases/deal-advisors", element: wrap(/* @__PURE__ */ jsx(DealAdvisors, {})) },
      { path: "use-cases/accountants-cpa", element: wrap(/* @__PURE__ */ jsx(AccountantsCPA, {})) },
      { path: "use-cases/business-brokers", element: wrap(/* @__PURE__ */ jsx(BusinessBrokers, {})) },
      { path: "use-cases/lenders", element: wrap(/* @__PURE__ */ jsx(Lenders, {})) },
      { path: "compare/shepi-vs-excel", element: wrap(/* @__PURE__ */ jsx(ShepiVsExcel, {})) },
      { path: "compare/ai-qoe-vs-traditional", element: wrap(/* @__PURE__ */ jsx(AIvsTraditional, {})) },
      { path: "features/quickbooks-integration", element: wrap(/* @__PURE__ */ jsx(QuickBooksIntegrationPage, {})) },
      { path: "features/ai-assistant", element: wrap(/* @__PURE__ */ jsx(AIAssistantPage, {})) },
      { path: "features/ai-due-diligence", element: wrap(/* @__PURE__ */ jsx(AIDueDiligencePage, {})) },
      { path: "guides/revenue-quality-analysis", element: wrap(/* @__PURE__ */ jsx(RevenueQualityAnalysis, {})) },
      { path: "guides/working-capital-analysis", element: wrap(/* @__PURE__ */ jsx(WorkingCapitalAnalysis, {})) },
      { path: "guides/qoe-report-template", element: wrap(/* @__PURE__ */ jsx(QoEReportTemplate, {})) },
      { path: "guides/general-ledger-review", element: wrap(/* @__PURE__ */ jsx(GeneralLedgerReview, {})) },
      { path: "guides/ebitda-bridge", element: wrap(/* @__PURE__ */ jsx(EBITDABridge, {})) },
      { path: "guides/financial-red-flags", element: wrap(/* @__PURE__ */ jsx(FinancialRedFlags, {})) },
      { path: "guides/cash-proof-analysis", element: wrap(/* @__PURE__ */ jsx(CashProofAnalysis, {})) },
      { path: "features/qoe-software", element: wrap(/* @__PURE__ */ jsx(QoESoftware, {})) },
      { path: "features/ebitda-automation", element: wrap(/* @__PURE__ */ jsx(EBITDAAutomation, {})) },
      { path: "guides/sell-side-vs-buy-side-qoe", element: wrap(/* @__PURE__ */ jsx(SellSideVsBuySideQoE, {})) },
      { path: "guides/owner-compensation-normalization", element: wrap(/* @__PURE__ */ jsx(OwnerCompensationNormalization, {})) },
      { path: "guides/personal-expense-detection", element: wrap(/* @__PURE__ */ jsx(PersonalExpenseDetection, {})) },
      { path: "guides/customer-concentration-risk", element: wrap(/* @__PURE__ */ jsx(CustomerConcentrationRisk, {})) },
      { path: "guides/run-rate-ebitda", element: wrap(/* @__PURE__ */ jsx(RunRateEBITDA, {})) },
      { path: "guides/can-ai-replace-qoe", element: wrap(/* @__PURE__ */ jsx(CanAIReplaceQoE, {})) },
      { path: "guides/ai-wont-do-your-qoe", element: wrap(/* @__PURE__ */ jsx(AIWontDoYourQoE, {})) },
      { path: "guides/ai-accounting-anomaly-detection", element: wrap(/* @__PURE__ */ jsx(AIAccountingAnomalyDetection, {})) },
      { path: "guides/earnings-manipulation-signs", element: wrap(/* @__PURE__ */ jsx(EarningsManipulationSigns, {})) },
      { path: "guides/sellers-discretionary-earnings", element: wrap(/* @__PURE__ */ jsx(SellersDiscretionaryEarnings, {})) },
      // P0 Money Pages
      { path: "quality-of-earnings-cost", element: wrap(/* @__PURE__ */ jsx(QualityOfEarningsCost, {})) },
      { path: "quality-of-earnings-software", element: wrap(/* @__PURE__ */ jsx(QualityOfEarningsSoftware, {})) },
      { path: "quality-of-earnings-template", element: wrap(/* @__PURE__ */ jsx(QualityOfEarningsTemplate, {})) },
      { path: "quality-of-earnings-checklist", element: wrap(/* @__PURE__ */ jsx(QualityOfEarningsChecklist, {})) },
      { path: "scope", element: wrap(/* @__PURE__ */ jsx(ScopeOfWork, {})) },
      { path: "for-ai-agents", element: wrap(/* @__PURE__ */ jsx(ForAiAgents, {})) },
      // Admin
      {
        path: "admin",
        element: wrap(/* @__PURE__ */ jsx(AdminLayout, {})),
        children: [
          { index: true, element: wrap(/* @__PURE__ */ jsx(AdminDashboard, {})) },
          { path: "users", element: wrap(/* @__PURE__ */ jsx(AdminUsers, {})) },
          { path: "projects", element: wrap(/* @__PURE__ */ jsx(AdminProjects, {})) },
          { path: "subscriptions", element: wrap(/* @__PURE__ */ jsx(AdminSubscriptions, {})) },
          { path: "whitelist", element: wrap(/* @__PURE__ */ jsx(AdminWhitelist, {})) },
          { path: "contacts", element: wrap(/* @__PURE__ */ jsx(AdminContacts, {})) },
          { path: "rag", element: wrap(/* @__PURE__ */ jsx(AdminRAGUpload, {})) },
          { path: "diagnostics", element: wrap(/* @__PURE__ */ jsx(AdminDiagnostics, {})) },
          { path: "documents", element: wrap(/* @__PURE__ */ jsx(AdminDocuments, {})) },
          { path: "data-export", element: wrap(/* @__PURE__ */ jsx(AdminDataExport, {})) },
          { path: "dfy-engagements", element: wrap(/* @__PURE__ */ jsx(AdminDFYEngagements, {})) },
          { path: "cpa-applications", element: wrap(/* @__PURE__ */ jsx(AdminCpaApplications, {})) },
          { path: "migration", element: wrap(/* @__PURE__ */ jsx(AdminMigration, {})) }
        ]
      },
      // CPA
      {
        path: "cpa",
        element: wrap(/* @__PURE__ */ jsx(CpaLayout, {})),
        children: [
          { index: true, element: wrap(/* @__PURE__ */ jsx(CpaQueue, {})) },
          { path: "engagements", element: wrap(/* @__PURE__ */ jsx(CpaEngagements, {})) },
          { path: "engagements/:projectId", element: wrap(/* @__PURE__ */ jsx(CpaEngagement, {})) },
          { path: "onboarding", element: wrap(/* @__PURE__ */ jsx(CpaOnboarding, {})) }
        ]
      },
      { path: "*", element: wrap(/* @__PURE__ */ jsx(NotFound, {})) }
    ]
  }
];
if (typeof window !== "undefined") {
  const installStaticLoaderDataFetchGuard = () => {
    if (window.__SHEPI_STATIC_LOADER_FETCH_GUARD__) {
      return;
    }
    const originalFetch = window.fetch.bind(window);
    window.__SHEPI_STATIC_LOADER_FETCH_GUARD__ = true;
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : typeof Request !== "undefined" && input instanceof Request ? input.url : "";
      let isStaticLoaderRequest = false;
      let isSameOriginJson = false;
      try {
        const parsed = new URL(requestUrl, window.location.origin);
        const sameOrigin = parsed.origin === window.location.origin;
        isStaticLoaderRequest = parsed.pathname.includes("/static-loader-data");
        isSameOriginJson = sameOrigin && parsed.pathname.endsWith(".json");
      } catch {
        isStaticLoaderRequest = false;
      }
      if (!isStaticLoaderRequest && !isSameOriginJson) {
        return originalFetch(input, init);
      }
      try {
        const response = await originalFetch(input, init);
        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.includes("application/json")) {
          return response;
        }
        console.warn("[SSG] Ignoring invalid static loader data response", response.status, requestUrl);
      } catch (error) {
        console.warn("[SSG] Static loader data request failed", requestUrl, error);
      }
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    };
  };
  installStaticLoaderDataFetchGuard();
  if (window.location.hash.includes("access_token=") || window.location.hash.includes("error=")) {
    const hash = window.location.hash;
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth/callback") {
      console.log(
        "[OAuth Bootstrap] Detected OAuth hash on path:",
        currentPath,
        "- redirecting to /auth/callback"
      );
      window.location.href = "/auth/callback" + hash;
      throw new Error("Redirecting to OAuth callback");
    }
  }
  window.addEventListener("error", (event) => {
    console.error(
      "[Global Error]",
      event.error?.message || event.message,
      event.error?.stack
    );
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Unhandled Promise Rejection]", event.reason);
  });
}
const isSpaShell = typeof window !== "undefined" && !document.querySelector("[data-server-rendered=true]");
if (isSpaShell) {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.id = "__shepi_spa_root__";
    rootEl.innerHTML = "";
  }
}
const createRoot = ViteReactSSG({ routes });
if (isSpaShell && typeof window !== "undefined") {
  void (async () => {
    const [
      { createRoot: reactCreateRoot },
      { RouterProvider, createBrowserRouter, matchRoutes },
      { HelmetProvider },
      React2
    ] = await Promise.all([
      import("react-dom/client"),
      import("react-router-dom"),
      import("react-helmet-async"),
      import("react")
    ]);
    const container = document.getElementById("__shepi_spa_root__");
    if (!container) return;
    const matches = matchRoutes(routes, window.location);
    if (matches) {
      await Promise.all(
        matches.filter((m) => m.route.lazy).map(async (m) => {
          const mod = await m.route.lazy();
          Object.assign(m.route, { ...mod, lazy: void 0 });
        })
      );
    }
    const router = createBrowserRouter(routes);
    const root = reactCreateRoot(container);
    React2.startTransition(() => {
      root.render(
        React2.createElement(
          HelmetProvider,
          null,
          React2.createElement(RouterProvider, { router })
        )
      );
    });
  })();
}
export {
  Accordion as A,
  Button as B,
  Card as C,
  PRICING as P,
  ShepiLogo as S,
  TooltipProvider as T,
  clearOAuthProcessedFlag as a,
  CardHeader as b,
  cleanupOAuthHash as c,
  createRoot,
  CardTitle as d,
  CardDescription as e,
  CardContent as f,
  trySetSessionFromUrlHash as g,
  hasOAuthCallback as h,
  trackEvent as i,
  Badge as j,
  AccordionItem as k,
  AccordionTrigger as l,
  AccordionContent as m,
  cn as n,
  Tooltip as o,
  TooltipTrigger as p,
  TooltipContent as q,
  buttonVariants as r,
  supabase as s,
  toast as t,
  useSEO as u,
  useToast as v,
  parseLocalDate as w,
  useToast$1 as x
};
