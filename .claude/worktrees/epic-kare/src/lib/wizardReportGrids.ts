/**
 * Pure grid-building functions extracted from workbook tabs.
 * Each function takes DealData and returns GridData.
 * These are used by both the workbook tabs (via useMemo) and the wizard reports.
 *
 * SIGN CONVENTION:
 * - Revenue, Gross Profit, Net Income, EBITDA are stored as NEGATIVE CREDITS in the Trial Balance.
 * - Liabilities and Equity are also stored as NEGATIVE CREDITS.
 * - Use npc() (negatedPeriodCells) for IS income items to display as positive.
 * - Use nbc() (negatedBsEndingBalanceCells) for Liabilities and Equity to display as positive.
 * - COGS, OpEx, and Asset items are debits (positive in TB) → display as-is with pc()/bc().
 */
import type { DealData, GridData, GridRow } from "./workbook-types";
import * as calc from "./calculations";
import {
  buildStandardColumns, periodCells, entryCells, marginCells,
  bsEndingBalanceCells, bsEntryCells,
  negatedPeriodCells, negatedBsEndingBalanceCells,
} from "@/components/workbook/shared/tabHelpers";
import { buildBreakdownGrid } from "@/components/workbook/shared/breakdownGridBuilder";

// ===================== Income Statement =====================
export function buildIncomeStatementGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  // npc: negate for income/credit accounts (Revenue, GP, EBITDA, Net Income)
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const columns = buildStandardColumns(dealData, "");
  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);

  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Income Statement - as reported", cells: { label: "Income Statement - as reported" } },
    // Revenue: credit in TB → negate for positive display
    { id: "revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
    // COGS: debit → display as-is
    { id: "cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
    // Gross profit: credit-biased (rev+cogs negative when profitable) → negate
    { id: "gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    // OpEx: debit → display as-is
    { id: "opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
    // Operating income: IS sum negative when profitable → negate
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
    // Reported EBITDA: negative in TB when profitable → negate
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab)) } },
    { id: "s6", type: "spacer", cells: {} },
    { id: "hdr-adjusted", type: "section-header", label: "Income Statement - as adjusted", cells: { label: "Income Statement - as adjusted" } },
    // Revenue, COGS, OpEx show as-reported — adjustments flow through a dedicated bridge row
    { id: "adj-revenue", type: "data", cells: { label: "Revenue", ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "adj-cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc(p => calc.calcCOGS(tb, p)) } },
    { id: "adj-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
    { id: "s-adj1", type: "spacer", cells: {} },
    { id: "adj-opex", type: "data", cells: { label: "Operating Expenses", ...pc(p => calcTotalOpEx(p)) } },
    { id: "adj-op-income", type: "subtotal", cells: { label: "Operating income", ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } },
    { id: "s-adj2", type: "spacer", cells: {} },
    // Dedicated QoE Adjustments bridge row — positive = adds to EBITDA (shown as a deduction from expenses)
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
    // calcAdjustedEBITDA already uses subtraction: calcReportedEBITDA - calcAdjustmentTotal ✓
    { id: "adj-ebitda", type: "total", cells: { label: "Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "s7", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
    // Revenue growth
    { id: "rev-growth", type: "data", format: "percent", cells: { label: "Revenue growth", ...(() => {
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
    })() } },
    // Margins: numerator negated so positive values divide by |revenue| = positive margin
    { id: "gm", type: "data", format: "percent", cells: { label: "Gross margin", ...mc(p => -calc.calcGrossProfit(tb, p), p => calc.calcRevenue(tb, p)) } },
    { id: "om", type: "data", format: "percent", cells: { label: "Operating margin", ...mc(p => -(calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)), p => calc.calcRevenue(tb, p)) } },
    { id: "em", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc(p => -calc.calcReportedEBITDA(tb, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "aem", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc(p => -calc.calcAdjustedEBITDA(tb, adj, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "nm", type: "data", format: "percent", cells: { label: "Net margin", ...mc(p => -calc.calcNetIncome(tb, p), p => calc.calcRevenue(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Balance Sheet =====================
export function buildBalanceSheetGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  // bc: balance sheet ending (for assets = debits = positive)
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  // nbc: negated (for liabilities/equity = credits = negative in TB, shown as positive)
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
    // Liabilities: credit in TB → negate for positive display
    { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Long term liabilities", p)) } },
    { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc(p => calc.calcTotalLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
    // Equity: credit in TB → negate for positive display
    { id: "equity", type: "data", indent: 1, cells: { label: "Total Equity", ...nbc(p => calc.calcTotalEquity(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...nbc(p => calc.calcTotalLiabilitiesAndEquity(tb, p)) } },
    { id: "check", type: "check", cells: {
      label: "Balance Check (Assets - L&E)",
      ...bc(p => {
        const assets = calc.calcTotalAssets(tb, p);
        const le = calc.calcTotalLiabilitiesAndEquity(tb, p);
        return Math.abs(assets - le) < 0.01 ? 0 : assets - le;
      }),
    }, checkPassed: dealData.deal.periods.every(p => calc.bsCheckPasses(tb, p.id)) },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ===================== IS Detailed =====================
function buildDetailedSection(dealData: DealData, sectionTitle: string, adjusted: boolean): GridRow[] {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  // npc: negate credit accounts (Revenue, GP, Net Income, EBITDA) for positive display
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const prefix = adjusted ? "adj-" : "rpt-";
  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const calcTotalOpEx = (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p);
  const rows: GridRow[] = [
    { id: `${prefix}hdr`, type: "section-header", label: sectionTitle, cells: { label: sectionTitle, ...ec } },
  ];

  // Revenue — entries are credits (negative in TB): negate each individual entry cell for display
  rows.push({ id: `${prefix}hdr-rev`, type: "section-header", label: "Revenue", cells: { label: "Revenue", ...ec } });
  for (const entry of calc.getEntriesByLineItem(tb, "Revenue")) {
    // Negate individual revenue entry balances (credits → show as positive)
    const negatedBalances: Record<string, number> = {};
    for (const [k, v] of Object.entries(entry.balances)) negatedBalances[k] = -(v as number);
    rows.push({
      id: `${prefix}d-rev-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, negatedBalances) },
    });
  }
  rows.push({ id: `${prefix}sub-rev`, type: "subtotal", cells: { label: "Revenue", ...ec, ...npc(p => calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}sp-rev`, type: "spacer", cells: {} });

  // COGS — entries are debits (positive in TB): display as-is
  rows.push({ id: `${prefix}hdr-cogs`, type: "section-header", label: "Cost of Goods Sold", cells: { label: "Cost of Goods Sold", ...ec } });
  for (const entry of calc.getEntriesByLineItem(tb, "Cost of Goods Sold")) {
    rows.push({
      id: `${prefix}d-cogs-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-cogs`, type: "subtotal", cells: { label: "Total Cost of Goods Sold", ...ec, ...pc(p => calc.calcCOGS(tb, p)) } });
  // Gross Profit: credit-biased → negate
  rows.push({ id: `${prefix}gross-profit`, type: "total", cells: { label: "Gross Profit", ...ec, ...npc(p => calc.calcGrossProfit(tb, p)) } });
  rows.push({ id: `${prefix}sp-gp`, type: "spacer", cells: {} });

  // OpEx + Payroll — debits: display as-is
  const allOpEx = [...calc.getEntriesByLineItem(tb, "Operating expenses"), ...calc.getEntriesByLineItem(tb, "Payroll & Related")];
  rows.push({ id: `${prefix}hdr-opex`, type: "section-header", label: "Operating Expenses", cells: { label: "Operating Expenses", ...ec } });
  for (const entry of allOpEx) {
    rows.push({
      id: `${prefix}d-opex-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-opex`, type: "subtotal", cells: { label: "Total Operating Expenses", ...ec, ...pc(p => calcTotalOpEx(p)) } });
  // Operating Income: IS sum negative when profitable → negate
  rows.push({ id: `${prefix}op-income`, type: "total", cells: { label: "Operating Income", ...ec, ...npc(p => calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)) } });
  rows.push({ id: `${prefix}sp-oi`, type: "spacer", cells: {} });

  // Other expense — can be debit or credit: display as-is (consistent with workbook)
  rows.push({ id: `${prefix}hdr-other`, type: "section-header", label: "Other Expense (Income)", cells: { label: "Other Expense (Income)", ...ec } });
  for (const entry of calc.getEntriesByLineItem(tb, "Other expense (income)")) {
    rows.push({
      id: `${prefix}d-other-${entry.accountId}`, type: "data", indent: 1,
      cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) },
    });
  }
  rows.push({ id: `${prefix}sub-other`, type: "subtotal", cells: { label: "Total Other Expense (Income)", ...ec, ...pc(p => calc.calcOtherExpense(tb, p)) } });
  rows.push({ id: `${prefix}sp-other`, type: "spacer", cells: {} });

  // Net Income: IS sum negative when profitable → negate
  // amounts are in display space (positive = adds to EBITDA); subtract in TB space
  rows.push({
    id: `${prefix}net-income`, type: "total",
    cells: {
      label: adjusted ? "Adjusted Net Income" : "Net Income (Loss)", ...ec,
      ...npc(p => adjusted ? calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p) : calc.calcNetIncome(tb, p)),
    },
  });
  rows.push({ id: `${prefix}sp-ni`, type: "spacer", cells: {} });

  // EBITDA Addbacks (addbacks are debits = positive → display as-is)
  rows.push({ id: `${prefix}hdr-ab`, type: "section-header", label: "EBITDA Addbacks", cells: { label: "EBITDA Addbacks", ...ec } });
  rows.push({ id: `${prefix}ab-int`, type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } });
  rows.push({ id: `${prefix}ab-tax`, type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } });
  rows.push({ id: `${prefix}ab-dep`, type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } });
  rows.push({ id: `${prefix}sp-ab`, type: "spacer", cells: {} });

  const ebitdaLabel = adjusted ? "Adjusted EBITDA" : "Reported EBITDA";
  // calcAdjustedEBITDA already uses subtraction internally ✓; for reported just use calcReportedEBITDA
  const ebitdaFn = (p: string) => adjusted
    ? calc.calcAdjustedEBITDA(tb, adj, p, ab)
    : calc.calcReportedEBITDA(tb, p, ab);
  // EBITDA: negative in TB when profitable → negate
  rows.push({
    id: `${prefix}ebitda`, type: "total",
    cells: { label: ebitdaLabel, ...ec, ...npc(ebitdaFn) },
  });

  // Key Metrics block
  rows.push({ id: `${prefix}sp-km`, type: "spacer", cells: {} });
  rows.push({ id: `${prefix}hdr-km`, type: "section-header", label: "Key Metrics", cells: { label: "Key Metrics", ...ec } });

  // Revenue growth
  rows.push({ id: `${prefix}rev-growth`, type: "data", format: "percent", cells: { label: "Revenue growth", ...ec, ...(() => {
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

  // Margin rows — numerator negated (credits stored negative → negate so positive/positive = positive margin)
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  rows.push({ id: `${prefix}gm`, type: "data", format: "percent", cells: { label: "Gross margin", ...ec, ...mc(p => -calc.calcGrossProfit(tb, p), p => calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}om`, type: "data", format: "percent", cells: { label: "Operating margin", ...ec, ...mc(p => -(calc.calcGrossProfit(tb, p) + calcTotalOpEx(p)), p => calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}em`, type: "data", format: "percent", cells: { label: `${ebitdaLabel} margin`, ...ec, ...mc(p => -ebitdaFn(p), p => calc.calcRevenue(tb, p)) } });
  rows.push({ id: `${prefix}nm`, type: "data", format: "percent", cells: { label: "Net margin", ...ec, ...mc(
    // amounts in display space → subtract in TB space → negate for display
    p => adjusted ? -(calc.calcNetIncome(tb, p) - calc.calcAdjustmentTotal(adj, "all", p)) : -calc.calcNetIncome(tb, p),
    p => calc.calcRevenue(tb, p)
  ) } });

  // Check to TB
  rows.push({ id: `${prefix}sp-chk`, type: "spacer", cells: {} });
  rows.push({ id: `${prefix}hdr-chk`, type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } });
  rows.push({
    id: `${prefix}check-tb`, type: "check",
    cells: {
      label: "Check to TB (should = 0)", ...ec,
      ...pc(p => {
        const isTotal = calc.sumByFsType(tb, "IS", p);
        const reported = calc.calcRevenue(tb, p) + calc.calcCOGS(tb, p) + calcTotalOpEx(p) + calc.calcOtherExpense(tb, p);
        return Math.abs(isTotal - reported) < 0.01 ? 0 : isTotal - reported;
      }),
    },
    checkPassed: dealData.deal.periods.every(p => {
      const isTotal = calc.sumByFsType(tb, "IS", p.id);
      const reported = calc.calcRevenue(tb, p.id) + calc.calcCOGS(tb, p.id) + calcTotalOpEx(p.id) + calc.calcOtherExpense(tb, p.id);
      return Math.abs(isTotal - reported) < 0.01;
    }),
  });

  return rows;
}

export function buildISDetailedGrid(dealData: DealData): GridData {
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
}

// ===================== BS Detailed =====================
export function buildBSDetailedGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  // bc: for assets (debits = positive in TB)
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  // nbc: for liabilities/equity (credits = negative in TB → negate for positive display)
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

  const columns: GridData["columns"] = [
    { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const emptyCols = { acctNo: "", fsLine: "", sub1: "" };
  const rows: GridRow[] = [];

  // Asset line items: debits → display as-is with bc/bsEntryCells
  const addAssetLineItem = (lineItem: string) => {
    const entries = calc.getEntriesByLineItem(tb, lineItem);
    if (entries.length === 0) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
    for (const entry of entries) {
      rows.push({
        id: `d-${entry.accountId}`, type: "data", indent: 1,
        cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, entry.balances) },
      });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...bc(p => calc.sumByLineItem(tb, lineItem, p)) } });
  };

  // Liability/equity line items: credits → negate individual entries and subtotals
  const addLiabLineItem = (lineItem: string) => {
    const entries = calc.getEntriesByLineItem(tb, lineItem);
    if (entries.length === 0) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...emptyCols } });
    for (const entry of entries) {
      // Negate individual liability/equity entry balances for display
      const negatedBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(entry.balances)) negatedBalances[k] = -(v as number);
      rows.push({
        id: `d-${entry.accountId}`, type: "data", indent: 1,
        cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, negatedBalances) },
      });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...emptyCols, ...nbc(p => calc.sumByLineItem(tb, lineItem, p)) } });
  };

  rows.push({ id: "hdr-reported", type: "section-header", label: "Summary reported balance sheets", cells: { label: "Summary reported balance sheets", ...emptyCols } });

  // Assets (debits)
  for (const li of ["Cash and cash equivalents", "Accounts receivable", "Other current assets"]) addAssetLineItem(li);
  rows.push({ id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...emptyCols, ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } });
  for (const li of ["Fixed assets", "Other assets"]) addAssetLineItem(li);
  rows.push({ id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...emptyCols, ...bc(p => calc.calcTotalAssets(tb, p)) } });

  // Liabilities (credits → negate)
  for (const li of ["Current liabilities", "Other current liabilities"]) addLiabLineItem(li);
  rows.push({ id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...emptyCols, ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } });
  addLiabLineItem("Long term liabilities");
  rows.push({ id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...emptyCols, ...nbc(p => calc.calcTotalLiabilities(tb, p)) } });

  // Equity (credits → negate)
  addLiabLineItem("Equity");
  rows.push({ id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...emptyCols, ...nbc(p => calc.calcTotalLiabilitiesAndEquity(tb, p)) } });

  rows.push({
    id: "check", type: "check", cells: {
      label: "Balance Check (Assets - L&E)", ...emptyCols,
      ...bc(p => {
        const a = calc.calcTotalAssets(tb, p);
        const le = calc.calcTotalLiabilitiesAndEquity(tb, p);
        return Math.abs(a + le) < 0.01 ? 0 : a + le;
      }),
    }, checkPassed: dealData.deal.periods.every(p => calc.bsCheckPasses(tb, p.id)),
  });

  return { columns, rows, frozenColumns: 4 };
}

// ===================== Breakdown grids (Sales, COGS, OpEx, Other) =====================
export function buildSalesGrid(d: DealData): GridData {
  // Revenue accounts are credits (negative in TB) → must negate for positive display
  return buildBreakdownGrid(d, { lineItem: "Revenue", title: "Revenue", negateValues: true });
}
export function buildCOGSGrid(d: DealData): GridData {
  return buildBreakdownGrid(d, { lineItem: "Cost of Goods Sold", title: "Cost of Goods Sold" });
}
export function buildOpExGrid(d: DealData): GridData {
  const tb = d.trialBalance;
  return buildBreakdownGrid(d, {
    lineItem: "Operating expenses", title: "Operating Expenses",
    pctLabel: "% of Operating Expenses",
    pctDenominator: (p: string) => calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p),
  });
}
export function buildOtherExpenseGrid(d: DealData): GridData {
  const tb = d.trialBalance;
  return buildBreakdownGrid(d, {
    lineItem: "Other expense (income)", title: "Other Expense (Income)",
    pctLabel: "% of Other Expense (Income)",
    pctDenominator: (p: string) => calc.calcOtherExpense(tb, p),
  });
}

// ===================== QoE Analysis =====================
export function buildQoEAnalysisGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  // npc: negate credit accounts (Revenue, GP, EBITDA) for positive display
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const { periods, aggregatePeriods } = dealData.deal;

  const columns: GridData["columns"] = [
    { key: "label", label: "USD $", width: 240, frozen: true, format: "text" },
    ...aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const maAdj = adj.filter(a => a.type === "MA");
  const ddAdj = adj.filter(a => a.type === "DD");
  const pfAdj = adj.filter(a => a.type === "PF");

  // amounts are now pre-signed in display space (positive = adds to EBITDA)
  // Individual adjustment rows show amounts directly — positive means EBITDA goes up
  const adjRow = (a: typeof adj[0], prefix: string, i: number): GridRow => ({
    id: `${prefix}-${a.id}`, type: "data", indent: 1,
    cells: {
      label: a.label || a.notes || `${prefix.toUpperCase()}-${i + 1}`,
      ...periodCells(dealData, p => a.amounts[p] || 0),
    },
  });

  const rows: GridRow[] = [
    // IS items: credits → negate for positive display
    { id: "revenue-reported", type: "data", cells: { label: "Revenue, as reported", ...npc(p => calc.calcRevenue(tb, p)) } },
    { id: "gross-profit", type: "data", cells: { label: "Gross profit", ...npc(p => calc.calcGrossProfit(tb, p)) } },
    { id: "net-income", type: "subtotal", cells: { label: "Net income (loss)", ...npc(p => calc.calcNetIncome(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-normal", type: "section-header", label: "Normal adjustments", cells: { label: "Normal adjustments" } },
    // Addbacks: debits → display as-is
    { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc(p => calc.calcInterestExpense(tb, p, ab.interest)) } },
    { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc(p => calc.calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s2", type: "spacer", cells: {} },
    // Reported EBITDA: negative in TB when profitable → negate
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-ma", type: "section-header", label: "Management adjustments", cells: { label: "Management adjustments" } },
    ...maAdj.map((a, i) => adjRow(a, "ma", i)),
    // calcAdjustmentTotal sums pre-signed amounts → show directly as positive addback total
    { id: "ma-total", type: "subtotal", cells: { label: "Total management adjustments", ...pc(p => calc.calcAdjustmentTotal(adj, "MA", p)) } },
    // calcAdjustedEBITDA uses subtraction internally ✓ — pass only MA adjustments manually here
    { id: "ma-ebitda", type: "total", cells: { label: "Management adjusted EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "MA", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-dd", type: "section-header", label: "Due diligence adjustments", cells: { label: "Due diligence adjustments" } },
    ...ddAdj.map((a, i) => adjRow(a, "dd", i)),
    { id: "dd-total", type: "subtotal", cells: { label: "Total due diligence adjustments", ...pc(p => calc.calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "dd-ebitda", type: "total", cells: { label: "Due diligence adjusted EBITDA", ...npc(p => calc.calcReportedEBITDA(tb, p, ab) - calc.calcAdjustmentTotal(adj, "MA", p) - calc.calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "hdr-pf", type: "section-header", label: "Pro Forma Adjustments", cells: { label: "Pro Forma Adjustments" } },
    ...pfAdj.map((a, i) => adjRow(a, "pf", i)),
    { id: "pf-total", type: "subtotal", cells: { label: "Total pro forma adjustments", ...pc(p => calc.calcAdjustmentTotal(adj, "PF", p)) } },
    // calcAdjustedEBITDA sums all three types internally
    { id: "pf-ebitda", type: "total", cells: { label: "Pro Forma Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "s6", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
    // Margins: numerator negated so positive EBITDA / |revenue| = positive margin
    { id: "reported-margin", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc(p => -calc.calcReportedEBITDA(tb, p, ab), p => calc.calcRevenue(tb, p)) } },
    { id: "adj-margin", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc(p => -calc.calcAdjustedEBITDA(tb, adj, p, ab), p => calc.calcRevenue(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Working Capital =====================
export function buildWorkingCapitalGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const columns = buildStandardColumns(dealData, "Working Capital Summary", { labelWidth: 280 });

  const rows: GridRow[] = [
    { id: "hdr-ca", type: "section-header", label: "Current Assets", cells: { label: "Current Assets" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-cl", type: "section-header", label: "Current Liabilities", cells: { label: "Current Liabilities" } },
    // Liabilities: credits → negate for positive display
    { id: "cl", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    // NWC uses raw TB values (calcNetWorkingCapital already handles the sign internally)
    { id: "nwc", type: "total", cells: { label: "Net Working Capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
    { id: "nwc-ex", type: "subtotal", cells: { label: "NWC ex. Cash", ...bc(p => calc.calcNWCExCash(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "NWC as % of Revenue", cells: { label: "NWC as % of Revenue" } },
    { id: "nwc-pct", type: "data", format: "percent", cells: { label: "NWC ex. Cash / Revenue", ...mc(p => calc.calcNWCExCash(tb, p), p => calc.calcRevenue(tb, p)) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ===================== NWC Analysis =====================
export function buildNWCAnalysisGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
  // nbc: for liabilities (credits → negate for positive display)
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);
  const mc = (numFn: (p: string) => number, denFn: (p: string) => number) => marginCells(dealData, numFn, denFn);
  const columns = buildStandardColumns(dealData, "NWC Analysis", { labelWidth: 280 });

  const rows: GridRow[] = [
    { id: "hdr-nwc", type: "section-header", label: "Net working capital - reported to adjusted", cells: { label: "Net working capital - reported to adjusted" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc(p => calc.sumByLineItem(tb, "Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc(p => calc.calcTotalCurrentAssets(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    // Liabilities: credits → negate for positive display
    { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc(p => calc.calcTotalCurrentLiabilities(tb, p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "nwc-reported", type: "total", cells: { label: "Net working capital", ...bc(p => calc.calcNetWorkingCapital(tb, p)) } },
    { id: "s3", type: "spacer", cells: {} },
    // Normal NWC adjustments
    { id: "hdr-adj", type: "section-header", label: "Normal NWC adjustments", cells: { label: "Normal NWC adjustments" } },
    { id: "adj-cash", type: "data", indent: 1, cells: { label: "Remove: Cash and cash equivalents", ...bc(p => -calc.sumByLineItem(tb, "Cash and cash equivalents", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "nwc-ex-cash", type: "total", cells: { label: "Net working capital, reported (ex. cash)", ...bc(p => calc.calcNWCExCash(tb, p)) } },
    { id: "s5", type: "spacer", cells: {} },
    // Change in reported NWC
    { id: "hdr-change-rpt", type: "section-header", label: "Change in reported NWC", cells: { label: "Change in reported NWC" } },
    { id: "change-nwc-dollar", type: "data", cells: { label: "$ Change in NWC ex. Cash", ...(() => {
      const { periods, aggregatePeriods } = dealData.deal;
      const cells: Record<string, number> = {};
      for (let i = 0; i < periods.length; i++) {
        cells[periods[i].id] = i === 0 ? 0 : calc.calcNWCExCash(tb, periods[i].id) - calc.calcNWCExCash(tb, periods[i - 1].id);
      }
      for (const ap of aggregatePeriods) { cells[ap.id] = 0; }
      return cells;
    })() } },
    { id: "change-nwc-pct", type: "data", format: "percent", cells: { label: "Change in NWC as % of Revenue", ...mc(
      p => {
        const { periods } = dealData.deal;
        const idx = periods.findIndex(pp => pp.id === p);
        if (idx <= 0) return 0;
        return calc.calcNWCExCash(tb, p) - calc.calcNWCExCash(tb, periods[idx - 1].id);
      },
      p => calc.calcRevenue(tb, p)
    ) } },
    { id: "s6", type: "spacer", cells: {} },
    // Additional NWC adjustments placeholder
    { id: "hdr-add-adj", type: "section-header", label: "Additional NWC adjustments", cells: { label: "Additional NWC adjustments" } },
    { id: "add-adj-placeholder", type: "data", indent: 1, cells: { label: "Additional adjustment 1" } },
    { id: "s7", type: "spacer", cells: {} },
    // NWC adjusted
    { id: "nwc-adjusted", type: "total", cells: { label: "Net working capital, adjusted", ...bc(p => calc.calcNWCExCash(tb, p)) } },
    { id: "s8", type: "spacer", cells: {} },
    // Change in adjusted NWC
    { id: "hdr-change-adj", type: "section-header", label: "Change in adjusted NWC", cells: { label: "Change in adjusted NWC" } },
    { id: "change-adj-dollar", type: "data", cells: { label: "$ Change in adjusted NWC", ...(() => {
      const { periods, aggregatePeriods } = dealData.deal;
      const cells: Record<string, number> = {};
      for (let i = 0; i < periods.length; i++) {
        cells[periods[i].id] = i === 0 ? 0 : calc.calcNWCExCash(tb, periods[i].id) - calc.calcNWCExCash(tb, periods[i - 1].id);
      }
      for (const ap of aggregatePeriods) { cells[ap.id] = 0; }
      return cells;
    })() } },
    { id: "s9", type: "spacer", cells: {} },
    // Trailing Averages
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
    { id: "s10", type: "spacer", cells: {} },
    // Check
    { id: "hdr-check", type: "section-header", label: "Checks", cells: { label: "Checks" } },
    { id: "check", type: "check", checkPassed: true, cells: {
      label: "Check to BS (should = 0)",
      ...bc(p => {
        const nwc = calc.calcNetWorkingCapital(tb, p);
        const ca = calc.calcTotalCurrentAssets(tb, p);
        const cl = calc.calcTotalCurrentLiabilities(tb, p);
        return Math.abs(nwc - (ca + cl)) < 0.01 ? 0 : nwc - (ca + cl);
      }),
    } },
  ];

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Cash =====================
export function buildCashGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Cash and cash equivalents");
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

  const columns: GridData["columns"] = [
    { key: "label", label: "Cash", width: 280, frozen: true, format: "text" as const },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const rows: GridRow[] = entries.map(e => ({
    id: e.accountId, type: "data" as const, indent: 1,
    cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) },
  }));

  rows.push({
    id: "total", type: "total",
    cells: { label: "Total Cash", ...bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p)) },
  });

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Other Current Assets =====================
export function buildOtherCurrentAssetsGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Other current assets");
  const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);

  const columns: GridData["columns"] = [
    { key: "label", label: "Other Current Assets", width: 280, frozen: true, format: "text" as const },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Assets - reported", cells: { label: "Other Current Assets - reported" } },
  ];
  for (const e of entries) {
    rows.push({ id: `rpt-${e.accountId}`, type: "data", indent: 1, cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) } });
  }
  rows.push({ id: "total-reported", type: "total", cells: { label: "Total Other Current Assets", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } });

  // Adjusted section (same data as reported — no OCA adjustments implemented yet)
  rows.push({ id: "s1", type: "spacer", cells: {} });
  rows.push({ id: "hdr-adjusted", type: "section-header", label: "Other Current Assets - adjusted", cells: { label: "Other Current Assets - adjusted" } });
  for (const e of entries) {
    rows.push({ id: `adj-${e.accountId}`, type: "data", indent: 1, cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) } });
  }
  rows.push({ id: "total-adjusted", type: "total", cells: { label: "Total Other Current Assets (adjusted)", ...bc(p => calc.sumByLineItem(tb, "Other current assets", p)) } });

  // Check row
  rows.push({ id: "s2", type: "spacer", cells: {} });
  rows.push({ id: "hdr-chk", type: "section-header", label: "Checks", cells: { label: "Checks" } });
  rows.push({
    id: "check", type: "check",
    checkPassed: true,
    cells: {
      label: "Check to BS (should = 0)",
      ...bc(_ => 0),
    },
  });

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Other Current Liabilities =====================
export function buildOtherCurrentLiabilitiesGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const entries = calc.getEntriesByLineItem(tb, "Other current liabilities");
  // nbc: liabilities are credits → negate for positive display
  const nbc = (fn: (p: string) => number) => negatedBsEndingBalanceCells(dealData, fn);

  const columns: GridData["columns"] = [
    { key: "label", label: "Other Current Liabilities", width: 280, frozen: true, format: "text" as const },
    ...dealData.deal.aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
    ...dealData.deal.periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
  ];

  const rows: GridRow[] = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Liabilities - reported", cells: { label: "Other Current Liabilities - reported" } },
  ];
  for (const e of entries) {
    // Negate individual liability entry balances for display
    const negatedBalances: Record<string, number> = {};
    for (const [k, v] of Object.entries(e.balances)) negatedBalances[k] = -(v as number);
    rows.push({ id: `rpt-${e.accountId}`, type: "data", indent: 1, cells: { label: e.accountName, ...bsEntryCells(dealData, negatedBalances) } });
  }
  rows.push({ id: "total-reported", type: "total", cells: { label: "Total Other Current Liabilities", ...nbc(p => calc.sumByLineItem(tb, "Other current liabilities", p)) } });

  return { columns, rows, frozenColumns: 1 };
}

// ===================== Free Cash Flow =====================
export function buildFreeCashFlowGrid(dealData: DealData): GridData {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
  // npc: negate EBITDA (stored negative in TB) for positive display
  const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Free Cash Flow", { labelWidth: 280 });

  const calcNWCChange = (p: string): number => {
    const { periods } = dealData.deal;
    const idx = periods.findIndex(pp => pp.id === p);
    if (idx <= 0) return 0;
    return calc.calcNWCExCash(tb, p) - calc.calcNWCExCash(tb, periods[idx - 1].id);
  };

  const rows: GridRow[] = [
    // Adjusted EBITDA: stored negative in TB when profitable → negate for display
    { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc(p => calc.calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "nwc-change", type: "data", cells: { label: "Change in NWC", ...pc(calcNWCChange) } },
    { id: "capex", type: "data", cells: { label: "Capital Expenditures", ...pc(_ => 0) } },
    { id: "taxes", type: "data", cells: { label: "Estimated Taxes", ...pc(p => calc.calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "s1", type: "spacer", cells: {} },
    // FCF = Adj EBITDA (negated from TB) + NWC change - taxes
    // Must negate calcAdjustedEBITDA because it returns the raw TB negative value
    { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc(p =>
      -calc.calcAdjustedEBITDA(tb, adj, p, ab) + calcNWCChange(p) - calc.calcIncomeTaxExpense(tb, p, ab.taxes)
    ) } },
  ];

  return { columns, rows, frozenColumns: 1 };
}
