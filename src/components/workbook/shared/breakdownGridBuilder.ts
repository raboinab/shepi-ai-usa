/**
 * Shared builder for breakdown tabs (Sales, COGS, OpEx, Other, Payroll).
 * Generates: reported section, change section, % of denominator, check row,
 * and an "adjusted" section mirroring reported with QoE adjustments applied.
 */
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { reclassAwareRevenueRaw } from "@/lib/reclassHelpers";
import { buildStandardColumns, periodCells, entryCells, marginCells } from "./tabHelpers";
// Note: alias sets are used by calc.calc*Adjustments functions internally

/** Resolve a line item string to its per-line-item adjustment function */
function calcLineItemAdjustments(
  lineItem: string, adj: DealData["adjustments"],
  tbIdx: Map<string, import("@/lib/workbook-types").TrialBalanceEntry>,
  type: "all", p: string
): number {
  switch (lineItem) {
    case "Revenue": return calc.calcRevenueAdjustments(adj, tbIdx, type, p);
    case "Cost of Goods Sold": return calc.calcCOGSAdjustments(adj, tbIdx, type, p);
    case "Operating expenses": return calc.calcOpExAdjustments(adj, tbIdx, type, p);
    case "Other expense (income)": return calc.calcOtherExpenseAdjustments(adj, tbIdx, type, p);
    case "Payroll & Related": return calc.calcOpExAdjustments(adj, tbIdx, type, p);
    default: return 0;
  }
}

interface BreakdownConfig {
  lineItem: string;
  title: string;
  /** Denominator label for % section. Defaults to "% of Revenue". */
  pctLabel?: string;
  pctDenominator?: (p: string) => number;
  /** If true, include account detail frozen columns */
  showDetailColumns?: boolean;
  /**
   * If true, negate all values in the reported/adjusted sections (for display-layer sign flip).
   * Use for Revenue (credit in TB = negative, but shown as positive on P&L).
   */
  negateValues?: boolean;
}

