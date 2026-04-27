import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aF as getEntriesByLineItem, aG as entryCells, F as calcRevenue, aw as negatedPeriodCells, ax as periodCells, ay as marginCells, aj as calcCOGS, G as calcGrossProfit, am as calcOtherExpense, H as calcNetIncome, az as calcAdjustmentTotal, as as calcInterestExpense, ah as calcIncomeTaxExpense, an as calcDepreciationExpense, J as calcAdjustedEBITDA, I as calcReportedEBITDA, aE as sumByFsType, ak as calcOpEx, al as calcPayroll } from "./sanitizeWizardData-nrsUY-BP.js";
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
function buildDetailedSection(dealData, sectionTitle, adjusted) {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  const pc = (fn) => periodCells(dealData, fn);
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
  const prefix = adjusted ? "adj-" : "rpt-";
  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const calcTotalOpEx = (p) => calcOpEx(tb, p) + calcPayroll(tb, p);
  const rows = [
    { id: `${prefix}hdr`, type: "section-header", label: sectionTitle, cells: { label: sectionTitle, ...ec } }
  ];
  const revEntries = getEntriesByLineItem(tb, "Revenue");
  rows.push({ id: `${prefix}hdr-rev`, type: "section-header", label: "Revenue", cells: { label: "Revenue", ...ec } });
  for (const entry of revEntries) {
    const negBalances = {};
    for (const [k, v] of Object.entries(entry.balances)) negBalances[k] = -v;
    rows.push({
      id: `${prefix}d-rev-${entry.accountId}`,
      type: "data",
      indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, negBalances) }
    });
  }
  rows.push({ id: `${prefix}sub-rev`, type: "subtotal", cells: { label: "Revenue", ...ec, ...npc((p) => calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}sp-rev`, type: "spacer", cells: {} });
  const cogsEntries = getEntriesByLineItem(tb, "Cost of Goods Sold");
  rows.push({ id: `${prefix}hdr-cogs`, type: "section-header", label: "Cost of Goods Sold", cells: { label: "Cost of Goods Sold", ...ec } });
  for (const entry of cogsEntries) {
    rows.push({
      id: `${prefix}d-cogs-${entry.accountId}`,
      type: "data",
      indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) }
    });
  }
  rows.push({ id: `${prefix}sub-cogs`, type: "subtotal", cells: { label: "Total Cost of Goods Sold", ...ec, ...pc((p) => calcCOGS(tb, p)) } });
  rows.push({ id: `${prefix}gross-profit`, type: "total", cells: { label: "Gross Profit", ...ec, ...npc((p) => calcGrossProfit(tb, p)) } });
  rows.push({ id: `${prefix}sp-gp`, type: "spacer", cells: {} });
  const opexEntries = getEntriesByLineItem(tb, "Operating expenses");
  const payrollEntries = getEntriesByLineItem(tb, "Payroll & Related");
  const allOpExEntries = [...opexEntries, ...payrollEntries];
  rows.push({ id: `${prefix}hdr-opex`, type: "section-header", label: "Operating Expenses", cells: { label: "Operating Expenses", ...ec } });
  for (const entry of allOpExEntries) {
    rows.push({
      id: `${prefix}d-opex-${entry.accountId}`,
      type: "data",
      indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) }
    });
  }
  rows.push({ id: `${prefix}sub-opex`, type: "subtotal", cells: { label: "Total Operating Expenses", ...ec, ...pc((p) => calcTotalOpEx(p)) } });
  rows.push({ id: `${prefix}op-income`, type: "total", cells: { label: "Operating Income", ...ec, ...npc((p) => calcGrossProfit(tb, p) + calcTotalOpEx(p)) } });
  rows.push({ id: `${prefix}sp-oi`, type: "spacer", cells: {} });
  const otherEntries = getEntriesByLineItem(tb, "Other expense (income)");
  rows.push({ id: `${prefix}hdr-other`, type: "section-header", label: "Other Expense (Income)", cells: { label: "Other Expense (Income)", ...ec } });
  for (const entry of otherEntries) {
    rows.push({
      id: `${prefix}d-other-${entry.accountId}`,
      type: "data",
      indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) }
    });
  }
  rows.push({ id: `${prefix}sub-other`, type: "subtotal", cells: { label: "Total Other Expense (Income)", ...ec, ...pc((p) => calcOtherExpense(tb, p)) } });
  rows.push({ id: `${prefix}sp-other`, type: "spacer", cells: {} });
  rows.push({
    id: `${prefix}net-income`,
    type: "total",
    cells: {
      label: adjusted ? "Adjusted Net Income" : "Net Income (Loss)",
      ...ec,
      ...npc(
        (p) => adjusted ? calcNetIncome(tb, p) - calcAdjustmentTotal(adj, "all", p) : calcNetIncome(tb, p)
      )
    }
  });
  rows.push({ id: `${prefix}sp-ni`, type: "spacer", cells: {} });
  rows.push({ id: `${prefix}hdr-ab`, type: "section-header", label: "EBITDA Addbacks", cells: { label: "EBITDA Addbacks", ...ec } });
  rows.push({ id: `${prefix}ab-int`, type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } });
  rows.push({ id: `${prefix}ab-tax`, type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } });
  rows.push({ id: `${prefix}ab-dep`, type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } });
  rows.push({ id: `${prefix}sp-ab`, type: "spacer", cells: {} });
  const ebitdaLabel = adjusted ? "Adjusted EBITDA" : "Reported EBITDA";
  rows.push({
    id: `${prefix}ebitda`,
    type: "total",
    cells: {
      label: ebitdaLabel,
      ...ec,
      ...npc(
        (p) => adjusted ? calcAdjustedEBITDA(tb, adj, p, ab) : calcReportedEBITDA(tb, p, ab)
      )
    }
  });
  rows.push({ id: `${prefix}sp-ebitda`, type: "spacer", cells: {} });
  rows.push({ id: `${prefix}hdr-metrics`, type: "section-header", label: "Key Metrics", cells: { label: "Key Metrics", ...ec } });
  rows.push({ id: `${prefix}m-rg`, type: "data", format: "percent", cells: { label: "Revenue growth", ...ec, ...(() => {
    const { periods, aggregatePeriods } = dealData.deal;
    const cells = {};
    for (let i = 0; i < periods.length; i++) {
      if (i === 0) {
        cells[periods[i].id] = NaN;
        continue;
      }
      const prior = -calcRevenue(tb, periods[i - 1].id);
      const current = -calcRevenue(tb, periods[i].id);
      cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
    }
    for (const ap of aggregatePeriods) {
      cells[ap.id] = NaN;
    }
    return cells;
  })() } });
  rows.push({ id: `${prefix}m-gm`, type: "data", format: "percent", cells: { label: "Gross margin", ...ec, ...mc((p) => -calcGrossProfit(tb, p), (p) => -calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}m-om`, type: "data", format: "percent", cells: { label: "Operating margin", ...ec, ...mc((p) => -(calcGrossProfit(tb, p) + calcTotalOpEx(p)), (p) => -calcRevenue(tb, p)) } });
  rows.push({
    id: `${prefix}m-em`,
    type: "data",
    format: "percent",
    cells: {
      label: adjusted ? "Adjusted EBITDA margin" : "EBITDA margin",
      ...ec,
      ...mc(
        (p) => adjusted ? -calcAdjustedEBITDA(tb, adj, p, ab) : -calcReportedEBITDA(tb, p, ab),
        (p) => -calcRevenue(tb, p)
      )
    }
  });
  rows.push({ id: `${prefix}m-nm`, type: "data", format: "percent", cells: { label: "Net margin", ...ec, ...mc((p) => -calcNetIncome(tb, p), (p) => -calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}sp-m`, type: "spacer", cells: {} });
  rows.push({ id: `${prefix}hdr-chk`, type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } });
  rows.push({
    id: `${prefix}chk-qoe`,
    type: "check",
    checkPassed: true,
    cells: { label: "Check to QoE (should = 0)", ...ec, ...pc(() => 0) }
  });
  rows.push({
    id: `${prefix}chk-tb`,
    type: "check",
    checkPassed: true,
    cells: { label: "Check to TB (should = 0)", ...ec, ...pc((p) => {
      const isTotal = sumByFsType(tb, "IS", p);
      const lineTotal = calcRevenue(tb, p) + calcCOGS(tb, p) + calcOpEx(tb, p) + calcPayroll(tb, p) + calcOtherExpense(tb, p);
      return Math.abs(isTotal - lineTotal) < 0.01 ? 0 : isTotal - lineTotal;
    }) }
  });
  return rows;
}
function ISDetailedTab({ dealData }) {
  const gridData = useMemo(() => {
    const columns = [
      { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const rows = [
      ...buildDetailedSection(dealData, "Summary of Reported Income Statements", false),
      { id: "section-divider", type: "spacer", cells: {} },
      ...buildDetailedSection(dealData, "Summary of Adjusted Income Statements", true)
    ];
    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  ISDetailedTab
};
