import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aF as getEntriesByLineItem, aG as entryCells, ax as periodCells, al as calcPayroll, ay as marginCells, N as sumByLineItem, F as calcRevenue } from "./sanitizeWizardData-nrsUY-BP.js";
import "@tanstack/react-virtual";
import "../main.mjs";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
function PayrollTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const entries = getEntriesByLineItem(tb, "Payroll & Related");
    const pc = (fn) => periodCells(dealData, fn);
    const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
    const totalPayroll = (p) => calcPayroll(tb, p);
    const totalRevenue = (p) => calcRevenue(tb, p);
    const columns = [
      { key: "label", label: "Payroll & Related", width: 280, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const ec = { acctNo: "", fsLine: "", sub1: "" };
    const rows = [
      // Reported section
      { id: "hdr-reported", type: "section-header", label: "Payroll & Related - reported", cells: { label: "Payroll & Related - reported", ...ec } },
      ...entries.map((e) => ({
        id: `rpt-${e.accountId}`,
        type: "data",
        indent: 1,
        cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1, ...entryCells(dealData, e.balances) }
      })),
      { id: "total-reported", type: "total", cells: { label: "Total Payroll & Related", ...ec, ...pc(totalPayroll) } },
      { id: "s1", type: "spacer", cells: {} },
      // Change section
      { id: "hdr-change", type: "section-header", label: "Change in Payroll", cells: { label: "Change in Payroll", ...ec } },
      { id: "change-dollar", type: "data", cells: { label: "$ Amount", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells = {};
        for (let i = 0; i < periods.length; i++) {
          cells[periods[i].id] = i === 0 ? 0 : totalPayroll(periods[i].id) - totalPayroll(periods[i - 1].id);
        }
        const aggVals = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + totalPayroll(pid), 0);
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) {
            cells[ap.id] = 0;
            continue;
          }
          const prior = aggregatePeriods[i - 1];
          cells[ap.id] = prior.label.startsWith("FY") && ap.label.startsWith("FY") ? aggVals[ap.id] - aggVals[prior.id] : 0;
        }
        return cells;
      })() } },
      { id: "change-pct", type: "data", format: "percent", cells: { label: "% Change", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            cells[periods[i].id] = NaN;
            continue;
          }
          const prior = totalPayroll(periods[i - 1].id);
          cells[periods[i].id] = prior === 0 ? NaN : (totalPayroll(periods[i].id) - prior) / Math.abs(prior);
        }
        const aggVals = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + totalPayroll(pid), 0);
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) {
            cells[ap.id] = NaN;
            continue;
          }
          const prior = aggregatePeriods[i - 1];
          const priorVal = aggVals[prior.id];
          const currVal = aggVals[ap.id];
          cells[ap.id] = prior.label.startsWith("FY") && ap.label.startsWith("FY") && priorVal !== 0 ? (currVal - priorVal) / Math.abs(priorVal) : NaN;
        }
        return cells;
      })() } },
      { id: "s2", type: "spacer", cells: {} },
      // % of Revenue
      { id: "hdr-pct-rev", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
      ...entries.map((e) => ({
        id: `pct-rev-${e.accountId}`,
        type: "data",
        indent: 1,
        format: "percent",
        cells: { label: e.accountName, ...ec, ...mc((p) => e.balances[p] || 0, totalRevenue) }
      })),
      { id: "pct-rev-total", type: "subtotal", format: "percent", cells: { label: "Total Payroll as % of Revenue", ...ec, ...mc(totalPayroll, totalRevenue) } },
      { id: "s3", type: "spacer", cells: {} },
      // % of total Wages
      { id: "hdr-pct-wages", type: "section-header", label: "% of total Wages", cells: { label: "% of total Wages", ...ec } },
      ...entries.map((e) => ({
        id: `pct-wage-${e.accountId}`,
        type: "data",
        indent: 1,
        format: "percent",
        cells: { label: e.accountName, ...ec, ...mc((p) => e.balances[p] || 0, totalPayroll) }
      })),
      { id: "s4", type: "spacer", cells: {} },
      // Check
      { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } },
      { id: "check", type: "check", checkPassed: true, cells: {
        label: "Check to Operating Expenses (should = 0)",
        ...ec,
        ...pc((p) => {
          const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
          const isTotal = sumByLineItem(tb, "Payroll & Related", p);
          return Math.abs(total - isTotal) < 0.01 ? 0 : total - isTotal;
        })
      } }
    ];
    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  PayrollTab
};
