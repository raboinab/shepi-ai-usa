import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransferTotals {
  interbank: number;
  interbankIn: number;    // sum of positive interbank amounts (credits/deposits)
  interbankOut: number;   // sum of abs(negative interbank amounts) (debits/withdrawals)
  owner: number;
  debt_service?: number;
  capex?: number;
  tax_payments?: number;
}

export interface ClassifiedTransaction {
  id: string;
  category: "interbank" | "owner" | "operating";
  candidate_type?: string;
  confidence?: number;
  method?: string;
  evidence?: EvidenceAtom[];
  paired_with?: string;
  case_id?: string;
  amount?: number;
  memo?: string;
  date?: string;
  account_record_id?: string;
  subtype?: string;
}

export interface EvidenceAtom {
  type: string;
  weight: number;
  [key: string]: unknown;
}

export type CaseStatus = "suggested" | "accepted" | "rejected" | "split" | "needs_analyst";

export interface TransferCase {
  case_id: string;
  case_type: "internal_transfer" | "external_transfer_like" | "owner_related" | "ambiguous" | "excluded_operating";
  status: CaseStatus;
  confidence: number;
  total_dollars: number;
  transaction_count: number;
  date_range: [string, string];
  representative_txn_ids: string[];
  edge_case_txn_ids: string[];
  evidence_summary: EvidenceAtom[];
  risk_score: number;
  reasoning_label: string;
  transactions: ClassifiedTransaction[];
}

export interface PeriodClassification {
  interbank: number;
  owner: number;
  transactions: ClassifiedTransaction[];
}

export interface ClassifyProgress {
  processed: number;
  total: number;
}

interface PollResponse {
  status: "not_started" | "running" | "completed" | "error" | "partial" | "unknown";
  processed: number;
  total: number;
  cursor: number;
  totalRecords: number;
  error?: string;
  classifications?: Record<string, { interbank: number; owner: number }>;
}

const POLL_INTERVAL_MS = 3_000;
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function isRunStale(meta: { updatedAt?: string; updated_at?: string } | undefined): boolean {
  if (!meta) return true;
  const ts = meta.updatedAt || meta.updated_at;
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > STALE_THRESHOLD_MS;
}

// ─── Vendor subtype detection (frontend fallback for legacy data) ────

const VENDOR_FAMILY_PATTERNS: { pattern: RegExp; subtype: string; label: string }[] = [
  { pattern: /\b(chase credit|chase card|crd)\b/i, subtype: "credit_card_payment", label: "Credit Card Payments" },
  { pattern: /\b(amex|american express)\b/i, subtype: "credit_card_payment", label: "Credit Card Payments" },
  { pattern: /\bbarclaycard\b/i, subtype: "credit_card_payment", label: "Credit Card Payments" },
  { pattern: /\b(discover card|citi card)\b/i, subtype: "credit_card_payment", label: "Credit Card Payments" },
  { pattern: /\bpaypal\b/i, subtype: "paypal_transfer", label: "PayPal Transfers" },
  { pattern: /\b(stamps\.?com|usps|postage)\b/i, subtype: "postage_shipping", label: "Postage & Shipping" },
  { pattern: /\b(ups|fedex|dhl|air\s*mailers?)\b/i, subtype: "postage_shipping", label: "Postage & Shipping" },
  { pattern: /\b(at.t|directv|verizon|comcast|spectrum|cox|cable|telecom)\b/i, subtype: "utilities_telecom", label: "Utilities & Telecom" },
  { pattern: /\b(water|gas|electric|utility|erie county|power)\b/i, subtype: "utilities_telecom", label: "Utilities & Telecom" },
  { pattern: /\b(insurance|erie|bcbs|aetna|cigna|united health)\b/i, subtype: "insurance", label: "Insurance Payments" },
  { pattern: /\b(sba|eidl|loan payment|term loan|mortgage)\b/i, subtype: "loan_debt_service", label: "Loan & Debt Service" },
  { pattern: /\b(online banking|online xfer|online transfer)\b/i, subtype: "online_banking_transfer", label: "Online Banking Transfers" },
  { pattern: /\b(owner draw|member draw|distribution|capital contribution)\b/i, subtype: "owner_draw", label: "Owner Draws & Distributions" },
  { pattern: /\b(zelle|venmo|cash\s*app|cashapp)\b/i, subtype: "personal_app", label: "Personal App Transfers" },
];

