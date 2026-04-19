import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Workflow, WorkflowStep } from '@/types/workflow';

// Type alias to bypass auto-generated types mismatch
type DbWorkflow = any;

interface UseWorkflowStatusReturn {
  workflow: Workflow | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWorkflowStatus(workflowId: string | null): UseWorkflowStatusReturn {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) {
      setWorkflow(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single() as { data: DbWorkflow; error: any };

      if (fetchError) throw fetchError;

      // Transform the data to match our Workflow type
      const transformedWorkflow: Workflow = {
        ...data,
        steps: (data.steps as WorkflowStep[]) || [],
        input_payload: (data.input_payload as Record<string, unknown>) || {},
        output_payload: data.output_payload as Record<string, unknown> | null,
        error_details: data.error_details as Workflow['error_details'],
      };

      setWorkflow(transformedWorkflow);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workflow'));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  // Initial fetch
  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!workflowId) return;

    const channel = supabase
      .channel(`workflow-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflows',
          filter: `id=eq.${workflowId}`,
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
          setWorkflow(transformedWorkflow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId]);

  return {
    workflow,
    isLoading,
    error,
    refetch: fetchWorkflow,
  };
}
