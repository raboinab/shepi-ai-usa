import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { s as supabase, t as toast, B as Button, T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent } from "../main.mjs";
import { Loader2, Share2, AlertTriangle, RefreshCw, Check, XCircle, CheckCircle, Unlink, Copy } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CKdO6TGo.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription } from "./dialog-sNpTUd89.js";
import { I as Input } from "./input-CSM87NBF.js";
import { P as Progress } from "./progress-DNO9VJ6D.js";
const QUICKBOOKS_CLOUD_RUN_URL = "https://shepi-qbauth-1067170156712.us-central1.run.app";
function useQuickBooksConnection(projectId, userId) {
  const [state, setState] = useState({
    connected: false,
    companyName: null,
    realmId: null,
    loading: true,
    error: null,
    tokenHealth: null
  });
  const fetchConnectionStatus = useCallback(async () => {
    if (!projectId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/check-connection?projectId=${encodeURIComponent(projectId)}`
      );
      if (!response.ok) {
        throw new Error("Failed to check connection status");
      }
      const data = await response.json();
      setState({
        connected: data.connected || false,
        companyName: data.companyName || null,
        realmId: data.realmId || null,
        loading: false,
        error: null,
        tokenHealth: data.tokenHealth || null
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to check connection"
      }));
    }
  }, [projectId]);
  const connect = useCallback(() => {
    if (!projectId || !userId) return;
    const loginUrl = `${QUICKBOOKS_CLOUD_RUN_URL}/quickbooks/login?userId=${encodeURIComponent(userId)}&projectId=${encodeURIComponent(projectId)}`;
    window.location.href = loginUrl;
  }, [projectId, userId]);
  const disconnect = useCallback(async () => {
    if (!projectId) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/disconnect?projectId=${encodeURIComponent(projectId)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }
      setState({
        connected: false,
        companyName: null,
        realmId: null,
        loading: false,
        error: null,
        tokenHealth: null
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to disconnect"
      }));
      throw error;
    }
  }, [projectId]);
  const refreshToken = useCallback(async () => {
    if (!projectId) {
      return { success: false, error: "No project ID" };
    }
    try {
      const { data, error } = await supabase.functions.invoke("refresh-qb-token", {
        body: { project_id: projectId }
      });
      if (error) {
        console.error("[QB] Token refresh invoke error:", error);
        return { success: false, error: error.message };
      }
      if (!data?.success) {
        console.error("[QB] Token refresh failed:", data);
        return {
          success: false,
          code: data?.code,
          error: data?.error || "Failed to refresh token"
        };
      }
      await fetchConnectionStatus();
      return { success: true };
    } catch (error) {
      console.error("[QB] Token refresh error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }, [projectId, fetchConnectionStatus]);
  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);
  return {
    ...state,
    connect,
    disconnect,
    refreshToken,
    refetch: fetchConnectionStatus
  };
}
const WORKFLOW_STORAGE_KEY = "qb_sync_workflow";
function QuickBooksButton({ projectId, userId, periods, onSyncComplete, lastSyncDate }) {
  const { connected, companyName, realmId, loading, error, tokenHealth, connect, disconnect, refreshToken, refetch } = useQuickBooksConnection(projectId, userId);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState(null);
  const [actualRecordCount, setActualRecordCount] = useState(0);
  const [expectedRecordCount, setExpectedRecordCount] = useState(36);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const regularPeriods = (periods || []).filter((p) => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;
  useEffect(() => {
    const stored = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const startedAt = new Date(parsed.startedAt).getTime();
        const oneHourAgo = Date.now() - 60 * 60 * 1e3;
        if (parsed.projectId === projectId && startedAt > oneHourAgo) {
          setActiveWorkflowId(parsed.workflowId);
        } else {
          localStorage.removeItem(WORKFLOW_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(WORKFLOW_STORAGE_KEY);
      }
    }
  }, [projectId]);
  useEffect(() => {
    if (activeWorkflowId) return;
    const checkForActiveSync = async () => {
      const { data } = await supabase.from("workflows").select("id, status, progress_percent, created_at").eq("project_id", projectId).eq("workflow_type", "SYNC_TO_SHEET").in("status", ["pending", "running"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        console.log("[QB Sync] Recovering active workflow:", data.id);
        setActiveWorkflowId(data.id);
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({
          workflowId: data.id,
          projectId,
          startedAt: data.created_at
        }));
      }
    };
    checkForActiveSync();
    const interval = setInterval(checkForActiveSync, 1e4);
    const timeout = setTimeout(() => clearInterval(interval), 12e4);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [projectId, activeWorkflowId]);
  useEffect(() => {
    if (!activeWorkflowId) {
      setWorkflowStatus(null);
      return;
    }
    const fetchStatus = async () => {
      const { data, error: error2 } = await supabase.from("workflows").select("*").eq("id", activeWorkflowId).single();
      if (error2) {
        console.error("[QB Sync] Failed to fetch workflow status:", error2);
        localStorage.removeItem(WORKFLOW_STORAGE_KEY);
        setActiveWorkflowId(null);
        return;
      }
      setWorkflowStatus(data);
      if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
        handleWorkflowComplete(data);
      }
    };
    fetchStatus();
    const channel = supabase.channel(`workflow-${activeWorkflowId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "workflows",
        filter: `id=eq.${activeWorkflowId}`
      },
      (payload) => {
        const updated = payload.new;
        setWorkflowStatus(updated);
        if (updated.status === "completed" || updated.status === "failed" || updated.status === "cancelled") {
          handleWorkflowComplete(updated);
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkflowId]);
  useEffect(() => {
    if (!activeWorkflowId || !workflowStatus || workflowStatus.status !== "running") {
      return;
    }
    const checkHealth = async () => {
      try {
        const { data, error: error2 } = await supabase.functions.invoke("check-workflow-health", {
          body: { workflow_id: activeWorkflowId }
        });
        if (error2) {
          console.error("[QB Sync] Health check error:", error2);
          return;
        }
        if (data) {
          setActualRecordCount(data.records_synced || 0);
          setExpectedRecordCount(data.expected_records || 36);
          if (data.actual_progress > (workflowStatus?.progress_percent || 0)) {
            console.log("[QB Sync] Health check shows better progress:", data.actual_progress);
          }
          if (data.status === "timeout" || data.status === "stuck") {
            console.warn("[QB Sync] Workflow detected as stuck/timeout by server");
          }
        }
      } catch (err) {
        console.error("[QB Sync] Health check failed:", err);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 3e4);
    return () => clearInterval(interval);
  }, [activeWorkflowId, workflowStatus?.status]);
  const handleWorkflowComplete = useCallback((workflow) => {
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    if (workflow.status === "completed") {
      workflow.output_payload;
      toast({
        title: "QuickBooks synced successfully!",
        description: "Data has been imported and is ready in the workbook."
      });
      if (onSyncComplete) {
        onSyncComplete();
      }
      setJustCompleted(true);
      setCompletedAt(/* @__PURE__ */ new Date());
      setTimeout(() => {
        setJustCompleted(false);
        setCompletedAt(null);
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 1e4);
    } else if (workflow.status === "failed") {
      const errorDetails = workflow.error_details;
      const errorCode = errorDetails?.code || "";
      if (errorCode === "QB_SYNC_FAILED") {
        toast({
          title: "QuickBooks permission denied",
          description: "Your QuickBooks authorization may have expired. Try disconnecting and reconnecting QuickBooks.",
          variant: "destructive"
        });
      } else if (errorCode === "QB_NOT_CONFIGURED") {
        toast({
          title: "QuickBooks not configured",
          description: "QuickBooks integration is not set up. Please contact support.",
          variant: "destructive"
        });
      } else if (errorCode === "NO_SHEET") {
        toast({
          title: "Configuration error",
          description: "Please contact support.",
          variant: "destructive"
        });
      } else if (errorCode === "CREDENTIALS_UNAVAILABLE" || workflow.error_message?.includes("credential")) {
        toast({
          title: "QuickBooks connection unavailable",
          description: "The credential service is temporarily unavailable. Please try again in a few minutes.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sync failed",
          description: workflow.error_message || "Unknown error occurred",
          variant: "destructive"
        });
      }
      setTimeout(() => {
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 2e3);
    } else if (workflow.status === "cancelled") {
      toast({
        title: "Sync cancelled",
        description: "The QuickBooks sync was cancelled."
      });
      setTimeout(() => {
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 2e3);
    }
  }, [onSyncComplete]);
  const getShareableLink = () => {
    return `${QUICKBOOKS_CLOUD_RUN_URL}/quickbooks/login?projectId=${encodeURIComponent(projectId)}&userId=${encodeURIComponent(userId)}&source=shared`;
  };
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink());
      toast({
        title: "Link copied!",
        description: "Send this to the business owner to connect QuickBooks."
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };
  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({ title: "Disconnected from QuickBooks" });
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };
  const handleImport = async () => {
    const { data: projectData, error: projectError } = await supabase.from("projects").select("periods").eq("id", projectId).single();
    if (projectError) {
      console.error("[QB Sync] Failed to verify project periods:", projectError);
      toast({
        title: "Failed to verify project",
        description: "Could not verify project configuration. Please try again.",
        variant: "destructive"
      });
      return;
    }
    const dbPeriods = (Array.isArray(projectData?.periods) ? projectData.periods : []).filter((p) => !p.isStub);
    if (dbPeriods.length === 0) {
      const localPeriods = (periods || []).filter((p) => !p.isStub);
      if (localPeriods.length > 0) {
        toast({
          title: "Save your changes first",
          description: "You've configured periods but haven't saved. Click Save, then try syncing again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis periods not configured",
          description: "Go to Project Setup (Phase 1, Section 1) and set your start/end dates for the analysis period.",
          variant: "destructive"
        });
      }
      return;
    }
    if (!realmId) {
      console.error("[QB Sync] No realmId available. Connection may be incomplete.");
      toast({
        title: "QuickBooks connection incomplete",
        description: "Please disconnect and reconnect QuickBooks to establish a complete connection.",
        variant: "destructive"
      });
      return;
    }
    if (tokenHealth) {
      if (!tokenHealth.isValid || tokenHealth.needsRefresh) {
        toast({
          title: "Refreshing QuickBooks token...",
          description: "Please wait while we refresh your credentials."
        });
        const result = await refreshToken();
        if (!result.success) {
          if (result.code === "REFRESH_TOKEN_EXPIRED" || result.code === "NO_REFRESH_TOKEN") {
            toast({
              title: "QuickBooks authorization expired",
              description: "Your QuickBooks authorization has fully expired. Please disconnect and reconnect QuickBooks.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Token refresh failed",
              description: result.error || "Please try again or reconnect QuickBooks.",
              variant: "destructive"
            });
          }
          return;
        }
        toast({
          title: "Token refreshed!",
          description: "Starting QuickBooks sync..."
        });
      } else if (tokenHealth.expiresSoon) {
        toast({
          title: "Token expiring soon",
          description: `Your QuickBooks authorization expires in ${tokenHealth.minutesUntilExpiry} minutes. Consider reconnecting after this sync.`
        });
      }
    }
    setIsStartingSync(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("[QB Sync] No valid session:", sessionError);
        toast({
          title: "Session expired",
          description: "Please refresh the page and try again",
          variant: "destructive"
        });
        setIsStartingSync(false);
        return;
      }
      console.log("[QB Sync] Starting workflow-based sync for project:", projectId);
      const { data, error: triggerError } = await supabase.functions.invoke("trigger-qb-sync", {
        body: { project_id: projectId, realm_id: realmId }
      });
      if (triggerError || data?.error) {
        const errorCode = data?.code;
        const errorMessage = data?.message || data?.error || triggerError?.message || "Unknown error";
        console.error("[QB Sync] Trigger error:", { triggerError, data });
        if (errorCode === "NO_PERIODS") {
          toast({
            title: "Analysis periods required",
            description: "Go to Project Setup (Phase 1, Section 1) and set your start/end dates for the analysis period.",
            variant: "destructive"
          });
        } else if (errorCode === "NO_SHEET") {
          toast({
            title: "Configuration error",
            description: "Please contact support.",
            variant: "destructive"
          });
        } else if (errorCode === "UNAUTHORIZED") {
          toast({
            title: "Session expired",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Failed to start sync",
            description: errorMessage,
            variant: "destructive"
          });
        }
        setIsStartingSync(false);
        return;
      }
      console.log("[QB Sync] Workflow created:", data);
      const workflowId = data.workflow_id;
      const storedWorkflow = {
        workflowId,
        projectId,
        startedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(storedWorkflow));
      setActiveWorkflowId(workflowId);
      toast({
        title: "QuickBooks sync started",
        description: "This may take 5-15 minutes for large datasets. You can navigate away - the sync will continue in the background."
      });
    } catch (err) {
      console.error("[QB Sync] Catch error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        toast({
          title: "Connection failed",
          description: "Could not connect to sync service. Please check your connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sync failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsStartingSync(false);
    }
  };
  const isSyncing = activeWorkflowId !== null && workflowStatus?.status !== "completed" && workflowStatus?.status !== "failed";
  const progressPercent = workflowStatus?.progress_percent || 0;
  const currentStep = workflowStatus?.current_step || "";
  const isStuckWorkflow = () => {
    if (!workflowStatus || workflowStatus.status !== "running") return false;
    const updatedAt = new Date(workflowStatus.updated_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1e3;
    return now - updatedAt > fifteenMinutes;
  };
  const getElapsedTime = () => {
    if (!workflowStatus?.started_at) return "";
    const startedAt = new Date(workflowStatus.started_at).getTime();
    const elapsed = Math.floor((Date.now() - startedAt) / 1e3);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };
  const handleRetrySync = async () => {
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    setActiveWorkflowId(null);
    setWorkflowStatus(null);
    await handleImport();
  };
  const handleCancelSync = async () => {
    if (!activeWorkflowId) return;
    try {
      await supabase.from("workflows").update({
        status: "cancelled",
        error_message: "Cancelled by user",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", activeWorkflowId);
      localStorage.removeItem(WORKFLOW_STORAGE_KEY);
      setActiveWorkflowId(null);
      setWorkflowStatus(null);
      toast({ title: "Sync cancelled" });
    } catch (err) {
      console.error("[QB Sync] Failed to cancel workflow:", err);
      toast({
        title: "Failed to cancel sync",
        variant: "destructive"
      });
    }
  };
  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const result = await refreshToken();
      if (result.success) {
        toast({
          title: "Token refreshed successfully",
          description: "Your QuickBooks connection is now up to date."
        });
      } else {
        if (result.code === "REFRESH_TOKEN_EXPIRED" || result.code === "NO_REFRESH_TOKEN") {
          toast({
            title: "Authorization fully expired",
            description: "Your QuickBooks authorization has expired. Please disconnect and reconnect.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Refresh failed",
            description: result.error || "Please try again or reconnect QuickBooks.",
            variant: "destructive"
          });
        }
      }
    } finally {
      setIsRefreshingToken(false);
    }
  };
  const getStepLabel = (step) => {
    const labels = {
      validate: "Validating connection",
      fetch_qb: "Fetching QuickBooks data",
      transform: "Transforming data",
      push_sheets: "Saving processed data",
      update_wizard: "Updating wizard data"
    };
    return labels[step] || step;
  };
  if (loading) {
    return /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", disabled: true, className: "gap-2", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
      "Checking..."
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: connect,
          className: "gap-2 bg-[#2CA01C] hover:bg-[#1E8E14] text-white border-0",
          children: [
            /* @__PURE__ */ jsx(QuickBooksIcon, { className: "w-4 h-4" }),
            "Connect to QuickBooks"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => setShowShareDialog(true),
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }),
            "Request QuickBooks Access"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        ShareLinkDialog,
        {
          open: showShareDialog,
          onOpenChange: setShowShareDialog,
          shareableLink: getShareableLink(),
          onCopyLink: handleCopyLink,
          onRefresh: refetch
        }
      )
    ] });
  }
  if (connected) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      !hasPeriods && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Configure ",
          /* @__PURE__ */ jsx("strong", { children: "Analysis Periods" }),
          " in Project Setup and ",
          /* @__PURE__ */ jsx("strong", { children: "Save" }),
          " before syncing"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm", children: [
          /* @__PURE__ */ jsx(QuickBooksIcon, { className: "w-4 h-4 text-[#2CA01C]" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: companyName || "QuickBooks" }),
          tokenHealth?.expiresSoon || tokenHealth?.needsRefresh ? /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: handleRefreshToken,
                disabled: isRefreshingToken,
                className: "h-6 w-6 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20",
                children: isRefreshingToken ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" })
              }
            ) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("p", { children: [
              "Token expires in ",
              tokenHealth.minutesUntilExpiry,
              " minutes - click to refresh"
            ] }) })
          ] }) }) : tokenHealth && !tokenHealth.isValid ? /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: handleRefreshToken,
                disabled: isRefreshingToken,
                className: "h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                children: isRefreshingToken ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" })
              }
            ) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsx("p", { children: "Token expired - click to refresh" }) })
          ] }) }) : /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-[#2CA01C]" })
        ] }),
        isSyncing ? isStuckWorkflow() ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-[320px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mb-1", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Sync appears stuck (",
                getElapsedTime(),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-2" }),
            actualRecordCount > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              actualRecordCount,
              " of ",
              expectedRecordCount,
              " periods synced"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: handleRetrySync,
                className: "gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
                  "Retry"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: handleCancelSync,
                className: "gap-1.5 text-muted-foreground hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "w-3.5 h-3.5" }),
                  "Cancel"
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-[280px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-1", children: [
              /* @__PURE__ */ jsx("span", { children: getStepLabel(currentStep) }),
              /* @__PURE__ */ jsxs("span", { children: [
                getElapsedTime(),
                " • ",
                progressPercent,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-2" }),
            actualRecordCount > 0 && currentStep === "fetch_qb" && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              actualRecordCount,
              " of ",
              expectedRecordCount,
              " periods synced"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" })
        ] }) : justCompleted ? (
          // Success state - show for 10 seconds after completion
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-green-600 dark:text-green-400", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
                "Synced ",
                completedAt ? formatDistanceToNow(completedAt, { addSuffix: true }) : "just now"
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: handleImport,
                disabled: isStartingSync,
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                  "Sync Again"
                ]
              }
            )
          ] })
        ) : (
          // Normal state with optional last sync time
          /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: handleImport,
                  disabled: isStartingSync || !hasPeriods,
                  className: "gap-2",
                  children: [
                    isStartingSync ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                    isStartingSync ? "Starting sync..." : "Sync QuickBooks"
                  ]
                }
              ),
              lastSyncDate && !isStartingSync && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground mt-0.5 ml-1", children: [
                "Last: ",
                format(new Date(lastSyncDate), "MMM d, h:mm a")
              ] })
            ] }) }),
            !hasPeriods && /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsx("p", { children: "Configure analysis periods in Project Setup first" }) })
          ] }) })
        ),
        /* @__PURE__ */ jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              disabled: isSyncing || isStartingSync,
              className: "gap-2 text-muted-foreground hover:text-destructive hover:border-destructive disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Unlink, { className: "w-4 h-4" }),
                "Disconnect QuickBooks"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Disconnect from QuickBooks?" }),
              /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
                "This will disconnect ",
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  '"',
                  companyName || "QuickBooks",
                  '"'
                ] }),
                " from this project. You can reconnect at any time."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
              /* @__PURE__ */ jsx(
                AlertDialogAction,
                {
                  onClick: handleDisconnect,
                  className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  children: "Disconnect QuickBooks"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full", children: [
    /* @__PURE__ */ jsxs(
      Button,
      {
        onClick: connect,
        className: "gap-2 bg-[#2CA01C] hover:bg-[#1E8E14] text-white border-0",
        children: [
          /* @__PURE__ */ jsx(QuickBooksIcon, { className: "w-4 h-4" }),
          "Connect to QuickBooks"
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        onClick: () => setShowShareDialog(true),
        className: "gap-2",
        children: [
          /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }),
          "Request QuickBooks Access"
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      ShareLinkDialog,
      {
        open: showShareDialog,
        onOpenChange: setShowShareDialog,
        shareableLink: getShareableLink(),
        onCopyLink: handleCopyLink,
        onRefresh: refetch
      }
    )
  ] });
}
function ShareLinkDialog({ open, onOpenChange, shareableLink, onCopyLink, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({ title: "Connection status refreshed" });
    } finally {
      setIsRefreshing(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(QuickBooksIcon, { className: "w-5 h-5 text-[#2CA01C]" }),
        "Request QuickBooks Access"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Don't have access to the QuickBooks account? Send this link to the business owner. Once they log in and authorize access, you'll be able to sync their financial data." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            value: shareableLink,
            readOnly: true,
            className: "font-mono text-xs"
          }
        ),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", onClick: onCopyLink, children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground space-y-2", children: [
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Instructions for the business owner:" }) }),
        /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside space-y-1 text-xs", children: [
          /* @__PURE__ */ jsx("li", { children: "Click the link or paste it in your browser" }),
          /* @__PURE__ */ jsx("li", { children: "Log in to your QuickBooks account" }),
          /* @__PURE__ */ jsx("li", { children: "Authorize access to your company data" }),
          /* @__PURE__ */ jsx("li", { children: "You'll be redirected back once complete" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "After the owner connects, click refresh to update status." }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleRefresh,
            disabled: isRefreshing,
            className: "gap-2",
            children: [
              isRefreshing ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
              "Refresh"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function QuickBooksIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5v1.5c-1.66 0-3 1.34-3 3s1.34 3 3 3v1.5zm2-3.5c0 .83-.67 1.5-1.5 1.5S10 14.83 10 14s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm1.5 3.5v-1.5c1.66 0 3-1.34 3-3s-1.34-3-3-3V8.5c2.49 0 4.5 2.01 4.5 4.5s-2.01 4.5-4.5 4.5z" })
    }
  );
}
export {
  QuickBooksButton as Q,
  QUICKBOOKS_CLOUD_RUN_URL as a
};
