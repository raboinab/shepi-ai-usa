/**
 * Centralized QoE metrics computation.
 * Single source of truth for EBITDA numbers across all wizard views and exports.
 * Uses LTM (last 12 non-stub periods) scope and dealData.adjustments.
 */
import type { DealData } from "./workbook-types";
import * as calc from "./calculations";

export interface QoEMetrics {
  revenue: number;
  grossProfit: number;
  netIncome: number;
  reportedEBITDA: number;
  totalAdjustments: number;
  adjustedEBITDA: number;
  adjustmentCount: number;
  /** Period IDs used for the computation (LTM) */
  ltmPeriodIds: string[];
}

const EMPTY: QoEMetrics = {
  revenue: 0,
  grossProfit: 0,
  netIncome: 0,
  reportedEBITDA: 0,
  totalAdjustments: 0,
  adjustedEBITDA: 0,
  adjustmentCount: 0,
  ltmPeriodIds: [],
};

/**
 * Compute QoE metrics using LTM scope from the canonical DealData object.
 * All values are display-positive (revenue & EBITDA as positive numbers).
 * Includes reclassification overlays so metrics match workbook grids.
 */
export function computeQoEMetrics(dealData: DealData | null | undefined): QoEMetrics {
  if (!dealData) return EMPTY;

  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const rc = dealData.reclassifications ?? [];
  const activePeriods = dealData.deal.periods.filter(p => !p.isStub);

  if (activePeriods.length === 0 || tb.length === 0) return EMPTY;

  const ltmPids = activePeriods.slice(-12).map(p => p.id);

  // Negate TB credit convention for display-positive values
  let revenue = -ltmPids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0);
  let grossProfit = -ltmPids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0);
  let netIncome = -ltmPids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0);
  let reportedEBITDA = -ltmPids.reduce((s, p) => s + calc.calcReportedEBITDA(tb, p, ab), 0);
  let adjustedEBITDA = -ltmPids.reduce((s, p) => s + calc.calcAdjustedEBITDA(tb, adj, p, ab), 0);

  // Overlay reclassification impacts (same logic as workbook grids)
  if (rc.length > 0) {
    for (const pid of ltmPids) {
      const revReclass = calc.sumReclassImpact(rc, "Revenue", pid);
      const cogsReclass = calc.sumReclassImpact(rc, "Cost of Goods Sold", pid);
      const opexReclass = calc.sumReclassImpact(rc, "Operating expenses", pid);
      const payrollReclass = calc.sumReclassImpact(rc, "Payroll & Related", pid);
      const otherReclass = calc.sumReclassImpact(rc, "Other expense (income)", pid);

      // Revenue & GP: negate because TB uses credit-positive convention
      revenue += -revReclass;
      grossProfit += -(revReclass + cogsReclass);

      // Net income: all IS reclass impacts
      const totalISReclass = revReclass + cogsReclass + opexReclass + payrollReclass + otherReclass;
      netIncome += -totalISReclass;

      // EBITDA: same IS impacts apply to both reported and adjusted
      reportedEBITDA += -totalISReclass;
      adjustedEBITDA += -totalISReclass;
    }
  }

  const totalAdjustments = adjustedEBITDA - reportedEBITDA;

  // Count non-zero adjustments
  const adjEntries = Array.isArray(adj) ? adj : Object.values(adj);
  let adjustmentCount = adjEntries.filter((a: unknown) => {
    if (!a) return false;
    const entry = a as Record<string, unknown>;
    const pv = (entry.periodValues || entry.proposed_period_values || entry.amounts || {}) as Record<string, number>;
    const total = Object.values(pv).reduce((s: number, v) => s + (typeof v === "number" ? v : 0), 0);
    return total !== 0;
  }).length;

  if (adjustmentCount === 0 && totalAdjustments !== 0) adjustmentCount = -1;

  return { revenue, grossProfit, netIncome, reportedEBITDA, totalAdjustments, adjustedEBITDA, adjustmentCount, ltmPeriodIds: ltmPids };
}