const SUBTYPE_LABELS: Record<string, string> = {
  credit_card_payment: "Credit Card Payments",
  paypal_transfer: "PayPal Transfers",
  postage_shipping: "Postage & Shipping",
  utilities_telecom: "Utilities & Telecom",
  insurance: "Insurance Payments",
  loan_debt_service: "Loan & Debt Service",
  online_banking_transfer: "Online Banking Transfers",
  owner_draw: "Owner Draws & Distributions",
  personal_app: "Personal App Transfers",
  other_owner_related: "Other Owner-Related",
};

function detectSubtype(memo: string): string {
  for (const { pattern, subtype } of VENDOR_FAMILY_PATTERNS) {
    if (pattern.test(memo)) return subtype;
  }
  return "other_owner_related";
}

export function getSubtypeLabel(subtype: string | undefined): string {
  return SUBTYPE_LABELS[subtype || ""] || "Other Owner-Related";
}

const MAX_CASE_SIZE = 500;

// ─── Case builder ────────────────────────────────────────────────────

function buildCases(rawData: Record<string, PeriodClassification> | null): TransferCase[] {
  if (!rawData) return [];

  // Read persisted case statuses from _meta
  const persistedStatuses: Record<string, CaseStatus> = (rawData as any)?._meta?.caseStatuses ?? {};

  // Step 1: Collect all transactions with subtype resolution
  const allTxns: ClassifiedTransaction[] = [];
  for (const [periodKey, periodData] of Object.entries(rawData)) {
    if (periodKey === "_meta") continue;
    const txns = Array.isArray(periodData?.transactions) ? periodData.transactions : [];
    for (const txn of txns) {
      // Resolve subtype: use backend-assigned or detect from memo
      if (!txn.subtype && txn.category === "owner" && txn.memo) {
        txn.subtype = detectSubtype(txn.memo);
      }
      allTxns.push(txn);
    }
  }

  // Step 2: Group into mega-categories for manageable review
  // Owner → 3 buckets: owner_draw, personal_app, other_owner_related
  // Interbank → by case_id (pair-based)
  const OWNER_MEGA_GROUPS: Record<string, string> = {
    credit_card_payment: "other_owner_related",
    paypal_transfer: "personal_app",
    postage_shipping: "other_owner_related",
    utilities_telecom: "other_owner_related",
    insurance: "other_owner_related",
    loan_debt_service: "other_owner_related",
    online_banking_transfer: "other_owner_related",
    owner_draw: "owner_draw",
    personal_app: "personal_app",
    other_owner_related: "other_owner_related",
  };

  const caseMap = new Map<string, ClassifiedTransaction[]>();

  for (const txn of allTxns) {
    let groupKey: string;

    if (txn.category === "owner") {
      const mega = OWNER_MEGA_GROUPS[txn.subtype || "other_owner_related"] || "other_owner_related";
      groupKey = `owner_${mega}`;
    } else {
      groupKey = txn.case_id || `ungrouped_${txn.category}`;
    }

    if (!caseMap.has(groupKey)) caseMap.set(groupKey, []);
    caseMap.get(groupKey)!.push(txn);
  }

  // Step 3: Build case objects, splitting oversized cases
  const cases: TransferCase[] = [];

  for (const [caseId, txns] of caseMap) {
    if (txns.length === 0) continue;
    cases.push(buildSingleCase(caseId, txns, persistedStatuses));
  }

  cases.sort((a, b) => b.risk_score - a.risk_score);
  return cases;
}

