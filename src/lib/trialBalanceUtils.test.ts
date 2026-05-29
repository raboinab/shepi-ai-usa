import { describe, it, expect } from "vitest";
import {
  transformQbTrialBalanceData,
  crossReferenceWithCOA,
  mergeAccounts,
  type TrialBalanceAccount,
} from "./trialBalanceUtils";
import type { CoaAccount } from "./chartOfAccountsUtils";
import type { Period } from "./periodUtils";

const periods: Period[] = [
  { id: "p1", year: 2024, month: 1, label: "Jan 2024", startDate: "2024-01-01", endDate: "2024-01-31" } as Period,
];

// Two TB rows with identical leaf name but distinct QB internal Ids,
// mirroring "Equipment Rental" (root) and "Job Expenses:Equipment Rental" (sub).
const qbData = {
  monthlyReports: [
    {
      year: "2024",
      month: "JAN",
      report: {
        rows: {
          row: [
            { colData: [{ id: "247", value: "Equipment Rental" }, { value: "100" }, { value: "" }] },
            { colData: [{ id: "254", value: "Equipment Rental" }, { value: "250" }, { value: "" }] },
          ],
        },
      },
    },
  ],
};

describe("Trial Balance — leaf-name collision", () => {
  it("keeps two distinct accounts when QB Ids differ but leaf names collide", () => {
    const accts = transformQbTrialBalanceData(qbData as any, periods);
    expect(accts).toHaveLength(2);
    const ids = accts.map(a => a.qbAccountId).sort();
    expect(ids).toEqual(["247", "254"]);
    // Each carries its own monthly value
    const byId = Object.fromEntries(accts.map(a => [a.qbAccountId!, a.monthlyValues.p1]));
    expect(byId["247"]).toBe(100);
    expect(byId["254"]).toBe(250);
  });

  it("mergeAccounts does not collapse them across merges", () => {
    const first = transformQbTrialBalanceData(qbData as any, periods);
    const merged = mergeAccounts([], first);
    expect(merged).toHaveLength(2);
  });

  it("crossReferenceWithCOA matches each TB row to its own COA entry by QB Id", () => {
    const coa: CoaAccount[] = [
      {
        id: 1, accountNumber: "", accountName: "Equipment Rental", fsType: "IS",
        category: "Operating Expenses", accountId: "247", classification: "EXPENSE",
        accountSubtype: "EquipmentRental", fullyQualifiedName: "Equipment Rental",
      },
      {
        id: 2, accountNumber: "", accountName: "Equipment Rental", fsType: "IS",
        category: "Operating Expenses", accountId: "254", classification: "EXPENSE",
        accountSubtype: "EquipmentRental", fullyQualifiedName: "Job Expenses:Equipment Rental",
      },
    ];
    const tb = transformQbTrialBalanceData(qbData as any, periods);
    const { accounts, matchStats } = crossReferenceWithCOA(tb, coa);
    expect(matchStats.matched).toBe(2);
    expect(matchStats.unmatched).toBe(0);
    // Each TB account matched its own COA partner (no cross-contamination)
    expect(accounts).toHaveLength(2);
  });
});
