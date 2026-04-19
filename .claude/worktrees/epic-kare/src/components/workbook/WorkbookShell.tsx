/**
 * WorkbookShell - Container with tab strip and toolbar.
 * Accepts DealData directly from the adapter.
 */
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKBOOK_TABS } from "@/lib/workbook-tabs";
import type { DealData } from "@/lib/workbook-types";
import type { TransferTotals } from "@/hooks/useTransferClassification";
import type { MockBankStatement } from "@/lib/mockDeal";

// Tab components
import { SetupTab } from "./tabs/SetupTab";
import { TrialBalanceTab } from "./tabs/TrialBalanceTab";
import { QoEAnalysisTab } from "./tabs/QoEAnalysisTab";
import { DDAdjustmentsTab } from "./tabs/DDAdjustmentsTab";
import { IncomeStatementTab } from "./tabs/IncomeStatementTab";
import { ISDetailedTab } from "./tabs/ISDetailedTab";
import { BalanceSheetTab } from "./tabs/BalanceSheetTab";
import { BSDetailedTab } from "./tabs/BSDetailedTab";
import { SalesTab } from "./tabs/SalesTab";
import { COGSTab } from "./tabs/COGSTab";
import { OpExTab } from "./tabs/OpExTab";
import { OtherExpenseTab } from "./tabs/OtherExpenseTab";
import { PayrollTab } from "./tabs/PayrollTab";
import { WorkingCapitalTab } from "./tabs/WorkingCapitalTab";
import { NWCAnalysisTab } from "./tabs/NWCAnalysisTab";
import { CashTab } from "./tabs/CashTab";
import { ARAgingTab } from "./tabs/ARAgingTab";
import { OtherCurrentAssetsTab } from "./tabs/OtherCurrentAssetsTab";
import { FixedAssetsTab } from "./tabs/FixedAssetsTab";
import { APAgingTab } from "./tabs/APAgingTab";
import { OtherCurrentLiabilitiesTab } from "./tabs/OtherCurrentLiabilitiesTab";
import { SupplementaryTab } from "./tabs/SupplementaryTab";
import { TopCustomersTab } from "./tabs/TopCustomersTab";
import { TopVendorsTab } from "./tabs/TopVendorsTab";
import { ProofOfCashTab } from "./tabs/ProofOfCashTab";
import { FreeCashFlowTab } from "./tabs/FreeCashFlowTab";
import { ISBSReconciliationTab } from "./tabs/ISBSReconciliationTab";

interface WorkbookShellProps {
  dealData: DealData;
  onDataChange?: (updatedData: DealData) => void;
  saving?: boolean;
  onExport?: () => void;
  mockBankStatements?: MockBankStatement[];
  mockTransferClassifications?: Map<string, TransferTotals>;
}

// DD Adjustments tabs need special wrappers for tabIndex
function DDAdjustments1Tab(props: { dealData: DealData; onDataChange?: (data: DealData) => void }) {
  return <DDAdjustmentsTab {...props} tabIndex={1} />;
}
function DDAdjustments2Tab(props: { dealData: DealData; onDataChange?: (data: DealData) => void }) {
  return <DDAdjustmentsTab {...props} tabIndex={2} />;
}

const TAB_COMPONENTS: Record<string, React.ComponentType<{ dealData: DealData; onDataChange?: (data: DealData) => void }>> = {
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
};

export function WorkbookShell({ dealData, onDataChange, saving, onExport, mockBankStatements, mockTransferClassifications }: WorkbookShellProps) {
  const [activeTab, setActiveTab] = useState(WORKBOOK_TABS[0].id);
  const tabStripRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {dealData.deal.targetCompany || dealData.deal.projectName}
          </span>
          <span className="text-xs text-muted-foreground">
            QoE Workbook
          </span>
        </div>
        <div className="flex items-center gap-1">
          {saving !== undefined && (
            <span className="text-xs text-muted-foreground mr-2">
              {saving ? "Saving..." : "Saved"}
            </span>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1 h-7 text-xs">
              <Download className="w-3 h-3" />
              Export XLSX
            </Button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-3">
        {ActiveComponent ? (
          activeTab === "proof-of-cash" ? (
            <ProofOfCashTab
              dealData={dealData}
              onDataChange={onDataChange}
              mockBankStatements={mockBankStatements}
              mockTransferClassifications={mockTransferClassifications}
            />
          ) : (
            <ActiveComponent dealData={dealData} onDataChange={onDataChange} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a tab to view data
          </div>
        )}
      </div>

      {/* Bottom tab strip */}
      <div className="flex items-center border-t border-border bg-[hsl(var(--excel-header-bg,220_14%_96%))]">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => scrollTabs("left")}
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>

        <div
          ref={tabStripRef}
          className="flex-1 flex overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {WORKBOOK_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "excel-tab px-3 py-1.5 text-xs whitespace-nowrap border-r border-[hsl(var(--excel-grid,220_13%_91%))] transition-colors",
                activeTab === tab.id
                  ? "excel-tab-active bg-card font-semibold text-foreground border-t-2 border-t-primary"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => scrollTabs("right")}
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
