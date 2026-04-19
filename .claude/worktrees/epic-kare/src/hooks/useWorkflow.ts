import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  WorkflowType, 
  WorkflowPayload, 
  TriggerWorkflowResponse,
  WorkflowStatus
} from '@/types/workflow';

// Type-safe wrapper for Supabase operations that bypasses auto-generated types
const db = {
  workflows: () => supabase.from('workflows' as 'contact_submissions'),
};

interface UseWorkflowOptions {
  orchestratorUrl?: string;
}

interface UseWorkflowReturn {
  triggerWorkflow: (
    projectId: string,
    workflowType: WorkflowType,
    payload: WorkflowPayload
  ) => Promise<TriggerWorkflowResponse>;
  cancelWorkflow: (workflowId: string) => Promise<void>;
  retryWorkflow: (workflowId: string) => Promise<TriggerWorkflowResponse>;
  isLoading: boolean;
  error: Error | null;
}

const DEFAULT_ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL;

export function useWorkflow(options: UseWorkflowOptions = {}): UseWorkflowReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const orchestratorUrl = options.orchestratorUrl || DEFAULT_ORCHESTRATOR_URL;

  const triggerWorkflow = useCallback(async (
    projectId: string,
    workflowType: WorkflowType,
    payload: WorkflowPayload
  ): Promise<TriggerWorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If orchestrator is available, use it
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            project_id: projectId,
            workflow_type: workflowType,
            payload,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to trigger workflow');
        }

        return await response.json();
      }

      // Fallback: Create workflow record directly in Supabase
      // The orchestrator will pick it up when deployed
      const { data, error: insertError } = await supabase
        .from('workflows')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          workflow_type: workflowType,
          status: 'pending',
          progress_percent: 0,
          input_payload: JSON.parse(JSON.stringify(payload)),
        }] as any)
        .select('id, status')
        .single();

      if (insertError) throw insertError;

      const result = data as { id: string; status: string };
      return {
        workflow_id: result.id,
        status: result.status as WorkflowStatus,
        message: 'Workflow created. Waiting for orchestrator to process.',
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);

  const cancelWorkflow = useCallback(async (workflowId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows/${workflowId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to cancel workflow');
        }
        return;
      }

      // Fallback: Update status directly
      const { error: updateError } = await supabase
        .from('workflows')
        .update({ status: 'cancelled' } as any)
        .eq('id', workflowId);

      if (updateError) throw updateError;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);

  const retryWorkflow = useCallback(async (workflowId: string): Promise<TriggerWorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (orchestratorUrl) {
        const response = await fetch(`${orchestratorUrl}/api/workflows/${workflowId}/retry`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to retry workflow');
        }

        return await response.json();
      }

      // Fallback: Reset workflow status
      const { data, error: updateError } = await supabase
        .from('workflows')
        .update({ 
          status: 'pending',
          error_message: null,
          error_details: null,
          progress_percent: 0,
        } as any)
        .eq('id', workflowId)
        .select('id, status, retry_count')
        .single();

      if (updateError) throw updateError;

      const result = data as { id: string; status: string; retry_count?: number };
      
      // Increment retry count separately
      const currentRetryCount = result.retry_count || 0;
      await supabase
        .from('workflows')
        .update({ retry_count: currentRetryCount + 1 } as any)
        .eq('id', workflowId);

      return {
        workflow_id: result.id,
        status: result.status as WorkflowStatus,
        message: 'Workflow queued for retry',
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [orchestratorUrl]);

  return {
    triggerWorkflow,
    cancelWorkflow,
    retryWorkflow,
    isLoading,
    error,
  };
}
