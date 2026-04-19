import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VerificationJobResult {
  status: string;
  variance: { seller_amount: number; actual_amount: number; difference: number };
  matching_transactions: unknown[];
  total_matched: number;
  match_count: number;
  summary: string | null;
  contradictions?: unknown[];
  data_gaps?: unknown[];
  methodology_audit?: unknown;
  cross_source_validation?: unknown[];
  comprehensive_accounts?: unknown[];
  auto_detected_proposal_id?: string | null;
}

const PROGRESS_LABELS: Record<number, string> = {
  0: "Job queued",
  5: "Job claimed",
  10: "Resolving discovery job",
  20: "Account hint search",
  50: "Keyword search (scanning accounts)",
  70: "AI analysis",
  85: "Cross-source validation",
  100: "Storing results",
};

export function getProgressLabel(percent: number): string {
  const thresholds = Object.keys(PROGRESS_LABELS)
    .map(Number)
    .sort((a, b) => b - a);
  for (const t of thresholds) {
    if (percent >= t) return PROGRESS_LABELS[t];
  }
  return "Job queued";
}

interface UseVerificationJobOptions {
  jobId: string | null;
  adjustmentId: string;
  projectId: string;
  onComplete?: (result: VerificationJobResult) => void;
}

export function useVerificationJob({ jobId, adjustmentId, projectId, onComplete }: UseVerificationJobOptions) {
  const [status, setStatus] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<VerificationJobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) {
      stopPolling();
      return;
    }

    completedRef.current = false;
    setStatus("queued");
    setProgressPercent(0);
    setError(null);

    const poll = async () => {
      if (completedRef.current) return;

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "poll-verification-job",
          { body: { jobId, adjustmentId, projectId } }
        );

        if (fnError) {
          console.error("[useVerificationJob] poll error:", fnError.message);
          return;
        }

        if (data?.error) {
          setError(data.error);
          setStatus("failed");
          stopPolling();
          completedRef.current = true;
          return;
        }

        setStatus(data.status);
        setProgressPercent(data.progress_percent ?? 0);

        if (data.status === "completed" && data.detector_summary) {
          completedRef.current = true;
          setResult(data.detector_summary as VerificationJobResult);
          stopPolling();
          onComplete?.(data.detector_summary as VerificationJobResult);
        } else if (data.status === "failed") {
          completedRef.current = true;
          setError(data.error_message || "Verification failed");
          stopPolling();
        }
      } catch (err) {
        console.error("[useVerificationJob] unexpected error:", err);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 8000);

    return () => stopPolling();
  }, [jobId, adjustmentId, projectId, stopPolling, onComplete]);

  return {
    status,
    progressPercent,
    result,
    error,
    isRunning: status === "queued" || status === "running",
  };
}
