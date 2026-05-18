import { describe, it, expect } from "vitest";
import { signedAdjustmentTotal } from "./adjustmentSignUtils";

describe("signedAdjustmentTotal", () => {
  it("remove_expense adds magnitude to EBITDA (+)", () => {
    expect(
      signedAdjustmentTotal({ intent: "remove_expense", periodValues: { p1: 100, p2: 200 } })
    ).toBe(300);
  });

  it("remove_revenue subtracts magnitude (-)", () => {
    expect(
      signedAdjustmentTotal({ intent: "remove_revenue", periodValues: { p1: 100 } })
    ).toBe(-100);
  });

  it("add_expense subtracts (-)", () => {
    expect(signedAdjustmentTotal({ intent: "add_expense", amount: 500 })).toBe(-500);
  });

  it("add_revenue adds (+)", () => {
    expect(signedAdjustmentTotal({ intent: "add_revenue", amount: 750 })).toBe(750);
  });

  it("normalize_up_expense subtracts, normalize_down_expense adds", () => {
    expect(signedAdjustmentTotal({ intent: "normalize_up_expense", amount: 100 })).toBe(-100);
    expect(signedAdjustmentTotal({ intent: "normalize_down_expense", amount: 100 })).toBe(100);
  });

  it("other intent yields zero sign", () => {
    expect(signedAdjustmentTotal({ intent: "other", amount: 999 })).toBe(0);
  });

  it("excludeNonQoE skips NonQoE and PresentationOnly effects", () => {
    const adj = { intent: "remove_expense", amount: 100, effectType: "NonQoE" };
    expect(signedAdjustmentTotal(adj, { excludeNonQoE: true })).toBe(0);
    expect(signedAdjustmentTotal(adj)).toBe(100);

    const pres = { intent: "remove_expense", amount: 100, effectType: "PresentationOnly" };
    expect(signedAdjustmentTotal(pres, { excludeNonQoE: true })).toBe(0);
  });

  it("falls back to amount when periodValues is missing", () => {
    expect(signedAdjustmentTotal({ intent: "remove_expense", amount: 42 })).toBe(42);
  });

  it("treats unknown/missing intent as remove_expense default", () => {
    expect(signedAdjustmentTotal({ amount: 10 })).toBe(10);
  });

  it("ignores non-numeric period values", () => {
    expect(
      signedAdjustmentTotal({
        intent: "remove_expense",
        periodValues: { p1: 100, p2: NaN as unknown as number, p3: 50 },
      })
    ).toBe(150);
  });
});
