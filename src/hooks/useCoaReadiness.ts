import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CoaReadiness {
  ready: boolean;
  hasLocalAccounts: boolean;
  hasProcessedRows: boolean;
  loading: boolean;
}

/**
 * Single source of truth for "is the Chart of Accounts ready for downstream
 * steps (e.g. Trial Balance ingestion)?".
 *
 * COA is considered ready when EITHER:
 *  - wizardData.chartOfAccounts.accounts has rows (already loaded into UI), OR
 *  - processed_data has at least one chart_of_accounts row for this project
 *    (QB sync completed, even if wizard_data hasn't refreshed yet).
 *
 * Importantly, a stale `syncSource === "quickbooks"` flag is NOT sufficient
 * on its own — that was the bug that let users upload TB before COA.
 */
export function useCoaReadiness(
  projectId: string | undefined,
  wizardData?: Record<string, unknown> | null,
): CoaReadiness {
  const localAccounts =
    ((wizardData?.chartOfAccounts as Record<string, unknown> | undefined)
      ?.accounts as unknown[] | undefined) ?? [];
  const hasLocalAccounts = Array.isArray(localAccounts) && localAccounts.length > 0;

  const [hasProcessedRows, setHasProcessedRows] = useState(false);
  const [loading, setLoading] = useState(!hasLocalAccounts && !!projectId);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    if (hasLocalAccounts) {
      setHasProcessedRows(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { count, error } = await supabase
        .from("processed_data")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("data_type", "chart_of_accounts");

      if (cancelled) return;
      if (error) {
        // Fail open to local state; downstream UI still blocks via hasLocalAccounts.
        setHasProcessedRows(false);
      } else {
        setHasProcessedRows((count ?? 0) > 0);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, hasLocalAccounts]);

  return {
    ready: hasLocalAccounts || hasProcessedRows,
    hasLocalAccounts,
    hasProcessedRows,
    loading,
  };
}
