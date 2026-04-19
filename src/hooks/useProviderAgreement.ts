import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CURRENT_PROVIDER_AGREEMENT_VERSION = '2026-04-13';

interface ProviderAgreementState {
  hasAccepted: boolean;
  loading: boolean;
}

export function useProviderAgreement() {
  const [state, setState] = useState<ProviderAgreementState>({ hasAccepted: false, loading: true });

  const checkAcceptance = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setState({ hasAccepted: false, loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('dfy_provider_agreements' as any)
      .select('id')
      .eq('user_id', session.user.id)
      .eq('agreement_version', CURRENT_PROVIDER_AGREEMENT_VERSION)
      .limit(1);

    if (error) {
      console.error('[useProviderAgreement] Error checking acceptance:', error);
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
      .from('dfy_provider_agreements' as any)
      .insert({
        user_id: session.user.id,
        agreement_version: CURRENT_PROVIDER_AGREEMENT_VERSION,
        accepted_at: new Date().toISOString(),
        ip_address: null,
      });

    if (error) {
      console.error('[useProviderAgreement] Error recording acceptance:', error);
      return false;
    }

    setState({ hasAccepted: true, loading: false });
    return true;
  }, []);

  return { ...state, recordAcceptance };
}
