/**
 * Fetches the most recent Fixed Asset Register extraction from `processed_data`
 * and maps it into the `FixedAssetEntry[]` shape consumed by the workbook,
 * PDF, and XLSX export.
 *
 * Used by `loadDealDataWithPriorBalances` so uploads flow into the workbook
 * automatically when the user hasn't clicked "Import" in the wizard yet.
 */
import { supabase } from "@/integrations/supabase/client";
import type { FixedAssetEntry } from "@/lib/workbook-types";

function mapAssets(raw: unknown): FixedAssetEntry[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.assets)
      ? ((raw as Record<string, unknown>).assets as unknown[])
      : null;
  if (!arr) return [];
  return arr.map((a) => {
    const fa = a as Record<string, unknown>;
    const cost = Number(fa.cost || fa.originalCost || 0);
    const accumulatedDepreciation = Number(
      fa.accumulatedDepreciation || fa.accumDepreciation || fa.accumDepr || 0
    );
    const nbvRaw = fa.netBookValue ?? fa.nbv;
    const netBookValue = nbvRaw !== undefined ? Number(nbvRaw) : cost - accumulatedDepreciation;
    return {
      category: String(fa.category || ""),
      description: String(fa.description || fa.name || ""),
      acquisitionDate: String(fa.acquisitionDate || fa.dateAcquired || ""),
      cost,
      accumulatedDepreciation,
      netBookValue,
    };
  });
}

export async function fetchLatestFixedAssetsFallback(
  projectId: string
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
  const extracted = (data.data as Record<string, unknown> | null)?.extractedData;
  return mapAssets(extracted);
}
