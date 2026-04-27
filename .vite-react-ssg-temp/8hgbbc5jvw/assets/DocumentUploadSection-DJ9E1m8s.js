import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo } from "react";
import { T as TooltipProvider, n as Tooltip, o as TooltipTrigger, m as cn, p as TooltipContent, s as supabase, B as Button, C as Card, b as CardHeader, d as CardTitle, f as CardContent, e as CardDescription, r as parseLocalDate } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, e as SelectGroup, f as SelectLabel, d as SelectItem } from "./select-CXC355eQ.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C93YiWo6.js";
import { C as Command, a as CommandInput, b as CommandList, c as CommandEmpty, d as CommandGroup, e as CommandItem } from "./command-CJVemXry.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-FolYmCWY.js";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { CheckCircle2, Circle, FileText, Calendar, X, SkipForward, AlertCircle, Loader2, RefreshCw, ExternalLink, Scale, AlertTriangle, ChevronUp, ChevronDown, Users, Landmark, Calculator, BarChart3, Building2, DollarSign, Info, XCircle, BookOpen, Layers, FileEdit, Hash, Sparkles, Play, HelpCircle, ChevronsUpDown, Check, Upload, ShieldCheck, Trash2, Clock } from "lucide-react";
import { u as useIsMobile } from "./use-mobile-hSLzflml.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { toast } from "sonner";
import { e as generateAnnualPeriods, h as generateFullPeriodMarker, i as calculateAnnualCoverage, j as calculatePointInTimeCoverage, k as calculateFullPeriodCoverage, d as calculatePeriodCoverage, l as groupConsecutivePeriods } from "./periodUtils-DliZcATp.js";
import { C as CIMInsightsCard } from "./CIMInsightsCard-B_1Yk3jo.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { S as Separator } from "./separator-BGlMS6na.js";
import { u as useAnalysisTrigger } from "./useAnalysisTrigger-DbHpK9Um.js";
import { D as DocumentValidationDialog } from "./DocumentValidationDialog-CUugaJUt.js";
import { D as DocumentChecklistReference } from "./DocumentChecklistReference-BfK18ncS.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { l as logUploadError, g as getUploadErrorMessage } from "./uploadErrorLogger-CC95ChV1.js";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "@radix-ui/react-popover";
import "cmdk";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tabs";
import "@radix-ui/react-progress";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-separator";
import "date-fns";
import "./documentChecklist-BAkBsBzh.js";
const CoverageTimeline = ({
  periods,
  coverage,
  coverageType = "monthly",
  documentCount = 0,
  hasQBCoverage = false
}) => {
  if (coverageType === "point-in-time") {
    return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 p-3 rounded-lg border bg-card", children: coverage.status === "full" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-green-500" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Document uploaded" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          documentCount,
          " ",
          documentCount === 1 ? "snapshot" : "snapshots",
          " available"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Circle, { className: "h-5 w-5 text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "No document uploaded" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Upload a point-in-time snapshot" })
      ] })
    ] }) }) }) });
  }
  if (coverageType === "full-period") {
    const periodLabel = periods[0]?.label || "Full Period";
    return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 p-3 rounded-lg border bg-card", children: coverage.status === "full" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-green-500" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Full period covered" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: periodLabel })
      ] })
    ] }) : coverage.status === "partial" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-yellow-500" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-yellow-600", children: "Partial coverage" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Document uploaded but doesn't span ",
          periodLabel
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Circle, { className: "h-5 w-5 text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "No document uploaded" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Upload a document covering ",
          periodLabel
        ] })
      ] })
    ] }) }) }) });
  }
  if (coverageType === "annual") {
    if (periods.length === 0) {
      return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-4", children: "No years defined for this project" });
    }
    const coveredIds2 = new Set(coverage.coveredPeriods.map((p) => p.id));
    return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: periods.map((period) => {
        const isCovered = coveredIds2.has(period.id);
        return /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "h-10 flex-1 rounded-md transition-colors cursor-pointer min-w-[60px] flex items-center justify-center",
                isCovered ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted hover:bg-muted-foreground/30"
              ),
              children: /* @__PURE__ */ jsx("span", { className: cn(
                "text-xs font-medium",
                isCovered ? "text-white" : "text-muted-foreground"
              ), children: period.label })
            }
          ) }),
          /* @__PURE__ */ jsxs(TooltipContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
                "Tax Year ",
                period.label
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: cn(
              "text-xs mt-1",
              isCovered ? "text-green-400" : "text-destructive"
            ), children: isCovered ? "✓ Return uploaded" : "✗ Missing return" })
          ] })
        ] }, period.id);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-sm bg-green-500" }),
          /* @__PURE__ */ jsx("span", { children: "Return Uploaded" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-sm bg-muted" }),
          /* @__PURE__ */ jsx("span", { children: "Missing" })
        ] })
      ] })
    ] }) });
  }
  if (periods.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-4", children: "No periods defined for this project" });
  }
  const coveredIds = new Set(coverage.coveredPeriods.map((p) => p.id));
  const displayPeriods = periods.length > 36 ? periods.filter((_, i) => i % Math.ceil(periods.length / 36) === 0) : periods;
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex gap-0.5", children: displayPeriods.map((period) => {
      const isCovered = coveredIds.has(period.id);
      return /* @__PURE__ */ jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "h-6 flex-1 rounded-sm transition-colors cursor-pointer min-w-[8px]",
              isCovered ? "bg-green-500 hover:bg-green-600" : "bg-muted hover:bg-muted-foreground/30"
            )
          }
        ) }),
        /* @__PURE__ */ jsxs(TooltipContent, { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: period.label }),
          /* @__PURE__ */ jsx("p", { className: cn(
            "text-xs",
            isCovered ? "text-green-400" : "text-destructive"
          ), children: isCovered ? "✓ Covered" : "✗ Missing" })
        ] })
      ] }, period.id);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: periods[0]?.label }),
      periods.length > 1 && /* @__PURE__ */ jsx("span", { children: periods[periods.length - 1]?.label })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-xs flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-sm bg-green-500" }),
        /* @__PURE__ */ jsx("span", { children: "Covered" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-sm bg-muted" }),
        /* @__PURE__ */ jsx("span", { children: "Missing" })
      ] }),
      hasQBCoverage && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", children: "QB" }),
        /* @__PURE__ */ jsx("span", { children: "Synced from QuickBooks" })
      ] })
    ] })
  ] }) });
};
const DEFAULT_ORCHESTRATOR_URL = void 0;
function useWorkflow(options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const orchestratorUrl = options.orchestratorUrl || DEFAULT_ORCHESTRATOR_URL;
  const triggerWorkflow = useCallback(async (projectId, workflowType, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            project_id: projectId,
            workflow_type: workflowType,
            payload
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to trigger workflow");
        }
        return await response.json();
      }
      const { data, error: insertError } = await supabase.from("workflows").insert([{
        project_id: projectId,
        user_id: user.id,
        workflow_type: workflowType,
        status: "pending",
        progress_percent: 0,
        input_payload: JSON.parse(JSON.stringify(payload))
      }]).select("id, status").single();
      if (insertError) throw insertError;
      const result = data;
      return {
        workflow_id: result.id,
        status: result.status,
        message: "Workflow created. Waiting for orchestrator to process."
      };
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      throw error2;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);
  const cancelWorkflow = useCallback(async (workflowId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows/${workflowId}/cancel`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to cancel workflow");
        }
        return;
      }
      const { error: updateError } = await supabase.from("workflows").update({ status: "cancelled" }).eq("id", workflowId);
      if (updateError) throw updateError;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      throw error2;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);
  const retryWorkflow = useCallback(async (workflowId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows/${workflowId}/retry`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to retry workflow");
        }
        return await response.json();
      }
      const { data, error: updateError } = await supabase.from("workflows").update({
        status: "pending",
        error_message: null,
        error_details: null,
        progress_percent: 0
      }).eq("id", workflowId).select("id, status, retry_count").single();
      if (updateError) throw updateError;
      const result = data;
      const currentRetryCount = result.retry_count || 0;
      await supabase.from("workflows").update({ retry_count: currentRetryCount + 1 }).eq("id", workflowId);
      return {
        workflow_id: result.id,
        status: result.status,
        message: "Workflow queued for retry"
      };
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      throw error2;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);
  return {
    triggerWorkflow,
    cancelWorkflow,
    retryWorkflow,
    isLoading,
    error
  };
}
function useWorkflowStatus(workflowId) {
  const [workflow, setWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) {
      setWorkflow(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from("workflows").select("*").eq("id", workflowId).single();
      if (fetchError) throw fetchError;
      const transformedWorkflow = {
        ...data,
        steps: data.steps || [],
        input_payload: data.input_payload || {},
        output_payload: data.output_payload,
        error_details: data.error_details
      };
      setWorkflow(transformedWorkflow);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch workflow"));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);
  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);
  useEffect(() => {
    if (!workflowId) return;
    const channel = supabase.channel(`workflow-${workflowId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "workflows",
        filter: `id=eq.${workflowId}`
      },
      (payload) => {
        const data = payload.new;
        const transformedWorkflow = {
          ...data,
          steps: data.steps || [],
          input_payload: data.input_payload || {},
          output_payload: data.output_payload,
          error_details: data.error_details
        };
        setWorkflow(transformedWorkflow);
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId]);
  return {
    workflow,
    isLoading,
    error,
    refetch: fetchWorkflow
  };
}
const WORKFLOW_LABELS = {
  IMPORT_QUICKBOOKS_DATA: "Importing QuickBooks Data",
  PROCESS_DOCUMENT: "Processing Document",
  SYNC_TO_SHEET: "Syncing to Spreadsheet",
  FULL_DATA_SYNC: "Full Data Sync",
  GENERATE_QOE_REPORT: "Generating QoE Report",
  VALIDATE_ADJUSTMENTS: "Validating Adjustments",
  REFRESH_QB_TOKEN: "Refreshing QuickBooks Connection"
};
function StepIcon({ status }) {
  switch (status) {
    case "completed":
      return /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-primary" });
    case "running":
      return /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 text-primary animate-spin" });
    case "failed":
      return /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-destructive" });
    case "skipped":
      return /* @__PURE__ */ jsx(SkipForward, { className: "h-4 w-4 text-muted-foreground" });
    default:
      return /* @__PURE__ */ jsx(Circle, { className: "h-4 w-4 text-muted-foreground" });
  }
}
function WorkflowProgress({
  workflow,
  onCancel,
  showSteps = true,
  compact = false
}) {
  const isRunning = workflow.status === "running" || workflow.status === "pending";
  const label = WORKFLOW_LABELS[workflow.workflow_type] || workflow.workflow_type;
  if (compact) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium truncate", children: label }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            workflow.progress_percent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Progress, { value: workflow.progress_percent, className: "h-2" })
      ] }),
      isRunning && onCancel && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: onCancel, className: "h-8 w-8", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: label }),
      isRunning && onCancel && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onCancel, children: [
        /* @__PURE__ */ jsx(X, { className: "h-4 w-4 mr-1" }),
        "Cancel"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: workflow.current_step || "Initializing..." }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
            workflow.progress_percent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Progress, { value: workflow.progress_percent })
      ] }),
      showSteps && workflow.steps.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: workflow.steps.map((step) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex items-center gap-2 text-sm",
            step.status === "pending" && "text-muted-foreground"
          ),
          children: [
            /* @__PURE__ */ jsx(StepIcon, { status: step.status }),
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: step.name }),
            step.status === "failed" && step.error_message && /* @__PURE__ */ jsx("span", { className: "text-xs text-destructive truncate max-w-[200px]", children: step.error_message })
          ]
        },
        step.id
      )) })
    ] })
  ] });
}
const ERROR_HELP_LINKS = {
  QB_AUTH_EXPIRED: "/help/quickbooks-connection",
  QB_RATE_LIMITED: "/help/quickbooks-rate-limits",
  SHEET_NOT_FOUND: "/help/spreadsheet-setup",
  SHEET_PERMISSION_DENIED: "/help/spreadsheet-permissions",
  DOCUMENT_PARSE_FAILED: "/help/document-upload"
};
function WorkflowError({ workflow, onRetry, isRetrying = false }) {
  const errorDetails = workflow.error_details;
  const isRecoverable = errorDetails?.recoverable ?? true;
  const errorCode = errorDetails?.code;
  const helpLink = errorCode ? ERROR_HELP_LINKS[errorCode] : void 0;
  return /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
    /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
    /* @__PURE__ */ jsx(AlertTitle, { children: "Workflow Failed" }),
    /* @__PURE__ */ jsxs(AlertDescription, { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("p", { children: workflow.error_message || "An unexpected error occurred." }),
      errorDetails?.suggested_action && /* @__PURE__ */ jsx("p", { className: "text-sm opacity-90", children: errorDetails.suggested_action }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
        isRecoverable && onRetry && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: onRetry,
            disabled: isRetrying,
            children: isRetrying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-1 animate-spin" }),
              "Retrying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
              "Retry"
            ] })
          }
        ),
        helpLink && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: helpLink, target: "_blank", rel: "noopener noreferrer", children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4 mr-1" }),
          "Get Help"
        ] }) })
      ] }),
      workflow.retry_count > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs opacity-75", children: [
        "Retry attempts: ",
        workflow.retry_count
      ] })
    ] })
  ] });
}
const formatCurrency$1 = (value) => {
  if (value === null || value === void 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
const getStatusIcon$1 = (status) => {
  switch (status) {
    case "match":
      return /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" });
    case "minor_variance":
      return /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-500" });
    case "significant_variance":
      return /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-red-500" });
    case "missing_data":
      return /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-muted-foreground" });
  }
};
const getScoreColor = (score) => {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
};
const TaxReturnInsightsCard = ({ analysis, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { extractedData, comparisons, overallScore, flags, summary } = analysis;
  const formTypeLabel = {
    "1040": "Form 1040 (Individual)",
    "1120": "Form 1120 (C-Corp)",
    "1065": "Form 1065 (Partnership)",
    "1120S": "Form 1120-S (S-Corp)"
  }[extractedData.formType] || `Form ${extractedData.formType}`;
  const hasScheduleK = !!extractedData.scheduleK;
  const hasScheduleL = !!extractedData.scheduleL;
  const hasScheduleM1 = !!extractedData.scheduleM1;
  const hasScheduleM2 = !!extractedData.scheduleM2;
  const hasCOGS = !!extractedData.cogsDetails;
  return /* @__PURE__ */ jsxs(Card, { className, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Scale, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Tax Return Analysis" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: extractedData.taxYear }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: formTypeLabel })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: "AI-powered extraction and comparison of tax return data" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4 p-3 bg-muted/50 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Consistency Score" }),
          /* @__PURE__ */ jsxs("span", { className: `text-lg font-bold ${overallScore >= 70 ? "text-green-600" : "text-amber-600"}`, children: [
            overallScore,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Progress, { value: overallScore, className: `h-2 ${getScoreColor(overallScore)}` })
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: summary }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Gross Receipts" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency$1(extractedData.grossReceipts) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Ordinary Income" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency$1(extractedData.ordinaryBusinessIncome) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Total Deductions" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency$1(extractedData.totalDeductions) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Total Tax" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency$1(extractedData.totalTax) })
        ] })
      ] }),
      flags.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: flags.slice(0, 3).map((flag, i) => /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "py-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs ml-2", children: flag })
      ] }, i)) }),
      comparisons.length > 0 && /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Field" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Tax Return" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Records" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Variance" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: comparisons.map((comp, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium text-sm", children: comp.field }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: formatCurrency$1(comp.taxReturnValue) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end", children: [
            /* @__PURE__ */ jsx("span", { children: formatCurrency$1(comp.comparisonValue) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: comp.source })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: comp.variancePercent !== null ? /* @__PURE__ */ jsxs("span", { className: comp.variancePercent > 5 ? "text-red-500" : comp.variancePercent < -5 ? "text-amber-500" : "text-green-500", children: [
            comp.variancePercent > 0 ? "+" : "",
            comp.variancePercent.toFixed(1),
            "%"
          ] }) : "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: getStatusIcon$1(comp.status) })
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxs(Collapsible, { open: isExpanded, onOpenChange: setIsExpanded, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-between", children: [
          isExpanded ? "Show Less" : "View Full Tax Return Data",
          isExpanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
        ] }) }),
        /* @__PURE__ */ jsx(CollapsibleContent, { className: "pt-4", children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "page1", className: "w-full", children: [
          /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3 lg:grid-cols-6 h-auto", children: [
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "page1", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3 mr-1" }),
              "Page 1"
            ] }),
            hasScheduleK && /* @__PURE__ */ jsxs(TabsTrigger, { value: "scheduleK", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 mr-1" }),
              "Sch K"
            ] }),
            hasScheduleL && /* @__PURE__ */ jsxs(TabsTrigger, { value: "scheduleL", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(Landmark, { className: "w-3 h-3 mr-1" }),
              "Sch L"
            ] }),
            (hasScheduleM1 || hasScheduleM2) && /* @__PURE__ */ jsxs(TabsTrigger, { value: "scheduleM", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(Calculator, { className: "w-3 h-3 mr-1" }),
              "M-1/M-2"
            ] }),
            hasCOGS && /* @__PURE__ */ jsxs(TabsTrigger, { value: "cogs", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-3 h-3 mr-1" }),
              "COGS"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "entity", className: "text-xs py-1.5", children: [
              /* @__PURE__ */ jsx(Building2, { className: "w-3 h-3 mr-1" }),
              "Entity"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(TabsContent, { value: "page1", className: "space-y-4 mt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4 text-muted-foreground" }),
                "Income"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Gross Receipts (1a)", value: extractedData.grossReceipts }),
                /* @__PURE__ */ jsx(DataRow, { label: "Returns & Allowances (1b)", value: extractedData.returnsAndAllowances }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net Receipts (1c)", value: extractedData.netReceipts }),
                /* @__PURE__ */ jsx(DataRow, { label: "COGS (2)", value: extractedData.costOfGoodsSold }),
                /* @__PURE__ */ jsx(DataRow, { label: "Gross Profit (3)", value: extractedData.grossProfit }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net Gain Form 4797 (4)", value: extractedData.netGainForm4797 }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Income (5)", value: extractedData.otherIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Total Income (6)", value: extractedData.totalIncome, highlight: true })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Separator, {}),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Deductions" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Officer Compensation (7)", value: extractedData.officerCompensation }),
                /* @__PURE__ */ jsx(DataRow, { label: "Salaries & Wages (8)", value: extractedData.salariesWages }),
                /* @__PURE__ */ jsx(DataRow, { label: "Repairs (9)", value: extractedData.repairs }),
                /* @__PURE__ */ jsx(DataRow, { label: "Bad Debts (10)", value: extractedData.badDebts }),
                /* @__PURE__ */ jsx(DataRow, { label: "Rents (11)", value: extractedData.rent }),
                /* @__PURE__ */ jsx(DataRow, { label: "Taxes & Licenses (12)", value: extractedData.taxes }),
                /* @__PURE__ */ jsx(DataRow, { label: "Interest (13)", value: extractedData.interestExpense }),
                /* @__PURE__ */ jsx(DataRow, { label: "Depreciation (14)", value: extractedData.depreciation }),
                /* @__PURE__ */ jsx(DataRow, { label: "Depletion (15)", value: extractedData.depletion }),
                /* @__PURE__ */ jsx(DataRow, { label: "Advertising (16)", value: extractedData.advertising }),
                /* @__PURE__ */ jsx(DataRow, { label: "Pension (17)", value: extractedData.pension }),
                /* @__PURE__ */ jsx(DataRow, { label: "Employee Benefits (18)", value: extractedData.employeeBenefit }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Deductions (19)", value: extractedData.otherDeductions }),
                /* @__PURE__ */ jsx(DataRow, { label: "Total Deductions (20)", value: extractedData.totalDeductions, highlight: true })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Separator, {}),
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-muted/30 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 text-sm", children: [
              /* @__PURE__ */ jsx(DataRow, { label: "Ordinary Business Income (21)", value: extractedData.ordinaryBusinessIncome, highlight: true }),
              /* @__PURE__ */ jsx(DataRow, { label: "Taxable Income", value: extractedData.taxableIncome }),
              /* @__PURE__ */ jsx(DataRow, { label: "Total Tax", value: extractedData.totalTax, highlight: true }),
              /* @__PURE__ */ jsx(DataRow, { label: "Estimated Payments", value: extractedData.estimatedTaxPayments }),
              /* @__PURE__ */ jsx(DataRow, { label: "Overpayment", value: extractedData.overpayment }),
              /* @__PURE__ */ jsx(DataRow, { label: "Amount Owed", value: extractedData.amountOwed })
            ] }) })
          ] }),
          hasScheduleK && /* @__PURE__ */ jsxs(TabsContent, { value: "scheduleK", className: "space-y-4 mt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Income/Loss Items" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Ordinary Business Income (1)", value: extractedData.scheduleK?.ordinaryBusinessIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net Rental Real Estate (2)", value: extractedData.scheduleK?.netRentalRealEstateIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Rental Income (3)", value: extractedData.scheduleK?.otherNetRentalIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Interest Income (4)", value: extractedData.scheduleK?.interestIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Ordinary Dividends (5a)", value: extractedData.scheduleK?.ordinaryDividends }),
                /* @__PURE__ */ jsx(DataRow, { label: "Qualified Dividends (5b)", value: extractedData.scheduleK?.qualifiedDividends }),
                /* @__PURE__ */ jsx(DataRow, { label: "Royalties (6)", value: extractedData.scheduleK?.royalties }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net ST Capital Gain (7)", value: extractedData.scheduleK?.netShortTermCapitalGain }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net LT Capital Gain (8a)", value: extractedData.scheduleK?.netLongTermCapitalGain }),
                /* @__PURE__ */ jsx(DataRow, { label: "Net Sec 1231 Gain (9)", value: extractedData.scheduleK?.netSection1231Gain }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Income/Loss (10)", value: extractedData.scheduleK?.otherIncomeLoss })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Separator, {}),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Deductions & Other" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Section 179 Deduction (11)", value: extractedData.scheduleK?.section179Deduction }),
                /* @__PURE__ */ jsx(DataRow, { label: "Charitable Contributions (12a)", value: extractedData.scheduleK?.charitableContributions }),
                /* @__PURE__ */ jsx(DataRow, { label: "Investment Interest (13a)", value: extractedData.scheduleK?.investmentInterestExpense }),
                /* @__PURE__ */ jsx(DataRow, { label: "Tax-Exempt Interest (16a)", value: extractedData.scheduleK?.taxExemptInterestIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Tax-Exempt (16b)", value: extractedData.scheduleK?.otherTaxExemptIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Nondeductible Expenses (16c)", value: extractedData.scheduleK?.nondeductibleExpenses }),
                /* @__PURE__ */ jsx(DataRow, { label: "Distributions (16d)", value: extractedData.scheduleK?.distributions, highlight: true }),
                /* @__PURE__ */ jsx(DataRow, { label: "Foreign Taxes Paid (17f)", value: extractedData.scheduleK?.foreignTaxesPaid })
              ] })
            ] })
          ] }),
          hasScheduleL && /* @__PURE__ */ jsx(TabsContent, { value: "scheduleL", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsx("div", { className: "rounded-md border overflow-hidden", children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { className: "w-[40%]", children: "Account" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Beginning" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "End of Year" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Change" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Cash",
                  beginning: extractedData.scheduleL?.beginningOfYear?.cash,
                  ending: extractedData.scheduleL?.endOfYear?.cash
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Accounts Receivable",
                  beginning: extractedData.scheduleL?.beginningOfYear?.accountsReceivable,
                  ending: extractedData.scheduleL?.endOfYear?.accountsReceivable
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Inventories",
                  beginning: extractedData.scheduleL?.beginningOfYear?.inventories,
                  ending: extractedData.scheduleL?.endOfYear?.inventories
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Loans to Shareholders",
                  beginning: extractedData.scheduleL?.beginningOfYear?.loansToShareholders,
                  ending: extractedData.scheduleL?.endOfYear?.loansToShareholders,
                  flagIfNonZero: true
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Buildings/Depreciable Assets",
                  beginning: extractedData.scheduleL?.beginningOfYear?.depreciableAssets,
                  ending: extractedData.scheduleL?.endOfYear?.depreciableAssets
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Less: Accum. Depreciation",
                  beginning: extractedData.scheduleL?.beginningOfYear?.accumulatedDepreciation,
                  ending: extractedData.scheduleL?.endOfYear?.accumulatedDepreciation,
                  negative: true
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Total Assets",
                  beginning: extractedData.scheduleL?.beginningOfYear?.totalAssets,
                  ending: extractedData.scheduleL?.endOfYear?.totalAssets,
                  highlight: true
                }
              ),
              /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/30", children: /* @__PURE__ */ jsx(TableCell, { colSpan: 4, className: "text-xs text-muted-foreground font-medium", children: "Liabilities & Equity" }) }),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Accounts Payable",
                  beginning: extractedData.scheduleL?.beginningOfYear?.accountsPayable,
                  ending: extractedData.scheduleL?.endOfYear?.accountsPayable
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Loans from Shareholders",
                  beginning: extractedData.scheduleL?.beginningOfYear?.loansFromShareholders,
                  ending: extractedData.scheduleL?.endOfYear?.loansFromShareholders,
                  flagIfNonZero: true
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Total Liabilities",
                  beginning: extractedData.scheduleL?.beginningOfYear?.totalLiabilities,
                  ending: extractedData.scheduleL?.endOfYear?.totalLiabilities
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Capital Stock",
                  beginning: extractedData.scheduleL?.beginningOfYear?.capitalStock,
                  ending: extractedData.scheduleL?.endOfYear?.capitalStock
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Retained Earnings",
                  beginning: extractedData.scheduleL?.beginningOfYear?.retainedEarnings,
                  ending: extractedData.scheduleL?.endOfYear?.retainedEarnings
                }
              ),
              /* @__PURE__ */ jsx(
                BalanceSheetRow,
                {
                  label: "Total Equity",
                  beginning: extractedData.scheduleL?.beginningOfYear?.totalEquity,
                  ending: extractedData.scheduleL?.endOfYear?.totalEquity,
                  highlight: true
                }
              )
            ] })
          ] }) }) }),
          (hasScheduleM1 || hasScheduleM2) && /* @__PURE__ */ jsxs(TabsContent, { value: "scheduleM", className: "space-y-4 mt-4", children: [
            hasScheduleM1 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Schedule M-1: Reconciliation of Income" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Net Income per Books (1)", value: extractedData.scheduleM1?.netIncomePerBooks, highlight: true }),
                /* @__PURE__ */ jsx(DataRow, { label: "Income on Books Not on Return (2)", value: extractedData.scheduleM1?.incomeOnBooksNotOnReturn }),
                /* @__PURE__ */ jsx(DataRow, { label: "Expenses on Books Not Deducted (3)", value: extractedData.scheduleM1?.expensesOnBooksNotDeducted }),
                /* @__PURE__ */ jsx(DataRow, { label: "Income on Return Not on Books (5)", value: extractedData.scheduleM1?.incomeOnReturnNotOnBooks }),
                /* @__PURE__ */ jsx(DataRow, { label: "Deductions Not Charged to Books (6)", value: extractedData.scheduleM1?.deductionsNotChargedToBooks }),
                /* @__PURE__ */ jsx(DataRow, { label: "Income per Schedule K (8)", value: extractedData.scheduleM1?.incomePerScheduleK, highlight: true })
              ] })
            ] }),
            hasScheduleM1 && hasScheduleM2 && /* @__PURE__ */ jsx(Separator, {}),
            hasScheduleM2 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Schedule M-2: Analysis of AAA" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(DataRow, { label: "Beginning AAA (1)", value: extractedData.scheduleM2?.beginningAAA }),
                /* @__PURE__ */ jsx(DataRow, { label: "Ordinary Income (2)", value: extractedData.scheduleM2?.ordinaryIncome }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Additions (3)", value: extractedData.scheduleM2?.otherAdditions }),
                /* @__PURE__ */ jsx(DataRow, { label: "Loss/Deductions (4)", value: extractedData.scheduleM2?.lossDeductions }),
                /* @__PURE__ */ jsx(DataRow, { label: "Other Reductions (5)", value: extractedData.scheduleM2?.otherReductions }),
                /* @__PURE__ */ jsx(DataRow, { label: "Cash Distributions (7a)", value: extractedData.scheduleM2?.distributionsCash, highlight: true }),
                /* @__PURE__ */ jsx(DataRow, { label: "Property Distributions (7b)", value: extractedData.scheduleM2?.distributionsProperty }),
                /* @__PURE__ */ jsx(DataRow, { label: "Ending AAA (8)", value: extractedData.scheduleM2?.endingAAA, highlight: true }),
                /* @__PURE__ */ jsx(DataRow, { label: "Accumulated E&P", value: extractedData.scheduleM2?.accumulatedEP })
              ] })
            ] })
          ] }),
          hasCOGS && /* @__PURE__ */ jsx(TabsContent, { value: "cogs", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Form 1125-A: Cost of Goods Sold" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(DataRow, { label: "Beginning Inventory (1)", value: extractedData.cogsDetails?.beginningInventory }),
              /* @__PURE__ */ jsx(DataRow, { label: "Purchases (2)", value: extractedData.cogsDetails?.purchases }),
              /* @__PURE__ */ jsx(DataRow, { label: "Cost of Labor (3)", value: extractedData.cogsDetails?.costOfLabor }),
              /* @__PURE__ */ jsx(DataRow, { label: "Section 263A Costs (4)", value: extractedData.cogsDetails?.additionalSection263ACosts }),
              /* @__PURE__ */ jsx(DataRow, { label: "Other Costs (5)", value: extractedData.cogsDetails?.otherCosts }),
              /* @__PURE__ */ jsx(DataRow, { label: "Ending Inventory (7)", value: extractedData.cogsDetails?.endingInventory })
            ] }),
            extractedData.cogsDetails?.inventoryMethod && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Inventory Method:" }),
              /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.cogsDetails.inventoryMethod })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-muted/30 rounded", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm font-medium", children: [
              /* @__PURE__ */ jsx("span", { children: "Cost of Goods Sold (Line 8)" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency$1(extractedData.costOfGoodsSold) })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsx(TabsContent, { value: "entity", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Building2, { className: "w-4 h-4 text-muted-foreground" }),
              "Entity Information"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Taxpayer Name:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: extractedData.taxpayerName || "-" })
              ] }),
              extractedData.ein && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "EIN:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.ein })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Form Type:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: formTypeLabel })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Tax Year:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.taxYear })
              ] }),
              extractedData.naicsCode && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "NAICS Code:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.naicsCode })
              ] }),
              extractedData.accountingMethod && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Accounting Method:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2 capitalize", children: extractedData.accountingMethod })
              ] }),
              extractedData.numberOfShareholders !== void 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Shareholders:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.numberOfShareholders })
              ] }),
              extractedData.filingStatus && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Filing Status:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: extractedData.filingStatus })
              ] })
            ] })
          ] }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground text-right", children: [
        "Analyzed: ",
        new Date(analysis.analyzedAt).toLocaleDateString()
      ] })
    ] })
  ] });
};
const DataRow = ({
  label,
  value,
  highlight = false
}) => /* @__PURE__ */ jsxs("div", { className: `flex justify-between ${highlight ? "font-medium bg-muted/30 p-1 rounded" : ""}`, children: [
  /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground truncate mr-2", children: [
    label,
    ":"
  ] }),
  /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap", children: formatCurrency$1(value) })
] });
const BalanceSheetRow = ({
  label,
  beginning,
  ending,
  highlight = false,
  negative = false,
  flagIfNonZero = false
}) => {
  const change = (ending ?? 0) - (beginning ?? 0);
  const hasFlag = flagIfNonZero && ((beginning ?? 0) !== 0 || (ending ?? 0) !== 0);
  return /* @__PURE__ */ jsxs(TableRow, { className: highlight ? "bg-muted/50 font-medium" : "", children: [
    /* @__PURE__ */ jsxs(TableCell, { className: "text-sm", children: [
      label,
      hasFlag && /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 text-amber-500 inline ml-1" })
    ] }),
    /* @__PURE__ */ jsx(TableCell, { className: `text-right text-sm ${negative ? "text-muted-foreground" : ""}`, children: negative && beginning ? `(${formatCurrency$1(Math.abs(beginning))})` : formatCurrency$1(beginning) }),
    /* @__PURE__ */ jsx(TableCell, { className: `text-right text-sm ${negative ? "text-muted-foreground" : ""}`, children: negative && ending ? `(${formatCurrency$1(Math.abs(ending))})` : formatCurrency$1(ending) }),
    /* @__PURE__ */ jsx(TableCell, { className: `text-right text-sm ${change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : ""}`, children: beginning !== null && ending !== null ? change !== 0 ? `${change > 0 ? "+" : ""}${formatCurrency$1(change)}` : "-" : "-" })
  ] });
};
const fmt$2 = (v) => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};
const sumCategory = (accounts) => accounts.reduce((total, acct) => total + Object.values(acct.monthlyValues).reduce((s, v) => s + (v || 0), 0), 0);
const CategoryTable = ({ accounts, label }) => {
  const [expanded, setExpanded] = useState(false);
  if (accounts.length === 0) return null;
  return /* @__PURE__ */ jsxs(Collapsible, { open: expanded, onOpenChange: setExpanded, children: [
    /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-between text-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(DollarSign, { className: "w-3.5 h-3.5" }),
        label,
        " (",
        accounts.length,
        " items) — ",
        fmt$2(sumCategory(accounts))
      ] }),
      expanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
    ] }) }),
    /* @__PURE__ */ jsx(CollapsibleContent, { className: "pt-2", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Total" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: accounts.map((acct) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: acct.name }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm font-medium", children: fmt$2(Object.values(acct.monthlyValues).reduce((s, v) => s + (v || 0), 0)) })
      ] }, acct.id)) })
    ] }) })
  ] });
};
const PayrollInsightsCard = ({ analysisData, documentName, className }) => {
  const extracted = analysisData.extractedData;
  const cv = analysisData.crossValidation;
  const totals = cv?.totals;
  const hasCrossValidation = cv && cv.comparisons.length > 0;
  return /* @__PURE__ */ jsxs(Card, { className, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Payroll Analysis" })
        ] }),
        cv && cv.overallScore >= 0 && /* @__PURE__ */ jsxs(Badge, { variant: cv.overallScore >= 80 ? "default" : cv.overallScore >= 50 ? "secondary" : "destructive", children: [
          cv.overallScore,
          "% Match"
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { className: "truncate", children: documentName })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "overview", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-3", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "overview", children: "Overview" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "breakdown", children: "Breakdown" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "validation", children: [
          "Validation",
          cv && cv.flags.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 text-[10px] px-1 h-4", children: cv.flags.length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "overview", className: "space-y-4 pt-3", children: [
        analysisData.rawFindings && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: analysisData.rawFindings }),
        analysisData.periodCoverage && analysisData.periodCoverage.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Period: ",
          analysisData.periodCoverage[0],
          " – ",
          analysisData.periodCoverage[analysisData.periodCoverage.length - 1],
          " (",
          analysisData.periodCoverage.length,
          " months)"
        ] }),
        totals && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total Payroll" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: fmt$2(totals.totalPayroll) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Salary & Wages" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: fmt$2(totals.salaryWages) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Owner Comp" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: fmt$2(totals.ownerCompensation) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Payroll Taxes" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: fmt$2(totals.payrollTaxes) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Benefits" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: fmt$2(totals.benefits) })
          ] })
        ] }),
        analysisData.warnings && analysisData.warnings.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: analysisData.warnings.map((w, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs text-amber-600", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: w })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "breakdown", className: "space-y-2 pt-3", children: extracted ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(CategoryTable, { accounts: extracted.salaryWages, label: "Salary & Wages" }),
        /* @__PURE__ */ jsx(CategoryTable, { accounts: extracted.ownerCompensation, label: "Owner Compensation" }),
        /* @__PURE__ */ jsx(CategoryTable, { accounts: extracted.payrollTaxes, label: "Payroll Taxes" }),
        /* @__PURE__ */ jsx(CategoryTable, { accounts: extracted.benefits, label: "Benefits" })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "No breakdown data available" }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "validation", className: "space-y-4 pt-3", children: hasCrossValidation ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Field" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Payroll" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Financial Data" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Source" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: cv.comparisons.map((comp, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-sm font-medium", children: comp.field }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$2(comp.payrollValue) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$2(comp.financialValue) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-muted-foreground", children: comp.source }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-center", children: [
              comp.status === "match" && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-600 mx-auto" }),
              comp.status === "variance" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-destructive" }),
                comp.variancePercent != null && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-destructive", children: [
                  comp.variancePercent > 0 ? "+" : "",
                  comp.variancePercent.toFixed(1),
                  "%"
                ] })
              ] }),
              comp.status === "missing_data" && /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4 text-muted-foreground mx-auto" })
            ] })
          ] }, i)) })
        ] }),
        cv.flags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-500" }),
            "Flags (",
            cv.flags.length,
            ")"
          ] }),
          cv.flags.map((flag, i) => /* @__PURE__ */ jsx(Alert, { variant: "destructive", className: "py-2", children: /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs", children: flag }) }, i))
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-8 h-8 mx-auto mb-2 opacity-40" }),
        /* @__PURE__ */ jsx("p", { children: "No cross-validation data available yet." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs mt-1", children: "Upload financial statements (Income Statement, Tax Return) to enable payroll cross-validation." })
      ] }) })
    ] }) })
  ] });
};
const fmt$1 = (v) => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};
const timeAgo$1 = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const GeneralLedgerInsightsCard = ({ analysisData, documentName, className }) => {
  const recon = analysisData.reconciliation || [];
  const hasRecon = recon.length > 0;
  const flags = analysisData.flags || [];
  return /* @__PURE__ */ jsxs(Card, { className, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "General Ledger Analysis" })
        ] }),
        analysisData.overallScore != null && analysisData.overallScore >= 0 && /* @__PURE__ */ jsxs(Badge, { variant: analysisData.overallScore >= 80 ? "default" : analysisData.overallScore >= 50 ? "secondary" : "destructive", children: [
          analysisData.overallScore,
          "% Reconciled"
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { className: "truncate", children: documentName })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "overview", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-3", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "overview", children: "Overview" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "reconciliation", children: "Reconciliation" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "flags", children: [
          "Flags",
          flags.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 text-[10px] px-1 h-4", children: flags.length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "overview", className: "space-y-4 pt-3", children: [
        (analysisData.periodStart || analysisData.periodEnd) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Period: ",
          analysisData.periodStart || "?",
          " – ",
          analysisData.periodEnd || "?"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
          analysisData.accountCount != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Layers, { className: "w-3 h-3" }),
              " Accounts"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.accountCount.toLocaleString() })
          ] }),
          analysisData.txnCount != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "GL Transactions" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.txnCount.toLocaleString() })
          ] }),
          analysisData.reconciliationSummary && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Matched Accounts" }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", children: [
              analysisData.reconciliationSummary.matched,
              " / ",
              analysisData.reconciliationSummary.matched + analysisData.reconciliationSummary.variances
            ] })
          ] }),
          analysisData.identityCheck && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "A − L − E − NI" }),
            /* @__PURE__ */ jsx("div", { className: `text-sm font-semibold ${analysisData.identityCheck.balanced ? "text-green-600" : "text-destructive"}`, children: analysisData.identityCheck.balanced ? "Balanced" : fmt$1(analysisData.identityCheck.difference) })
          ] })
        ] }),
        analysisData.identityCheck && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Assets:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-1", children: fmt$1(analysisData.identityCheck.assets) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Liabilities:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-1", children: fmt$1(analysisData.identityCheck.liabilities) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Equity:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-1", children: fmt$1(analysisData.identityCheck.equity) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Net Income:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-1", children: fmt$1(analysisData.identityCheck.netIncome) })
          ] })
        ] }),
        analysisData.analyzedAt && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
          "Last analyzed ",
          timeAgo$1(analysisData.analyzedAt)
        ] }),
        analysisData.accountTypeBreakdown && Object.keys(analysisData.accountTypeBreakdown).length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Account Types" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(analysisData.accountTypeBreakdown).map(([type, count]) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
            type,
            ": ",
            count
          ] }, type)) })
        ] }),
        analysisData.largestAccounts && analysisData.largestAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Largest Accounts" }),
          /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Account" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Type" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Balance" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: analysisData.largestAccounts.map((acct, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: acct.name }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-muted-foreground", children: acct.type }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm font-medium", children: fmt$1(acct.balance) })
            ] }, i)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "reconciliation", className: "space-y-4 pt-3", children: hasRecon ? /* @__PURE__ */ jsxs(Fragment, { children: [
        analysisData.materialVariances && analysisData.materialVariances.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Material Variances" }),
          /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Account" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "GL" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "TB" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Variance" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: analysisData.materialVariances.map((r, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: r.accountName }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$1(r.glBalance) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$1(r.tbBalance) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm text-destructive font-medium", children: fmt$1(r.variance) })
            ] }, i)) })
          ] })
        ] }),
        analysisData.missingInTBList && analysisData.missingInTBList.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            "In GL but missing from TB (",
            analysisData.missingInTBList.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2", children: analysisData.missingInTBList.map((a, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: a.name }),
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-2", children: fmt$1(a.balance) })
          ] }, i)) })
        ] }),
        analysisData.missingInGLList && analysisData.missingInGLList.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            "In TB but missing from GL (",
            analysisData.missingInGLList.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2", children: analysisData.missingInGLList.map((a, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: a.name }),
            /* @__PURE__ */ jsx("span", { className: "font-medium ml-2", children: fmt$1(a.balance) })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsxs("summary", { className: "text-xs text-muted-foreground cursor-pointer", children: [
            "Show full reconciliation (",
            recon.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Account" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "GL" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "TB" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Variance" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: recon.map((r, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: r.accountName }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$1(r.glBalance) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: fmt$1(r.tbBalance) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm", children: r.variance != null ? fmt$1(r.variance) : "-" }),
              /* @__PURE__ */ jsxs(TableCell, { className: "text-center", children: [
                r.status === "match" && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-600 mx-auto" }),
                r.status === "variance" && /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-destructive mx-auto" }),
                r.status === "missing_in_tb" && /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4 text-muted-foreground mx-auto" })
              ] })
            ] }, i)) })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-8 h-8 mx-auto mb-2 opacity-40" }),
        /* @__PURE__ */ jsx("p", { children: "No reconciliation data available." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs mt-1", children: "Upload a Trial Balance to enable GL-TB reconciliation." })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "flags", className: "space-y-3 pt-3", children: flags.length > 0 ? flags.map((flag, i) => /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "py-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs", children: flag })
      ] }, i)) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" }),
        /* @__PURE__ */ jsx("p", { children: "No flags detected" })
      ] }) })
    ] }) })
  ] });
};
const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const fmt = (v) => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};
const severityColor = {
  high: "text-destructive",
  medium: "text-amber-600",
  low: "text-muted-foreground"
};
const JournalEntryInsightsCard = ({ analysisData, documentName, className }) => {
  const [showAllFlags, setShowAllFlags] = useState(false);
  const redFlags = analysisData.redFlags || [];
  const summaryFlags = analysisData.summaryFlags || [];
  const totalFlags = redFlags.length + summaryFlags.length;
  const visibleFlags = showAllFlags ? redFlags : redFlags.slice(0, 10);
  return /* @__PURE__ */ jsxs(Card, { className, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileEdit, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Journal Entry Analysis" })
        ] }),
        totalFlags > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
          totalFlags,
          " Flag",
          totalFlags !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { className: "truncate", children: documentName })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "overview", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "w-full grid grid-cols-3", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "redflags", children: [
          "Red Flags",
          redFlags.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 text-[10px] px-1 h-4", children: redFlags.length })
        ] }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "activity", children: "Activity" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "overview", className: "space-y-4 pt-3", children: [
        (analysisData.periodStart || analysisData.periodEnd) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
          analysisData.periodStart || "?",
          " – ",
          analysisData.periodEnd || "?"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
          analysisData.entryCount != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Hash, { className: "w-3 h-3" }),
              " Total Entries"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.entryCount.toLocaleString() })
          ] }),
          analysisData.adjustingEntries != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Adjusting" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.adjustingEntries.toLocaleString() })
          ] }),
          analysisData.regularEntries != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Regular" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.regularEntries.toLocaleString() })
          ] }),
          analysisData.largeEntries != null && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Large Entries" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: analysisData.largeEntries.toLocaleString() })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 md:grid-cols-6 gap-2", children: [
          (analysisData.periodEndCluster ?? analysisData.yearEndCluster ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-amber-600", children: analysisData.periodEndCluster ?? analysisData.yearEndCluster }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "Period-End" })
          ] }),
          (analysisData.weekendEntries ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-amber-600", children: analysisData.weekendEntries }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "Weekend" })
          ] }),
          (analysisData.roundNumberEntries ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-amber-600", children: analysisData.roundNumberEntries }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "Round #s" })
          ] }),
          (analysisData.reversalPairs ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-destructive", children: analysisData.reversalPairs }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "Reversals" })
          ] }),
          (analysisData.duplicateGroups ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-destructive", children: analysisData.duplicateGroups }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "Duplicates" })
          ] }),
          (analysisData.oneSidedEntries ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-destructive", children: analysisData.oneSidedEntries }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "One-Sided" })
          ] })
        ] }),
        analysisData.analyzedAt && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
          "Last analyzed ",
          timeAgo(analysisData.analyzedAt),
          analysisData.largeEntryThreshold ? ` · large-entry threshold: ${fmt(analysisData.largeEntryThreshold)}` : ""
        ] }),
        summaryFlags.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: summaryFlags.map((flag, i) => /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "py-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs", children: flag })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "redflags", className: "space-y-3 pt-3", children: redFlags.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Date" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Amount" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Reason" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: visibleFlags.map((flag, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: flag.date || "-" }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs max-w-[200px] truncate", children: flag.description }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right text-xs font-medium", children: fmt(flag.amount) }),
            /* @__PURE__ */ jsx(TableCell, { className: `text-xs ${severityColor[flag.severity]}`, children: flag.reason })
          ] }, i)) })
        ] }),
        redFlags.length > 10 && !showAllFlags && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "w-full", onClick: () => setShowAllFlags(true), children: [
          /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 mr-1" }),
          " Show all ",
          redFlags.length,
          " flags"
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" }),
        /* @__PURE__ */ jsx("p", { children: "No red flags detected in journal entries" })
      ] }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "activity", className: "space-y-4 pt-3", children: [
        analysisData.topAccounts && analysisData.topAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Most Active Accounts" }),
          /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Account" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Entry Count" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: analysisData.topAccounts.map((acct, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: acct.name }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm font-medium", children: acct.count })
            ] }, i)) })
          ] })
        ] }),
        analysisData.monthlyDistribution && Object.keys(analysisData.monthlyDistribution).length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Monthly Distribution" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 md:grid-cols-4 gap-2", children: Object.entries(analysisData.monthlyDistribution).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: month }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: count })
          ] }, month)) })
        ] }),
        (analysisData.totalDebits != null || analysisData.totalCredits != null) && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-muted/50 rounded-lg grid grid-cols-2 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Total Debits:" }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: fmt(analysisData.totalDebits) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Total Credits:" }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: fmt(analysisData.totalCredits) })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
const AnalysisRunButton = ({
  projectId,
  functionName,
  resultDataType,
  label,
  hasDocuments,
  hasAnalysis
}) => {
  const { running, runAnalysis } = useAnalysisTrigger({
    projectId,
    functionName,
    resultDataType,
    projectIdKey: "projectId"
  });
  if (!hasDocuments) return null;
  if (!hasAnalysis) {
    return /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-center", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-6 h-6 text-primary" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium", children: [
          "Ready to analyze ",
          label
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Run analysis to surface anomalies, reconciliation, and key insights." })
      ] }),
      /* @__PURE__ */ jsx(Button, { size: "sm", onClick: runAnalysis, disabled: running, children: running ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-1 animate-spin" }),
        " Running…"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 mr-1" }),
        " Run ",
        label,
        " Analysis"
      ] }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: runAnalysis, disabled: running, children: [
    /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 mr-1 ${running ? "animate-spin" : ""}` }),
    running ? "Re-running…" : "Re-run analysis"
  ] }) });
};
const formatCurrency = (value) => {
  if (value === null || value === void 0) return "N/A";
  if (value === 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
const formatPercent = (value) => {
  if (value === null || value === void 0) return "";
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
};
const getStatusIcon = (status) => {
  switch (status) {
    case "match":
      return /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" });
    case "minor":
      return /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-500" });
    case "significant":
      return /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-destructive" });
    case "extraction_failed":
      return /* @__PURE__ */ jsx(HelpCircle, { className: "w-4 h-4 text-muted-foreground" });
  }
};
const getOverallScoreColor = (score) => {
  if (score === null) return "text-muted-foreground";
  if (score >= 95) return "text-green-600";
  if (score >= 80) return "text-yellow-600";
  return "text-destructive";
};
const getOverallScoreBg = (score) => {
  if (score === null) return "bg-muted";
  if (score >= 95) return "bg-green-500/10";
  if (score >= 80) return "bg-yellow-500/10";
  return "bg-destructive/10";
};
function BalanceCheckAlert({ label, isBalanced }) {
  return /* @__PURE__ */ jsxs(Alert, { variant: isBalanced ? "default" : "destructive", children: [
    isBalanced ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }) : /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }),
    /* @__PURE__ */ jsxs(AlertDescription, { children: [
      label,
      ": ",
      isBalanced ? "Balanced (Assets = Liabilities + Equity)" : "Not balanced. Please review the discrepancies."
    ] })
  ] });
}
function FinancialStatementValidationCard({ result, onDismiss }) {
  const documentTypeLabel = result.documentType === "balance_sheet" ? "Balance Sheet" : "Income Statement (P&L)";
  if (result.extractionFailed) {
    return /* @__PURE__ */ jsxs(Card, { className: "border-yellow-500/30 bg-yellow-500/5", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600" }),
          documentTypeLabel,
          " Validation Failed"
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          'Could not validate "',
          result.documentName,
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs(Alert, { children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: "We couldn't extract totals from this document. The file may not contain machine-readable financial data, or it may require manual review." })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-3", children: [
          "Attempted at ",
          new Date(result.validatedAt).toLocaleString(),
          "."
        ] })
      ] })
    ] });
  }
  const matchCount = result.lineItems.filter((l) => l.status === "match").length;
  const minorCount = result.lineItems.filter((l) => l.status === "minor").length;
  const significantCount = result.lineItems.filter((l) => l.status === "significant").length;
  const failedCount = result.lineItems.filter((l) => l.status === "extraction_failed").length;
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 bg-primary/5", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
          /* @__PURE__ */ jsx(Scale, { className: "w-5 h-5 text-primary" }),
          documentTypeLabel,
          " Validation Results"
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          'Comparing "',
          result.documentName,
          '" against Trial Balance-derived values'
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-3 py-1.5 rounded-full ${getOverallScoreBg(result.overallScore)}`, children: [
        /* @__PURE__ */ jsx("span", { className: `text-lg font-bold ${getOverallScoreColor(result.overallScore)}`, children: result.overallScore !== null ? `${result.overallScore}%` : "—" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "match" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-sm flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" }),
          /* @__PURE__ */ jsxs("span", { children: [
            matchCount,
            " matches"
          ] })
        ] }),
        minorCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-500" }),
          /* @__PURE__ */ jsxs("span", { children: [
            minorCount,
            " minor"
          ] })
        ] }),
        significantCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-destructive" }),
          /* @__PURE__ */ jsxs("span", { children: [
            significantCount,
            " significant"
          ] })
        ] }),
        failedCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(HelpCircle, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("span", { children: [
            failedCount,
            " not extracted"
          ] })
        ] })
      ] }),
      result.documentType === "balance_sheet" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        result.isBalanced !== void 0 && /* @__PURE__ */ jsx(BalanceCheckAlert, { label: "Uploaded Balance Sheet", isBalanced: result.isBalanced }),
        result.tbIsBalanced !== void 0 && /* @__PURE__ */ jsx(BalanceCheckAlert, { label: "Trial Balance-derived", isBalanced: result.tbIsBalanced })
      ] }),
      result.summary && /* @__PURE__ */ jsxs(Alert, { children: [
        /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: result.summary })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Line Item" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Uploaded" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Trial Balance" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Variance" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: result.lineItems.map((item, idx) => /* @__PURE__ */ jsxs(TableRow, { className: item.status === "significant" ? "bg-destructive/5" : item.status === "extraction_failed" ? "bg-muted/30" : "", children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: item.lineItem }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono text-sm", children: formatCurrency(item.uploadedValue) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono text-sm", children: formatCurrency(item.trialBalanceValue) }),
          /* @__PURE__ */ jsx(TableCell, { className: `text-right font-mono text-sm ${item.status === "match" ? "" : item.status === "minor" ? "text-yellow-600" : item.status === "significant" ? "text-destructive" : "text-muted-foreground"}`, children: item.status === "extraction_failed" ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) : item.variance !== null && item.variance !== 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            formatCurrency(item.variance),
            /* @__PURE__ */ jsxs("span", { className: "text-xs ml-1 opacity-70", children: [
              "(",
              formatPercent(item.variancePercent),
              ")"
            ] })
          ] }) : null }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: getStatusIcon(item.status) })
        ] }, idx)) })
      ] }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Validated at ",
        new Date(result.validatedAt).toLocaleString(),
        ". Minor variance: within 1%. Significant: greater than 1%."
      ] })
    ] })
  ] });
}
const INSTITUTION_GROUPS = [
  {
    label: "Major Banks",
    items: [
      { value: "jpmorgan_chase", label: "JPMorgan Chase" },
      { value: "bank_of_america", label: "Bank of America" },
      { value: "wells_fargo", label: "Wells Fargo" },
      { value: "citibank", label: "Citibank" },
      { value: "us_bank", label: "U.S. Bank" },
      { value: "capital_one", label: "Capital One" },
      { value: "pnc_bank", label: "PNC Bank" },
      { value: "truist_bank", label: "Truist Bank" },
      { value: "td_bank", label: "TD Bank" },
      { value: "ally_bank", label: "Ally Bank" },
      { value: "hsbc_bank_usa", label: "HSBC Bank USA" },
      { value: "santander_bank", label: "Santander Bank" },
      { value: "regions_bank", label: "Regions Bank" },
      { value: "keybank", label: "KeyBank" },
      { value: "huntington_bank", label: "Huntington Bank" },
      { value: "fifth_third_bank", label: "Fifth Third Bank" },
      { value: "mt_bank", label: "M&T Bank" },
      { value: "citizens_bank", label: "Citizens Bank" },
      { value: "first_citizens_bank", label: "First Citizens Bank" },
      { value: "comerica_bank", label: "Comerica Bank" },
      { value: "zions_bank", label: "Zions Bank" },
      { value: "webster_bank", label: "Webster Bank" },
      { value: "first_horizon_bank", label: "First Horizon Bank" },
      { value: "synovus_bank", label: "Synovus Bank" },
      { value: "frost_bank", label: "Frost Bank" },
      { value: "east_west_bank", label: "East West Bank" }
    ]
  },
  {
    label: "Regional Banks",
    items: [
      { value: "bok_financial", label: "BOK Financial" },
      { value: "umb_bank", label: "UMB Bank" },
      { value: "arvest_bank", label: "Arvest Bank" },
      { value: "cadence_bank", label: "Cadence Bank" },
      { value: "southstate_bank", label: "SouthState Bank" },
      { value: "valley_national_bank", label: "Valley National Bank" },
      { value: "atlantic_union_bank", label: "Atlantic Union Bank" },
      { value: "bankunited", label: "BankUnited" },
      { value: "prosperity_bank", label: "Prosperity Bank" },
      { value: "hancock_whitney", label: "Hancock Whitney" },
      { value: "western_alliance_bank", label: "Western Alliance Bank" },
      { value: "customers_bank", label: "Customers Bank" }
    ]
  },
  {
    label: "SBA Banks",
    items: [
      { value: "live_oak_bank", label: "Live Oak Bank" },
      { value: "first_national_bank_omaha", label: "First National Bank of Omaha" },
      { value: "ready_capital_bank", label: "Ready Capital Bank" },
      { value: "celtic_bank", label: "Celtic Bank" },
      { value: "byline_bank", label: "Byline Bank" }
    ]
  },
  {
    label: "Credit Card Issuers",
    items: [
      { value: "american_express", label: "American Express" },
      { value: "discover", label: "Discover" },
      { value: "chase_credit_cards", label: "Chase Credit Cards" },
      { value: "citi_credit_cards", label: "Citi Credit Cards" },
      { value: "capital_one_credit_cards", label: "Capital One Credit Cards" },
      { value: "boa_credit_cards", label: "Bank of America Credit Cards" },
      { value: "wells_fargo_credit_cards", label: "Wells Fargo Credit Cards" },
      { value: "us_bank_credit_cards", label: "U.S. Bank Credit Cards" },
      { value: "barclays_us", label: "Barclays US" },
      { value: "synchrony_financial", label: "Synchrony Financial" },
      { value: "td_bank_credit_cards", label: "TD Bank Credit Cards" },
      { value: "apple_card", label: "Apple Card" }
    ]
  },
  {
    label: "Digital Banks / Fintech",
    items: [
      { value: "mercury", label: "Mercury" },
      { value: "brex", label: "Brex" },
      { value: "ramp", label: "Ramp" },
      { value: "novo", label: "Novo" },
      { value: "relay_financial", label: "Relay Financial" },
      { value: "bluevine", label: "Bluevine" },
      { value: "sofi", label: "SoFi" },
      { value: "chime", label: "Chime" },
      { value: "current", label: "Current" },
      { value: "varo_bank", label: "Varo Bank" }
    ]
  },
  {
    label: "Payment Platforms",
    items: [
      { value: "paypal", label: "PayPal" },
      { value: "stripe", label: "Stripe" },
      { value: "square", label: "Square" },
      { value: "shopify_balance", label: "Shopify Balance" },
      { value: "affirm", label: "Affirm" },
      { value: "klarna", label: "Klarna" },
      { value: "amazon_pay", label: "Amazon Pay" },
      { value: "google_pay", label: "Google Pay" },
      { value: "venmo", label: "Venmo" },
      { value: "cash_app", label: "Cash App" }
    ]
  },
  {
    label: "Credit Unions",
    items: [
      { value: "navy_federal_cu", label: "Navy Federal Credit Union" },
      { value: "state_employees_cu", label: "State Employees Credit Union" },
      { value: "penfed_cu", label: "PenFed Credit Union" },
      { value: "alliant_cu", label: "Alliant Credit Union" },
      { value: "suncoast_cu", label: "Suncoast Credit Union" },
      { value: "golden_1_cu", label: "Golden 1 Credit Union" },
      { value: "becu", label: "BECU" },
      { value: "patelco_cu", label: "Patelco Credit Union" },
      { value: "first_tech_fcu", label: "First Tech Federal Credit Union" },
      { value: "america_first_cu", label: "America First Credit Union" },
      { value: "vystar_cu", label: "VyStar Credit Union" },
      { value: "mountain_america_cu", label: "Mountain America Credit Union" },
      { value: "schoolsfirst_cu", label: "SchoolsFirst Credit Union" }
    ]
  },
  {
    label: "Other",
    items: [
      { value: "other", label: "Other" }
    ]
  }
];
const CIM_TYPES = [
  { value: "cim", label: "CIM" }
];
const CORE_QUICKBOOKS_TYPES = [
  { value: "chart_of_accounts", label: "Chart of Accounts" },
  { value: "trial_balance", label: "Trial Balance" }
];
const OPTIONAL_VERIFICATION_TYPES = [
  { value: "balance_sheet", label: "Balance Sheet", optional: true, verifiable: true },
  { value: "income_statement", label: "Income Statement (P&L)", optional: true, verifiable: true },
  { value: "cash_flow", label: "Cash Flow Statement", optional: true, verifiable: true }
];
const isOptionalVerificationType = (type) => OPTIONAL_VERIFICATION_TYPES.some((t) => t.value === type);
const isVerifiableType = (type) => OPTIONAL_VERIFICATION_TYPES.find((t) => t.value === type)?.verifiable === true;
const TRANSACTION_TYPES = [
  { value: "general_ledger", label: "General Ledger" },
  { value: "bank_statement", label: "Bank Statements" },
  { value: "credit_card", label: "Credit Card Statements" },
  { value: "journal_entries", label: "Journal Entries" }
];
const SUPPORTING_TYPES = [
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "accounts_payable", label: "Accounts Payable" },
  { value: "customer_concentration", label: "Customer Concentration" },
  { value: "vendor_concentration", label: "Vendor Concentration" },
  { value: "payroll", label: "Payroll Reports" },
  { value: "depreciation_schedule", label: "Depreciation Schedule" },
  { value: "fixed_asset_register", label: "Fixed Asset Register" },
  { value: "tax_return", label: "Tax Returns" },
  { value: "debt_schedule", label: "Debt Schedule" },
  { value: "material_contract", label: "Material Contract" },
  { value: "lease_agreement", label: "Lease Agreements" },
  { value: "inventory", label: "Inventory Reports" },
  { value: "supporting_documents", label: "Supporting Documents" }
];
const DOCUMENT_TYPES = [
  ...CIM_TYPES,
  ...CORE_QUICKBOOKS_TYPES,
  ...OPTIONAL_VERIFICATION_TYPES,
  ...TRANSACTION_TYPES,
  ...SUPPORTING_TYPES
];
const DOC_TYPE_GROUPS = [
  { label: "Business Context", items: CIM_TYPES },
  { label: "Core Financials", items: CORE_QUICKBOOKS_TYPES },
  { label: "Verification", items: OPTIONAL_VERIFICATION_TYPES },
  { label: "Transactions", items: TRANSACTION_TYPES },
  { label: "Supporting", items: SUPPORTING_TYPES }
];
const DOCUMENT_COVERAGE_CONFIG = {
  // No coverage UI
  cim: { type: "none", label: "", description: "" },
  chart_of_accounts: { type: "none", label: "", description: "" },
  // Annual coverage (Tax Returns)
  tax_return: {
    type: "annual",
    label: "Annual Coverage",
    description: "Upload tax returns for each fiscal year in your analysis period"
  },
  // Monthly coverage (statements)
  bank_statement: { type: "monthly", label: "Monthly Coverage", description: "Bank statements for each month" },
  credit_card: { type: "monthly", label: "Monthly Coverage", description: "Credit card statements for each month" },
  // Monthly/Quarterly (financials)
  trial_balance: { type: "monthly", label: "Period Coverage", description: "Trial balance for each reporting period" },
  balance_sheet: { type: "monthly", label: "Period Coverage", description: "Balance sheet for each reporting period" },
  income_statement: { type: "monthly", label: "Period Coverage", description: "P&L for each reporting period" },
  cash_flow: { type: "monthly", label: "Period Coverage", description: "Cash flow for each reporting period" },
  // Full-period documents (one export covering entire range)
  general_ledger: { type: "full-period", label: "Full Period", description: "One export covering the entire analysis period" },
  journal_entries: { type: "full-period", label: "Full Period", description: "Journal entries covering the analysis period" },
  // Point-in-time (aging reports, concentration)
  accounts_receivable: { type: "point-in-time", label: "Point-in-Time", description: "Snapshot as of a specific date" },
  accounts_payable: { type: "point-in-time", label: "Point-in-Time", description: "Snapshot as of a specific date" },
  customer_concentration: { type: "point-in-time", label: "Point-in-Time", description: "Concentration analysis per year or latest" },
  vendor_concentration: { type: "point-in-time", label: "Point-in-Time", description: "Concentration analysis per year or latest" },
  // Payroll - treat as monthly
  payroll: { type: "monthly", label: "Period Coverage", description: "Payroll reports for each period" },
  // Fixed assets - point-in-time snapshots
  depreciation_schedule: { type: "point-in-time", label: "Point-in-Time", description: "Depreciation schedule as of a specific date" },
  fixed_asset_register: { type: "point-in-time", label: "Point-in-Time", description: "Fixed asset register as of a specific date" },
  // Debt & contracts - upload once
  debt_schedule: { type: "point-in-time", label: "Point-in-Time", description: "Snapshot of outstanding debt as of a date" },
  material_contract: { type: "point-in-time", label: "Point-in-Time", description: "Contract effective date" },
  lease_agreement: { type: "point-in-time", label: "Point-in-Time", description: "Lease effective date" },
  // Inventory - point-in-time snapshot
  inventory: { type: "point-in-time", label: "Point-in-Time", description: "Inventory snapshot as of a specific date" },
  // Supporting documents - no coverage tracking needed
  supporting_documents: { type: "point-in-time", label: "Point-in-Time", description: "Document date (invoice, receipt, etc.)" }
};
const QUICKBOOKS_TYPES = [
  ...CORE_QUICKBOOKS_TYPES,
  ...OPTIONAL_VERIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
  { value: "general_ledger", label: "General Ledger" },
  { value: "journal_entries", label: "Journal Entries" },
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "accounts_payable", label: "Accounts Payable" },
  { value: "customer_concentration", label: "Customer Concentration" },
  { value: "vendor_concentration", label: "Vendor Concentration" }
];
const DOCUCLIPPER_TYPES = [
  { value: "bank_statement", label: "Bank Statements" },
  { value: "credit_card", label: "Credit Card Statements" }
  // Note: tax_return removed - DocuClipper doesn't support it, using AI extraction only
];
const REQUIRES_INSTITUTION = ["bank_statement", "credit_card"];
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const isQuickBooksType = (type) => QUICKBOOKS_TYPES.some((t) => t.value === type);
const isDocuClipperType = (type) => DOCUCLIPPER_TYPES.some((t) => t.value === type);
const getAcceptedFileTypes = (docType) => {
  if (docType === "cim") return ".pdf,.docx,.doc";
  if (isDocuClipperType(docType)) return ".pdf,.csv";
  if (docType === "trial_balance") return ".xlsx,.xls,.csv,.pdf";
  if (docType === "journal_entries") return ".xlsx,.xls,.csv";
  if (docType === "general_ledger") return ".xlsx,.xls,.csv";
  if (isQuickBooksType(docType)) return ".xlsx,.xls,.csv,.pdf";
  return ".pdf,.xlsx,.xls,.csv,.docx,.doc";
};
const getFileTypeLabel = (docType) => {
  if (docType === "cim") return "PDF or Word documents";
  if (isDocuClipperType(docType)) return "PDF or CSV files";
  if (docType === "trial_balance") return "Excel, CSV, or PDF files";
  if (docType === "journal_entries") return "Excel or CSV files only";
  if (docType === "general_ledger") return "Excel or CSV files only";
  if (isQuickBooksType(docType)) return "Excel, CSV, or PDF files";
  return "PDF, Excel, CSV, or Word files";
};
const DocumentUploadSection = ({
  projectId,
  periods,
  data,
  updateData,
  fullWizardData = {},
  initialDocType
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(initialDocType || "cim");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [institutionOpen, setInstitutionOpen] = useState(false);
  const [customInstitution, setCustomInstitution] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);
  const [cimInsights, setCimInsights] = useState(null);
  const [parsingCim, setParsingCim] = useState(false);
  const [taxReturnInsights, setTaxReturnInsights] = useState([]);
  const [parsingTaxReturn, setParsingTaxReturn] = useState(false);
  const [payrollAnalysis, setPayrollAnalysis] = useState([]);
  const [glAnalysis, setGlAnalysis] = useState([]);
  const [jeAnalysis, setJeAnalysis] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [financialValidationResults, setFinancialValidationResults] = useState({});
  const [validatingFinancialStatement, setValidatingFinancialStatement] = useState(null);
  const [processedDataPeriods, setProcessedDataPeriods] = useState([]);
  const availableTaxYears = useMemo(() => {
    const years = new Set(periods.map((p) => p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [periods]);
  const { cancelWorkflow, retryWorkflow, isLoading: isWorkflowLoading } = useWorkflow();
  const { workflow } = useWorkflowStatus(activeWorkflowId);
  const isMobile = useIsMobile();
  const docCountByType = useMemo(() => {
    const counts = {};
    for (const doc of documents) {
      if (doc.account_type) {
        counts[doc.account_type] = (counts[doc.account_type] || 0) + 1;
      }
    }
    return counts;
  }, [documents]);
  const coverageConfig = useMemo(
    () => DOCUMENT_COVERAGE_CONFIG[selectedType] || { type: "monthly", label: "Period Coverage", description: "" },
    [selectedType]
  );
  const dataTypeMap = useMemo(() => ({
    trial_balance: "trial_balance",
    balance_sheet: "balance_sheet",
    income_statement: "income_statement",
    cash_flow: "cash_flow",
    accounts_receivable: "ar_aging",
    accounts_payable: "ap_aging",
    chart_of_accounts: "chart_of_accounts",
    general_ledger: "general_ledger",
    customer_concentration: "customer_concentration",
    vendor_concentration: "vendor_concentration"
  }), []);
  useEffect(() => {
    if (!projectId || !selectedType) return;
    const dataType = dataTypeMap[selectedType];
    if (!dataType) {
      setProcessedDataPeriods([]);
      return;
    }
    const fetchProcessedPeriods = async () => {
      const { data: data2 } = await supabase.from("processed_data").select("period_start, period_end").eq("project_id", projectId).eq("data_type", dataType).eq("source_type", "quickbooks_api").limit(1e6);
      setProcessedDataPeriods(data2 || []);
    };
    fetchProcessedPeriods();
  }, [projectId, selectedType, dataTypeMap]);
  const filteredDocs = useMemo(
    () => documents.filter((doc) => doc.account_type === selectedType),
    [documents, selectedType]
  );
  const allCoverageSources = useMemo(() => {
    const uploadedDocs = documents.filter((doc) => doc.account_type === selectedType).map((doc) => ({ period_start: doc.period_start, period_end: doc.period_end }));
    return [...uploadedDocs, ...processedDataPeriods];
  }, [documents, selectedType, processedDataPeriods]);
  const effectivePeriods = useMemo(() => {
    if (coverageConfig.type === "none" || periods.length === 0) return [];
    if (coverageConfig.type === "annual") {
      const startYear = periods[0]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      const endYear = periods[periods.length - 1]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      return generateAnnualPeriods(startYear, endYear);
    }
    if (coverageConfig.type === "full-period") {
      const startMonth = periods[0]?.month || 1;
      const startYear = periods[0]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      const endMonth = periods[periods.length - 1]?.month || 12;
      const endYear = periods[periods.length - 1]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      return generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);
    }
    return periods;
  }, [periods, coverageConfig.type]);
  const coverage = useMemo(() => {
    if (coverageConfig.type === "none") {
      return { status: "full", coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
    }
    if (coverageConfig.type === "annual") {
      const years = effectivePeriods.map((p) => p.year);
      return calculateAnnualCoverage(years, allCoverageSources);
    }
    if (coverageConfig.type === "point-in-time") {
      return calculatePointInTimeCoverage(allCoverageSources);
    }
    if (coverageConfig.type === "full-period" && periods.length > 0) {
      const startMonth = periods[0]?.month || 1;
      const startYear = periods[0]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      const endMonth = periods[periods.length - 1]?.month || 12;
      const endYear = periods[periods.length - 1]?.year || (/* @__PURE__ */ new Date()).getFullYear();
      return calculateFullPeriodCoverage(startMonth, startYear, endMonth, endYear, allCoverageSources);
    }
    return calculatePeriodCoverage(effectivePeriods, allCoverageSources);
  }, [coverageConfig.type, effectivePeriods, allCoverageSources, periods]);
  const hasQBCoverage = processedDataPeriods.length > 0;
  const missingPeriodRanges = useMemo(
    () => groupConsecutivePeriods(coverage.missingPeriods),
    [coverage.missingPeriods]
  );
  useEffect(() => {
    const pending = localStorage.getItem(`cim-parsing-${projectId}`);
    if (pending === "true") {
      setParsingCim(true);
    }
  }, [projectId]);
  useEffect(() => {
    fetchDocuments();
    fetchCimInsights().then((insights) => {
      if (insights && localStorage.getItem(`cim-parsing-${projectId}`) === "true") {
        localStorage.removeItem(`cim-parsing-${projectId}`);
        setParsingCim(false);
        toast.success("CIM insights ready!");
      }
    });
    fetchTaxReturnInsights();
    fetchPayrollAnalysis();
    fetchGLAnalysis();
    fetchJEAnalysis();
  }, [projectId]);
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel(`cim-insights-${projectId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "processed_data",
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        const newData = payload.new;
        if (newData.data_type === "cim_insights" && newData.data) {
          setCimInsights(newData.data);
          localStorage.removeItem(`cim-parsing-${projectId}`);
          setParsingCim(false);
          toast.success("CIM insights ready!");
        }
        if (newData.data_type === "tax_return_analysis" && newData.data) {
          const analysis = newData.data;
          setTaxReturnInsights((prev) => {
            const existing = prev.findIndex((a) => a.documentId === analysis.documentId);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = analysis;
              return updated;
            }
            return [...prev, analysis];
          });
          localStorage.removeItem(`tax-parsing-${projectId}`);
          setParsingTaxReturn(false);
          toast.success("Tax return analysis complete!");
        }
        if (newData.data_type === "payroll" && newData.data) {
          fetchPayrollAnalysis();
        }
        if (newData.data_type === "general_ledger_analysis" && newData.data) {
          fetchGLAnalysis();
          toast.success("General ledger analysis complete!");
        }
        if (newData.data_type === "journal_entry_analysis" && newData.data) {
          fetchJEAnalysis();
          toast.success("Journal entry analysis complete!");
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel(`doc-status-${projectId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "documents",
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        const updated = payload.new;
        setDocuments(
          (prev) => prev.map((doc) => doc.id === updated.id ? { ...doc, ...updated } : doc)
        );
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
  useEffect(() => {
    const transitionalStatuses = ["processing", "healing", "queued_for_healing", "reprocessing"];
    const hasTransitional = documents.some((d) => transitionalStatuses.includes(d.processing_status || ""));
    if (!hasTransitional || !projectId) return;
    const interval = setInterval(async () => {
      const { data: data2 } = await supabase.from("documents").select("id, name, file_path, institution, account_label, account_type, period_start, period_end, processing_status, parsed_summary, coverage_validated, created_at, validation_result").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1e6);
      if (data2) setDocuments(data2);
    }, 1e4);
    return () => clearInterval(interval);
  }, [documents, projectId]);
  useEffect(() => {
    if (!parsingCim) return;
    const timeout = setTimeout(() => {
      localStorage.removeItem(`cim-parsing-${projectId}`);
      setParsingCim(false);
      toast.error("CIM parsing timed out. Please try re-uploading.");
    }, 18e4);
    return () => clearTimeout(timeout);
  }, [parsingCim, projectId]);
  const fetchDocuments = async () => {
    try {
      const { data: docs, error } = await supabase.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      setDocuments((docs || []).map((d) => ({ ...d, validation_result: d.validation_result })));
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };
  const fetchCimInsights = async () => {
    try {
      const { data: data2, error } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "cim_insights").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data2?.data) {
        const insights = data2.data;
        setCimInsights(insights);
        return insights;
      }
      return null;
    } catch (error) {
      console.error("Error fetching CIM insights:", error);
      return null;
    }
  };
  const fetchTaxReturnInsights = async () => {
    try {
      const { data: data2, error } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "tax_return_analysis").order("created_at", { ascending: false });
      if (error) throw error;
      if (data2 && data2.length > 0) {
        const insights = data2.map((d) => d.data);
        setTaxReturnInsights(insights);
        return insights;
      }
      return [];
    } catch (error) {
      console.error("Error fetching tax return insights:", error);
      return [];
    }
  };
  const fetchPayrollAnalysis = async () => {
    try {
      const { data: data2, error } = await supabase.from("processed_data").select("data, source_document_id").eq("project_id", projectId).eq("data_type", "payroll").order("created_at", { ascending: false });
      if (error) throw error;
      if (data2 && data2.length > 0) {
        const results = data2.map((d) => {
          const pData = d.data;
          return { docName: pData.documentName || "Payroll Document", data: pData };
        });
        setPayrollAnalysis(results);
      }
    } catch (e) {
      console.error("Error fetching payroll analysis:", e);
    }
  };
  const fetchGLAnalysis = async () => {
    try {
      const { data: data2, error } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "general_ledger_analysis").order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      if (data2 && data2.length > 0) {
        setGlAnalysis(data2.map((d) => ({ docName: "General Ledger", data: d.data })));
      }
    } catch (e) {
      console.error("Error fetching GL analysis:", e);
    }
  };
  const fetchJEAnalysis = async () => {
    try {
      const { data: data2, error } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "journal_entry_analysis").order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      if (data2 && data2.length > 0) {
        setJeAnalysis(data2.map((d) => ({ docName: "Journal Entries", data: d.data })));
      }
    } catch (e) {
      console.error("Error fetching JE analysis:", e);
    }
  };
  const triggerFinancialValidation = useCallback(async (documentId, docType) => {
    setValidatingFinancialStatement(docType);
    try {
      const { data: docPeriod } = await supabase.from("documents").select("period_start, period_end").eq("id", documentId).single();
      const { data: result, error } = await supabase.functions.invoke("validate-financial-statement", {
        body: {
          projectId,
          documentId,
          documentType: docType,
          periodStart: docPeriod?.period_start || null,
          periodEnd: docPeriod?.period_end || null
        }
      });
      if (error) {
        console.error("Financial validation error:", error);
        toast.error("Failed to validate against Trial Balance");
        return;
      }
      if (result?.error) {
        if (result.code === "NO_TRIAL_BALANCE") {
          toast.error("Upload a Trial Balance first before validating");
        } else {
          toast.error(result.error);
        }
        return;
      }
      setFinancialValidationResults((prev) => ({ ...prev, [docType]: result }));
      toast.success(`${docType === "balance_sheet" ? "Balance Sheet" : docType === "income_statement" ? "Income Statement" : "Cash Flow"} validation complete`);
    } catch (err) {
      console.error("Financial validation failed:", err);
      toast.error("Validation failed");
    } finally {
      setValidatingFinancialStatement(null);
    }
  }, [projectId]);
  useEffect(() => {
    if (documents.length === 0) return;
    const verificationTypes = ["balance_sheet", "income_statement", "cash_flow"];
    for (const docType of verificationTypes) {
      const doc = documents.find((d) => d.account_type === docType && d.validation_result);
      if (doc && doc.validation_result) {
        setFinancialValidationResults((prev) => ({ ...prev, [docType]: doc.validation_result }));
      }
    }
  }, [documents]);
  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };
  const getTypeLabel = (typeValue) => {
    const type = DOCUMENT_TYPES.find((t) => t.value === typeValue);
    return type?.label || typeValue;
  };
  const validateFile = async (file, docType) => {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data: data2, error } = await supabase.functions.invoke("validate-document-type", {
        body: {
          fileBase64: base64,
          selectedType: docType,
          fileName: file.name
        }
      });
      if (error) {
        console.warn("Validation function error:", error);
        return null;
      }
      return data2;
    } catch (err) {
      console.warn("Validation error:", err);
      return null;
    }
  };
  const proceedWithUpload = async (files, docType) => {
    const requiresInstitution = REQUIRES_INSTITUTION.includes(docType);
    const institution = requiresInstitution ? selectedInstitution === "other" ? customInstitution : selectedInstitution : null;
    setUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        await logUploadError({
          context: "document_upload_section",
          stage: "auth_check",
          error: authError ?? new Error("Not authenticated"),
          projectId,
          fileName: "(auth)"
        });
        throw authError ?? new Error("Not authenticated");
      }
      const uploadPromises = files.map(async (file) => {
        try {
          const fileExt = file.name.split(".").pop();
          if (file.size > MAX_FILE_BYTES) {
            const sizeError = new Error(`File exceeds 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            await logUploadError({
              context: "document_upload_section",
              stage: "preflight_size",
              error: sizeError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null
            });
            throw sizeError;
          }
          const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
          if (uploadError) {
            await logUploadError({
              context: "document_upload_section",
              stage: "storage_upload",
              error: uploadError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null
            });
            throw uploadError;
          }
          let periodStart = null;
          let periodEnd = null;
          if (docType === "tax_return" && selectedTaxYear) {
            periodStart = `${selectedTaxYear}-01-01`;
            periodEnd = `${selectedTaxYear}-12-31`;
          }
          const { data: insertedDoc, error: insertError } = await supabase.from("documents").insert({
            project_id: projectId,
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_type: fileExt || null,
            file_size: file.size,
            institution,
            account_label: accountLabel || null,
            account_type: docType,
            processing_status: "pending",
            period_start: periodStart,
            period_end: periodEnd,
            ...docType === "supporting_documents" && docDescription ? { description: docDescription } : {}
          }).select().single();
          if (insertError) {
            await logUploadError({
              context: "document_upload_section",
              stage: "db_insert",
              error: insertError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
              extra: { docType }
            });
            throw insertError;
          }
          try {
            if (docType === "cim") {
              localStorage.setItem(`cim-parsing-${projectId}`, "true");
              setParsingCim(true);
              supabase.functions.invoke("parse-cim", {
                body: {
                  documentId: insertedDoc.id,
                  projectId
                }
              }).then(({ data: parseResult, error: parseError }) => {
                if (parseError) {
                  console.warn("CIM parsing failed:", parseError);
                  localStorage.removeItem(`cim-parsing-${projectId}`);
                  setParsingCim(false);
                  toast.error("Failed to extract CIM insights");
                } else if (parseResult?.insights) {
                  setCimInsights(parseResult.insights);
                  localStorage.removeItem(`cim-parsing-${projectId}`);
                  setParsingCim(false);
                  toast.success("CIM business insights extracted!");
                }
              }).catch(async (fnError) => {
                await logUploadError({
                  context: "document_upload_section",
                  stage: "edge_function",
                  error: fnError,
                  projectId,
                  userId: user.id,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: fileExt || null,
                  extra: { docType, functionName: "parse-cim" }
                });
                console.warn("CIM parse edge function call failed:", fnError);
                localStorage.removeItem(`cim-parsing-${projectId}`);
                setParsingCim(false);
                toast.error("Failed to parse CIM");
              });
            } else if (docType === "payroll") {
              supabase.functions.invoke("process-payroll-document", {
                body: {
                  documentId: insertedDoc.id,
                  projectId,
                  periods
                }
              }).then(({ error: processError }) => {
                if (processError) {
                  console.warn("Payroll processing failed:", processError);
                  if (processError.message?.includes("429")) {
                    toast.error("Rate limit exceeded. Please try again in a few minutes.");
                  } else if (processError.message?.includes("402")) {
                    toast.error("AI credits exhausted. Please add funds to continue.");
                  } else {
                    toast.error("Failed to extract payroll data");
                  }
                } else {
                  toast.success("Payroll data extracted! Go to Payroll section to review and import.", { duration: 5e3 });
                }
              }).catch((err) => console.warn("Payroll processing failed:", err));
            } else if (docType === "depreciation_schedule" || docType === "fixed_asset_register") {
              supabase.functions.invoke("process-fixed-assets", {
                body: {
                  documentId: insertedDoc.id,
                  projectId
                }
              }).then(({ error: processError }) => {
                if (processError) {
                  console.warn("Fixed assets processing failed:", processError);
                  if (processError.message?.includes("429")) {
                    toast.error("Rate limit exceeded. Please try again in a few minutes.");
                  } else if (processError.message?.includes("402")) {
                    toast.error("AI credits exhausted. Please add funds to continue.");
                  } else {
                    toast.error("Failed to extract fixed assets data");
                  }
                } else {
                  toast.success("Fixed assets extracted! Go to Fixed Assets section to review and import.", { duration: 5e3 });
                }
              }).catch((err) => console.warn("Fixed assets processing failed:", err));
            } else if (isQuickBooksType(docType)) {
              supabase.functions.invoke("process-quickbooks-file", {
                body: {
                  documentId: insertedDoc.id
                }
              }).catch((fnError) => {
                console.warn("QuickBooks processing call failed:", fnError);
              });
            } else if (docType === "tax_return") {
              localStorage.setItem(`tax-parsing-${projectId}`, "true");
              setParsingTaxReturn(true);
              await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
              supabase.functions.invoke("parse-tax-return", {
                body: {
                  documentId: insertedDoc.id,
                  projectId
                }
              }).then(({ data: parseResult, error: parseError }) => {
                if (parseError) {
                  console.warn("Tax return parsing failed:", parseError);
                  localStorage.removeItem(`tax-parsing-${projectId}`);
                  setParsingTaxReturn(false);
                  if (parseError.message?.includes("429")) {
                    toast.error("Rate limit exceeded. Please try again in a few minutes.");
                  } else if (parseError.message?.includes("402")) {
                    toast.error("AI credits exhausted. Please add funds to continue.");
                  } else {
                    toast.error("Failed to analyze tax return");
                  }
                } else if (parseResult?.analysis) {
                  setTaxReturnInsights((prev) => {
                    const existing = prev.findIndex((a) => a.documentId === insertedDoc.id);
                    if (existing >= 0) {
                      const updated = [...prev];
                      updated[existing] = parseResult.analysis;
                      return updated;
                    }
                    return [...prev, parseResult.analysis];
                  });
                  localStorage.removeItem(`tax-parsing-${projectId}`);
                  setParsingTaxReturn(false);
                  toast.success("Tax return analyzed! Review the comparison summary below.", { duration: 5e3 });
                }
              }).catch((fnError) => {
                console.warn("Tax return parse edge function failed:", fnError);
                localStorage.removeItem(`tax-parsing-${projectId}`);
                setParsingTaxReturn(false);
                toast.error("Failed to analyze tax return");
              });
            } else if (docType === "debt_schedule") {
              await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
              try {
                const fileBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    resolve(result.split(",")[1]);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                const response = await supabase.functions.invoke("process-debt-schedule", {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId
                  }
                });
                if (response.error) throw response.error;
                await supabase.from("documents").update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq("id", insertedDoc.id);
                toast.success("Debt schedule extracted successfully");
              } catch (debtError) {
                console.warn("Debt schedule processing failed:", debtError);
                await supabase.from("documents").update({ processing_status: "failed" }).eq("id", insertedDoc.id);
                toast.error("Failed to process debt schedule");
              }
            } else if (docType === "material_contract") {
              await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
              try {
                const fileBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    resolve(result.split(",")[1]);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                const response = await supabase.functions.invoke("process-material-contract", {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId
                  }
                });
                if (response.error) throw response.error;
                await supabase.from("documents").update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq("id", insertedDoc.id);
                toast.success("Contract terms extracted successfully");
              } catch (contractError) {
                console.warn("Material contract processing failed:", contractError);
                await supabase.from("documents").update({ processing_status: "failed" }).eq("id", insertedDoc.id);
                toast.error("Failed to extract contract terms");
              }
            } else if (docType === "lease_agreement") {
              await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
              try {
                const fileBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    resolve(result.split(",")[1]);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                const response = await supabase.functions.invoke("process-lease-agreement", {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId
                  }
                });
                if (response.error) throw response.error;
                await supabase.from("documents").update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq("id", insertedDoc.id);
                toast.success("Lease agreement analyzed successfully");
              } catch (leaseError) {
                console.warn("Lease agreement processing failed:", leaseError);
                await supabase.from("documents").update({ processing_status: "failed" }).eq("id", insertedDoc.id);
                toast.error("Failed to analyze lease agreement");
              }
            } else if (docType === "inventory") {
              await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
              try {
                const fileBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    resolve(result.split(",")[1]);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                const response = await supabase.functions.invoke("process-inventory-report", {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId
                  }
                });
                if (response.error) throw response.error;
                await supabase.from("documents").update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq("id", insertedDoc.id);
                toast.success("Inventory report analyzed successfully");
              } catch (invError) {
                console.warn("Inventory report processing failed:", invError);
                await supabase.from("documents").update({ processing_status: "failed" }).eq("id", insertedDoc.id);
                toast.error("Failed to analyze inventory report");
              }
            } else if (docType === "supporting_documents") {
              try {
                await supabase.from("documents").update({ processing_status: "processing" }).eq("id", insertedDoc.id);
                const fileBase64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                const response = await supabase.functions.invoke("process-supporting-document", {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId,
                    description: insertedDoc.description || void 0
                  }
                });
                if (response.error) throw response.error;
                await supabase.from("documents").update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq("id", insertedDoc.id);
                toast.success("Supporting document analyzed successfully");
              } catch (supportError) {
                console.warn("Supporting document processing failed:", supportError);
                await supabase.from("documents").update({ processing_status: "failed" }).eq("id", insertedDoc.id);
                toast.error("Failed to analyze supporting document");
              }
            } else if (isDocuClipperType(docType)) {
              console.log(`[UPLOAD] Skipping per-file processing for ${file.name} (will batch via create-processing-tasks)`);
            } else {
              await supabase.from("documents").update({
                processing_status: "completed",
                parsed_summary: { note: "Document stored successfully. This document type does not require parsing." }
              }).eq("id", insertedDoc.id);
            }
          } catch (fnError) {
            await logUploadError({
              context: "document_upload_section",
              stage: "edge_function",
              error: fnError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
              extra: { docType }
            });
            console.warn("Edge function call failed:", fnError);
          }
          return { success: true, filename: file.name, docId: insertedDoc.id };
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          return { success: false, filename: file.name, error, message: getUploadErrorMessage(error) };
        }
      });
      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      if (isDocuClipperType(docType) && successful.length > 0) {
        const allDocIds = successful.map((r) => r.docId).filter(Boolean);
        if (allDocIds.length > 0) {
          console.log(`[UPLOAD] Submitting ${allDocIds.length} documents for parallel processing...`);
          supabase.functions.invoke("create-processing-tasks", {
            body: { documentIds: allDocIds, projectId }
          }).then(({ data: data2, error }) => {
            if (error) {
              console.error("Batch processing submission failed:", error);
              toast.error("Documents uploaded but processing failed to start");
            } else {
              console.log(`Parallel processing started: ${data2?.tasksCreated} tasks created`);
            }
          }).catch((err) => console.warn("Batch processing failed:", err));
        }
        toast.success(`${successful.length} file(s) uploaded and processing`);
      } else if (successful.length > 0) {
        toast.success(`${successful.length} file(s) uploaded and processing`);
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} file(s) failed. ${failed[0].filename}: ${failed[0].message || getUploadErrorMessage(failed[0].error)}`, { duration: 1e4 });
      }
      setSelectedFiles(null);
      setAccountLabel("");
      setDocDescription("");
      setSelectedTaxYear(null);
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";
      fetchDocuments();
      if (isVerifiableType(docType) && files.length === 1 && successful.length === 1) {
        const { data: latestDoc } = await supabase.from("documents").select("id").eq("project_id", projectId).eq("account_type", docType).order("created_at", { ascending: false }).limit(1).single();
        if (latestDoc) {
          setTimeout(() => triggerFinancialValidation(latestDoc.id, docType), 2e3);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      await logUploadError({
        context: "document_upload_section",
        stage: "unexpected",
        error,
        projectId,
        extra: { docType }
      });
      toast.error(getUploadErrorMessage(error, "Failed to upload files"));
    } finally {
      setUploading(false);
    }
  };
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    const requiresInstitution = REQUIRES_INSTITUTION.includes(selectedType);
    if (requiresInstitution && !selectedInstitution) {
      toast.error("Please select an institution");
      return;
    }
    const institution = requiresInstitution ? selectedInstitution === "other" ? customInstitution : selectedInstitution : null;
    if (requiresInstitution && !institution) {
      toast.error("Please enter the institution name");
      return;
    }
    const files = Array.from(selectedFiles);
    if (files.length === 1 && (isDocuClipperType(selectedType) || isQuickBooksType(selectedType))) {
      const file = files[0];
      setIsValidating(true);
      const timeoutPromise = new Promise(
        (resolve) => setTimeout(() => resolve(null), 5e3)
      );
      const validationPromise = validateFile(file, selectedType);
      const result = await Promise.race([validationPromise, timeoutPromise]);
      setIsValidating(false);
      if (result && !result.isValid && result.suggestedType) {
        setPendingValidation({
          file,
          result,
          selectedType
        });
        setValidationDialogOpen(true);
        return;
      }
      toast.success("Document validated", { icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4 text-green-500" }) });
    }
    await proceedWithUpload(files, selectedType);
  };
  const handleChangeType = () => {
    if (!pendingValidation?.result.suggestedType) return;
    const newType = pendingValidation.result.suggestedType;
    setSelectedType(newType);
    setValidationDialogOpen(false);
    proceedWithUpload([pendingValidation.file], newType);
    setPendingValidation(null);
  };
  const handleUploadAnyway = () => {
    if (!pendingValidation) return;
    setValidationDialogOpen(false);
    proceedWithUpload([pendingValidation.file], pendingValidation.selectedType);
    setPendingValidation(null);
  };
  const handleCancelValidation = () => {
    setValidationDialogOpen(false);
    setPendingValidation(null);
  };
  const handleDelete = async (docId, filePath) => {
    try {
      await supabase.from("processed_data").delete().eq("source_document_id", docId);
      await supabase.from("canonical_transactions").delete().eq("source_document_id", docId);
      await supabase.storage.from("documents").remove([filePath]);
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };
  const handleRefresh = async (docId) => {
    toast.info("Refreshing document status...");
    fetchDocuments();
  };
  const handleRetry = async (doc) => {
    if (!doc.file_path || !doc.account_type) return;
    try {
      toast.info("Retrying document processing...");
      await supabase.from("documents").update({ processing_status: "processing", parsed_summary: null }).eq("id", doc.id);
      if (isDocuClipperType(doc.account_type)) {
        const { error } = await supabase.functions.invoke("create-processing-tasks", {
          body: { documentIds: [doc.id], projectId }
        });
        if (error) {
          console.error("Retry (batch) failed:", error);
          toast.error("Retry failed. Please try again.");
          await supabase.from("documents").update({ processing_status: "failed" }).eq("id", doc.id);
        } else {
          toast.success("Document re-submitted for processing");
        }
      } else if (isQuickBooksType(doc.account_type)) {
        const { error } = await supabase.functions.invoke("process-quickbooks-file", {
          body: { documentId: doc.id }
        });
        if (error) {
          console.error("Retry (QB type) failed:", error);
          toast.error("Retry failed. Please try again.");
          await supabase.from("documents").update({ processing_status: "failed" }).eq("id", doc.id);
        } else {
          toast.success("Document re-submitted for processing");
        }
      } else {
        const { error } = await supabase.functions.invoke("process-statement", {
          body: {
            projectId,
            filePath: doc.file_path,
            documentName: doc.name,
            documentType: doc.account_type
          }
        });
        if (error) {
          console.error("Retry failed:", error);
          toast.error("Retry failed. Please try again.");
          await supabase.from("documents").update({ processing_status: "failed" }).eq("id", doc.id);
        } else {
          toast.success("Document re-submitted for processing");
        }
      }
      fetchDocuments();
    } catch (err) {
      console.error("Retry error:", err);
      toast.error("Failed to retry processing");
    }
  };
  const isStuckProcessing = (doc) => {
    if (!doc.created_at) return false;
    const createdAt = new Date(doc.created_at).getTime();
    if (doc.processing_status === "healing" || doc.processing_status === "queued_for_healing") {
      return createdAt < Date.now() - 45 * 60 * 1e3;
    }
    if (doc.processing_status === "reprocessing") {
      return createdAt < Date.now() - 10 * 60 * 1e3;
    }
    if (doc.processing_status !== "processing") return false;
    return createdAt < Date.now() - 10 * 60 * 1e3;
  };
  const handleCimReupload = async (file) => {
    localStorage.setItem(`cim-parsing-${projectId}`, "true");
    setParsingCim(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const existingCimDocs = documents.filter((doc) => doc.account_type === "cim");
      for (const doc of existingCimDocs) {
        await supabase.storage.from("documents").remove([doc.file_path]);
        await supabase.from("documents").delete().eq("id", doc.id);
      }
      await supabase.from("processed_data").delete().eq("project_id", projectId).eq("data_type", "cim_insights");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: insertedDoc, error: insertError } = await supabase.from("documents").insert({
        project_id: projectId,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_type: fileExt || null,
        file_size: file.size,
        account_type: "cim",
        processing_status: "pending"
      }).select().single();
      if (insertError) throw insertError;
      fetchDocuments();
      supabase.functions.invoke("parse-cim", {
        body: {
          documentId: insertedDoc.id,
          projectId
        }
      }).then(({ data: parseResult, error: parseError }) => {
        if (parseError) {
          console.warn("CIM parsing failed:", parseError);
          localStorage.removeItem(`cim-parsing-${projectId}`);
          setParsingCim(false);
          toast.error("Failed to extract CIM insights");
        } else if (parseResult?.insights) {
          setCimInsights(parseResult.insights);
          localStorage.removeItem(`cim-parsing-${projectId}`);
          setParsingCim(false);
          toast.success("CIM re-processed successfully!");
        }
      }).catch((fnError) => {
        console.warn("CIM re-parse edge function call failed:", fnError);
        localStorage.removeItem(`cim-parsing-${projectId}`);
        setParsingCim(false);
        toast.error("Failed to parse CIM");
      });
    } catch (error) {
      console.error("CIM re-upload error:", error);
      localStorage.removeItem(`cim-parsing-${projectId}`);
      setParsingCim(false);
      toast.error("Failed to re-upload CIM");
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "bg-green-600", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
          " Completed"
        ] });
      case "processing":
        return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 mr-1 animate-spin" }),
          " Processing"
        ] });
      case "healing":
        return /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "bg-purple-600", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 mr-1 animate-pulse" }),
          " Self-Healing"
        ] });
      case "queued_for_healing":
        return /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 mr-1" }),
          " Queued for Healing"
        ] });
      case "reprocessing":
        return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }),
          " Reprocessing"
        ] });
      case "failed":
        return /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 mr-1" }),
          " Failed"
        ] });
      default:
        return /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Pending" });
    }
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return parseLocalDate(dateStr).toLocaleDateString();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Document Upload" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Upload bank statements and financial documents for parsing" })
    ] }),
    /* @__PURE__ */ jsx(
      DocumentChecklistReference,
      {
        projectId,
        currentDocType: selectedType,
        wizardData: fullWizardData
      }
    ),
    /* @__PURE__ */ jsxs(Tabs, { value: selectedType, onValueChange: setSelectedType, className: "flex flex-col md:flex-row gap-4", children: [
      isMobile && /* @__PURE__ */ jsxs(Select, { value: selectedType, onValueChange: setSelectedType, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: DOC_TYPE_GROUPS.map((group) => /* @__PURE__ */ jsxs(SelectGroup, { children: [
          /* @__PURE__ */ jsx(SelectLabel, { children: group.label }),
          group.items.map((item) => /* @__PURE__ */ jsxs(SelectItem, { value: item.value, children: [
            item.label,
            docCountByType[item.value] ? ` (${docCountByType[item.value]})` : ""
          ] }, item.value))
        ] }, group.label)) })
      ] }),
      !isMobile && /* @__PURE__ */ jsx(ScrollArea, { className: "w-64 shrink-0 border rounded-md", children: /* @__PURE__ */ jsx("nav", { className: "p-2 space-y-3", children: DOC_TYPE_GROUPS.map((group) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1", children: group.label }),
        /* @__PURE__ */ jsx(TabsList, { className: "flex flex-col h-auto w-full bg-transparent p-0 space-y-0.5", children: group.items.map((item) => /* @__PURE__ */ jsxs(
          TabsTrigger,
          {
            value: item.value,
            className: "w-full justify-start text-xs px-2 py-1.5 rounded-sm gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
            children: [
              /* @__PURE__ */ jsx("span", { className: "truncate", children: item.label }),
              isOptionalVerificationType(item.value) && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] px-1 py-0 h-3.5 font-normal opacity-70 shrink-0", children: "Verify" }),
              docCountByType[item.value] ? /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[9px] px-1 py-0 h-3.5 ml-auto shrink-0", children: docCountByType[item.value] }) : null
            ]
          },
          item.value
        )) })
      ] }, group.label)) }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: DOCUMENT_TYPES.map((type) => /* @__PURE__ */ jsxs(TabsContent, { value: type.value, className: "space-y-6 mt-0", children: [
        isOptionalVerificationType(type.value) && /* @__PURE__ */ jsxs(Alert, { className: "bg-primary/5 border-primary/20", children: [
          /* @__PURE__ */ jsx(Info, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-primary", children: "Optional Verification Document" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-muted-foreground", children: [
              "Your ",
              /* @__PURE__ */ jsx("strong", { children: "Trial Balance" }),
              " is the source of truth — the ",
              type.label,
              " is automatically derived from it. Upload the seller's ",
              type.label,
              " here to ",
              /* @__PURE__ */ jsx("strong", { children: "verify it matches your calculated values" }),
              ". Any discrepancies will be highlighted."
            ] })
          ] })
        ] }),
        isOptionalVerificationType(type.value) && (validatingFinancialStatement === type.value ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsx(Spinner, { className: "w-8 h-8 text-primary" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Validating ",
            type.label,
            " against Trial Balance..."
          ] })
        ] }) }) }) : financialValidationResults[type.value] ? /* @__PURE__ */ jsx(
          FinancialStatementValidationCard,
          {
            result: financialValidationResults[type.value],
            onDismiss: () => setFinancialValidationResults((prev) => ({ ...prev, [type.value]: null }))
          }
        ) : null),
        type.value === "cim" && (cimInsights || parsingCim) && (parsingCim ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-8 h-8 text-primary animate-pulse" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Extracting business insights from CIM..." })
        ] }) }) }) : cimInsights ? /* @__PURE__ */ jsx(
          CIMInsightsCard,
          {
            insights: cimInsights,
            onReupload: handleCimReupload,
            isReuploading: parsingCim
          }
        ) : null),
        type.value === "tax_return" && (taxReturnInsights.length > 0 || parsingTaxReturn) && (parsingTaxReturn ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-8 h-8 text-primary animate-pulse" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Analyzing tax return and comparing with financial data..." })
        ] }) }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: taxReturnInsights.map((analysis) => /* @__PURE__ */ jsx(
          TaxReturnInsightsCard,
          {
            analysis
          },
          analysis.documentId
        )) })),
        type.value === "payroll" && payrollAnalysis.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: payrollAnalysis.map((item, i) => /* @__PURE__ */ jsx(
          PayrollInsightsCard,
          {
            analysisData: item.data,
            documentName: item.docName
          },
          i
        )) }),
        type.value === "general_ledger" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          glAnalysis.map((item, i) => /* @__PURE__ */ jsx(
            GeneralLedgerInsightsCard,
            {
              analysisData: item.data,
              documentName: item.docName
            },
            i
          )),
          /* @__PURE__ */ jsx(
            AnalysisRunButton,
            {
              projectId,
              functionName: "analyze-general-ledger",
              resultDataType: "general_ledger_analysis",
              label: "General Ledger",
              hasDocuments: filteredDocs.length > 0,
              hasAnalysis: glAnalysis.length > 0
            }
          )
        ] }),
        type.value === "journal_entries" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          jeAnalysis.map((item, i) => /* @__PURE__ */ jsx(
            JournalEntryInsightsCard,
            {
              analysisData: item.data,
              documentName: item.docName
            },
            i
          )),
          /* @__PURE__ */ jsx(
            AnalysisRunButton,
            {
              projectId,
              functionName: "analyze-journal-entries",
              resultDataType: "journal_entry_analysis",
              label: "Journal Entry",
              hasDocuments: filteredDocs.length > 0,
              hasAnalysis: jeAnalysis.length > 0
            }
          )
        ] }),
        coverageConfig.type !== "none" && effectivePeriods.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: coverageConfig.label || "Period Coverage Analysis" }),
              /* @__PURE__ */ jsx(CardDescription, { children: coverageConfig.description || "Comparing uploaded documents against required periods" })
            ] }),
            (coverageConfig.type === "monthly" || coverageConfig.type === "annual") && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(Badge, { variant: coverage.status === "full" ? "default" : coverage.status === "partial" ? "secondary" : "destructive", children: [
              coverage.coveragePercentage,
              "% Coverage"
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            (coverageConfig.type === "monthly" || coverageConfig.type === "annual") && /* @__PURE__ */ jsx(Progress, { value: coverage.coveragePercentage, className: "h-2" }),
            /* @__PURE__ */ jsx(
              CoverageTimeline,
              {
                periods: effectivePeriods,
                coverage,
                coverageType: coverageConfig.type,
                documentCount: filteredDocs.length,
                hasQBCoverage
              }
            ),
            (coverageConfig.type === "monthly" || coverageConfig.type === "annual") && coverage.status !== "full" && missingPeriodRanges.length > 0 && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxs(AlertDescription, { children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Missing coverage: " }),
                missingPeriodRanges.join(", ")
              ] })
            ] }),
            coverage.status === "full" && coverageConfig.type === "monthly" && /* @__PURE__ */ jsxs(Alert, { children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }),
              /* @__PURE__ */ jsx(AlertDescription, { children: "All required periods are covered by uploaded documents" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              "Upload ",
              type.label,
              isOptionalVerificationType(type.value) && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "font-normal", children: [
                /* @__PURE__ */ jsx(Scale, { className: "w-3 h-3 mr-1" }),
                "Optional - Verification"
              ] })
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { children: type.value === "cim" ? "Upload the Confidential Information Memorandum for AI-powered business context extraction" : isOptionalVerificationType(type.value) ? `Upload the seller's ${type.label} to compare against your Trial Balance-derived values` : `Upload ${getFileTypeLabel(type.value)} for automatic parsing` })
          ] }) }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            REQUIRES_INSTITUTION.includes(type.value) && /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Institution" }),
                /* @__PURE__ */ jsxs(Popover, { open: institutionOpen, onOpenChange: setInstitutionOpen, children: [
                  /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                    Button,
                    {
                      variant: "outline",
                      role: "combobox",
                      "aria-expanded": institutionOpen,
                      className: "w-full justify-between font-normal",
                      children: [
                        selectedInstitution ? INSTITUTION_GROUPS.flatMap((g) => g.items).find((i) => i.value === selectedInstitution)?.label ?? selectedInstitution : "Select institution...",
                        /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsx(PopoverContent, { className: "w-[--radix-popover-trigger-width] p-0", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
                    /* @__PURE__ */ jsx(CommandInput, { placeholder: "Search institution..." }),
                    /* @__PURE__ */ jsxs(CommandList, { children: [
                      /* @__PURE__ */ jsx(CommandEmpty, { children: "No institution found." }),
                      INSTITUTION_GROUPS.map((group) => /* @__PURE__ */ jsx(CommandGroup, { heading: group.label, children: group.items.map((inst) => /* @__PURE__ */ jsxs(
                        CommandItem,
                        {
                          value: inst.label,
                          onSelect: () => {
                            setSelectedInstitution(inst.value);
                            setInstitutionOpen(false);
                          },
                          children: [
                            /* @__PURE__ */ jsx(Check, { className: `mr-2 h-4 w-4 ${selectedInstitution === inst.value ? "opacity-100" : "opacity-0"}` }),
                            inst.label
                          ]
                        },
                        inst.value
                      )) }, group.label))
                    ] })
                  ] }) })
                ] })
              ] }),
              selectedInstitution === "other" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Institution Name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "Enter institution name",
                    value: customInstitution,
                    onChange: (e) => setCustomInstitution(e.target.value)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Account Label (Optional)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "e.g., Operating Account, Payroll",
                    value: accountLabel,
                    onChange: (e) => setAccountLabel(e.target.value)
                  }
                )
              ] })
            ] }),
            type.value === "tax_return" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(Label, { children: [
                "Tax Year ",
                /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: selectedTaxYear?.toString() || "",
                  onValueChange: (v) => setSelectedTaxYear(parseInt(v)),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select the tax year this return covers" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: availableTaxYears.map((year) => /* @__PURE__ */ jsxs(SelectItem, { value: year.toString(), children: [
                      year,
                      " Tax Year"
                    ] }, year)) })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Select the fiscal year this tax return covers for accurate coverage tracking" })
            ] }),
            type.value === "supporting_documents" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Alert, { className: "border-accent/30 bg-accent/5", children: [
                /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsx(AlertDescription, { className: "text-sm", children: "Upload invoices, receipts, contracts, or other evidence to support your adjustments and verification. These documents will be available to the AI verification engine as supporting context." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Description (Optional)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "e.g., Receipt for $15K personal expense reclassification",
                    value: docDescription,
                    onChange: (e) => setDocDescription(e.target.value)
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Describe what this document supports to help with verification" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Files" }),
              /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-border rounded-lg p-6 text-center", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "file-upload",
                    type: "file",
                    multiple: true,
                    accept: getAcceptedFileTypes(type.value),
                    onChange: handleFileChange,
                    className: "hidden"
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "label",
                  {
                    htmlFor: "file-upload",
                    className: "cursor-pointer flex flex-col items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 text-muted-foreground" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Click to upload or drag and drop" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: getFileTypeLabel(type.value) })
                    ]
                  }
                ),
                selectedFiles && selectedFiles.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-1", children: Array.from(selectedFiles).map((file, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-center text-sm", children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                  file.name
                ] }, i)) })
              ] })
            ] }),
            parsingCim && type.value === "cim" && /* @__PURE__ */ jsxs(Alert, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
              /* @__PURE__ */ jsx(AlertDescription, { children: "CIM is currently being processed. Please wait for completion before uploading another." })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleUpload,
                disabled: uploading || isValidating || !selectedFiles || type.value === "cim" && parsingCim || type.value === "tax_return" && !selectedTaxYear,
                className: "w-full",
                children: isValidating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 mr-2 animate-pulse" }),
                  "Validating..."
                ] }) : uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Uploading..."
                ] }) : parsingCim && type.value === "cim" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "CIM Processing..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
                  "Upload Files"
                ] })
              }
            ),
            workflow && (workflow.status === "running" || workflow.status === "pending") && /* @__PURE__ */ jsx(
              WorkflowProgress,
              {
                workflow,
                onCancel: () => {
                  if (activeWorkflowId) {
                    cancelWorkflow(activeWorkflowId);
                    setActiveWorkflowId(null);
                  }
                },
                compact: true
              }
            ),
            workflow?.status === "failed" && /* @__PURE__ */ jsx(
              WorkflowError,
              {
                workflow,
                onRetry: () => activeWorkflowId && retryWorkflow(activeWorkflowId),
                isRetrying: isWorkflowLoading
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Uploaded Documents" }),
            /* @__PURE__ */ jsxs(CardDescription, { children: [
              filteredDocs.length,
              " document(s) uploaded"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) }) : filteredDocs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No documents uploaded yet" }) : (() => {
              const showInstitutionCols = filteredDocs.some(
                (d) => ["bank_statement", "credit_card"].includes(d.account_type || "")
              );
              return /* @__PURE__ */ jsxs(Table, { children: [
                /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
                  /* @__PURE__ */ jsx(TableHead, { children: "Document" }),
                  showInstitutionCols && /* @__PURE__ */ jsx(TableHead, { children: "Institution" }),
                  showInstitutionCols && /* @__PURE__ */ jsx(TableHead, { children: "Account" }),
                  /* @__PURE__ */ jsx(TableHead, { children: "Period" }),
                  /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
                ] }) }),
                /* @__PURE__ */ jsx(TableBody, { children: filteredDocs.map((doc) => /* @__PURE__ */ jsxs(TableRow, { children: [
                  /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground" }),
                    doc.name,
                    doc.account_type === "general_ledger" && doc.parsed_summary?.coa_derived && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 text-xs", children: "COA Derived" })
                  ] }) }),
                  showInstitutionCols && /* @__PURE__ */ jsx(TableCell, { children: doc.institution || "-" }),
                  showInstitutionCols && /* @__PURE__ */ jsx(TableCell, { children: doc.account_label || "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: doc.period_start && doc.period_end ? `${formatDate(doc.period_start)} - ${formatDate(doc.period_end)}` : "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: getStatusBadge(doc.processing_status) }),
                  /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                    isVerifiableType(doc.account_type || "") && doc.processing_status === "completed" && /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => triggerFinancialValidation(doc.id, doc.account_type),
                        disabled: validatingFinancialStatement === doc.account_type,
                        className: "text-xs gap-1",
                        children: [
                          validatingFinancialStatement === doc.account_type ? /* @__PURE__ */ jsx(Spinner, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Scale, { className: "w-3 h-3" }),
                          "Validate"
                        ]
                      }
                    ),
                    (doc.processing_status === "failed" || isStuckProcessing(doc)) && /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => handleRetry(doc),
                        className: "text-xs gap-1",
                        children: [
                          /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
                          "Retry"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        onClick: () => handleRefresh(doc.id),
                        children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        onClick: () => handleDelete(doc.id, doc.file_path),
                        children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 text-destructive" })
                      }
                    )
                  ] }) })
                ] }, doc.id)) })
              ] });
            })(),
            filteredDocs.some((doc) => doc.processing_status === "healing") && /* @__PURE__ */ jsxs(Alert, { className: "mt-4 border-purple-200 dark:border-purple-800", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-purple-600 dark:text-purple-400" }),
              /* @__PURE__ */ jsxs(AlertDescription, { children: [
                /* @__PURE__ */ jsx("strong", { children: "AI Self-Healing Active:" }),
                " ",
                "Our system is automatically updating to support this document's format. This typically takes 5–15 minutes. The status will update automatically when complete."
              ] })
            ] })
          ] })
        ] })
      ] }, type.value)) })
    ] }),
    pendingValidation && /* @__PURE__ */ jsx(
      DocumentValidationDialog,
      {
        open: validationDialogOpen,
        onOpenChange: setValidationDialogOpen,
        fileName: pendingValidation.file.name,
        selectedType: pendingValidation.selectedType,
        selectedTypeLabel: getTypeLabel(pendingValidation.selectedType),
        validationResult: pendingValidation.result,
        suggestedTypeLabel: pendingValidation.result.suggestedType ? getTypeLabel(pendingValidation.result.suggestedType) : null,
        onChangeType: handleChangeType,
        onUploadAnyway: handleUploadAnyway,
        onCancel: handleCancelValidation
      }
    )
  ] });
};
export {
  DocumentUploadSection
};
