/**
 * Adjustment sign utilities (server-side copy)
 * Mirrors src/lib/adjustmentSignUtils.ts — keep in sync.
 */
import { computeSign } from "./qoeAdjustmentTaxonomy.ts";
import type { LedgerIntent } from "./qoeAdjustmentTaxonomy.ts";

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
