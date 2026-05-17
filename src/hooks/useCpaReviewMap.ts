import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CpaReviewDecision = "confirmed" | "modified" | "rejected";

export interface CpaReviewEntry {
  decision: CpaReviewDecision;
  cpa_note: string | null;
  modified_amount: number | null;
  reviewed_at: string;
  cpa_full_name: string | null;
}

/**
 * Returns a map keyed by proposal_id of the most recent CPA review for each
 * AI-flagged adjustment on a project. Returns an empty map for projects with
 * no (non-withdrawn) cpa_claims row.
 */
export function useCpaReviewMap(projectId: string | undefined) {
  return useQuery({
    queryKey: ["cpa-review-map", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Record<string, CpaReviewEntry>> => {
      if (!projectId) return {};
      const { data: reviews, error } = await supabase
        .from("cpa_adjustment_reviews")
        .select(
          "proposal_id, decision, cpa_note, modified_amount, reviewed_at, cpa_user_id"
        )
        .eq("project_id", projectId)
        .order("reviewed_at", { ascending: false });
      if (error) throw error;
      if (!reviews || reviews.length === 0) return {};

      const cpaIds = Array.from(new Set(reviews.map((r) => r.cpa_user_id)));
      const { data: profiles } = await supabase
        .from("cpa_profiles")
        .select("user_id, full_name")
        .in("user_id", cpaIds);
      const nameMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.full_name as string]),
      );

      const map: Record<string, CpaReviewEntry> = {};
      for (const r of reviews) {
        // first-write-wins because reviews are sorted desc
        if (map[r.proposal_id]) continue;
        map[r.proposal_id] = {
          decision: r.decision as CpaReviewDecision,
          cpa_note: r.cpa_note,
          modified_amount: r.modified_amount as number | null,
          reviewed_at: r.reviewed_at,
          cpa_full_name: nameMap.get(r.cpa_user_id) ?? null,
        };
      }
      return map;
    },
    staleTime: 30_000,
  });
}
