import { useQuery, useQueryClient } from "@tanstack/react-query";
import { s as supabase, B as Button, C as Card, b as CardHeader, d as CardTitle, T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent, f as CardContent } from "../main.mjs";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C93YiWo6.js";
import { CheckCircle2, ChevronDown, ChevronRight, XCircle, UserX, Split, Eye, AlertTriangle, Shield, History } from "lucide-react";
function useProofOfCashData(projectId) {
  const bankStatementsQuery = useQuery({
    queryKey: ["proof-of-cash-bank-statements", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data: processedData, error } = await supabase.from("processed_data").select(`
          id,
          source_document_id,
          period_start,
          period_end,
          data,
          created_at,
          documents:source_document_id (
            id,
            name,
            institution,
            account_label
          )
        `).eq("project_id", projectId).eq("data_type", "bank_transactions").order("period_start", { ascending: true }).limit(1e6);
      if (error) {
        console.error("Error fetching bank statements:", error);
        throw error;
      }
      const statements = (processedData || []).map((item) => {
        const data = item.data || {};
        const summary = data.summary || {};
        const doc = item.documents;
        return {
          id: item.id,
          documentId: item.source_document_id,
          documentName: doc?.name || "Unknown Document",
          accountNumber: data.accountNumber || doc?.account_label || void 0,
          bankName: data.bankName || doc?.institution || void 0,
          periodStart: item.period_start,
          periodEnd: item.period_end,
          summary: {
            openingBalance: summary.openingBalance ?? 0,
            closingBalance: summary.closingBalance ?? 0,
            totalCredits: summary.totalCredits ?? 0,
            totalDebits: summary.totalDebits ?? 0,
            transactionCount: summary.transactionCount ?? 0
          },
          createdAt: item.created_at
        };
      });
      return statements;
    },
    enabled: !!projectId
  });
  return {
    bankStatements: bankStatementsQuery.data || [],
    isLoading: bankStatementsQuery.isLoading,
    error: bankStatementsQuery.error,
    refetch: bankStatementsQuery.refetch
  };
}
const POLL_INTERVAL_MS = 3e3;
const STALE_THRESHOLD_MS = 5 * 60 * 1e3;
const POLL_TIMEOUT_MS = 10 * 60 * 1e3;
function isRunStale(meta) {
  if (!meta) return true;
  const ts = meta.updatedAt || meta.updated_at;
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > STALE_THRESHOLD_MS;
}
const VENDOR_FAMILY_PATTERNS = [
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
  { pattern: /\b(zelle|venmo|cash\s*app|cashapp)\b/i, subtype: "personal_app", label: "Personal App Transfers" }
];
const SUBTYPE_LABELS = {
  credit_card_payment: "Credit Card Payments",
  paypal_transfer: "PayPal Transfers",
  postage_shipping: "Postage & Shipping",
  utilities_telecom: "Utilities & Telecom",
  insurance: "Insurance Payments",
  loan_debt_service: "Loan & Debt Service",
  online_banking_transfer: "Online Banking Transfers",
  owner_draw: "Owner Draws & Distributions",
  personal_app: "Personal App Transfers",
  other_owner_related: "Other Owner-Related"
};
function detectSubtype(memo) {
  for (const { pattern, subtype } of VENDOR_FAMILY_PATTERNS) {
    if (pattern.test(memo)) return subtype;
  }
  return "other_owner_related";
}
function getSubtypeLabel(subtype) {
  return SUBTYPE_LABELS[subtype || ""] || "Other Owner-Related";
}
function buildCases(rawData) {
  if (!rawData) return [];
  const persistedStatuses = rawData?._meta?.caseStatuses ?? {};
  const allTxns = [];
  for (const [periodKey, periodData] of Object.entries(rawData)) {
    if (periodKey === "_meta") continue;
    const txns = Array.isArray(periodData?.transactions) ? periodData.transactions : [];
    for (const txn of txns) {
      if (!txn.subtype && txn.category === "owner" && txn.memo) {
        txn.subtype = detectSubtype(txn.memo);
      }
      allTxns.push(txn);
    }
  }
  const OWNER_MEGA_GROUPS = {
    credit_card_payment: "other_owner_related",
    paypal_transfer: "personal_app",
    postage_shipping: "other_owner_related",
    utilities_telecom: "other_owner_related",
    insurance: "other_owner_related",
    loan_debt_service: "other_owner_related",
    online_banking_transfer: "other_owner_related",
    owner_draw: "owner_draw",
    personal_app: "personal_app",
    other_owner_related: "other_owner_related"
  };
  const caseMap = /* @__PURE__ */ new Map();
  for (const txn of allTxns) {
    let groupKey;
    if (txn.category === "owner") {
      const mega = OWNER_MEGA_GROUPS[txn.subtype || "other_owner_related"] || "other_owner_related";
      groupKey = `owner_${mega}`;
    } else {
      groupKey = txn.case_id || `ungrouped_${txn.category}`;
    }
    if (!caseMap.has(groupKey)) caseMap.set(groupKey, []);
    caseMap.get(groupKey).push(txn);
  }
  const cases = [];
  for (const [caseId, txns] of caseMap) {
    if (txns.length === 0) continue;
    cases.push(buildSingleCase(caseId, txns, persistedStatuses));
  }
  cases.sort((a, b) => b.risk_score - a.risk_score);
  return cases;
}
function buildSingleCase(caseId, txns, persistedStatuses = {}) {
  const first = txns[0];
  const candidateType = first.candidate_type || first.category;
  let caseType;
  if (candidateType === "internal_same_entity_transfer" || first.category === "interbank" && first.paired_with) {
    caseType = "internal_transfer";
  } else if (candidateType === "external_bank_like_transfer") {
    caseType = "external_transfer_like";
  } else if (candidateType === "owner_related" || first.category === "owner") {
    caseType = "owner_related";
  } else if ((first.confidence ?? 1) < 0.7) {
    caseType = "ambiguous";
  } else {
    caseType = "excluded_operating";
  }
  const totalDollars = txns.reduce((s, t) => s + (t.amount ?? 0), 0);
  const avgConfidence = txns.reduce((s, t) => s + (t.confidence ?? 0.5), 0) / txns.length;
  const dates = txns.map((t) => t.date || "").filter(Boolean).sort();
  const maxDollars = Math.max(totalDollars, 1);
  const dollarsNorm = Math.log10(totalDollars + 1) / Math.log10(maxDollars + 1);
  const ownerBoost = caseType === "owner_related" ? 1 : 0;
  const ambiguityBoost = 1 - avgConfidence;
  const recurrence = Math.min(txns.length / 10, 1);
  const riskScore = dollarsNorm * 0.4 + ownerBoost * 0.25 + ambiguityBoost * 0.2 + recurrence * 0.15;
  const evidenceCounts = /* @__PURE__ */ new Map();
  for (const t of txns) {
    for (const ev of t.evidence || []) {
      if (!evidenceCounts.has(ev.type)) evidenceCounts.set(ev.type, { ...ev });
    }
  }
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
    representative_txn_ids: [...txns].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 5).map((t) => t.id),
    edge_case_txn_ids: [...txns].sort((a, b) => (a.confidence ?? 1) - (b.confidence ?? 1)).slice(0, 3).map((t) => t.id),
    evidence_summary: [...evidenceCounts.values()],
    risk_score: riskScore,
    reasoning_label: label,
    transactions: txns
  };
}
function useTransferClassification(projectId) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyProgress, setClassifyProgress] = useState(null);
  const [classifyError, setClassifyError] = useState(null);
  const pollRef = useRef(null);
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
      const { data, error } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "transfer_classification").maybeSingle();
      if (error) {
        console.error("Error fetching transfer classifications:", error);
        throw error;
      }
      return data?.data;
    },
    enabled: !!projectId
  });
  const isStale = useMemo(() => {
    const meta = rawData?._meta;
    return meta?.status === "running" && isRunStale(meta);
  }, [rawData]);
  useEffect(() => {
    if (!rawData || !projectId) return;
    const meta = rawData?._meta;
    if (meta?.status === "running" && !isClassifying) {
      if (isRunStale(meta)) {
        console.warn("Transfer classification run is stale, allowing re-run");
        return;
      }
      setIsClassifying(true);
      setClassifyProgress({
        processed: meta.processedTxnCount || 0,
        total: meta.totalTxnCount || 0
      });
      startPolling(projectId);
    }
  }, [rawData, projectId]);
  const pollStartRef = useRef(0);
  const startPolling = useCallback((pid) => {
    stopPolling();
    pollStartRef.current = Date.now();
    pollRef.current = setInterval(async () => {
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
          body: { endpoint: "classify-status", payload: { project_id: pid } }
        });
        if (error) {
          console.error("Poll error:", error);
          return;
        }
        const poll = data;
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
  const classifications = useMemo(() => {
    if (!rawData) return null;
    const map = /* @__PURE__ */ new Map();
    for (const [period, totals] of Object.entries(rawData)) {
      if (period.startsWith("_")) continue;
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
  const deltaReconciliation = useMemo(() => {
    if (!rawData) return null;
    const raw = rawData?._delta_reconciliation;
    if (!raw) return null;
    return normalizeDeltaReconciliation(raw);
  }, [rawData]);
  const cashToAccrual = useMemo(() => {
    if (!rawData) return null;
    const raw = rawData?._cash_to_accrual;
    if (!raw) return null;
    return normalizeCashToAccrual(raw);
  }, [rawData]);
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
  const approvedClassifications = useMemo(() => {
    if (!rawData) return null;
    if (cases.length === 0) {
      const map2 = /* @__PURE__ */ new Map();
      for (const [period] of Object.entries(rawData)) {
        if (period.startsWith("_")) continue;
        map2.set(period, { interbank: 0, interbankIn: 0, interbankOut: 0, owner: 0, debt_service: 0, capex: 0, tax_payments: 0 });
      }
      return map2;
    }
    const map = /* @__PURE__ */ new Map();
    for (const [period] of Object.entries(rawData)) {
      if (period.startsWith("_")) continue;
      map.set(period, { interbank: 0, interbankIn: 0, interbankOut: 0, owner: 0, debt_service: 0, capex: 0, tax_payments: 0 });
    }
    for (const c of cases) {
      if (c.status !== "accepted") continue;
      for (const txn of c.transactions) {
        let periodKey = null;
        if (txn.date) {
          periodKey = txn.date.substring(0, 7);
        } else {
          for (const [pk, pd] of Object.entries(rawData)) {
            if (pk.startsWith("_")) continue;
            if (pd.transactions?.some((t) => t.id === txn.id)) {
              periodKey = pk;
              break;
            }
          }
        }
        if (!periodKey || !map.has(periodKey)) continue;
        const entry = map.get(periodKey);
        const amt = txn.amount ?? 0;
        if (txn.category === "interbank") {
          entry.interbank += amt;
          if (amt > 0) entry.interbankIn += amt;
          else entry.interbankOut += Math.abs(amt);
        } else if (txn.category === "owner") entry.owner += amt;
      }
    }
    return map;
  }, [rawData, cases]);
  const reviewableCases = useMemo(() => {
    return cases.filter((c) => c.case_type !== "excluded_operating");
  }, [cases]);
  const pendingCaseCount = useMemo(() => {
    return reviewableCases.filter((c) => c.status === "suggested").length;
  }, [reviewableCases]);
  const excludedOperatingCount = useMemo(() => {
    return cases.filter((c) => c.case_type === "excluded_operating").length;
  }, [cases]);
  const classify = async () => {
    if (!projectId) return;
    if (isClassifying && !isStale) return;
    setIsClassifying(true);
    setClassifyProgress(null);
    setClassifyError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-backend-proxy", {
        body: { endpoint: "classify", payload: { project_id: projectId } }
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
  const updateClassifications = async (updated) => {
    if (!projectId) return;
    const { data: existing, error: fetchError } = await supabase.from("processed_data").select("id").eq("project_id", projectId).eq("data_type", "transfer_classification").maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) throw new Error("No classification record found");
    const { error: updateError } = await supabase.from("processed_data").update({ data: updated }).eq("id", existing.id);
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
    excludedOperatingCount
  };
}
const LABEL_TO_CATEGORY = {
  interbank: "interbank",
  "interbank transfers": "interbank",
  owner: "owner",
  "owner / related-party": "owner",
  "owner related": "owner",
  "debt service": "debt_service",
  capex: "capex",
  "capital expenditures": "capex",
  "tax payments": "tax_payments",
  taxes: "tax_payments"
};
function inferCategory(label) {
  const key = label.toLowerCase().trim();
  return LABEL_TO_CATEGORY[key] ?? "interbank";
}
function normalizeDeltaReconciliation(raw) {
  if (raw.summary && !raw.totals && !Array.isArray(raw.periods)) {
    return raw;
  }
  const totals = raw.totals ?? {};
  const summary = {
    total_delta: totals.delta ?? 0,
    total_explained: totals.explained ?? 0,
    total_unexplained: totals.unexplained ?? 0
  };
  const periodsArr = Array.isArray(raw.periods) ? raw.periods : [];
  const periods = {};
  const leakagePeriods = [];
  for (const p of periodsArr) {
    const key = p.period_key ?? p.period ?? "unknown";
    const steps = (p.waterfall ?? p.waterfall_steps ?? []).map((w) => ({
      label: w.label ?? "",
      category: w.category ?? inferCategory(w.label ?? ""),
      amount: w.amount ?? 0,
      confidence: w.confidence ?? 0,
      transaction_count: w.transaction_count ?? 0,
      transaction_ids: w.transaction_ids ?? []
    }));
    const remainder = p.unexplained_remainder ?? 0;
    const period = {
      gl_ending_cash: p.gl_ending_cash ?? p.gl_cash_activity ?? 0,
      bank_ending_cash: p.bank_ending_cash ?? p.bank_net_activity ?? 0,
      starting_delta: p.starting_delta ?? p.delta ?? 0,
      waterfall_steps: steps,
      unexplained_remainder: remainder,
      cash_leakage_flag: p.cash_leakage_flag ?? Math.abs(remainder) > 500
    };
    periods[key] = period;
    if (period.cash_leakage_flag) leakagePeriods.push(key);
  }
  const deltaSource = periodsArr[0]?.delta_source ?? raw.delta_source ?? "gl_vs_bank";
  return {
    delta_source: deltaSource,
    periods,
    cash_leakage_periods: raw.cash_leakage_periods ?? leakagePeriods,
    summary
  };
}
function normalizeCashToAccrual(raw) {
  if (raw.periods && raw.summary && !Array.isArray(raw.periods)) {
    const periods2 = {};
    for (const [key, val] of Object.entries(raw.periods)) {
      const p = val;
      periods2[key] = {
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
        disbursements_reconciled: p.disbursements_reconciled ?? false
      };
    }
    return { periods: periods2, summary: raw.summary };
  }
  const periodsArr = Array.isArray(raw.periods) ? raw.periods : [];
  const periods = {};
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
      disbursements_reconciled: d.reconciled ?? p.disbursements_reconciled ?? false
    };
  }
  const totals = raw.totals ?? raw.summary;
  const summary = totals ? {
    total_receipts_variance: totals.total_receipts_variance ?? totals.receipts_variance ?? 0,
    total_disbursements_variance: totals.total_disbursements_variance ?? totals.disbursements_variance ?? 0,
    total_unexplained: totals.total_unexplained ?? totals.unexplained ?? 0,
    overall_reconciled: totals.overall_reconciled ?? false,
    unreconciled_periods: totals.unreconciled_periods ?? []
  } : {
    total_receipts_variance: 0,
    total_disbursements_variance: 0,
    total_unexplained: 0,
    overall_reconciled: false,
    unreconciled_periods: []
  };
  return { periods, summary };
}
const SAMPLE_THRESHOLD = 20;
function formatAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
function confidenceBadge(confidence) {
  if (confidence >= 0.8)
    return /* @__PURE__ */ jsx(Badge, { variant: "default", className: "text-[10px]", children: "High" });
  if (confidence >= 0.6)
    return /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "Medium" });
  return /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "text-[10px]", children: "Low" });
}
const EVIDENCE_LABELS = {
  amount_match_exact: "Amount match",
  amount_match_near: "Near amount",
  date_within_days: "Date proximity",
  keyword_match: "Keyword",
  name_match: "Name match",
  negative_class: "Operating signal",
  cross_account: "Cross-account",
  round_dollar: "Round dollar",
  recurring_pattern: "Recurring",
  personal_app_keyword: "Personal app",
  llm_classification: "AI classified",
  llm_reasoning: "AI reasoning",
  llm_contradiction: "AI contradiction",
  business_vendor_downweight: "Business vendor"
};
function caseTypeIcon(caseType) {
  switch (caseType) {
    case "internal_transfer":
      return /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4 text-primary" });
    case "owner_related":
      return /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-destructive" });
    case "ambiguous":
      return /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-accent-foreground" });
    default:
      return /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-muted-foreground" });
  }
}
function statusLabel(status) {
  if (status === "needs_analyst") return "Escalated";
  return status;
}
function EvidenceTag({ atom }) {
  const label = EVIDENCE_LABELS[atom.type] || atom.type;
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      Badge,
      {
        variant: "outline",
        className: "text-[10px] font-normal cursor-pointer hover:bg-accent",
        children: label
      }
    ) }),
    /* @__PURE__ */ jsxs(PopoverContent, { className: "w-64 text-xs space-y-1", side: "top", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium", children: label }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "Type: ",
        atom.type
      ] }),
      atom.weight != null && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "Weight: ",
        atom.weight.toFixed(2)
      ] }),
      atom.value && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground italic", children: [
        '"',
        atom.value,
        '"'
      ] }),
      atom.paired_with && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "Paired: ",
        atom.paired_with
      ] }),
      atom.llm_confidence != null && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "LLM confidence: ",
        (atom.llm_confidence * 100).toFixed(0),
        "%"
      ] })
    ] })
  ] });
}
function AuditHistory({ entries }) {
  if (entries.length === 0) return null;
  return /* @__PURE__ */ jsxs(Collapsible, { children: [
    /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1 ml-7", children: [
      /* @__PURE__ */ jsx(History, { className: "h-3 w-3" }),
      "History (",
      entries.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx(CollapsibleContent, { className: "ml-7 mt-1 space-y-0.5", children: entries.map((e, i) => /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: e.action }, i)) })
  ] });
}
function CaseCard({
  transferCase,
  onStatusChange,
  onTxnCategoryChange,
  onSplitSelected,
  auditHistory,
  exceptions
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState(/* @__PURE__ */ new Set());
  const txns = transferCase.transactions;
  const isLargeCase = txns.length >= SAMPLE_THRESHOLD;
  const sampledTxnIds = useMemo(() => {
    if (!isLargeCase) return null;
    const repIds = new Set(transferCase.representative_txn_ids || []);
    const edgeIds = new Set(transferCase.edge_case_txn_ids || []);
    return /* @__PURE__ */ new Set([...repIds, ...edgeIds]);
  }, [isLargeCase, transferCase.representative_txn_ids, transferCase.edge_case_txn_ids]);
  const visibleTxns = useMemo(() => {
    if (!isLargeCase || showAll) return txns;
    return txns.filter((t) => sampledTxnIds?.has(t.id));
  }, [txns, isLargeCase, showAll, sampledTxnIds]);
  const toggleTxn = (txnId) => {
    setSelectedTxns((prev) => {
      const next = new Set(prev);
      if (next.has(txnId)) next.delete(txnId);
      else next.add(txnId);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedTxns.size === visibleTxns.length) {
      setSelectedTxns(/* @__PURE__ */ new Set());
    } else {
      setSelectedTxns(new Set(visibleTxns.map((t) => t.id)));
    }
  };
  const handleSplit = () => {
    if (selectedTxns.size > 0 && selectedTxns.size < txns.length) {
      onSplitSelected(transferCase.case_id, [...selectedTxns]);
      setSelectedTxns(/* @__PURE__ */ new Set());
    }
  };
  const exceptionCount = txns.filter((t) => exceptions.has(t.id)).length;
  return /* @__PURE__ */ jsx(Card, { className: "mb-2", children: /* @__PURE__ */ jsxs(Collapsible, { open: expanded, onOpenChange: setExpanded, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "py-3 px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx(CollapsibleTrigger, { className: "flex items-center gap-1 hover:text-primary", children: expanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) }),
          caseTypeIcon(transferCase.case_type),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium truncate", children: transferCase.reasoning_label })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
          confidenceBadge(transferCase.confidence),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-muted-foreground", children: formatAmount(transferCase.total_dollars) }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            transferCase.transaction_count,
            " txn",
            transferCase.transaction_count !== 1 ? "s" : ""
          ] }),
          exceptionCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] text-destructive border-destructive", children: [
            exceptionCount,
            " exception",
            exceptionCount !== 1 ? "s" : ""
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 mt-1 ml-7 flex-wrap", children: transferCase.evidence_summary.slice(0, 4).map((ev, i) => /* @__PURE__ */ jsx(EvidenceTag, { atom: ev }, i)) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 mt-2 ml-7", children: transferCase.status === "suggested" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "default",
            className: "h-6 text-xs px-2",
            onClick: (e) => {
              e.stopPropagation();
              onStatusChange(transferCase.case_id, "accepted");
            },
            children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }),
              " Accept"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "h-6 text-xs px-2",
            onClick: (e) => {
              e.stopPropagation();
              onStatusChange(transferCase.case_id, "rejected");
            },
            children: [
              /* @__PURE__ */ jsx(XCircle, { className: "h-3 w-3 mr-1" }),
              " Reject"
            ]
          }
        ),
        /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "ghost",
              className: "h-6 text-xs px-2 text-muted-foreground",
              onClick: (e) => {
                e.stopPropagation();
                onStatusChange(transferCase.case_id, "needs_analyst");
              },
              children: [
                /* @__PURE__ */ jsx(UserX, { className: "h-3 w-3 mr-1" }),
                " Escalate"
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Send to analyst — excludes from totals until resolved" })
        ] }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          Badge,
          {
            variant: transferCase.status === "accepted" ? "default" : transferCase.status === "needs_analyst" ? "destructive" : "secondary",
            className: "text-[10px]",
            children: statusLabel(transferCase.status)
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            variant: "ghost",
            className: "h-5 text-[10px] px-1 text-muted-foreground",
            onClick: (e) => {
              e.stopPropagation();
              onStatusChange(transferCase.case_id, "suggested");
            },
            children: "Undo"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(AuditHistory, { entries: auditHistory })
    ] }),
    /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-0 px-4 pb-3", children: [
      selectedTxns.size > 0 && selectedTxns.size < txns.length && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 p-2 rounded bg-muted/50 border border-border", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          selectedTxns.size,
          " selected"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "h-6 text-xs px-2",
            onClick: handleSplit,
            children: [
              /* @__PURE__ */ jsx(Split, { className: "h-3 w-3 mr-1" }),
              " Split into new case"
            ]
          }
        )
      ] }),
      isLargeCase && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-6 text-xs px-2 mb-2 text-muted-foreground",
          onClick: () => setShowAll(!showAll),
          children: [
            /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3 mr-1" }),
            showAll ? `Show sample (${sampledTxnIds?.size ?? 8} of ${txns.length})` : `Expand all (${txns.length} transactions)`
          ]
        }
      ),
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "w-[32px]", children: /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: selectedTxns.size === visibleTxns.length && visibleTxns.length > 0,
              onCheckedChange: selectAll
            }
          ) }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]", children: "Date" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[90px] text-right", children: "Amount" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[130px]", children: "Category" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: visibleTxns.map((txn) => {
          const isException = exceptions.has(txn.id);
          return /* @__PURE__ */ jsxs(
            TableRow,
            {
              className: isException ? "bg-destructive/5" : void 0,
              children: [
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                  Checkbox,
                  {
                    checked: selectedTxns.has(txn.id),
                    onCheckedChange: () => toggleTxn(txn.id)
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-muted-foreground", children: txn.date || txn.id.split("_")[0] }),
                /* @__PURE__ */ jsxs(TableCell, { className: "text-xs max-w-[350px] truncate", children: [
                  txn.memo || txn.id,
                  isException && /* @__PURE__ */ jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "ml-1 text-[9px] text-destructive border-destructive",
                      children: "exception"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-right font-mono", children: formatAmount(txn.amount ?? 0) }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: txn.category,
                    onValueChange: (v) => onTxnCategoryChange(txn.id, v),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "interbank", children: "Interbank" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "owner", children: "Owner" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "operating", children: "Operating" })
                      ] })
                    ]
                  }
                ) })
              ]
            },
            txn.id
          );
        }) })
      ] })
    ] }) })
  ] }) });
}
function TransferReviewDialog({
  open,
  onOpenChange,
  rawData,
  cases: initialCases,
  onSave
}) {
  const [caseStatuses, setCaseStatuses] = useState({});
  const [txnOverrides, setTxnOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("internal");
  const [splitCases, setSplitCases] = useState([]);
  const [auditLog, setAuditLog] = useState({});
  useMemo(() => {
    if (open) {
      setCaseStatuses({});
      setTxnOverrides({});
      setSplitCases([]);
      setAuditLog({});
    }
  }, [open]);
  const addAudit = useCallback((caseId, action) => {
    setAuditLog((prev) => ({
      ...prev,
      [caseId]: [...prev[caseId] || [], { timestamp: Date.now(), action }]
    }));
  }, []);
  const exceptions = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const [txnId, newCat] of Object.entries(txnOverrides)) {
      const parentCase = [...initialCases, ...splitCases].find(
        (c) => c.transactions.some((t) => t.id === txnId)
      );
      if (!parentCase) continue;
      const parentStatus = caseStatuses[parentCase.case_id] || parentCase.status;
      if (parentStatus !== "accepted") continue;
      const origTxn = parentCase.transactions.find((t) => t.id === txnId);
      if (origTxn && origTxn.category !== newCat) {
        set.add(txnId);
      }
    }
    return set;
  }, [txnOverrides, caseStatuses, initialCases, splitCases]);
  const cases = useMemo(() => {
    const allCases = [...initialCases, ...splitCases];
    return allCases.map((c) => ({
      ...c,
      status: caseStatuses[c.case_id] || c.status,
      transactions: c.transactions.map((t) => ({
        ...t,
        category: txnOverrides[t.id] || t.category
      }))
    }));
  }, [initialCases, splitCases, caseStatuses, txnOverrides]);
  const hasV2Data = initialCases.some(
    (c) => c.case_type !== "excluded_operating" && c.evidence_summary.length > 0
  );
  const internalCases = cases.filter(
    (c) => c.case_type === "internal_transfer" || c.case_type === "external_transfer_like"
  );
  const ownerCases = cases.filter((c) => c.case_type === "owner_related");
  const ambiguousCases = cases.filter((c) => c.case_type === "ambiguous");
  const escalatedCases = cases.filter(
    (c) => (caseStatuses[c.case_id] || c.status) === "needs_analyst"
  );
  const changeCount = Object.keys(caseStatuses).length + Object.keys(txnOverrides).length + splitCases.length;
  const handleStatusChange = (caseId, status) => {
    const prevStatus = caseStatuses[caseId] || "suggested";
    setCaseStatuses((prev) => ({ ...prev, [caseId]: status }));
    const exCount = exceptions.size;
    const suffix = exCount > 0 ? ` with ${exCount} exception${exCount !== 1 ? "s" : ""}` : "";
    addAudit(caseId, `${prevStatus} → ${status}${suffix}`);
  };
  const handleAcceptAll = () => {
    const newStatuses = { ...caseStatuses };
    for (const c of cases) {
      const currentStatus = caseStatuses[c.case_id] || c.status;
      if (currentStatus === "suggested") {
        newStatuses[c.case_id] = "accepted";
        addAudit(c.case_id, "suggested → accepted (bulk)");
      }
    }
    setCaseStatuses(newStatuses);
  };
  const handleTxnCategoryChange = (txnId, newCategory) => {
    setTxnOverrides((prev) => ({ ...prev, [txnId]: newCategory }));
  };
  const suggestedCount = cases.filter((c) => (caseStatuses[c.case_id] || c.status) === "suggested").length;
  const handleSplitSelected = (caseId, selectedTxnIds) => {
    const sourceCase = cases.find((c) => c.case_id === caseId);
    if (!sourceCase) return;
    const selectedSet = new Set(selectedTxnIds);
    const splitTxns = sourceCase.transactions.filter((t) => selectedSet.has(t.id));
    const remainingTxns = sourceCase.transactions.filter((t) => !selectedSet.has(t.id));
    if (splitTxns.length === 0 || remainingTxns.length === 0) return;
    const newCaseId = `${caseId}_split_${Date.now()}`;
    const newCase = {
      ...sourceCase,
      case_id: newCaseId,
      status: "suggested",
      transactions: splitTxns,
      transaction_count: splitTxns.length,
      total_dollars: splitTxns.reduce((s, t) => s + (t.amount ?? 0), 0),
      reasoning_label: `Split from: ${sourceCase.reasoning_label}`,
      representative_txn_ids: splitTxns.slice(0, 5).map((t) => t.id),
      edge_case_txn_ids: splitTxns.slice(-3).map((t) => t.id)
    };
    setSplitCases((prev) => {
      const updatedOriginal = {
        ...sourceCase,
        transactions: remainingTxns,
        transaction_count: remainingTxns.length,
        total_dollars: remainingTxns.reduce((s, t) => s + (t.amount ?? 0), 0)
      };
      const withoutOld = prev.filter((c) => c.case_id !== caseId);
      return [...withoutOld, updatedOriginal, newCase];
    });
    addAudit(caseId, `Split ${splitTxns.length} txn(s) into new case`);
    addAudit(newCaseId, `Created from split of ${caseId}`);
  };
  const handleSave = async () => {
    if (!rawData) return;
    setIsSaving(true);
    try {
      const updated = {};
      for (const c of cases) {
        for (const t of c.transactions) {
          const effectiveCategory = txnOverrides[t.id] || t.category;
          const caseStatus = caseStatuses[c.case_id] || c.status;
          const finalCategory = caseStatus === "rejected" || caseStatus === "needs_analyst" ? "operating" : exceptions.has(t.id) ? effectiveCategory : effectiveCategory;
          const parts = t.id.split("_");
          const periodKey = parts.slice(0, -2).join("_") || "unknown";
          if (!updated[periodKey]) {
            updated[periodKey] = { interbank: 0, owner: 0, transactions: [] };
          }
          const p = updated[periodKey];
          p.transactions.push({ ...t, category: finalCategory });
          if (finalCategory === "interbank") p.interbank += t.amount ?? 0;
          else if (finalCategory === "owner") p.owner += t.amount ?? 0;
        }
      }
      const existingMeta = rawData?._meta ?? {};
      const mergedStatuses = { ...existingMeta.caseStatuses ?? {} };
      for (const c of cases) {
        const status = caseStatuses[c.case_id] || c.status;
        if (status !== "suggested") {
          mergedStatuses[c.case_id] = status;
        } else {
          delete mergedStatuses[c.case_id];
        }
      }
      updated._meta = { ...existingMeta, caseStatuses: mergedStatuses };
      for (const [key, val] of Object.entries(rawData)) {
        if (key.startsWith("_") && key !== "_meta") {
          updated[key] = val;
        }
      }
      await onSave(updated);
      onOpenChange(false);
      const { toast } = await import("../main.mjs").then((n) => n.w);
      toast({ title: "Classifications saved", description: `${changeCount} change${changeCount !== 1 ? "s" : ""} applied successfully.` });
    } catch (err) {
      console.error("Failed to save classifications:", err);
      const { toast } = await import("../main.mjs").then((n) => n.w);
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not save classifications.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  if (!hasV2Data && initialCases.length === 0) {
    return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsx(DialogContent, { className: "max-w-lg", children: /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Review Transfer Classifications" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "No classified transactions to review. Run classification first." })
    ] }) }) });
  }
  const renderCaseList = (list, emptyMsg) => list.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: emptyMsg }) : list.map((c) => /* @__PURE__ */ jsx(
    CaseCard,
    {
      transferCase: c,
      onStatusChange: handleStatusChange,
      onTxnCategoryChange: handleTxnCategoryChange,
      onSplitSelected: handleSplitSelected,
      auditHistory: auditLog[c.case_id] || [],
      exceptions
    },
    c.case_id
  ));
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Review Transfer Classifications" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Review AI-classified transfer groups. Accept or reject each case — only accepted classifications flow into Proof of Cash totals." })
    ] }),
    /* @__PURE__ */ jsxs(
      Tabs,
      {
        value: activeTab,
        onValueChange: setActiveTab,
        className: "flex-1 min-h-0 flex flex-col",
        children: [
          /* @__PURE__ */ jsxs(TabsList, { className: "w-full justify-start", children: [
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "internal", children: [
              "Internal (",
              internalCases.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "owner", children: [
              "Owner (",
              ownerCases.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "ambiguous", children: [
              "Needs Review (",
              ambiguousCases.length,
              ")"
            ] }),
            escalatedCases.length > 0 && /* @__PURE__ */ jsxs(TabsTrigger, { value: "escalated", children: [
              "Escalated (",
              escalatedCases.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            TabsContent,
            {
              value: "internal",
              className: "flex-1 min-h-0 overflow-auto mt-2",
              children: renderCaseList(internalCases, "No internal transfer cases detected.")
            }
          ),
          /* @__PURE__ */ jsx(
            TabsContent,
            {
              value: "owner",
              className: "flex-1 min-h-0 overflow-auto mt-2",
              children: renderCaseList(ownerCases, "No owner-related cases detected.")
            }
          ),
          /* @__PURE__ */ jsx(
            TabsContent,
            {
              value: "ambiguous",
              className: "flex-1 min-h-0 overflow-auto mt-2",
              children: renderCaseList(ambiguousCases, "No ambiguous cases to review.")
            }
          ),
          escalatedCases.length > 0 && /* @__PURE__ */ jsx(
            TabsContent,
            {
              value: "escalated",
              className: "flex-1 min-h-0 overflow-auto mt-2",
              children: renderCaseList(escalatedCases, "No escalated cases.")
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: changeCount > 0 ? `${changeCount} change${changeCount > 1 ? "s" : ""} pending` : "No changes" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        suggestedCount > 0 && /* @__PURE__ */ jsxs(Button, { variant: "secondary", size: "sm", onClick: handleAcceptAll, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }),
          "Accept All (",
          suggestedCount,
          ")"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleSave,
            disabled: isSaving || changeCount === 0,
            children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Spinner, { className: "mr-2 h-3 w-3" }),
              "Saving…"
            ] }) : "Save Changes"
          }
        )
      ] })
    ] })
  ] }) });
}
export {
  TransferReviewDialog as T,
  useTransferClassification as a,
  useProofOfCashData as u
};
