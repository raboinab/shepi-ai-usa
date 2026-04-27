import { useQueryClient, useQuery } from "@tanstack/react-query";
import { s as supabase } from "../main.mjs";
const PROOF_QUERY_KEY = "adjustment-proofs";
function pickBest(a) {
  if (!a) return { bestScore: null, bestStatus: "pending" };
  return { bestScore: a.validation_score, bestStatus: a.validation_status };
}
function useAdjustmentProofs(projectId) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [PROOF_QUERY_KEY, projectId],
    enabled: !!projectId,
    staleTime: 3e4,
    queryFn: async () => {
      const { data: data2, error } = await supabase.from("adjustment_proofs").select("id, adjustment_id, validation_status, validation_score, key_findings, red_flags, verification_type, validated_at, traceability_data, ai_analysis").eq("project_id", projectId).limit(1e6);
      if (error) throw error;
      return (data2 ?? []).map((r) => {
        const ai = r.ai_analysis ?? {};
        const td = r.traceability_data ?? {};
        const matchingTxns = td.matching_transactions ?? [];
        const contradictions = td.contradictions ?? [];
        const dataGaps = td.data_gaps ?? [];
        return {
          id: r.id,
          adjustment_id: r.adjustment_id,
          validation_status: r.validation_status,
          validation_score: r.validation_score,
          key_findings: r.key_findings ?? [],
          red_flags: r.red_flags ?? [],
          verification_type: r.verification_type,
          validated_at: r.validated_at,
          summary: ai.summary ?? td.summary ?? null,
          matchCount: ai.match_count ?? matchingTxns.length,
          totalMatched: ai.total_matched_amount ?? 0,
          contradictionCount: ai.contradiction_count ?? contradictions.length,
          dataGapCount: ai.data_gap_count ?? dataGaps.length,
          varianceAmount: td.variance?.difference ?? 0
        };
      });
    }
  });
  const proofList = data ?? [];
  const proofMap = /* @__PURE__ */ new Map();
  for (const p of proofList) {
    if (p.verification_type === "document_attachment") continue;
    const existing = proofMap.get(p.adjustment_id) ?? {
      bestScore: null,
      bestStatus: "pending"
    };
    if (p.verification_type === "ai_verification") {
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
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [PROOF_QUERY_KEY, projectId] });
  return { proofMap, proofList, isLoading, invalidate };
}
export {
  useAdjustmentProofs as u
};
