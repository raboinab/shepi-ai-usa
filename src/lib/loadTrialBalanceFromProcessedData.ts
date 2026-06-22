/**
 * Shared helper: loads trial balance accounts from processed_data table.
 * Used by both the Wizard TrialBalanceSection and the Workbook page
 * when wizard_data.trialBalance is empty/missing.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  TrialBalanceAccount,
  transformQbTrialBalanceData,
  mergeAccounts,
  crossReferenceWithCOA,
} from "./trialBalanceUtils";
import type { CoaAccount } from "./chartOfAccountsUtils";
import type { Period } from "./periodUtils";

export async function loadTrialBalanceFromProcessedData(
  projectId: string,
  periods: Period[],
  coaAccounts?: CoaAccount[],
  opts?: { forceCoaRebuild?: boolean }
): Promise<TrialBalanceAccount[]> {
  const regularPeriods = periods.filter(p => !p.isStub);
  if (regularPeriods.length === 0) return [];

  const { data: records, error } = await supabase
    .from("processed_data")
    .select("*")
    .eq("project_id", projectId)
    .eq("data_type", "trial_balance")
    .order("period_start", { ascending: true })
    .limit(1000000);

  if (error || !records || records.length === 0) return [];

  let mergedAccounts: TrialBalanceAccount[] = [];

  for (const record of records) {
    if (!record?.data) continue;
    const raw = record.data as Record<string, unknown>;

    // If data has monthlyReports but no top-level rows, hoist rows from single entry
    // so the single-report path also works as a fallback
    if (
      !raw.rows &&
      Array.isArray(raw.monthlyReports) &&
      raw.monthlyReports.length === 1 &&
      (raw.monthlyReports[0] as any)?.report?.rows
    ) {
      raw.rows = (raw.monthlyReports[0] as any).report.rows;
    }

    const dataWithDate = {
      ...raw,
      reportDate: record.period_end || record.period_start,
    };
    const newAccounts = transformQbTrialBalanceData(dataWithDate as any, periods);
    if (newAccounts.length > 0) {
      mergedAccounts = mergeAccounts(mergedAccounts, newAccounts);
    }
  }

  // Apply COA cross-referencing. The "_matchedFromCOA already true" short
  // circuit can be stale after a prior AI run that misclassified rows as
  // BS-only; forceCoaRebuild strips the flag and re-applies COA fsType.
  const shouldReapply =
    opts?.forceCoaRebuild === true ||
    !mergedAccounts.every((acc) => (acc as any)._matchedFromCOA === true);
  if (shouldReapply && coaAccounts && coaAccounts.length > 0 && mergedAccounts.length > 0) {
    if (opts?.forceCoaRebuild) {
      mergedAccounts = mergedAccounts.map((a) => {
        const { _matchedFromCOA: _drop, ...rest } = a as any;
        return rest as TrialBalanceAccount;
      });
    }
    const { accounts: enriched } = crossReferenceWithCOA(mergedAccounts, coaAccounts);
    mergedAccounts = enriched;
  }

  return mergedAccounts;
}

/**
 * Detect whether a cached trial balance has incomplete period coverage.
 * Returns true when the cache is stale/partial and should be rebuilt.
 */
export function isTBCacheIncomplete(
  accounts: { monthlyValues?: Record<string, number> }[],
  periods: Period[]
): boolean {
  if (!accounts || accounts.length === 0) return true;

  const regularPeriods = periods.filter(p => !p.isStub);
  if (regularPeriods.length === 0) return false;

  // Collect all period IDs that have at least one non-zero value
  const populatedPeriods = new Set<string>();
  for (const acc of accounts) {
    for (const [pid, val] of Object.entries(acc.monthlyValues || {})) {
      if (val !== 0) populatedPeriods.add(pid);
    }
  }

  // If less than half the configured periods are covered, treat as incomplete
  const coverageRatio = populatedPeriods.size / regularPeriods.length;
  return coverageRatio < 0.5;
}
