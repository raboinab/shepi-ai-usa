import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Workflow, WorkflowListFilters, WorkflowStep } from '@/types/workflow';

// Type alias to bypass auto-generated types mismatch
type DbWorkflow = any;

interface UseWorkflowHistoryReturn {
  workflows: Workflow[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  pendingUpdates: number;
  applyPendingUpdates: () => void;
}

export function useWorkflowHistory(
  projectId: string | null,
  filters: WorkflowListFilters = {}
): UseWorkflowHistoryReturn {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pendingWorkflows, setPendingWorkflows] = useState<Workflow[]>([]);
  const [pendingUpdateIds, setPendingUpdateIds] = useState<Map<string, Workflow>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const limit = filters.limit || 20;

  const fetchWorkflows = useCallback(async (reset = true) => {
    if (!projectId) {
      setWorkflows([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;

      let query = supabase
        .from('workflows')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1) as any;

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.workflow_type) {
        query = query.eq('workflow_type', filters.workflow_type);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match our Workflow type
      const transformedWorkflows: Workflow[] = ((data || []) as DbWorkflow[]).map((item: DbWorkflow) => ({
        ...item,
        steps: (item.steps as WorkflowStep[]) || [],
        input_payload: (item.input_payload as Record<string, unknown>) || {},
        output_payload: item.output_payload as Record<string, unknown> | null,
        error_details: item.error_details as Workflow['error_details'],
      }));

      if (reset) {
        setWorkflows(transformedWorkflows);
        setOffset(limit);
        // Clear pending updates on refresh
        setPendingWorkflows([]);
        setPendingUpdateIds(new Map());
      } else {
        setWorkflows((prev) => [...prev, ...transformedWorkflows]);
        setOffset((prev) => prev + limit);
      }

      setTotalCount(count || 0);
      setHasMore((count || 0) > currentOffset + limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workflows'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filters.status, filters.workflow_type, limit, offset]);

  const loadMore = useCallback(async () => {
    await fetchWorkflows(false);
  }, [fetchWorkflows]);

  // Apply pending updates when user explicitly requests
  const applyPendingUpdates = useCallback(() => {
    if (pendingWorkflows.length > 0) {
      setWorkflows((prev) => [...pendingWorkflows, ...prev]);
      setTotalCount((prev) => prev + pendingWorkflows.length);
      setPendingWorkflows([]);
    }
    if (pendingUpdateIds.size > 0) {
      setWorkflows((prev) =>
        prev.map((w) => pendingUpdateIds.get(w.id) || w)
      );
      setPendingUpdateIds(new Map());
    }
  }, [pendingWorkflows, pendingUpdateIds]);

  // Initial fetch when projectId or filters change
  useEffect(() => {
    fetchWorkflows(true);
  }, [projectId, filters.status, filters.workflow_type]);

  // Subscribe to new workflows for this project - queue updates instead of applying immediately
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-workflows-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflows',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const data = payload.new;
          const transformedWorkflow: Workflow = {
            ...(data as Workflow),
            steps: (data.steps as unknown as WorkflowStep[]) || [],
            input_payload: (data.input_payload as unknown as Record<string, unknown>) || {},
            output_payload: data.output_payload as unknown as Record<string, unknown> | null,
            error_details: data.error_details as unknown as Workflow['error_details'],
          };
          // Queue instead of immediate update to prevent UI disruption
          setPendingWorkflows((prev) => [transformedWorkflow, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflows',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const data = payload.new;
          const transformedWorkflow: Workflow = {
            ...(data as Workflow),
            steps: (data.steps as unknown as WorkflowStep[]) || [],
            input_payload: (data.input_payload as unknown as Record<string, unknown>) || {},
            output_payload: data.output_payload as unknown as Record<string, unknown> | null,
            error_details: data.error_details as unknown as Workflow['error_details'],
          };
          // For updates, check if workflow is currently displayed - if so, update inline
          // Otherwise queue it
          setWorkflows((prev) => {
            const exists = prev.some(w => w.id === transformedWorkflow.id);
            if (exists) {
              // Update existing workflow inline (this is expected - user initiated)
              return prev.map((w) => (w.id === transformedWorkflow.id ? transformedWorkflow : w));
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    workflows,
    isLoading,
    error,
    refetch: () => fetchWorkflows(true),
    hasMore,
    loadMore,
    totalCount,
    pendingUpdates: pendingWorkflows.length + pendingUpdateIds.size,
    applyPendingUpdates,
  };
}
