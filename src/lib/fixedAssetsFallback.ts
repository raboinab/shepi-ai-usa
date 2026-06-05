/**
 * Fetches the most recent Fixed Asset Register extraction from `processed_data`
 * and maps it into the `FixedAssetEntry[]` shape consumed by the workbook,
 * PDF, and XLSX export.
 *
 * Delegates shape detection to readNormalized() — handles both v1 envelopes
 * (written by process-fixed-assets via normalizeAndPersist) and legacy rows.
 */
import { supabase } from "@/integrations/supabase/client";
import { readNormalized } from "@/lib/normalized-contracts";
import type { FixedAssetEntry } from "@/lib/workbook-types";

/** Map a processed_data row's `data` into FixedAssetEntry[]. */
export function buildFixedAssetsFallbackFromProcessedData(
  record: { data?: unknown } | null | undefined,
): FixedAssetEntry[] {
  if (!record?.data) return [];
  const payload = readNormalized("fixed_assets", record.data);
  if (!payload) return [];
  return payload.assets.map((a) => ({
    category: a.category,
    description: a.description,
    acquisitionDate: a.acquisitionDate ?? "",
    cost: a.cost,
    accumulatedDepreciation: a.accumulatedDepreciation,
    netBookValue: a.netBookValue,
  }));
}

export async function fetchLatestFixedAssetsFallback(
  projectId: string,
): Promise<FixedAssetEntry[]> {
  const { data, error } = await supabase
    .from("processed_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("data_type", "fixed_assets")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return [];
  return buildFixedAssetsFallbackFromProcessedData(data);
}