function buildSingleCase(caseId: string, txns: ClassifiedTransaction[], persistedStatuses: Record<string, CaseStatus> = {}): TransferCase {
  const first = txns[0];
  const candidateType = first.candidate_type || first.category;

  let caseType: TransferCase["case_type"];
  if (candidateType === "internal_same_entity_transfer" || (first.category === "interbank" && first.paired_with)) {
    caseType = "internal_transfer";
  } else if (candidateType === "external_bank_like_transfer") {
    caseType = "external_transfer_like";
  } else if (candidateType === "owner_related" || first.category === "owner") {
    caseType = "owner_related";
  } else if ((first.confidence ?? 1) < 0.70) {
    caseType = "ambiguous";
  } else {
    caseType = "excluded_operating";
  }

  const totalDollars = txns.reduce((s, t) => s + (t.amount ?? 0), 0);
  const avgConfidence = txns.reduce((s, t) => s + (t.confidence ?? 0.5), 0) / txns.length;
  const dates = txns.map(t => t.date || "").filter(Boolean).sort();

  const maxDollars = Math.max(totalDollars, 1);
  const dollarsNorm = Math.log10(totalDollars + 1) / Math.log10(maxDollars + 1);
  const ownerBoost = caseType === "owner_related" ? 1.0 : 0;
  const ambiguityBoost = 1.0 - avgConfidence;
  const recurrence = Math.min(txns.length / 10, 1.0);
  const riskScore = (dollarsNorm * 0.4) + (ownerBoost * 0.25) + (ambiguityBoost * 0.2) + (recurrence * 0.15);

  const evidenceCounts = new Map<string, EvidenceAtom>();
  for (const t of txns) {
    for (const ev of t.evidence || []) {
      if (!evidenceCounts.has(ev.type)) evidenceCounts.set(ev.type, { ...ev });
    }
  }

  // Build reasoning label from subtype
  let label = "Operating transaction";
  if (caseType === "internal_transfer") {
    label = `Matched interbank pair (${txns.length} transactions)`;
  } else if (caseType === "external_transfer_like") {
    label = `Transfer-like, one side only`;
  } else if (caseType === "owner_related") {
    const subtype = first.subtype;
    const subtypeLabel = getSubtypeLabel(subtype);
    label = subtypeLabel;
  } else if (caseType === "ambiguous") {
    label = `Needs manual review`;
  }

  return {
    case_id: caseId,
    case_type: caseType,
    status: persistedStatuses[caseId] ?? "suggested",
    confidence: avgConfidence,
    total_dollars: totalDollars,
    transaction_count: txns.length,
    date_range: [dates[0] || "", dates[dates.length - 1] || ""],
    representative_txn_ids: [...txns].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 5).map(t => t.id),
    edge_case_txn_ids: [...txns].sort((a, b) => (a.confidence ?? 1) - (b.confidence ?? 1)).slice(0, 3).map(t => t.id),
    evidence_summary: [...evidenceCounts.values()],
    risk_score: riskScore,
    reasoning_label: label,
    transactions: txns,
  };
}

// ─── Main hook ───────────────────────────────────────────────────────

