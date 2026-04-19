/**
 * Computes summary card metrics and optional chart data for each wizard report type.
 * Pulls live data from DealData using the centralized calculation engine.
 */
import type { DealData, TrialBalanceEntry } from "./workbook-types";
import type { AddbackMapping } from "./calculations";
import * as calc from "./calculations";
import { computeQoEMetrics } from "./qoeMetrics";
import * as rh from "./reclassHelpers";
import type { LucideIcon } from "lucide-react";

export interface DashboardCard {
  title: string;
  value: number | string;
  subtitle?: string;
  iconName: string;
  isCurrency?: boolean;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export interface DashboardChartPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface DashboardConfig {
  cards: DashboardCard[];
  chart?: {
    type: "bar" | "line" | "dual";
    data: DashboardChartPoint[];
    dataKey: string;
    dataKey2?: string;
    label: string;
    label2?: string;
  };
}

type ReportType =
  | "incomeStatement"
  | "incomeStatementDetailed"
  | "balanceSheet"
  | "balanceSheetDetailed"
  | "isbsReconciliation"
  | "salesDetail"
  | "cogsDetail"
  | "operatingExpenses"
  | "otherExpenseIncome"
  | "qoeAnalysis"
  | "workingCapital"
  | "cashAnalysis"
  | "otherCurrentAssets"
  | "otherCurrentLiabilities"
  | "freeCashFlow";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => (isNaN(n) ? "N/A" : `${(n * 100).toFixed(1)}%`);

function getLatestPeriodIds(dd: DealData, count = 12): string[] {
  const active = dd.deal.periods.filter(p => !p.isStub);
  return active.slice(-count).map(p => p.id);
}

function sumAcrossPeriods(tb: TrialBalanceEntry[], fn: (tb: TrialBalanceEntry[], pid: string) => number, periodIds: string[]): number {
  return periodIds.reduce((sum, pid) => sum + fn(tb, pid), 0);
}

function buildFYTrend(dd: DealData, metricFn: (tb: TrialBalanceEntry[], rc: DealData["reclassifications"], pids: string[]) => number): DashboardChartPoint[] {
  return dd.deal.fiscalYears.map(fy => {
    const pids = fy.periods.map(p => p.id);
    return { label: fy.label, value: metricFn(dd.trialBalance, dd.reclassifications, pids) };
  });
}

export function getReportDashboard(reportType: ReportType, dd: DealData | null): DashboardConfig | null {
  if (!dd || dd.trialBalance.length === 0) return null;

  const tb = dd.trialBalance;
  const adj = dd.adjustments;
  const ab = dd.addbacks;
  const rc = dd.reclassifications ?? [];
  const activePeriods = dd.deal.periods.filter(p => !p.isStub);
  if (activePeriods.length === 0) return null;

  const ltmPids = activePeriods.slice(-12).map(p => p.id);
  const lastPid = activePeriods[activePeriods.length - 1].id;

  switch (reportType) {
    case "incomeStatement":
    case "incomeStatementDetailed": {
      const revenue = rh.reclassAwareRevenue(tb, rc, ltmPids);
      const grossProfit = rh.reclassAwareGrossProfit(tb, rc, ltmPids);
      const opIncome = rh.reclassAwareOperatingIncome(tb, rc, ltmPids);
      const netIncome = rh.reclassAwareNetIncome(tb, rc, ltmPids);
      const grossMargin = revenue > 0 ? grossProfit / revenue : NaN;

      return {
        cards: [
          { title: "LTM Revenue", value: revenue, iconName: "TrendingUp", isCurrency: true },
          { title: "Gross Profit", value: grossProfit, iconName: "DollarSign", isCurrency: true, subtitle: `Margin: ${pct(grossMargin)}` },
          { title: "Operating Income", value: opIncome, iconName: "BarChart3", isCurrency: true },
          { title: "Net Income", value: netIncome, iconName: "Wallet", isCurrency: true },
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => rh.reclassAwareRevenue(t, r, pids)),
          dataKey: "value",
          label: "Revenue",
        },
      };
    }

    case "balanceSheet":
    case "balanceSheetDetailed": {
      const totalAssets = calc.calcTotalAssets(tb, lastPid);
      const totalLiab = calc.calcTotalLiabilities(tb, lastPid);
      const equity = calc.calcTotalEquity(tb, lastPid);
      const currentAssets = calc.calcTotalCurrentAssets(tb, lastPid);
      const currentLiab = calc.calcTotalCurrentLiabilities(tb, lastPid);
      const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : 0;

      return {
        cards: [
          { title: "Total Assets", value: totalAssets, iconName: "Building2", isCurrency: true },
          { title: "Total Liabilities", value: Math.abs(totalLiab), iconName: "CreditCard", isCurrency: true },
          { title: "Total Equity", value: Math.abs(equity), iconName: "Shield", isCurrency: true },
          { title: "Current Ratio", value: `${currentRatio.toFixed(2)}x`, iconName: "Scale", isCurrency: false },
        ],
      };
    }

    case "isbsReconciliation": {
      const bsCheck = calc.bsCheckPasses(tb, lastPid);
      const totalAssets = calc.calcTotalAssets(tb, lastPid);
      const totalLE = calc.calcTotalLiabilitiesAndEquity(tb, lastPid);
      const variance = Math.abs(totalAssets + totalLE);

      return {
        cards: [
          { title: "BS Check", value: bsCheck ? "✓ Balanced" : "✗ Imbalanced", iconName: "CheckCircle2", isCurrency: false },
          { title: "Total Assets", value: totalAssets, iconName: "Building2", isCurrency: true },
          { title: "Liabilities + Equity", value: Math.abs(totalLE), iconName: "Scale", isCurrency: true },
          { title: "Variance", value: variance, iconName: "AlertTriangle", isCurrency: true },
        ],
      };
    }

    case "salesDetail": {
      const revenue = rh.reclassAwareRevenue(tb, rc, ltmPids);
      const subAccounts = calc.getSubAccounts(tb, "Revenue");

      return {
        cards: [
          { title: "LTM Revenue", value: revenue, iconName: "TrendingUp", isCurrency: true },
          { title: "Revenue Streams", value: subAccounts.length || "—", iconName: "Layers", isCurrency: false },
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => rh.reclassAwareRevenue(t, r, pids)),
          dataKey: "value",
          label: "Revenue",
        },
      };
    }

