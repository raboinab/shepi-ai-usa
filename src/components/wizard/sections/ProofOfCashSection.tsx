import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { SummaryCard } from "../shared/SummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, CheckCircle, AlertCircle, Plus, Trash2, Building2, CreditCard, Loader2, Sparkles, ExternalLink, ArrowDownToLine, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useMemo } from "react";
import * as calc from "@/lib/calculations";
import { useProofOfCashData } from "@/hooks/useProofOfCashData";
import { useTransferClassification } from "@/hooks/useTransferClassification";
import { TransferReviewDialog } from "@/components/workbook/shared/TransferReviewDialog";
import { DeltaWaterfallCard } from "@/components/wizard/shared/DeltaWaterfallCard";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { matchesCategory, resolveLabel } from "@/lib/deal-labels";

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  type: "checking" | "savings" | "credit" | "other";
  institution: string;
  dataSource?: "manual" | "statement" | "spreadsheet";
}

interface MonthlyBankData {
  periodId: string;
  accountId: string;
  beginningBalance: number;
  depositsPerBank: number;
  withdrawalsPerBank: number;
  endingBankBalance: number;
  // Book side
  beginningBookBalance: number;
  receiptsPerBooks: number;
  disbursementsPerBooks: number;
  endingBookBalance: number;
  // Reconciling items
  depositsInTransit: number;
  outstandingChecks: number;
  bankErrors: number;
  bookErrors: number;
  // Classification
  interbankTransfers: number;
  ownerDistributions: number;
  otherAdjustments: number;
  // Data source tracking
  bankDataSource?: "manual" | "statement";
  bookDataSource?: "manual" | "spreadsheet";
}

interface ProofOfCashData {
  bankAccounts: BankAccount[];
  monthlyData: MonthlyBankData[];
  // Legacy fields for backwards compatibility
  bankBalance?: number;
  bookBalance?: number;
  depositsInTransit?: number;
  outstandingChecks?: number;
  bankAdjustments?: Record<string, unknown>[];
  bookAdjustments?: Record<string, unknown>[];
}

interface ProofOfCashSectionProps {
  data: ProofOfCashData;
  updateData: (data: ProofOfCashData) => void;
  periods?: Array<{ id: string; label: string; startDate?: string; endDate?: string }>;
  projectId?: string;
  cashAnalysis?: { rawData?: string[][] };
  dealData?: import("@/lib/workbook-types").DealData | null;
  isDemo?: boolean;
}

const defaultBankAccount: BankAccount = {
  id: "",
  name: "",
  accountNumber: "",
  type: "checking",
  institution: "",
  dataSource: "manual",
};

const createEmptyMonthlyData = (periodId: string, accountId: string): MonthlyBankData => ({
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
  bookDataSource: "manual",
});

