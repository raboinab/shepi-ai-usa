/**
 * WIP Account Mapping utilities.
 * Mirrors `financialLabelUtils.ts` pattern: extract candidate BS accounts from COA
 * via keyword matching, then auto-populate slot mapping (with manual override in UI).
 *
 * Three slots:
 *   - contractAssets:        "Costs in Excess of Billings" / "Underbillings" / "Unbilled Revenue"
 *   - contractLiabilities:   "Billings in Excess of Costs" / "Overbillings" / "Deferred Contract Revenue"
 *   - jobCostsInProcess:     "Work in Process" / "WIP" / "Construction in Progress" (optional)
 */
import type { CoaAccount } from "./chartOfAccountsUtils";

export interface WIPAccountCandidates {
  contractAssets: CoaAccount[];
  contractLiabilities: CoaAccount[];
  jobCostsInProcess: CoaAccount[];
  allBalanceSheetAccounts: CoaAccount[];
}

export interface WIPAccountMapping {
  contractAssets?: string;       // accountNumber (stable key)
  contractLiabilities?: string;  // accountNumber
  jobCostsInProcess?: string;    // accountNumber
}

const CONTRACT_ASSET_PATTERNS = [
  /costs?\s+in\s+excess/i,
  /under[-\s]?bill/i,
  /unbilled\s+(?:revenue|receivable)/i,
  /contract\s+assets?/i,
  /wip\s+assets?/i,
];

const CONTRACT_LIABILITY_PATTERNS = [
  /billings?\s+in\s+excess/i,
  /over[-\s]?bill/i,
  /deferred\s+contract/i,
  /contract\s+liabilit/i,
  /customer\s+deposits?/i,
];

const JOB_COSTS_PATTERNS = [
  /work\s+in\s+process/i,
  /work[-\s]in[-\s]progress/i,
  /\bwip\b/i,
  /job\s+costs?/i,
  /construction\s+in\s+progress/i,
  /\bcip\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text));
}

/**
 * Extract candidate WIP accounts from the COA.
 * Filters to BS accounts only and groups by slot.
 */
export function extractWIPAccountsFromCOA(accounts: CoaAccount[]): WIPAccountCandidates {
  const bsAccounts = accounts.filter(a => a.fsType === "BS");
  return {
    contractAssets: bsAccounts.filter(a => matchesAny(a.accountName, CONTRACT_ASSET_PATTERNS)),
    contractLiabilities: bsAccounts.filter(a => matchesAny(a.accountName, CONTRACT_LIABILITY_PATTERNS)),
    jobCostsInProcess: bsAccounts.filter(a => matchesAny(a.accountName, JOB_COSTS_PATTERNS)),
    allBalanceSheetAccounts: bsAccounts,
  };
}

/**
 * Auto-populate WIP mapping from candidates. Picks the first match per slot.
 * Returns the new mapping plus the list of slot keys that were auto-populated.
 */
export function autoPopulateWIPMapping(
  candidates: WIPAccountCandidates,
  existing: WIPAccountMapping = {}
): { mapping: WIPAccountMapping; autoPopulatedKeys: string[] } {
  const mapping: WIPAccountMapping = { ...existing };
  const autoPopulatedKeys: string[] = [];

  const tryPopulate = (key: keyof WIPAccountMapping, list: CoaAccount[]) => {
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

/** Lookup helper: resolve a mapping key (accountNumber or accountName fallback) back to a CoaAccount. */
export function resolveMappedAccount(
  accounts: CoaAccount[],
  key: string | undefined
): CoaAccount | undefined {
  if (!key) return undefined;
  return accounts.find(a => a.accountNumber === key) || accounts.find(a => a.accountName === key);
}

/** Slot metadata used by the UI and the AI suggestion edge function. */
export const WIP_SLOT_DEFINITIONS = {
  contractAssets: {
    label: "Contract Assets",
    description:
      "Asset account representing costs and earned revenue exceeding billings (a.k.a. Underbillings, Costs in Excess of Billings, Unbilled Revenue).",
    expectedFsType: "BS" as const,
  },
  contractLiabilities: {
    label: "Contract Liabilities",
    description:
      "Liability account representing billings exceeding costs and earned revenue (a.k.a. Overbillings, Billings in Excess of Costs, Deferred Contract Revenue).",
    expectedFsType: "BS" as const,
  },
  jobCostsInProcess: {
    label: "Job Costs / WIP Inventory",
    description:
      "Inventory or other-asset account holding accumulated job costs prior to revenue recognition (a.k.a. Work in Process, Construction in Progress, CIP).",
    expectedFsType: "BS" as const,
  },
} as const;

export type WIPSlotKey = keyof typeof WIP_SLOT_DEFINITIONS;
