import { useState, useEffect, useCallback } from 'react';
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

interface UseFlaggedTransactionsReturn {
  transactions: FlaggedTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (id: string, status: FlagStatus) => Promise<boolean>;
  runAnalysis: () => Promise<boolean>;
  isAnalyzing: boolean;
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
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!projectId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      
      // Use fetch API to avoid type conflicts with new table not in generated types
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
      
      // Apply filters
      if (status) {
        const statusArr = Array.isArray(status) ? status : [status];
        fetchedData = fetchedData.filter((t: FlaggedTransaction) => statusArr.includes(t.status));
      }
      if (flagType) {
        fetchedData = fetchedData.filter((t: FlaggedTransaction) => t.flag_type === flagType);
      }
      // Filter by reclassification type
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
      
      // Use fetch API to avoid type conflicts with new table
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

      // Update local state
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

  const runAnalysis = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;

    setIsAnalyzing(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-transactions', {
        body: { project_id: projectId, analysis_type: 'full' }
      });

      if (fnError) {
        throw fnError;
      }

      toast({
        title: 'Analysis complete',
        description: data.message || `Found ${data.flagged_count} potential adjustments`
      });

      // Refresh the list
      await fetchTransactions();
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to run analysis';
      toast({
        title: 'Analysis failed',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, fetchTransactions, toast]);

  // Calculate stats
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
    isAnalyzing,
    stats
  };
}