export const ProofOfCashSection = ({ 
  data, 
  updateData, 
  periods = [],
  projectId,
  cashAnalysis,
  dealData,
  isDemo,
}: ProofOfCashSectionProps) => {
  const [activeTab, setActiveTab] = useState<string>("accounts");
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Fetch bank statement data
  const { bankStatements, isLoading: isLoadingStatements } = useProofOfCashData(projectId);

  // Transfer classification
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
    pendingCaseCount,
    excludedOperatingCount,
  } = useTransferClassification(projectId);

  const hasClassifications = !!classifications && classifications.size > 0;

  // Use centrally-derived prior-period balances from dealData
  const priorBalances = dealData?.deal?.priorBalances ?? {};

  // Auto-import bank statements when data arrives
  useEffect(() => {
    if (bankStatements.length === 0 || periods.length === 0) return;
    if (data?.bankAccounts?.some(a => a.dataSource === "statement")) return;

    let newAccounts = [...(data?.bankAccounts || [])];
    let newMonthlyData = [...(data?.monthlyData || [])];
    let accountsCreated = 0;

    for (const stmt of bankStatements) {
      let account = newAccounts.find(
        (acc) =>
          (stmt.accountNumber && acc.accountNumber === stmt.accountNumber) ||
          (stmt.bankName && acc.institution === stmt.bankName && acc.name.includes(stmt.bankName))
      );

      if (!account) {
        account = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: stmt.bankName
            ? `${stmt.bankName}${stmt.accountNumber ? ` ****${stmt.accountNumber.slice(-4)}` : ""}`
            : `Bank Account ${newAccounts.length + 1}`,
          accountNumber: stmt.accountNumber || "",
          type: "checking" as const,
          institution: stmt.bankName || "",
          dataSource: "statement" as const,
        };
        newAccounts.push(account);
        accountsCreated++;
      }

      const matchingPeriod = periods.find((p) => {
        if (!stmt.periodStart || !stmt.periodEnd) return false;
        const pAny = p as any;
        const parseLocal = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
        const pStart = p.startDate
          ? parseLocal(p.startDate)
          : (pAny.year && pAny.month ? new Date(pAny.year, pAny.month - 1, 1) : null);
        const pEnd = p.endDate
          ? parseLocal(p.endDate)
          : (pAny.year && pAny.month ? new Date(pAny.year, pAny.month, 0) : null);
        if (!pStart || !pEnd) return false;
        const sStart = parseLocal(stmt.periodStart);
        const sEnd = parseLocal(stmt.periodEnd);
        return sStart <= pEnd && sEnd >= pStart;
      });

      if (matchingPeriod && account) {
        const existingIndex = newMonthlyData.findIndex(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account!.id
        );
        const bankData: Partial<MonthlyBankData> = {
          periodId: matchingPeriod.id,
          accountId: account.id,
          beginningBalance: stmt.summary.openingBalance || 0,
          depositsPerBank: stmt.summary.totalCredits || 0,
          withdrawalsPerBank: stmt.summary.totalDebits || 0,
          endingBankBalance: stmt.summary.closingBalance || 0,
          bankDataSource: "statement" as const,
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

  // Detect pending (unapplied) classifications
  const hasPendingClassifications = useMemo(() => {
    if (!classifications || classifications.size === 0 || periods.length === 0) return false;
    const currentMonthly = data?.monthlyData || [];

    for (const [periodKey, totals] of classifications) {
      const matchingPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
        if (derived === periodKey) return true;
        if (p.label && p.label.includes(periodKey)) return true;
        return false;
      });
      if (!matchingPeriod) continue;

      for (const account of (data?.bankAccounts || [])) {
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

  // Apply classifications to PoC on explicit user action
  const applyClassifications = () => {
    if (!classifications || classifications.size === 0) return;

    const newMonthlyData = [...(data?.monthlyData || [])];
    let applied = 0;

    for (const [periodKey, totals] of classifications) {
      const matchingPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
        if (derived === periodKey) return true;
        if (p.label && p.label.includes(periodKey)) return true;
        return false;
      });
      if (!matchingPeriod) continue;

      for (const account of (data?.bankAccounts || [])) {
        const idx = newMonthlyData.findIndex(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account.id
        );
        if (idx >= 0) {
          newMonthlyData[idx] = {
            ...newMonthlyData[idx],
            interbankTransfers: totals.interbank,
            ownerDistributions: totals.owner,
          };
          applied++;
        }
      }
    }

    if (applied > 0) {
      updateData({ ...data, monthlyData: newMonthlyData });
      toast.success("Classifications applied", {
        description: `Updated interbank transfers and owner distributions for ${applied} period(s).`,
      });
    }
  };

  const bankAccounts = data?.bankAccounts || [];

  // Calculate totals across all accounts for summary
  // Bank statement data aggregated by period (mirrors workbook bankByPeriod)
  const bankByPeriod = useMemo(() => {
    const map = new Map<string, { openingBalance: number; closingBalance: number; totalCredits: number; totalDebits: number }>();
    // Deduplicate: skip duplicate records for the same account+period OR identical values
    const seen = new Set<string>();
    const valueSeen = new Set<string>();
    for (const stmt of bankStatements) {
      if (!stmt.periodStart) continue;
      const key = stmt.periodStart.substring(0, 7);
      const acct = stmt.accountNumber ?? stmt.bankName ?? "unknown";
      const dedupeKey = `${key}::${acct}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      // Value-based dedup: skip if another record for this period has identical balances
      const opening = stmt.summary.openingBalance ?? 0;
      const closing = stmt.summary.closingBalance ?? 0;
      const credits = stmt.summary.totalCredits ?? 0;
      const debits = stmt.summary.totalDebits ?? 0;
      const valueKey = `${key}::${opening}::${closing}::${credits}::${debits}`;
      if (valueSeen.has(valueKey)) continue;
      valueSeen.add(valueKey);
      // Match to wizard period
      const matchedPeriod = periods.find(p => {
        if (p.id === key) return true;
        if (p.startDate && p.startDate.substring(0, 7) === key) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
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
          totalDebits: debits,
        });
      }
    }
    return map;
  }, [bankStatements, periods]);

  // Classification data mapped to wizard periods — ONLY approved amounts flow into reconciliation
  const classificationByPeriod = useMemo(() => {
    const source = approvedClassifications;
    if (!source || source.size === 0) return new Map<string, { interbank: number; owner: number }>();
    const map = new Map<string, { interbank: number; owner: number }>();
    for (const [periodKey, totals] of source) {
      const matchedPeriod = periods.find(p => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
        return derived === periodKey;
      });
      map.set(matchedPeriod?.id ?? periodKey, totals);
    }
    return map;
  }, [approvedClassifications, periods]);

  // Pending (unapproved) classification totals — shown as info row but NOT in math
  const pendingClassificationByPeriod = useMemo(() => {
    if (!classifications || classifications.size === 0) return new Map<string, { interbank: number; owner: number }>();
    const map = new Map<string, { interbank: number; owner: number }>();
    for (const [periodKey, rawTotals] of classifications) {
      const matchedPeriod = periods.find(p => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
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

  // Cash-to-accrual data mapped by wizard period key
  const c2aByPeriod = useMemo(() => {
    if (!cashToAccrual) return new Map<string, import("@/hooks/useTransferClassification").CashToAccrualPeriod>();
    const map = new Map<string, import("@/hooks/useTransferClassification").CashToAccrualPeriod>();
    for (const [key, val] of Object.entries(cashToAccrual.periods)) {
      // Try matching to wizard periods
      const matchedPeriod = periods.find(p => {
        if (p.id === key) return true;
        if (p.startDate && p.startDate.substring(0, 7) === key) return true;
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
        return derived === key;
      });
      map.set(matchedPeriod?.id ?? key, val);
    }
    return map;
  }, [cashToAccrual, periods]);

  // Workbook-aligned summary rows computed per period (months + FY/LTM aggregates)
  const pocSummary = useMemo(() => {
    const tb = dealData?.trialBalance;
    const reclass = dealData?.reclassifications ?? [];

    // Helper: sum prior-period balances for a given FS line item category
    const sumPriorByLineItem = (lineItem: string): number => {
      if (!tb || Object.keys(priorBalances).length === 0) return 0;
      return tb
        .filter(e => e.fsType === 'BS' && (matchesCategory(e.fsLineItem, lineItem) || resolveLabel(e.fsLineItem) === lineItem))
        .reduce((s, e) => s + (priorBalances[e.accountId] ?? 0), 0);
    };

    const monthRows = periods.map((period, idx) => {
      const prevPeriodId = idx > 0 ? periods[idx - 1].id : null;
      const glEnding = tb ? calc.sumByLineItemWithReclass(tb, reclass, "Cash and cash equivalents", period.id) : 0;
      const glBeginning = prevPeriodId && tb
        ? calc.sumByLineItemWithReclass(tb, reclass, "Cash and cash equivalents", prevPeriodId)
        : (idx === 0 ? sumPriorByLineItem("Cash and cash equivalents") : 0);
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

      const revenueReclass = calc.sumReclassImpact(reclass, "Revenue", period.id);
      const revenue = tb ? -(calc.calcRevenue(tb, period.id) + revenueReclass) : 0;
      const expenseReclass = calc.sumReclassImpact(reclass, "Cost of Goods Sold", period.id)
        + calc.sumReclassImpact(reclass, "Operating expenses", period.id)
        + calc.sumReclassImpact(reclass, "Payroll & Related", period.id);
      const expenses = tb
        ? calc.calcCOGS(tb, period.id) + calc.calcOpEx(tb, period.id) + calc.calcPayroll(tb, period.id) + calc.calcOtherExpense(tb, period.id) + expenseReclass
        : 0;
      const netIncome = tb ? -calc.calcNetIncome(tb, period.id) : 0;
      const variance = glEnding - bankClosing;

      // Cash-to-accrual bridge fields — prefer backend, fallback to local TB
      const c2a = c2aByPeriod.get(period.id);
      const opDisbursements = c2a?.op_cash_disbursements ?? (totalDebits - owner);
      const receiptsVariance = c2a?.receipts_variance ?? (revenue - opReceipts);

      const arChange = c2a?.ar_change ?? (tb
        ? calc.sumByLineItemWithReclass(tb, reclass, "Accounts receivable", period.id) -
          (prevPeriodId
            ? calc.sumByLineItemWithReclass(tb, reclass, "Accounts receivable", prevPeriodId)
            : sumPriorByLineItem("Accounts receivable"))
        : 0);
      const receiptsResidual = c2a?.receipts_residual ?? (receiptsVariance - arChange);
      const receiptsReconciled = c2a?.receipts_reconciled ?? (Math.abs(receiptsResidual) < 500);

      const disbVariance = c2a?.disbursements_variance ?? (expenses - opDisbursements);
      const apChange = c2a?.ap_change ?? (tb
        ? (calc.sumByLineItemWithReclass(tb, reclass, "Current liabilities", period.id)
           + calc.sumByLineItemWithReclass(tb, reclass, "Other current liabilities", period.id)) -
          (prevPeriodId
            ? (calc.sumByLineItemWithReclass(tb, reclass, "Current liabilities", prevPeriodId)
               + calc.sumByLineItemWithReclass(tb, reclass, "Other current liabilities", prevPeriodId))
            : (sumPriorByLineItem("Current liabilities") + sumPriorByLineItem("Other current liabilities")))
        : 0);
      const depAmort = c2a?.dep_amort ?? (tb ? calc.calcDepreciationExpense(tb, period.id, dealData?.addbacks?.depreciation) : 0);
      const disbResidual = c2a?.disbursements_residual ?? (disbVariance - apChange - depAmort);
      const disbReconciled = c2a?.disbursements_reconciled ?? (Math.abs(disbResidual) < 500);

      return {
        periodId: period.id,
        periodLabel: period.label,
        glBeginning, glEnding, glChange,
        bankOpening, bankClosing, bankChange,
        totalCredits, totalDebits,
        interbank, owner, totalTransfers,
        opReceipts, revenue, expenses, netIncome, variance,
        opDisbursements, receiptsVariance, arChange, receiptsResidual, receiptsReconciled,
        disbVariance, apChange, depAmort, disbResidual, disbReconciled,
      };
    });

    // Build a lookup by periodId for aggregate computation
    const byId = new Map(monthRows.map(r => [r.periodId, r]));

    // Append FY / LTM aggregate columns
    const aggregatePeriods = dealData?.deal?.aggregatePeriods ?? [];
    const aggRows = aggregatePeriods.map(ap => {
      const monthIds = ap.monthPeriodIds;
      const firstMonth = byId.get(monthIds[0]);
      const lastMonth = byId.get(monthIds[monthIds.length - 1]);

      const sumField = (field: keyof typeof monthRows[0]) =>
        monthIds.reduce((s, id) => s + ((byId.get(id)?.[field] as number) ?? 0), 0);

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
        glBeginning, glEnding, glChange,
        bankOpening, bankClosing, bankChange,
        totalCredits, totalDebits,
        interbank, owner, totalTransfers,
        opReceipts, revenue, expenses, netIncome, variance,
        opDisbursements, receiptsVariance, arChange, receiptsResidual, receiptsReconciled,
        disbVariance, apChange, depAmort, disbResidual, disbReconciled,
      };
    });

    return [...monthRows, ...aggRows];
  }, [periods, dealData, bankByPeriod, classificationByPeriod, c2aByPeriod, priorBalances]);

  // Aggregate metrics for summary cards (latest period)
  const latestSummary = pocSummary[pocSummary.length - 1];
  const isReconciled = latestSummary ? Math.abs(latestSummary.variance) < 0.01 : true;

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      ...defaultBankAccount,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Account ${bankAccounts.length + 1}`,
    };
    updateData({
      ...data,
      bankAccounts: [...bankAccounts, newAccount],
    });
  };


  const updateBankAccount = (accountId: string, updates: Partial<BankAccount>) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.map(acc => 
        acc.id === accountId ? { ...acc, ...updates } : acc
      ),
    });
  };

  const removeBankAccount = (accountId: string) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.filter(acc => acc.id !== accountId),
      monthlyData: (data?.monthlyData || []).filter(d => d.accountId !== accountId),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ── Workflow step state ──
  const hasBankData = bankStatements.length > 0 || bankAccounts.some(a => a.dataSource === "statement");
  const classifyComplete = hasClassifications || !!deltaReconciliation;
  const allCasesReviewed = classifyComplete && pendingCaseCount === 0;
  const receiptsOk = pocSummary.length > 0 && pocSummary.every(p => p.receiptsReconciled);
  const disbOk = pocSummary.length > 0 && pocSummary.every(p => p.disbReconciled);
  const fullyReconciled = receiptsOk && disbOk;

  const steps = [
    { label: "Bank Data", complete: hasBankData, detail: hasBankData ? `${bankStatements.length} statement${bankStatements.length !== 1 ? "s" : ""}` : "Upload bank statements" },
    { label: "Classify", complete: classifyComplete, detail: classifyComplete ? "Complete" : "Not started" },
    { label: "Review", complete: allCasesReviewed, detail: classifyComplete ? (allCasesReviewed ? "All approved" : `${pendingCaseCount} pending`) : "—" },
    { label: "Reconcile", complete: fullyReconciled, detail: fullyReconciled ? "Tied out" : (hasBankData ? "Gaps remain" : "—") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Proof of Cash</h2>
          <p className="text-muted-foreground">Bank statement reconciliation by period</p>
        </div>
        <Badge variant={isReconciled ? "default" : "destructive"} className="gap-1">
          {isReconciled ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isReconciled ? "Reconciled" : `Variance: ${formatCurrency(Math.abs(latestSummary?.variance ?? 0))}`}
        </Badge>
      </div>

      {/* ── Workflow Stepper ── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${step.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}>
                {step.complete ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{step.label}</div>
                <div className="text-xs text-muted-foreground truncate">{step.detail}</div>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-2 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* ── Persistent action buttons ── */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          {!classifyComplete && hasBankData && !isDemo && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await classify();
                  toast.success("Transfers classified");
                } catch {
                  toast.error("Classification failed");
                }
              }}
              disabled={isClassifying || isLoadingClassifications}
              className="gap-2"
            >
              {isClassifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isClassifying
                ? classifyProgress
                  ? `Classifying… ${classifyProgress.processed.toLocaleString()} / ${classifyProgress.total.toLocaleString()}`
                  : "Classifying…"
                : "Classify Transfers"}
            </Button>
          )}
          {classifyComplete && !isDemo && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await classify();
                    toast.success("Transfers re-classified");
                  } catch {
                    toast.error("Classification failed");
                  }
                }}
                disabled={isClassifying}
                className="gap-2 text-xs"
              >
                {isClassifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Re-run
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewDialog(true)}
                className="gap-2"
              >
                <ShieldCheck className="w-3 h-3" />
                Review & Approve
                {pendingCaseCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 min-w-[18px] text-[10px] px-1">{pendingCaseCount}</Badge>
                )}
              </Button>
            </>
          )}
          {isDemo && (
            <>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Demo: Classified
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowReviewDialog(true)}>Review Classifications</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Operating Cash Receipts" 
          value={latestSummary?.opReceipts ?? 0} 
          subtitle="Bank deposits minus transfers"
          icon={Wallet}
        />
        <SummaryCard 
          title="Revenue per IS" 
          value={latestSummary?.revenue ?? 0} 
          subtitle="Accrual basis"
          icon={Building2}
        />
        <SummaryCard 
          title="Cash-to-Accrual Gap" 
          value={Math.abs((latestSummary?.revenue ?? 0) - (latestSummary?.opReceipts ?? 0))} 
          subtitle={
            cashToAccrual?.summary?.overall_reconciled
              ? "Reconciled"
              : latestSummary?.receiptsReconciled
                ? "Receipts reconciled"
                : "Explained by AR/AP changes"
          }
          icon={
            (cashToAccrual?.summary?.overall_reconciled || latestSummary?.receiptsReconciled)
              ? CheckCircle
              : AlertCircle
          }
        />
        <SummaryCard 
          title="Non-Operating Flows" 
          value={latestSummary?.totalTransfers ?? 0} 
          subtitle="Owner, debt, tax, interbank"
          icon={CreditCard}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="summary" disabled={bankAccounts.length === 0}>Reconciliation Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Bank accounts are auto-populated from uploaded bank statements */}

          {/* Delta Waterfall or Legacy Classification Card */}
          {(bankStatements.length > 0 || isDemo) && (
            deltaReconciliation && projectId ? (
              <DeltaWaterfallCard
                delta={deltaReconciliation}
                projectId={projectId}
                classificationRawData={classificationRawData ?? undefined}
                hasPendingCases={pendingCaseCount > 0}
              />
            ) : (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Transfer Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI can analyze your bank transactions to separate interbank transfers and owner distributions from operating activity.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {isDemo ? (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Classified
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        8,921 txns analyzed · 7,218 operating · 847 interbank · 412 owner distributions
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                        className="gap-2"
                      >
                        Review Classifications
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Preview mode", { description: "Sign up to re-run classification on a real project." })}
                        className="gap-2 text-xs"
                      >
                        Re-run
                      </Button>
                    </>
                  ) : !hasClassifications ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await classify();
                          toast.success("Transfers classified", {
                            description: "Review the results and apply them to the Proof of Cash.",
                          });
                        } catch {
                          toast.error("Classification failed", {
                            description: "Please try again or classify manually.",
                          });
                        }
                      }}
                      disabled={isClassifying || isLoadingClassifications}
                      className="gap-2"
                    >
                      {isClassifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isClassifying
                        ? classifyProgress
                          ? `Classifying… ${classifyProgress.processed.toLocaleString()} / ${classifyProgress.total.toLocaleString()}`
                          : "Classifying…"
                        : "Classify Transfers"}
                    </Button>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Classified
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                        className="gap-2"
                      >
                        Review Classifications
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await classify();
                            toast.success("Transfers re-classified");
                          } catch {
                            toast.error("Classification failed");
                          }
                        }}
                        disabled={isClassifying}
                        className="gap-2 text-xs"
                      >
                        {isClassifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Re-run
                      </Button>
                    </>
                  )}
                </div>

                {/* Pending case approval banner */}
                {hasClassifications && pendingCaseCount > 0 && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm">
                        <span className="font-medium">{pendingCaseCount} transfer case{pendingCaseCount !== 1 ? "s" : ""} pending review</span>
                        {" — reconciliation uses AI-suggested amounts. Review to confirm accuracy."}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                        className="gap-1 shrink-0"
                      >
                        Review & Approve
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Legacy: Pending unapplied classifications banner */}
                {hasClassifications && pendingCaseCount === 0 && hasPendingClassifications && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm">
                        AI classifications are ready. Review and apply them to update interbank transfers and owner distributions.
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReviewDialog(true)}
                          className="gap-1"
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={applyClassifications}
                          className="gap-1"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          Apply to Proof of Cash
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {hasClassifications && !hasPendingClassifications && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Classifications applied to Proof of Cash.
                  </p>
                )}

                {hasClassifications && projectId && (
                  <p className="text-xs text-muted-foreground">
                    <Link
                      to={`/project/${projectId}/workbook`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View detailed Proof of Cash in the Workbook
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
            )
          )}

          {/* Transfer Review Dialog */}
          <TransferReviewDialog
            open={showReviewDialog}
            onOpenChange={setShowReviewDialog}
            rawData={classificationRawData ?? null}
            cases={transferCases}
            onSave={updateClassifications}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Accounts Setup</CardTitle>
              <Button onClick={addBankAccount} size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No bank accounts configured</p>
                  <p className="text-sm">Add bank accounts manually or import from bank statements above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Input
                            value={account.name}
                            onChange={(e) => updateBankAccount(account.id, { name: e.target.value })}
                            placeholder="Account name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={account.accountNumber}
                            onChange={(e) => updateBankAccount(account.id, { accountNumber: e.target.value })}
                            placeholder="****1234"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={account.type}
                            onValueChange={(value) => updateBankAccount(account.id, { type: value as BankAccount["type"] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="credit">Credit Card</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={account.institution}
                            onChange={(e) => updateBankAccount(account.id, { institution: e.target.value })}
                            placeholder="Bank name"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBankAccount(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proof of Cash — Reconciliation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 min-w-[260px]">Line Item</TableHead>
                      {pocSummary.map(p => {
                        const isLeakage = deltaReconciliation?.cash_leakage_periods?.includes(p.periodId);
                        return (
                          <TableHead
                            key={p.periodId}
                            className={`text-right min-w-[120px] ${isLeakage ? "bg-destructive/10 text-destructive" : ""}`}
                          >
                            {p.periodLabel}
                            {isLeakage && <AlertCircle className="w-3 h-3 inline ml-1" />}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Cash per GL */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Cash per General Ledger</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Beginning Cash Balance</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.glBeginning)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Ending Cash Balance</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.glEnding)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium border-t border-border">
                      <TableCell className="sticky left-0 bg-card">Change in Cash (GL)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.glChange)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Cash per Bank */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Cash per Bank Statement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Beginning Bank Balance</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.bankOpening)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Ending Bank Balance</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.bankClosing)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium border-t border-border">
                      <TableCell className="sticky left-0 bg-card">Change in Cash (Bank)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.bankChange)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Deposits */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Deposits per Bank Statement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Total Deposits (Credits)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.totalCredits)}</TableCell>)}
                    </TableRow>
                    {pendingCaseCount > 0 && (
                      <TableRow className="text-muted-foreground italic">
                        <TableCell className="sticky left-0 bg-card pl-8 text-xs">
                          Pending review (not in totals)
                        </TableCell>
                        {pocSummary.map(p => {
                          const pending = pendingClassificationByPeriod.get(p.periodId);
                          const val = (pending?.interbank ?? 0) + (pending?.owner ?? 0);
                          return <TableCell key={p.periodId} className="text-right text-xs">{val !== 0 ? formatCurrency(val) : '—'}</TableCell>;
                        })}
                      </TableRow>
                    )}

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Transfers */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Less: Transfers</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8">Interbank transfers</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.interbank)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8">Owner transfers</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.owner)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium border-t border-border">
                      <TableCell className="sticky left-0 bg-card">Total transfers</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.totalTransfers)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Operating Cash Receipts */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Operating Cash Receipts</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell className="sticky left-0 bg-card">Operating cash receipts</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.opReceipts)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Revenue per IS */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Revenue per IS</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Revenue per Income Statement</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{p.revenue === 0 && !dealData?.trialBalance ? <span className="text-muted-foreground text-xs">N/A</span> : formatCurrency(p.revenue)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Disbursements */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Disbursements per Bank Statement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Total Disbursements (Debits)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.totalDebits)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Expenses per IS */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Expenses per IS</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Expenses per Income Statement</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{p.expenses === 0 && !dealData?.trialBalance ? <span className="text-muted-foreground text-xs">N/A</span> : formatCurrency(p.expenses)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Receipts Reconciliation */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Receipts Reconciliation (Cash → Accrual)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Receipts Variance (Revenue − Op Receipts)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.receiptsVariance)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8">Change in Accounts Receivable</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.arChange)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell className="sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          Receipts Residual
                          {pocSummary.length > 0 && (() => {
                            const allOk = pocSummary.every(p => p.receiptsReconciled);
                            return (
                              <Badge variant={allOk ? "default" : "destructive"} className="gap-1 text-[10px]">
                                {allOk ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {allOk ? "OK" : "Gap"}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      {pocSummary.map(p => (
                        <TableCell key={p.periodId} className={`text-right font-medium ${!p.receiptsReconciled ? "text-destructive" : ""}`}>
                          {formatCurrency(p.receiptsResidual)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Operating Cash Disbursements */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Operating Cash Disbursements</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Operating cash disbursements</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.opDisbursements)}</TableCell>)}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Disbursements Reconciliation */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Disbursements Reconciliation (Cash → Accrual)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Disbursements Variance (Expenses − Op Disbursements)</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.disbVariance)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8">Change in Accounts Payable / CL</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.apChange)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8">Depreciation & Amortization</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.depAmort)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell className="sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          Disbursements Residual
                          {pocSummary.length > 0 && (() => {
                            const allOk = pocSummary.every(p => p.disbReconciled);
                            return (
                              <Badge variant={allOk ? "default" : "destructive"} className="gap-1 text-[10px]">
                                {allOk ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {allOk ? "OK" : "Gap"}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      {pocSummary.map(p => (
                        <TableCell key={p.periodId} className={`text-right font-medium ${!p.disbReconciled ? "text-destructive" : ""}`}>
                          {formatCurrency(p.disbResidual)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Spacer */}
                    <TableRow><TableCell colSpan={pocSummary.length + 1} className="h-2 p-0" /></TableRow>

                    {/* Legacy Variance Analysis */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={pocSummary.length + 1} className="font-semibold">Reference: GL vs Bank Variance</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">GL Ending Cash</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.glEnding)}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Bank Ending Balance</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.bankClosing)}</TableCell>)}
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell className="sticky left-0 bg-card">Variance (GL − Bank)</TableCell>
                      {pocSummary.map(p => {
                        const ok = Math.abs(p.variance) < 0.01;
                        return (
                          <TableCell key={p.periodId} className={`text-right font-medium ${!ok ? "text-destructive" : ""}`}>
                            {formatCurrency(p.variance)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">Net Income per IS</TableCell>
                      {pocSummary.map(p => <TableCell key={p.periodId} className="text-right">{formatCurrency(p.netIncome)}</TableCell>)}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
