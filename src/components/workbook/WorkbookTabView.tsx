/**
 * WorkbookTabView — renders the exact same grid the Workbook page renders
 * for a given tab id. Used by wizard sections so the wizard and workbook
 * surface identical numbers, cell-for-cell.
 */
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { DealData } from "@/lib/workbook-types";

const TrialBalanceTab = lazy(() => import("./tabs/TrialBalanceTab").then(m => ({ default: m.TrialBalanceTab })));
const QoEAnalysisTab = lazy(() => import("./tabs/QoEAnalysisTab").then(m => ({ default: m.QoEAnalysisTab })));
const DDAdjustmentsTab = lazy(() => import("./tabs/DDAdjustmentsTab").then(m => ({ default: m.DDAdjustmentsTab })));
const IncomeStatementTab = lazy(() => import("./tabs/IncomeStatementTab").then(m => ({ default: m.IncomeStatementTab })));
const ISDetailedTab = lazy(() => import("./tabs/ISDetailedTab").then(m => ({ default: m.ISDetailedTab })));
const BalanceSheetTab = lazy(() => import("./tabs/BalanceSheetTab").then(m => ({ default: m.BalanceSheetTab })));
const BSDetailedTab = lazy(() => import("./tabs/BSDetailedTab").then(m => ({ default: m.BSDetailedTab })));
const SalesTab = lazy(() => import("./tabs/SalesTab").then(m => ({ default: m.SalesTab })));
const COGSTab = lazy(() => import("./tabs/COGSTab").then(m => ({ default: m.COGSTab })));
const OpExTab = lazy(() => import("./tabs/OpExTab").then(m => ({ default: m.OpExTab })));
const OtherExpenseTab = lazy(() => import("./tabs/OtherExpenseTab").then(m => ({ default: m.OtherExpenseTab })));
const PayrollTab = lazy(() => import("./tabs/PayrollTab").then(m => ({ default: m.PayrollTab })));
const WorkingCapitalTab = lazy(() => import("./tabs/WorkingCapitalTab").then(m => ({ default: m.WorkingCapitalTab })));
const NWCAnalysisTab = lazy(() => import("./tabs/NWCAnalysisTab").then(m => ({ default: m.NWCAnalysisTab })));
const CashTab = lazy(() => import("./tabs/CashTab").then(m => ({ default: m.CashTab })));
const ARAgingTab = lazy(() => import("./tabs/ARAgingTab").then(m => ({ default: m.ARAgingTab })));
const OtherCurrentAssetsTab = lazy(() => import("./tabs/OtherCurrentAssetsTab").then(m => ({ default: m.OtherCurrentAssetsTab })));
const FixedAssetsTab = lazy(() => import("./tabs/FixedAssetsTab").then(m => ({ default: m.FixedAssetsTab })));
const APAgingTab = lazy(() => import("./tabs/APAgingTab").then(m => ({ default: m.APAgingTab })));
const OtherCurrentLiabilitiesTab = lazy(() => import("./tabs/OtherCurrentLiabilitiesTab").then(m => ({ default: m.OtherCurrentLiabilitiesTab })));
const SupplementaryTab = lazy(() => import("./tabs/SupplementaryTab").then(m => ({ default: m.SupplementaryTab })));
const TopCustomersTab = lazy(() => import("./tabs/TopCustomersTab").then(m => ({ default: m.TopCustomersTab })));
const TopVendorsTab = lazy(() => import("./tabs/TopVendorsTab").then(m => ({ default: m.TopVendorsTab })));
const ProofOfCashTab = lazy(() => import("./tabs/ProofOfCashTab").then(m => ({ default: m.ProofOfCashTab })));
const FreeCashFlowTab = lazy(() => import("./tabs/FreeCashFlowTab").then(m => ({ default: m.FreeCashFlowTab })));
const ISBSReconciliationTab = lazy(() => import("./tabs/ISBSReconciliationTab").then(m => ({ default: m.ISBSReconciliationTab })));
const WIPScheduleTab = lazy(() => import("./tabs/WIPScheduleTab").then(m => ({ default: m.WIPScheduleTab })));