export function useTransferClassification(projectId: string | undefined) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyProgress, setClassifyProgress] = useState<ClassifyProgress | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["transfer-classification", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "transfer_classification")
        .maybeSingle();
      if (error) {
        console.error("Error fetching transfer classifications:", error);
        throw error;
      }
      return (data?.data as unknown) as Record<string, PeriodClassification> | null;
    },
    enabled: !!projectId,
  });

  // Auto-detect running classification on mount/data change (with stale-run detection)
  const isStale = useMemo(() => {
    const meta = (rawData as any)?._meta;
    return meta?.status === "running" && isRunStale(meta);
  }, [rawData]);

  useEffect(() => {
    if (!rawData || !projectId) return;
    const meta = (rawData as any)?._meta;
    if (meta?.status === "running" && !isClassifying) {
      // If the run is stale (>5 min since last update), don't auto-resume
      if (isRunStale(meta)) {
        console.warn("Transfer classification run is stale, allowing re-run");
        return;
      }
      setIsClassifying(true);
      setClassifyProgress({
        processed: meta.processedTxnCount || 0,
        total: meta.totalTxnCount || 0,
      });
      startPolling(projectId);
    }
  }, [rawData, projectId]);

  const pollStartRef = useRef<number>(0);

  const startPolling = useCallback((pid: string) => {
    stopPolling();
    pollStartRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      // Poll timeout: if polling for >10 min, treat as stale
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        console.warn("Poll timeout reached, stopping polling");
        stopPolling();
        setIsClassifying(false);
        setClassifyProgress(null);
        setClassifyError("Classification timed out — please re-run");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("ai-backend-proxy", {
          body: { endpoint: "classify-status", payload: { project_id: pid } },
        });
        if (error) { console.error("Poll error:", error); return; }
        const poll = data as PollResponse;

        if (poll.total > 0) {
          setClassifyProgress({ processed: poll.processed, total: poll.total });
        }

        if (poll.status === "completed") {
          stopPolling();
          setIsClassifying(false);
          setClassifyProgress(null);
          setClassifyError(null);
          await queryClient.invalidateQueries({ queryKey: ["transfer-classification", pid] });
        } else if (poll.status === "error") {
          stopPolling();
          setIsClassifying(false);
          setClassifyProgress(null);
          setClassifyError(poll.error || "Classification failed");
        }
      } catch (err) {
        console.error("Poll fetch error:", err);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, queryClient]);

  // Legacy per-period totals map (backwards compat — includes ALL classifications regardless of case status)
  const classifications = useMemo(() => {
    if (!rawData) return null;
    const map = new Map<string, TransferTotals>();
    for (const [period, totals] of Object.entries(rawData)) {
      if (period.startsWith("_")) continue;
      // Split interbank by transaction sign
      let interbankIn = 0;
      let interbankOut = 0;
      const txns = Array.isArray(totals.transactions) ? totals.transactions : [];
      for (const txn of txns) {
        if (txn.category === "interbank") {
          const amt = txn.amount ?? 0;
          if (amt > 0) interbankIn += amt;
          else interbankOut += Math.abs(amt);
        }
      }
      map.set(period, { interbank: totals.interbank, interbankIn, interbankOut, owner: totals.owner });
    }
    return map;
  }, [rawData]);


  // Delta reconciliation data (new waterfall view) — normalizes backend shape
  const deltaReconciliation = useMemo(() => {
    if (!rawData) return null;
    const raw = (rawData as any)?._delta_reconciliation;
    if (!raw) return null;
    return normalizeDeltaReconciliation(raw);
  }, [rawData]);

  // Cash-to-accrual reconciliation data from backend
  const cashToAccrual = useMemo((): CashToAccrualSummary | null => {
    if (!rawData) return null;
    const raw = (rawData as any)?._cash_to_accrual;
    if (!raw) return null;
    return normalizeCashToAccrual(raw);
  }, [rawData]);

  // New: case model
  const cases = useMemo(() => buildCases(rawData), [rawData]);

  const caseStats = useMemo(() => {
    const stats = { internal: 0, owner: 0, ambiguous: 0, excluded: 0 };
    for (const c of cases) {
      if (c.case_type === "internal_transfer" || c.case_type === "external_transfer_like") stats.internal++;
      else if (c.case_type === "owner_related") stats.owner++;
      else if (c.case_type === "ambiguous") stats.ambiguous++;
      else stats.excluded++;
    }
    return stats;
  }, [cases]);

  // Approved-only per-period totals: only sums transactions from accepted cases
  const approvedClassifications = useMemo(() => {
    if (!rawData) return null;
    // If no cases exist (no transactions at all), return zero-filled map so UI still shows "classified" state
    if (cases.length === 0) {
      const map = new Map<string, TransferTotals>();
      for (const [period] of Object.entries(rawData)) {
      if (period.startsWith("_")) continue;
        map.set(period, { interbank: 0, interbankIn: 0, interbankOut: 0, owner: 0, debt_service: 0, capex: 0, tax_payments: 0 });
      }
      return map;
    }
    const map = new Map<string, TransferTotals>();

    // Build period keys from rawData
    for (const [period] of Object.entries(rawData)) {
      if (period.startsWith("_")) continue;
      map.set(period, { interbank: 0, interbankIn: 0, interbankOut: 0, owner: 0, debt_service: 0, capex: 0, tax_payments: 0 });
    }

    // Only count transactions from accepted cases
    for (const c of cases) {
      if (c.status !== "accepted") continue;
      for (const txn of c.transactions) {
        let periodKey: string | null = null;
        if (txn.date) {
          periodKey = txn.date.substring(0, 7);
        } else {
          for (const [pk, pd] of Object.entries(rawData)) {
            if (pk.startsWith("_")) continue;
            if (pd.transactions?.some(t => t.id === txn.id)) {
              periodKey = pk;
              break;
            }
          }
        }
        if (!periodKey || !map.has(periodKey)) continue;
        const entry = map.get(periodKey)!;
        const amt = txn.amount ?? 0;
        if (txn.category === "interbank") {
          entry.interbank += amt;
          if (amt > 0) entry.interbankIn += amt;
          else entry.interbankOut += Math.abs(amt);
        }
        else if (txn.category === "owner") entry.owner += amt;
      }
    }

    return map;
  }, [rawData, cases]);

  // Pending case stats — only count reviewable cases (not excluded_operating)
  const reviewableCases = useMemo(() => {
    return cases.filter(c => c.case_type !== "excluded_operating");
  }, [cases]);

  const pendingCaseCount = useMemo(() => {
    return reviewableCases.filter(c => c.status === "suggested").length;
  }, [reviewableCases]);

  const excludedOperatingCount = useMemo(() => {
    return cases.filter(c => c.case_type === "excluded_operating").length;
  }, [cases]);

  const classify = async () => {
    if (!projectId) return;
    if (isClassifying && !isStale) return; // Allow re-run if stale
    setIsClassifying(true);
    setClassifyProgress(null);
    setClassifyError(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-backend-proxy", {
        body: { endpoint: "classify", payload: { project_id: projectId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.done) {
        setIsClassifying(false);
        await queryClient.invalidateQueries({ queryKey: ["transfer-classification", projectId] });
        return;
      }

      if (data?.total) {
        setClassifyProgress({ processed: data.processed ?? 0, total: data.total });
      }
      startPolling(projectId);
    } catch (err) {
      console.error("Classification start failed:", err);
      setIsClassifying(false);
      setClassifyProgress(null);
      setClassifyError(err instanceof Error ? err.message : "Classification failed");
      throw err;
    }
  };

  const updateClassifications = async (updated: Record<string, PeriodClassification>) => {
    if (!projectId) return;
    const { data: existing, error: fetchError } = await supabase
      .from("processed_data")
      .select("id")
      .eq("project_id", projectId)
      .eq("data_type", "transfer_classification")
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error("No classification record found");

    const { error: updateError } = await supabase
      .from("processed_data")
      .update({ data: updated as unknown as Record<string, never> })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    await queryClient.invalidateQueries({ queryKey: ["transfer-classification", projectId] });
  };

  return {
    classifications,
    approvedClassifications,
    deltaReconciliation,
    cashToAccrual,
    rawData,
    isLoading,
    classify,
    isClassifying,
    classifyProgress,
    classifyError,
    updateClassifications,
    cases,
    caseStats,
    pendingCaseCount,
    excludedOperatingCount,
  };
}

