import { useState, useMemo, useReducer, useEffect, useCallback, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { guideReducer, type GuideContext, type SectionKey } from "@/lib/adjustmentsGuideContent";
import { AdjustmentsGuideSidebar } from "@/components/wizard/shared/AdjustmentsGuideSidebar";
import { AdjustmentsWelcomeCard } from "@/components/wizard/shared/AdjustmentsWelcomeCard";
import { cn } from "@/lib/utils";
import type { ProjectData } from "@/pages/Project";
import { Period } from "@/lib/periodUtils";
import type { QoeLedgerAdjustment } from "@/types/qoeLedger";
import { computeSign } from "@/lib/qoeAdjustmentTaxonomy";
import { projectToDealData } from "@/lib/projectToDealAdapter";
import { buildWizardReports } from "@/lib/wizardReportBuilder";
import * as calc from "@/lib/calculations";
import { Spinner } from "@/components/ui/spinner";

// Lazy-loaded section components
const ProjectSetupSection = lazy(() => import("./sections/ProjectSetupSection").then(m => ({ default: m.ProjectSetupSection })));
const ChartOfAccountsSection = lazy(() => import("./sections/ChartOfAccountsSection").then(m => ({ default: m.ChartOfAccountsSection })));
const TrialBalanceSection = lazy(() => import("./sections/TrialBalanceSection").then(m => ({ default: m.TrialBalanceSection })));
const DocumentUploadSection = lazy(() => import("./sections/DocumentUploadSection").then(m => ({ default: m.DocumentUploadSection })));
const DDAdjustmentsSection = lazy(() => import("./sections/DDAdjustmentsSection").then(m => ({ default: m.DDAdjustmentsSection })));
const ReclassificationsSection = lazy(() => import("./sections/ReclassificationsSection").then(m => ({ default: m.ReclassificationsSection })));
const JournalEntriesSection = lazy(() => import("./sections/JournalEntriesSection").then(m => ({ default: m.JournalEntriesSection })));
const ARAgingSection = lazy(() => import("./sections/ARAgingSection").then(m => ({ default: m.ARAgingSection })));
const APAgingSection = lazy(() => import("./sections/APAgingSection").then(m => ({ default: m.APAgingSection })));
const FixedAssetsSection = lazy(() => import("./sections/FixedAssetsSection").then(m => ({ default: m.FixedAssetsSection })));
const InventorySection = lazy(() => import("./sections/InventorySection").then(m => ({ default: m.InventorySection })));
const TopCustomersSection = lazy(() => import("./sections/TopCustomersSection").then(m => ({ default: m.TopCustomersSection })));
const TopVendorsSection = lazy(() => import("./sections/TopVendorsSection").then(m => ({ default: m.TopVendorsSection })));
const IncomeStatementSection = lazy(() => import("./sections/IncomeStatementSection").then(m => ({ default: m.IncomeStatementSection })));
const BalanceSheetSection = lazy(() => import("./sections/BalanceSheetSection").then(m => ({ default: m.BalanceSheetSection })));
const QoESummarySection = lazy(() => import("./sections/QoESummarySection").then(m => ({ default: m.QoESummarySection })));

const PayrollSection = lazy(() => import("./sections/PayrollSection").then(m => ({ default: m.PayrollSection })));
const NWCFCFSection = lazy(() => import("./sections/NWCFCFSection").then(m => ({ default: m.NWCFCFSection })));

const ProofOfCashSection = lazy(() => import("./sections/ProofOfCashSection").then(m => ({ default: m.ProofOfCashSection })));
const SupplementarySection = lazy(() => import("./sections/SupplementarySection").then(m => ({ default: m.SupplementarySection })));
const MaterialContractsSection = lazy(() => import("./sections/MaterialContractsSection").then(m => ({ default: m.MaterialContractsSection })));
const QoEExecutiveSummarySection = lazy(() => import("./sections/QoEExecutiveSummarySection").then(m => ({ default: m.QoEExecutiveSummarySection })));
const FinancialReportsSection = lazy(() => import("./sections/FinancialReportsSection").then(m => ({ default: m.FinancialReportsSection })));
const AnalysisReportsSection = lazy(() => import("./sections/AnalysisReportsSection").then(m => ({ default: m.AnalysisReportsSection })));
const ExportCenterSection = lazy(() => import("./sections/ExportCenterSection").then(m => ({ default: m.ExportCenterSection })));
const GenericReportSection = lazy(() => import("./sections/GenericReportSection").then(m => ({ default: m.GenericReportSection })));


function SectionFallback() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

// Section-level error boundary to prevent one section from crashing the whole app
class SectionErrorBoundary extends Component<
  { children: ReactNode; sectionName?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; sectionName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Section "${this.props.sectionName}" crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">This section encountered an error</p>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="text-sm text-primary underline hover:no-underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface WizardContentProps {
  project: ProjectData;
  updateProject: (updates: Partial<ProjectData>) => void;
  updateWizardData: (section: string, data: Record<string, unknown>) => void;
  onNavigate: (phase: number, section: number) => void;
  onSave: (overrides?: Partial<ProjectData>) => void;
  inventoryEnabled?: boolean;
  wipEnabled?: boolean;
  onSwitchToInsights?: () => void;
  onOpenAssistant?: (prompt?: string) => void;
}

// Section map reflecting reorganized phases with expanded Reports phase
const SECTION_MAP: Record<string, { phase: number; section: number; next?: { phase: number; section: number }; prev?: { phase: number; section: number } }> = {
  // Phase 1: Project Setup (1 combined section)
  "1-1": { phase: 1, section: 1, next: { phase: 2, section: 1 } },
  // Phase 2: Core Data Entry (3 sections)
  "2-1": { phase: 2, section: 1, prev: { phase: 1, section: 1 }, next: { phase: 2, section: 2 } },
  "2-2": { phase: 2, section: 2, prev: { phase: 2, section: 1 }, next: { phase: 2, section: 3 } },
  "2-3": { phase: 2, section: 3, prev: { phase: 2, section: 2 }, next: { phase: 3, section: 1 } },
  // Phase 3: Adjustments & Schedules (10 sections)
  "3-1": { phase: 3, section: 1, prev: { phase: 2, section: 3 }, next: { phase: 3, section: 2 } },
  "3-2": { phase: 3, section: 2, prev: { phase: 3, section: 1 }, next: { phase: 3, section: 3 } },
  "3-3": { phase: 3, section: 3, prev: { phase: 3, section: 2 }, next: { phase: 3, section: 4 } },
  "3-4": { phase: 3, section: 4, prev: { phase: 3, section: 3 }, next: { phase: 3, section: 5 } },
  "3-5": { phase: 3, section: 5, prev: { phase: 3, section: 4 }, next: { phase: 3, section: 6 } },
  "3-6": { phase: 3, section: 6, prev: { phase: 3, section: 5 }, next: { phase: 3, section: 7 } },
  "3-7": { phase: 3, section: 7, prev: { phase: 3, section: 6 }, next: { phase: 3, section: 8 } },
  "3-8": { phase: 3, section: 8, prev: { phase: 3, section: 7 }, next: { phase: 3, section: 9 } },
  "3-9": { phase: 3, section: 9, prev: { phase: 3, section: 8 }, next: { phase: 3, section: 10 } },
  "3-10": { phase: 3, section: 10, prev: { phase: 3, section: 9 }, next: { phase: 3, section: 11 } },
  "3-11": { phase: 3, section: 11, prev: { phase: 3, section: 10 }, next: { phase: 4, section: 1 } },
  // Phase 4: Customer & Vendor (2 sections)
  "4-1": { phase: 4, section: 1, prev: { phase: 3, section: 10 }, next: { phase: 4, section: 2 } },
  "4-2": { phase: 4, section: 2, prev: { phase: 4, section: 1 }, next: { phase: 5, section: 1 } },
  // Phase 5: Reports (18 sections - expanded with IS/BS Reconciliation)
  "5-1": { phase: 5, section: 1, prev: { phase: 4, section: 2 }, next: { phase: 5, section: 2 } },
  "5-2": { phase: 5, section: 2, prev: { phase: 5, section: 1 }, next: { phase: 5, section: 3 } },
  "5-3": { phase: 5, section: 3, prev: { phase: 5, section: 2 }, next: { phase: 5, section: 4 } },
  "5-4": { phase: 5, section: 4, prev: { phase: 5, section: 3 }, next: { phase: 5, section: 5 } },
  "5-5": { phase: 5, section: 5, prev: { phase: 5, section: 4 }, next: { phase: 5, section: 6 } },
  "5-6": { phase: 5, section: 6, prev: { phase: 5, section: 5 }, next: { phase: 5, section: 7 } },
  "5-7": { phase: 5, section: 7, prev: { phase: 5, section: 6 }, next: { phase: 5, section: 8 } },
  "5-8": { phase: 5, section: 8, prev: { phase: 5, section: 7 }, next: { phase: 5, section: 9 } },
  "5-9": { phase: 5, section: 9, prev: { phase: 5, section: 8 }, next: { phase: 5, section: 10 } },
  "5-10": { phase: 5, section: 10, prev: { phase: 5, section: 9 }, next: { phase: 5, section: 11 } },
  "5-11": { phase: 5, section: 11, prev: { phase: 5, section: 10 }, next: { phase: 5, section: 12 } },
  "5-12": { phase: 5, section: 12, prev: { phase: 5, section: 11 }, next: { phase: 5, section: 13 } },
  "5-13": { phase: 5, section: 13, prev: { phase: 5, section: 12 }, next: { phase: 5, section: 14 } },
  "5-14": { phase: 5, section: 14, prev: { phase: 5, section: 13 }, next: { phase: 5, section: 15 } },
  "5-15": { phase: 5, section: 15, prev: { phase: 5, section: 14 }, next: { phase: 5, section: 16 } },
  "5-16": { phase: 5, section: 16, prev: { phase: 5, section: 15 }, next: { phase: 5, section: 17 } },
  "5-17": { phase: 5, section: 17, prev: { phase: 5, section: 16 }, next: { phase: 5, section: 18 } },
  "5-18": { phase: 5, section: 18, prev: { phase: 5, section: 17 }, next: { phase: 6, section: 1 } },
  // Phase 6: Deliverables (4 sections)
  "6-1": { phase: 6, section: 1, prev: { phase: 5, section: 18 }, next: { phase: 6, section: 2 } },
  "6-2": { phase: 6, section: 2, prev: { phase: 6, section: 1 }, next: { phase: 6, section: 3 } },
  "6-3": { phase: 6, section: 3, prev: { phase: 6, section: 2 }, next: { phase: 6, section: 4 } },
  "6-4": { phase: 6, section: 4, prev: { phase: 6, section: 3 } },
};

// Helper to get periods and fiscal year end
const getPeriodData = (project: ProjectData) => {
  const rawPeriods = project.periods;
  const periods: Period[] = Array.isArray(rawPeriods)
    ? (rawPeriods as unknown[]).filter((p): p is Period => typeof p === 'object' && p !== null && 'id' in p)
    : [];
  const fiscalYearEnd = project.fiscal_year_end ? parseInt(project.fiscal_year_end.split('-')[1] || '12') : 12;
  return { periods, fiscalYearEnd };
};

export const WizardContent = ({
  project,
  updateProject,
  updateWizardData,
  onNavigate,
  onSave,
  inventoryEnabled = false,
  wipEnabled = false,
  onSwitchToInsights,
  onOpenAssistant,
}: WizardContentProps) => {
  const [pendingDocType, setPendingDocType] = useState<string | null>(null);
  const sectionKey = `${project.current_phase}-${project.current_section}`;

  // Clear pendingDocType after it's been consumed by DocumentUploadSection
  useEffect(() => {
    if (sectionKey !== "2-3" && pendingDocType) {
      setPendingDocType(null);
    }
  }, [sectionKey, pendingDocType]);

  // ── Guide sidebar state ──
  const isPhase3Adj = sectionKey === "3-1" || sectionKey === "3-2" || sectionKey === "3-3";
  const [guideContext, dispatchGuide] = useReducer(guideReducer, { sectionKey: "3-1" as SectionKey });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isPhase3Adj) {
      dispatchGuide({ type: "setSection", sectionKey: sectionKey as SectionKey });
    }
  }, [sectionKey, isPhase3Adj]);

  // Persistence flags
  const guideSettings = ((project.wizard_data as Record<string, unknown>)?.settings as Record<string, unknown>) || {};
  const dismissedUntil = Number(guideSettings.adjustmentsGuideDismissedUntil ?? 0);
  const guideComplete = Boolean(guideSettings.adjustmentsGuideComplete);
  const welcomeSeen = Boolean(guideSettings.adjustmentsWelcomeSeen);
  const showGuide = isPhase3Adj && !guideComplete && Date.now() > dismissedUntil;
  const showWelcomeCard = isPhase3Adj && !guideComplete && !welcomeSeen;

  const updateGuideSettings = useCallback((patch: Record<string, unknown>) => {
    updateWizardData("settings", { ...guideSettings, ...patch });
  }, [guideSettings, updateWizardData]);

  const handleGotIt = useCallback(() => updateGuideSettings({ adjustmentsWelcomeSeen: true }), [updateGuideSettings]);
  const handleHideForNow = useCallback(() => updateGuideSettings({ adjustmentsGuideDismissedUntil: Date.now() + 24 * 60 * 60 * 1000, adjustmentsWelcomeSeen: true }), [updateGuideSettings]);
  const handleDontShowAgain = useCallback(() => updateGuideSettings({ adjustmentsWelcomeSeen: true, adjustmentsGuideComplete: true }), [updateGuideSettings]);
  const handleDismissGuide = useCallback(() => updateGuideSettings({ adjustmentsGuideComplete: true }), [updateGuideSettings]);
  const handleReopenGuide = useCallback(() => {
    updateGuideSettings({ adjustmentsGuideComplete: false });
    setSidebarCollapsed(false);
  }, [updateGuideSettings]);

  const onGuideContextChange = useCallback((patch: Partial<GuideContext>) => {
    dispatchGuide({ type: "merge", patch });
  }, []);

  const openGuide = useCallback(() => {
    if (guideComplete) return;
    setSidebarCollapsed(false);
    if (dismissedUntil > 0 && Date.now() > dismissedUntil) {
      updateGuideSettings({ adjustmentsGuideDismissedUntil: 0 });
    }
  }, [guideComplete, dismissedUntil, updateGuideSettings]);
  
  // Get navigation info with dynamic adjustments for disabled sections
  const getNavInfo = () => {
    const baseNavInfo = SECTION_MAP[sectionKey];
    if (!baseNavInfo) return null;
    
    // Skip Inventory (3-7) when disabled
    if (!inventoryEnabled) {
      if (sectionKey === "3-6" && baseNavInfo.next?.phase === 3 && baseNavInfo.next?.section === 7) {
        return { ...baseNavInfo, next: { phase: 3, section: 8 } };
      }
      if (sectionKey === "3-8" && baseNavInfo.prev?.phase === 3 && baseNavInfo.prev?.section === 7) {
        return { ...baseNavInfo, prev: { phase: 3, section: 6 } };
      }
    }
    
    // Skip WIP Schedule (3-11) when disabled
    if (!wipEnabled) {
      if (sectionKey === "3-10" && baseNavInfo.next?.phase === 3 && baseNavInfo.next?.section === 11) {
        return { ...baseNavInfo, next: { phase: 4, section: 1 } };
      }
      if (sectionKey === "4-1" && baseNavInfo.prev?.phase === 3 && baseNavInfo.prev?.section === 11) {
        return { ...baseNavInfo, prev: { phase: 3, section: 10 } };
      }
    }
    
    return baseNavInfo;
  };
  
  const navInfo = getNavInfo();

  const handleNext = () => {
    if (navInfo?.next) {
      onNavigate(navInfo.next.phase, navInfo.next.section);
      onSave();
    }
  };

  const handlePrev = () => {
    if (navInfo?.prev) {
      onNavigate(navInfo.prev.phase, navInfo.prev.section);
    }
  };

  const { periods, fiscalYearEnd } = getPeriodData(project);

  // Only compute DealData and wizard reports for phases that need them (5+)
  const needsReports = (project.current_phase ?? 1) >= 5;
  
  const { dealData, wizardReports } = useMemo(() => {
    if (!needsReports) {
      return { dealData: null, wizardReports: {} };
    }
    try {
      const dd = projectToDealData({
        id: project.id,
        name: project.name,
        client_name: project.client_name ?? null,
        target_company: project.target_company ?? null,
        industry: project.industry ?? null,
        transaction_type: project.transaction_type ?? null,
        fiscal_year_end: project.fiscal_year_end ?? null,
        periods: (project.periods as unknown as Period[]) ?? null,
        wizard_data: project.wizard_data as Record<string, unknown> | null,
      });
      return { dealData: dd, wizardReports: buildWizardReports(dd) };
    } catch (e) {
      console.warn("Failed to build wizard reports:", e);
      return { dealData: null, wizardReports: {} };
    }
  }, [needsReports, project.id, project.wizard_data, project.periods]);

  // Always use freshly computed reports — never serve stale wizard_data cache
  const getReportData = (key: string) => {
    return wizardReports[key] || {};
  };

  const isDemo = project.id === "demo";

  const renderSection = () => {
    const key = `${project.current_phase}-${project.current_section}`;

    switch (key) {
      // Phase 1: Project Setup
      case "1-1":
        return (
          <ProjectSetupSection
            project={project}
            updateProject={updateProject}
            updateWizardData={updateWizardData}
            dueDiligenceData={(project.wizard_data.dueDiligence as Record<string, unknown>) || {}}
            updateDueDiligenceData={(data) => updateWizardData("dueDiligence", data)}
            onNavigate={onNavigate}
            onSave={async (overrides) => onSave(overrides)}
          />
        );

      // Phase 2: Core Data Entry
      case "2-1":
        return (
          <ChartOfAccountsSection 
            projectId={project.id}
            data={(project.wizard_data.chartOfAccounts as any) || {}} 
            updateData={(data) => updateWizardData("chartOfAccounts", data as unknown as Record<string, unknown>)}
            onAutoImport={() => onSave()}
            onNavigate={onNavigate}
            onOpenAssistant={onOpenAssistant}
            onSave={(overrides) => onSave(overrides as Partial<ProjectData>)}
            wizardData={project.wizard_data as Record<string, unknown>}
          />
        );
      case "2-2":
        return (
          <TrialBalanceSection
            projectId={project.id}
            data={(project.wizard_data.trialBalance as Record<string, unknown>) || {}}
            updateData={(data) => updateWizardData("trialBalance", data)}
            periods={periods}
            fiscalYearEnd={fiscalYearEnd}
            coaAccounts={(project.wizard_data.chartOfAccounts as any)?.accounts || []}
            onNavigate={onNavigate}
            onSave={(overrides) => onSave(overrides as Partial<ProjectData>)}
            wizardData={project.wizard_data as Record<string, unknown>}
          />
        );
      case "2-3": {
        return (
          <DocumentUploadSection
            projectId={project.id}
            periods={periods}
            data={(project.wizard_data.documentUpload as Record<string, unknown>) || {}}
            updateData={(data) => updateWizardData("documentUpload", data)}
            fullWizardData={project.wizard_data as Record<string, unknown>}
            initialDocType={pendingDocType}
          />
        );
      }

      // Phase 3: Adjustments & Schedules
      case "3-1":
        return <ReclassificationsSection data={(project.wizard_data.reclassifications as any) || {}} updateData={(data) => updateWizardData("reclassifications", data as unknown as Record<string, unknown>)} projectId={project.id} onGuideContextChange={onGuideContextChange} onOpenGuide={openGuide} isDemo={isDemo} mockFlags={isDemo ? (project.wizard_data.reclassificationFlags as any) : undefined} />;
      case "3-2":
         return (
            <DDAdjustmentsSection 
              data={(project.wizard_data.ddAdjustments as any) || {}} 
              updateData={(data) => updateWizardData("ddAdjustments", data as unknown as Record<string, unknown>)}
              projectId={project.id}
              periods={periods}
              fiscalYearEnd={fiscalYearEnd}
              coaAccounts={(project.wizard_data.chartOfAccounts as any)?.accounts || []}
              trialBalanceAccounts={(project.wizard_data.trialBalance as any)?.accounts || []}
              onGuideContextChange={onGuideContextChange}
              onOpenGuide={openGuide}
               isDemo={isDemo}
               mockProposals={isDemo ? (project.wizard_data.discoveryProposals as any) : undefined}
            />
         );
      case "3-3":
        return <JournalEntriesSection projectId={project.id} data={(project.wizard_data.journalEntries as any) || { entries: [], totalCount: 0 }} onUpdate={(data) => updateWizardData("journalEntries", data as unknown as Record<string, unknown>)} onGuideContextChange={onGuideContextChange} />;
      case "3-4":
        return <ARAgingSection projectId={project.id} data={(project.wizard_data.arAging as any) || {}} updateData={(data) => updateWizardData("arAging", data as unknown as Record<string, unknown>)} periods={periods} />;
      case "3-5":
        return <APAgingSection projectId={project.id} data={(project.wizard_data.apAging as any) || {}} updateData={(data) => updateWizardData("apAging", data as unknown as Record<string, unknown>)} periods={periods} />;
      case "3-6":
        return <FixedAssetsSection data={(project.wizard_data.fixedAssets as any) || {}} updateData={(data) => updateWizardData("fixedAssets", data as unknown as Record<string, unknown>)} projectId={project.id} />;
      case "3-7":
        return <InventorySection data={(project.wizard_data.inventory as any) || {}} updateData={(data) => updateWizardData("inventory", data as unknown as Record<string, unknown>)} />;
      case "3-8":
        return (
          <PayrollSection
            data={(project.wizard_data.payroll as any) || {}}
            periods={periods}
            fiscalYearEnd={fiscalYearEnd}
            projectId={project.id}
            trialBalanceAccounts={(project.wizard_data.trialBalance as any)?.accounts || []}
            onTrialBalanceChange={(accounts) => {
              const tbData = (project.wizard_data.trialBalance as Record<string, unknown>) || {};
              updateWizardData("trialBalance", { ...tbData, accounts });
            }}
          />
        );
      case "3-9":
        return <SupplementarySection data={(project.wizard_data.supplementary as any) || {}} updateData={(data) => updateWizardData("supplementary", data as unknown as Record<string, unknown>)} projectId={project.id} />;
      case "3-10":
        return <MaterialContractsSection data={(project.wizard_data.materialContracts as any) || {}} updateData={(data) => updateWizardData("materialContracts", data as unknown as Record<string, unknown>)} projectId={project.id} />;
      case "3-11":
        return <div className="p-6 text-center text-muted-foreground">WIP Schedule is available in the Workbook view. Navigate to Reports → Workbook to use the WIP Schedule tab.</div>;

      // Phase 4: Customer & Vendor
      case "4-1":
        return <TopCustomersSection projectId={project.id} data={(project.wizard_data.topCustomers as any) || {}} updateData={(data) => updateWizardData("topCustomers", data as unknown as Record<string, unknown>)} />;
      case "4-2":
        return <TopVendorsSection projectId={project.id} data={(project.wizard_data.topVendors as any) || {}} updateData={(data) => updateWizardData("topVendors", data as unknown as Record<string, unknown>)} />;

      // Phase 5: Reports (expanded with all spreadsheet tabs)
      case "5-1":
        return <IncomeStatementSection data={getReportData("incomeStatement")} periods={periods} fiscalYearEnd={fiscalYearEnd} dealData={dealData} />;
      case "5-2":
        return <GenericReportSection title="Income Statement - Detailed" description="Detailed income statement with account-level breakdown" data={getReportData("incomeStatementDetailed")} dealData={dealData} reportType="incomeStatementDetailed" />;
      case "5-3":
        return <BalanceSheetSection data={getReportData("balanceSheet")} periods={periods} fiscalYearEnd={fiscalYearEnd} dealData={dealData} />;
      case "5-4":
        return <GenericReportSection title="Balance Sheet - Detailed" description="Detailed balance sheet with account-level breakdown" data={getReportData("balanceSheetDetailed")} dealData={dealData} reportType="balanceSheetDetailed" />;
      
      // IS/BS Reconciliation (QC check) — uses workbook grid
      case "5-5":
        return <GenericReportSection title="Reconciling IS & BS" description="Side-by-side reconciliation of Income Statement and Balance Sheet to audited financials" data={getReportData("isbsReconciliation")} dealData={dealData} reportType="isbsReconciliation" />;
      
      // Detail Schedules
      case "5-6":
        return <GenericReportSection title="Sales Detail" description="Monthly sales breakdown by category" data={getReportData("salesDetail")} dealData={dealData} reportType="salesDetail" />;
      case "5-7":
        return <GenericReportSection title="Cost of Goods Sold" description="COGS breakdown by category" data={getReportData("cogsDetail")} dealData={dealData} reportType="cogsDetail" />;
      case "5-8":
        return <GenericReportSection title="Operating Expenses" description="Operating expense detail by category" data={getReportData("operatingExpenses")} dealData={dealData} reportType="operatingExpenses" />;
      case "5-9":
        return <GenericReportSection title="Other Income/Expense" description="Non-operating income and expenses" data={getReportData("otherExpenseIncome")} dealData={dealData} reportType="otherExpenseIncome" />;
      
      // QoE Reports
      case "5-10":
        return (
          <GenericReportSection
            title="QoE Analysis"
            description="EBITDA bridge and adjustment summary computed from your Trial Balance and adjustments"
            data={getReportData("qoeAnalysis")}
            dealData={dealData}
            reportType="qoeAnalysis"
          />
        );
      case "5-11":
        return (
          <QoESummarySection
            dealData={dealData}
          />
        );
      
      // Working Capital
      case "5-12":
        return (
          <GenericReportSection
            title="Working Capital"
            description="Current assets and liabilities analysis (excluding cash and debt)"
            data={getReportData("workingCapital")}
            dealData={dealData}
            reportType="workingCapital"
          />
        );
      case "5-13":
        return (
          <NWCFCFSection 
            nwcAnalysisData={getReportData("nwcAnalysis")} 
            fcfData={getReportData("freeCashFlow")}
            periods={periods} 
            fiscalYearEnd={fiscalYearEnd}
            dealData={dealData}
            dealParameters={(project.wizard_data.dealParameters as any) || undefined}
            onUpdateDealParameters={(params) => updateWizardData("dealParameters", params as unknown as Record<string, unknown>)}
          />
        );
      case "5-14":
        return <GenericReportSection title="Cash Analysis" description="Cash flow and cash position analysis" data={getReportData("cashAnalysis")} dealData={dealData} reportType="cashAnalysis" />;
      case "5-15":
        return <GenericReportSection title="Other Current Assets" description="Prepaid expenses, deposits, and other current assets" data={getReportData("otherCurrentAssets")} dealData={dealData} reportType="otherCurrentAssets" />;
      case "5-16":
        return <GenericReportSection title="Other Current Liabilities" description="Accrued expenses and other current liabilities" data={getReportData("otherCurrentLiabilities")} dealData={dealData} reportType="otherCurrentLiabilities" />;
      
      // Supporting
      case "5-17":
        return (
          <SectionErrorBoundary sectionName="Proof of Cash">
            <ProofOfCashSection 
              data={(project.wizard_data.proofOfCash as any) || {}} 
              updateData={(data) => updateWizardData("proofOfCash", data as unknown as Record<string, unknown>)} 
              periods={periods}
              projectId={project.id}
              cashAnalysis={(project.wizard_data.cashAnalysis as any)}
              dealData={dealData}
              isDemo={isDemo}
            />
          </SectionErrorBoundary>
        );
      case "5-18":
        return <GenericReportSection title="Free Cash Flow" description="Free cash flow analysis and trends" data={getReportData("freeCashFlow")} dealData={dealData} reportType="freeCashFlow" />;

      // Phase 6: Deliverables
      case "6-1":
        return <QoEExecutiveSummarySection dealData={dealData} wizardData={project.wizard_data as Record<string, unknown>} project={project} />;
      case "6-2":
        return <FinancialReportsSection incomeStatementData={getReportData("incomeStatement")} balanceSheetData={getReportData("balanceSheet")} cashFlowData={getReportData("freeCashFlow")} />;
      case "6-3":
        return <AnalysisReportsSection dealData={dealData} nwcReportData={getReportData("nwcAnalysis")} />;
      case "6-4":
        return <ExportCenterSection data={(project.wizard_data.exportCenter as any) || {}} updateData={(data) => updateWizardData("exportCenter", data as unknown as Record<string, unknown>)} wizardData={project.wizard_data} projectId={project.id} projectName={project.name} computedReports={wizardReports} dealData={dealData} onNavigateToInsights={onSwitchToInsights} isDemo={isDemo} />;

      default:
        return null;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 min-h-0 flex gap-0">
        <div className={cn("flex-1 min-w-0", isPhase3Adj && showGuide && !sidebarCollapsed && "lg:mr-0")}>
          {isPhase3Adj && guideComplete && (
            <div className="flex justify-end mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReopenGuide}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reopen learning guide</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {showWelcomeCard && (
            <AdjustmentsWelcomeCard
              guideContext={guideContext}
              onGotIt={handleGotIt}
              onHideForNow={handleHideForNow}
              onDontShowAgain={handleDontShowAgain}
            />
          )}
          <Suspense fallback={<SectionFallback />}>
            {renderSection()}
          </Suspense>
        </div>

        {isPhase3Adj && (
          <AdjustmentsGuideSidebar
            guideContext={guideContext}
            onOpenAssistant={onOpenAssistant ? (prompt?: string) => onOpenAssistant(prompt) : undefined}
            onNavigate={onNavigate}
            onDismiss={handleDismissGuide}
            visible={showGuide}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border shrink-0">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={!navInfo?.prev}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!navInfo?.next}
          className="gap-2"
        >
          {navInfo?.next ? (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            "Complete"
          )}
        </Button>
      </div>
    </div>
  );
};
