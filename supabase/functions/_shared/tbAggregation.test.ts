import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildAccountKey,
  buildCoaLookupMaps,
  resolveCoaMatch,
  type RowKeys,
} from "./tbAggregation.ts";

const coa = [
  {
    accountId: "100",
    accountNumber: "4000",
    accountName: "Job Materials",
    fullyQualifiedName: "Landscaping Services:Job Materials",
    accountType: "Income",
    accountSubtype: "ServiceFeeIncome",
  },
  {
    accountId: "200",
    accountNumber: "5000",
    accountName: "Job Materials",
    fullyQualifiedName: "Job Expenses:Job Materials",
    accountType: "Expense",
    accountSubtype: "SuppliesMaterialsCogs",
  },
  {
    accountId: "300",
    // _autoNumbered: account had no AcctNum, fell back to id
    accountNumber: "300",
    _autoNumbered: true,
    accountName: "Unapplied Cash Payment Income",
    fullyQualifiedName: "Unapplied Cash Payment Income",
    accountType: "Income",
    accountSubtype: "UnappliedCashPaymentIncome",
  },
  {
    accountId: "301",
    accountNumber: "301",
    _autoNumbered: true,
    accountName: "Unapplied Cash Bill Payment Expense",
    fullyQualifiedName: "Unapplied Cash Bill Payment Expense",
    accountType: "Expense",
    accountSubtype: "UnappliedCashBillPaymentExpense",
  },
  {
    accountId: "400",
    accountNumber: "6000",
    accountName: "Solo Account",
    fullyQualifiedName: "Solo Account",
    accountType: "Expense",
    accountSubtype: "OtherMiscellaneousServiceCost",
  },
];

const maps = buildCoaLookupMaps(coa);

Deno.test("resolveCoaMatch: matches by accountId", () => {
  const row: RowKeys = {
    accountId: "100",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Anything",
    accountType: "",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.source, "id");
  assertEquals((r.match as any)?.accountId, "100");
});

Deno.test("resolveCoaMatch: matches by real accountNumber", () => {
  const row: RowKeys = {
    accountId: "",
    accountNumber: "5000",
    fullyQualifiedName: "",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.source, "number");
  assertEquals((r.match as any)?.accountId, "200");
});

Deno.test("resolveCoaMatch: matches by fullyQualifiedName, disambiguates Job Materials", () => {
  const incomeRow: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "Landscaping Services:Job Materials",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  const expenseRow: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "Job Expenses:Job Materials",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  assertEquals((resolveCoaMatch(incomeRow, maps).match as any)?.accountId, "100");
  assertEquals((resolveCoaMatch(expenseRow, maps).match as any)?.accountId, "200");
});

Deno.test("resolveCoaMatch: ambiguous leaf name without type tiebreak", () => {
  const row: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.match, undefined);
  assertEquals(r.ambiguous, true);
});

Deno.test("resolveCoaMatch: leaf name + accountType disambiguates", () => {
  const row: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Job Materials",
    accountType: "Expense",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.source, "name+type");
  assertEquals((r.match as any)?.accountId, "200");
});

Deno.test("resolveCoaMatch: leaf name unique → matches", () => {
  const row: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Solo Account",
    accountType: "",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.source, "name+type");
  assertEquals((r.match as any)?.accountId, "400");
});

Deno.test("resolveCoaMatch: synthesized COA number is NOT used as match key", () => {
  // Auto-numbered COA accounts (number === id) must not match by number alone.
  const row: RowKeys = {
    accountId: "",
    accountNumber: "300",
    fullyQualifiedName: "",
    accountName: "Some Random Name",
    accountType: "",
    accountSubtype: "",
  };
  const r = resolveCoaMatch(row, maps);
  assertEquals(r.source, "unmatched");
});

Deno.test("buildAccountKey: distinct keys for same-named Income vs Expense", () => {
  const income: RowKeys = {
    accountId: "100",
    accountNumber: "",
    fullyQualifiedName: "Landscaping Services:Job Materials",
    accountName: "Job Materials",
    accountType: "Income",
    accountSubtype: "",
  };
  const expense: RowKeys = {
    accountId: "200",
    accountNumber: "",
    fullyQualifiedName: "Job Expenses:Job Materials",
    accountName: "Job Materials",
    accountType: "Expense",
    accountSubtype: "",
  };
  const k1 = buildAccountKey(income);
  const k2 = buildAccountKey(expense);
  assertEquals(k1 === k2, false);
});

Deno.test("buildAccountKey: same accountId across periods → same key", () => {
  const row: RowKeys = {
    accountId: "100",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Job Materials",
    accountType: "Income",
    accountSubtype: "",
  };
  assertEquals(buildAccountKey(row), buildAccountKey(row));
});

Deno.test("buildAccountKey: composite fallback distinguishes leaf-name collisions when no id/number/fqn", () => {
  const a: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Unapplied Cash",
    accountType: "Income",
    accountSubtype: "UnappliedCashPaymentIncome",
  };
  const b: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "",
    accountName: "Unapplied Cash",
    accountType: "Expense",
    accountSubtype: "UnappliedCashBillPaymentExpense",
  };
  assertEquals(buildAccountKey(a) === buildAccountKey(b), false);
});

Deno.test("buildAccountKey: FQN normalization (whitespace around colons)", () => {
  const a: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "Job Expenses : Job Materials",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  const b: RowKeys = {
    accountId: "",
    accountNumber: "",
    fullyQualifiedName: "job expenses:job materials",
    accountName: "Job Materials",
    accountType: "",
    accountSubtype: "",
  };
  assertEquals(buildAccountKey(a), buildAccountKey(b));
});
