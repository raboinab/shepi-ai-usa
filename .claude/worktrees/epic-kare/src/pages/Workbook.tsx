/**
 * Workbook page - fetches project data and renders the WorkbookShell.
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { projectToDealData, type ProjectRecord } from "@/lib/projectToDealAdapter";
import { exportWorkbookXlsx } from "@/lib/exportWorkbookXlsx";
import type { DealData } from "@/lib/workbook-types";
import type { Json } from "@/integrations/supabase/types";

const Workbook = () => {
  useSEO({ title: "Workbook — Shepi", noindex: true });

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectRaw, setProjectRaw] = useState<ProjectRecord | null>(null);

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
    
    setProjectRaw(project);
    setDealData(projectToDealData(project));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
        <div className="min-w-0">
          <h1 className="font-semibold text-sm truncate">{dealData.deal.projectName}</h1>
          <p className="text-xs text-muted-foreground truncate">{dealData.deal.targetCompany || "QoE Workbook"}</p>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <WorkbookShell
          dealData={dealData}
          onDataChange={handleDataChange}
          saving={saving}
          onExport={handleExport}
        />
      </main>
    </div>
  );
};

export default Workbook;
