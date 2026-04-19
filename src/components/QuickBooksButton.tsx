import { useState, useEffect, useCallback } from "react";
import { useQuickBooksConnection } from "@/hooks/useQuickBooksConnection";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Unlink, RefreshCw, Share2, Copy, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { QUICKBOOKS_CLOUD_RUN_URL } from "@/lib/externalApiUrls";
import type { Workflow } from "@/types/workflow";

// Local storage key for persisting workflow ID across navigation
const WORKFLOW_STORAGE_KEY = "qb_sync_workflow";

interface StoredWorkflow {
  workflowId: string;
  projectId: string;
  startedAt: string;
}

interface QuickBooksButtonProps {
  projectId: string;
  userId: string;
  periods?: Array<{ year: number; month: number; isStub?: boolean }>;
  onSyncComplete?: () => void;
  lastSyncDate?: string;
}

export function QuickBooksButton({ projectId, userId, periods, onSyncComplete, lastSyncDate }: QuickBooksButtonProps) {
  const { connected, companyName, realmId, loading, error, tokenHealth, connect, disconnect, refreshToken, refetch } = useQuickBooksConnection(projectId, userId);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Workflow tracking state
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<Workflow | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  
  // Success state for post-sync feedback
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  
  // Health check state for real-time progress
  const [actualRecordCount, setActualRecordCount] = useState<number>(0);
  const [expectedRecordCount, setExpectedRecordCount] = useState<number>(36);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Check if financial periods are configured
  const regularPeriods = (periods || []).filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  // Check for existing workflow on mount
  useEffect(() => {
    const stored = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredWorkflow = JSON.parse(stored);
        // Only restore if it's for the same project and started within the last hour
        const startedAt = new Date(parsed.startedAt).getTime();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
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

  // Poll for recovery workflows if we have no active workflow on mount
  // This catches orphan syncs where trigger-qb-sync failed but Java service is running
  useEffect(() => {
    if (activeWorkflowId) return; // Already tracking a workflow

    const checkForActiveSync = async () => {
      const { data } = await supabase
        .from("workflows")
        .select("id, status, progress_percent, created_at")
        .eq("project_id", projectId)
        .eq("workflow_type", "SYNC_TO_SHEET")
        .in("status", ["pending", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        console.log("[QB Sync] Recovering active workflow:", data.id);
        setActiveWorkflowId(data.id);
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({
          workflowId: data.id,
          projectId,
          startedAt: data.created_at,
        }));
      }
    };

    // Check immediately on mount
    checkForActiveSync();

    // Poll every 10 seconds for 2 minutes to catch recovery workflows
    const interval = setInterval(checkForActiveSync, 10000);
    const timeout = setTimeout(() => clearInterval(interval), 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [projectId, activeWorkflowId]);

  // Subscribe to workflow status updates via Realtime
  useEffect(() => {
    if (!activeWorkflowId) {
      setWorkflowStatus(null);
      return;
    }

    // Fetch initial status
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", activeWorkflowId)
        .single();

      if (error) {
        console.error("[QB Sync] Failed to fetch workflow status:", error);
        // Clear stale workflow
        localStorage.removeItem(WORKFLOW_STORAGE_KEY);
        setActiveWorkflowId(null);
        return;
      }

      setWorkflowStatus(data as unknown as Workflow);

      // If already completed or failed, clean up
      if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
        handleWorkflowComplete(data as unknown as Workflow);
      }
    };

    fetchStatus();

    // Subscribe to Realtime updates
    const channel = supabase
      .channel(`workflow-${activeWorkflowId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workflows",
          filter: `id=eq.${activeWorkflowId}`,
        },
        (payload) => {
          const updated = payload.new as unknown as Workflow;
          setWorkflowStatus(updated);

          if (updated.status === "completed" || updated.status === "failed" || updated.status === "cancelled") {
            handleWorkflowComplete(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkflowId]);

  // Periodic health check polling when sync is active
  useEffect(() => {
    if (!activeWorkflowId || !workflowStatus || workflowStatus.status !== 'running') {
      return;
    }

    const checkHealth = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-workflow-health', {
          body: { workflow_id: activeWorkflowId }
        });

        if (error) {
          console.error('[QB Sync] Health check error:', error);
          return;
        }

        if (data) {
          // Update actual record count from database
          setActualRecordCount(data.records_synced || 0);
          setExpectedRecordCount(data.expected_records || 36);

          // If health check shows higher actual progress, trust it
          if (data.actual_progress > (workflowStatus?.progress_percent || 0)) {
            console.log('[QB Sync] Health check shows better progress:', data.actual_progress);
          }

          // Handle stuck/timeout detection from server
          if (data.status === 'timeout' || data.status === 'stuck') {
            console.warn('[QB Sync] Workflow detected as stuck/timeout by server');
          }
        }
      } catch (err) {
        console.error('[QB Sync] Health check failed:', err);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30 seconds during active sync
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [activeWorkflowId, workflowStatus?.status]);

  const handleWorkflowComplete = useCallback((workflow: Workflow) => {
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);

    if (workflow.status === "completed") {
      const outputPayload = workflow.output_payload as Record<string, unknown> | null;
      toast({
        title: "QuickBooks synced successfully!",
        description: "Data has been imported and is ready in the workbook.",
      });

      // Trigger project refresh
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      // Set success state for persistent UI feedback
      setJustCompleted(true);
      setCompletedAt(new Date());
      
      // Clear success state after 10 seconds
      setTimeout(() => {
        setJustCompleted(false);
        setCompletedAt(null);
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 10000);
    } else if (workflow.status === "failed") {
      const errorDetails = workflow.error_details as unknown as Record<string, unknown> | null;
      const errorCode = (errorDetails?.code as string) || "";

      // Show user-friendly message based on error code
      if (errorCode === "QB_SYNC_FAILED") {
        toast({
          title: "QuickBooks permission denied",
          description: "Your QuickBooks authorization may have expired. Try disconnecting and reconnecting QuickBooks.",
          variant: "destructive",
        });
      } else if (errorCode === "QB_NOT_CONFIGURED") {
        toast({
          title: "QuickBooks not configured",
          description: "QuickBooks integration is not set up. Please contact support.",
          variant: "destructive",
        });
      } else if (errorCode === "NO_SHEET") {
        toast({
          title: "Configuration error",
          description: "Please contact support.",
          variant: "destructive",
        });
      } else if (errorCode === "CREDENTIALS_UNAVAILABLE" || workflow.error_message?.includes("credential")) {
        toast({
          title: "QuickBooks connection unavailable",
          description: "The credential service is temporarily unavailable. Please try again in a few minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync failed",
          description: workflow.error_message || "Unknown error occurred",
          variant: "destructive",
        });
      }
      
      // For failed/cancelled, clear after 2 seconds as before
      setTimeout(() => {
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 2000);
    } else if (workflow.status === "cancelled") {
      toast({
        title: "Sync cancelled",
        description: "The QuickBooks sync was cancelled.",
      });
      
      // For failed/cancelled, clear after 2 seconds as before
      setTimeout(() => {
        setActiveWorkflowId(null);
        setWorkflowStatus(null);
      }, 2000);
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
    // Double-check periods are saved in the database (not just local state)
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("periods")
      .eq("id", projectId)
      .single();
    
    if (projectError) {
      console.error('[QB Sync] Failed to verify project periods:', projectError);
      toast({
        title: 'Failed to verify project',
        description: 'Could not verify project configuration. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    const dbPeriods = (Array.isArray(projectData?.periods) ? projectData.periods : [])
      .filter((p: { isStub?: boolean }) => !p.isStub);
    
    if (dbPeriods.length === 0) {
      // Check if local state has periods but DB doesn't - user needs to save
      const localPeriods = (periods || []).filter(p => !p.isStub);
      if (localPeriods.length > 0) {
        toast({
          title: 'Save your changes first',
          description: 'You\'ve configured periods but haven\'t saved. Click Save, then try syncing again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Analysis periods not configured',
          description: 'Go to Project Setup (Phase 1, Section 1) and set your start/end dates for the analysis period.',
          variant: 'destructive'
        });
      }
      return;
    }

    // Check if realmId is missing
    if (!realmId) {
      console.error('[QB Sync] No realmId available. Connection may be incomplete.');
      toast({
        title: 'QuickBooks connection incomplete',
        description: 'Please disconnect and reconnect QuickBooks to establish a complete connection.',
        variant: 'destructive'
      });
      return;
    }

    // Pre-sync token health validation - try auto-refresh if needed
    if (tokenHealth) {
      if (!tokenHealth.isValid || tokenHealth.needsRefresh) {
        // Attempt automatic token refresh before blocking
        toast({
          title: 'Refreshing QuickBooks token...',
          description: 'Please wait while we refresh your credentials.',
        });
        
        const result = await refreshToken();
        
        if (!result.success) {
          // Check if refresh token itself has expired
          if (result.code === 'REFRESH_TOKEN_EXPIRED' || result.code === 'NO_REFRESH_TOKEN') {
            toast({
              title: 'QuickBooks authorization expired',
              description: 'Your QuickBooks authorization has fully expired. Please disconnect and reconnect QuickBooks.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Token refresh failed',
              description: result.error || 'Please try again or reconnect QuickBooks.',
              variant: 'destructive',
            });
          }
          return;
        }
        
        toast({
          title: 'Token refreshed!',
          description: 'Starting QuickBooks sync...',
        });
      } else if (tokenHealth.expiresSoon) {
        // Warning only - allow sync to proceed
        toast({
          title: 'Token expiring soon',
          description: `Your QuickBooks authorization expires in ${tokenHealth.minutesUntilExpiry} minutes. Consider reconnecting after this sync.`,
        });
      }
    }

    setIsStartingSync(true);
    
    try {
      // Verify session is valid before making the call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[QB Sync] No valid session:', sessionError);
        toast({ 
          title: 'Session expired',
          description: 'Please refresh the page and try again',
          variant: 'destructive'
        });
        setIsStartingSync(false);
        return;
      }
      
      console.log('[QB Sync] Starting workflow-based sync for project:', projectId);
      
      // Call trigger-qb-sync edge function to create a workflow
      const { data, error: triggerError } = await supabase.functions.invoke('trigger-qb-sync', {
        body: { project_id: projectId, realm_id: realmId }
      });
      
      // Check for errors - either from invoke or in response body
      if (triggerError || data?.error) {
        const errorCode = data?.code;
        const errorMessage = data?.message || data?.error || triggerError?.message || 'Unknown error';
        console.error('[QB Sync] Trigger error:', { triggerError, data });
        
        // Show specific messages based on error code
        if (errorCode === 'NO_PERIODS') {
          toast({ 
            title: 'Analysis periods required',
            description: 'Go to Project Setup (Phase 1, Section 1) and set your start/end dates for the analysis period.',
            variant: 'destructive'
          });
      } else if (errorCode === 'NO_SHEET') {
          toast({ 
            title: 'Configuration error',
            description: 'Please contact support.',
            variant: 'destructive'
          });
        } else if (errorCode === 'UNAUTHORIZED') {
          toast({ 
            title: 'Session expired',
            description: 'Please refresh the page and try again.',
            variant: 'destructive'
          });
        } else {
          toast({ 
            title: 'Failed to start sync',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        setIsStartingSync(false);
        return;
      }

      console.log('[QB Sync] Workflow created:', data);

      // Store workflow ID in localStorage for persistence across navigation
      const workflowId = data.workflow_id;
      const storedWorkflow: StoredWorkflow = {
        workflowId,
        projectId,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(storedWorkflow));

      // Set active workflow to start tracking
      setActiveWorkflowId(workflowId);

      toast({ 
        title: 'QuickBooks sync started',
        description: 'This may take 5-15 minutes for large datasets. You can navigate away - the sync will continue in the background.',
      });
    } catch (err) {
      console.error('[QB Sync] Catch error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        toast({ 
          title: 'Connection failed',
          description: 'Could not connect to sync service. Please check your connection and try again.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Sync failed',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsStartingSync(false);
    }
  };

  // Determine if sync is in progress
  const isSyncing = activeWorkflowId !== null && workflowStatus?.status !== "completed" && workflowStatus?.status !== "failed";
  const progressPercent = workflowStatus?.progress_percent || 0;
  const currentStep = workflowStatus?.current_step || "";

  // Check if workflow appears stuck (running for >15 minutes without updates)
  const isStuckWorkflow = (): boolean => {
    if (!workflowStatus || workflowStatus.status !== 'running') return false;
    const updatedAt = new Date(workflowStatus.updated_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return (now - updatedAt) > fifteenMinutes;
  };

  // Get elapsed time since sync started
  const getElapsedTime = (): string => {
    if (!workflowStatus?.started_at) return "";
    const startedAt = new Date(workflowStatus.started_at).getTime();
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const handleRetrySync = async () => {
    // Clear the stuck workflow
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    setActiveWorkflowId(null);
    setWorkflowStatus(null);
    
    // Trigger a new sync
    await handleImport();
  };

  const handleCancelSync = async () => {
    if (!activeWorkflowId) return;
    
    try {
      // Update workflow status to cancelled
      await supabase
        .from("workflows")
        .update({ 
          status: "cancelled" as const, 
          error_message: "Cancelled by user",
          updated_at: new Date().toISOString()
        })
        .eq("id", activeWorkflowId);
      
      // Clear local state
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

  // Handle manual token refresh
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
        if (result.code === 'REFRESH_TOKEN_EXPIRED' || result.code === 'NO_REFRESH_TOKEN') {
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

  // Get human-readable step name
  const getStepLabel = (step: string): string => {
    const labels: Record<string, string> = {
      validate: "Validating connection",
      fetch_qb: "Fetching QuickBooks data",
      transform: "Transforming data",
      push_sheets: "Saving processed data",
      update_wizard: "Updating wizard data",
    };
    return labels[step] || step;
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (error) {
    return (
      <div className="flex gap-2 w-full">
        <Button 
          onClick={connect}
          className="gap-2 bg-[#2CA01C] hover:bg-[#1E8E14] text-white border-0"
        >
          <QuickBooksIcon className="w-4 h-4" />
          Connect to QuickBooks
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowShareDialog(true)}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Request QuickBooks Access
        </Button>
        <ShareLinkDialog 
          open={showShareDialog} 
          onOpenChange={setShowShareDialog}
          shareableLink={getShareableLink()}
          onCopyLink={handleCopyLink}
          onRefresh={refetch}
        />
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex flex-col gap-2">
        {/* Warning banner when periods are not configured */}
        {!hasPeriods && (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Configure <strong>Analysis Periods</strong> in Project Setup and <strong>Save</strong> before syncing
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
            <QuickBooksIcon className="w-4 h-4 text-[#2CA01C]" />
            <span className="font-medium">{companyName || "QuickBooks"}</span>
            {tokenHealth?.expiresSoon || tokenHealth?.needsRefresh ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshToken}
                      disabled={isRefreshingToken}
                      className="h-6 w-6 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                    >
                      {isRefreshingToken ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Token expires in {tokenHealth.minutesUntilExpiry} minutes - click to refresh</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : tokenHealth && !tokenHealth.isValid ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshToken}
                      disabled={isRefreshingToken}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {isRefreshingToken ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Token expired - click to refresh</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Check className="w-3.5 h-3.5 text-[#2CA01C]" />
            )}
        </div>

        {/* Show sync progress or stuck workflow message */}
        {isSyncing ? (
          isStuckWorkflow() ? (
            <div className="flex items-center gap-3 min-w-[320px]">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Sync appears stuck ({getElapsedTime()})</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {actualRecordCount > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {actualRecordCount} of {expectedRecordCount} periods synced
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetrySync}
                  className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancelSync}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-[280px]">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{getStepLabel(currentStep)}</span>
                  <span>{getElapsedTime()} • {progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {actualRecordCount > 0 && currentStep === 'fetch_qb' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {actualRecordCount} of {expectedRecordCount} periods synced
                  </div>
                )}
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )
        ) : justCompleted ? (
          // Success state - show for 10 seconds after completion
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Synced {completedAt ? formatDistanceToNow(completedAt, { addSuffix: true }) : 'just now'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleImport}
              disabled={isStartingSync}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Again
            </Button>
          </div>
        ) : (
          // Normal state with optional last sync time
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-start">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleImport}
                    disabled={isStartingSync || !hasPeriods}
                    className="gap-2"
                  >
                    {isStartingSync ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isStartingSync ? 'Starting sync...' : 'Sync QuickBooks'}
                  </Button>
                  {lastSyncDate && !isStartingSync && (
                    <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                      Last: {format(new Date(lastSyncDate), "MMM d, h:mm a")}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {!hasPeriods && (
                <TooltipContent>
                  <p>Configure analysis periods in Project Setup first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isSyncing || isStartingSync}
              className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive disabled:opacity-50"
            >
              <Unlink className="w-4 h-4" />
              Disconnect QuickBooks
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect from QuickBooks?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect <span className="font-medium">"{companyName || "QuickBooks"}"</span> from this project. You can reconnect at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect QuickBooks
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      <Button 
        onClick={connect}
        className="gap-2 bg-[#2CA01C] hover:bg-[#1E8E14] text-white border-0"
      >
        <QuickBooksIcon className="w-4 h-4" />
        Connect to QuickBooks
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowShareDialog(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Request QuickBooks Access
      </Button>
      <ShareLinkDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog}
        shareableLink={getShareableLink()}
        onCopyLink={handleCopyLink}
        onRefresh={refetch}
      />
    </div>
  );
}

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareableLink: string;
  onCopyLink: () => void;
  onRefresh: () => Promise<void>;
}

function ShareLinkDialog({ open, onOpenChange, shareableLink, onCopyLink, onRefresh }: ShareLinkDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QuickBooksIcon className="w-5 h-5 text-[#2CA01C]" />
            Request QuickBooks Access
          </DialogTitle>
          <DialogDescription>
            Don't have access to the QuickBooks account? Send this link to the business owner. 
            Once they log in and authorize access, you'll be able to sync their financial data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Input 
              value={shareableLink} 
              readOnly 
              className="font-mono text-xs" 
            />
            <Button variant="outline" size="icon" onClick={onCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Instructions for the business owner:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click the link or paste it in your browser</li>
              <li>Log in to your QuickBooks account</li>
              <li>Authorize access to your company data</li>
              <li>You'll be redirected back once complete</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              After the owner connects, click refresh to update status.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickBooksIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5v1.5c-1.66 0-3 1.34-3 3s1.34 3 3 3v1.5zm2-3.5c0 .83-.67 1.5-1.5 1.5S10 14.83 10 14s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm1.5 3.5v-1.5c1.66 0 3-1.34 3-3s-1.34-3-3-3V8.5c2.49 0 4.5 2.01 4.5 4.5s-2.01 4.5-4.5 4.5z"/>
    </svg>
  );
}