// ─── Cash-to-accrual types ───────────────────────────────────────────

export interface CashToAccrualPeriod {
  period: string;
  op_cash_receipts: number;
  op_cash_disbursements: number;
  is_revenue: number | null;
  is_expenses: number | null;
  receipts_variance: number | null;
  disbursements_variance: number | null;
  ar_change: number | null;
  ap_change: number | null;
  dep_amort: number | null;
  receipts_residual: number | null;
  disbursements_residual: number | null;
  receipts_reconciled: boolean;
  disbursements_reconciled: boolean;
}

export interface CashToAccrualSummary {
  periods: Record<string, CashToAccrualPeriod>;
  summary: {
    total_receipts_variance: number;
    total_disbursements_variance: number;
    total_unexplained: number;
    overall_reconciled: boolean;
    unreconciled_periods: string[];
  };
}

// ─── Delta reconciliation types ──────────────────────────────────────

export interface WaterfallStep {
  label: string;
  category: "interbank" | "owner" | "debt_service" | "capex" | "tax_payments";
  amount: number;
  confidence: number;
  transaction_count: number;
  transaction_ids: string[];
}

export interface DeltaPeriod {
  gl_ending_cash: number;
  bank_ending_cash: number;
  starting_delta: number;
  waterfall_steps: WaterfallStep[];
  unexplained_remainder: number;
  cash_leakage_flag: boolean;
}