    case "cogsDetail": {
      const revenue = rh.reclassAwareRevenue(tb, rc, ltmPids);
      const cogs = rh.reclassAwareCOGS(tb, rc, ltmPids);
      const grossProfit = rh.reclassAwareGrossProfit(tb, rc, ltmPids);
      const grossMargin = revenue > 0 ? grossProfit / revenue : NaN;

      return {
        cards: [
          { title: "LTM COGS", value: cogs, iconName: "Package", isCurrency: true },
          { title: "Gross Profit", value: grossProfit, iconName: "DollarSign", isCurrency: true },
          { title: "Gross Margin", value: pct(grossMargin), iconName: "Percent", isCurrency: false },
        ],
        chart: {
          type: "bar",
          data: buildFYTrend(dd, (t, r, pids) => rh.reclassAwareCOGS(t, r, pids)),
          dataKey: "value",
          label: "COGS",
        },
      };
    }

    case "operatingExpenses": {
      const revenue = rh.reclassAwareRevenue(tb, rc, ltmPids);
      const opex = rh.reclassAwareOpEx(tb, rc, ltmPids);
      const opexRatio = revenue > 0 ? opex / revenue : NaN;
      const opIncome = rh.reclassAwareOperatingIncome(tb, rc, ltmPids);
      const opMargin = revenue > 0 ? opIncome / revenue : NaN;

      return {
        cards: [
          { title: "LTM OpEx", value: opex, iconName: "Receipt", isCurrency: true },
          { title: "OpEx / Revenue", value: pct(opexRatio), iconName: "Percent", isCurrency: false },
          { title: "Operating Income", value: opIncome, iconName: "TrendingUp", isCurrency: true },
          { title: "Operating Margin", value: pct(opMargin), iconName: "BarChart3", isCurrency: false },
        ],
      };
    }

    case "otherExpenseIncome": {
      const otherExp = rh.reclassAwareOtherExpense(tb, rc, ltmPids);

      return {
        cards: [
          { title: "LTM Other Expense (Income)", value: otherExp, iconName: "ArrowUpDown", isCurrency: true },
        ],
      };
    }

