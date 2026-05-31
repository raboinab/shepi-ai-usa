/**
 * Shared hook that builds enriched DealData from a project record.
 * Used by both the Workbook page and the Wizard so the two surfaces
 * always render off the same source of truth.
 */
import { useEffect, useState } from "react";
import { loadDealDataWithPriorBalances, projectToDealData, type ProjectRecord } from "@/lib/projectToDealAdapter";
import type { DealData } from "@/lib/workbook-types";
import { fetchLatestPayrollFallback } from "@/lib/payrollFallback";
import { supabase } from "@/integrations/supabase/client";

export function useProjectDealData(project: ProjectRecord | null): {
  dealData: DealData | null;
  loading: boolean;
} {
  const [dealData, setDealData] = useState<DealData | null>(() =>
    project ? projectToDealData(project) : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project) {
      setDealData(null);
      return;
    }
    // Synchronous baseline so consumers always have something to render
    let cancelled = false;
    try {
      setDealData(projectToDealData(project));
    } catch (e) {
      console.warn("projectToDealData failed:", e);
    }
    // Async enrichment with prior balances (matches Workbook page)
    setLoading(true);
    loadDealDataWithPriorBalances(project)
      .then((enriched) => {
        if (!cancelled) setDealData(enriched);
      })
      .catch((e) => {
        console.warn("loadDealDataWithPriorBalances failed:", e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the project identity or its wizard_data change
  }, [project?.id, project?.wizard_data, project?.periods, project?.fiscal_year_end]);

  // Merge in extracted payroll register (processed_data) so the Workbook
  // Payroll tab and any downstream consumer renders from uploads without a
  // manual workbook sync. Subscribes to inserts so re-uploads update live.
  useEffect(() => {
    const pid = project?.id;
    if (!pid) return;
    let cancelled = false;

    const merge = async () => {
      const fb = await fetchLatestPayrollFallback(pid);
      if (cancelled) return;
      setDealData((prev) => (prev ? { ...prev, payrollFallback: fb ?? prev.payrollFallback } : prev));
    };
    merge();

    const channel = supabase
      .channel(`payroll-fallback-${pid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "processed_data", filter: `project_id=eq.${pid}` },
        (payload) => {
          const row = payload.new as { data_type?: string } | null;
          if (row?.data_type === "payroll") merge();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [project?.id]);

  return { dealData, loading };
}
