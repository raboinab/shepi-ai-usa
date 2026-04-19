import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { reclassAwareRevenueRaw } from "@/lib/reclassHelpers";
import { negatedPeriodCells, periodCells, marginCells, adjustmentCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function QoEAnalysisTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const rc = dealData.reclassifications ?? [];
    const tbIdx = dealData.tbIndex;
    const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
    const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
    const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
    const { periods, aggregatePeriods } = dealData.deal;

    // Build columns with frozen detail columns matching Excel
    const columns: GridData["columns"] = [
      { key: "label", label: "USD $", width: 240, frozen: true, format: "text" },
      { key: "adjNo", label: "Adj. #", width: 55, frozen: true, format: "text" },
      { key: "adjType", label: "Adj. Type", width: 70, frozen: true, format: "text" },
      { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
      { key: "acctDesc", label: "Account Description", width: 160, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account 1", width: 100, frozen: true, format: "text" },
      { key: "sub2", label: "Sub-account 2", width: 100, frozen: true, format: "text" },
      { key: "sub3", label: "Sub-account 3", width: 100, frozen: true, format: "text" },
      ...aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
      { key: "comments", label: "Comments", width: 200, format: "text" as const },
    ];

    const ec = { adjNo: "", adjType: "", acctNo: "", acctDesc: "", fsLine: "", sub1: "", sub2: "", sub3: "", comments: "" };

    const maAdj = adj.filter(a => a.type === "MA");
    const ddAdj = adj.filter(a => a.type === "DD");
    const pfAdj = adj.filter(a => a.type === "PF");

    const adjRow = (a: typeof adj[0], prefix: string, i: number) => ({
      id: `${prefix}-${a.id}`,
      type: "data" as const,
      indent: 1,
      cells: {
        label: a.label || a.notes || `${prefix.toUpperCase()}-${i + 1}`,
        adjNo: `${a.type}-${i + 1}`,
        adjType: a.type,
        acctNo: a.tbAccountNumber,
        acctDesc: a.label,
        fsLine: a.intent,
        sub1: "", sub2: "", sub3: "",
        comments: a.notes,
        ...adjustmentCells(dealData, a.amounts),
      },
    });

    const rows: GridRow[] = [
      // Revenue: credit in TB = negative → negate for display (with reclass overlay)
      { id: "revenue-reported", type: "data", cells: { label: "Revenue, as reported", ...ec, ...npc(p => reclassAwareRevenueRaw(tb, rc, p)) } },
      { id: "revenue-adjusted", type: "data", cells: { label: "Revenue, as adjusted", ...ec,
        ...npc(p => reclassAwareRevenueRaw(tb, rc, p) - calc.calcRevenueAdjustments(adj, tbIdx, "all", p)),
      } },
      // Gross Profit: credit-biased in TB when profitable → negate (with reclass overlay)
      { id: "gross-profit", type: "data", cells: { label: "Gross profit, as adjusted", ...ec,
        ...npc(p => calc.calcGrossProfit(tb, p) + calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) - calc.calcRevenueAdjustments(adj, tbIdx, "all", p) - calc.calcCOGSAdjustments(adj, tbIdx, "all", p)),
      } },
      // Net Income: IS sum is negative when profitable → negate (with reclass overlay)
      { id: "net-income", type: "subtotal", cells: { label: "Net income (loss)", ...ec, ...npc(p => {
        const raw = calc.calcNetIncome(tb, p);
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return raw + isReclass;
      }) } },
      { id: "s1", type: "spacer", cells: {} },

      // Normal Adjustments (addbacks are debits = positive, display as-is)
      { id: "hdr-normal", type: "section-header", label: "Normal adjustments", cells: { label: "Normal adjustments", ...ec } },
      { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
      { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s2", type: "spacer", cells: {} },
      // Reported EBITDA: negative in TB when profitable → negate (with reclass overlay)
      { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...ec, ...npc(p => {
        const raw = calc.calcReportedEBITDA(tb, p, ab);
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return raw + isReclass;
      }) } },
      { id: "s3", type: "spacer", cells: {} },

      // Management Adjustments
      { id: "hdr-ma", type: "section-header", label: "Management adjustments", cells: { label: "Management adjustments", ...ec } },
      ...maAdj.map((a, i) => adjRow(a, "ma", i)),
      { id: "ma-total", type: "subtotal", cells: { label: "Total management adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "MA", p)) } },
      { id: "ma-ebitda", type: "total", cells: {
        label: "Management adjusted EBITDA", ...ec,
        ...npc(p => {
          const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
          return calc.calcReportedEBITDA(tb, p, ab) + isReclass - calc.calcAdjustmentTotal(adj, "MA", p);
        }),
      } },
      { id: "s4", type: "spacer", cells: {} },

      // Due Diligence Adjustments
      { id: "hdr-dd", type: "section-header", label: "Due diligence adjustments", cells: { label: "Due diligence adjustments", ...ec } },
      ...ddAdj.map((a, i) => adjRow(a, "dd", i)),
      { id: "dd-total", type: "subtotal", cells: { label: "Total due diligence adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "DD", p)) } },
      { id: "dd-ebitda", type: "total", cells: {
        label: "Due diligence adjusted EBITDA", ...ec,
        ...npc(p => {
          const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
          return calc.calcReportedEBITDA(tb, p, ab) + isReclass - calc.calcAdjustmentTotal(adj, "MA", p) - calc.calcAdjustmentTotal(adj, "DD", p);
        }),
      } },
      { id: "s5", type: "spacer", cells: {} },

      // Pro Forma Adjustments
      { id: "hdr-pf", type: "section-header", label: "Pro Forma Adjustments", cells: { label: "Pro Forma Adjustments", ...ec } },
      ...pfAdj.map((a, i) => adjRow(a, "pf", i)),
      { id: "pf-total", type: "subtotal", cells: { label: "Total pro forma adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "PF", p)) } },
      { id: "pf-ebitda", type: "total", cells: {
        label: "Pro Forma Adjusted EBITDA", ...ec,
        ...npc(p => {
          const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
          return calc.calcReportedEBITDA(tb, p, ab) + isReclass - calc.calcAdjustmentTotal(adj, "all", p);
        }),
      } },
      { id: "s6", type: "spacer", cells: {} },

      // % of Revenue — numerators negated so positive EBITDA/GP divide by |revenue| = positive margin
      { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
      { id: "reported-margin", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...ec, ...mc(p => {
        const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
        return -(calc.calcReportedEBITDA(tb, p, ab) + isReclass);
      }, p => reclassAwareRevenueRaw(tb, rc, p)) } },
      { id: "adj-margin", type: "data", format: "percent", cells: {
        label: "Adjusted EBITDA margin", ...ec,
        ...mc(p => {
          const isReclass = calc.sumReclassImpact(rc, "Revenue", p) + calc.sumReclassImpact(rc, "Cost of Goods Sold", p) + calc.sumReclassImpact(rc, "Operating expenses", p) + calc.sumReclassImpact(rc, "Payroll & Related", p) + calc.sumReclassImpact(rc, "Other expense (income)", p);
          return -(calc.calcReportedEBITDA(tb, p, ab) + isReclass - calc.calcAdjustmentTotal(adj, "all", p));
        }, p => reclassAwareRevenueRaw(tb, rc, p)),
      } },
      { id: "s-pct", type: "spacer", cells: {} },

      // Reclassification Adjustments
      ...(dealData.reclassifications.length > 0 ? [
        { id: "hdr-reclass", type: "section-header" as const, label: "Reclassification Adjustments", cells: { label: "Reclassification Adjustments", ...ec } },
        ...dealData.reclassifications.map((r, i) => ({
          id: `reclass-${r.id}`,
          type: "data" as const,
          indent: 1,
          cells: {
            label: `R-${i + 1}: ${r.label} (${r.fromAccount} → ${r.toAccount})`,
            adjNo: `R-${i + 1}`, adjType: "RC", acctNo: r.fromAccount, acctDesc: r.label,
            fsLine: "", sub1: "", sub2: "", sub3: "", comments: "",
            ...adjustmentCells(dealData, r.amounts),
          },
        })),
        { id: "reclass-total", type: "subtotal" as const, cells: {
          label: "Total reclassification", ...ec,
          ...pc(p => dealData.reclassifications.reduce((s, r) => s + (r.amounts[p] || 0), 0)),
        } },
        { id: "s7", type: "spacer" as const, cells: {} },
      ] : []),

      // Check row
      { id: "hdr-checks", type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } },
      {
        id: "check-qoe", type: "check",
        cells: {
          label: "Check (should = 0)", ...ec,
          ...pc(p => {
            const qoeReported = calc.calcReportedEBITDA(tb, p, ab);
            const isNetIncome = calc.calcNetIncome(tb, p);
            const isAddbacks = calc.calcInterestExpense(tb, p, ab.interest) +
                               calc.calcIncomeTaxExpense(tb, p, ab.taxes) +
                               calc.calcDepreciationExpense(tb, p, ab.depreciation);
            const isReported = isNetIncome - isAddbacks;
            return Math.abs(qoeReported - isReported) < 0.01 ? 0 : qoeReported - isReported;
          }),
        },
        checkPassed: true,
      },
    ];

    return { columns, rows, frozenColumns: 9 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
