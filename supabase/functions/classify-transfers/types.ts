// ─── Types ───────────────────────────────────────────────────────────

export interface RawTransaction {
  id: string;
  amount: number;
  memo: string;
  name: string;
  date: string;
  periodKey: string;
  recordId: string;
  direction: "debit" | "credit";
  amountSigned: number;
}

export type CandidateType =
  | "internal_same_entity_transfer"
  | "external_bank_like_transfer"
  | "owner_related"
  | "operating";

export type VendorSubtype =
  | "credit_card_payment"
  | "paypal_transfer"
  | "postage_shipping"
  | "utilities_telecom"
  | "insurance"
  | "loan_debt_service"
  | "online_banking_transfer"
  | "owner_draw"
  | "personal_app"
  | "other_owner_related";

export interface EvidenceAtom {
  type: string;
  weight: number;
  [key: string]: unknown;
}

export interface ClassifiedTransaction {
  id: string;
  category: "interbank" | "owner" | "operating";
  candidate_type: CandidateType;
  confidence: number;
  method: "rule_pair_match" | "rule_keyword" | "rule_negative_class" | "llm_cluster" | "llm_individual";
  evidence: EvidenceAtom[];
  paired_with?: string;
  case_id: string;
  cluster_id?: string;
  amount: number;
  memo: string;
  date: string;
  account_record_id: string;
  period_key: string;
  subtype?: VendorSubtype;
}

export interface PeriodClassification {
  interbank: number;
  owner: number;
  transactions: ClassifiedTransaction[];
}

export interface ClassificationMeta {
  cursor: number;
  totalRecords: number;
  totalTxnCount: number;
  processedTxnCount: number;
  status: "running" | "completed" | "error";
  error?: string;
  startedAt: string;
  updatedAt: string;
  version: number;
  rules_version: string;
  model_version?: string;
  run_id?: string;
  global_registry?: RelatedPartyEntry[];
}

export interface RelatedPartyEntry {
  full_name: string;
  short_names: string[];
  relationship: "owner" | "affiliate";
}

export interface TransactionCluster {
  cluster_id: string;
  normalized_description: string;
  transaction_ids: string[];
  transactions: RawTransaction[];
  total_dollars: number;
}

export interface ClusterClassification {
  cluster_id: string;
  category: "interbank" | "owner" | "operating";
  confidence: number;
  supporting_evidence: string[];
  contradictory_evidence: string[];
  recommended_action: "accept" | "review" | "analyst_escalation";
}

export interface BatchClusterClassification {
  cluster_index: number;
  category: "interbank" | "owner" | "operating";
  confidence: number;
  supporting_evidence: string[];
  contradictory_evidence: string[];
  recommended_action: "accept" | "review" | "analyst_escalation";
}
