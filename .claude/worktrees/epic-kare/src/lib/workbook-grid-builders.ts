/**
 * Pure grid-building functions extracted from tab components.
 * Each function takes DealData and returns GridData — no React dependency.
 * Used by the XLSX export to generate worksheets matching the on-screen workbook.
 */
import type { DealData, GridData, GridRow, GridColumn } from "./workbook-types";
import * as calc from "./calculations";
import {
  buildStandardColumns,
  periodCells,
  negatedPeriodCells,
  marginCells,
  entryCells,
  adjustmentCells,
  bsEndingBalanceCells,
  negatedBsEndingBalanceCells,
  bsEntryCells,
} from "@/components/workbook/shared/tabHelpers";
import { buildBreakdownGrid } from "@/components/workbook/shared/breakdownGridBuilder";

// ── Setup Tab ───────────────────────────────────────────────────────────
export function buildSetupGrid(dealData: DealData): GridData {
  const info = dealData.deal;
  const regular = info.periods.filter(p => !p.isStub);
  const stubs = info.periods.filter(p => p.isStub);
  const periodLabel = stubs.length > 0
    ? `${regular.length} months + ${stubs.length} stub${stubs.length > 1 ? "s" : ""}`
    : `${regular.length} months`;
  const allDates = info.periods.map(p => p.date).filter(Boolean);
  const reviewPeriod = allDates.length > 0
    ? `${allDates[0].toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${allDates[allDates.length - 1].toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : "None";

  const rows: GridRow[] = [
    { id: "r0", type: "data", cells: { label: "Project Name", value: info.projectName } },
    { id: "r1", type: "data", cells: { label: "Client / Firm", value: info.clientName } },
    { id: "r2", type: "data", cells: { label: "Target Company", value: info.targetCompany } },
    { id: "r3", type: "data", cells: { label: "Industry", value: info.industry } },
    { id: "r4", type: "data", cells: { label: "Transaction Type", value: info.transactionType ? info.transactionType.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") : "" } },
    { id: "r5", type: "data", cells: { label: "Fiscal Year End", value: `Month ${info.fiscalYearEnd}` } },
    { id: "r6", type: "data", cells: { label: "Periods", value: periodLabel } },
    { id: "r7", type: "data", cells: { label: "Period Range", value: info.periods.length > 0 ? `${info.periods[0].label} – ${info.periods[info.periods.length - 1].label}` : "None" } },
    { id: "r8", type: "data", cells: { label: "Review Period", value: reviewPeriod } },
  ];

  return {
    columns: [
      { key: "label", label: "Field", width: 200, frozen: true, format: "text" },
      { key: "value", label: "Value", width: 300, format: "text" },
    ],
    rows,
    frozenColumns: 1,
  };
}

// ── Trial Balance ───────────────────────────────────────────────────────
export function buildTrialBalanceGrid(dealData: DealData): GridData {
  const periods = dealData.deal.periods;
  const columns: GridColumn[] = [
    { key: "fsType", label: "FS", width: 40, frozen: true, format: "text" },
    { key: "accountId", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "accountName", label: "Account Name", width: 200, frozen: true, format: "text" },
    { key: "fsLineItem", label: "FS Line Item", width: 150, frozen: true, format: "text" },
    ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 90, format: "currency" as const })),
  ];

  const dataRows: GridRow[] = dealData.trialBalance.map(entry => ({
    id: entry.accountId, type: "data" as const,
    cells: {
      fsType: entry.fsType, accountId: entry.accountId,
      accountName: entry.accountName, fsLineItem: entry.fsLineItem,
      ...Object.fromEntries(periods.map(p => [p.id, entry.balances[p.id] || 0])),
    },
  }));

  const bsTotals: Record<string, number> = {};
  const isTotals: Record<string, number> = {};
  for (const entry of dealData.trialBalance) {
    for (const p of periods) {
      const val = entry.balances[p.id] || 0;
      if (entry.fsType === "BS") bsTotals[p.id] = (bsTotals[p.id] || 0) + val;
      else isTotals[p.id] = (isTotals[p.id] || 0) + val;
    }
  }

  const rows: GridRow[] = [
    ...dataRows,
    { id: "__bs_total", type: "subtotal", cells: { fsType: "", accountId: "", accountName: "BS Total", fsLineItem: "", ...Object.fromEntries(periods.map(p => [p.id, bsTotals[p.id] || 0])) } },
    { id: "__is_total", type: "subtotal", cells: { fsType: "", accountId: "", accountName: "IS Total", fsLineItem: "", ...Object.fromEntries(periods.map(p => [p.id, isTotals[p.id] || 0])) } },
  ];

  return { columns, rows, frozenColumns: 4 };
}

// ── Income Statement ────────────────────────────────────────────────────
export function buildIncomeStatementGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const columns = buildStandardColumns(dealData, "");
  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Income Statement - as reported", cells: { label: "Income Statement - as reported" } },
    { id: "revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
    { id: "gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
    { id: "op-income", type: "subtotal", cells: { label: "Operating income", ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "other", type: "data", cells: { label: "Other expense (income)", ...pc(p => calc.calcOtherExpense(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "net-income", type: "total", cells: { label: "Net income (loss)", ...npc(p => calc.calcNetIncome(tb, p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
    { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
    { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab)) } },
    { id: "s6", type: "spacer", cells: {} },
    { id: "hdr-adjusted", type: "section-header", label: "Income Statement - as adjusted", cells: { label: "Income Statement - as adjusted" } },
    { id: "adj-revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "adj-cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
    { id: "adj-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
    { id: "s-adj1", type: "spacer", cells: {} },
    { id: "adj-opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
    { id: "adj-op-income", type: "subtotal", cells: { label: "Operating income", ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
    { id: "s-adj2", type: "spacer", cells: {} },
    { id: "qoe-adjustments", type: "data", indent: 1, cells: { label: "QoE Adjustments", ...pc(p => calc.calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s-adj2b", type: "spacer", cells: {} },
    { id: "adj-other", type: "data", cells: { label: "Other expense (income)", ...pc(p => calc.calcOtherExpense(tb, p)) } },
    { id: "s-adj3", type: "spacer", cells: {} },
    { id: "adj-net-income", type: "total", cells: { label: "Net income (loss)", ...npc(p => calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s-adj4", type: "spacer", cells: {} },
    { id: "hdr-adj-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
    { id: "adj-interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
    { id: "adj-taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "adj-depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s-adj5", type: "spacer", cells: {} },
    { id: "adj-ebitda", type: "total", cells: { label: "Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "s7", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
    { id: "gm", type: "data", format: "percent", cells: { label: "Gross margin", ...mc(p => -calc.calcGrossProfit(tb, p), p => calc.calcRevenue(tb, p)) } },
    { id: "om", type: "data", format: "percent", cells: { label: "Operating margin", ...mc(p => -(calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)), p => calc.calcRevenue(tb, p)) } },
    { id: "em", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc(p => -calc.calcReportedEBITDA(tb, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "aem", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc(p => -calc.calcAdjustedEBITDA(tb, adj, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "nm", type: "data", format: "percent", cells: { label: "Net margin", ...mc(p => -calc.calcNetIncome(tb, p), p => calc.calcRevenue(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── QoE Analysis ────────────────────────────────────────────────────────
export function buildQoEAnalysisGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const tbIdx = calc.buildTbIndex(tb);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const { periods, aggregatePeriods } = dealData.deal;

  const columns: GridColumn[] = [
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

  const adjRow = (a: typeof adj[0], prefix: string, i: number): GridRow => ({
    id: `${prefix}-${a.id}`, type: "data", indent: 1,
    cells: {
      label: a.label || a.notes || `${prefix.toUpperCase()}-${i + 1}`,
      adjNo: `${a.type}-${i + 1}`, adjType: a.type, acctNo: a.tbAccountNumber,
      acctDesc: a.label, fsLine: a.intent, sub1: "", sub2: "", sub3: "", comments: a.notes,
      ...adjustmentCells(dealData, a.amounts),
    },
  });

  const rows: GridRow[] = [
    { id: "revenue-reported", type: "data", cells: { label: "Revenue, as reported", ...ec, ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "revenue-adjusted", type: "data", cells: { label: "Revenue, as adjusted", ...ec, ...npc(p => calc.calcRevenue(tb, p) - calc.calcRevenueAdjustments(adj, tbIdx, "all", p)) } },
    { id: "gross-profit", type: "data", cells: { label: "Gross profit, as adjusted", ...ec, ...npc(p => calc.calcGrossProfit(tb, p) - calc.calcRevenueAdjustments(adj, tbIdx, "all", p) - calc.calcCOGSAdjustments(adj, tbIdx, "all", p)) } },
    { id: "net-income", type: "subtotal", cells: { label: "Net income (loss)", ...ec, ...npc(p => calc.calcNetIncome(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-normal", type: "section-header", label: "Normal adjustments", cells: { label: "Normal adjustments", ...ec } },
    { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
    { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...ec, ...npc(p => calc.calcReportedEBITDA(tb, p, ab)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-ma", type: "section-header", label: "Management adjustments", cells: { label: "Management adjustments", ...ec } },
    ...maAdj.map((a, i) => adjRow(a, "ma", i)),
    { id: "ma-total", type: "subtotal", cells: { label: "Total management adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "MA", p)) } },
    { id: "ma-ebitda", type: "total", cells: { label: "Management adjusted EBITDA", ...ec, ...npc(p => calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "MA", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-dd", type: "section-header", label: "Due diligence adjustments", cells: { label: "Due diligence adjustments", ...ec } },
    ...ddAdj.map((a, i) => adjRow(a, "dd", i)),
    { id: "dd-total", type: "subtotal", cells: { label: "Total due diligence adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "dd-ebitda", type: "total", cells: { label: "Due diligence adjusted EBITDA", ...ec, ...npc(p => calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "MA", p) - calc.calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "hdr-pf", type: "section-header", label: "Pro Forma Adjustments", cells: { label: "Pro Forma Adjustments", ...ec } },
    ...pfAdj.map((a, i) => adjRow(a, "pf", i)),
    { id: "pf-total", type: "subtotal", cells: { label: "Total pro forma adjustments", ...ec, ...pc(p => calc.calcAdjustmentTotal(adj, "PF", p)) } },
    { id: "pf-ebitda", type: "total", cells: { label: "Pro Forma Adjusted EBITDA", ...ec, ...npc(p => calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s6", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
    { id: "reported-margin", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...ec, ...mc(p => -calc.calcReportedEBITDA(tb, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "adj-margin", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...ec, ...mc(p => -(calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "all", p)), p => calc.calcRevenue(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 9 };
}

// ── Balance Sheet ───────────────────────────────────────────────────────
export function buildBalanceSheetGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "");

  const rows: GridRow[] = [
    { id: "hdr-assets", type: "section-header", label: "ASSETS", cells: { label: "ASSETS" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
    { id: "fa", type: "data", indent: 1, cells: { label: "Fixed Assets", ...bc(p => calc.sumByLineItem(tb, "Fixed assets", p)) } },
    { id: "oa", type: "data", indent: 1, cells: { label: "Other Assets", ...bc(p => calc.sumByLineItem(tb, "Other assets", p)) } },
    { id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bc(p => calc.calcTotalAssets(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-liab", type: "section-header", label: "LIABILITIES", cells: { label: "LIABILITIES" } },
    { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Long term liabilities", p)) } },
    { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc(p => calc.calcTotalLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
    { id: "equity", type: "data", indent: 1, cells: { label: "Total Equity", ...bc(p => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...bc(p => calc.calcTotalAssets(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── DD Adjustments ──────────────────────────────────────────────────────
export function buildDDAdjustmentsGrid(dealData: DealData, tabIndex: 1 | 2): GridData {
  const adj = dealData.adjustments;
  const { periods, aggregatePeriods } = dealData.deal;

  const columns: GridColumn[] = [
    { key: "label", label: "Description", width: 240, frozen: true, format: "text" },
    { key: "adjNo", label: "Adj #", width: 60, frozen: true, format: "text" },
    { key: "adjType", label: "Type", width: 60, frozen: true, format: "text" },
    { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    ...aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const emptyCols = { adjNo: "", adjType: "", acctNo: "", fsLine: "" };
  const filterTypes = tabIndex === 1 ? ["MA"] : ["DD", "PF"];
  const filtered = adj.filter(a => filterTypes.includes(a.type));
  const sectionLabel = tabIndex === 1 ? "Management Adjustments" : "Due Diligence & Pro Forma Adjustments";

  const rows: GridRow[] = [
    { id: "hdr", type: "section-header", label: sectionLabel, cells: { label: sectionLabel, ...emptyCols } },
    ...filtered.map((a, i) => ({
      id: `adj-${a.id}`, type: "data" as const, indent: 1,
      cells: {
        label: a.label || a.notes || `Adjustment ${i + 1}`,
        adjNo: `${a.type}-${i + 1}`, adjType: a.type, acctNo: a.tbAccountNumber, fsLine: a.intent,
        ...adjustmentCells(dealData, a.amounts),
      },
    })),
  ];

  const totalCells: Record<string, number> = {};
  for (const p of periods) totalCells[p.id] = filtered.reduce((s, a) => s + (a.amounts[p.id] || 0), 0);
  for (const ap of aggregatePeriods) totalCells[ap.id] = ap.monthPeriodIds.reduce((s, mpid) => s + filtered.reduce((ss, a) => ss + (a.amounts[mpid] || 0), 0), 0);
  rows.push({ id: "total", type: "total", cells: { label: `Total ${sectionLabel}`, ...emptyCols, ...totalCells } });

  return { columns, rows, frozenColumns: 5 };
}

// ── Breakdown tabs (Sales, COGS, OpEx, Other Expense) ───────────────────
export function buildSalesGrid(dealData: DealData): GridData {
  return buildBreakdownGrid(dealData, { lineItem: "Revenue", title: "Revenue", negateValues: true });
}
export function buildCOGSGrid(dealData: DealData): GridData {
  return buildBreakdownGrid(dealData, { lineItem: "Cost of Goods Sold", title: "Cost of Goods Sold" });
}
export function buildOpExGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  return buildBreakdownGrid(dealData, {
    lineItem: "Operating expenses", title: "Operating Expenses",
    pctLabel: "% of Operating Expenses",
    pctDenominator: (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p),
  });
}
export function buildOtherExpenseGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  return buildBreakdownGrid(dealData, {
    lineItem: "Other expense (income)", title: "Other Expense (Income)",
    pctLabel: "% of Other Expense (Income)",
    pctDenominator: (p: string) => calc.calcOtherExpense(tb, p),
  });
}

// ── Payroll ──────────────────────────────────────────────────────────────
export function buildPayrollGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Payroll & Related");
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const totalPayroll = (p: string) => calc.calcPayroll(tb, p);
  const totalRevenue = (p: string) => calc.calcRevenue(tb, p);

  const columns: GridColumn[] = [
    { key: "label", label: "Payroll & Related", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const ec = { acctNo: "", fsLine: "", sub1: "" };

  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Payroll & Related - reported", cells: { label: "Payroll & Related - reported", ...ec } },
    ...entries.map(e => ({
      id: `rpt-${e.accountId}`, type: "data" as const, indent: 1,
      cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1, ...entryCells(dealData, e.balances) },
    })),
    { id: "total-reported", type: "total", cells: { label: "Total Payroll & Related", ...ec, ...pc(totalPayroll) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-pct-rev", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
    ...entries.map(e => ({
      id: `pct-rev-${e.accountId}`, type: "data" as const, indent: 1, format: "percent" as const,
      cells: { label: e.accountName, ...ec, ...mc(p => e.balances[p] || 0, totalRevenue) },
    })),
    { id: "pct-rev-total", type: "subtotal", format: "percent" as const, cells: { label: "Total Payroll as % of Revenue", ...ec, ...mc(totalPayroll, totalRevenue) } },
  ];

  return { columns, rows, frozenColumns: 4 };
}

// ── Working Capital ─────────────────────────────────────────────────────
export function buildWorkingCapitalGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Working Capital Summary", { labelWidth: 280 });

  const rows: GridRow[] = [
    { id: "hdr-ca", type: "section-header", label: "Current Assets", cells: { label: "Current Assets" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-cl", type: "section-header", label: "Current Liabilities", cells: { label: "Current Liabilities" } },
    { id: "cl", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "nwc", type: "total", cells: { label: "Net Working Capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
    { id: "nwc-ex", type: "subtotal", cells: { label: "NWC ex. Cash", ...bc(p => calc.calcNWCExCash(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── NWC Analysis ────────────────────────────────────────────────────────
export function buildNWCAnalysisGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "NWC Analysis", { labelWidth: 280 });

  const rows: GridRow[] = [
    { id: "hdr-nwc", type: "section-header", label: "Net working capital - reported to adjusted", cells: { label: "Net working capital - reported to adjusted" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "nwc-reported", type: "total", cells: { label: "Net working capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-adj", type: "section-header", label: "Normal NWC adjustments", cells: { label: "Normal NWC adjustments" } },
    { id: "adj-cash", type: "data", indent: 1, cells: { label: "Remove: Cash and cash equivalents", ...bc(p => -calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "nwc-ex-cash", type: "total", cells: { label: "Net working capital, reported (ex. cash)", ...bc(p => calc.calcNWCExCash(tb, p)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "nwc-adjusted", type: "total", cells: { label: "Net working capital, adjusted", ...bc(p => calc.calcNWCExCash(tb, p)) } },
    { id: "s8", type: "spacer", cells: {} },
    { id: "hdr-trail", type: "section-header", label: "Trailing Averages", cells: { label: "Trailing Averages" } },
    { id: "trail-ar", type: "data", cells: { label: "A/R Days Outstanding", ...bc(p => {
      const ar = calc.sumByLineItem(tb, "Accounts receivable", p);
      const rev = calc.calcRevenue(tb, p);
      return rev === 0 ? 0 : (ar / Math.abs(rev)) * 30;
    }) } },
    { id: "trail-ap", type: "data", cells: { label: "A/P Days Outstanding", ...bc(p => {
      const ap = calc.sumByLineItem(tb, "Current liabilities", p);
      const cogs = calc.calcCOGS(tb, p);
      return cogs === 0 ? 0 : (Math.abs(ap) / Math.abs(cogs)) * 30;
    }) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── Cash ────────────────────────────────────────────────────────────────
export function buildCashGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Cash and cash equivalents");
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

  const columns: GridColumn[] = [
    { key: "label", label: "Cash", width: 280, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const rows: GridRow[] = entries.map(e => ({
    id: e.accountId, type: "data" as const, indent: 1,
    cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) },
  }));
  rows.push({ id: "total", type: "total", cells: { label: "Total Cash", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } });

  return { columns, rows, frozenColumns: 1 };
}

// ── AR Aging ────────────────────────────────────────────────────────────
function buildAgingGrid(dealData: DealData, type: "ar" | "ap"): GridData {
  const data = type === "ar" ? dealData.arAging : dealData.apAging;
  const entityLabel = type === "ar" ? "Customer" : "Vendor";
  const totalLabel = type === "ar" ? "Total AR" : "Total AP";

  const columns: GridColumn[] = [
    { key: "label", label: entityLabel, width: 200, frozen: true, format: "text" },
    { key: "current", label: "Current", width: 90, format: "currency" },
    { key: "d30", label: "1-30", width: 90, format: "currency" },
    { key: "d60", label: "31-60", width: 90, format: "currency" },
    { key: "d90", label: "61-90", width: 90, format: "currency" },
    { key: "d90p", label: "90+", width: 90, format: "currency" },
    { key: "total", label: "Total", width: 100, format: "currency" },
  ];

  const rows: GridRow[] = [];
  const agingPeriods = Object.keys(data).sort();
  for (const periodKey of agingPeriods) {
    const entries = data[periodKey];
    rows.push({ id: `hdr-${periodKey}`, type: "section-header", label: periodKey, cells: { label: periodKey } });
    for (const [i, e] of entries.entries()) {
      rows.push({ id: `${type}-${periodKey}-${i}`, type: "data", cells: { label: e.name, current: e.current, d30: e.days1to30, d60: e.days31to60, d90: e.days61to90, d90p: e.days90plus, total: e.total } });
    }
    if (entries.length > 0) {
      const totals = entries.reduce((acc, e) => ({ current: acc.current + e.current, d30: acc.d30 + e.days1to30, d60: acc.d60 + e.days31to60, d90: acc.d90 + e.days61to90, d90p: acc.d90p + e.days90plus, total: acc.total + e.total }), { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, total: 0 });
      rows.push({ id: `total-${periodKey}`, type: "total", cells: { label: totalLabel, ...totals } });
    }
    rows.push({ id: `sp-${periodKey}`, type: "spacer", cells: {} });
  }

  return { columns, rows, frozenColumns: 1 };
}

export function buildARAgingGrid(dealData: DealData): GridData { return buildAgingGrid(dealData, "ar"); }
export function buildAPAgingGrid(dealData: DealData): GridData { return buildAgingGrid(dealData, "ap"); }

// ── Fixed Assets ────────────────────────────────────────────────────────
export function buildFixedAssetsGrid(dealData: DealData): GridData {
  const columns: GridColumn[] = [
    { key: "desc", label: "Description", width: 200, frozen: true, format: "text" },
    { key: "category", label: "Category", width: 120, format: "text" },
    { key: "date", label: "Acquired", width: 100, format: "text" },
    { key: "cost", label: "Cost", width: 100, format: "currency" },
    { key: "depr", label: "Accum Depr", width: 100, format: "currency" },
    { key: "nbv", label: "Net Book Value", width: 100, format: "currency" },
  ];

  const rows: GridRow[] = dealData.fixedAssets.map((fa, i) => ({
    id: `fa-${i}`, type: "data" as const,
    cells: { desc: fa.description, category: fa.category, date: fa.acquisitionDate, cost: fa.cost, depr: fa.accumulatedDepreciation, nbv: fa.netBookValue },
  }));
  if (rows.length > 0) {
    rows.push({ id: "total", type: "total", cells: {
      desc: "Total", category: "", date: "",
      cost: dealData.fixedAssets.reduce((s, f) => s + f.cost, 0),
      depr: dealData.fixedAssets.reduce((s, f) => s + f.accumulatedDepreciation, 0),
      nbv: dealData.fixedAssets.reduce((s, f) => s + f.netBookValue, 0),
    } });
  }

  return { columns, rows, frozenColumns: 1 };
}

// ── Other Current Assets ────────────────────────────────────────────────
export function buildOtherCurrentAssetsGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Other current assets");
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

  const columns: GridColumn[] = [
    { key: "label", label: "Other Current Assets", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const ec = { acctNo: "", fsLine: "" };
  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Assets - reported", cells: { label: "Other Current Assets - reported", ...ec } },
    ...entries.map(e => ({ id: `rpt-${e.accountId}`, type: "data" as const, indent: 1, cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, e.balances) } })),
    { id: "total-reported", type: "total", cells: { label: "Total Other Current Assets", ...ec, ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
  ];

  return { columns, rows, frozenColumns: 3 };
}

// ── Other Current Liabilities ───────────────────────────────────────────
export function buildOtherCurrentLiabilitiesGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Other current liabilities");
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

  const columns: GridColumn[] = [
    { key: "label", label: "Other Current Liabilities", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const ec = { acctNo: "", fsLine: "" };
  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Liabilities - reported", cells: { label: "Other Current Liabilities - reported", ...ec } },
    ...entries.map(e => {
      const neg: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.balances)) neg[k] = -(v as number);
      return { id: `rpt-${e.accountId}`, type: "data" as const, indent: 1, cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, neg) } };
    }),
    { id: "total-reported", type: "total", cells: { label: "Total Other Current Liabilities", ...ec, ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
  ];

  return { columns, rows, frozenColumns: 3 };
}

// ── Top Customers ───────────────────────────────────────────────────────
export function buildTopCustomersGrid(dealData: DealData): GridData {
  const dataKeys = Object.keys(dealData.topCustomers || {});
  const yearSet = new Set<string>();
  for (const k of dataKeys) {
    const am = k.match(/^annual-(\d{4})$/);
    if (am) { yearSet.add(am[1]); continue; }
    const mm = k.match(/^(\d{4})-\d{2}$/);
    if (mm) yearSet.add(mm[1]);
  }
  const years = Array.from(yearSet).sort();
  if (years.length === 0) return { columns: [], rows: [], frozenColumns: 0 };

  const columns: GridColumn[] = [{ key: "rank", label: "#", width: 30, frozen: true, format: "text" }];
  for (const yr of years) {
    columns.push(
      { key: `${yr}-name`, label: `${yr} Customer`, width: 160, format: "text" },
      { key: `${yr}-revenue`, label: "Revenue", width: 110, format: "currency" },
      { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" },
    );
  }

  const yearMaps: Record<string, { sorted: [string, number][]; total: number }> = {};
  for (const yr of years) {
    const customerMap = new Map<string, number>();
    for (const e of (dealData.topCustomers[`annual-${yr}`] || [])) customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
    for (let m = 1; m <= 12; m++) {
      const pid = `${yr}-${String(m).padStart(2, "0")}`;
      for (const e of (dealData.topCustomers[pid] || [])) customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
    }
    const sorted = Array.from(customerMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    yearMaps[yr] = { sorted, total: sorted.reduce((s, [, v]) => s + v, 0) };
  }

  const rows: GridRow[] = [{ id: "hdr", type: "section-header", label: "Top Customers by Year", cells: { rank: "Top Customers by Year" } }];
  for (let i = 0; i < 10; i++) {
    const cells: Record<string, string | number | null> = { rank: `${i + 1}` };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      if (i < sorted.length) {
        cells[`${yr}-name`] = sorted[i][0];
        cells[`${yr}-revenue`] = sorted[i][1];
        cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
      } else { cells[`${yr}-name`] = ""; cells[`${yr}-revenue`] = null; cells[`${yr}-pct`] = null; }
    }
    rows.push({ id: `cust-${i}`, type: "data", cells });
  }

  const totalCells: Record<string, string | number | null> = { rank: "" };
  for (const yr of years) { totalCells[`${yr}-name`] = "Total Revenue"; totalCells[`${yr}-revenue`] = yearMaps[yr].total; totalCells[`${yr}-pct`] = 1; }
  rows.push({ id: "total", type: "total", cells: totalCells });

  return { columns, rows, frozenColumns: 1 };
}

// ── Top Vendors ─────────────────────────────────────────────────────────
export function buildTopVendorsGrid(dealData: DealData): GridData {
  const dataKeys = Object.keys(dealData.topVendors || {});
  const yearSet = new Set<string>();
  for (const k of dataKeys) {
    const am = k.match(/^annual-(\d{4})$/);
    if (am) { yearSet.add(am[1]); continue; }
    const mm = k.match(/^(\d{4})-\d{2}$/);
    if (mm) yearSet.add(mm[1]);
  }
  const years = Array.from(yearSet).sort();
  if (years.length === 0) return { columns: [], rows: [], frozenColumns: 0 };

  const columns: GridColumn[] = [{ key: "rank", label: "#", width: 30, frozen: true, format: "text" }];
  for (const yr of years) {
    columns.push(
      { key: `${yr}-name`, label: `${yr} Vendor`, width: 160, format: "text" },
      { key: `${yr}-spend`, label: "Expenses", width: 110, format: "currency" },
      { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" },
    );
  }

  const yearMaps: Record<string, { sorted: [string, number][]; total: number }> = {};
  for (const yr of years) {
    const vendorMap = new Map<string, number>();
    for (const e of (dealData.topVendors[`annual-${yr}`] || [])) vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
    for (let m = 1; m <= 12; m++) {
      const pid = `${yr}-${String(m).padStart(2, "0")}`;
      for (const e of (dealData.topVendors[pid] || [])) vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
    }
    const sorted = Array.from(vendorMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    yearMaps[yr] = { sorted, total: sorted.reduce((s, [, v]) => s + v, 0) };
  }

  const rows: GridRow[] = [{ id: "hdr", type: "section-header", label: "Top Vendors by Year", cells: { rank: "Top Vendors by Year" } }];
  for (let i = 0; i < 10; i++) {
    const cells: Record<string, string | number | null> = { rank: `${i + 1}` };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      if (i < sorted.length) {
        cells[`${yr}-name`] = sorted[i][0];
        cells[`${yr}-spend`] = sorted[i][1];
        cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
      } else { cells[`${yr}-name`] = ""; cells[`${yr}-spend`] = null; cells[`${yr}-pct`] = null; }
    }
    rows.push({ id: `vend-${i}`, type: "data", cells });
  }

  const totalCells: Record<string, string | number | null> = { rank: "" };
  for (const yr of years) { totalCells[`${yr}-name`] = "Total vendor purchases"; totalCells[`${yr}-spend`] = yearMaps[yr].total; totalCells[`${yr}-pct`] = 1; }
  rows.push({ id: "total", type: "total", cells: totalCells });

  return { columns, rows, frozenColumns: 1 };
}

// ── Free Cash Flow ──────────────────────────────────────────────────────
export function buildFreeCashFlowGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Free Cash Flow", { labelWidth: 280 });

  const calcNWCChange = (p: string): number => {
    const { periods } = dealData.deal;
    const idx = periods.findIndex(pp => pp.id === p);
    if (idx <= 0) return 0;
    return calc.calcNWCExCash(tb, p) - calc.calcNWCExCash(tb, periods[idx - 1].id);
  };

  const rows: GridRow[] = [
    { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "nwc-change", type: "data", cells: { label: "Change in NWC", ...pc(p => -calcNWCChange(p)) } },
    { id: "capex", type: "data", cells: { label: "Capital Expenditures", ...pc(_ => 0) } },
    { id: "taxes", type: "data", cells: { label: "Estimated Taxes", ...pc(p => -calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc(p => -calc.calcAdjustedEBITDA(tb, adj, p, ab) - calcNWCChange(p) - calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── IS-BS Reconciliation ────────────────────────────────────────────────
export function buildISBSReconciliationGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const { aggregatePeriods } = dealData.deal;
  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

  const cols: GridColumn[] = [{ key: "label", label: "", width: 260, frozen: true, format: "text" }];
  for (const ap of aggregatePeriods) {
    cols.push(
      { key: `${ap.id}-ours`, label: `${ap.shortLabel} — Our Numbers`, width: 120, format: "currency" },
      { key: `${ap.id}-audited`, label: `${ap.shortLabel} — Audited`, width: 120, format: "currency" },
    );
  }

  const isAggCells = (rowFn: (mids: string[]) => number) => {
    const c: Record<string, number> = {};
    for (const ap of aggregatePeriods) {
      const v = rowFn(ap.monthPeriodIds);
      c[`${ap.id}-ours`] = v;
      c[`${ap.id}-audited`] = v;
    }
    return c;
  };
  const bsAggCells = (rowFn: (p: string) => number) => {
    const c: Record<string, number> = {};
    for (const ap of aggregatePeriods) {
      const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1] ?? "";
      const v = lastPid ? rowFn(lastPid) : 0;
      c[`${ap.id}-ours`] = v;
      c[`${ap.id}-audited`] = v;
    }
    return c;
  };

  const rows: GridRow[] = [
    { id: "hdr-is", type: "section-header", cells: { label: "INCOME STATEMENT" } },
    { id: "is-revenue", type: "data", indent: 1, cells: { label: "Revenue", ...isAggCells(mids => -mids.reduce((s, p) => s + calc.calcRevenue(tb, p), 0)) } },
    { id: "is-cogs", type: "data", indent: 1, cells: { label: "Cost of goods sold", ...isAggCells(mids => mids.reduce((s, p) => s + calc.calcCOGS(tb, p), 0)) } },
    { id: "is-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...isAggCells(mids => -mids.reduce((s, p) => s + calc.calcGrossProfit(tb, p), 0)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "is-opex", type: "data", indent: 1, cells: { label: "Operating expenses", ...isAggCells(mids => mids.reduce((s, p) => s + calcTotalOpEx(p), 0)) } },
    { id: "is-other-exp", type: "data", indent: 1, cells: { label: "Other expense (income)", ...isAggCells(mids => mids.reduce((s, p) => s + calc.calcOtherExpense(tb, p), 0)) } },
    { id: "is-net-income", type: "total", cells: { label: "Net income (loss)", ...isAggCells(mids => -mids.reduce((s, p) => s + calc.calcNetIncome(tb, p), 0)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-bs", type: "section-header", cells: { label: "BALANCE SHEET" } },
    { id: "bs-total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bsAggCells(p => calc.calcTotalAssets(tb, p)) } },
    { id: "bs-total-liab", type: "subtotal", cells: { label: "Total liabilities", ...bsAggCells(p => -calc.calcTotalLiabilities(tb, p)) } },
    { id: "bs-equity", type: "data", indent: 1, cells: { label: "Equity", ...bsAggCells(p => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p)) } },
    { id: "bs-total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...bsAggCells(p => calc.calcTotalAssets(tb, p)) } },
  ];

  return { columns: cols, rows, frozenColumns: 1 };
}

// ── IS Detailed ─────────────────────────────────────────────────────────
export function buildISDetailedGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

  const columns: GridColumn[] = [
    { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const rows: GridRow[] = [];

  // Helper to build a section
  const buildSection = (title: string, adjusted: boolean) => {
    const prefix = adjusted ? "adj-" : "rpt-";
    rows.push({ id: `${prefix}hdr`, type: "section-header", label: title, cells: { label: title, ...ec } });

    // Revenue entries
    const revEntries = calc.getEntriesByLineItem(tb, "Revenue");
    rows.push({ id: `${prefix}hdr-rev`, type: "section-header", label: "Revenue", cells: { label: "Revenue", ...ec } });
    for (const entry of revEntries) {
      const negBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(entry.balances)) negBalances[k] = -v;
      rows.push({ id: `${prefix}d-rev-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, negBalances) } });
    }
    rows.push({ id: `${prefix}sub-rev`, type: "subtotal", cells: { label: "Revenue", ...ec, ...npc(p => calc.calcRevenue(tb, p)) } });

    // COGS entries
    const cogsEntries = calc.getEntriesByLineItem(tb, "Cost of Goods Sold");
    rows.push({ id: `${prefix}hdr-cogs`, type: "section-header", label: "Cost of Goods Sold", cells: { label: "Cost of Goods Sold", ...ec } });
    for (const entry of cogsEntries) {
      rows.push({ id: `${prefix}d-cogs-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `${prefix}sub-cogs`, type: "subtotal", cells: { label: "Total Cost of Goods Sold", ...ec, ...pc(p => calc.calcCOGS(tb, p)) } });
    rows.push({ id: `${prefix}gross-profit`, type: "total", cells: { label: "Gross Profit", ...ec, ...npc(p => calc.calcGrossProfit(tb, p)) } });

    // OpEx entries
    const opexEntries = calc.getEntriesByLineItem(tb, "Operating expenses");
    const payrollEntries = calc.getEntriesByLineItem(tb, "Payroll & Related");
    rows.push({ id: `${prefix}hdr-opex`, type: "section-header", label: "Operating Expenses", cells: { label: "Operating Expenses", ...ec } });
    for (const entry of [...opexEntries, ...payrollEntries]) {
      rows.push({ id: `${prefix}d-opex-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `${prefix}sub-opex`, type: "subtotal", cells: { label: "Total Operating Expenses", ...ec, ...pc(p => calcTotalOpEx(p)) } });
    rows.push({ id: `${prefix}op-income`, type: "total", cells: { label: "Operating Income", ...ec, ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } });

    // Other Expense (Income) entries
    const otherExpEntries = calc.getEntriesByLineItem(tb, "Other expense (income)");
    if (otherExpEntries.length > 0) {
      rows.push({ id: `${prefix}hdr-other`, type: "section-header", label: "Other Expense (Income)", cells: { label: "Other Expense (Income)", ...ec } });
      for (const entry of otherExpEntries) {
        rows.push({ id: `${prefix}d-other-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
      }
      rows.push({ id: `${prefix}sub-other`, type: "subtotal", cells: { label: "Total Other Expense (Income)", ...ec, ...pc(p => calc.calcOtherExpense(tb, p)) } });
    }

    // Net Income
    rows.push({ id: `${prefix}net-income`, type: "total", cells: { label: adjusted ? "Adjusted Net Income" : "Net Income (Loss)", ...ec, ...npc(p => adjusted ? calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p) : calc.calcNetIncome(tb, p)) } });

    // EBITDA
    rows.push({ id: `${prefix}hdr-ab`, type: "section-header", label: "EBITDA Addbacks", cells: { label: "EBITDA Addbacks", ...ec } });
    rows.push({ id: `${prefix}ab-int`, type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } });
    rows.push({ id: `${prefix}ab-tax`, type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } });
    rows.push({ id: `${prefix}ab-dep`, type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } });
    rows.push({ id: `${prefix}ebitda`, type: "total", cells: { label: adjusted ? "Adjusted EBITDA" : "Reported EBITDA", ...ec, ...npc(p => adjusted ? calc.calcAdjustedEBITDA(tb, adj, p, ab) : calc.calcReportedEBITDA(tb, p, ab)) } });
    rows.push({ id: `${prefix}sp-end`, type: "spacer", cells: {} });
  };

  buildSection("Summary of Reported Income Statements", false);
  rows.push({ id: "section-divider", type: "spacer", cells: {} });
  buildSection("Summary of Adjusted Income Statements", true);

  return { columns, rows, frozenColumns: 4 };
}

// ── BS Detailed ─────────────────────────────────────────────────────────
export function buildBSDetailedGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

  const columns: GridColumn[] = [
    { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const rows: GridRow[] = [];

  const addAssetLineItem = (lineItem: string) => {
    const entries = calc.getEntriesByLineItem(tb, lineItem);
    if (!entries.length) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...ec } });
    for (const entry of entries) {
      rows.push({ id: `d-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...ec, ...bc(p => calc.sumByLineItem(tb, lineItem, p)) } });
  };

  const addLiabLineItem = (lineItem: string) => {
    const entries = calc.getEntriesByLineItem(tb, lineItem);
    if (!entries.length) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...ec } });
    for (const entry of entries) {
      const neg: Record<string, number> = {};
      for (const [k, v] of Object.entries(entry.balances)) neg[k] = -(v as number);
      rows.push({ id: `d-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, neg) } });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...ec, ...nbc(p => calc.sumByLineItem(tb, lineItem, p)) } });
  };

  rows.push({ id: "hdr-reported", type: "section-header", label: "Summary reported balance sheets", cells: { label: "Summary reported balance sheets", ...ec } });
  for (const li of ["Cash and cash equivalents", "Accounts receivable", "Other current assets"]) addAssetLineItem(li);
  rows.push({ id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...ec, ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } });
  for (const li of ["Fixed assets", "Other assets"]) addAssetLineItem(li);
  rows.push({ id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...ec, ...bc(p => calc.calcTotalAssets(tb, p)) } });
  rows.push({ id: "s-a", type: "spacer", cells: {} });
  for (const li of ["Current liabilities", "Other current liabilities"]) addLiabLineItem(li);
  rows.push({ id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...ec, ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } });
  addLiabLineItem("Long term liabilities");
  rows.push({ id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...ec, ...nbc(p => calc.calcTotalLiabilities(tb, p)) } });
  rows.push({ id: "s-l", type: "spacer", cells: {} });
  rows.push({ id: "hdr-Equity", type: "section-header", label: "Equity", cells: { label: "Equity", ...ec } });
  rows.push({ id: "d-equity-display", type: "data", indent: 1, cells: { label: "Retained Earnings / Equity", acctNo: "9200", fsLine: "Equity", sub1: "", ...bc(p => calc.calcTotalAssets(tb, p) + calc.calcTotalLiabilities(tb, p)) } });
  rows.push({ id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...ec, ...bc(p => calc.calcTotalAssets(tb, p)) } });

  return { columns, rows, frozenColumns: 4 };
}

// ── Supplementary ───────────────────────────────────────────────────────
export function buildSupplementaryGrid(dealData: DealData): GridData {
  const columns: GridColumn[] = [
    { key: "col0", label: "Description", width: 280, frozen: true, format: "text" },
    { key: "col1", label: "Type", width: 130, format: "text" },
    { key: "col2", label: "Balance / Payment", width: 150, format: "currency" },
    { key: "col3", label: "Rate", width: 90, format: "text" },
    { key: "col4", label: "Maturity / Expiry", width: 140, format: "text" },
  ];

  const rows: GridRow[] = [];
  const supp = dealData.supplementary;

  rows.push({ id: "hdr-debt", type: "section-header", label: "Debt Schedule", cells: { col0: "Debt Schedule", col1: "", col2: "", col3: "", col4: "" } });
  const debtItems = supp?.debtSchedule ?? [];
  let totalDebt = 0;
  for (const [i, d] of debtItems.entries()) {
    totalDebt += d.balance;
    rows.push({ id: `debt-${i}`, type: "data", cells: { col0: d.lender, col1: d.type ?? "Term Loan", col2: d.balance, col3: `${d.interestRate.toFixed(2)}%`, col4: d.maturityDate ?? "—" } });
  }
  if (debtItems.length > 0) rows.push({ id: "debt-total", type: "subtotal", cells: { col0: "Total Debt", col1: "", col2: totalDebt, col3: "", col4: "" } });
  rows.push({ id: "sp1", type: "spacer", cells: {} });

  rows.push({ id: "hdr-lease", type: "section-header", label: "Lease Obligations", cells: { col0: "Lease Obligations", col1: "", col2: "", col3: "", col4: "" } });
  const leaseItems = supp?.leaseObligations ?? [];
  let totalLease = 0;
  for (const [i, l] of leaseItems.entries()) {
    totalLease += l.annualPayment;
    rows.push({ id: `lease-${i}`, type: "data", cells: { col0: l.description, col1: l.leaseType, col2: l.annualPayment, col3: "—", col4: l.expirationDate ?? "—" } });
  }
  if (leaseItems.length > 0) rows.push({ id: "lease-total", type: "subtotal", cells: { col0: "Total Annual Lease Payments", col1: "", col2: totalLease, col3: "", col4: "" } });

  return { columns, rows, frozenColumns: 1 };
}

// ── Proof of Cash (simplified for export — no bank statement data) ─────
export function buildProofOfCashGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Proof of Cash", { labelWidth: 280 });

  const rows: GridRow[] = [
    { id: "hdr-gl", type: "section-header", label: "Cash per General Ledger", cells: { label: "Cash per General Ledger" } },
    { id: "cash-end", type: "data", cells: { label: "Ending Cash Balance", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-rev", type: "section-header", label: "Revenue per IS", cells: { label: "Revenue per IS" } },
    { id: "rev-is", type: "data", cells: { label: "Revenue per Income Statement", ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-exp", type: "section-header", label: "Expenses per IS", cells: { label: "Expenses per IS" } },
    { id: "exp-is", type: "data", cells: { label: "Expenses per Income Statement", ...pc(p =>
      calc.calcCOGS(tb, p) + calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p) + calc.calcOtherExpense(tb, p)
    ) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "net-income", type: "data", cells: { label: "Net Income per IS", ...npc(p => calc.calcNetIncome(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ── Tab ID → Builder mapping ────────────────────────────────────────────
export const TAB_GRID_BUILDERS: Record<string, (dealData: DealData) => GridData> = {
  "setup": buildSetupGrid,
  "trial-balance": buildTrialBalanceGrid,
  "qoe-analysis": buildQoEAnalysisGrid,
  "is-bs-reconciliation": buildISBSReconciliationGrid,
  "dd-adjustments-1": (d) => buildDDAdjustmentsGrid(d, 1),
  "dd-adjustments-2": (d) => buildDDAdjustmentsGrid(d, 2),
  "income-statement": buildIncomeStatementGrid,
  "is-detailed": buildISDetailedGrid,
  "balance-sheet": buildBalanceSheetGrid,
  "bs-detailed": buildBSDetailedGrid,
  "sales": buildSalesGrid,
  "cogs": buildCOGSGrid,
  "opex": buildOpExGrid,
  "other-expense": buildOtherExpenseGrid,
  "payroll": buildPayrollGrid,
  "working-capital": buildWorkingCapitalGrid,
  "nwc-analysis": buildNWCAnalysisGrid,
  "cash": buildCashGrid,
  "ar-aging": buildARAgingGrid,
  "other-current-assets": buildOtherCurrentAssetsGrid,
  "fixed-assets": buildFixedAssetsGrid,
  "ap-aging": buildAPAgingGrid,
  "other-current-liabilities": buildOtherCurrentLiabilitiesGrid,
  "supplementary": buildSupplementaryGrid,
  "top-customers": buildTopCustomersGrid,
  "top-vendors": buildTopVendorsGrid,
  "proof-of-cash": buildProofOfCashGrid,
  "free-cash-flow": buildFreeCashFlowGrid,
};
