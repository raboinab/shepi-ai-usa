import { useState, useMemo, useReducer, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
import { ProjectSetupSection } from "./sections/ProjectSetupSection";
import { ChartOfAccountsSection } from "./sections/ChartOfAccountsSection";
import { TrialBalanceSection } from "./sections/TrialBalanceSection";
import { DocumentUploadSection } from "./sections/DocumentUploadSection";
import { DDAdjustmentsSection } from "./sections/DDAdjustmentsSection";
import { ReclassificationsSection } from "./sections/ReclassificationsSection";
import { JournalEntriesSection } from "./sections/JournalEntriesSection";
import { ARAgingSection } from "./sections/ARAgingSection";
import { APAgingSection } from "./sections/APAgingSection";
import { FixedAssetsSection } from "./sections/FixedAssetsSection";
import { InventorySection } from "./sections/InventorySection";
import { TopCustomersSection } from "./sections/TopCustomersSection";
import { TopVendorsSection } from "./sections/TopVendorsSection";
import { IncomeStatementSection } from "./sections/IncomeStatementSection";
import { BalanceSheetSection } from "./sections/BalanceSheetSection";
import { QoESummarySection } from "./sections/QoESummarySection";
import { QoEAnalysisSection } from "./sections/QoEAnalysisSection";
import { PayrollSection } from "./sections/PayrollSection";
import { NWCFCFSection } from "./sections/NWCFCFSection";
import { WorkingCapitalSection } from "./sections/WorkingCapitalSection";
import { ProofOfCashSection } from "./sections/ProofOfCashSection";
import { SupplementarySection } from "./sections/SupplementarySection";
import { MaterialContractsSection } from "./sections/MaterialContractsSection";
import { QoEExecutiveSummarySection } from "./sections/QoEExecutiveSummarySection";
import { FinancialReportsSection } from "./sections/FinancialReportsSection";
import { AnalysisReportsSection } from "./sections/AnalysisReportsSection";
import { ExportCenterSection } from "./sections/ExportCenterSection";
import { GenericReportSection } from "./sections/GenericReportSection";
import { ReconcilingISBSSection } from "./sections/ReconcilingISBSSection";

interface WizardContentProps {
  project: ProjectData;
  updateProject: (updates: Partial<ProjectData>) => void;
  updateWizardData: (section: string, data: Record<string, unknown>) => void;
  onNavigate: (phase: number, section: number) => void;
  onSave: (overrides?: Partial<ProjectData>) => void;
  inventoryEnabled?: boolean;
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
  "3-10": { phase: 3, section: 10, prev: { phase: 3, section: 9 }, next: { phase: 4, section: 1 } },
  // Phase 4: Customer & Vendor (2 sections)
  "4-1": { phase: 4, section: 1, prev: { phase: 3, section: 10 }, next: { phase: 4, section: 2 } },
  "4-2": { phase: 4, section: 2, prev: { phase: 4, section: 1 }, next: { phase: 5, section: 1 } },
  // Phase 5: Reports (18 sections - expanded with IS/BS Reconciliation)
  "5-1": { phase: 5, section: 1, prev: { phase: 4, section: 2 }, next: { phase: 5, section: 2 } },
  "5-2": { phase: 5, section: 2, prev: { phase: 5, section: 1 }, next: { phase: 5, section: 3 } },
  "5-3": { phase: 5, section: 3, prev: { phase: 5, section: 2 }, next: { phase: 5, section: 4 } },
  "5-4": { phase: 5, section: 4, prev: { phase: 5, section: 3 }, next: { phase: 5, section: 5 } },
  "5-5": { phase: 5, section: 5, prev: { phase: 5, section: 4 }, next: { phase: 5, section: 6 } }, // IS/BS Reconciliation
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
  onSwitchToInsights,
  onOpenAssistant,
}: WizardContentProps) => {
  const [pendingDocType, setPendingDocType] = useState<string | null>(null);
  const sectionKey = `${project.current_phase}-${project.current_section}`;

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

  // Build DealData and wizard reports from workbook engine
  const { dealData, wizardReports } = useMemo(() => {
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
  }, [project]);

  // Always use freshly computed reports — never serve stale wizard_data cache
  const getReportData = (key: string) => {
    return wizardReports[key] || {};
  };

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
        const docType = pendingDocType;
        if (pendingDocType) setPendingDocType(null);
        return (
          <DocumentUploadSection
            projectId={project.id}
            periods={periods}
            data={(project.wizard_data.documentUpload as Record<string, unknown>) || {}}
            updateData={(data) => updateWizardData("documentUpload", data)}
            fullWizardData={project.wizard_data as Record<string, unknown>}
            initialDocType={docType}
          />
        );
      }

      // Phase 3: Adjustments & Schedules
      case "3-1":
         return (
           <DDAdjustmentsSection 
             data={(project.wizard_data.ddAdjustments as any) || {}} 
             updateData={(data) => updateWizardData("ddAdjustments", data as unknown as Record<string, unknown>)} 
             projectId={project.id}
             periods={periods}
             coaAccounts={(project.wizard_data.chartOfAccounts as any)?.accounts || []}
             onGuideContextChange={onGuideContextChange}
             onOpenGuide={openGuide}
           />
         );
      case "3-2":
        return <ReclassificationsSection data={(project.wizard_data.reclassifications as any) || {}} updateData={(data) => updateWizardData("reclassifications", data as unknown as Record<string, unknown>)} projectId={project.id} onGuideContextChange={onGuideContextChange} onOpenGuide={openGuide} />;
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

      // Phase 4: Customer & Vendor
      case "4-1":
        return <TopCustomersSection projectId={project.id} data={(project.wizard_data.topCustomers as any) || {}} updateData={(data) => updateWizardData("topCustomers", data as unknown as Record<string, unknown>)} />;
      case "4-2":
        return <TopVendorsSection projectId={project.id} data={(project.wizard_data.topVendors as any) || {}} updateData={(data) => updateWizardData("topVendors", data as unknown as Record<string, unknown>)} />;

      // Phase 5: Reports (expanded with all spreadsheet tabs)
      // Financial Statements (all read-only, sourced from spreadsheet)
      case "5-1":
        return <IncomeStatementSection data={getReportData("incomeStatement")} periods={periods} fiscalYearEnd={fiscalYearEnd} />;
      case "5-2":
        return <GenericReportSection title="Income Statement - Detailed" description="Detailed income statement with account-level breakdown" data={getReportData("incomeStatementDetailed")} />;
      case "5-3":
        return <BalanceSheetSection data={getReportData("balanceSheet")} periods={periods} fiscalYearEnd={fiscalYearEnd} />;
      case "5-4":
        return <GenericReportSection title="Balance Sheet - Detailed" description="Detailed balance sheet with account-level breakdown" data={getReportData("balanceSheetDetailed")} />;
      
      // IS/BS Reconciliation (QC check) — computed from dealData
      case "5-5": {
        const tb55 = dealData?.trialBalance ?? [];
        const ab55 = dealData?.addbacks;
        const allPeriods55 = dealData?.deal.periods ?? [];
        // Use the last full (non-stub) period for point-in-time RE, and sum all periods for net income
        const lastPeriod55 = allPeriods55[allPeriods55.length - 1];
        // Net income: sum across all periods (IS), negated since TB stores as credit
        const netIncome55 = allPeriods55.reduce((sum, p) => sum + (-calc.calcNetIncome(tb55, p.id)), 0);
        // Retained earnings from BS equity at end of last period — negate (credit convention)
        const equity55 = lastPeriod55 ? -calc.calcTotalEquity(tb55, lastPeriod55.id) : 0;
        // Existing manual overrides from wizard_data take precedence
        const existing55 = (project.wizard_data.reconcilingISBS as Partial<{
          incomeStatementNetIncome: number;
          balanceSheetRetainedEarnings: number;
          priorRetainedEarnings: number;
          dividends: number;
          otherAdjustments: number;
          notes: string;
        }>) || {};
        return (
          <ReconcilingISBSSection
            data={{
              incomeStatementNetIncome: existing55.incomeStatementNetIncome ?? netIncome55,
              balanceSheetRetainedEarnings: existing55.balanceSheetRetainedEarnings ?? equity55,
              priorRetainedEarnings: existing55.priorRetainedEarnings ?? 0,
              dividends: existing55.dividends ?? 0,
              otherAdjustments: existing55.otherAdjustments ?? 0,
              notes: existing55.notes ?? "",
            }}
            wizardData={project.wizard_data as Record<string, unknown>}
          />
        );
      }
      
      // Detail Schedules
      case "5-6":
        return <GenericReportSection title="Sales Detail" description="Monthly sales breakdown by category" data={getReportData("salesDetail")} />;
      case "5-7":
        return <GenericReportSection title="Cost of Goods Sold" description="COGS breakdown by category" data={getReportData("cogsDetail")} />;
      case "5-8":
        return <GenericReportSection title="Operating Expenses" description="Operating expense detail by category" data={getReportData("operatingExpenses")} />;
      case "5-9":
        return <GenericReportSection title="Other Income/Expense" description="Non-operating income and expenses" data={getReportData("otherExpenseIncome")} />;
      
      // QoE Reports (read-only, sourced from spreadsheet)
      case "5-10":
         // Compute adjustment summary from ddAdjustments for display
         const ddAdjustments: QoeLedgerAdjustment[] = (project.wizard_data.ddAdjustments as any)?.adjustments || [];
         const adjustmentsSummary = {
           MA: { 
             count: ddAdjustments.filter(a => a.block === "MA").length,
             total: ddAdjustments.filter(a => a.block === "MA").reduce((sum, adj) => {
               const adjTotal = Object.values(adj.periodValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
               return sum + (adjTotal * computeSign(adj.intent));
             }, 0)
           },
           DD: { 
             count: ddAdjustments.filter(a => a.block === "DD").length,
             total: ddAdjustments.filter(a => a.block === "DD").reduce((sum, adj) => {
               const adjTotal = Object.values(adj.periodValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
               return sum + (adjTotal * computeSign(adj.intent));
             }, 0)
           },
           PF: { 
             count: ddAdjustments.filter(a => a.block === "PF").length,
             total: ddAdjustments.filter(a => a.block === "PF").reduce((sum, adj) => {
               const adjTotal = Object.values(adj.periodValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
               return sum + (adjTotal * computeSign(adj.intent));
             }, 0)
           },
           netTotal: ddAdjustments.reduce((sum, adj) => {
             const adjTotal = Object.values(adj.periodValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
             return sum + (adjTotal * computeSign(adj.intent));
           }, 0)
         };
        return (
          <QoEAnalysisSection 
            data={(project.wizard_data.qoeAnalysis as any) || {}} 
             adjustmentsSummary={adjustmentsSummary}
             onNavigateToAdjustments={() => onNavigate(3, 1)}
             onNavigateToReclassifications={() => onNavigate(3, 2)}
          />
        );
      case "5-11": {
        // Compute reportedEBITDA from dealData across all FY2024 non-stub periods.
        // TB uses credit convention (profitable EBITDA is negative), so we negate for display.
        const tb = dealData?.trialBalance ?? [];
        const ab = dealData?.addbacks;
        const allPeriods = dealData?.deal.periods ?? [];
        const totalReportedEBITDA = allPeriods
          .filter(p => !p.isStub && p.year === 2024)
          .reduce((sum, p) => sum + calc.calcReportedEBITDA(tb, p.id, ab), 0);

        // Map DD adjustments → QoeSummary adjustment shape
        const rawAdj: QoeLedgerAdjustment[] = (project.wizard_data.ddAdjustments as any)?.adjustments || [];
        const qoeAdjustments = rawAdj.map((adj: QoeLedgerAdjustment) => {
          const adjTotal = Object.values(adj.periodValues || {})
            .reduce((s: number, v: unknown) => s + (Number(v) || 0), 0);
          return {
            description: adj.description,
            amount: adjTotal * computeSign(adj.intent),
            category: adj.block === "MA" ? "Management" : adj.block === "DD" ? "Due Diligence" : "Pro Forma",
          };
        });

        const existingQoeSummary = (project.wizard_data.qoeSummary as any) || {};
        const computedQoeSummaryData = {
          // Negate: TB credit convention stores profitable EBITDA as negative; display wants positive
          reportedEBITDA: existingQoeSummary.reportedEBITDA ?? -totalReportedEBITDA,
          adjustments: existingQoeSummary.adjustments?.length ? existingQoeSummary.adjustments : qoeAdjustments,
        };

        return (
          <QoESummarySection
            data={computedQoeSummaryData}
            updateData={(data) => updateWizardData("qoeSummary", data as unknown as Record<string, unknown>)}
            dealData={dealData}
          />
        );
      }
      
      // Working Capital (read-only, sourced from spreadsheet)
      case "5-12":
        return <WorkingCapitalSection data={getReportData("workingCapital")} periods={periods} fiscalYearEnd={fiscalYearEnd} dealData={dealData} />;
      case "5-13":
        return (
          <NWCFCFSection 
            data={getReportData("nwcAnalysis")} 
            fcfData={getReportData("freeCashFlow")}
            periods={periods} 
            fiscalYearEnd={fiscalYearEnd}
            dealParameters={(project.wizard_data.dealParameters as any) || undefined}
            onUpdateDealParameters={(params) => updateWizardData("dealParameters", params as unknown as Record<string, unknown>)}
          />
        );
      case "5-14":
        return <GenericReportSection title="Cash Analysis" description="Cash flow and cash position analysis" data={getReportData("cashAnalysis")} />;
      case "5-15":
        return <GenericReportSection title="Other Current Assets" description="Prepaid expenses, deposits, and other current assets" data={getReportData("otherCurrentAssets")} />;
      case "5-16":
        return <GenericReportSection title="Other Current Liabilities" description="Accrued expenses and other current liabilities" data={getReportData("otherCurrentLiabilities")} />;
      
      // Supporting
      case "5-17":
        return (
          <ProofOfCashSection 
            data={(project.wizard_data.proofOfCash as any) || {}} 
            updateData={(data) => updateWizardData("proofOfCash", data as unknown as Record<string, unknown>)} 
            periods={periods}
            projectId={project.id}
            cashAnalysis={(project.wizard_data.cashAnalysis as any)}
          />
        );
      case "5-18":
        return <GenericReportSection title="Free Cash Flow" description="Free cash flow analysis and trends" data={getReportData("freeCashFlow")} />;

      // Phase 6: Deliverables
      case "6-1":
        return <QoEExecutiveSummarySection dealData={dealData} wizardData={project.wizard_data as Record<string, unknown>} project={project} />;
      case "6-2":
        return <FinancialReportsSection incomeStatementData={getReportData("incomeStatement")} balanceSheetData={getReportData("balanceSheet")} cashFlowData={getReportData("freeCashFlow")} />;
      case "6-3":
        return <AnalysisReportsSection dealData={dealData} nwcReportData={getReportData("nwcAnalysis")} />;
      case "6-4":
        return <ExportCenterSection data={(project.wizard_data.exportCenter as any) || {}} updateData={(data) => updateWizardData("exportCenter", data as unknown as Record<string, unknown>)} wizardData={project.wizard_data} projectId={project.id} projectName={project.name} computedReports={wizardReports} dealData={dealData} onNavigateToInsights={onSwitchToInsights} />;

      default:
        return null;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 min-h-0 flex gap-0">
        <div className={cn("flex-1 min-w-0", isPhase3Adj && showGuide && !sidebarCollapsed && "lg:mr-0")}>
          {showWelcomeCard && (
            <AdjustmentsWelcomeCard
              guideContext={guideContext}
              onGotIt={handleGotIt}
              onHideForNow={handleHideForNow}
              onDontShowAgain={handleDontShowAgain}
            />
          )}
          {renderSection()}
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
