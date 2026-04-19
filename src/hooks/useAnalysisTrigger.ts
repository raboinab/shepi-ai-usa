/**
 * Hook to trigger analysis edge functions and fetch their results from processed_data.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseAnalysisTriggerOptions {
  projectId: string;
  /** Edge function name, e.g. "analyze-journal-entries" */
  functionName: string;
  /** The data_type value written to processed_data by the edge function */
  resultDataType: string;
  /** Body key for project id — some functions use "projectId", others "project_id" */
  projectIdKey?: "projectId" | "project_id";
}

interface AnalysisResult {
  data: Record<string, unknown> | null;
  loading: boolean;
  running: boolean;
  analyzedAt: string | null;
  runAnalysis: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAnalysisTrigger({
  projectId,
  functionName,
  resultDataType,
  projectIdKey = "projectId",
}: UseAnalysisTriggerOptions): AnalysisResult {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("processed_data")
        .select("data, created_at")
        .eq("project_id", projectId)
        .eq("data_type", resultDataType)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && records && records.length > 0) {
        setData(records[0].data as Record<string, unknown>);
        setAnalyzedAt(records[0].created_at);
      } else {
        setData(null);
        setAnalyzedAt(null);
      }
    } catch (err) {
      console.error(`[useAnalysisTrigger] fetch ${resultDataType} error:`, err);
    } finally {
      setLoading(false);
    }
  }, [projectId, resultDataType]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const runAnalysis = useCallback(async () => {
    if (!projectId || running) return;
    setRunning(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { [projectIdKey]: projectId },
      });

      if (error) {
        toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Analysis complete", description: `${functionName} finished successfully.` });
      // Refetch from DB to get stored result
      await fetchResult();
    } catch (err) {
      toast({
        title: "Analysis error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  }, [projectId, functionName, projectIdKey, running, fetchResult]);

  return { data, loading, running, analyzedAt, runAnalysis, refetch: fetchResult };
}
