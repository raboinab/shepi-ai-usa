import { useState, useEffect, useCallback } from "react";
import { QUICKBOOKS_CLOUD_RUN_URL } from "@/lib/externalApiUrls";
import { supabase } from "@/integrations/supabase/client";

export interface TokenHealth {
  isValid: boolean;
  expiresAt: string | null;
  expiresSoon: boolean;
  needsRefresh: boolean;
  minutesUntilExpiry: number | null;
}

export interface QuickBooksConnectionState {
  connected: boolean;
  companyName: string | null;
  realmId: string | null;
  loading: boolean;
  error: string | null;
  tokenHealth: TokenHealth | null;
}

export function useQuickBooksConnection(projectId: string, userId: string) {
  const [state, setState] = useState<QuickBooksConnectionState>({
    connected: false,
    companyName: null,
    realmId: null,
    loading: true,
    error: null,
    tokenHealth: null,
  });

  const fetchConnectionStatus = useCallback(async () => {
    if (!projectId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/check-connection?projectId=${encodeURIComponent(projectId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to check connection status");
      }

      const data = await response.json();

      setState({
        connected: data.connected || false,
        companyName: data.companyName || null,
        realmId: data.realmId || null,
        loading: false,
        error: null,
        tokenHealth: data.tokenHealth || null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to check connection",
      }));
    }
  }, [projectId]);

  const connect = useCallback(() => {
    if (!projectId || !userId) return;

    const loginUrl = `${QUICKBOOKS_CLOUD_RUN_URL}/quickbooks/login?userId=${encodeURIComponent(userId)}&projectId=${encodeURIComponent(projectId)}`;
    window.location.href = loginUrl;
  }, [projectId, userId]);

  const disconnect = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/disconnect?projectId=${encodeURIComponent(projectId)}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      setState({
        connected: false,
        companyName: null,
        realmId: null,
        loading: false,
        error: null,
        tokenHealth: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to disconnect",
      }));
      throw error;
    }
  }, [projectId]);

  // Refresh QuickBooks token without disconnecting
  const refreshToken = useCallback(async (): Promise<{ success: boolean; code?: string; error?: string }> => {
    if (!projectId) {
      return { success: false, error: "No project ID" };
    }

    try {
      const { data, error } = await supabase.functions.invoke('refresh-qb-token', {
        body: { project_id: projectId }
      });

      if (error) {
        console.error('[QB] Token refresh invoke error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.error('[QB] Token refresh failed:', data);
        return { 
          success: false, 
          code: data?.code, 
          error: data?.error || 'Failed to refresh token' 
        };
      }

      // Refetch connection status to get updated tokenHealth
      await fetchConnectionStatus();
      return { success: true };
    } catch (error) {
      console.error('[QB] Token refresh error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [projectId, fetchConnectionStatus]);

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  return {
    ...state,
    connect,
    disconnect,
    refreshToken,
    refetch: fetchConnectionStatus,
  };
}
