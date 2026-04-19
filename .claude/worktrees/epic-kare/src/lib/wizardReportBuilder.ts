/**
 * Orchestrates building all wizard report data from DealData.
 * Returns a map of report keys to { rawData: string[][] }.
 */
import type { DealData } from "./workbook-types";
import { gridDataToRawData } from "./gridToRawData";
import {
  buildIncomeStatementGrid,
  buildISDetailedGrid,
  buildBalanceSheetGrid,
  buildBSDetailedGrid,
  buildSalesGrid,
  buildCOGSGrid,
  buildOpExGrid,
  buildOtherExpenseGrid,
  buildQoEAnalysisGrid,
  buildWorkingCapitalGrid,
  buildNWCAnalysisGrid,
  buildCashGrid,
  buildOtherCurrentAssetsGrid,
  buildOtherCurrentLiabilitiesGrid,
  buildFreeCashFlowGrid,
} from "./wizardReportGrids";

export interface WizardReportData {
  rawData: string[][];
  syncedAt?: string;
}

type ReportKey =
  | "incomeStatement"
  | "incomeStatementDetailed"
  | "balanceSheet"
  | "balanceSheetDetailed"
  | "salesDetail"
  | "cogsDetail"
  | "operatingExpenses"
  | "otherExpenseIncome"
  | "qoeAnalysis"
  | "workingCapital"
  | "nwcAnalysis"
  | "cashAnalysis"
  | "otherCurrentAssets"
  | "otherCurrentLiabilities"
  | "freeCashFlow";

const REPORT_BUILDERS: Record<ReportKey, (d: DealData) => ReturnType<typeof buildIncomeStatementGrid>> = {
  incomeStatement: buildIncomeStatementGrid,
  incomeStatementDetailed: buildISDetailedGrid,
  balanceSheet: buildBalanceSheetGrid,
  balanceSheetDetailed: buildBSDetailedGrid,
  salesDetail: buildSalesGrid,
  cogsDetail: buildCOGSGrid,
  operatingExpenses: buildOpExGrid,
  otherExpenseIncome: buildOtherExpenseGrid,
  qoeAnalysis: buildQoEAnalysisGrid,
  workingCapital: buildWorkingCapitalGrid,
  nwcAnalysis: buildNWCAnalysisGrid,
  cashAnalysis: buildCashGrid,
  otherCurrentAssets: buildOtherCurrentAssetsGrid,
  otherCurrentLiabilities: buildOtherCurrentLiabilitiesGrid,
  freeCashFlow: buildFreeCashFlowGrid,
};

/**
 * Build all wizard reports from DealData.
 * Returns a map of report keys to { rawData }.
 */
export function buildWizardReports(dealData: DealData): Record<string, WizardReportData> {
  const result: Record<string, WizardReportData> = {};
  const now = new Date().toISOString();

  for (const [key, builder] of Object.entries(REPORT_BUILDERS)) {
    try {
      const gridData = builder(dealData);
      result[key] = {
        rawData: gridDataToRawData(gridData),
        syncedAt: now,
      };
    } catch (e) {
      console.warn(`Failed to build wizard report "${key}":`, e);
      result[key] = { rawData: [] };
    }
  }

  return result;
}
