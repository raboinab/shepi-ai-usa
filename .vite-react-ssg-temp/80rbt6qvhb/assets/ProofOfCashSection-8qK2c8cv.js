import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { s as supabase, C as Card, b as CardHeader, d as CardTitle, f as CardContent, B as Button } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { Sparkles, AlertTriangle, ChevronRight, CheckCircle, AlertCircle, Loader2, RefreshCw, ShieldCheck, Wallet, Building2, CreditCard, ArrowDownToLine, ExternalLink, Plus, Trash2 } from "lucide-react";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { useState, useMemo, useEffect } from "react";
import { ai as sumByLineItemWithReclass, K as sumReclassImpact, F as calcRevenue, aj as calcCOGS, ak as calcOpEx, al as calcPayroll, am as calcOtherExpense, H as calcNetIncome, an as calcDepreciationExpense, ao as matchesCategory, ap as resolveLabel } from "./sanitizeWizardData-nrsUY-BP.js";
import { u as useProofOfCashData, a as useTransferClassification, T as TransferReviewDialog } from "./TransferReviewDialog-B-GWAqVw.js";
import { useQuery } from "@tanstack/react-query";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle } from "./dialog-sNpTUd89.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-tabs";
import "@radix-ui/react-select";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./popover-C93YiWo6.js";
import "@radix-ui/react-popover";
import "@radix-ui/react-dialog";
const formatCurrency$1 = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
function WaterfallDrilldownDialog({
  open,
  onOpenChange,
  transactionIds,
  embeddedTransactions,
  projectId,
  title
}) {
  const shouldQueryDb = !embeddedTransactions?.length && (transactionIds?.length ?? 0) > 0;
  const { data: dbTransactions, isLoading } = useQuery({
    queryKey: ["waterfall-drilldown", projectId, transactionIds],
    queryFn: async () => {
      if (!transactionIds || transactionIds.length === 0) return [];
      const { data, error } = await supabase.from("canonical_transactions").select("id, txn_date, description, memo, amount_signed, account_name").eq("project_id", projectId).in("id", transactionIds).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && shouldQueryDb
  });
  const rows = embeddedTransactions?.length ? embeddedTransactions : dbTransactions ?? [];
  const hasRows = rows.length > 0;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: title }) }),
    isLoading && shouldQueryDb ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(Spinner, { className: "h-6 w-6" }) }) : !hasRows ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-4", children: "No transactions found." }) : embeddedTransactions?.length ? /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Date" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Amount" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Category" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: embeddedTransactions.map((txn) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "whitespace-nowrap text-sm", children: txn.date ?? "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm max-w-[240px] truncate", children: txn.memo || "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm font-mono", children: txn.amount != null ? formatCurrency$1(Math.abs(txn.amount)) : "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground truncate max-w-[140px]", children: txn.category || "—" })
      ] }, txn.id)) })
    ] }) : /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Date" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Amount" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Account" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: (dbTransactions ?? []).map((txn) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "whitespace-nowrap text-sm", children: txn.txn_date ?? "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm max-w-[240px] truncate", children: txn.description || txn.memo || "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right text-sm font-mono", children: txn.amount_signed != null ? formatCurrency$1(Number(txn.amount_signed)) : "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground truncate max-w-[140px]", children: txn.account_name || "—" })
      ] }, txn.id)) })
    ] })
  ] }) });
}
const formatCurrency = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const confidenceIcon = (c) => {
  if (c >= 0.8) return /* @__PURE__ */ jsx(CheckCircle, { className: "w-3.5 h-3.5 text-green-600" });
  if (c >= 0.6) return /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 text-yellow-600" });
  return /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5 text-destructive" });
};
const confidenceLabel = (c) => {
  if (c >= 0.8) return "High";
  if (c >= 0.6) return "Medium";
  return "Low";
};
function findEmbeddedTransactions(rawData, ids) {
  if (!rawData || ids.length === 0) return [];
  const idSet = new Set(ids);
  const results = [];
  for (const [key, period] of Object.entries(rawData)) {
    if (key.startsWith("_")) continue;
    if (!period || typeof period !== "object") continue;
    for (const txn of period.transactions ?? []) {
      if (idSet.has(txn.id)) {
        results.push({
          id: txn.id,
          date: txn.date,
          memo: txn.memo,
          amount: txn.amount,
          category: txn.category
        });
      }
    }
  }
  return results;
}
function DeltaWaterfallCard({ delta, projectId, selectedPeriod, classificationRawData, hasPendingCases }) {
  const [drilldown, setDrilldown] = useState(null);
  const isDegraded = delta.delta_source === "bank_internal";
  const availablePeriods = useMemo(
    () => Object.keys(delta.periods).sort(),
    [delta.periods]
  );
  const effectivePeriod = useMemo(() => {
    if (selectedPeriod && delta.periods[selectedPeriod]) return selectedPeriod;
    return availablePeriods[availablePeriods.length - 1] ?? null;
  }, [selectedPeriod, delta.periods, availablePeriods]);
  const [overridePeriod, setOverridePeriod] = useState(null);
  const activePeriod = overridePeriod && delta.periods[overridePeriod] ? overridePeriod : effectivePeriod;
  const periodData = activePeriod ? delta.periods[activePeriod] : null;
  const steps = periodData?.waterfall_steps ?? [];
  const unexplained = periodData?.unexplained_remainder ?? 0;
  const startingDelta = periodData?.starting_delta ?? 0;
  const periodExplained = steps.reduce((s, st) => s + st.amount, 0);
  const maxAmount = Math.max(Math.abs(startingDelta), ...steps.map((s) => Math.abs(s.amount)), Math.abs(unexplained), 1);
  const leakagePeriodCount = delta.cash_leakage_periods.length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { className: "border-dashed", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
          isDegraded ? "Bank Internal Analysis" : `Non-Operating Flows: ${formatCurrency(Math.abs(startingDelta))}`
        ] }),
        availablePeriods.length > 0 && /* @__PURE__ */ jsxs(Select, { value: activePeriod ?? "", onValueChange: setOverridePeriod, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px] h-8 text-xs", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Period" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: availablePeriods.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p, className: "text-xs", children: p }, p)) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        isDegraded && /* @__PURE__ */ jsxs(Alert, { className: "border-yellow-500/30 bg-yellow-500/5", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-600" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-sm", children: "No GL data available — showing bank-only breakdown. Upload a trial balance for full reconciliation." })
        ] }),
        activePeriod && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-muted-foreground", children: activePeriod }),
          /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
            "Explained: ",
            formatCurrency(Math.abs(periodExplained))
          ] }),
          Math.abs(unexplained) > 0.01 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
            "Unexplained: ",
            formatCurrency(Math.abs(unexplained))
          ] })
        ] }),
        leakagePeriodCount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 text-destructive" }),
          leakagePeriodCount,
          " period",
          leakagePeriodCount > 1 ? "s" : "",
          " with potential cash leakage across all periods"
        ] }),
        steps.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          steps.map((step, i) => /* @__PURE__ */ jsx(
            WaterfallStepRow,
            {
              step,
              maxAmount,
              isPending: hasPendingCases,
              onDrilldown: () => {
                if (step.transaction_ids.length === 0) return;
                const txns = findEmbeddedTransactions(classificationRawData, step.transaction_ids);
                setDrilldown({ txns, title: `${step.label} — ${activePeriod}` });
              }
            },
            i
          )),
          Math.abs(unexplained) > 0.01 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1.5 px-2 rounded bg-destructive/10 border border-destructive/20", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-destructive shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-destructive flex-1", children: [
              "Unexplained: ",
              formatCurrency(Math.abs(unexplained))
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-destructive/70", children: "Investigate" })
          ] })
        ] }) : !activePeriod ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Select a period to see the waterfall breakdown." }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No classification data for this period." })
      ] })
    ] }),
    drilldown && /* @__PURE__ */ jsx(
      WaterfallDrilldownDialog,
      {
        open: !!drilldown,
        onOpenChange: (open) => !open && setDrilldown(null),
        embeddedTransactions: drilldown.txns,
        projectId,
        title: drilldown.title
      }
    )
  ] });
}
function WaterfallStepRow({
  step,
  maxAmount,
  isPending,
  onDrilldown
}) {
  const barWidth = Math.max(Math.abs(step.amount) / maxAmount * 100, 2);
  const hasTransactions = step.transaction_ids.length > 0;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: onDrilldown,
      disabled: !hasTransactions,
      className: `flex items-center gap-2 w-full py-1.5 px-2 rounded hover:bg-muted/50 transition-colors text-left group disabled:cursor-default ${isPending ? "opacity-50 border border-dashed border-muted-foreground/30" : ""}`,
      children: [
        confidenceIcon(step.confidence),
        /* @__PURE__ */ jsx("span", { className: "text-sm flex-1 min-w-0 truncate", children: step.label }),
        /* @__PURE__ */ jsx("div", { className: "w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full bg-primary/60 rounded-full transition-all",
            style: { width: `${barWidth}%` }
          }
        ) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-mono w-20 text-right shrink-0", children: formatCurrency(Math.abs(step.amount)) }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] shrink-0", children: [
          confidenceLabel(step.confidence),
          " · ",
          step.transaction_count
        ] }),
        hasTransactions && /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" })
      ]
    }
  );
}
const defaultBankAccount = {
  id: "",
  name: "",
  accountNumber: "",
  type: "checking",
  institution: "",
  dataSource: "manual"
};
const createEmptyMonthlyData = (periodId, accountId) => ({
  periodId,
  accountId,
  beginningBalance: 0,
  depositsPerBank: 0,
  withdrawalsPerBank: 0,
  endingBankBalance: 0,
  beginningBookBalance: 0,
  receiptsPerBooks: 0,
  disbursementsPerBooks: 0,
  endingBookBalance: 0,
  depositsInTransit: 0,
  outstandingChecks: 0,
  bankErrors: 0,
  bookErrors: 0,
  interbankTransfers: 0,
  ownerDistributions: 0,
  otherAdjustments: 0,
  bankDataSource: "manual",
  bookDataSource: "manual"
});
const ProofOfCashSection = ({
  data,
  updateData,
  periods = [],
  projectId,
  cashAnalysis,
  dealData,
  isDemo
}) => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { bankStatements } = useProofOfCashData(projectId);
  const {
    classifications,
    approvedClassifications,
    deltaReconciliation,
    cashToAccrual,
    rawData: classificationRawData,
    isLoading: isLoadingClassifications,
    classify,
    isClassifying,
    classifyProgress,
    updateClassifications,
    cases: transferCases,
    pendingCaseCount
  } = useTransferClassification(projectId);
  const hasClassifications = !!classifications && classifications.size > 0;
  const priorBalances = dealData?.deal?.priorBalances ?? {};
  useEffect(() => {
    if (bankStatements.length === 0 || periods.length === 0) return;
    if (data?.bankAccounts?.some((a) => a.dataSource === "statement")) return;
    let newAccounts = [...data?.bankAccounts || []];
    let newMonthlyData = [...data?.monthlyData || []];
    let accountsCreated = 0;
    for (const stmt of bankStatements) {
      let account = newAccounts.find(
        (acc) => stmt.accountNumber && acc.accountNumber === stmt.accountNumber || stmt.bankName && acc.institution === stmt.bankName && acc.name.includes(stmt.bankName)
      );
      if (!account) {
        account = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: stmt.bankName ? `${stmt.bankName}${stmt.accountNumber ? ` ****${stmt.accountNumber.slice(-4)}` : ""}` : `Bank Account ${newAccounts.length + 1}`,
          accountNumber: stmt.accountNumber || "",
          type: "checking",
          institution: stmt.bankName || "",
          dataSource: "statement"
        };
        newAccounts.push(account);
        accountsCreated++;
      }
      const matchingPeriod = periods.find((p) => {
        if (!stmt.periodStart || !stmt.periodEnd) return false;
        const pAny = p;
        const parseLocal = (s) => {
          const [y, m, d] = s.split("-").map(Number);
          return new Date(y, m - 1, d);
        };
        const pStart = p.startDate ? parseLocal(p.startDate) : pAny.year && pAny.month ? new Date(pAny.year, pAny.month - 1, 1) : null;
        const pEnd = p.endDate ? parseLocal(p.endDate) : pAny.year && pAny.month ? new Date(pAny.year, pAny.month, 0) : null;
        if (!pStart || !pEnd) return false;
        const sStart = parseLocal(stmt.periodStart);
        const sEnd = parseLocal(stmt.periodEnd);
        return sStart <= pEnd && sEnd >= pStart;
      });
      if (matchingPeriod && account) {
        const existingIndex = newMonthlyData.findIndex(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account.id
        );
        const bankData = {
          periodId: matchingPeriod.id,
          accountId: account.id,
          beginningBalance: stmt.summary.openingBalance || 0,
          depositsPerBank: stmt.summary.totalCredits || 0,
          withdrawalsPerBank: stmt.summary.totalDebits || 0,
          endingBankBalance: stmt.summary.closingBalance || 0,
          bankDataSource: "statement"
        };
        if (existingIndex >= 0) {
          newMonthlyData[existingIndex] = { ...newMonthlyData[existingIndex], ...bankData };
        } else {
          newMonthlyData.push({ ...createEmptyMonthlyData(matchingPeriod.id, account.id), ...bankData });
        }
      }
    }
    if (accountsCreated > 0 || newMonthlyData.length !== (data?.monthlyData || []).length) {
      updateData({ ...data, bankAccounts: newAccounts, monthlyData: newMonthlyData });
    }
  }, [bankStatements, periods]);
  const hasPendingClassifications = useMemo(() => {
    if (!classifications || classifications.size === 0 || periods.length === 0) return false;
    const currentMonthly = data?.monthlyData || [];
    for (const [periodKey, totals] of classifications) {
      const matchingPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        if (derived === periodKey) return true;
        if (p.label && p.label.includes(periodKey)) return true;
        return false;
      });
      if (!matchingPeriod) continue;
      for (const account of data?.bankAccounts || []) {
        const entry = currentMonthly.find(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account.id
        );
        if (entry && (entry.interbankTransfers !== totals.interbank || entry.ownerDistributions !== totals.owner)) {
          return true;
        }
      }
    }
    return false;
  }, [classifications, data?.monthlyData, data?.bankAccounts, periods]);
  const applyClassifications = () => {
    if (!classifications || classifications.size === 0) return;
    const newMonthlyData = [...data?.monthlyData || []];
    let applied = 0;
    for (const [periodKey, totals] of classifications) {
      const matchingPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        if (derived === periodKey) return true;
        if (p.label && p.label.includes(periodKey)) return true;
        return false;
      });
      if (!matchingPeriod) continue;
      for (const account of data?.bankAccounts || []) {
        const idx = newMonthlyData.findIndex(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account.id
        );
        if (idx >= 0) {
          newMonthlyData[idx] = {
            ...newMonthlyData[idx],
            interbankTransfers: totals.interbank,
            ownerDistributions: totals.owner
          };
          applied++;
        }
      }
    }
    if (applied > 0) {
      updateData({ ...data, monthlyData: newMonthlyData });
      toast.success("Classifications applied", {
        description: `Updated interbank transfers and owner distributions for ${applied} period(s).`
      });
    }
  };
  const bankAccounts = data?.bankAccounts || [];
  const bankByPeriod = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    const seen = /* @__PURE__ */ new Set();
    const valueSeen = /* @__PURE__ */ new Set();
    for (const stmt of bankStatements) {
      if (!stmt.periodStart) continue;
      const key = stmt.periodStart.substring(0, 7);
      const acct = stmt.accountNumber ?? stmt.bankName ?? "unknown";
      const dedupeKey = `${key}::${acct}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const opening = stmt.summary.openingBalance ?? 0;
      const closing = stmt.summary.closingBalance ?? 0;
      const credits = stmt.summary.totalCredits ?? 0;
      const debits = stmt.summary.totalDebits ?? 0;
      const valueKey = `${key}::${opening}::${closing}::${credits}::${debits}`;
      if (valueSeen.has(valueKey)) continue;
      valueSeen.add(valueKey);
      const matchedPeriod = periods.find((p) => {
        if (p.id === key) return true;
        if (p.startDate && p.startDate.substring(0, 7) === key) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        return derived === key;
      });
      const periodKey = matchedPeriod?.id ?? key;
      const existing = map.get(periodKey);
      if (existing) {
        existing.openingBalance += opening;
        existing.closingBalance += closing;
        existing.totalCredits += credits;
        existing.totalDebits += debits;
      } else {
        map.set(periodKey, {
          openingBalance: opening,
          closingBalance: closing,
          totalCredits: credits,
          totalDebits: debits
        });
      }
    }
    return map;
  }, [bankStatements, periods]);
  const classificationByPeriod = useMemo(() => {
    const source = approvedClassifications;
    if (!source || source.size === 0) return /* @__PURE__ */ new Map();
    const map = /* @__PURE__ */ new Map();
    for (const [periodKey, totals] of source) {
      const matchedPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        return derived === periodKey;
      });
      map.set(matchedPeriod?.id ?? periodKey, totals);
    }
    return map;
  }, [approvedClassifications, periods]);
  const pendingClassificationByPeriod = useMemo(() => {
    if (!classifications || classifications.size === 0) return /* @__PURE__ */ new Map();
    const map = /* @__PURE__ */ new Map();
    for (const [periodKey, rawTotals] of classifications) {
      const matchedPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        return derived === periodKey;
      });
      const key = matchedPeriod?.id ?? periodKey;
      const approved = classificationByPeriod.get(key);
      const pendingInterbank = (rawTotals.interbank ?? 0) - (approved?.interbank ?? 0);
      const pendingOwner = (rawTotals.owner ?? 0) - (approved?.owner ?? 0);
      if (pendingInterbank !== 0 || pendingOwner !== 0) {
        map.set(key, { interbank: pendingInterbank, owner: pendingOwner });
      }
    }
    return map;
  }, [classifications, classificationByPeriod, periods]);
  const c2aByPeriod = useMemo(() => {
    if (!cashToAccrual) return /* @__PURE__ */ new Map();
    const map = /* @__PURE__ */ new Map();
    for (const [key, val] of Object.entries(cashToAccrual.periods)) {
      const matchedPeriod = periods.find((p) => {
        if (p.id === key) return true;
        if (p.startDate && p.startDate.substring(0, 7) === key) return true;
        const derived = `${p.year}-${String(p.month).padStart(2, "0")}`;
        return derived === key;
      });
      map.set(matchedPeriod?.id ?? key, val);
    }
    return map;
  }, [cashToAccrual, periods]);
  const pocSummary = useMemo(() => {
    const tb = dealData?.trialBalance;
    const reclass = dealData?.reclassifications ?? [];
    const sumPriorByLineItem = (lineItem) => {
      if (!tb || Object.keys(priorBalances).length === 0) return 0;
      return tb.filter((e) => e.fsType === "BS" && (matchesCategory(e.fsLineItem, lineItem) || resolveLabel(e.fsLineItem) === lineItem)).reduce((s, e) => s + (priorBalances[e.accountId] ?? 0), 0);
    };
    const monthRows = periods.map((period, idx) => {
      const prevPeriodId = idx > 0 ? periods[idx - 1].id : null;
      const glEnding = tb ? sumByLineItemWithReclass(tb, reclass, "Cash and cash equivalents", period.id) : 0;
      const glBeginning = prevPeriodId && tb ? sumByLineItemWithReclass(tb, reclass, "Cash and cash equivalents", prevPeriodId) : idx === 0 ? sumPriorByLineItem("Cash and cash equivalents") : 0;
      const glChange = glEnding - glBeginning;
      const bank = bankByPeriod.get(period.id);
      const bankOpening = bank?.openingBalance ?? 0;
      const bankClosing = bank?.closingBalance ?? 0;
      const bankChange = bankClosing - bankOpening;
      const totalCredits = bank?.totalCredits ?? 0;
      const totalDebits = bank?.totalDebits ?? 0;
      const cls = classificationByPeriod.get(period.id);
      const interbank = cls?.interbank ?? 0;
      const owner = cls?.owner ?? 0;
      const totalTransfers = interbank + owner;
      const opReceipts = totalCredits - totalTransfers;
      const revenueReclass = sumReclassImpact(reclass, "Revenue", period.id);
      const revenue = tb ? -(calcRevenue(tb, period.id) + revenueReclass) : 0;
      const expenseReclass = sumReclassImpact(reclass, "Cost of Goods Sold", period.id) + sumReclassImpact(reclass, "Operating expenses", period.id) + sumReclassImpact(reclass, "Payroll & Related", period.id);
      const expenses = tb ? calcCOGS(tb, period.id) + calcOpEx(tb, period.id) + calcPayroll(tb, period.id) + calcOtherExpense(tb, period.id) + expenseReclass : 0;
      const netIncome = tb ? -calcNetIncome(tb, period.id) : 0;
      const variance = glEnding - bankClosing;
      const c2a = c2aByPeriod.get(period.id);
      const opDisbursements = c2a?.op_cash_disbursements ?? totalDebits - owner;
      const receiptsVariance = c2a?.receipts_variance ?? revenue - opReceipts;
      const arChange = c2a?.ar_change ?? (tb ? sumByLineItemWithReclass(tb, reclass, "Accounts receivable", period.id) - (prevPeriodId ? sumByLineItemWithReclass(tb, reclass, "Accounts receivable", prevPeriodId) : sumPriorByLineItem("Accounts receivable")) : 0);
      const receiptsResidual = c2a?.receipts_residual ?? receiptsVariance - arChange;
      const receiptsReconciled = c2a?.receipts_reconciled ?? Math.abs(receiptsResidual) < 500;
      const disbVariance = c2a?.disbursements_variance ?? expenses - opDisbursements;
      const apChange = c2a?.ap_change ?? (tb ? sumByLineItemWithReclass(tb, reclass, "Current liabilities", period.id) + sumByLineItemWithReclass(tb, reclass, "Other current liabilities", period.id) - (prevPeriodId ? sumByLineItemWithReclass(tb, reclass, "Current liabilities", prevPeriodId) + sumByLineItemWithReclass(tb, reclass, "Other current liabilities", prevPeriodId) : sumPriorByLineItem("Current liabilities") + sumPriorByLineItem("Other current liabilities")) : 0);
      const depAmort = c2a?.dep_amort ?? (tb ? calcDepreciationExpense(tb, period.id, dealData?.addbacks?.depreciation) : 0);
      const disbResidual = c2a?.disbursements_residual ?? disbVariance - apChange - depAmort;
      const disbReconciled = c2a?.disbursements_reconciled ?? Math.abs(disbResidual) < 500;
      return {
        periodId: period.id,
        periodLabel: period.label,
        glBeginning,
        glEnding,
        glChange,
        bankOpening,
        bankClosing,
        bankChange,
        totalCredits,
        totalDebits,
        interbank,
        owner,
        totalTransfers,
        opReceipts,
        revenue,
        expenses,
        netIncome,
        variance,
        opDisbursements,
        receiptsVariance,
        arChange,
        receiptsResidual,
        receiptsReconciled,
        disbVariance,
        apChange,
        depAmort,
        disbResidual,
        disbReconciled
      };
    });
    const byId = new Map(monthRows.map((r) => [r.periodId, r]));
    const aggregatePeriods = dealData?.deal?.aggregatePeriods ?? [];
    const aggRows = aggregatePeriods.map((ap) => {
      const monthIds = ap.monthPeriodIds;
      const firstMonth = byId.get(monthIds[0]);
      const lastMonth = byId.get(monthIds[monthIds.length - 1]);
      const sumField = (field) => monthIds.reduce((s, id) => s + (byId.get(id)?.[field] ?? 0), 0);
      const glBeginning = firstMonth?.glBeginning ?? 0;
      const glEnding = lastMonth?.glEnding ?? 0;
      const glChange = glEnding - glBeginning;
      const bankOpening = firstMonth?.bankOpening ?? 0;
      const bankClosing = lastMonth?.bankClosing ?? 0;
      const bankChange = bankClosing - bankOpening;
      const totalCredits = sumField("totalCredits");
      const totalDebits = sumField("totalDebits");
      const interbank = sumField("interbank");
      const owner = sumField("owner");
      const totalTransfers = interbank + owner;
      const opReceipts = totalCredits - totalTransfers;
      const revenue = sumField("revenue");
      const expenses = sumField("expenses");
      const netIncome = sumField("netIncome");
      const variance = glEnding - bankClosing;
      const opDisbursements = sumField("opDisbursements");
      const receiptsVariance = sumField("receiptsVariance");
      const arChange = sumField("arChange");
      const receiptsResidual = sumField("receiptsResidual");
      const receiptsReconciled = Math.abs(receiptsResidual) < 500;
      const disbVariance = sumField("disbVariance");
      const apChange = sumField("apChange");
      const depAmort = sumField("depAmort");
      const disbResidual = sumField("disbResidual");
      const disbReconciled = Math.abs(disbResidual) < 500;
      return {
        periodId: ap.id,
        periodLabel: ap.label,
        glBeginning,
        glEnding,
        glChange,
        bankOpening,
        bankClosing,
        bankChange,
        totalCredits,
        totalDebits,
        interbank,
        owner,
        totalTransfers,
        opReceipts,
        revenue,
        expenses,
        netIncome,
        variance,
        opDisbursements,
        receiptsVariance,
        arChange,
        receiptsResidual,
        receiptsReconciled,
        disbVariance,
        apChange,
        depAmort,
        disbResidual,
        disbReconciled
      };
    });
    return [...monthRows, ...aggRows];
  }, [periods, dealData, bankByPeriod, classificationByPeriod, c2aByPeriod, priorBalances]);
  const latestSummary = pocSummary[pocSummary.length - 1];
  const isReconciled = latestSummary ? Math.abs(latestSummary.variance) < 0.01 : true;
  const addBankAccount = () => {
    const newAccount = {
      ...defaultBankAccount,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Account ${bankAccounts.length + 1}`
    };
    updateData({
      ...data,
      bankAccounts: [...bankAccounts, newAccount]
    });
  };
  const updateBankAccount = (accountId, updates) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.map(
        (acc) => acc.id === accountId ? { ...acc, ...updates } : acc
      )
    });
  };
  const removeBankAccount = (accountId) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.filter((acc) => acc.id !== accountId),
      monthlyData: (data?.monthlyData || []).filter((d) => d.accountId !== accountId)
    });
  };
  const formatCurrency2 = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  const hasBankData = bankStatements.length > 0 || bankAccounts.some((a) => a.dataSource === "statement");
  const classifyComplete = hasClassifications || !!deltaReconciliation;
  const allCasesReviewed = classifyComplete && pendingCaseCount === 0;
  const receiptsOk = pocSummary.length > 0 && pocSummary.every((p) => p.receiptsReconciled);
  const disbOk = pocSummary.length > 0 && pocSummary.every((p) => p.disbReconciled);
  const fullyReconciled = receiptsOk && disbOk;
  const steps = [
    { label: "Bank Data", complete: hasBankData, detail: hasBankData ? `${bankStatements.length} statement${bankStatements.length !== 1 ? "s" : ""}` : "Upload bank statements" },
    { label: "Classify", complete: classifyComplete, detail: classifyComplete ? "Complete" : "Not started" },
    { label: "Review", complete: allCasesReviewed, detail: classifyComplete ? allCasesReviewed ? "All approved" : `${pendingCaseCount} pending` : "—" },
    { label: "Reconcile", complete: fullyReconciled, detail: fullyReconciled ? "Tied out" : hasBankData ? "Gaps remain" : "—" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Proof of Cash" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Bank statement reconciliation by period" })
      ] }),
      /* @__PURE__ */ jsxs(Badge, { variant: isReconciled ? "default" : "destructive", className: "gap-1", children: [
        isReconciled ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        isReconciled ? "Reconciled" : `Variance: ${formatCurrency2(Math.abs(latestSummary?.variance ?? 0))}`
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-2", children: steps.map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${step.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`, children: step.complete ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }) : i + 1 }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: step.label }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: step.detail })
        ] }),
        i < steps.length - 1 && /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-border mx-2 hidden sm:block" })
      ] }, step.label)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border", children: [
        !classifyComplete && hasBankData && !isDemo && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: async () => {
              try {
                await classify();
                toast.success("Transfers classified");
              } catch {
                toast.error("Classification failed");
              }
            },
            disabled: isClassifying || isLoadingClassifications,
            className: "gap-2",
            children: [
              isClassifying ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
              isClassifying ? classifyProgress ? `Classifying… ${classifyProgress.processed.toLocaleString()} / ${classifyProgress.total.toLocaleString()}` : "Classifying…" : "Classify Transfers"
            ]
          }
        ),
        classifyComplete && !isDemo && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: async () => {
                try {
                  await classify();
                  toast.success("Transfers re-classified");
                } catch {
                  toast.error("Classification failed");
                }
              },
              disabled: isClassifying,
              className: "gap-2 text-xs",
              children: [
                isClassifying ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
                "Re-run"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setShowReviewDialog(true),
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
                "Review & Approve",
                pendingCaseCount > 0 && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 h-4 min-w-[18px] text-[10px] px-1", children: pendingCaseCount })
              ]
            }
          )
        ] }),
        isDemo && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
            "Demo: Classified"
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowReviewDialog(true), children: "Review Classifications" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Operating Cash Receipts",
          value: latestSummary?.opReceipts ?? 0,
          subtitle: "Bank deposits minus transfers",
          icon: Wallet
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Revenue per IS",
          value: latestSummary?.revenue ?? 0,
          subtitle: "Accrual basis",
          icon: Building2
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Cash-to-Accrual Gap",
          value: Math.abs((latestSummary?.revenue ?? 0) - (latestSummary?.opReceipts ?? 0)),
          subtitle: cashToAccrual?.summary?.overall_reconciled ? "Reconciled" : latestSummary?.receiptsReconciled ? "Receipts reconciled" : "Explained by AR/AP changes",
          icon: cashToAccrual?.summary?.overall_reconciled || latestSummary?.receiptsReconciled ? CheckCircle : AlertCircle
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Non-Operating Flows",
          value: latestSummary?.totalTransfers ?? 0,
          subtitle: "Owner, debt, tax, interbank",
          icon: CreditCard
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "accounts", children: "Bank Accounts" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "summary", disabled: bankAccounts.length === 0, children: "Reconciliation Summary" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "accounts", className: "space-y-4", children: [
        (bankStatements.length > 0 || isDemo) && (deltaReconciliation && projectId ? /* @__PURE__ */ jsx(
          DeltaWaterfallCard,
          {
            delta: deltaReconciliation,
            projectId,
            classificationRawData: classificationRawData ?? void 0,
            hasPendingCases: pendingCaseCount > 0
          }
        ) : /* @__PURE__ */ jsxs(Card, { className: "border-dashed", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
            "AI Transfer Classification"
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "AI can analyze your bank transactions to separate interbank transfers and owner distributions from operating activity." }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-3", children: isDemo ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
                "Classified"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "8,921 txns analyzed · 7,218 operating · 847 interbank · 412 owner distributions" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setShowReviewDialog(true),
                  className: "gap-2",
                  children: "Review Classifications"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => toast.info("Preview mode", { description: "Sign up to re-run classification on a real project." }),
                  className: "gap-2 text-xs",
                  children: "Re-run"
                }
              )
            ] }) : !hasClassifications ? /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: async () => {
                  try {
                    await classify();
                    toast.success("Transfers classified", {
                      description: "Review the results and apply them to the Proof of Cash."
                    });
                  } catch {
                    toast.error("Classification failed", {
                      description: "Please try again or classify manually."
                    });
                  }
                },
                disabled: isClassifying || isLoadingClassifications,
                className: "gap-2",
                children: [
                  isClassifying ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
                  isClassifying ? classifyProgress ? `Classifying… ${classifyProgress.processed.toLocaleString()} / ${classifyProgress.total.toLocaleString()}` : "Classifying…" : "Classify Transfers"
                ]
              }
            ) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
                "Classified"
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setShowReviewDialog(true),
                  className: "gap-2",
                  children: "Review Classifications"
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: async () => {
                    try {
                      await classify();
                      toast.success("Transfers re-classified");
                    } catch {
                      toast.error("Classification failed");
                    }
                  },
                  disabled: isClassifying,
                  className: "gap-2 text-xs",
                  children: [
                    isClassifying ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : null,
                    "Re-run"
                  ]
                }
              )
            ] }) }),
            hasClassifications && pendingCaseCount > 0 && /* @__PURE__ */ jsx(Alert, { className: "border-amber-500/30 bg-amber-500/5", children: /* @__PURE__ */ jsxs(AlertDescription, { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  pendingCaseCount,
                  " transfer case",
                  pendingCaseCount !== 1 ? "s" : "",
                  " pending review"
                ] }),
                " — reconciliation uses AI-suggested amounts. Review to confirm accuracy."
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setShowReviewDialog(true),
                  className: "gap-1 shrink-0",
                  children: "Review & Approve"
                }
              )
            ] }) }),
            hasClassifications && pendingCaseCount === 0 && hasPendingClassifications && /* @__PURE__ */ jsx(Alert, { className: "border-primary/30 bg-primary/5", children: /* @__PURE__ */ jsxs(AlertDescription, { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: "AI classifications are ready. Review and apply them to update interbank transfers and owner distributions." }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => setShowReviewDialog(true),
                    className: "gap-1",
                    children: "Review"
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    size: "sm",
                    onClick: applyClassifications,
                    className: "gap-1",
                    children: [
                      /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-3 h-3" }),
                      "Apply to Proof of Cash"
                    ]
                  }
                )
              ] })
            ] }) }),
            hasClassifications && !hasPendingClassifications && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 text-green-600" }),
              "Classifications applied to Proof of Cash."
            ] }),
            hasClassifications && projectId && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs(
              Link,
              {
                to: `/project/${projectId}/workbook`,
                className: "inline-flex items-center gap-1 text-primary hover:underline",
                children: [
                  "View detailed Proof of Cash in the Workbook",
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
                ]
              }
            ) })
          ] })
        ] })),
        /* @__PURE__ */ jsx(
          TransferReviewDialog,
          {
            open: showReviewDialog,
            onOpenChange: setShowReviewDialog,
            rawData: classificationRawData ?? null,
            cases: transferCases,
            onSave: updateClassifications
          }
        ),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Bank Accounts Setup" }),
            /* @__PURE__ */ jsxs(Button, { onClick: addBankAccount, size: "sm", className: "gap-1", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              "Add Account"
            ] })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: bankAccounts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Building2, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
            /* @__PURE__ */ jsx("p", { children: "No bank accounts configured" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Add bank accounts manually or import from bank statements above" })
          ] }) : /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Account Name" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Account Number" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Type" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Institution" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-[50px]" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: bankAccounts.map((account) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                Input,
                {
                  value: account.name,
                  onChange: (e) => updateBankAccount(account.id, { name: e.target.value }),
                  placeholder: "Account name"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                Input,
                {
                  value: account.accountNumber,
                  onChange: (e) => updateBankAccount(account.id, { accountNumber: e.target.value }),
                  placeholder: "****1234"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                Select,
                {
                  value: account.type,
                  onValueChange: (value) => updateBankAccount(account.id, { type: value }),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "checking", children: "Checking" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "savings", children: "Savings" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "credit", children: "Credit Card" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "other", children: "Other" })
                    ] })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                Input,
                {
                  value: account.institution,
                  onChange: (e) => updateBankAccount(account.id, { institution: e.target.value }),
                  placeholder: "Bank name"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => removeBankAccount(account.id),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 text-destructive" })
                }
              ) })
            ] }, account.id)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "summary", className: "space-y-4", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Proof of Cash — Reconciliation Summary" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "sticky left-0 bg-card z-10 min-w-[260px]", children: "Line Item" }),
            pocSummary.map((p) => {
              const isLeakage = deltaReconciliation?.cash_leakage_periods?.includes(p.periodId);
              return /* @__PURE__ */ jsxs(
                TableHead,
                {
                  className: `text-right min-w-[120px] ${isLeakage ? "bg-destructive/10 text-destructive" : ""}`,
                  children: [
                    p.periodLabel,
                    isLeakage && /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 inline ml-1" })
                  ]
                },
                p.periodId
              );
            })
          ] }) }),
          /* @__PURE__ */ jsxs(TableBody, { children: [
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Cash per General Ledger" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Beginning Cash Balance" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.glBeginning) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Ending Cash Balance" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.glEnding) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium border-t border-border", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Change in Cash (GL)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.glChange) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Cash per Bank Statement" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Beginning Bank Balance" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.bankOpening) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Ending Bank Balance" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.bankClosing) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium border-t border-border", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Change in Cash (Bank)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.bankChange) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Deposits per Bank Statement" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Total Deposits (Credits)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.totalCredits) }, p.periodId))
            ] }),
            pendingCaseCount > 0 && /* @__PURE__ */ jsxs(TableRow, { className: "text-muted-foreground italic", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8 text-xs", children: "Pending review (not in totals)" }),
              pocSummary.map((p) => {
                const pending = pendingClassificationByPeriod.get(p.periodId);
                const val = (pending?.interbank ?? 0) + (pending?.owner ?? 0);
                return /* @__PURE__ */ jsx(TableCell, { className: "text-right text-xs", children: val !== 0 ? formatCurrency2(val) : "—" }, p.periodId);
              })
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Less: Transfers" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8", children: "Interbank transfers" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.interbank) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8", children: "Owner transfers" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.owner) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium border-t border-border", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Total transfers" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.totalTransfers) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Operating Cash Receipts" }) }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Operating cash receipts" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.opReceipts) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Revenue per IS" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Revenue per Income Statement" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: p.revenue === 0 && !dealData?.trialBalance ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "N/A" }) : formatCurrency2(p.revenue) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Disbursements per Bank Statement" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Total Disbursements (Debits)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.totalDebits) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Expenses per IS" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Expenses per Income Statement" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: p.expenses === 0 && !dealData?.trialBalance ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "N/A" }) : formatCurrency2(p.expenses) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Receipts Reconciliation (Cash → Accrual)" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Receipts Variance (Revenue − Op Receipts)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.receiptsVariance) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8", children: "Change in Accounts Receivable" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.arChange) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                "Receipts Residual",
                pocSummary.length > 0 && (() => {
                  const allOk = pocSummary.every((p) => p.receiptsReconciled);
                  return /* @__PURE__ */ jsxs(Badge, { variant: allOk ? "default" : "destructive", className: "gap-1 text-[10px]", children: [
                    allOk ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                    allOk ? "OK" : "Gap"
                  ] });
                })()
              ] }) }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: `text-right font-medium ${!p.receiptsReconciled ? "text-destructive" : ""}`, children: formatCurrency2(p.receiptsResidual) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Operating Cash Disbursements" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Operating cash disbursements" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.opDisbursements) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Disbursements Reconciliation (Cash → Accrual)" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Disbursements Variance (Expenses − Op Disbursements)" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.disbVariance) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8", children: "Change in Accounts Payable / CL" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.apChange) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card pl-8", children: "Depreciation & Amortization" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.depAmort) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                "Disbursements Residual",
                pocSummary.length > 0 && (() => {
                  const allOk = pocSummary.every((p) => p.disbReconciled);
                  return /* @__PURE__ */ jsxs(Badge, { variant: allOk ? "default" : "destructive", className: "gap-1 text-[10px]", children: [
                    allOk ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                    allOk ? "OK" : "Gap"
                  ] });
                })()
              ] }) }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: `text-right font-medium ${!p.disbReconciled ? "text-destructive" : ""}`, children: formatCurrency2(p.disbResidual) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "h-2 p-0" }) }),
            /* @__PURE__ */ jsx(TableRow, { className: "bg-muted/50", children: /* @__PURE__ */ jsx(TableCell, { colSpan: pocSummary.length + 1, className: "font-semibold", children: "Reference: GL vs Bank Variance" }) }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "GL Ending Cash" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.glEnding) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Bank Ending Balance" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.bankClosing) }, p.periodId))
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { className: "font-medium", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Variance (GL − Bank)" }),
              pocSummary.map((p) => {
                const ok = Math.abs(p.variance) < 0.01;
                return /* @__PURE__ */ jsx(TableCell, { className: `text-right font-medium ${!ok ? "text-destructive" : ""}`, children: formatCurrency2(p.variance) }, p.periodId);
              })
            ] }),
            /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "sticky left-0 bg-card", children: "Net Income per IS" }),
              pocSummary.map((p) => /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency2(p.netIncome) }, p.periodId))
            ] })
          ] })
        ] }) }) })
      ] }) })
    ] })
  ] });
};
export {
  ProofOfCashSection
};
