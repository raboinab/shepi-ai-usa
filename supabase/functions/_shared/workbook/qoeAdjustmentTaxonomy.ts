/**
 * QoE Adjustment Taxonomy (server-side copy)
 * Mirrors src/lib/qoeAdjustmentTaxonomy.ts — keep in sync.
 */

export type LedgerEffectType = "EBITDA" | "PresentationOnly" | "NonQoE";
export type QoeAdjustmentType = "MA" | "DD" | "PF";
export type QoeBlockType = QoeAdjustmentType | "RECLASS";

export type AdjustmentClass =
  | "timing"
  | "policy"
  | "nonrecurring"
  | "normalization"
  | "proforma"
  | "reclassification";

export type LedgerIntent =
  | "remove_expense"
  | "remove_revenue"
  | "add_expense"
  | "add_revenue"
  | "normalize_up_expense"
  | "normalize_down_expense"
  | "other";

export const INTENT_TO_SIGN: Record<LedgerIntent, 1 | -1 | 0> = {
  remove_expense: 1,
  remove_revenue: -1,
  add_expense: -1,
  add_revenue: 1,
  normalize_up_expense: -1,
  normalize_down_expense: 1,
  other: 0,
};

export function computeSign(intent: LedgerIntent): number {
  const sign = INTENT_TO_SIGN[intent];
  return sign === 0 ? 1 : sign;
}
