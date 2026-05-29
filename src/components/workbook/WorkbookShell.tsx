/**
 * WorkbookShell - Container with tab strip and toolbar.
 * Accepts DealData directly from the adapter.
 */
import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKBOOK_TABS } from "@/lib/workbook-tabs";
import type { DealData } from "@/lib/workbook-types";
import type { TransferTotals } from "@/hooks/useTransferClassification";
import type { MockBankStatement } from "@/lib/mockDeal";
import { Spinner } from "@/components/ui/spinner";
import { useAdjustmentProofs } from "@/hooks/useAdjustmentProofs";

// Lazy-loaded tab components
const SetupTab = lazy(() => import("./tabs/SetupTab").then(m => ({ default: m.SetupTab })));
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

interface WorkbookShellProps {
  dealData: DealData;
  onDataChange?: (updatedData: DealData) => void;
  saving?: boolean;
  onExport?: () => void;
  mockBankStatements?: MockBankStatement[];
  mockTransferClassifications?: Map<string, TransferTotals>;
  onActiveTabChange?: (tabId: string) => void;
  projectId?: string;
}

// DD Adjustments tabs need special wrappers for tabIndex + proofMap
function DDAdjustments1Tab(props: { dealData: DealData; onDataChange?: (data: DealData) => void; proofMap?: Map<string, import("@/hooks/useAdjustmentProofs").AdjustmentProofSet> }) {
  return (
    <Suspense fallback={<TabFallback />}>
      <DDAdjustmentsTab {...props} tabIndex={1} proofMap={props.proofMap} />
    </Suspense>
  );
}
function DDAdjustments2Tab(props: { dealData: DealData; onDataChange?: (data: DealData) => void; proofMap?: Map<string, import("@/hooks/useAdjustmentProofs").AdjustmentProofSet> }) {
  return (
    <Suspense fallback={<TabFallback />}>
      <DDAdjustmentsTab {...props} tabIndex={2} proofMap={props.proofMap} />
    </Suspense>
  );
}

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

const TAB_COMPONENTS: Record<string, React.ComponentType<{ dealData: DealData; onDataChange?: (data: DealData) => void; proofMap?: Map<string, import("@/hooks/useAdjustmentProofs").AdjustmentProofSet> }>> = {
  "setup": SetupTab,
  "trial-balance": TrialBalanceTab,
  "qoe-analysis": QoEAnalysisTab,
  "is-bs-reconciliation": ISBSReconciliationTab,
  "dd-adjustments-1": DDAdjustments1Tab,
  "dd-adjustments-2": DDAdjustments2Tab,
  "income-statement": IncomeStatementTab,
  "is-detailed": ISDetailedTab,
  "balance-sheet": BalanceSheetTab,
  "bs-detailed": BSDetailedTab,
  "sales": SalesTab,
  "cogs": COGSTab,
  "opex": OpExTab,
  "other-expense": OtherExpenseTab,
  "payroll": PayrollTab,
  "working-capital": WorkingCapitalTab,
  "nwc-analysis": NWCAnalysisTab,
  "cash": CashTab,
  "ar-aging": ARAgingTab,
  "other-current-assets": OtherCurrentAssetsTab,
  "fixed-assets": FixedAssetsTab,
  "ap-aging": APAgingTab,
  "other-current-liabilities": OtherCurrentLiabilitiesTab,
  "supplementary": SupplementaryTab,
  "top-customers": TopCustomersTab,
  "top-vendors": TopVendorsTab,
  "proof-of-cash": ProofOfCashTab,
  "free-cash-flow": FreeCashFlowTab,
  "wip-schedule": WIPScheduleTab,
};

export function WorkbookShell({ dealData, onDataChange, saving, onExport, mockBankStatements, mockTransferClassifications, onActiveTabChange, projectId }: WorkbookShellProps) {
  const [activeTab, setActiveTab] = useState(WORKBOOK_TABS[0].id);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const { proofMap } = useAdjustmentProofs(projectId);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onActiveTabChange?.(tabId);
  }, [onActiveTabChange]);

  const scrollTabs = useCallback((direction: "left" | "right") => {
    if (!tabStripRef.current) return;
    const scrollAmount = 200;
    tabStripRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--workbook-cream))]">
      {/* Premium toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))] border-b-2 border-[hsl(var(--workbook-gold))]">
        <div className="flex items-baseline gap-4 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--workbook-gold))]">
            Quality of Earnings Workbook
          </span>
          <span className="font-serif text-lg font-semibold truncate">
            {dealData.deal.targetCompany || dealData.deal.projectName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saving !== undefined && (
            <span className="text-[11px] tracking-wide text-[hsl(var(--workbook-navy-fg))]/60">
              {saving ? "Saving…" : "Saved"}
            </span>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-1.5 h-8 text-xs bg-transparent border-[hsl(var(--workbook-gold))] text-[hsl(var(--workbook-gold))] hover:bg-[hsl(var(--workbook-gold))] hover:text-[hsl(var(--workbook-navy))]"
            >
              <Download className="w-3.5 h-3.5" />
              Export XLSX
            </Button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-5 bg-[hsl(var(--workbook-cream))]">
        <Suspense fallback={<TabFallback />}>
          {ActiveComponent ? (
            activeTab === "proof-of-cash" ? (
              <ProofOfCashTab
                dealData={dealData}
                onDataChange={onDataChange}
                mockBankStatements={mockBankStatements}
                mockTransferClassifications={mockTransferClassifications}
              />
            ) : activeTab === "dd-adjustments-1" || activeTab === "dd-adjustments-2" ? (
              <ActiveComponent dealData={dealData} onDataChange={onDataChange} proofMap={proofMap} />
            ) : (
              <ActiveComponent dealData={dealData} onDataChange={onDataChange} />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a tab to view data
            </div>
          )}
        </Suspense>
      </div>

      {/* Premium tab strip */}
      <div className="flex items-center border-t border-[hsl(var(--workbook-rule-soft))] bg-[hsl(var(--workbook-paper))]">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-8 shrink-0 rounded-none text-[hsl(var(--workbook-mid))] hover:bg-[hsl(var(--workbook-cream))]"
          onClick={() => scrollTabs("left")}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <div
          ref={tabStripRef}
          className="flex-1 flex overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {WORKBOOK_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-4 py-2.5 text-[11px] whitespace-nowrap transition-all relative",
                activeTab === tab.id
                  ? "font-serif font-semibold text-[hsl(var(--workbook-navy))] bg-[hsl(var(--workbook-cream))]"
                  : "text-[hsl(var(--workbook-mid))]/70 hover:text-[hsl(var(--workbook-navy))] hover:bg-[hsl(var(--workbook-cream))]/60"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[hsl(var(--workbook-gold))]" />
              )}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-8 shrink-0 rounded-none text-[hsl(var(--workbook-mid))] hover:bg-[hsl(var(--workbook-cream))]"
          onClick={() => scrollTabs("right")}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
