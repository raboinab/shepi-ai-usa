import { useCallback, useEffect, useMemo, useState } from 'react';
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
  // undefined = still resolving, true/false = known
  const [hasSession, setHasSession] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // Initial session probe
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
    });

    // React to subsequent auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setHasSession(false);
        queryClient.setQueryData(['subscription-status'], DEFAULTS);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setHasSession(!!session);
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      } else if (event === 'INITIAL_SESSION') {
        setHasSession(!!session);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
    enabled: hasSession === true,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  });

  const status = data ?? DEFAULTS;

  // Stay in loading state while we don't yet know auth status, or while
  // we know there's a session but haven't fetched results yet.
  const loading =
    hasSession === undefined ||
    (hasSession === true && (isLoading || (!data && isFetching)));

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
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    checkSubscription,
    hasAccessToProject,
    canCreateProjects,
    isAtMonthlyLimit,
  }), [status, loading, error, checkSubscription, hasAccessToProject, canCreateProjects, isAtMonthlyLimit]);
}
