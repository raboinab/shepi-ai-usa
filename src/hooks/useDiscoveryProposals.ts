import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { QoeLedgerAdjustment } from "@/types/qoeLedger";
import type { LedgerIntent, AdjustmentClass, QoeAdjustmentType } from "@/lib/qoeAdjustmentTaxonomy";

// ── Types ──

export interface AnalysisJob {
  id: string;
  project_id: string;
  user_id: string;
  job_type: string;
  status: "queued" | "running" | "completed" | "failed" | "partial" | "cancelled";
  config_json: Record<string, any>;
  source_summary: Record<string, any>;
  progress_percent: number;
  detector_summary: Record<string, any>;
  error_message: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface BridgeSummary {
  addBacksTotal: number;
  haircutsTotal: number;
  netEbitdaImpact: number;
  flagCount: number;
}

// ... keep existing code

export interface AdjustmentProposal {
  id: string;
  job_id: string;
  project_id: string;
  user_id: string;
  master_proposal_id: string | null;
  detector_type: string;
  detector_run_id: string | null;
  title: string;
  description: string;
  block: QoeAdjustmentType;
  adjustment_class: string;
  intent: string;
  template_id: string | null;
  linked_account_number: string | null;
  linked_account_name: string | null;
  proposed_amount: number | null;
  proposed_period_values: Record<string, number>;
  allocation_mode: string;
  period_range: { start: string; end: string } | null;
  evidence_strength: "strong" | "moderate" | "weak";
  review_priority: "critical" | "high" | "normal" | "low";
  internal_score: number;
  support_json: Record<string, any>;
  ai_rationale: string | null;
  ai_key_signals: string[];
  ai_warnings: string[];
  ai_model: string | null;
  status: string;
  reviewer_user_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  edited_amount: number | null;
  edited_period_values: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalEvidence {
  id: string;
  proposal_id: string;
  canonical_txn_id: string | null;
  source_type: string;
  source_txn_id: string | null;
  txn_date: string | null;
  description: string | null;
  vendor: string | null;
  amount: number | null;
  account_number: string | null;
  account_name: string | null;
  match_quality: "strong" | "moderate" | "weak";
  reason: string | null;
  raw_reference: Record<string, any>;
  created_at: string;
}

export interface ProposalFilters {
  status?: string;
  strength?: string;
  detector_type?: string;
}

// ── Converter ──

export function proposalToLedgerAdjustment(p: AdjustmentProposal): QoeLedgerAdjustment {
  const periodValues = p.edited_period_values ?? p.proposed_period_values ?? {};

  return {
    id: crypto.randomUUID(),
    block: (p.block as QoeAdjustmentType) || "DD",
    effectType: "EBITDA",
    adjustmentClass: (p.adjustment_class as AdjustmentClass) || "nonrecurring",
    intent: (p.intent as LedgerIntent) || "remove_expense",
    linkedAccountNumber: p.linked_account_number ?? "",
    linkedAccountName: p.linked_account_name ?? undefined,
    description: p.title,
    evidenceNotes: p.ai_rationale ?? p.description,
    periodValues,
    sourceType: "ai",
    templateId: p.template_id ?? undefined,
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
}

// ── Bridge summary extractor ──

function extractBridgeSummary(detectorSummary: Record<string, any> | undefined): BridgeSummary | null {
  if (!detectorSummary) return null;
  // Backend nests under ebitda_bridge; fall back to top-level for backward compat
  const bridge = detectorSummary.ebitda_bridge ?? detectorSummary;
  if (bridge.add_backs_total == null) return null;
  return {
    addBacksTotal: bridge.add_backs_total,
    haircutsTotal: bridge.haircuts_total,
    netEbitdaImpact: bridge.net_ebitda_impact,
    flagCount: bridge.flag_count ?? 0,
  };
}

// ── Constants ──
const STALE_JOB_MINUTES = 15;
const POLL_INTERVAL_MS = 15_000;

// ── Hook ──

export function useDiscoveryProposals(projectId: string | undefined) {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [proposals, setProposals] = useState<AdjustmentProposal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasDiscoveryJobs, setHasDiscoveryJobs] = useState<boolean | null>(null);
  const [staleWarning, setStaleWarning] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const inflightRef = useRef(false);
  const lastFetchedProgressRef = useRef<number>(0);

  // Derive bridge summary from job
  const bridgeSummary = extractBridgeSummary(job?.detector_summary);

  // ... keep existing code (clearDiscoveryState, isJobStale, fetchProposals, checkForExistingJobs, effects, runDiscovery, getProposalDetail, acceptProposal, rejectProposal, deferProposal)

  const clearDiscoveryState = useCallback(() => {
    jobIdRef.current = null;
    setJob(null);
    setProposals([]);
    setIsRunning(false);
    setProgressPercent(0);
    setError(null);
    setStaleWarning(null);
    lastFetchedProgressRef.current = 0;
  }, []);

  const isJobStale = useCallback((jobData: AnalysisJob): boolean => {
    if (jobData.status !== "running" && jobData.status !== "queued") return false;
    const startedAt = jobData.started_at ?? jobData.requested_at;
    if (!startedAt) return false;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return elapsed > STALE_JOB_MINUTES * 60 * 1000;
  }, []);

  const fetchProposals = useCallback(
    async (filters?: ProposalFilters) => {
      if (!projectId) {
        setProposals([]);
        return;
      }

      let query = supabase
        .from("adjustment_proposals" as any)
        .select("*")
        .eq("project_id", projectId)
        .neq("status", "duplicate")
        .order("internal_score", { ascending: false })
        .limit(1000000);

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.strength) query = query.eq("evidence_strength", filters.strength);
      if (filters?.detector_type) query = query.eq("detector_type", filters.detector_type);

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.error("Failed to fetch proposals:", fetchErr);
        return;
      }

      setProposals((data as any[]) ?? []);
    },
    [projectId]
  );

