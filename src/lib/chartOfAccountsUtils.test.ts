import { describe, it, expect } from "vitest";
import {
  transformCoaData,
  mergeCoaAccounts,
  findMatchingAccount,
  type CoaAccount,
} from "./chartOfAccountsUtils";

describe("chartOfAccountsUtils — leaf-name disambiguation", () => {
  it("keeps two distinct QB accounts that share a leaf name (Job Materials: income vs expense)", () => {
    // Mimic QB sample: two "Job Materials" accounts with same leaf,
    // distinct parents, distinct classifications, no AcctNum.
    const incoming = transformCoaData([
      {
        Id: "101",
        Name: "Job Materials",
        FullyQualifiedName: "Landscaping Services:Job Materials",
        AccountType: "Income",
        AccountSubType: "ServiceFeeIncome",
        Classification: "Revenue",
        ParentRef: { value: "45" },
      },
      {
        Id: "202",
        Name: "Job Materials",
        FullyQualifiedName: "Job Expenses:Job Materials",
        AccountType: "Cost of Goods Sold",
        AccountSubType: "SuppliesMaterialsCogs",
        Classification: "Expense",
        ParentRef: { value: "60" },
      },
    ]);

    expect(incoming).toHaveLength(2);

    const merged = mergeCoaAccounts([], incoming);
    expect(merged.accounts).toHaveLength(2);
    expect(merged.stats.added).toBe(2);
    expect(merged.stats.merged).toBe(0);

    const classifications = merged.accounts.map(a => a.classification);
    expect(classifications).toContain("Revenue");
    expect(classifications).toContain("Expense");
  });

  it("merges two imports of the same QB account (matched by accountId)", () => {
    const first = transformCoaData([
      { Id: "999", Name: "Cash", AccountType: "Bank", AccountSubType: "Checking" },
    ]);
    const second = transformCoaData([
      { Id: "999", Name: "Cash - Operating", AccountType: "Bank", AccountSubType: "Checking" },
    ]);

    const r1 = mergeCoaAccounts([], first);
    const r2 = mergeCoaAccounts(r1.accounts, second);

    expect(r2.accounts).toHaveLength(1);
    expect(r2.stats.merged).toBe(1);
    expect(r2.accounts[0].accountName).toBe("Cash - Operating");
  });

  it("merges two accounts that share a real accountNumber", () => {
    const incoming = transformCoaData([
      { Name: "Sales", AcctNum: "4000", AccountType: "Income" },
      { Name: "Sales Revenue", AcctNum: "4000", AccountType: "Income" },
    ]);
    const merged = mergeCoaAccounts([], incoming);
    expect(merged.accounts).toHaveLength(1);
  });

  it("does NOT collide on synthesized account numbers", () => {
    // Both lack an AcctNum and an Id — get auto-numbered.
    const incoming = transformCoaData([
      { Name: "Alpha", AccountType: "Income", Classification: "Revenue" },
      { Name: "Beta", AccountType: "Expense", Classification: "Expense" },
    ]);
    const merged = mergeCoaAccounts([], incoming);
    expect(merged.accounts).toHaveLength(2);
  });

  it("preserves user-edited accounts on re-import", () => {
    const initial: CoaAccount[] = [
      {
        id: 1,
        accountNumber: "1000",
        accountName: "Cash",
        fsType: "BS",
        category: "Cash and cash equivalents",
        accountId: "5",
        isUserEdited: true,
      },
    ];
    const incoming = transformCoaData([
      { Id: "5", Name: "Cash (renamed by QB)", AcctNum: "1000", AccountType: "Bank" },
    ]);
    const merged = mergeCoaAccounts(initial, incoming);
    expect(merged.accounts).toHaveLength(1);
    expect(merged.accounts[0].accountName).toBe("Cash"); // user edit preserved
    expect(merged.stats.preserved).toBe(1);
  });

  it("retains Unapplied Cash accounts (distinct names, no dedup collision)", () => {
    const incoming = transformCoaData([
      {
        Id: "301",
        Name: "Unapplied Cash Payment Income",
        AccountType: "Income",
        Classification: "Revenue",
      },
      {
        Id: "302",
        Name: "Unapplied Cash Bill Payment Expense",
        AccountType: "Expense",
        Classification: "Expense",
      },
    ]);
    const merged = mergeCoaAccounts([], incoming);
    expect(merged.accounts).toHaveLength(2);
  });
});

describe("findMatchingAccount priority", () => {
  it("matches by accountId before falling back to name", () => {
    const existing: CoaAccount[] = [
      {
        id: 1,
        accountNumber: "9001",
        accountName: "Different Name",
        fsType: "IS",
        category: "",
        accountId: "abc",
      },
    ];
    const candidate: CoaAccount = {
      id: 0,
      accountNumber: "9999",
      accountName: "Also Different",
      fsType: "IS",
      category: "",
      accountId: "abc",
    };
    expect(findMatchingAccount(candidate, existing)?.id).toBe(1);
  });

  it("does NOT match on leaf name alone when classification differs", () => {
    const existing: CoaAccount[] = [
      {
        id: 1,
        accountNumber: "",
        accountName: "Installation",
        fsType: "IS",
        category: "",
        classification: "Revenue",
        accountSubtype: "ServiceFeeIncome",
        _autoNumbered: true,
      },
    ];
    const candidate: CoaAccount = {
      id: 0,
      accountNumber: "",
      accountName: "Installation",
      fsType: "IS",
      category: "",
      classification: "Expense",
      accountSubtype: "SuppliesMaterialsCogs",
      _autoNumbered: true,
    };
    expect(findMatchingAccount(candidate, existing)).toBeUndefined();
  });
});
