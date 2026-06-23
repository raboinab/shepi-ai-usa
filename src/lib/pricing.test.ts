import { describe, it, expect } from "vitest";
import { PRICING } from "./pricing";

describe("PRICING constants", () => {
  it("DFY upgrade equals the gap between Per-Project and Done-For-You", () => {
    expect(PRICING.dfyUpgradeFromPerProject.amount).toBe(
      PRICING.doneForYou.amount - PRICING.perProject.amount
    );
  });

  it("Monthly tier includes >=1 project and overage is cheaper than per-project", () => {
    expect(PRICING.monthly.includedProjects).toBeGreaterThanOrEqual(1);
    expect(PRICING.monthly.overagePerProject).toBeLessThan(PRICING.perProject.amount);
  });

  it("Done-For-You is more expensive than Per-Project (CPA review premium)", () => {
    expect(PRICING.doneForYou.amount).toBeGreaterThan(PRICING.perProject.amount);
  });

  it("All Stripe price IDs are configured (not placeholders)", () => {
    const ids = [
      PRICING.perProject.stripePriceId,
      PRICING.doneForYou.stripePriceId,
      PRICING.monthly.stripePriceId,
      PRICING.monthly.overagePriceId,
    ];
    for (const id of ids) {
      expect(id).toMatch(/^price_[A-Za-z0-9]+$/);
      expect(id).not.toMatch(/REPLACE_WITH/i);
    }
  });

  it("Displays match amounts", () => {
    expect(PRICING.perProject.display).toBe("$2,000");
    expect(PRICING.doneForYou.display).toBe("$5,000");
    expect(PRICING.monthly.display).toBe("$4,000");
  });
});
