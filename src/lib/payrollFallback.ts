/**
 * Helpers for converting `processed_data` rows (data_type = 'payroll')
 * into the `PayrollFallbackData` shape consumed by the workbook payroll grid.
 *
 * Delegates shape detection to readNormalized() — handles both v1 envelopes
 * and legacy rows.
 */
import { supabase } from "@/integrations/supabase/client";
import { readNormalized } from "@/lib/normalized-contracts";
import type { PayrollFallbackData } from "@/lib/workbook-types";

/** Map a processed_data row's `data` into PayrollFallbackData. */
export function buildPayrollFallbackFromProcessedData(
  record: { data?: unknown } | null | undefined,
): PayrollFallbackData | null {
  if (!record?.data) return null;
  const payload = readNormalized("payroll", record.data);
  if (!payload) return null;

  const fb: PayrollFallbackData = {
    salaryWages: payload.salaryWages,
    ownerCompensation: payload.ownerCompensation,
    payrollTaxes: payload.payrollTaxes,
    benefits: payload.benefits,
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
  projectId: string,
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
