/**
 * Shared hook: fetches adjustment_proofs for a project and returns
 * a keyed map (by adjustment_id) with composite proof sets, plus the raw list.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProofSummary {
  id: string;
  adjustment_id: string;
  validation_status: "validated" | "supported" | "partial" | "insufficient" | "contradictory" | "pending";
  validation_score: number | null;
  key_findings: string[];
  red_flags: string[];
  verification_type: string;
  validated_at: string | null;
  /** Enriched fields extracted from traceability_data / ai_analysis */
  summary: string | null;
  matchCount: number;
  totalMatched: number;
  contradictionCount: number;
  dataGapCount: number;
  varianceAmount: number;
  /** Raw matching GL transactions surfaced from traceability_data (for drill-down UI) */
  matchingTransactions: MatchingTxnLite[];
  sellerAmount: number;
  actualAmount: number;
}

/** Subset of a matching txn shape persisted in adjustment_proofs.traceability_data */
export interface MatchingTxnLite {
  id: string;
  date: string;
  description: string;
  amount: number;
  account_name: string;
  account_number: string;
  vendor: string;
}

/**
 * Proof set for a single adjustment — holds Discovery Service verification result.
 */
export interface AdjustmentProofSet {
  /** Data-based verification (from verify-management-adjustment, verification_type === "ai_verification") */
  verification?: ProofSummary;
  /** Best score */
  bestScore: number | null;
  /** Best status */
  bestStatus: ProofSummary["validation_status"];
}

export const PROOF_QUERY_KEY = "adjustment-proofs";

const STATUS_RANK: Record<string, number> = {
  validated: 5,
  supported: 4,
  partial: 3,
  insufficient: 2,
  contradictory: 1,
  pending: 0,
};

function pickBest(a?: ProofSummary): { bestScore: number | null; bestStatus: ProofSummary["validation_status"] } {
  if (!a) return { bestScore: null, bestStatus: "pending" };
  return { bestScore: a.validation_score, bestStatus: a.validation_status };
}

export function useAdjustmentProofs(projectId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [PROOF_QUERY_KEY, projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async (): Promise<ProofSummary[]> => {
      const { data, error } = await supabase
        .from("adjustment_proofs")
        .select("id, adjustment_id, validation_status, validation_score, key_findings, red_flags, verification_type, validated_at, traceability_data, ai_analysis")
        .eq("project_id", projectId!)
        .limit(1_000_000);

      if (error) throw error;

      return (data ?? []).map((r) => {
        const ai = (r.ai_analysis as Record<string, unknown>) ?? {};
        const td = (r.traceability_data as Record<string, unknown>) ?? {};

        const matchingTxns = (td.matching_transactions as unknown[]) ?? [];
        const contradictions = (td.contradictions as unknown[]) ?? [];
        const dataGaps = (td.data_gaps as unknown[]) ?? [];

        return {
          id: r.id,
          adjustment_id: r.adjustment_id,
          validation_status: r.validation_status as ProofSummary["validation_status"],
          validation_score: r.validation_score,
          key_findings: (r.key_findings as string[]) ?? [],
          red_flags: (r.red_flags as string[]) ?? [],
          verification_type: r.verification_type,
          validated_at: r.validated_at,
          summary: (ai.summary as string) ?? (td.summary as string) ?? null,
          matchCount: (ai.match_count as number) ?? matchingTxns.length,
          totalMatched: (ai.total_matched_amount as number) ?? 0,
          contradictionCount: (ai.contradiction_count as number) ?? contradictions.length,
          dataGapCount: (ai.data_gap_count as number) ?? dataGaps.length,
          varianceAmount: ((td.variance as Record<string, unknown>)?.difference as number) ?? 0,
          matchingTransactions: (matchingTxns as MatchingTxnLite[]) ?? [],
          sellerAmount: ((td.variance as Record<string, unknown>)?.seller_amount as number) ?? 0,
          actualAmount: ((td.variance as Record<string, unknown>)?.actual_amount as number) ?? 0,
        };
      });
    },
  });

  const proofList = data ?? [];

  // Build proof map: group by adjustment_id, keep verification result
  const proofMap = new Map<string, AdjustmentProofSet>();
  for (const p of proofList) {
    // Skip document_attachment rows (attach-only, no validation)
    if (p.verification_type === "document_attachment") continue;

    const existing = proofMap.get(p.adjustment_id) ?? {
      bestScore: null,
      bestStatus: "pending" as ProofSummary["validation_status"],
    };

    if (p.verification_type === "ai_verification") {
      // Only accept Discovery Service results — stale OpenAI rows lack traceability data
      if (p.summary === null && p.matchCount === 0 && p.totalMatched === 0) {
        continue;
      }
      existing.verification = p;
    }

    const best = pickBest(existing.verification);
    existing.bestScore = best.bestScore;
    existing.bestStatus = best.bestStatus;

    proofMap.set(p.adjustment_id, existing);
  }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [PROOF_QUERY_KEY, projectId] });

  return { proofMap, proofList, isLoading, invalidate };
}