export interface DeltaReconciliation {
  delta_source: "gl_vs_bank" | "bank_internal";
  periods: Record<string, DeltaPeriod>;
  cash_leakage_periods: string[];
  summary: { total_delta: number; total_explained: number; total_unexplained: number };
}

// ─── Backend → Frontend normalizer ──────────────────────────────────

const LABEL_TO_CATEGORY: Record<string, WaterfallStep["category"]> = {
  interbank: "interbank",
  "interbank transfers": "interbank",
  owner: "owner",
  "owner / related-party": "owner",
  "owner related": "owner",
  "debt service": "debt_service",
  capex: "capex",
  "capital expenditures": "capex",
  "tax payments": "tax_payments",
  taxes: "tax_payments",
};

function inferCategory(label: string): WaterfallStep["category"] {
  const key = label.toLowerCase().trim();
  return LABEL_TO_CATEGORY[key] ?? "interbank";
}

function normalizeDeltaReconciliation(raw: any): DeltaReconciliation {
  // Already in frontend shape?
  if (raw.summary && !raw.totals && !Array.isArray(raw.periods)) {
    return raw as DeltaReconciliation;
  }

  const totals = raw.totals ?? {};
  const summary = {
    total_delta: totals.delta ?? 0,
    total_explained: totals.explained ?? 0,
    total_unexplained: totals.unexplained ?? 0,
  };

  const periodsArr: any[] = Array.isArray(raw.periods) ? raw.periods : [];
  const periods: Record<string, DeltaPeriod> = {};
  const leakagePeriods: string[] = [];

  for (const p of periodsArr) {
    const key = p.period_key ?? p.period ?? "unknown";
    const steps: WaterfallStep[] = (p.waterfall ?? p.waterfall_steps ?? []).map((w: any) => ({
      label: w.label ?? "",
      category: w.category ?? inferCategory(w.label ?? ""),
      amount: w.amount ?? 0,
      confidence: w.confidence ?? 0,
      transaction_count: w.transaction_count ?? 0,
      transaction_ids: w.transaction_ids ?? [],
    }));

    const remainder = p.unexplained_remainder ?? 0;
    const period: DeltaPeriod = {
      gl_ending_cash: p.gl_ending_cash ?? p.gl_cash_activity ?? 0,
      bank_ending_cash: p.bank_ending_cash ?? p.bank_net_activity ?? 0,
      starting_delta: p.starting_delta ?? p.delta ?? 0,
      waterfall_steps: steps,
      unexplained_remainder: remainder,
      cash_leakage_flag: p.cash_leakage_flag ?? Math.abs(remainder) > 500,
    };

    periods[key] = period;
    if (period.cash_leakage_flag) leakagePeriods.push(key);
  }

  const deltaSource = periodsArr[0]?.delta_source ?? raw.delta_source ?? "gl_vs_bank";

  return {
    delta_source: deltaSource,
    periods,
    cash_leakage_periods: raw.cash_leakage_periods ?? leakagePeriods,
    summary,
  };
}

