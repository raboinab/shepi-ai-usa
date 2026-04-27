import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Clock, XCircle, AlertCircle, CheckCircle, Globe, Webhook, Key, Shield, RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { m as cn, s as supabase, B as Button, C as Card, b as CardHeader, d as CardTitle, f as CardContent, e as CardDescription } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import "vite-react-ssg";
import "react-router-dom";
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
function getStatusIcon(func) {
  if (!func.deployed) {
    return /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 text-destructive" });
  }
  if (func.statusCode >= 500 || func.statusCode === 0) {
    return /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-destructive" });
  }
  if (func.statusCode >= 400) {
    return /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-primary" });
  }
  return /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-primary" });
}
function getStatusLabel(func) {
  if (!func.deployed) return "Not Deployed";
  if (func.statusCode >= 500) return "Server Error";
  if (func.statusCode === 401) return "Auth Required";
  if (func.statusCode === 400) return "Bad Request";
  if (func.statusCode === 200) return "OK";
  return `${func.statusCode}`;
}
function getAuthIcon(authType) {
  switch (authType) {
    case "jwt":
      return /* @__PURE__ */ jsx(Shield, { className: "h-3 w-3" });
    case "api-key":
      return /* @__PURE__ */ jsx(Key, { className: "h-3 w-3" });
    case "webhook":
      return /* @__PURE__ */ jsx(Webhook, { className: "h-3 w-3" });
    case "public":
      return /* @__PURE__ */ jsx(Globe, { className: "h-3 w-3" });
  }
}
function FunctionCard({ func }) {
  const isHealthy = func.deployed && func.statusCode < 500 && func.statusCode !== 0;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-center justify-between p-3 rounded-lg border",
        isHealthy ? "bg-card" : "bg-destructive/5 border-destructive/20"
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          getStatusIcon(func),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-medium", children: func.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs gap-1", children: [
                getAuthIcon(func.authType),
                func.authType
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
                func.responseTimeMs,
                "ms"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: isHealthy ? "default" : "destructive",
              className: "text-xs",
              children: getStatusLabel(func)
            }
          ),
          func.error && /* @__PURE__ */ jsx("div", { className: "text-xs text-destructive mt-1 max-w-[150px] truncate", children: func.error })
        ] })
      ]
    }
  );
}
const FUNCTION_DEFINITIONS = [
  // Payments (4)
  { name: "check-subscription", authType: "jwt", category: "payments" },
  { name: "create-checkout", authType: "jwt", category: "payments" },
  { name: "customer-portal", authType: "jwt", category: "payments" },
  { name: "stripe-webhook", authType: "webhook", category: "webhooks" },
  // QuickBooks (8)
  { name: "trigger-qb-sync", authType: "jwt", category: "quickbooks" },
  { name: "qb-sync-complete", authType: "api-key", category: "quickbooks" },
  { name: "complete-qb-sync", authType: "api-key", category: "quickbooks" },
  { name: "check-workflow-health", authType: "jwt", category: "quickbooks" },
  { name: "get-qb-credentials", authType: "api-key", category: "quickbooks" },
  { name: "refresh-qb-token", authType: "jwt", category: "quickbooks" },
  { name: "proactive-qb-refresh", authType: "api-key", category: "quickbooks" },
  { name: "process-quickbooks-file", authType: "jwt", category: "quickbooks" },
  // Documents (8)
  { name: "extract-document-text", authType: "jwt", category: "documents" },
  { name: "process-statement", authType: "jwt", category: "documents" },
  { name: "validate-document-type", authType: "jwt", category: "documents" },
  { name: "validate-financial-statement", authType: "jwt", category: "documents" },
  { name: "process-payroll-document", authType: "jwt", category: "documents" },
  { name: "process-fixed-assets", authType: "jwt", category: "documents" },
  { name: "process-debt-schedule", authType: "jwt", category: "documents" },
  { name: "process-material-contract", authType: "jwt", category: "documents" },
  // Data Storage (3)
  { name: "processed-data-create", authType: "jwt", category: "data" },
  { name: "processed-data-list", authType: "jwt", category: "data" },
  { name: "processed-data-get-by-document", authType: "jwt", category: "data" },
  // AI/Insights (7)
  { name: "insights-chat", authType: "jwt", category: "ai" },
  { name: "validate-adjustment-proof", authType: "jwt", category: "ai" },
  { name: "embed-qoe-book", authType: "jwt", category: "ai" },
  { name: "embed-rag-chunks", authType: "jwt", category: "ai" },
  { name: "analyze-transactions", authType: "jwt", category: "ai" },
  { name: "ai-backend-proxy", authType: "jwt", category: "ai" },
  { name: "verify-management-adjustment", authType: "jwt", category: "ai" },
  // Export (2)
  { name: "export-pdf", authType: "jwt", category: "export" },
  // Documents (continued)
  { name: "process-lease-agreement", authType: "jwt", category: "documents" },
  { name: "process-inventory-report", authType: "jwt", category: "documents" },
  { name: "parse-cim", authType: "jwt", category: "documents" },
  { name: "parse-tax-return", authType: "jwt", category: "documents" },
  { name: "enrich-document", authType: "jwt", category: "documents" },
  // Webhooks (1 - stripe-webhook already in payments)
  { name: "docuclipper-webhook", authType: "webhook", category: "webhooks" },
  // Misc (4)
  { name: "submit-contact", authType: "public", category: "misc" },
  { name: "notify-admin", authType: "api-key", category: "misc" },
  { name: "recover-stale-documents", authType: "api-key", category: "misc" },
  { name: "update-promo-config", authType: "jwt", category: "misc" }
];
const getPayloadForFunction = (funcName) => {
  switch (funcName) {
    case "trigger-qb-sync":
      return { project_id: "health-check-dummy-id" };
    case "create-checkout":
      return { planType: "monthly" };
    case "process-quickbooks-file":
    case "extract-document-text":
    case "process-statement":
    case "process-payroll-document":
    case "process-fixed-assets":
    case "process-debt-schedule":
    case "process-material-contract":
    case "validate-document-type":
    case "validate-financial-statement":
    case "processed-data-get-by-document":
    case "analyze-transactions":
    case "parse-cim":
      return { documentId: "health-check-dummy-id", projectId: "health-check-dummy-id" };
    case "refresh-qb-token":
    case "processed-data-list":
    case "export-pdf":
    case "update-promo-config":
      return { project_id: "health-check-dummy-id" };
    case "ai-backend-proxy":
      return { endpoint: "classify-status", payload: { project_id: "health-check-dummy-id" } };
    case "enrich-document":
    case "process-lease-agreement":
    case "process-inventory-report":
      return { documentId: "health-check-dummy-id", projectId: "health-check-dummy-id" };
    case "verify-management-adjustment":
      return { adjustmentId: "health-check-dummy-id", projectId: "health-check-dummy-id" };
    case "notify-admin":
      return { event_type: "demo_view", user_email: "healthcheck@test.com", page: "diagnostics" };
    case "recover-stale-documents":
      return { dry_run: true };
    case "check-workflow-health":
      return { project_id: "health-check-dummy-id" };
    case "processed-data-create":
      return {
        project_id: "health-check-dummy-id",
        source_type: "health_check",
        data_type: "health_check",
        data: {}
      };
    case "validate-adjustment-proof":
      return {
        adjustmentId: "dummy",
        adjustment: { description: "test", category: "test", amount: 0, status: "test", notes: "" },
        documentIds: ["dummy"],
        projectId: "dummy"
      };
    case "embed-qoe-book":
    case "embed-rag-chunks":
      return { chunks: [], source: "health-check" };
    // Empty chunks might still fail validation but should be 400
    case "insights-chat":
      return { messages: [{ role: "user", content: "health check" }] };
    case "submit-contact":
      return { name: "Health Check", email: "test@example.com", message: "Health check" };
    default:
      return {};
  }
};
function useEdgeFunctionHealth() {
  const [results, setResults] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState(null);
  const checkFunction = useCallback(async (funcDef) => {
    const startTime = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json"
      };
      if (funcDef.authType === "jwt" && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const method = ["proactive-qb-refresh"].includes(funcDef.name) ? "GET" : "POST";
      const body = method === "POST" ? JSON.stringify(getPayloadForFunction(funcDef.name)) : void 0;
      const response = await fetch(
        `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/functions/v1/${funcDef.name}`,
        {
          method,
          headers,
          body
        }
      );
      const responseTimeMs = Date.now() - startTime;
      let deployed = response.status !== 404;
      let errorMsg;
      if (response.status === 404) {
        try {
          const body2 = await response.json();
          if (body2 && typeof body2 === "object" && "error" in body2) {
            deployed = true;
            errorMsg = void 0;
          } else {
            errorMsg = "Function not found (404)";
          }
        } catch {
          errorMsg = "Function not found (404)";
        }
      }
      return {
        ...funcDef,
        deployed,
        statusCode: response.status,
        responseTimeMs,
        lastChecked: /* @__PURE__ */ new Date(),
        error: errorMsg
      };
    } catch (error) {
      return {
        ...funcDef,
        deployed: false,
        statusCode: 0,
        responseTimeMs: Date.now() - startTime,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Network error"
      };
    }
  }, []);
  const checkAllFunctions = useCallback(async () => {
    setIsChecking(true);
    try {
      const batchSize = 6;
      const allResults = [];
      for (let i = 0; i < FUNCTION_DEFINITIONS.length; i += batchSize) {
        const batch = FUNCTION_DEFINITIONS.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(checkFunction));
        allResults.push(...batchResults);
        setResults([...allResults]);
      }
      setLastFullCheck(/* @__PURE__ */ new Date());
      return allResults;
    } finally {
      setIsChecking(false);
    }
  }, [checkFunction]);
  const getStats = useCallback(() => {
    const deployed = results.filter((r) => r.deployed).length;
    const total = FUNCTION_DEFINITIONS.length;
    const avgResponseTime = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length) : 0;
    const errors = results.filter((r) => r.statusCode >= 500 || r.statusCode === 0).length;
    return { deployed, total, avgResponseTime, errors };
  }, [results]);
  const getByCategory = useCallback(() => {
    const categories = {};
    for (const result of results) {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    }
    return categories;
  }, [results]);
  return {
    results,
    isChecking,
    lastFullCheck,
    checkAllFunctions,
    checkFunction,
    getStats,
    getByCategory,
    functionCount: FUNCTION_DEFINITIONS.length
  };
}
const CATEGORY_LABELS = {
  payments: "Payments & Billing",
  quickbooks: "QuickBooks Sync",
  documents: "Document Processing",
  data: "Data Storage",
  ai: "AI & Insights",
  export: "Export",
  webhooks: "Webhooks",
  misc: "Miscellaneous"
};
const CATEGORY_ORDER = ["payments", "quickbooks", "documents", "data", "ai", "export", "webhooks", "misc"];
function AdminDiagnostics() {
  const {
    results,
    isChecking,
    lastFullCheck,
    checkAllFunctions,
    getStats,
    getByCategory,
    functionCount
  } = useEdgeFunctionHealth();
  useEffect(() => {
    if (results.length === 0) {
      checkAllFunctions();
    }
  }, []);
  const stats = getStats();
  const byCategory = getByCategory();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Backend Diagnostics" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "Monitor and test all ",
          functionCount,
          " backend functions"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: checkAllFunctions, disabled: isChecking, children: isChecking ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Spinner, { className: "mr-2 h-4 w-4" }),
        "Checking..."
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        "Test All Functions"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Deployed" }),
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-primary" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
            stats.deployed,
            "/",
            stats.total
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Functions responding" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Errors" }),
          /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 text-destructive" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.errors }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Functions with issues" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Avg Response" }),
          /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-warning" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
            stats.avgResponseTime,
            "ms"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Average response time" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Last Check" }),
          /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: lastFullCheck ? lastFullCheck.toLocaleTimeString() : "Never" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: lastFullCheck ? lastFullCheck.toLocaleDateString() : "Run a check" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "py-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Status Legend" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { children: "200/401/400" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Function deployed & responding" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: "404" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Not deployed" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: "5xx/0" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Server error" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 text-sm mt-3 pt-3 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "gap-1", children: "jwt" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "User token required" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "gap-1", children: "api-key" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Service API key" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "gap-1", children: "webhook" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Signature validation" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "gap-1", children: "public" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "No auth needed" })
          ] })
        ] })
      ] })
    ] }),
    isChecking && results.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }),
      /* @__PURE__ */ jsx("span", { className: "ml-3 text-muted-foreground", children: "Running health checks..." })
    ] }) : results.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: 'No results yet. Click "Test All Functions" to check backend health.' })
    ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: CATEGORY_ORDER.map((category) => {
      const functions = byCategory[category] || [];
      if (functions.length === 0) return null;
      const deployedCount = functions.filter((f) => f.deployed).length;
      const hasErrors = functions.some((f) => f.statusCode >= 500 || f.statusCode === 0);
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: CATEGORY_LABELS[category] || category }),
            /* @__PURE__ */ jsxs(Badge, { variant: hasErrors ? "destructive" : "outline", children: [
              deployedCount,
              "/",
              functions.length
            ] })
          ] }),
          /* @__PURE__ */ jsxs(CardDescription, { children: [
            functions.length,
            " function",
            functions.length !== 1 ? "s" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: functions.map((func) => /* @__PURE__ */ jsx(FunctionCard, { func }, func.name)) })
      ] }, category);
    }) })
  ] });
}
export {
  AdminDiagnostics as default
};
