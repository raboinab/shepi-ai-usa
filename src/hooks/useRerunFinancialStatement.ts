import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type FinancialStatementDocType =
  | "balance_sheet"
  | "income_statement"
  | "cash_flow";

const LABELS: Record<FinancialStatementDocType, string> = {
  balance_sheet: "Balance Sheet",
  income_statement: "Income Statement",
  cash_flow: "Cash Flow",
};

interface UseRerunFinancialStatementOptions {
  projectId: string;
  docType: FinancialStatementDocType;
  documentId?: string;
  onComplete?: () => void | Promise<void>;
}

/**
 * Re-run the financial statement pipeline for the latest uploaded document
 * of the given type: process-statement → detect-period → validate-vs-TB.
 */
export function useRerunFinancialStatement({
  projectId,
  docType,
  documentId,
  onComplete,
}: UseRerunFinancialStatementOptions) {
  const [running, setRunning] = useState(false);
  const [hasDocument, setHasDocument] = useState<boolean | null>(null);

  const checkHasDocument = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("account_type", docType)
      .limit(1);
    if (error) return false;
    const found = !!(data && data.length > 0);
    setHasDocument(found);
    return found;
  }, [projectId, docType]);

  const rerun = useCallback(async () => {
    if (!projectId) return;
    setRunning(true);
    const label = LABELS[docType];
    const t = toast.loading(`Re-running ${label} analysis…`);
    try {
      let doc: { id: string; period_start: string | null; period_end: string | null } | null = null;

      if (documentId) {
        const { data: selectedDoc, error: selectedDocErr } = await supabase
          .from("documents")
          .select("id, period_start, period_end")
          .eq("project_id", projectId)
          .eq("account_type", docType)
          .eq("id", documentId)
          .maybeSingle();

        if (selectedDocErr) throw selectedDocErr;
        doc = selectedDoc;
      } else {
        // Find the most recent document of this type
        const { data: docs, error: docErr } = await supabase
        .from("documents")
        .select("id, period_start, period_end")
        .eq("project_id", projectId)
        .eq("account_type", docType)
        .order("created_at", { ascending: false })
        .limit(1);

        if (docErr) throw docErr;
        doc = docs?.[0] ?? null;
      }

      if (!doc) {
        toast.dismiss(t);
        toast.error(`No ${label} document uploaded yet`);
        return;
      }

      // 1) Re-extract
      const { error: procErr } = await supabase.functions.invoke("process-statement", {
        body: { projectId, documentId: doc.id, documentType: docType, force: true },
      });
      if (procErr) {
        console.error("process-statement failed:", procErr);
        // Continue — extraction may already be cached; period + validation can still run.
      }

      // 2) Re-detect period
      const { error: detectErr } = await supabase.functions.invoke(
        "detect-financial-statement-period",
        { body: { projectId, documentId: doc.id, documentType: docType } }
      );
      if (detectErr) {
        console.error("detect-financial-statement-period failed:", detectErr);
      }

      // 3) Re-validate against Trial Balance
      const { data: freshDoc } = await supabase
        .from("documents")
        .select("period_start, period_end")
        .eq("id", doc.id)
        .single();

      const { data: validation, error: valErr } = await supabase.functions.invoke(
        "validate-financial-statement",
        {
          body: {
            projectId,
            documentId: doc.id,
            documentType: docType,
            periodStart: freshDoc?.period_start ?? doc.period_start ?? null,
            periodEnd: freshDoc?.period_end ?? doc.period_end ?? null,
          },
        }
      );
      if (valErr) {
        console.error("validate-financial-statement failed:", valErr);
      }
      if (validation && typeof validation === "object" && "error" in validation) {
        const v = validation as { error?: string; code?: string };
        if (v.code === "NO_TRIAL_BALANCE") {
          toast.dismiss(t);
          toast.error("Upload a Trial Balance first before validating");
          return;
        }
      }

      toast.dismiss(t);
      toast.success(`${label} analysis refreshed`);

      if (onComplete) await onComplete();
    } catch (err) {
      console.error("Re-run failed:", err);
      toast.dismiss(t);
      toast.error(err instanceof Error ? err.message : "Re-run failed");
    } finally {
      setRunning(false);
    }
  }, [projectId, docType, documentId, onComplete]);

  return { rerun, running, hasDocument, checkHasDocument };
}
