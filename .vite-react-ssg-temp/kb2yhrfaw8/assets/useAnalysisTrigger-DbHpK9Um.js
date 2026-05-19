import { useState, useCallback, useEffect } from "react";
import { s as supabase, t as toast } from "../main.mjs";
function useAnalysisTrigger({
  projectId,
  functionName,
  resultDataType,
  projectIdKey = "projectId"
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const fetchResult = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data: records, error } = await supabase.from("processed_data").select("data, created_at").eq("project_id", projectId).eq("data_type", resultDataType).order("created_at", { ascending: false }).limit(1);
      if (!error && records && records.length > 0) {
        setData(records[0].data);
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
        body: { [projectIdKey]: projectId }
      });
      if (error) {
        toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Analysis complete", description: `${functionName} finished successfully.` });
      await fetchResult();
    } catch (err) {
      toast({
        title: "Analysis error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setRunning(false);
    }
  }, [projectId, functionName, projectIdKey, running, fetchResult]);
  return { data, loading, running, analyzedAt, runAnalysis, refetch: fetchResult };
}
export {
  useAnalysisTrigger as u
};
