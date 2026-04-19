import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FlagStatus = 'pending' | 'accepted' | 'dismissed' | 'converted';

export interface FlaggedTransaction {
  id: string;
  project_id: string;
  user_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  account_name: string;
  flag_type: string;
  flag_reason: string;
  confidence_score: number;
  suggested_adjustment_type: string;
  suggested_adjustment_amount: number;
  status: FlagStatus;
  ai_analysis: Record<string, unknown>;
  source_data: Record<string, unknown>;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseFlaggedTransactionsOptions {
  projectId: string | null;
  status?: FlagStatus | FlagStatus[];
  flagType?: string;
  isReclassification?: boolean;
}

export interface AnalysisProgress {
  isRunning: boolean;
  processedEntries: number;
  totalEntries: number;
  flaggedCount: number;
  currentChunk: number;
}

export interface ReclassJobStatus {
  jobId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

interface UseFlaggedTransactionsReturn {
  transactions: FlaggedTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (id: string, status: FlagStatus) => Promise<boolean>;
  runAnalysis: () => Promise<boolean>;
  cancelAnalysis: () => void;
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress;
  reclassJobStatus: ReclassJobStatus;
  stats: {
    total: number;
    pending: number;
    accepted: number;
    dismissed: number;
    converted: number;
    totalAmount: number;
  };
}

export function useFlaggedTransactions({
  projectId,
  status,
  flagType,
  isReclassification
}: UseFlaggedTransactionsOptions): UseFlaggedTransactionsReturn {
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    isRunning: false,
    processedEntries: 0,
    totalEntries: 0,
    flaggedCount: 0,
    currentChunk: 0,
  });
  const [reclassJobStatus, setReclassJobStatus] = useState<ReclassJobStatus>({
    jobId: null,
    status: 'idle',
  });
  const abortRef = useRef<AbortController | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const staleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!projectId || projectId === 'demo') {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      
      const queryResult = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/flagged_transactions?project_id=eq.${projectId}&order=confidence_score.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`
          }
        }
      );
      
      if (!queryResult.ok) {
        throw new Error('Failed to fetch flagged transactions');
      }
      
      let fetchedData = await queryResult.json();
      
      if (status) {
        const statusArr = Array.isArray(status) ? status : [status];
        fetchedData = fetchedData.filter((t: FlaggedTransaction) => statusArr.includes(t.status));
      }
      if (flagType) {
        fetchedData = fetchedData.filter((t: FlaggedTransaction) => t.flag_type === flagType);
      }
      if (isReclassification !== undefined) {
        fetchedData = fetchedData.filter((t: FlaggedTransaction) => {
          const aiAnalysis = t.ai_analysis as Record<string, unknown> | null;
          const isReclass = aiAnalysis?.is_reclassification === true;
          return isReclassification ? isReclass : !isReclass;
        });
      }
      
      setTransactions(fetchedData || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch flagged transactions';
      setError(message);
      console.error('Error fetching flagged transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, status, flagType, isReclassification]);

  const updateStatus = useCallback(async (id: string, newStatus: FlagStatus): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/flagged_transactions?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            status: newStatus,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setTransactions(prev => 
        prev.map(tx => 
          tx.id === id 
            ? { ...tx, status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: user?.id || null }
            : tx
        )
      );

      toast({
        title: 'Status updated',
        description: `Transaction marked as ${newStatus}`,
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Check for in-progress reclassification jobs on mount
  useEffect(() => {
    if (!projectId || !isReclassification) return;

    const checkExistingJobs = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reclassification_jobs?project_id=eq.${projectId}&status=in.(pending,processing)&order=created_at.desc&limit=1`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${session.data.session.access_token}`
            }
          }
        );

        if (response.ok) {
          const jobs = await response.json();
          if (jobs.length > 0) {
            const activeJob = jobs[0];
            const jobResult = activeJob.result as Record<string, unknown> | null;
            const batchesCompleted = (jobResult?.batches_completed as number) || 0;
            const totalBatches = (jobResult?.total_batches as number) || 0;
            
            // Detect stale jobs: processing but not updated in 5+ minutes
            const updatedAt = new Date(activeJob.updated_at).getTime();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const isStale = activeJob.status === 'processing' && updatedAt < fiveMinutesAgo;

            if (isStale && batchesCompleted > 0) {
              console.log(`[reclass] Stale job detected (${activeJob.id}), polling status from backend`);
              // Backend handles processing internally — just poll status
              supabase.functions.invoke('ai-backend-proxy', {
                body: { endpoint: 'reclassify-status', payload: { job_id: activeJob.id } },
              }).catch(err => console.error('[reclass] Stale recovery poll failed:', err));
            }

            setReclassJobStatus({ jobId: activeJob.id, status: activeJob.status });
            setIsAnalyzing(true);
            
            // Show progress info if available
            if (batchesCompleted > 0 && totalBatches > 0) {
              setAnalysisProgress(prev => ({
                ...prev,
                isRunning: true,
                processedEntries: batchesCompleted,
                totalEntries: totalBatches,
                currentChunk: batchesCompleted,
              }));
            }
            
            subscribeToJob(activeJob.id);
          }
        }
      } catch (err) {
        console.error('Error checking existing reclassification jobs:', err);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isReclassification]);


  const subscribeToJob = useCallback((jobId: string) => {
    // Clean up previous subscription and stale interval
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
    if (staleIntervalRef.current) {
      clearInterval(staleIntervalRef.current);
      staleIntervalRef.current = null;
    }

    // Track last update time for stale detection
    let lastUpdateTime = Date.now();

    const channel = supabase
      .channel(`reclass-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reclassification_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          lastUpdateTime = Date.now(); // Reset stale timer on any update
          const newRecord = payload.new as any;
          const newStatus = newRecord.status;
          const jobResult = newRecord.result as Record<string, unknown> | null;

          setReclassJobStatus({
            jobId,
            status: newStatus,
            errorMessage: newRecord.error_message || undefined,
          });

          // Update progress from partial results during processing
          if (newStatus === 'processing' && jobResult) {
            const batchesCompleted = (jobResult.batches_completed as number) || 0;
            const totalBatches = (jobResult.total_batches as number) || 0;
            if (totalBatches > 0) {
              setAnalysisProgress(prev => ({
                ...prev,
                isRunning: true,
                processedEntries: batchesCompleted,
                totalEntries: totalBatches,
                currentChunk: batchesCompleted,
              }));
            }
          }

          if (newStatus === 'completed') {
            const result = newRecord.result as any;
            setIsAnalyzing(false);
            if (staleIntervalRef.current) {
              clearInterval(staleIntervalRef.current);
              staleIntervalRef.current = null;
            }
            toast({
              title: 'Analysis complete',
              description: `Found ${result?.flagged_count || 0} potential reclassifications across ${result?.accounts_analyzed || 0} accounts.`,
            });
            fetchTransactions();
            supabase.removeChannel(channel);
            realtimeChannelRef.current = null;
          } else if (newStatus === 'failed') {
            setIsAnalyzing(false);
            if (staleIntervalRef.current) {
              clearInterval(staleIntervalRef.current);
              staleIntervalRef.current = null;
            }
            toast({
              title: 'Analysis failed',
              description: newRecord.error_message || 'Unknown error occurred',
              variant: 'destructive',
            });
            supabase.removeChannel(channel);
            realtimeChannelRef.current = null;
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    // Polling-based stale recovery: every 60s, check if job is stuck
    staleIntervalRef.current = setInterval(async () => {
      const staleDurationMs = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - lastUpdateTime < staleDurationMs) return;

      console.log(`[reclass] Stale job detected via polling (${jobId}), attempting recovery`);
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reclassification_jobs?id=eq.${jobId}&select=status,result,updated_at`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${session.data.session.access_token}`
            }
          }
        );
        if (!response.ok) return;
        const jobs = await response.json();
        if (!jobs.length) return;

        const job = jobs[0];
        // Only recover if still processing
        if (job.status !== 'processing') {
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(staleIntervalRef.current!);
            staleIntervalRef.current = null;
          }
          return;
        }

        const jobResult = job.result as Record<string, unknown> | null;
        const batchesCompleted = (jobResult?.batches_completed as number) || 0;

        // Backend handles processing — just poll status
        supabase.functions.invoke('ai-backend-proxy', {
          body: { endpoint: 'reclassify-status', payload: { job_id: jobId } },
        }).catch(err => console.error('[reclass] Stale polling status check failed:', err));

        lastUpdateTime = Date.now(); // Prevent rapid re-triggers
      } catch (err) {
        console.error('[reclass] Stale polling check failed:', err);
      }
    }, 60_000);
  }, [fetchTransactions, toast]);

  const runAnalysis = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;

    // Cancel any existing analysis
    cancelAnalysis();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzing(true);
    setAnalysisProgress({
      isRunning: true,
      processedEntries: 0,
      totalEntries: 0,
      flaggedCount: 0,
      currentChunk: 0,
    });
    
    try {
      // Use queue-based reclassification analysis
      if (isReclassification) {
        const { data, error: fnError } = await supabase.functions.invoke('ai-backend-proxy', {
          body: { endpoint: 'reclassify', payload: { project_id: projectId } }
        });

        if (fnError) throw fnError;

        if (data.job_id) {
          // Queue-based: subscribe to job status updates
          setReclassJobStatus({ jobId: data.job_id, status: 'pending' });
          subscribeToJob(data.job_id);
          // Don't set isAnalyzing to false — realtime handler will do that
          return true;
        }

        // Fallback: if no job_id returned (e.g. no accounts to analyze)
        setIsAnalyzing(false);
        toast({
          title: 'Analysis complete',
          description: data.message || `Found ${data.flagged_count || 0} potential reclassifications`
        });

        await fetchTransactions();
        return true;
      }

      // Chunked GL analysis for adjustments
      let offset = 0;
      let totalFlagged = 0;
      let chunkNumber = 0;
      const CHUNK_SIZE = 5000;

      while (true) {
        if (controller.signal.aborted) {
          toast({
            title: 'Analysis cancelled',
            description: `Stopped after analyzing ${offset} entries. Found ${totalFlagged} adjustments so far.`
          });
          break;
        }

        chunkNumber++;
        const { data, error: fnError } = await supabase.functions.invoke('analyze-transactions', {
          body: { 
            project_id: projectId, 
            analysis_type: 'full',
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
          currentChunk: chunkNumber,
        });

        if (data.completed || !data.next_offset) {
          toast({
            title: 'Analysis complete',
            description: `Found ${totalFlagged} potential adjustments across ${data.total_entries || 'all'} entries`
          });
          break;
        }

        offset = data.next_offset;
      }

      await fetchTransactions();
      return true;
    } catch (err: unknown) {
      if (controller.signal.aborted) return false;
      const message = err instanceof Error ? err.message : 'Failed to run analysis';
      toast({
        title: 'Analysis failed',
        description: message,
        variant: 'destructive'
      });
      setIsAnalyzing(false);
      return false;
    } finally {
      // Only reset for non-reclassification (reclassification is handled by realtime)
      if (!isReclassification) {
        setIsAnalyzing(false);
      }
      setAnalysisProgress(prev => ({ ...prev, isRunning: false }));
      abortRef.current = null;
    }
  }, [projectId, isReclassification, fetchTransactions, cancelAnalysis, toast, subscribeToJob]);

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    accepted: transactions.filter(t => t.status === 'accepted').length,
    dismissed: transactions.filter(t => t.status === 'dismissed').length,
    converted: transactions.filter(t => t.status === 'converted').length,
    totalAmount: transactions
      .filter(t => t.status === 'pending' || t.status === 'accepted')
      .reduce((sum, t) => sum + Math.abs(t.suggested_adjustment_amount), 0)
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
