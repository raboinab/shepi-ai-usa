/**
 * WorkbookDemo — dev/demo page at /workbook/demo
 * Auth + ToS required. Tracks demo views for marketing.
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table, BarChart3 } from "lucide-react";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { InsightsView } from "@/components/insights/InsightsView";
import { createMockDealData, createMockBankStatements, createMockTransferClassifications } from "@/lib/mockDeal";
import { DemoAuthGate } from "@/components/DemoAuthGate";
import { createMockProjectData } from "@/lib/mockWizardData";
import { exportWorkbookXlsx } from "@/lib/exportWorkbookXlsx";
import { trackEvent } from "@/lib/analytics";

type ViewMode = "workbook" | "insights";

export default function WorkbookDemo() {
  const navigate = useNavigate();
  const dealData = useMemo(() => createMockDealData(), []);
  const mockBankStatements = useMemo(() => createMockBankStatements(), []);
  const mockTransferClassifications = useMemo(() => createMockTransferClassifications(), []);
  // InsightsView needs a ProjectData — use the same mock data
  const mockProject = useMemo(() => createMockProjectData(), []);
  const [viewMode, setViewMode] = useState<ViewMode>("workbook");

  // Track which view modes the user opens in the workbook demo
  useEffect(() => {
    trackEvent("workbook_tab_viewed", { demo: "workbook", tab: viewMode });
  }, [viewMode]);

  const handleExport = useCallback(() => {
    trackEvent("demo_workbook_exported", { format: "xlsx", demo: "workbook" });
    exportWorkbookXlsx({ dealData });
  }, [dealData]);

  return (
    <DemoAuthGate page="workbook">
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-2 bg-card border-b border-border shrink-0">
        {/* Left: Demo badge + title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-destructive bg-destructive/15 px-2 py-0.5 rounded uppercase tracking-wide shrink-0">
            Demo
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold truncate hidden sm:inline">Acme Industrial Supply Co.</span>
            <span className="text-xs text-muted-foreground hidden md:inline ml-2">
              Mock data · Jan 2022 – Dec 2024 · 36 months
            </span>
          </div>
        </div>

        {/* Right: View mode toggle */}
        <div className="flex items-center border rounded-md shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/wizard/demo")}
            className="gap-1 rounded-none rounded-l-md px-2 sm:px-3"
            title="Wizard"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Wizard</span>
          </Button>
          <Button
            variant={viewMode === "workbook" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("workbook")}
            className="gap-1 rounded-none border-l px-2 sm:px-3"
            title="Workbook"
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Workbook</span>
          </Button>
          <Button
            variant={viewMode === "insights" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("insights")}
            className="gap-1 rounded-none rounded-r-md border-l px-2 sm:px-3"
            title="Insights"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {viewMode === "workbook" && (
          <WorkbookShell
            dealData={dealData}
            mockBankStatements={mockBankStatements}
            mockTransferClassifications={mockTransferClassifications}
            onExport={handleExport}
          />
        )}
        {viewMode === "insights" && <InsightsView project={mockProject} />}
      </div>
    </div>
    </DemoAuthGate>
  );
}
