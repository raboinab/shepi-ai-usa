/**
 * Helpers for converting `processed_data` rows (data_type = 'debt_schedule')
 * into the `SupplementaryDebtItem[]` shape consumed by the workbook
 * Supplementary tab + insights.
 *
 * Mirrors payrollFallback / fixedAssetsFallback. Used by
 * loadDealDataWithPriorBalances so an uploaded debt schedule flows into the
 * workbook automatically when the wizard's Supplementary section is empty.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupplementaryDebtItem } from "@/lib/workbook-types";

/** Map a processed_data row's `data.debts[]` into SupplementaryDebtItem[]. */
export function buildDebtFallbackFromProcessedData(
  record: { data?: unknown } | null | undefined
): SupplementaryDebtItem[] {
  const data = record?.data as Record<string, unknown> | undefined;
  if (!data) return [];
  const raw = Array.isArray(data.debts) ? (data.debts as Record<string, unknown>[]) : [];
  const items: SupplementaryDebtItem[] = [];
  for (const d of raw) {
    const lender = String(d.lender || "").trim();
    if (!lender) continue;
    const facilityType = d.facilityType ? String(d.facilityType) : "";
    items.push({
      lender: facilityType ? `${lender} - ${facilityType}` : lender,
      balance: Number(d.currentBalance ?? d.balance ?? 0),
      interestRate: Number(d.interestRate ?? 0),
      maturityDate: d.maturityDate ? String(d.maturityDate) : "",
      type: facilityType || undefined,
    });
  }
  return items;
}

/** Fetch the most recent debt-schedule extraction for a project. */
export async function fetchLatestDebtFallback(
  projectId: string
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
