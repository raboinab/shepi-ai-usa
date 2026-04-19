/**
 * Shared module: Fetch bank statement data and transfer classifications
 * for Proof of Cash reconciliation. Used by both Excel and PDF exports.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ProofOfCashBankData } from "./workbook-grid-builders";

export async function fetchProofOfCashBankData(projectId: string): Promise<ProofOfCashBankData | undefined> {
  try {
    // Fetch bank statements (same query as useProofOfCashData)
    const { data: processedData, error: bankError } = await supabase
      .from("processed_data")
      .select("id, period_start, period_end, data")
      .eq("project_id", projectId)
      .eq("data_type", "bank_transactions")
      .order("period_start", { ascending: true })
      .limit(1000000);

    if (bankError) {
      console.warn("Failed to fetch bank statements for PoC export:", bankError);
      return undefined;
    }

    const bankByPeriod = new Map<string, { openingBalance: number; closingBalance: number; totalCredits: number; totalDebits: number }>();
    for (const item of processedData || []) {
      if (!item.period_start) continue;
      const key = item.period_start.substring(0, 7);
      const data = item.data as Record<string, unknown> || {};
      const summary = (data.summary as { openingBalance?: number; closingBalance?: number; totalCredits?: number; totalDebits?: number }) || {};
      const existing = bankByPeriod.get(key);
      if (existing) {
        existing.openingBalance += summary.openingBalance ?? 0;
        existing.closingBalance += summary.closingBalance ?? 0;
        existing.totalCredits += summary.totalCredits ?? 0;
        existing.totalDebits += summary.totalDebits ?? 0;
      } else {
        bankByPeriod.set(key, {
          openingBalance: summary.openingBalance ?? 0,
          closingBalance: summary.closingBalance ?? 0,
          totalCredits: summary.totalCredits ?? 0,
          totalDebits: summary.totalDebits ?? 0,
        });
      }
    }

    // Fetch transfer classifications
    const { data: classData, error: classError } = await supabase
      .from("processed_data")
      .select("data")
      .eq("project_id", projectId)
      .eq("data_type", "transfer_classification")
      .maybeSingle();

    let classifications: ProofOfCashBankData["classifications"] = null;
    if (!classError && classData?.data) {
      const rawClassData = classData.data as Record<string, { interbank?: number; owner?: number; transactions?: { category?: string; amount?: number }[] }>;
      const map = new Map<string, { interbank: number; interbankIn: number; interbankOut: number; owner: number; debt_service: number; capex: number; tax_payments: number }>();
      for (const [period, periodData] of Object.entries(rawClassData)) {
        if (period.startsWith("_")) continue;
        // Split interbank by transaction sign
        let interbankIn = 0;
        let interbankOut = 0;
        const txns = Array.isArray(periodData?.transactions) ? periodData.transactions : [];
        for (const txn of txns) {
          if (txn.category === "interbank") {
            const amt = txn.amount ?? 0;
            if (amt > 0) interbankIn += amt;
            else interbankOut += Math.abs(amt);
          }
        }
        map.set(period, {
          interbank: periodData?.interbank ?? 0,
          interbankIn,
          interbankOut,
          owner: periodData?.owner ?? 0,
          debt_service: 0,
          capex: 0,
          tax_payments: 0,
        });
      }
      if (map.size > 0) classifications = map;
    }

    if (bankByPeriod.size === 0 && !classifications) return undefined;

    return { bankByPeriod, classifications };
  } catch (err) {
    console.warn("Failed to fetch PoC bank data:", err);
    return undefined;
  }
}
