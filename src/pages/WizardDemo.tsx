/**
 * WizardDemo — dev/demo page at /wizard/demo
 * Auth + ToS required via DemoAuthGate. No database queries. Pure in-memory mock.
 * All project state lives in local useState — changes are not persisted.
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { DemoAuthGate } from "@/components/DemoAuthGate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LayoutGrid, Table, BarChart3, MessageSquare, Share2, ArrowLeft, Copy, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WizardSidebar } from "@/components/wizard/WizardSidebar";
import { MobileWizardSidebar } from "@/components/wizard/MobileWizardSidebar";
import { WizardContent } from "@/components/wizard/WizardContent";
import { InsightsView } from "@/components/insights/InsightsView";
import { AIChatPanel } from "@/components/wizard/AIChatPanel";
import { DemoGuide } from "@/components/demo/DemoGuide";
import { createMockProjectData } from "@/lib/mockWizardData";
import { trackEvent } from "@/lib/analytics";
import type { ProjectData } from "@/pages/Project";

type ViewMode = "wizard" | "insights";

const MOCK_SHARE_LINK = "https://app.shepi.ai/share/demo-acme-qoe";

/** Mini QB logo icon */
function QBIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  );
}

/** Mock QuickBooks buttons — pure UI, no real API or hooks */
function MockQuickBooksButtons() {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleConnect = () => {
    toast({
      title: "Demo mode",
      description: "Sign up to connect your real QuickBooks account.",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_SHARE_LINK).catch(() => {});
    toast({ title: "Link copied", description: "Share this link with the business owner." });
  };

  const handleRefresh = () => {
    toast({ title: "Demo mode", description: "Sign up to generate a real shareable link." });
  };

  return (
    <>
      {/* Connect to QuickBooks — green, hidden on small screens */}
      <button
        onClick={handleConnect}
        className="hidden lg:inline-flex items-center gap-2 text-sm font-medium px-3 h-9 rounded-md border-0 transition-colors text-white shrink-0"
        style={{ backgroundColor: "#2CA01C" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E8E14")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2CA01C")}
      >
        <QBIcon /> Connect to QuickBooks
      </button>

      {/* Request QuickBooks Access */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShareDialog(true)}
        className="gap-2 hidden lg:inline-flex shrink-0"
      >
        <Share2 className="w-4 h-4" /> Request QuickBooks Access
      </Button>

      {/* Mock share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request QuickBooks Access</DialogTitle>
            <DialogDescription>
              Share this link with the business owner so they can connect their QuickBooks account directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground truncate select-all">
                {MOCK_SHARE_LINK}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh link">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The business owner will click this link, log in to QuickBooks Online, and authorize Shepi to read their financial data. Once connected, data syncs automatically.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
              Demo mode — this link is non-functional. Sign up to generate a real access link for your project.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function WizardDemo() {
  const navigate = useNavigate();
  const initialProject = useMemo(() => createMockProjectData(), []);
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [viewMode, setViewMode] = useState<ViewMode>("wizard");
  const [showChat, setShowChat] = useState(false);

  // Track furthest step viewed in the demo and fire abandon on unmount
  const lastStepRef = useRef<{ phase: number; section: number }>({
    phase: project.current_phase,
    section: project.current_section,
  });
  const maxStepRef = useRef<{ phase: number; section: number }>({
    phase: project.current_phase,
    section: project.current_section,
  });

  // Fire step_viewed whenever phase/section changes
  useEffect(() => {
    const phase = project.current_phase;
    const section = project.current_section;
    lastStepRef.current = { phase, section };
    // Track furthest step (rough ordering: phase * 100 + section)
    const cur = phase * 100 + section;
    const max = maxStepRef.current.phase * 100 + maxStepRef.current.section;
    if (cur > max) maxStepRef.current = { phase, section };

    trackEvent("demo_step_viewed", {
      demo: "wizard",
      phase,
      section,
      step_key: `${phase}.${section}`,
    });
  }, [project.current_phase, project.current_section]);

  // Fire abandon on unmount / page hide
  useEffect(() => {
    const fireAbandon = () => {
      trackEvent("demo_exited", {
        demo: "wizard",
        last_phase: lastStepRef.current.phase,
        last_section: lastStepRef.current.section,
        max_phase: maxStepRef.current.phase,
        max_section: maxStepRef.current.section,
      });
    };
    window.addEventListener("beforeunload", fireAbandon);
    return () => {
      window.removeEventListener("beforeunload", fireAbandon);
      fireAbandon();
    };
  }, []);

  const updateProject = (updates: Partial<ProjectData>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  const updateWizardData = (section: string, data: Record<string, unknown>) => {
    setProject((prev) => ({
      ...prev,
      wizard_data: { ...prev.wizard_data, [section]: data },
    }));
  };

  const navigateToSection = (phase: number, section: number) => {
    setProject((prev) => ({ ...prev, current_phase: phase, current_section: section }));
  };

  // No-op save: demo mode, nothing persists
  const onSave = async (_overrides?: Partial<ProjectData>) => {};

  const inventoryEnabled =
    ((project.wizard_data?.settings as Record<string, unknown>)?.inventoryEnabled as boolean) || false;
  const wipEnabled =
    ((project.wizard_data?.settings as Record<string, unknown>)?.wipEnabled as boolean) || false;

  return (
    <DemoAuthGate page="wizard">
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          {/* Left: back arrow + Demo badge + title */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => navigate("/dashboard/demo")}
              title="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {viewMode === "wizard" && (
              <MobileWizardSidebar
                currentPhase={project.current_phase}
                currentSection={project.current_section}
                onNavigate={navigateToSection}
                inventoryEnabled={inventoryEnabled}
                wipEnabled={wipEnabled}
              />
            )}
            <span className="text-xs font-semibold bg-destructive/15 text-destructive px-2 py-0.5 rounded uppercase tracking-wide shrink-0">
              Demo
            </span>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">Acme Industrial Supply Co.</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Mock data · Jan 2022 – Dec 2024 · All sections populated
              </p>
            </div>
          </div>

          {/* Right: QB buttons + AI Assistant toggle + View mode toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <MockQuickBooksButtons />
            <Button
              variant={showChat ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="gap-1 px-2 sm:px-3"
              title="QoE Assistant"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </Button>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "wizard" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("wizard")}
                className="gap-1 rounded-none rounded-l-md px-2 sm:px-3"
                title="Wizard"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Wizard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workbook/demo")}
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
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {viewMode === "wizard" && (
          <>
            <div className="hidden md:block">
              <WizardSidebar
                currentPhase={project.current_phase}
                currentSection={project.current_section}
                onNavigate={navigateToSection}
                inventoryEnabled={inventoryEnabled}
                wipEnabled={wipEnabled}
              />
            </div>
            <main className="flex-1 overflow-hidden flex flex-col">
              <WizardContent
                project={project}
                updateProject={updateProject}
                updateWizardData={updateWizardData}
                onNavigate={navigateToSection}
                onSave={onSave}
                inventoryEnabled={inventoryEnabled}
                wipEnabled={wipEnabled}
                onSwitchToInsights={() => setViewMode("insights")}
                onOpenAssistant={() => setShowChat(true)}
              />
            </main>
            {showChat && (
              <AIChatPanel
                project={project}
                currentPhase={project.current_phase}
                currentSection={project.current_section}
                onClose={() => setShowChat(false)}
              />
            )}
          </>
        )}

        {viewMode === "insights" && <InsightsView project={project} />}
      </div>

      {/* Guided demo tour */}
      <DemoGuide
        onNavigate={navigateToSection}
        onSetViewMode={setViewMode}
        onNavigateToWorkbook={() => navigate("/workbook/demo")}
      />
    </div>
    </DemoAuthGate>
  );
}
