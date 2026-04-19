/**
 * Export all project-related data from the database as a structured JSON file.
 * Queries respect RLS policies via the authenticated Supabase client.
 */
import { supabase } from "@/integrations/supabase/client";

const MAX_ROWS = 1_000_000;

interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

type OnProgress = (current: number, total: number, label: string) => void;

async function fetchTable(
  table: string,
  filter: Record<string, string>,
  columns = "*",
) {
  let query = (supabase.from as any)(table).select(columns).limit(MAX_ROWS);
  for (const [col, val] of Object.entries(filter)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query;
  if (error) {
    console.warn(`Export: failed to fetch ${table}:`, error.message);
    return [];
  }
  return data ?? [];
}

export async function exportProjectDataJson(
  projectId: string,
  projectName: string,
  onProgress?: OnProgress,
) {
  const tables: { key: string; table: string; label: string; columns?: string }[] = [
    { key: "project", table: "projects", label: "Project" },
    { key: "documents", table: "documents", label: "Documents" },
    { key: "processed_data", table: "processed_data", label: "Processed Data" },
    { key: "canonical_transactions", table: "canonical_transactions", label: "Transactions" },
    { key: "flagged_transactions", table: "flagged_transactions", label: "Flagged Transactions" },
    { key: "adjustment_proofs", table: "adjustment_proofs", label: "Adjustment Proofs" },
    { key: "adjustment_proposals", table: "adjustment_proposals", label: "Adjustment Proposals" },
    { key: "analysis_jobs", table: "analysis_jobs", label: "Analysis Jobs" },
    { key: "detector_runs", table: "detector_runs", label: "Detector Runs" },
    { key: "verification_attempts", table: "verification_attempts", label: "Verification Attempts" },
    { key: "reclassification_jobs", table: "reclassification_jobs", label: "Reclassification Jobs" },
    { key: "docuclipper_jobs", table: "docuclipper_jobs", label: "DocuClipper Jobs" },
    { key: "chat_messages", table: "chat_messages", label: "Chat Messages" },
    { key: "project_data_chunks", table: "project_data_chunks", label: "Data Chunks", columns: "id, project_id, data_type, period, fs_section, chunk_key, token_count, metadata, created_at, updated_at" },
    {
      key: "company_info",
      table: "company_info",
      label: "Company Info",
      columns: "id, project_id, user_id, company_name, realm_id, created_at, updated_at",
    },
    { key: "workflows", table: "workflows", label: "Workflows" },
  ];

  // +2 for proposal_evidence and verification_transaction_snapshots
  const totalSteps = tables.length + 2;
  let step = 0;

  const result: Record<string, unknown> = {};

  for (const t of tables) {
    step++;
    onProgress?.(step, totalSteps, t.label);

    const filter =
      t.table === "projects"
        ? { id: projectId }
        : { project_id: projectId };

    const rows = await fetchTable(t.table, filter, t.columns);
    result[t.key] = t.table === "projects" ? rows[0] ?? null : rows;
  }

  // proposal_evidence via parent proposal IDs
  step++;
  onProgress?.(step, totalSteps, "Proposal Evidence");
  const proposalIds = ((result.adjustment_proposals as any[]) ?? []).map((p: any) => p.id);
  if (proposalIds.length > 0) {
    const { data } = await supabase
      .from("proposal_evidence")
      .select("*")
      .in("proposal_id", proposalIds)
      .limit(MAX_ROWS);
    result.proposal_evidence = data ?? [];
  } else {
    result.proposal_evidence = [];
  }

  // verification_transaction_snapshots via parent attempt IDs
  step++;
  onProgress?.(step, totalSteps, "Verification Snapshots");
  const attemptIds = ((result.verification_attempts as any[]) ?? []).map((a: any) => a.id);
  if (attemptIds.length > 0) {
    const { data } = await supabase
      .from("verification_transaction_snapshots")
      .select("*")
      .in("verification_attempt_id", attemptIds)
      .limit(MAX_ROWS);
    result.verification_transaction_snapshots = data ?? [];
  } else {
    result.verification_transaction_snapshots = [];
  }

  // Build final payload
  const payload = {
    exportedAt: new Date().toISOString(),
    projectId,
    projectName,
    tables: result,
  };

  // Trigger download
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = (projectName || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `${safeName}_data_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