type TabComp = React.ComponentType<{ dealData: DealData; onDataChange?: (data: DealData) => void }>;

const TAB_BY_ID: Record<string, TabComp> = {
  "trial-balance": TrialBalanceTab as unknown as TabComp,
  "qoe-analysis": QoEAnalysisTab as unknown as TabComp,
  "is-bs-reconciliation": ISBSReconciliationTab as unknown as TabComp,
  "income-statement": IncomeStatementTab as unknown as TabComp,
  "is-detailed": ISDetailedTab as unknown as TabComp,
  "balance-sheet": BalanceSheetTab as unknown as TabComp,
  "bs-detailed": BSDetailedTab as unknown as TabComp,
  "sales": SalesTab as unknown as TabComp,
  "cogs": COGSTab as unknown as TabComp,
  "opex": OpExTab as unknown as TabComp,
  "other-expense": OtherExpenseTab as unknown as TabComp,
  "payroll": PayrollTab as unknown as TabComp,
  "working-capital": WorkingCapitalTab as unknown as TabComp,
  "nwc-analysis": NWCAnalysisTab as unknown as TabComp,
  "cash": CashTab as unknown as TabComp,
  "ar-aging": ARAgingTab as unknown as TabComp,
  "other-current-assets": OtherCurrentAssetsTab as unknown as TabComp,
  "fixed-assets": FixedAssetsTab as unknown as TabComp,
  "ap-aging": APAgingTab as unknown as TabComp,
  "other-current-liabilities": OtherCurrentLiabilitiesTab as unknown as TabComp,
  "supplementary": SupplementaryTab as unknown as TabComp,
  "top-customers": TopCustomersTab as unknown as TabComp,
  "top-vendors": TopVendorsTab as unknown as TabComp,
  "proof-of-cash": ProofOfCashTab as unknown as TabComp,
  "free-cash-flow": FreeCashFlowTab as unknown as TabComp,
  "wip-schedule": WIPScheduleTab as unknown as TabComp,
  "dd-adjustments-1": DDAdjustmentsTab as unknown as TabComp,
  "dd-adjustments-2": DDAdjustmentsTab as unknown as TabComp,
};

export interface WorkbookTabViewProps {
  tabId: string;
  dealData: DealData | null;
  onDataChange?: (data: DealData) => void;
}

export function WorkbookTabView({ tabId, dealData, onDataChange }: WorkbookTabViewProps) {
  const Comp = TAB_BY_ID[tabId];
  if (!Comp) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        No workbook tab is registered for <code>{tabId}</code>.
      </div>
    );
  }
  if (!dealData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-8"><Spinner className="h-5 w-5 text-muted-foreground" /></div>}>
      <Comp dealData={dealData} onDataChange={onDataChange} />
    </Suspense>
  );
}

/** Map wizard reportType strings to workbook tab ids. */
export const REPORT_TYPE_TO_TAB_ID: Record<string, string> = {
  incomeStatement: "income-statement",
  incomeStatementDetailed: "is-detailed",
  balanceSheet: "balance-sheet",
  balanceSheetDetailed: "bs-detailed",
  isbsReconciliation: "is-bs-reconciliation",
  salesDetail: "sales",
  cogsDetail: "cogs",
  operatingExpenses: "opex",
  otherExpenseIncome: "other-expense",
  qoeAnalysis: "qoe-analysis",
  workingCapital: "working-capital",
  nwcAnalysis: "nwc-analysis",
  cashAnalysis: "cash",
  otherCurrentAssets: "other-current-assets",
  otherCurrentLiabilities: "other-current-liabilities",
  freeCashFlow: "free-cash-flow",
};
