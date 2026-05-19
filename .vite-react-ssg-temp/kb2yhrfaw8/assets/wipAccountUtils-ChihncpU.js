const CONTRACT_ASSET_PATTERNS = [
  /costs?\s+in\s+excess/i,
  /under[-\s]?bill/i,
  /unbilled\s+(?:revenue|receivable)/i,
  /contract\s+assets?/i,
  /wip\s+assets?/i
];
const CONTRACT_LIABILITY_PATTERNS = [
  /billings?\s+in\s+excess/i,
  /over[-\s]?bill/i,
  /deferred\s+contract/i,
  /contract\s+liabilit/i,
  /customer\s+deposits?/i
];
const JOB_COSTS_PATTERNS = [
  /work\s+in\s+process/i,
  /work[-\s]in[-\s]progress/i,
  /\bwip\b/i,
  /job\s+costs?/i,
  /construction\s+in\s+progress/i,
  /\bcip\b/i
];
function matchesAny(text, patterns) {
  return patterns.some((p) => p.test(text));
}
function extractWIPAccountsFromCOA(accounts) {
  const bsAccounts = accounts.filter((a) => a.fsType === "BS");
  return {
    contractAssets: bsAccounts.filter((a) => matchesAny(a.accountName, CONTRACT_ASSET_PATTERNS)),
    contractLiabilities: bsAccounts.filter((a) => matchesAny(a.accountName, CONTRACT_LIABILITY_PATTERNS)),
    jobCostsInProcess: bsAccounts.filter((a) => matchesAny(a.accountName, JOB_COSTS_PATTERNS)),
    allBalanceSheetAccounts: bsAccounts
  };
}
function autoPopulateWIPMapping(candidates, existing = {}) {
  const mapping = { ...existing };
  const autoPopulatedKeys = [];
  const tryPopulate = (key, list) => {
    if (!mapping[key] && list.length > 0) {
      mapping[key] = list[0].accountNumber || list[0].accountName;
      autoPopulatedKeys.push(key);
    }
  };
  tryPopulate("contractAssets", candidates.contractAssets);
  tryPopulate("contractLiabilities", candidates.contractLiabilities);
  tryPopulate("jobCostsInProcess", candidates.jobCostsInProcess);
  return { mapping, autoPopulatedKeys };
}
function resolveMappedAccount(accounts, key) {
  if (!key) return void 0;
  return accounts.find((a) => a.accountNumber === key) || accounts.find((a) => a.accountName === key);
}
const WIP_SLOT_DEFINITIONS = {
  contractAssets: {
    label: "Contract Assets",
    description: "Asset account representing costs and earned revenue exceeding billings (a.k.a. Underbillings, Costs in Excess of Billings, Unbilled Revenue).",
    expectedFsType: "BS"
  },
  contractLiabilities: {
    label: "Contract Liabilities",
    description: "Liability account representing billings exceeding costs and earned revenue (a.k.a. Overbillings, Billings in Excess of Costs, Deferred Contract Revenue).",
    expectedFsType: "BS"
  },
  jobCostsInProcess: {
    label: "Job Costs / WIP Inventory",
    description: "Inventory or other-asset account holding accumulated job costs prior to revenue recognition (a.k.a. Work in Process, Construction in Progress, CIP).",
    expectedFsType: "BS"
  }
};
export {
  WIP_SLOT_DEFINITIONS as W,
  autoPopulateWIPMapping as a,
  extractWIPAccountsFromCOA as e,
  resolveMappedAccount as r
};
