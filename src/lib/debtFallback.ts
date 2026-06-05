/**
 * Helpers for converting `processed_data` rows (data_type = 'debt_schedule')
 * into the `SupplementaryDebtItem[]` shape consumed by the workbook
 * Supplementary tab + insights.
 *
 * Delegates shape detection to readNormalized() — handles both v1 envelopes
 * and legacy rows.
 */
import { supabase } from "@/integrations/supabase/client";
import { readNormalized } from "@/lib/normalized-contracts";
import type { SupplementaryDebtItem } from "@/lib/workbook-types";

/** Map a processed_data row's `data` into SupplementaryDebtItem[]. */
export function buildDebtFallbackFromProcessedData(
  record: { data?: unknown } | null | undefined,
): SupplementaryDebtItem[] {
  if (!record?.data) return [];
  const payload = readNormalized("debt_schedule", record.data);
  if (!payload) return [];
  const items: SupplementaryDebtItem[] = [];
  for (const d of payload.debts) {
    const lender = d.lender.trim();
    if (!lender) continue;
    const facilityType = d.facilityType ?? "";
    items.push({
      lender: facilityType ? `${lender} - ${facilityType}` : lender,
      balance: d.currentBalance,
      interestRate: d.interestRate ?? 0,
      maturityDate: d.maturityDate ?? "",
      type: facilityType || undefined,
    });
  }
  return items;
}

/** Fetch the most recent debt-schedule extraction for a project. */
export async function fetchLatestDebtFallback(
  projectId: string,
): Promise<SupplementaryDebtItem[]> {
  const { data, error } = await supabase
    .from("processed_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("data_type", "debt_schedule")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return [];
  return buildDebtFallbackFromProcessedData(data);
}