  const checkForExistingJobs = useCallback(async () => {
    if (!projectId) {
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }

    const { data, error: err } = await supabase
      .from("analysis_jobs" as any)
      .select("*")
      .eq("project_id", projectId)
      .order("requested_at", { ascending: false })
      .limit(1);

    if (err) {
      console.error("Failed to check discovery jobs:", err);
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }

    const jobs = ((data ?? []) as unknown) as AnalysisJob[];
    if (jobs.length === 0) {
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }

    const latestJob = jobs[0];
    const running = latestJob.status === "queued" || latestJob.status === "running";

    if (running && isJobStale(latestJob)) {
      setHasDiscoveryJobs(true);
      setJob(latestJob);
      setIsRunning(false);
      setProgressPercent(latestJob.progress_percent ?? 0);
      setStaleWarning("Analysis may have stalled — showing available results");
      setError(null);
      jobIdRef.current = null;
      void fetchProposals();
      return;
    }

    setHasDiscoveryJobs(true);
    setJob(latestJob);
    setIsRunning(running);
    setProgressPercent(latestJob.progress_percent ?? 0);
    setStaleWarning(null);
    if (running || latestJob.status === "completed" || latestJob.status === "partial") {
      setError(null);
    } else {
      setError(latestJob.status === "failed" ? latestJob.error_message || "Analysis failed" : null);
    }
    jobIdRef.current = running ? latestJob.id : null;
  }, [clearDiscoveryState, projectId, isJobStale, fetchProposals]);

  useEffect(() => {
    void checkForExistingJobs();
    void fetchProposals();
  }, [checkForExistingJobs, fetchProposals]);

  useEffect(() => {
    if (!projectId) return;

    const refreshDiscoveryState = () => {
      void checkForExistingJobs();
      void fetchProposals();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDiscoveryState();
      }
    };

    const intervalId = window.setInterval(refreshDiscoveryState, POLL_INTERVAL_MS);

    window.addEventListener("focus", refreshDiscoveryState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDiscoveryState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForExistingJobs, fetchProposals, projectId]);