    case "qoeAnalysis": {
      const metrics = computeQoEMetrics(dd);
      const adjCount = metrics.adjustmentCount;

      return {
        cards: [
          { title: "Reported EBITDA", value: metrics.reportedEBITDA, iconName: "FileText", isCurrency: true },
          { title: "Total Adjustments", value: metrics.totalAdjustments, iconName: "PenTool", isCurrency: true, subtitle: `${adjCount} adjustment${adjCount !== 1 ? "s" : ""}` },
          { title: "Adjusted EBITDA", value: metrics.adjustedEBITDA, iconName: "Target", isCurrency: true },
        ],
        chart: {
          type: "bar",
          data: [
            { label: "Reported", value: metrics.reportedEBITDA },
            { label: "Adjustments", value: metrics.totalAdjustments },
            { label: "Adjusted", value: metrics.adjustedEBITDA },
          ],
          dataKey: "value",
          label: "EBITDA Bridge",
        },
      };
    }

    case "workingCapital": {
      const nwc = calc.calcNetWorkingCapital(tb, lastPid);
      const nwcExCash = calc.calcNWCExCash(tb, lastPid);
      const currentAssets = calc.calcTotalCurrentAssets(tb, lastPid);
      const currentLiab = calc.calcTotalCurrentLiabilities(tb, lastPid);
      const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : 0;

      return {
        cards: [
          { title: "Net Working Capital", value: nwc, iconName: "Wallet", isCurrency: true },
          { title: "NWC (ex. Cash)", value: nwcExCash, iconName: "Calculator", isCurrency: true },
          { title: "Current Ratio", value: `${currentRatio.toFixed(2)}x`, iconName: "Scale", isCurrency: false },
        ],
        chart: {
          type: "bar",
          data: activePeriods.slice(-12).map(p => ({
            label: p.shortLabel,
            value: calc.calcNWCExCash(tb, p.id),
          })),
          dataKey: "value",
          label: "NWC (ex. Cash)",
        },
      };
    }

    case "cashAnalysis": {
      const cashBalance = calc.sumByLineItem(tb, "Cash and cash equivalents", lastPid);
      const priorPid = activePeriods.length >= 2 ? activePeriods[activePeriods.length - 2].id : lastPid;
      const priorCash = calc.sumByLineItem(tb, "Cash and cash equivalents", priorPid);
      const cashChange = cashBalance - priorCash;

      return {
        cards: [
          { title: "Cash Balance", value: cashBalance, iconName: "Banknote", isCurrency: true },
          { title: "Cash Change (MoM)", value: cashChange, iconName: "ArrowUpDown", isCurrency: true, trend: cashChange > 0 ? "up" : cashChange < 0 ? "down" : "neutral", trendValue: fmt(Math.abs(cashChange)) },
        ],
        chart: {
          type: "line",
          data: activePeriods.slice(-12).map(p => ({
            label: p.shortLabel,
            value: calc.sumByLineItem(tb, "Cash and cash equivalents", p.id),
          })),
          dataKey: "value",
          label: "Cash Balance",
        },
      };
    }

    case "otherCurrentAssets": {
      const oca = calc.sumByLineItem(tb, "Other current assets", lastPid);
      const ar = calc.sumByLineItem(tb, "Accounts receivable", lastPid);

      return {
        cards: [
          { title: "Other Current Assets", value: oca, iconName: "FolderOpen", isCurrency: true },
          { title: "Accounts Receivable", value: ar, iconName: "FileText", isCurrency: true },
        ],
      };
    }

    case "otherCurrentLiabilities": {
      const ocl = calc.sumByLineItem(tb, "Other current liabilities", lastPid);
      const cl = calc.sumByLineItem(tb, "Current liabilities", lastPid);

      return {
        cards: [
          { title: "Other Current Liabilities", value: Math.abs(ocl), iconName: "AlertCircle", isCurrency: true },
          { title: "Current Liabilities", value: Math.abs(cl), iconName: "CreditCard", isCurrency: true },
        ],
      };
    }

    case "freeCashFlow": {
      const adjEBITDA = rh.reclassAwareAdjustedEBITDA(tb, rc, adj, ltmPids, ab);
      const nwcStart = calc.calcNWCExCash(tb, ltmPids[0]);
      const nwcEnd = calc.calcNWCExCash(tb, ltmPids[ltmPids.length - 1]);
      const nwcDelta = nwcEnd - nwcStart;

      return {
        cards: [
          { title: "Adj. EBITDA (LTM)", value: adjEBITDA, iconName: "TrendingUp", isCurrency: true },
          { title: "NWC Change", value: nwcDelta, iconName: "ArrowUpDown", isCurrency: true },
        ],
      };
    }

    default:
      return null;
  }
}
