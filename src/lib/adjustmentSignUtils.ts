import { computeSign } from "@/lib/qoeAdjustmentTaxonomy";
import type { LedgerIntent } from "@/lib/qoeAdjustmentTaxonomy";

/**
 * Compute the signed EBITDA-impact total for a wizard-data adjustment.
 * periodValues are stored as unsigned magnitudes; the direction comes from `intent`.
 */
export function signedAdjustmentTotal(adj: {
  periodValues?: Record<string, number>;
  amount?: number;
  intent?: string;
}): number {
  const sign = computeSign((adj.intent as LedgerIntent) || "remove_expense");
  const raw = adj.periodValues
    ? Object.values(adj.periodValues).reduce((s, v) => s + (Number(v) || 0), 0)
    : (adj.amount || 0);
  return raw * sign;
}
