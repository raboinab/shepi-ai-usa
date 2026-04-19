/**
 * Workbook page - fetches project data and renders the WorkbookShell.
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { AIChatPanel } from "@/components/wizard/AIChatPanel";
import { projectToDealData, loadDealDataWithPriorBalances, type ProjectRecord } from "@/lib/projectToDealAdapter";
import { exportWorkbookXlsx } from "@/lib/exportWorkbookXlsx";
import { loadTrialBalanceFromProcessedData, isTBCacheIncomplete } from "@/lib/loadTrialBalanceFromProcessedData";
import type { CoaAccount } from "@/lib/chartOfAccountsUtils";
import type { DealData } from "@/lib/workbook-types";
import type { Json } from "@/integrations/supabase/types";
import type { ProjectData } from "@/pages/Project";

/** Map workbook tab IDs to Phase 5 section numbers for the AI assistant context */
const TAB_TO_SECTION: Record<string, number> = {
  "setup": 1,
  "trial-balance": 1,
  "income-statement": 1,
  "is-detailed": 2,
  "balance-sheet": 3,
  "bs-detailed": 4,
  "is-bs-reconciliation": 5,
  "sales": 6,
  "cogs": 7,
  "opex": 8,
  "other-expense": 9,
  "qoe-analysis": 10,
  "dd-adjustments-1": 10,
  "dd-adjustments-2": 10,
  "working-capital": 12,
  "nwc-analysis": 13,
  "cash": 14,
  "ar-aging": 15,
  "other-current-assets": 15,
  "fixed-assets": 15,
  "ap-aging": 16,
  "other-current-liabilities": 16,
  "top-customers": 17,
  "top-vendors": 17,
  "proof-of-cash": 17,
  "free-cash-flow": 18,
  "payroll": 8,
  "supplementary": 17,
  "wip-schedule": 15,
};

const Workbook = () => {
  const __seoTags = useSEO({ title: "Workbook — shepi", noindex: true });

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectRaw, setProjectRaw] = useState<ProjectRecord | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState("setup");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      fetchProject();
    };
    checkAuth();
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, client_name, target_company, industry, transaction_type, fiscal_year_end, periods, wizard_data")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error loading project", description: error?.message || "Project not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    const project: ProjectRecord = {
      ...data,
      periods: Array.isArray(data.periods) ? data.periods as any : [],
      wizard_data: (data.wizard_data as Record<string, unknown>) || {},
    };

    // Fallback: if wizard_data.trialBalance is empty or has partial coverage, rebuild from processed_data
    const wd = project.wizard_data || {};
    const tbData = wd.trialBalance as Record<string, unknown> | undefined;
    const tbAccounts = (tbData?.accounts as { monthlyValues?: Record<string, number> }[] | undefined) || [];
    const projectPeriods = project.periods || [];

    if (tbAccounts.length === 0 || isTBCacheIncomplete(tbAccounts, projectPeriods)) {
      const coaRaw = wd.chartOfAccounts as Record<string, unknown> | undefined;
      const coaAccounts = (coaRaw?.accounts as CoaAccount[] | undefined) || [];

      const accounts = await loadTrialBalanceFromProcessedData(id, projectPeriods, coaAccounts);
      if (accounts.length > 0) {
        project.wizard_data = {
          ...project.wizard_data,
          trialBalance: { accounts },
        };
      }
    }

    setProjectRaw(project);
    const enriched = await loadDealDataWithPriorBalances(project);
    setDealData(enriched);
    setLoading(false);
  };

  const handleDataChange = useCallback(async (updatedData: DealData) => {
    setDealData(updatedData);
  }, []);

  const handleExport = useCallback(async () => {
    if (!dealData) return;
    try {
      await exportWorkbookXlsx({ dealData });
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  }, [dealData]);

  // Build a ProjectData-like object for the AIChatPanel
  const projectDataForChat: ProjectData | null = projectRaw ? {
    id: projectRaw.id,
    name: projectRaw.name,
    client_name: projectRaw.client_name ?? null,
    target_company: projectRaw.target_company ?? null,
    transaction_type: projectRaw.transaction_type ?? null,
    industry: projectRaw.industry ?? null,
    status: "active",
    fiscal_year_end: projectRaw.fiscal_year_end ?? null,
    periods: projectRaw.periods as unknown as string[],
    wizard_data: projectRaw.wizard_data || {},
    current_phase: 5,
    current_section: TAB_TO_SECTION[activeTab] || 1,
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {__seoTags}
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dealData) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 py-2 flex items-center gap-3">
        <Link to={`/project/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm truncate">{dealData.deal.projectName}</h1>
          <p className="text-xs text-muted-foreground truncate">{dealData.deal.targetCompany || "QoE Workbook"}</p>
        </div>
        <Button
          variant={showChat ? "default" : "outline"}
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Assistant
        </Button>
      </header>
      <main className="flex-1 overflow-hidden">
        <WorkbookShell
          dealData={dealData}
          onDataChange={handleDataChange}
          saving={saving}
          onExport={handleExport}
          onActiveTabChange={setActiveTab}
          projectId={id}
        />
      </main>

      {showChat && projectDataForChat && (
        <AIChatPanel
          project={projectDataForChat}
          currentPhase={5}
          currentSection={TAB_TO_SECTION[activeTab] || 1}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default Workbook;
