import { supabase } from "@/integrations/supabase/client";

/**
 * Map an account_type to the set of artifacts (in processed_data and
 * projects.wizard_data) that it produces, so deleting/replacing a
 * document leaves no stale derived state behind.
 */
type ResetSpec = {
  /** processed_data.data_type values to clear for this project. */
  processedDataTypes: string[];
  /** Top-level wizard_data keys to clear (set to undefined). */
  wizardDataKeys: string[];
};

const RESET_MAP: Record<string, ResetSpec> = {
  chart_of_accounts: {
    processedDataTypes: ["chart_of_accounts", "coa_classification"],
    wizardDataKeys: ["chartOfAccounts"],
  },
  trial_balance: {
    processedDataTypes: ["trial_balance"],
    wizardDataKeys: ["trialBalance"],
  },
  cim: {
    processedDataTypes: ["cim_insights"],
    wizardDataKeys: [],
  },
  general_ledger: {
    processedDataTypes: ["general_ledger", "gl_analysis"],
    wizardDataKeys: [],
  },
  profit_and_loss: {
    processedDataTypes: ["profit_and_loss", "income_statement"],
    wizardDataKeys: [],
  },
  income_statement: {
    processedDataTypes: ["income_statement", "profit_and_loss"],
    wizardDataKeys: [],
  },
  balance_sheet: {
    processedDataTypes: ["balance_sheet"],
    wizardDataKeys: [],
  },
  tax_return: {
    processedDataTypes: ["tax_return_analysis"],
    wizardDataKeys: [],
  },
  payroll: {
    processedDataTypes: ["payroll_analysis"],
    wizardDataKeys: [],
  },
  journal_entry: {
    processedDataTypes: ["journal_entry_analysis"],
    wizardDataKeys: [],
  },
};

export type DocumentLike = {
  id: string;
  file_path?: string | null;
  project_id?: string | null;
  account_type?: string | null;
};

/**
 * Fully reset a document and every artifact derived from it, so the user
 * can re-upload the same slot cleanly.
 *
 * Order matters: we clear derived rows first, then storage, then the
 * document row last so a partial failure leaves the doc record visible.
 */
export async function resetDocumentArtifacts(doc: DocumentLike): Promise<void> {
  const spec = doc.account_type ? RESET_MAP[doc.account_type] : undefined;

  // 1. processed_data — by source link AND by project+type for orphan rows
  await supabase
    .from("processed_data")
    .delete()
    .eq("source_document_id", doc.id);

  if (spec && doc.project_id && spec.processedDataTypes.length > 0) {
    await supabase
      .from("processed_data")
      .delete()
      .eq("project_id", doc.project_id)
      .in("data_type", spec.processedDataTypes);
  }

  // 2. canonical_transactions tied to this document
  await supabase
    .from("canonical_transactions")
    .delete()
    .eq("source_document_id", doc.id);

  // 3. docuclipper_jobs tied to this document
  await supabase
    .from("docuclipper_jobs")
    .delete()
    .eq("document_id", doc.id);

  // 4. adjustment_proofs — keep the proof (audit), null the source link
  await supabase
    .from("adjustment_proofs")
    .update({ document_id: null })
    .eq("document_id", doc.id);

  // 5. wizard_data slice — clear cached parsed data on the project row
  if (spec && doc.project_id && spec.wizardDataKeys.length > 0) {
    const { data: project } = await supabase
      .from("projects")
      .select("wizard_data")
      .eq("id", doc.project_id)
      .single();

    const wizardData = ((project?.wizard_data as Record<string, unknown>) || {});
    let mutated = false;
    for (const key of spec.wizardDataKeys) {
      if (key in wizardData) {
        delete wizardData[key];
        mutated = true;
      }
    }
    if (mutated) {
      await supabase
        .from("projects")
        .update({ wizard_data: wizardData as never })
        .eq("id", doc.project_id);
    }
  }

  // 6. Storage file
  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  // 7. Document row last
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id);
  if (error) throw error;
}

/**
 * Plain-English description of what `resetDocumentArtifacts` will wipe,
 * for use in confirm dialogs.
 */
export function describeReset(doc: DocumentLike): string {
  const type = doc.account_type || "";
  switch (type) {
    case "chart_of_accounts":
      return "This will also clear the parsed Chart of Accounts and any classifications derived from it.";
    case "trial_balance":
      return "This will also clear the parsed Trial Balance for this project.";
    case "cim":
      return "This will also clear the CIM insights generated from this document.";
    case "general_ledger":
      return "This will also clear the GL analysis and any transactions imported from this file.";
    case "profit_and_loss":
    case "income_statement":
      return "This will also clear the parsed P&L for this period.";
    case "balance_sheet":
      return "This will also clear the parsed Balance Sheet for this period.";
    case "tax_return":
      return "This will also clear the tax return analysis derived from this document.";
    case "payroll":
      return "This will also clear the payroll analysis derived from this document.";
    case "journal_entry":
      return "This will also clear the journal entry analysis derived from this document.";
    default:
      return "This will also clear any data parsed from this document.";
  }
}
