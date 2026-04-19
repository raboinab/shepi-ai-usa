/**
 * Derives prior-period ending balances for BS accounts using:
 *   Prior Balance = TB Ending Balance − Net GL Activity
 *
 * This lets NWC, FCF, and Proof of Cash tabs compute accurate
 * first-period deltas without requiring a prior-month Trial Balance upload.
 */
import { supabase } from "@/integrations/supabase/client";
import type { TrialBalanceEntry, PeriodDef } from "./workbook-types";

export async function derivePriorBalances(
  projectId: string,
  trialBalance: TrialBalanceEntry[],
  periods: PeriodDef[]
): Promise<Record<string, number>> {
  if (!projectId || trialBalance.length === 0 || periods.length === 0) {
    return {};
  }

  const firstPeriod = periods[0];
  const firstPeriodId = firstPeriod.id;
  const postingPeriod = `${firstPeriod.year}-${String(firstPeriod.month).padStart(2, "0")}`;

  // Fetch GL activity for the first period grouped by account_number
  const { data: txns } = await supabase
    .from("canonical_transactions")
    .select("account_number, amount_signed")
    .eq("project_id", projectId)
    .eq("posting_period", postingPeriod)
    .in("source_type", ["general_ledger", "journal_entries"]);

  if (!txns || txns.length === 0) return {};

  // Sum GL activity by account_number
  const activityByAccount: Record<string, number> = {};
  for (const t of txns) {
    if (!t.account_number) continue;
    activityByAccount[t.account_number] =
      (activityByAccount[t.account_number] || 0) + (t.amount_signed || 0);
  }

  // Derive prior balances: for each BS TB entry, prior = TB ending − GL activity
  const derived: Record<string, number> = {};
  for (const entry of trialBalance) {
    if (entry.fsType !== "BS") continue;
    const endingBalance = entry.balances[firstPeriodId] ?? 0;
    const glActivity = activityByAccount[entry.accountId] ?? 0;
    derived[entry.accountId] = endingBalance - glActivity;
  }

  return derived;
}
