import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { v as useToast, s as supabase, C as Card, f as CardContent, B as Button, b as CardHeader, d as CardTitle, e as CardDescription, t as toast$1 } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { AlertTriangle, RefreshCw, Sparkles, ArrowRight, Eye, X, Check, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription } from "./dialog-sNpTUd89.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
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
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
import "@radix-ui/react-scroll-area";
const FS_LINE_ITEMS_BY_TYPE = {
  "Balance Sheet - Assets": [
    "Cash and cash equivalents",
    "Accounts receivable",
    "Other current assets",
    "Fixed assets",
    "Other assets"
  ],
  "Balance Sheet - Liabilities & Equity": [
    "Current liabilities",
    "Other current liabilities",
    "Long term liabilities",
    "Equity"
  ],
  "Income Statement": [
    "Revenue",
    "Cost of Goods Sold",
    "Operating expenses",
    "Other expense (income)"
  ]
};
function useFlaggedTransactions({
  projectId,
  status,
  flagType,
  isReclassification
}) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState({
    isRunning: false,
    processedEntries: 0,
    totalEntries: 0,
    flaggedCount: 0,
    currentChunk: 0
  });
  const [reclassJobStatus, setReclassJobStatus] = useState({
    jobId: null,
    status: "idle"
  });
  const abortRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const staleIntervalRef = useRef(null);
  const { toast: toast2 } = useToast();
  const fetchTransactions = useCallback(async () => {
    if (!projectId || projectId === "demo") {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const queryResult = await fetch(
        `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/rest/v1/flagged_transactions?project_id=eq.${projectId}&order=confidence_score.desc`,
        {
          headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68",
            "Authorization": `Bearer ${session.data.session?.access_token}`
          }
        }
      );
      if (!queryResult.ok) {
        throw new Error("Failed to fetch flagged transactions");
      }
      let fetchedData = await queryResult.json();
      if (status) {
        const statusArr = Array.isArray(status) ? status : [status];
        fetchedData = fetchedData.filter((t) => statusArr.includes(t.status));
      }
      if (flagType) {
        fetchedData = fetchedData.filter((t) => t.flag_type === flagType);
      }
      if (isReclassification !== void 0) {
        fetchedData = fetchedData.filter((t) => {
          const aiAnalysis = t.ai_analysis;
          const isReclass = aiAnalysis?.is_reclassification === true;
          return isReclassification ? isReclass : !isReclass;
        });
      }
      setTransactions(fetchedData || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch flagged transactions";
      setError(message);
      console.error("Error fetching flagged transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, status, flagType, isReclassification]);
  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/rest/v1/flagged_transactions?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68",
            "Authorization": `Bearer ${session.data.session?.access_token}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            status: newStatus,
            reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
            reviewed_by: user?.id
          })
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      setTransactions(
        (prev) => prev.map(
          (tx) => tx.id === id ? { ...tx, status: newStatus, reviewed_at: (/* @__PURE__ */ new Date()).toISOString(), reviewed_by: user?.id || null } : tx
        )
      );
      toast2({
        title: "Status updated",
        description: `Transaction marked as ${newStatus}`
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast2({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast2]);
  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);
  useEffect(() => {
    if (!projectId || !isReclassification) return;
    const checkExistingJobs = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;
        const response = await fetch(
          `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/rest/v1/reclassification_jobs?project_id=eq.${projectId}&status=in.(pending,processing)&order=created_at.desc&limit=1`,
          {
            headers: {
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68",
              "Authorization": `Bearer ${session.data.session.access_token}`
            }
          }
        );
        if (response.ok) {
          const jobs = await response.json();
          if (jobs.length > 0) {
            const activeJob = jobs[0];
            const jobResult = activeJob.result;
            const batchesCompleted = jobResult?.batches_completed || 0;
            const totalBatches = jobResult?.total_batches || 0;
            const updatedAt = new Date(activeJob.updated_at).getTime();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1e3;
            const isStale = activeJob.status === "processing" && updatedAt < fiveMinutesAgo;
            if (isStale && batchesCompleted > 0) {
              console.log(`[reclass] Stale job detected (${activeJob.id}), polling status from backend`);
              supabase.functions.invoke("ai-backend-proxy", {
                body: { endpoint: "reclassify-status", payload: { job_id: activeJob.id } }
              }).catch((err) => console.error("[reclass] Stale recovery poll failed:", err));
            }
            setReclassJobStatus({ jobId: activeJob.id, status: activeJob.status });
            setIsAnalyzing(true);
            if (batchesCompleted > 0 && totalBatches > 0) {
              setAnalysisProgress((prev) => ({
                ...prev,
                isRunning: true,
                processedEntries: batchesCompleted,
                totalEntries: totalBatches,
                currentChunk: batchesCompleted
              }));
            }
            subscribeToJob(activeJob.id);
          }
        }
      } catch (err) {
        console.error("Error checking existing reclassification jobs:", err);
      }
    };
    checkExistingJobs();
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (staleIntervalRef.current) {
        clearInterval(staleIntervalRef.current);
        staleIntervalRef.current = null;
      }
    };
  }, [projectId, isReclassification]);
  const subscribeToJob = useCallback((jobId) => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
    if (staleIntervalRef.current) {
      clearInterval(staleIntervalRef.current);
      staleIntervalRef.current = null;
    }
    let lastUpdateTime = Date.now();
    const channel = supabase.channel(`reclass-job-${jobId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reclassification_jobs",
        filter: `id=eq.${jobId}`
      },
      (payload) => {
        lastUpdateTime = Date.now();
        const newRecord = payload.new;
        const newStatus = newRecord.status;
        const jobResult = newRecord.result;
        setReclassJobStatus({
          jobId,
          status: newStatus,
          errorMessage: newRecord.error_message || void 0
        });
        if (newStatus === "processing" && jobResult) {
          const batchesCompleted = jobResult.batches_completed || 0;
          const totalBatches = jobResult.total_batches || 0;
          if (totalBatches > 0) {
            setAnalysisProgress((prev) => ({
              ...prev,
              isRunning: true,
              processedEntries: batchesCompleted,
              totalEntries: totalBatches,
              currentChunk: batchesCompleted
            }));
          }
        }
        if (newStatus === "completed") {
          const result = newRecord.result;
          setIsAnalyzing(false);
          if (staleIntervalRef.current) {
            clearInterval(staleIntervalRef.current);
            staleIntervalRef.current = null;
          }
          toast2({
            title: "Analysis complete",
            description: `Found ${result?.flagged_count || 0} potential reclassifications across ${result?.accounts_analyzed || 0} accounts.`
          });
          fetchTransactions();
          supabase.removeChannel(channel);
          realtimeChannelRef.current = null;
        } else if (newStatus === "failed") {
          setIsAnalyzing(false);
          if (staleIntervalRef.current) {
            clearInterval(staleIntervalRef.current);
            staleIntervalRef.current = null;
          }
          toast2({
            title: "Analysis failed",
            description: newRecord.error_message || "Unknown error occurred",
            variant: "destructive"
          });
          supabase.removeChannel(channel);
          realtimeChannelRef.current = null;
        }
      }
    ).subscribe();
    realtimeChannelRef.current = channel;
    staleIntervalRef.current = setInterval(async () => {
      const staleDurationMs = 5 * 60 * 1e3;
      if (Date.now() - lastUpdateTime < staleDurationMs) return;
      console.log(`[reclass] Stale job detected via polling (${jobId}), attempting recovery`);
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;
        const response = await fetch(
          `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/rest/v1/reclassification_jobs?id=eq.${jobId}&select=status,result,updated_at`,
          {
            headers: {
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68",
              "Authorization": `Bearer ${session.data.session.access_token}`
            }
          }
        );
        if (!response.ok) return;
        const jobs = await response.json();
        if (!jobs.length) return;
        const job = jobs[0];
        if (job.status !== "processing") {
          if (job.status === "completed" || job.status === "failed") {
            clearInterval(staleIntervalRef.current);
            staleIntervalRef.current = null;
          }
          return;
        }
        const jobResult = job.result;
        const batchesCompleted = jobResult?.batches_completed || 0;
        supabase.functions.invoke("ai-backend-proxy", {
          body: { endpoint: "reclassify-status", payload: { job_id: jobId } }
        }).catch((err) => console.error("[reclass] Stale polling status check failed:", err));
        lastUpdateTime = Date.now();
      } catch (err) {
        console.error("[reclass] Stale polling check failed:", err);
      }
    }, 6e4);
  }, [fetchTransactions, toast2]);
  const runAnalysis = useCallback(async () => {
    if (!projectId) return false;
    cancelAnalysis();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsAnalyzing(true);
    setAnalysisProgress({
      isRunning: true,
      processedEntries: 0,
      totalEntries: 0,
      flaggedCount: 0,
      currentChunk: 0
    });
    try {
      if (isReclassification) {
        const { data, error: fnError } = await supabase.functions.invoke("ai-backend-proxy", {
          body: { endpoint: "reclassify", payload: { project_id: projectId } }
        });
        if (fnError) throw fnError;
        if (data.job_id) {
          setReclassJobStatus({ jobId: data.job_id, status: "pending" });
          subscribeToJob(data.job_id);
          return true;
        }
        setIsAnalyzing(false);
        toast2({
          title: "Analysis complete",
          description: data.message || `Found ${data.flagged_count || 0} potential reclassifications`
        });
        await fetchTransactions();
        return true;
      }
      let offset = 0;
      let totalFlagged = 0;
      let chunkNumber = 0;
      const CHUNK_SIZE = 5e3;
      while (true) {
        if (controller.signal.aborted) {
          toast2({
            title: "Analysis cancelled",
            description: `Stopped after analyzing ${offset} entries. Found ${totalFlagged} adjustments so far.`
          });
          break;
        }
        chunkNumber++;
        const { data, error: fnError } = await supabase.functions.invoke("analyze-transactions", {
          body: {
            project_id: projectId,
            analysis_type: "full",
            offset,
            limit: CHUNK_SIZE
          }
        });
        if (fnError) {
          throw fnError;
        }
        totalFlagged += data.flagged_count || 0;
        setAnalysisProgress({
          isRunning: true,
          processedEntries: data.processed_entries || offset,
          totalEntries: data.total_entries || 0,
          flaggedCount: totalFlagged,
          currentChunk: chunkNumber
        });
        if (data.completed || !data.next_offset) {
          toast2({
            title: "Analysis complete",
            description: `Found ${totalFlagged} potential adjustments across ${data.total_entries || "all"} entries`
          });
          break;
        }
        offset = data.next_offset;
      }
      await fetchTransactions();
      return true;
    } catch (err) {
      if (controller.signal.aborted) return false;
      const message = err instanceof Error ? err.message : "Failed to run analysis";
      toast2({
        title: "Analysis failed",
        description: message,
        variant: "destructive"
      });
      setIsAnalyzing(false);
      return false;
    } finally {
      setAnalysisProgress((prev) => ({ ...prev, isRunning: false }));
      abortRef.current = null;
    }
  }, [projectId, isReclassification, fetchTransactions, cancelAnalysis, toast2, subscribeToJob]);
  const stats = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === "pending").length,
    accepted: transactions.filter((t) => t.status === "accepted").length,
    dismissed: transactions.filter((t) => t.status === "dismissed").length,
    converted: transactions.filter((t) => t.status === "converted").length,
    totalAmount: transactions.filter((t) => t.status === "pending" || t.status === "accepted").reduce((sum, t) => sum + Math.abs(t.suggested_adjustment_amount), 0)
  };
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    updateStatus,
    runAnalysis,
    cancelAnalysis,
    isAnalyzing,
    analysisProgress,
    reclassJobStatus,
    stats
  };
}
const RECLASS_FLAG_TYPE_LABELS = {
  reclass_depreciation_in_opex: "Depreciation in OpEx",
  reclass_amortization_mixed: "Amortization Mixed",
  reclass_interest_in_opex: "Interest in OpEx",
  reclass_rent_vs_lease: "Rent vs Lease",
  reclass_gain_loss_in_revenue: "Gain/Loss in Revenue",
  reclass_cogs_opex_boundary: "COGS/OpEx Boundary",
  reclass_payroll_owner_comp: "Owner Compensation",
  reclass_bad_debt_in_opex: "Bad Debt in OpEx"
};
const RECLASS_FLAG_TYPE_COLORS = {
  reclass_depreciation_in_opex: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  reclass_amortization_mixed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  reclass_interest_in_opex: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  reclass_rent_vs_lease: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reclass_gain_loss_in_revenue: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  reclass_cogs_opex_boundary: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  reclass_payroll_owner_comp: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  reclass_bad_debt_in_opex: "bg-red-500/10 text-red-500 border-red-500/20"
};
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(amount));
}
function ReclassCard({
  transaction,
  onAccept,
  onDismiss,
  onViewDetails,
  isUpdating
}) {
  const flagColor = RECLASS_FLAG_TYPE_COLORS[transaction.flag_type] || "bg-muted text-muted-foreground";
  const aiAnalysis = transaction.ai_analysis;
  const suggestedFrom = aiAnalysis?.suggested_from_line_item;
  const suggestedTo = aiAnalysis?.suggested_to_line_item;
  return /* @__PURE__ */ jsx(Card, { className: "group hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2 flex-wrap", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: flagColor, children: RECLASS_FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type }) }),
        /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm truncate mb-1", children: transaction.account_name }),
        suggestedFrom && suggestedTo && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm mb-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: suggestedFrom }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: suggestedTo })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: transaction.flag_reason })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-right shrink-0", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-lg", children: formatCurrency(transaction.amount) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-4 pt-3 border-t", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: "ghost",
          className: "flex-1",
          onClick: onViewDetails,
          children: [
            /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 mr-1" }),
            "Details"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: "outline",
          className: "flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground",
          onClick: onDismiss,
          disabled: isUpdating,
          children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4 mr-1" }),
            "Dismiss"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          className: "flex-1",
          onClick: onAccept,
          disabled: isUpdating,
          children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 mr-1" }),
            "Convert"
          ]
        }
      )
    ] })
  ] }) });
}
function ReclassDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onAccept,
  onDismiss,
  onConvert
}) {
  if (!transaction) return null;
  const aiAnalysis = transaction.ai_analysis;
  const sourceData = transaction.source_data;
  const suggestedFrom = aiAnalysis?.suggested_from_line_item;
  const suggestedTo = aiAnalysis?.suggested_to_line_item;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 text-primary" }),
        "Reclassification Suggestion"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Review the AI analysis and convert this to a reclassification entry" })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[60vh]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6 pr-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Account" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: transaction.account_name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Amount" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-lg", children: formatCurrency(transaction.amount) })
        ] })
      ] }),
      suggestedFrom && suggestedTo && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-primary/5 rounded-lg border border-primary/20", children: [
        /* @__PURE__ */ jsxs("h4", { className: "font-medium mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 text-primary" }),
          "Suggested Reclassification"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "From" }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-sm", children: suggestedFrom })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "To" }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-sm", children: suggestedTo })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [
        /* @__PURE__ */ jsxs("h4", { className: "font-medium mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
          "AI Analysis"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: transaction.flag_reason }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Flag Type" }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: RECLASS_FLAG_TYPE_COLORS[transaction.flag_type], children: RECLASS_FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Matched Keywords" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: (aiAnalysis?.matched_keywords || []).map((kw, i) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: kw }, i)) })
          ] })
        ] })
      ] }),
      sourceData?.original_transaction && /* @__PURE__ */ jsxs("div", { className: "p-4 border rounded-lg", children: [
        /* @__PURE__ */ jsx("h4", { className: "font-medium mb-2", children: "Source Data" }),
        /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-2 rounded overflow-x-auto", children: JSON.stringify(sourceData.original_transaction, null, 2) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-4 border-t", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onDismiss, className: "flex-1", children: [
        /* @__PURE__ */ jsx(X, { className: "h-4 w-4 mr-1" }),
        "Dismiss"
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: onConvert, className: "flex-1", children: [
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 mr-1" }),
        "Convert to Reclassification"
      ] })
    ] })
  ] }) });
}
function ReclassificationAIDiscoverySection({
  projectId,
  onConvertToReclassification,
  isDemo,
  mockFlags
}) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const {
    transactions: hookTransactions,
    isLoading,
    error,
    refetch,
    updateStatus,
    runAnalysis,
    isAnalyzing,
    reclassJobStatus
  } = useFlaggedTransactions({
    projectId,
    status: "pending",
    isReclassification: true
  });
  const transactions = isDemo && mockFlags ? mockFlags : hookTransactions;
  const handleUpdateStatus = async (id, status) => {
    if (isDemo) {
      toast.info("Preview mode", { description: "Sign up to act on reclassification suggestions." });
      return;
    }
    setUpdatingId(id);
    await updateStatus(id, status);
    setUpdatingId(null);
    setSelectedTransaction(null);
  };
  const handleConvert = (transaction) => {
    if (isDemo) {
      toast.info("Preview mode", { description: "Sign up to convert reclassifications on a real project." });
      return;
    }
    onConvertToReclassification(transaction);
    handleUpdateStatus(transaction.id, "converted");
  };
  if (error) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-12 w-12 mx-auto mb-4 text-destructive" }),
      /* @__PURE__ */ jsx("p", { className: "text-destructive", children: error }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: refetch, className: "mt-4", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
        "Retry"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary" }),
            "AI-Detected Reclassifications"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "AI scans your Chart of Accounts and Trial Balance to detect accounts that may need reclassification" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: refetch,
              disabled: isLoading,
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}` }),
                "Refresh"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              onClick: () => {
                if (isDemo) {
                  toast.info("AI Reclassification requires real financial data", {
                    description: "Sign up to use this feature on a real project."
                  });
                  return;
                }
                runAnalysis();
              },
              disabled: isAnalyzing,
              children: isAnalyzing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4 mr-1" }),
                reclassJobStatus.status === "processing" ? "AI Analyzing..." : "Queuing..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 mr-1" }),
                "Scan for Reclassifications"
              ] })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) }) : transactions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No reclassification suggestions found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: "Run AI Analysis to detect accounts that may need reclassification" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: transactions.map((tx) => /* @__PURE__ */ jsx(
        ReclassCard,
        {
          transaction: tx,
          onAccept: () => handleConvert(tx),
          onDismiss: () => handleUpdateStatus(tx.id, "dismissed"),
          onViewDetails: () => setSelectedTransaction(tx),
          isUpdating: updatingId === tx.id
        },
        tx.id
      )) }) })
    ] }),
    /* @__PURE__ */ jsx(
      ReclassDetailsDialog,
      {
        transaction: selectedTransaction,
        open: !!selectedTransaction,
        onOpenChange: (open) => !open && setSelectedTransaction(null),
        onAccept: () => selectedTransaction && handleConvert(selectedTransaction),
        onDismiss: () => selectedTransaction && handleUpdateStatus(selectedTransaction.id, "dismissed"),
        onConvert: () => selectedTransaction && handleConvert(selectedTransaction)
      }
    )
  ] });
}
const ReclassificationsSection = ({ data, updateData, projectId, onGuideContextChange, onOpenGuide, isDemo, mockFlags }) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [highlightId, setHighlightId] = useState(null);
  const reclassifications = data.reclassifications || [];
  const addReclassification = () => {
    const newEntry = {
      id: crypto.randomUUID(),
      accountNumber: "",
      accountDescription: "",
      fromFsLineItem: "",
      toFsLineItem: "",
      amount: 0,
      description: "",
      sourceType: "manual"
    };
    updateData({ reclassifications: [...reclassifications, newEntry] });
  };
  const updateReclassification = (id, field, value) => {
    updateData({
      reclassifications: reclassifications.map(
        (rec) => rec.id === id ? { ...rec, [field]: value } : rec
      )
    });
  };
  const deleteReclassification = (id) => {
    updateData({ reclassifications: reclassifications.filter((rec) => rec.id !== id) });
  };
  const totalAmount = reclassifications.reduce((sum, rec) => sum + (rec.amount || 0), 0);
  const manualCount = reclassifications.filter((r) => r.sourceType !== "ai-suggested").length;
  const aiCount = reclassifications.filter((r) => r.sourceType === "ai-suggested").length;
  const handleConvertToReclassification = (flagged) => {
    const aiAnalysis = flagged.ai_analysis || {};
    const accountParts = (flagged.account_name || "").split(" ");
    const accountNumber = accountParts[0] || "";
    const newReclassification = {
      id: crypto.randomUUID(),
      accountNumber,
      accountDescription: flagged.description || flagged.account_name,
      fromFsLineItem: aiAnalysis.suggested_from_line_item || "",
      toFsLineItem: aiAnalysis.suggested_to_line_item || "",
      amount: Math.abs(flagged.amount || 0),
      description: flagged.flag_reason || "AI-suggested reclassification",
      sourceType: "ai-suggested"
    };
    updateData({ reclassifications: [...reclassifications, newReclassification] });
    toast$1({ title: "Reclassification added", description: flagged.account_name || flagged.description });
    setActiveTab("manual");
    setHighlightId(newReclassification.id);
    setTimeout(() => setHighlightId(null), 2e3);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Reclassification Adjustments" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Reclassify accounts between Financial Statement Line Items" })
      ] }),
      /* @__PURE__ */ jsx(Badge, { variant: reclassifications.length > 0 ? "default" : "secondary", className: "gap-1", children: reclassifications.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
        reclassifications.length,
        " ",
        reclassifications.length === 1 ? "entry" : "entries"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        "No entries"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Entries", value: reclassifications.length, subtitle: "Reclassification entries", isCurrency: false }),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Manual / AI",
          value: `${manualCount} / ${aiCount}`,
          subtitle: "Entry sources"
        }
      ),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Amount", value: totalAmount, subtitle: "Net reclassification" })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (v) => {
      setActiveTab(v);
      onGuideContextChange?.({ mode: v === "ai-discovery" ? "ai-discovery" : "ledger" });
    }, children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2 max-w-md", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "manual", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }),
          "Manual Reclassifications",
          reclassifications.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1", children: reclassifications.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "ai-discovery", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          "AI Discovery"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "manual", className: "mt-6", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Reclassification Entries" }),
          /* @__PURE__ */ jsxs(Button, { onClick: addReclassification, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " Add Entry"
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: reclassifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
          /* @__PURE__ */ jsx("p", { children: "No reclassifications recorded" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Add entries to reclassify accounts between FS Line Items" }),
          onOpenGuide && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "text-sm text-primary hover:underline mt-2",
              onClick: () => onOpenGuide(),
              children: "Not sure what to do? Open the guide →"
            }
          )
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: reclassifications.map((rec) => /* @__PURE__ */ jsxs("div", { className: `p-4 border rounded-lg space-y-3 transition-all ${rec.id === highlightId ? "ring-2 ring-primary animate-pulse" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-3 items-center", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Account #",
                value: rec.accountNumber || "",
                onChange: (e) => updateReclassification(rec.id, "accountNumber", e.target.value),
                className: "md:col-span-1"
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Account Description",
                value: rec.accountDescription,
                onChange: (e) => updateReclassification(rec.id, "accountDescription", e.target.value),
                className: "md:col-span-3"
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                placeholder: "Amount",
                value: rec.amount || "",
                onChange: (e) => updateReclassification(rec.id, "amount", parseFloat(e.target.value) || 0),
                className: "md:col-span-2"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-7 gap-3 items-center", children: [
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: rec.fromFsLineItem,
                onValueChange: (value) => updateReclassification(rec.id, "fromFsLineItem", value),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "md:col-span-3", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "From FS Line Item" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(FS_LINE_ITEMS_BY_TYPE).map(([group, items]) => /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "px-2 py-1.5 text-xs font-semibold text-muted-foreground", children: group }),
                    items.map((item) => /* @__PURE__ */ jsx(SelectItem, { value: item, children: item }, item))
                  ] }, group)) })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: rec.toFsLineItem,
                onValueChange: (value) => updateReclassification(rec.id, "toFsLineItem", value),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "md:col-span-3", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "To FS Line Item" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(FS_LINE_ITEMS_BY_TYPE).map(([group, items]) => /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "px-2 py-1.5 text-xs font-semibold text-muted-foreground", children: group }),
                    items.map((item) => /* @__PURE__ */ jsx(SelectItem, { value: item, children: item }, item))
                  ] }, group)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Description / Reason for reclassification",
                value: rec.description,
                onChange: (e) => updateReclassification(rec.id, "description", e.target.value),
                className: "flex-1"
              }
            ),
            rec.sourceType === "ai-suggested" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "shrink-0", children: "AI Suggested" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => deleteReclassification(rec.id),
                className: "text-muted-foreground hover:text-destructive",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }, rec.id)) }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ai-discovery", className: "mt-6", children: projectId ? /* @__PURE__ */ jsx(
        ReclassificationAIDiscoverySection,
        {
          projectId,
          isDemo,
          mockFlags: isDemo ? mockFlags : void 0,
          onConvertToReclassification: handleConvertToReclassification
        }
      ) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }),
        /* @__PURE__ */ jsx("p", { children: "Project ID required for AI Discovery" })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "mt-6", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 text-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Entries" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl font-bold", children: reclassifications.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Manual / AI" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
          manualCount,
          " / ",
          aiCount
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Amount" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
          "$",
          totalAmount.toLocaleString()
        ] })
      ] })
    ] }) }) })
  ] });
};
export {
  ReclassificationsSection
};
