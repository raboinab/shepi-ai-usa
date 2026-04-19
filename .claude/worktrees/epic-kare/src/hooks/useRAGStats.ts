import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SourceStats {
  source: string;
  source_title: string | null;
  source_license: string | null;
  count: number;
  authority_weight: number;
}

export interface RAGStats {
  totalChunks: number;
  sourceStats: SourceStats[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRAGStats(): RAGStats {
  const [totalChunks, setTotalChunks] = useState(0);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('rag_chunks')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalChunks(total || 0);

      // Get per-source stats - need to do this manually since we can't use group by
      const { data: allChunks, error: chunksError } = await supabase
        .from('rag_chunks')
        .select('source, source_title, source_license, authority_weight');

      if (chunksError) throw chunksError;

      // Aggregate by source
      const statsMap = new Map<string, SourceStats>();
      
      for (const chunk of allChunks || []) {
        const source = chunk.source || 'unknown';
        const existing = statsMap.get(source);
        
        if (existing) {
          existing.count++;
        } else {
          statsMap.set(source, {
            source,
            source_title: chunk.source_title,
            source_license: chunk.source_license,
            count: 1,
            authority_weight: chunk.authority_weight || 1.0,
          });
        }
      }

      setSourceStats(Array.from(statsMap.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      console.error('Error fetching RAG stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    totalChunks,
    sourceStats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