export function buildBreakdownGrid(dealData: DealData, config: BreakdownConfig): GridData {
  const { lineItem, title } = config;
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const tbIdx = calc.buildTbIndex(tb);
  const entries = calc.getEntriesByLineItem(tb, lineItem);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);

  const pctLabel = config.pctLabel || "% of Revenue";
  const rc = dealData.reclassifications ?? [];
  const pctDenFn = config.pctDenominator || ((p: string) => reclassAwareRevenueRaw(tb, rc, p));
  // Sign multiplier: Revenue is stored as negative credit in TB, shown as positive on P&L
  const sign = config.negateValues ? -1 : 1;

  const showDetail = config.showDetailColumns !== false;

  // Build columns
  const baseColumns = buildStandardColumns(dealData, title);
  const columns = showDetail
    ? [
        baseColumns[0], // label
        { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" as const },
        { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" as const },
        { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" as const },
        ...baseColumns.slice(1),
      ]
    : baseColumns;

  const frozenColumns = showDetail ? 4 : 1;
  const ec = showDetail ? { acctNo: "", fsLine: "", sub1: "" } : {};

  const buildSection = (sectionLabel: string, isAdjusted: boolean): GridRow[] => {
    const prefix = isAdjusted ? "adj-" : "";
    const sectionRows: GridRow[] = [];

    // -- Reported/Adjusted section --
    sectionRows.push({ id: `${prefix}hdr-reported`, type: "section-header", label: sectionLabel, cells: { label: sectionLabel, ...ec } });
    for (const e of entries) {
      // Apply sign flip for display-layer (e.g., Revenue is negative credit in TB)
      const signedBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.balances)) signedBalances[k] = v * sign;
      sectionRows.push({
        id: `${prefix}rpt-${e.accountId}`,
        type: "data" as const,
        indent: 1,
        cells: {
          label: e.accountName,
          ...(showDetail ? { acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1 } : {}),
          ...entryCells(dealData, signedBalances),
        },
      });
    }
    sectionRows.push({
      id: `${prefix}total-reported`, type: isAdjusted ? "subtotal" : "total",
      cells: { label: `Total ${title}, as reported`, ...ec, ...pc(p => calc.sumByLineItem(tb, lineItem, p) * sign) },
    });

    if (isAdjusted) {
      // QoE adjustments allocated to this line item
      sectionRows.push({
        id: `${prefix}adj-alloc`, type: "data",
        cells: { label: "QoE Adjustments", ...ec, ...pc(p => calcLineItemAdjustments(lineItem, adj, tbIdx, "all", p) * sign) },
      });
      sectionRows.push({
        id: `${prefix}total-adjusted`, type: "total",
        cells: { label: `Total ${title}, as adjusted`, ...ec, ...pc(p => (calc.sumByLineItem(tb, lineItem, p) - calcLineItemAdjustments(lineItem, adj, tbIdx, "all", p)) * sign) },
      });
    }

    sectionRows.push({ id: `${prefix}s1`, type: "spacer", cells: {} });

    // -- Change section --
    sectionRows.push({ id: `${prefix}hdr-change`, type: "section-header", label: `Change in ${title}`, cells: { label: `Change in ${title}`, ...ec } });
    sectionRows.push({
      id: `${prefix}change-dollar`, type: "data",
      cells: { label: "$ Amount", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells: Record<string, number> = {};
        // Monthly: delta vs prior month
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) { cells[periods[i].id] = 0; continue; }
          cells[periods[i].id] = (calc.sumByLineItem(tb, lineItem, periods[i].id) - calc.sumByLineItem(tb, lineItem, periods[i - 1].id)) * sign;
        }
        // Aggregate: pre-compute totals then compute YoY delta between consecutive FY periods
        const aggVals: Record<string, number> = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + calc.sumByLineItem(tb, lineItem, pid), 0) * sign;
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) { cells[ap.id] = 0; continue; }
          const prior = aggregatePeriods[i - 1];
          const priorIsFY = prior.label.startsWith("FY");
          const currIsFY = ap.label.startsWith("FY");
          cells[ap.id] = (priorIsFY && currIsFY)
            ? aggVals[ap.id] - aggVals[prior.id]
            : 0;
        }
        return cells;
      })() },
    });
    sectionRows.push({
      id: `${prefix}change-pct`, type: "data", format: "percent",
      cells: { label: "% Change", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells: Record<string, number> = {};
        // Monthly: delta % vs prior month
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) { cells[periods[i].id] = NaN; continue; }
          const prior = calc.sumByLineItem(tb, lineItem, periods[i - 1].id);
          const current = calc.sumByLineItem(tb, lineItem, periods[i].id);
          cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
        }
        // Aggregate: YoY % between consecutive FY periods
        // Apply sign so credit accounts (Revenue) show positive growth
        const aggVals: Record<string, number> = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + calc.sumByLineItem(tb, lineItem, pid), 0) * sign;
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) { cells[ap.id] = NaN; continue; }
          const prior = aggregatePeriods[i - 1];
          const priorIsFY = prior.label.startsWith("FY");
          const currIsFY = ap.label.startsWith("FY");
          const priorVal = aggVals[prior.id];
          const currVal = aggVals[ap.id];
          cells[ap.id] = (priorIsFY && currIsFY && priorVal !== 0)
            ? (currVal - priorVal) / Math.abs(priorVal)
            : NaN;
        }
        return cells;
      })() },
    });
    sectionRows.push({ id: `${prefix}s2`, type: "spacer", cells: {} });

    // -- % of denominator --
    sectionRows.push({ id: `${prefix}hdr-pct`, type: "section-header", label: pctLabel, cells: { label: pctLabel, ...ec } });
    for (const e of entries) {
      sectionRows.push({
        id: `${prefix}pct-${e.accountId}`,
        type: "data" as const,
        format: "percent",
        indent: 1,
        cells: {
          label: e.accountName, ...ec,
          // Negate numerator if sign=-1 so that e.g. revenue/|revenue| = +1 = 100%
          ...mc(p => (e.balances[p] || 0) * sign, pctDenFn),
        },
      });
    }
    sectionRows.push({
      id: `${prefix}pct-total`, type: "subtotal", format: "percent",
      cells: {
        label: `Total ${title}`, ...ec,
        ...mc(p => calc.sumByLineItem(tb, lineItem, p) * sign, pctDenFn),
      },
    });
    sectionRows.push({ id: `${prefix}s3`, type: "spacer", cells: {} });

    // -- Check --
    sectionRows.push({ id: `${prefix}hdr-check`, type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } });
    sectionRows.push({
      id: `${prefix}check`, type: "check", checkPassed: true,
      cells: {
        label: "Check to IS (should = 0)", ...ec,
        ...pc(p => {
          const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
          const isTotal = calc.sumByLineItem(tb, lineItem, p);
          return Math.abs(total - isTotal) < 0.01 ? 0 : total - isTotal;
        }),
      },
    });

    return sectionRows;
  };

  const rows: GridRow[] = [
    ...buildSection(`${title} - reported`, false),
    { id: "section-divider", type: "spacer", cells: {} },
    ...buildSection(`${title} - adjusted`, true),
  ];

  return { columns, rows, frozenColumns };
}
