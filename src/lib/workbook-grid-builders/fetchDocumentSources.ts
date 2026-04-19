/**
 * Fetches document manifest from the database for the Data Sources tab.
 * Re-uses the same checklist structure as the PDF export.
 */
import { supabase } from "@/integrations/supabase/client";
import type { DocSourceItem } from "./buildDataSourcesGrid";

const DOCUMENT_CHECKLIST: Array<{ label: string; tier: DocSourceItem["tier"]; matchTypes: string[] }> = [
  // Required
  { label: "Chart of Accounts", tier: "required", matchTypes: ["chart_of_accounts"] },
  { label: "Trial Balance", tier: "required", matchTypes: ["trial_balance"] },
  { label: "General Ledger", tier: "required", matchTypes: ["general_ledger"] },
  { label: "Bank Statements", tier: "required", matchTypes: ["bank_statement"] },
  // Recommended
  { label: "AR Aging", tier: "recommended", matchTypes: ["accounts_receivable"] },
  { label: "AP Aging", tier: "recommended", matchTypes: ["accounts_payable"] },
  { label: "Payroll Reports", tier: "recommended", matchTypes: ["payroll"] },
  { label: "Fixed Asset Register", tier: "recommended", matchTypes: ["fixed_asset_register", "depreciation_schedule"] },
  { label: "Tax Returns", tier: "recommended", matchTypes: ["tax_return"] },
  { label: "Journal Entries", tier: "recommended", matchTypes: ["journal_entries"] },
  { label: "Credit Card Statements", tier: "recommended", matchTypes: ["credit_card"] },
  { label: "Customer Concentration", tier: "recommended", matchTypes: ["customer_concentration"] },
  { label: "Vendor Concentration", tier: "recommended", matchTypes: ["vendor_concentration"] },
  { label: "Inventory Reports", tier: "recommended", matchTypes: ["inventory"] },
  { label: "Debt Schedule", tier: "recommended", matchTypes: ["debt_schedule"] },
  { label: "Material Contracts", tier: "recommended", matchTypes: ["material_contract"] },
  { label: "Lease Agreements", tier: "recommended", matchTypes: ["lease_agreement"] },
  { label: "Supporting Documents", tier: "recommended", matchTypes: ["supporting_documents"] },
  { label: "Job Cost Reports", tier: "recommended", matchTypes: ["job_cost_reports"] },
  { label: "WIP Schedule", tier: "recommended", matchTypes: ["wip_schedule"] },
  // Optional
  { label: "Income Statements", tier: "optional", matchTypes: ["income_statement"] },
  { label: "Balance Sheets", tier: "optional", matchTypes: ["balance_sheet"] },
  { label: "Cash Flow Statements", tier: "optional", matchTypes: ["cash_flow"] },
  { label: "CIM / Offering Memo", tier: "optional", matchTypes: ["cim"] },
];

export async function fetchDocumentSources(projectId: string): Promise<DocSourceItem[]> {
  const { data: docs } = await supabase
    .from("documents")
    .select("account_type, created_at")
    .eq("project_id", projectId);

  const uploadedTypes = new Map<string, string>();
  if (docs) {
    for (const doc of docs) {
      if (doc.account_type && !uploadedTypes.has(doc.account_type)) {
        uploadedTypes.set(doc.account_type, new Date(doc.created_at || "").toLocaleDateString());
      }
    }
  }

  return DOCUMENT_CHECKLIST.map((item) => {
    const matchedType = item.matchTypes.find((t) => uploadedTypes.has(t));
    return {
      label: item.label,
      tier: item.tier,
      status: matchedType ? "provided" as const : "not_provided" as const,
      uploadDate: matchedType ? uploadedTypes.get(matchedType) : undefined,
    };
  });
}
