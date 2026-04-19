import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionEnd: string | null;
  paidProjects: string[];
  sharedProjects: string[];
  projectCredits: number;
  activeProjectCount: number;
  monthlyProjectLimit: number;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscriptionEnd: null,
    paidProjects: [],
    sharedProjects: [],
    projectCredits: 0,
    activeProjectCount: 0,
    monthlyProjectLimit: 3,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus({
          hasActiveSubscription: false,
          subscriptionEnd: null,
          paidProjects: [],
          sharedProjects: [],
          projectCredits: 0,
          activeProjectCount: 0,
          monthlyProjectLimit: 3,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setStatus({
        hasActiveSubscription: data.hasActiveSubscription || false,
        subscriptionEnd: data.subscriptionEnd || null,
        paidProjects: data.paidProjects || [],
        sharedProjects: data.sharedProjects || [],
        projectCredits: data.projectCredits || 0,
        activeProjectCount: data.activeProjectCount ?? 0,
        monthlyProjectLimit: data.monthlyProjectLimit ?? 3,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, []);

  const hasAccessToProject = useCallback((projectId: string): boolean => {
    return status.hasActiveSubscription || status.paidProjects.includes(projectId) || status.sharedProjects.includes(projectId);
  }, [status.hasActiveSubscription, status.paidProjects, status.sharedProjects]);

  const canCreateProjects = useCallback((): boolean => {
    // Whitelisted / per-project credit users: always allowed
    if (status.projectCredits > 0) return true;
    
    if (status.hasActiveSubscription) {
      // Monthly subscribers: enforce 3-project limit unless they have overage credits
      return status.activeProjectCount < status.monthlyProjectLimit || status.projectCredits > 0;
    }

    return false;
  }, [status.hasActiveSubscription, status.projectCredits, status.activeProjectCount, status.monthlyProjectLimit]);

  const isAtMonthlyLimit = useCallback((): boolean => {
    return status.hasActiveSubscription && status.activeProjectCount >= status.monthlyProjectLimit && status.projectCredits <= 0;
  }, [status.hasActiveSubscription, status.activeProjectCount, status.monthlyProjectLimit, status.projectCredits]);

  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    ...status,
    checkSubscription,
    hasAccessToProject,
    canCreateProjects,
    isAtMonthlyLimit,
  };
}
