import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscriptionEnd: string | null;
  paidProjects: string[];
  sharedProjects: string[];
  projectCredits: number;
  activeProjectCount: number;
  monthlyProjectLimit: number;
}

const DEFAULTS: SubscriptionData = {
  hasActiveSubscription: false,
  subscriptionEnd: null,
  paidProjects: [],
  sharedProjects: [],
  projectCredits: 0,
  activeProjectCount: 0,
  monthlyProjectLimit: 3,
};

async function fetchSubscriptionStatus(): Promise<SubscriptionData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return DEFAULTS;

  const { data, error } = await supabase.functions.invoke('check-subscription');
  if (error) {
    console.error('[useSubscription] Error:', error);
    throw error;
  }

  console.log('[useSubscription] Raw response:', data);

  const result = {
    hasActiveSubscription: data.hasActiveSubscription || false,
    subscriptionEnd: data.subscriptionEnd || null,
    paidProjects: data.paidProjects || [],
    sharedProjects: data.sharedProjects || [],
    projectCredits: data.projectCredits || 0,
    activeProjectCount: data.activeProjectCount ?? 0,
    monthlyProjectLimit: data.monthlyProjectLimit ?? 3,
  };

  console.log('[useSubscription] Parsed result:', result);
  return result;
}

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
    staleTime: 30 * 1000, // Reduced from 5min to 30sec for faster updates
    gcTime: 60 * 1000, // Garbage collect after 1min instead of default
  });

  const status = data ?? DEFAULTS;

  const checkSubscription = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  }, [queryClient]);

  const hasAccessToProject = useCallback((projectId: string): boolean => {
    return status.hasActiveSubscription || status.paidProjects.includes(projectId) || status.sharedProjects.includes(projectId);
  }, [status.hasActiveSubscription, status.paidProjects, status.sharedProjects]);

  const canCreateProjects = useCallback((): boolean => {
    if (status.projectCredits > 0) return true;
    if (status.hasActiveSubscription) {
      return status.activeProjectCount < status.monthlyProjectLimit || status.projectCredits > 0;
    }
    return false;
  }, [status.hasActiveSubscription, status.projectCredits, status.activeProjectCount, status.monthlyProjectLimit]);

  const isAtMonthlyLimit = useCallback((): boolean => {
    return status.hasActiveSubscription && status.activeProjectCount >= status.monthlyProjectLimit && status.projectCredits <= 0;
  }, [status.hasActiveSubscription, status.activeProjectCount, status.monthlyProjectLimit, status.projectCredits]);

  return useMemo(() => ({
    ...status,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    checkSubscription,
    hasAccessToProject,
    canCreateProjects,
    isAtMonthlyLimit,
  }), [status, isLoading, error, checkSubscription, hasAccessToProject, canCreateProjects, isAtMonthlyLimit]);
}
