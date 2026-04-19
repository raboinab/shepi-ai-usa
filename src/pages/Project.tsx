import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowLeft, Save, MessageSquare, Lock, LayoutGrid, Table, BarChart3, MoreVertical, RotateCcw } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardSidebar } from "@/components/wizard/WizardSidebar";
import { MobileWizardSidebar } from "@/components/wizard/MobileWizardSidebar";
import { WizardContent } from "@/components/wizard/WizardContent";
import { AIChatPanel } from "@/components/wizard/AIChatPanel";
import { InsightsView } from "@/components/insights/InsightsView";
import { QuickBooksButton } from "@/components/QuickBooksButton";
import { DfyStatusBanner } from "@/components/DfyStatusBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";

export interface ProjectData {
  id: string;
  name: string;
  client_name: string | null;
  target_company: string | null;
  transaction_type: string | null;
  industry: string | null;
  status: string;
  fiscal_year_end: string | null;
  periods: string[];
  wizard_data: Record<string, unknown>;
  current_phase: number;
  current_section: number;
  service_tier?: string;
}

const Project = () => {
  const __seoTags = useSEO({ title: "Project — shepi", noindex: true });

  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(() => {
    const dismissed = sessionStorage.getItem(`chat-dismissed-${id}`);
    return !dismissed;
  });
  const [viewMode, setViewMode] = useState<"wizard" | "insights">("wizard");
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGenRef = useRef(0);
  const dirtyWizardKeysRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const { hasAccessToProject, loading: subscriptionLoading } = useSubscription();

  // Handle QuickBooks OAuth callback
  useEffect(() => {
    if (searchParams.get("qb_connected") === "true") {
      toast({ title: "Connected to QuickBooks!", description: "Your QuickBooks account is now linked." });
      searchParams.delete("qb_connected");
      searchParams.delete("realm_id");
      searchParams.delete("company_name");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle DFY upgrade return from Stripe
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast({ title: "Upgrade complete!", description: "A CPA analyst will be assigned shortly." });
      searchParams.delete("upgraded");
      setSearchParams(searchParams, { replace: true });
      fetchProject();
      setTimeout(() => fetchProject(), 3000);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      else fetchProject();
    });
  }, [navigate, id]);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();

    if (error) {
      toast({ title: "Error loading project", description: error.message, variant: "destructive" });
      navigate("/dashboard");
    } else if (!data) {
      toast({ title: "Project not found", variant: "destructive" });
      navigate("/dashboard");
    } else {
      const periods = Array.isArray(data.periods) ? (data.periods as string[]) : [];
      const wizard_data = (data.wizard_data as Record<string, unknown>) || {};
      setProject({ ...data, periods, wizard_data } as ProjectData);
    }
    setLoading(false);
  };

  const saveProject = async (overrides: Partial<ProjectData> = {}) => {
    if (!project) return;

    // Cancel any pending auto-save to prevent stale-closure overwrites
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const gen = ++saveGenRef.current;
    setSaving(true);
    
    const hasOverrides = Object.keys(overrides).length > 0;
    const dataToSave = hasOverrides ? { ...project, ...overrides } : project;
    
    const { error } = await supabase.from("projects").update({
      wizard_data: dataToSave.wizard_data as Json,
      current_phase: dataToSave.current_phase,
      current_section: dataToSave.current_section,
      client_name: dataToSave.client_name,
      target_company: dataToSave.target_company,
      transaction_type: dataToSave.transaction_type,
      industry: dataToSave.industry,
      fiscal_year_end: dataToSave.fiscal_year_end,
      periods: dataToSave.periods as Json,
      status: dataToSave.current_phase > 1 ? "in-progress" : "draft",
    }).eq("id", project.id);

    // If a newer save started while we were awaiting, discard this result
    if (gen !== saveGenRef.current) return;

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    
    // Only update local state for explicit saves with real overrides
    if (hasOverrides) {
      setProject(dataToSave);
    }
    
    toast({ title: "Saved!" });
    setIsDirty(false);
    setSaving(false);

    // Fire-and-forget: re-index changed wizard data chunks for RAG
    const changedKeys = Array.from(dirtyWizardKeysRef.current);
    dirtyWizardKeysRef.current.clear();
    if (changedKeys.length > 0) {
      const wizardKeyToDataType: Record<string, string> = {
        adjustments: 'adjustments',
        reclassifications: 'reclassifications',
        arAging: 'ar_aging',
        apAging: 'ap_aging',
        topCustomers: 'customer_concentration',
        topVendors: 'vendor_concentration',
        fixedAssets: 'fixed_assets',
        debtSchedule: 'debt_schedule',
        materialContracts: 'material_contract',
        payroll: 'payroll',
        proofOfCash: 'proof_of_cash',
        inventory: 'inventory',
        cimInsights: 'cim_insights',
        financialCategoryLabels: 'financial_category_labels',
        dealParameters: 'deal_parameters',
      };
      const dataTypes = changedKeys
        .map(k => wizardKeyToDataType[k])
        .filter(Boolean);
      if (dataTypes.length > 0) {
        supabase.functions.invoke('embed-project-data', {
          body: { project_id: project.id, data_types: dataTypes, source: 'wizard' },
        }).catch(() => { /* silent – indexing is best-effort */ });
      }
    }
  };

  const updateProject = (updates: Partial<ProjectData>) => {
    setProject(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  };

  const updateWizardData = (section: string, data: Record<string, unknown>) => {
    setProject(prev => prev ? { ...prev, wizard_data: { ...prev.wizard_data, [section]: data } } : null);
    dirtyWizardKeysRef.current.add(section);
    setIsDirty(true);
  };

  const navigateToSection = (phase: number, section: number) => {
    setProject(prev => prev ? { ...prev, current_phase: phase, current_section: section } : null);
  };

  const handleResetProject = async () => {
    if (!project || resetConfirmText !== "RESET") return;
    setResetting(true);

    // Fix A: Cancel pending auto-save to prevent race condition
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsDirty(false);

    try {
      // 1. Get all document file paths for storage cleanup
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_path")
        .eq("project_id", project.id)
        .limit(1000000);

      // 2. Delete storage files
      if (docs?.length) {
        const paths = docs.map((d: { id: string; file_path: string }) => d.file_path).filter(Boolean);
        if (paths.length) {
          await supabase.storage.from("documents").remove(paths);
        }
      }

      // 3. Use server-side function to delete all data and reset project
      // This bypasses RLS issues for admins viewing other users' projects
      const { error: rpcError } = await supabase.rpc("reset_project_data", {
        p_project_id: project.id,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // 4. Refresh local state
      await fetchProject();
      setResetDialogOpen(false);
      setResetConfirmText("");
      toast({ title: "Project reset", description: "All data cleared. Your access window continues." });
    } catch (err) {
      toast({ title: "Reset failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const lastSyncTime = project?.wizard_data?._lastSyncedAt as string | undefined;

  // Keep a ref to the latest saveProject to avoid stale closures in auto-save
  const saveProjectRef = useRef(saveProject);
  saveProjectRef.current = saveProject;

  // Auto-save: debounced save when user makes changes
  useEffect(() => {
    if (!isDirty || saving || !project?.id) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveProjectRef.current({});
      } catch (err) {
        console.error("Auto-save failed:", err);
        toast({ title: "Auto-save failed", description: "Your changes may not have been saved. Try saving manually.", variant: "destructive" });
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, saving, project?.id]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {__seoTags}
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) return null;

  const hasAccess = hasAccessToProject(project.id);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
              <div>
                <h1 className="font-semibold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">{project.target_company || "QoE Analysis"}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Required</h2>
            <p className="text-muted-foreground mb-6">
              You need an active subscription or to purchase access to this project to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/pricing">
                <Button>View Pricing Plans</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            {viewMode === "wizard" && (
              <MobileWizardSidebar
                currentPhase={project.current_phase}
                currentSection={project.current_section}
                onNavigate={navigateToSection}
                inventoryEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.inventoryEnabled as boolean) || false}
                wipEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.wipEnabled as boolean) || false}
              />
            )}
            <Link to="/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{project.name}</h1>
              <p className="text-sm text-muted-foreground truncate hidden sm:block">{project.target_company || "QoE Analysis"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Toggle */}
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
                onClick={() => navigate(`/project/${id}/workbook`)}
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

            {/* Desktop: Show all buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {/* QuickBooks Connection */}
              <QuickBooksButton 
                projectId={project.id} 
                userId={user?.id || ""} 
                periods={project.periods as unknown as Array<{ year: number; month: number; isStub?: boolean }>}
                onSyncComplete={fetchProject}
                lastSyncDate={lastSyncTime}
              />

              <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)} className="gap-2">
                <MessageSquare className="w-4 h-4" /> AI Assistant
              </Button>
            </div>

            {/* Desktop: Reset button */}
            <div className="hidden lg:flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                className="gap-1 text-muted-foreground hover:text-destructive px-2"
                title="Reset Project Data"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden xl:inline">Reset</span>
              </Button>
            </div>

            {/* Mobile/Tablet: Dropdown for secondary actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                  <MoreVertical className="w-4 h-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowChat(!showChat)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showChat ? "Hide AI Assistant" : "AI Assistant"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setResetDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Project Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Save button */}
            <Button 
              size="sm" 
              onClick={() => saveProject({})} 
              disabled={saving} 
              variant={isDirty ? "default" : "outline"}
              className={`gap-1 sm:gap-2 px-2 sm:px-3 ${isDirty ? "animate-pulse" : ""}`}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
            </Button>
          </div>
        </div>
      </header>

      <DfyStatusBanner projectId={project.id} serviceTier={project.service_tier || 'diy'} />
      <div className="flex flex-1 overflow-hidden">
        {viewMode === "wizard" && (
          <>
            <div className="hidden md:block">
              <WizardSidebar 
                currentPhase={project.current_phase} 
                currentSection={project.current_section} 
                onNavigate={navigateToSection}
                inventoryEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.inventoryEnabled as boolean) || false}
                wipEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.wipEnabled as boolean) || false}
              />
            </div>
            <main className="flex-1 overflow-hidden flex flex-col">
              <WizardContent
                project={project} 
                updateProject={updateProject} 
                updateWizardData={updateWizardData} 
                onNavigate={navigateToSection} 
                onSave={saveProject}
                inventoryEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.inventoryEnabled as boolean) || false}
                wipEnabled={((project.wizard_data?.settings as Record<string, unknown>)?.wipEnabled as boolean) || false}
                onSwitchToInsights={() => setViewMode("insights")}
                onOpenAssistant={(prompt?: string) => {
                  setShowChat(true);
                  if (prompt) {
                    setPendingPrompt(prompt);
                  }
                }}
              />
            </main>
          </>
        )}
        
        {viewMode === "insights" && (
          <InsightsView project={project} />
        )}
        
        {showChat && viewMode !== "insights" && (
          <AIChatPanel 
            project={project} 
            currentPhase={project.current_phase}
            currentSection={project.current_section}
            pendingPrompt={pendingPrompt}
            onPromptConsumed={() => setPendingPrompt(undefined)}
            onClose={() => {
              setShowChat(false);
              sessionStorage.setItem(`chat-dismissed-${id}`, "true");
            }} 
          />
        )}
      </div>

      {/* Reset Project Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) setResetConfirmText(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" />
              Reset Project Data
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p>
                  This will permanently delete all uploaded documents, analysis data, and AI results for <strong>{project?.name}</strong>.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2 text-sm text-foreground">
                  ✓ Your project access and 90-day window are <strong>NOT affected</strong> — you can start fresh immediately.
                </div>
                <p className="text-sm">
                  The project name, client, and target company are preserved. Only the analysis data is cleared.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reset-confirm" className="text-sm font-medium">
              Type <span className="font-mono font-bold">RESET</span> to confirm
            </Label>
            <Input
              id="reset-confirm"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              className="font-mono"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setResetDialogOpen(false); setResetConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProject}
              disabled={resetConfirmText !== "RESET" || resetting}
            >
              {resetting ? "Resetting..." : "Reset All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Project;
