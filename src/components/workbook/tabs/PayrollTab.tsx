import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { periodCells, entryCells, marginCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

/**
 * Custom Payroll tab matching Excel structure:
 * - Sub-items: Officer's salary, Salary and wages, Payroll taxes, Benefits
 * - % of total Wages section
 * - Check to Operating Expenses tab
 */
export function PayrollTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const entries = calc.getEntriesByLineItem(tb, "Payroll & Related");
    const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
    const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);

    const totalPayroll = (p: string) => calc.calcPayroll(tb, p);
    const totalRevenue = (p: string) => calc.calcRevenue(tb, p);

    const columns: GridData["columns"] = [
      { key: "label", label: "Payroll & Related", width: 280, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const ec = { acctNo: "", fsLine: "", sub1: "" };

    const rows: GridRow[] = [
      // Reported section
      { id: "hdr-reported", type: "section-header", label: "Payroll & Related - reported", cells: { label: "Payroll & Related - reported", ...ec } },
      ...entries.map(e => ({
        id: `rpt-${e.accountId}`, type: "data" as const, indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1, ...entryCells(dealData, e.balances) },
      })),
      { id: "total-reported", type: "total", cells: { label: "Total Payroll & Related", ...ec, ...pc(totalPayroll) } },
      { id: "s1", type: "spacer", cells: {} },

      // Change section
      { id: "hdr-change", type: "section-header", label: "Change in Payroll", cells: { label: "Change in Payroll", ...ec } },
      { id: "change-dollar", type: "data", cells: { label: "$ Amount", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells: Record<string, number> = {};
        for (let i = 0; i < periods.length; i++) {
          cells[periods[i].id] = i === 0 ? 0 : totalPayroll(periods[i].id) - totalPayroll(periods[i - 1].id);
        }
        // Aggregate YoY: pre-compute totals per aggregate period
        const aggVals: Record<string, number> = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + totalPayroll(pid), 0);
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) { cells[ap.id] = 0; continue; }
          const prior = aggregatePeriods[i - 1];
          cells[ap.id] = (prior.label.startsWith("FY") && ap.label.startsWith("FY"))
            ? aggVals[ap.id] - aggVals[prior.id]
            : 0;
        }
        return cells;
      })() } },
      { id: "change-pct", type: "data", format: "percent" as const, cells: { label: "% Change", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells: Record<string, number> = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) { cells[periods[i].id] = NaN; continue; }
          const prior = totalPayroll(periods[i - 1].id);
          cells[periods[i].id] = prior === 0 ? NaN : (totalPayroll(periods[i].id) - prior) / Math.abs(prior);
        }
        // Aggregate YoY
        const aggVals: Record<string, number> = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + totalPayroll(pid), 0);
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) { cells[ap.id] = NaN; continue; }
          const prior = aggregatePeriods[i - 1];
          const priorVal = aggVals[prior.id];
          const currVal = aggVals[ap.id];
          cells[ap.id] = (prior.label.startsWith("FY") && ap.label.startsWith("FY") && priorVal !== 0)
            ? (currVal - priorVal) / Math.abs(priorVal)
            : NaN;
        }
        return cells;
      })() } },
      { id: "s2", type: "spacer", cells: {} },

      // % of Revenue
      { id: "hdr-pct-rev", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
      ...entries.map(e => ({
        id: `pct-rev-${e.accountId}`, type: "data" as const, indent: 1, format: "percent" as const,
        cells: { label: e.accountName, ...ec, ...mc(p => e.balances[p] || 0, totalRevenue) },
      })),
      { id: "pct-rev-total", type: "subtotal", format: "percent" as const, cells: { label: "Total Payroll as % of Revenue", ...ec, ...mc(totalPayroll, totalRevenue) } },
      { id: "s3", type: "spacer", cells: {} },

      // % of total Wages
      { id: "hdr-pct-wages", type: "section-header", label: "% of total Wages", cells: { label: "% of total Wages", ...ec } },
      ...entries.map(e => ({
        id: `pct-wage-${e.accountId}`, type: "data" as const, indent: 1, format: "percent" as const,
        cells: { label: e.accountName, ...ec, ...mc(p => e.balances[p] || 0, totalPayroll) },
      })),
      { id: "s4", type: "spacer", cells: {} },

      // Check
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } },
      { id: "check", type: "check", checkPassed: true, cells: {
        label: "Check to Operating Expenses (should = 0)", ...ec,
        ...pc(p => {
          const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
          const isTotal = calc.sumByLineItem(tb, "Payroll & Related", p);
          return Math.abs(total - isTotal) < 0.01 ? 0 : total - isTotal;
        }),
      } },
    ];

    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
