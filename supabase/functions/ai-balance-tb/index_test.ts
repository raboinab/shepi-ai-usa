import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { validateTbStructure } from "./index.ts";

const periods = [
  { id: "2024-01", label: "Jan 2024" },
  { id: "2024-02", label: "Feb 2024" },
];

function bs(name: string, vals: Record<string, number>) {
  return { id: name, fsType: "BS" as const, accountName: name, monthlyValues: vals };
}
function is(name: string, vals: Record<string, number>) {
  return { id: name, fsType: "IS" as const, accountName: name, monthlyValues: vals };
}

Deno.test("no_is_accounts — BS-only TB (Milano case)", () => {
  const accounts = [
    bs("Cash", { "2024-01": 1000, "2024-02": 1000 }),
    bs("Equity", { "2024-01": -1000, "2024-02": -1000 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "degenerate");
  assertEquals(r.reason, "no_is_accounts");
  assertEquals(r.diagnostics.isAccounts, 0);
});

Deno.test("no_bs_accounts — IS-only TB", () => {
  const accounts = [
    is("Revenue", { "2024-01": -500, "2024-02": -500 }),
    is("Expense", { "2024-01": 500, "2024-02": 500 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "degenerate");
  assertEquals(r.reason, "no_bs_accounts");
});

Deno.test("is_all_zero — IS rows present but all zero", () => {
  const accounts = [
    bs("Cash", { "2024-01": 1000, "2024-02": 1050 }),
    bs("Equity", { "2024-01": -1000, "2024-02": -1050 }),
    is("Revenue", { "2024-01": 0, "2024-02": 0 }),
    is("Expense", { "2024-01": 0, "2024-02": 0 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "degenerate");
  assertEquals(r.reason, "is_all_zero");
});

Deno.test("imbalance_is_noise — tiny imbalance vs large IS magnitudes", () => {
  const accounts = [
    bs("Cash", { "2024-01": 1000000, "2024-02": 1000000 }),
    bs("Equity", { "2024-01": -1000005, "2024-02": -1000000 }),
    is("Revenue", { "2024-01": -500000, "2024-02": -500000 }),
    is("Expense", { "2024-01": 500000, "2024-02": 500000 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "degenerate");
  assertEquals(r.reason, "imbalance_is_noise");
});

Deno.test("ok — real imbalance worth fixing", () => {
  const accounts = [
    bs("Cash", { "2024-01": 1000, "2024-02": 1000 }),
    bs("Equity", { "2024-01": -500, "2024-02": -500 }),
    is("Revenue", { "2024-01": -800, "2024-02": -800 }),
    is("Expense", { "2024-01": 200, "2024-02": 200 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "ok");
});

Deno.test("ok — perfectly balanced TB with real IS rows still returns ok", () => {
  const accounts = [
    bs("Cash", { "2024-01": 1000, "2024-02": 1000 }),
    bs("Equity", { "2024-01": -400, "2024-02": -400 }),
    is("Revenue", { "2024-01": -1000, "2024-02": -1000 }),
    is("Expense", { "2024-01": 400, "2024-02": 400 }),
  ];
  const r = validateTbStructure(accounts, periods);
  assertEquals(r.status, "ok");
});
