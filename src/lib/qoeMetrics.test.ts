import { describe, it, expect } from "vitest";
import { computeQoEMetrics } from "./qoeMetrics";
import { createMockDealData } from "./mockDeal";

describe("computeQoEMetrics — golden-path against mockDeal", () => {
  const metrics = computeQoEMetrics(createMockDealData());

  it("returns empty/zeroed shape for null input", () => {
    const empty = computeQoEMetrics(null);
    expect(empty.revenue).toBe(0);
    expect(empty.adjustedEBITDA).toBe(0);
    expect(empty.ltmPeriodIds).toEqual([]);
  });

  it("LTM scope is at most 12 periods", () => {
    expect(metrics.ltmPeriodIds.length).toBeGreaterThan(0);
    expect(metrics.ltmPeriodIds.length).toBeLessThanOrEqual(12);
  });

  it("revenue is display-positive (TB credit convention negated)", () => {
    expect(metrics.revenue).toBeGreaterThan(0);
  });

  it("gross profit does not exceed revenue", () => {
    expect(metrics.grossProfit).toBeLessThanOrEqual(metrics.revenue);
  });

  it("identity: adjustedEBITDA === reportedEBITDA + totalAdjustments (within 1¢)", () => {
    expect(
      Math.abs(metrics.adjustedEBITDA - (metrics.reportedEBITDA + metrics.totalAdjustments))
    ).toBeLessThan(0.01);
  });

  it("EBITDA margin is in a sane (-1, 1) range for a normal SMB deal", () => {
    const margin = metrics.adjustedEBITDA / metrics.revenue;
    expect(margin).toBeGreaterThan(-1);
    expect(margin).toBeLessThan(1);
  });

  it("adjustmentCount is non-negative or sentinel -1 (uncounted non-zero)", () => {
    expect(metrics.adjustmentCount === -1 || metrics.adjustmentCount >= 0).toBe(true);
  });
});
