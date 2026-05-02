import { computeSign } from "@/lib/qoeAdjustmentTaxonomy";
import type { LedgerIntent } from "@/lib/qoeAdjustmentTaxonomy";

/**
 * Compute the signed EBITDA-impact total for a wizard-data adjustment.
 * `periodValues` are stored as unsigned magnitudes; the direction comes from `intent`.
 *
 * NonQoE / PresentationOnly adjustments do NOT impact Adjusted EBITDA — callers
 * that show EBITDA-bridge or Adjusted-EBITDA totals must skip them. Pass
 * `{ excludeNonQoE: true }` and this helper returns 0 for those rows so callers
 * can sum across a list without re-checking the flag.
 */
export function signedAdjustmentTotal(
  adj: {
    periodValues?: Record<string, number>;
    amount?: number;
    intent?: string;
    effectType?: string;
  },
  opts: { excludeNonQoE?: boolean } = {}
): number {
  if (opts.excludeNonQoE && (adj.effectType === "NonQoE" || adj.effectType === "PresentationOnly")) {
    return 0;
  }
  const sign = computeSign((adj.intent as LedgerIntent) || "remove_expense");
  const raw = adj.periodValues
    ? Object.values(adj.periodValues).reduce((s, v) => s + (Number(v) || 0), 0)
    : (adj.amount || 0);
  return raw * sign;
}
