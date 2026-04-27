import { s as supabase } from "../main.mjs";
import { t as transformQbTrialBalanceData, m as mergeAccounts, c as crossReferenceWithCOA } from "./trialBalanceUtils-BTe9uefW.js";
async function loadTrialBalanceFromProcessedData(projectId, periods, coaAccounts) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (regularPeriods.length === 0) return [];
  const { data: records, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "trial_balance").order("period_start", { ascending: true }).limit(1e6);
  if (error || !records || records.length === 0) return [];
  let mergedAccounts = [];
  for (const record of records) {
    if (!record?.data) continue;
    const raw = record.data;
    if (!raw.rows && Array.isArray(raw.monthlyReports) && raw.monthlyReports.length === 1 && raw.monthlyReports[0]?.report?.rows) {
      raw.rows = raw.monthlyReports[0].report.rows;
    }
    const dataWithDate = {
      ...raw,
      reportDate: record.period_end || record.period_start
    };
    const newAccounts = transformQbTrialBalanceData(dataWithDate, periods);
    if (newAccounts.length > 0) {
      mergedAccounts = mergeAccounts(mergedAccounts, newAccounts);
    }
  }
  const allMatched = mergedAccounts.every(
    (acc) => acc._matchedFromCOA === true
  );
  if (!allMatched && coaAccounts && coaAccounts.length > 0 && mergedAccounts.length > 0) {
    const { accounts: enriched } = crossReferenceWithCOA(mergedAccounts, coaAccounts);
    mergedAccounts = enriched;
  }
  return mergedAccounts;
}
function isTBCacheIncomplete(accounts, periods) {
  if (!accounts || accounts.length === 0) return true;
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (regularPeriods.length === 0) return false;
  const populatedPeriods = /* @__PURE__ */ new Set();
  for (const acc of accounts) {
    for (const [pid, val] of Object.entries(acc.monthlyValues || {})) {
      if (val !== 0) populatedPeriods.add(pid);
    }
  }
  const coverageRatio = populatedPeriods.size / regularPeriods.length;
  return coverageRatio < 0.5;
}
export {
  isTBCacheIncomplete as i,
  loadTrialBalanceFromProcessedData as l
};
