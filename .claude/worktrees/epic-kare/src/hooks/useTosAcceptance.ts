import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Bump this string whenever the ToS is updated — all users will be re-prompted
export const CURRENT_TOS_VERSION = '2026-02-20';

interface TosAcceptanceState {
  hasAccepted: boolean;
  loading: boolean;
}

export function useTosAcceptance() {
  const [state, setState] = useState<TosAcceptanceState>({ hasAccepted: false, loading: true });

  const checkAcceptance = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setState({ hasAccepted: false, loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('tos_acceptances' as any)
      .select('id')
      .eq('user_id', session.user.id)
      .eq('tos_version', CURRENT_TOS_VERSION)
      .limit(1);

    if (error) {
      console.error('[useTosAcceptance] Error checking acceptance:', error);
      setState({ hasAccepted: false, loading: false });
      return;
    }

    setState({ hasAccepted: (data?.length ?? 0) > 0, loading: false });
  }, []);

  useEffect(() => {
    checkAcceptance();
  }, [checkAcceptance]);

  const recordAcceptance = useCallback(async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
      .from('tos_acceptances' as any)
      .insert({
        user_id: session.user.id,
        tos_version: CURRENT_TOS_VERSION,
        accepted_at: new Date().toISOString(),
        ip_address: null, // Browser doesn't expose client IP
      });

    if (error) {
      console.error('[useTosAcceptance] Error recording acceptance:', error);
      return false;
    }

    setState({ hasAccepted: true, loading: false });
    return true;
  }, []);

  return { ...state, recordAcceptance };
}
