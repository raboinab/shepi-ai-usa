import { describe, it, expect } from "vitest";
import { createMockDealData } from "./mockDeal";
import { computeQoEMetrics } from "./qoeMetrics";
import type { Reclassification } from "./workbook-types";

function mkReclass(id: string, from: string, to: string, pids: string[], amt: number): Reclassification {
  const amounts: Record<string, number> = {};
  for (const p of pids) amounts[p] = amt;
  return { id, label: id, fromAccount: from, toAccount: to, amounts };
}

describe("Reclassifications & EBITDA — only cross-line reclasses shift EBITDA", () => {
  const base = createMockDealData();
  const ltm = base.deal.periods.filter(p => !p.isStub).slice(-12).map(p => p.id);
  const baseline = computeQoEMetrics(base);

  it("intra-EBITDA reclass (OpEx -> Payroll) leaves EBITDA unchanged", () => {
    const deal = { ...base, reclassifications: [mkReclass("r1", "Operating expenses", "Payroll & Related", ltm, 10000)] };
    const m = computeQoEMetrics(deal);
    expect(Math.abs(m.reportedEBITDA - baseline.reportedEBITDA)).toBeLessThan(0.01);
    expect(Math.abs(m.adjustedEBITDA - baseline.adjustedEBITDA)).toBeLessThan(0.01);
    expect(Math.abs(m.netIncome - baseline.netIncome)).toBeLessThan(0.01);
  });

  it("cross-line reclass (OpEx -> Other expense) shifts EBITDA but not Net Income", () => {
    const amount = 10000;
    const deal = { ...base, reclassifications: [mkReclass("r2", "Operating expenses", "Other expense (income)", ltm, amount)] };
    const m = computeQoEMetrics(deal);
    // EBITDA must change (it crosses the EBITDA line); exact direction depends on sign convention,
    // we only assert magnitude == amount * #periods.
    const ebitdaDelta = Math.abs(m.reportedEBITDA - baseline.reportedEBITDA);
    expect(ebitdaDelta).toBeCloseTo(amount * ltm.length, 2);
    expect(Math.abs(m.adjustedEBITDA - baseline.adjustedEBITDA)).toBeCloseTo(amount * ltm.length, 2);
    // Net income must NOT change — same dollars, different bucket.
    expect(Math.abs(m.netIncome - baseline.netIncome)).toBeLessThan(0.01);
  });
});
