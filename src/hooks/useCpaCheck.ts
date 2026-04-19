import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function useCpaCheck() {
  const [isCpa, setIsCpa] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCpa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'cpa'
      });

      if (error || !data) {
        navigate('/dashboard');
        return;
      }

      setIsCpa(true);
      setIsLoading(false);
    };

    checkCpa();
  }, [navigate]);

  return { isCpa, isLoading };
}