// ─── Cash-to-accrual normalizer ─────────────────────────────────────

function normalizeCashToAccrual(raw: any): CashToAccrualSummary {
  // Already normalized?
  if (raw.periods && raw.summary && !Array.isArray(raw.periods)) {
    // Validate shape — ensure period values have expected fields
    const periods: Record<string, CashToAccrualPeriod> = {};
    for (const [key, val] of Object.entries(raw.periods)) {
      const p = val as any;
      periods[key] = {
        period: p.period ?? key,
        op_cash_receipts: p.op_cash_receipts ?? 0,
        op_cash_disbursements: p.op_cash_disbursements ?? 0,
        is_revenue: p.is_revenue ?? 0,
        is_expenses: p.is_expenses ?? 0,
        receipts_variance: p.receipts_variance ?? 0,
        disbursements_variance: p.disbursements_variance ?? 0,
        ar_change: p.ar_change ?? null,
        ap_change: p.ap_change ?? null,
        dep_amort: p.dep_amort ?? p.depreciation_amortization ?? null,
        receipts_residual: p.receipts_residual ?? 0,
        disbursements_residual: p.disbursements_residual ?? 0,
        receipts_reconciled: p.receipts_reconciled ?? false,
        disbursements_reconciled: p.disbursements_reconciled ?? false,
      };
    }
    return { periods, summary: raw.summary };
  }

  // Array-based backend shape — unwrap nested receipts/disbursements objects
  const periodsArr: any[] = Array.isArray(raw.periods) ? raw.periods : [];
  const periods: Record<string, CashToAccrualPeriod> = {};

  for (const p of periodsArr) {
    const key = p.period ?? p.period_key ?? "unknown";
    const r = p.receipts ?? {};
    const d = p.disbursements ?? {};
    periods[key] = {
      period: key,
      op_cash_receipts: r.operating_receipts ?? p.op_cash_receipts ?? 0,
      op_cash_disbursements: d.operating_disbursements ?? p.op_cash_disbursements ?? 0,
      is_revenue: r.is_revenue ?? p.is_revenue ?? null,
      is_expenses: d.is_expenses ?? p.is_expenses ?? null,
      receipts_variance: r.variance ?? p.receipts_variance ?? null,
      disbursements_variance: d.variance ?? p.disbursements_variance ?? null,
      ar_change: r.ar_change ?? p.ar_change ?? null,
      ap_change: d.ap_change ?? p.ap_change ?? null,
      dep_amort: d.dep_amort ?? d.depreciation_amortization ?? p.dep_amort ?? null,
      receipts_residual: r.residual ?? p.receipts_residual ?? null,
      disbursements_residual: d.residual ?? p.disbursements_residual ?? null,
      receipts_reconciled: r.reconciled ?? p.receipts_reconciled ?? false,
      disbursements_reconciled: d.reconciled ?? p.disbursements_reconciled ?? false,
    };
  }

  // Map backend "totals" to frontend "summary"
  const totals = raw.totals ?? raw.summary;
  const summary = totals ? {
    total_receipts_variance: totals.total_receipts_variance ?? totals.receipts_variance ?? 0,
    total_disbursements_variance: totals.total_disbursements_variance ?? totals.disbursements_variance ?? 0,
    total_unexplained: totals.total_unexplained ?? totals.unexplained ?? 0,
    overall_reconciled: totals.overall_reconciled ?? false,
    unreconciled_periods: totals.unreconciled_periods ?? [],
  } : {
    total_receipts_variance: 0,
    total_disbursements_variance: 0,
    total_unexplained: 0,
    overall_reconciled: false,
    unreconciled_periods: [],
  };

  return { periods, summary };
}
