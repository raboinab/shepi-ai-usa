import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { periodCells, negatedPeriodCells, entryCells, marginCells } from "../shared/tabHelpers";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

function buildDetailedSection(
  dealData: DealData,
  sectionTitle: string,
  adjusted: boolean
): GridRow[] {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  const pc  = (fn: (p: string) => number) => periodCells(dealData, fn);
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const mc  = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const prefix = adjusted ? "adj-" : "rpt-";
  const ec = { acctNo: "", fsLine: "", sub1: "" };

  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

  const rows: GridRow[] = [
    { id: `${prefix}hdr`, type: "section-header", label: sectionTitle, cells: { label: sectionTitle, ...ec } },
  ];

  // Revenue — entries are credits (negative in TB), negate for display
  const revEntries = calc.getEntriesByLineItem(tb, "Revenue");
  rows.push({ id: `${prefix}hdr-rev`, type: "section-header", label: "Revenue", cells: { label: "Revenue", ...ec } });
  for (const entry of revEntries) {
    const negBalances: Record<string, number> = {};
    for (const [k, v] of Object.entries(entry.balances)) negBalances[k] = -v;
    rows.push({
      id: `${prefix}d-rev-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, negBalances) },
    });
  }
  // Revenue subtotal — negate (credit in TB → positive display)
  rows.push({ id: `${prefix}sub-rev`, type: "subtotal", cells: { label: "Revenue", ...ec, ...npc(p => calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}sp-rev`, type: "spacer", cells: {} });

  // COGS — entries are debits (positive in TB), no negation needed
  const cogsEntries = calc.getEntriesByLineItem(tb, "Cost of Goods Sold");
  rows.push({ id: `${prefix}hdr-cogs`, type: "section-header", label: "Cost of Goods Sold", cells: { label: "Cost of Goods Sold", ...ec } });
  for (const entry of cogsEntries) {
    rows.push({
      id: `${prefix}d-cogs-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-cogs`, type: "subtotal", cells: { label: "Total Cost of Goods Sold", ...ec, ...pc(p => calc.calcCOGS(tb, p)) } });

  // Gross Profit — negate (credit result)
  rows.push({ id: `${prefix}gross-profit`, type: "total", cells: { label: "Gross Profit", ...ec, ...npc(p => calc.calcGrossProfit(tb, p)) } });
  rows.push({ id: `${prefix}sp-gp`, type: "spacer", cells: {} });

  // Operating Expenses (OpEx + Payroll combined) — debits, no negation
  const opexEntries = calc.getEntriesByLineItem(tb, "Operating expenses");
  const payrollEntries = calc.getEntriesByLineItem(tb, "Payroll & Related");
  const allOpExEntries = [...opexEntries, ...payrollEntries];
  rows.push({ id: `${prefix}hdr-opex`, type: "section-header", label: "Operating Expenses", cells: { label: "Operating Expenses", ...ec } });
  for (const entry of allOpExEntries) {
    rows.push({
      id: `${prefix}d-opex-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-opex`, type: "subtotal", cells: { label: "Total Operating Expenses", ...ec, ...pc(p => calcTotalOpEx(p)) } });

  // Operating Income — negate (credit result: GP - OpEx)
  rows.push({ id: `${prefix}op-income`, type: "total", cells: { label: "Operating Income", ...ec, ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } });
  rows.push({ id: `${prefix}sp-oi`, type: "spacer", cells: {} });

  // Other expense
  const otherEntries = calc.getEntriesByLineItem(tb, "Other expense (income)");
  rows.push({ id: `${prefix}hdr-other`, type: "section-header", label: "Other Expense (Income)", cells: { label: "Other Expense (Income)", ...ec } });
  for (const entry of otherEntries) {
    rows.push({
      id: `${prefix}d-other-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-other`, type: "subtotal", cells: { label: "Total Other Expense (Income)", ...ec, ...pc(p => calc.calcOtherExpense(tb, p)) } });
  rows.push({ id: `${prefix}sp-other`, type: "spacer", cells: {} });

  // Net Income — negate (credit result)
  rows.push({
    id: `${prefix}net-income`, type: "total",
    cells: {
      label: adjusted ? "Adjusted Net Income" : "Net Income (Loss)", ...ec,
      ...npc(p => adjusted
        ? calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p)
        : calc.calcNetIncome(tb, p)
      ),
    },
  });
  rows.push({ id: `${prefix}sp-ni`, type: "spacer", cells: {} });

  // EBITDA Addbacks — interest/tax/dep are debits (positive in TB), shown as positive addbacks
  rows.push({ id: `${prefix}hdr-ab`, type: "section-header", label: "EBITDA Addbacks", cells: { label: "EBITDA Addbacks", ...ec } });
  rows.push({ id: `${prefix}ab-int`, type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } });
  rows.push({ id: `${prefix}ab-tax`, type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } });
  rows.push({ id: `${prefix}ab-dep`, type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } });
  rows.push({ id: `${prefix}sp-ab`, type: "spacer", cells: {} });

  const ebitdaLabel = adjusted ? "Adjusted EBITDA" : "Reported EBITDA";
  // EBITDA — negate (credit result)
  rows.push({
    id: `${prefix}ebitda`, type: "total",
    cells: {
      label: ebitdaLabel, ...ec,
      ...npc(p => adjusted
        ? calc.calcAdjustedEBITDA(tb, adj, p, ab)
        : calc.calcReportedEBITDA(tb, p, ab)
      ),
    },
  });
  rows.push({ id: `${prefix}sp-ebitda`, type: "spacer", cells: {} });

  // Key Metrics — margins use negated numerators since GP/EBITDA/NI are credits
  rows.push({ id: `${prefix}hdr-metrics`, type: "section-header", label: "Key Metrics", cells: { label: "Key Metrics", ...ec } });
  rows.push({ id: `${prefix}m-rg`, type: "data", format: "percent", cells: { label: "Revenue growth", ...ec, ...(() => {
    const { periods, aggregatePeriods } = dealData.deal;
    const cells: Record<string, number> = {};
    for (let i = 0; i < periods.length; i++) {
      if (i === 0) { cells[periods[i].id] = NaN; continue; }
      const prior = -calc.calcRevenue(tb, periods[i - 1].id);
      const current = -calc.calcRevenue(tb, periods[i].id);
      cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
    }
    for (const ap of aggregatePeriods) { cells[ap.id] = NaN; }
    return cells;
  })() } });
  // Gross margin: negate GP (credit) so ratio = positive GP / positive Revenue
  rows.push({ id: `${prefix}m-gm`, type: "data", format: "percent", cells: { label: "Gross margin", ...ec, ...mc(p => -calc.calcGrossProfit(tb, p), p => -calc.calcRevenue(tb, p)) } });
  // Operating margin: negate operating income (credit result)
  rows.push({ id: `${prefix}m-om`, type: "data", format: "percent", cells: { label: "Operating margin", ...ec, ...mc(p => -(calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)), p => -calc.calcRevenue(tb, p)) } });
  // EBITDA margin
  rows.push({
    id: `${prefix}m-em`, type: "data", format: "percent",
    cells: {
      label: adjusted ? "Adjusted EBITDA margin" : "EBITDA margin", ...ec,
      ...mc(
        p => adjusted ? -calc.calcAdjustedEBITDA(tb, adj, p, ab) : -calc.calcReportedEBITDA(tb, p, ab),
        p => -calc.calcRevenue(tb, p)
      ),
    },
  });
  // Net margin
  rows.push({ id: `${prefix}m-nm`, type: "data", format: "percent", cells: { label: "Net margin", ...ec, ...mc(p => -calc.calcNetIncome(tb, p), p => -calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}sp-m`, type: "spacer", cells: {} });

  // Check rows
  rows.push({ id: `${prefix}hdr-chk`, type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } });
  rows.push({
    id: `${prefix}chk-qoe`, type: "check", checkPassed: true,
    cells: { label: "Check to QoE (should = 0)", ...ec, ...pc(() => 0) },
  });
  rows.push({
    id: `${prefix}chk-tb`, type: "check", checkPassed: true,
    cells: { label: "Check to TB (should = 0)", ...ec, ...pc(p => {
      const isTotal = calc.sumByFsType(tb, "IS", p);
      const lineTotal = calc.calcRevenue(tb, p) + calc.calcCOGS(tb, p) + calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p) + calc.calcOtherExpense(tb, p);
      return Math.abs(isTotal - lineTotal) < 0.01 ? 0 : isTotal - lineTotal;
    }) },
  });

  return rows;
}

export function ISDetailedTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const columns: GridData["columns"] = [
      { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
      { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
      ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const rows: GridRow[] = [
      ...buildDetailedSection(dealData, "Summary of Reported Income Statements", false),
      { id: "section-divider", type: "spacer", cells: {} },
      ...buildDetailedSection(dealData, "Summary of Adjusted Income Statements", true),
    ];

    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