  useEffect(() => {
    const currentJobId = jobIdRef.current;
    if (!currentJobId) return;

    const channel = supabase
      .channel(`discovery-job-${currentJobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analysis_jobs",
          filter: `id=eq.${currentJobId}`,
        },
        (payload) => {
          const updated = payload.new as AnalysisJob;
          const running = updated.status === "queued" || updated.status === "running";

          setJob(updated);
          setProgressPercent(updated.progress_percent);
          setIsRunning(running);
          setError(updated.status === "failed" ? updated.error_message || "Analysis failed" : null);
          jobIdRef.current = running ? updated.id : null;

          if (!running) inflightRef.current = false;

          if (updated.status === "completed" || updated.status === "partial") {
            void fetchProposals();
          } else if (running && updated.progress_percent >= lastFetchedProgressRef.current + 10) {
            lastFetchedProgressRef.current = updated.progress_percent;
            void fetchProposals();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProposals, job?.id, job?.status]);

  const runDiscovery = useCallback(async () => {
    if (!projectId || inflightRef.current || isRunning) return;
    inflightRef.current = true;
    setError(null);
    setIsRunning(true);
    setProgressPercent(0);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "trigger-discovery",
        { body: { project_id: projectId } }
      );

      if (invokeError) {
        setError(invokeError.message);
        setIsRunning(false);
        inflightRef.current = false;
        return;
      }

      const jobId = data?.job_id;
      const alreadyRunning = data?.status === "already_running";

      if (jobId) {
        jobIdRef.current = jobId;
        setJob({ id: jobId, status: alreadyRunning ? "running" : "queued", progress_percent: 0 } as AnalysisJob);
        setHasDiscoveryJobs(true);
        setError(null);
        if (alreadyRunning) {
          inflightRef.current = false;
          void checkForExistingJobs();
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to start discovery");
      setIsRunning(false);
      inflightRef.current = false;
    }
  }, [projectId, isRunning, checkForExistingJobs]);

  const getProposalDetail = useCallback(
    async (proposalId: string) => {
      const [proposalRes, evidenceRes] = await Promise.all([
        supabase
          .from("adjustment_proposals" as any)
          .select("*")
          .eq("id", proposalId)
          .single(),
        supabase
          .from("proposal_evidence" as any)
          .select("*")
          .eq("proposal_id", proposalId)
          .limit(1000000),
      ]);

      return {
        proposal: proposalRes.data as unknown as AdjustmentProposal | null,
        evidence: ((evidenceRes.data as unknown) as ProposalEvidence[]) ?? [],
      };
    },
    []
  );

  const acceptProposal = useCallback(
    async (
      proposalId: string,
      edits?: {
        edited_amount?: number;
        edited_period_values?: Record<string, number>;
        reviewer_notes?: string;
      }
    ): Promise<QoeLedgerAdjustment | null> => {
      const now = new Date().toISOString();
      const user = (await supabase.auth.getUser()).data.user;

      const updateData: Record<string, any> = {
        status:
          edits?.edited_amount != null || edits?.edited_period_values
            ? "accepted_with_edits"
            : "accepted",
        reviewer_user_id: user?.id,
        reviewer_notes: edits?.reviewer_notes ?? null,
        reviewed_at: now,
        updated_at: now,
      };

      if (edits?.edited_amount != null) updateData.edited_amount = edits.edited_amount;
      if (edits?.edited_period_values) updateData.edited_period_values = edits.edited_period_values;

      const { data: updated, error: updateErr } = await supabase
        .from("adjustment_proposals" as any)
        .update(updateData)
        .eq("id", proposalId)
        .select()
        .single();

      if (updateErr || !updated) {
        console.error("Failed to accept proposal:", updateErr);
        return null;
      }

      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? (updated as unknown as AdjustmentProposal) : p))
      );

      return proposalToLedgerAdjustment(updated as unknown as AdjustmentProposal);
    },
    []
  );

  const rejectProposal = useCallback(
    async (proposalId: string, notes?: string) => {
      const now = new Date().toISOString();
      const user = (await supabase.auth.getUser()).data.user;

      await supabase
        .from("adjustment_proposals" as any)
        .update({
          status: "rejected",
          reviewer_user_id: user?.id,
          reviewer_notes: notes ?? null,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", proposalId);

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId ? { ...p, status: "rejected", reviewer_notes: notes ?? null } : p
        )
      );
    },
    []
  );

  const deferProposal = useCallback(async (proposalId: string) => {
    const now = new Date().toISOString();
    await supabase
      .from("adjustment_proposals" as any)
      .update({ status: "deferred", updated_at: now })
      .eq("id", proposalId);

    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: "deferred" } : p))
    );
  }, []);

  return {
    job,
    proposals,
    isRunning,
    progressPercent,
    error,
    staleWarning,
    hasDiscoveryJobs,
    bridgeSummary,
    runDiscovery,
    fetchProposals,
    getProposalDetail,
    acceptProposal,
    rejectProposal,
    deferProposal,
  };
}
