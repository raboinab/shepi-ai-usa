/**
 * Helpers for converting `processed_data` rows (data_type = 'payroll')
 * into the `PayrollFallbackData` shape consumed by the workbook payroll grid.
 *
 * Used by useProjectDealData (live merge) and ExportCenterSection (build-time merge).
 */
import { supabase } from "@/integrations/supabase/client";
import type { PayrollFallbackData } from "@/lib/workbook-types";

type Item = { name: string; monthlyValues: Record<string, number> };

/** Map a processed_data row's `data.extractedData` into PayrollFallbackData. */
export function buildPayrollFallbackFromProcessedData(
  record: { data?: unknown } | null | undefined
): PayrollFallbackData | null {
  const data = record?.data as Record<string, unknown> | undefined;
  const extracted = data?.extractedData as Record<string, unknown> | undefined;
  if (!extracted) return null;

  const fb: PayrollFallbackData = {
    salaryWages: (extracted.salaryWages as Item[]) || [],
    ownerCompensation: (extracted.ownerCompensation as Item[]) || [],
    payrollTaxes: (extracted.payrollTaxes as Item[]) || [],
    benefits: (extracted.benefits as Item[]) || [],
  };

  const hasAny =
    fb.salaryWages.length +
      fb.ownerCompensation.length +
      fb.payrollTaxes.length +
      fb.benefits.length >
    0;
  return hasAny ? fb : null;
}

/** Fetch the most recent payroll extraction for a project and return its fallback shape. */
export async function fetchLatestPayrollFallback(
  projectId: string
): Promise<PayrollFallbackData | null> {
  const { data, error } = await supabase
    .from("processed_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("data_type", "payroll")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return buildPayrollFallbackFromProcessedData(data);
}
