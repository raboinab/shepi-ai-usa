import { useMemo, useState } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";
import { buildStandardColumns, bsEndingBalanceCells, periodCells, negatedPeriodCells } from "../shared/tabHelpers";
import { useProofOfCashData } from "@/hooks/useProofOfCashData";
import { useTransferClassification } from "@/hooks/useTransferClassification";
import type { TransferTotals } from "@/hooks/useTransferClassification";
import { TransferReviewDialog } from "../shared/TransferReviewDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle } from "lucide-react";

interface BankSummary {
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
}

interface MockBankStatementLike {
  id: string;
  documentId: string | null;
  documentName?: string;
  accountNumber?: string;
  bankName?: string;
  periodStart: string | null;
  periodEnd: string | null;
  summary: {
    openingBalance?: number;
    closingBalance?: number;
    totalCredits?: number;
    totalDebits?: number;
    transactionCount?: number;
  };
  createdAt: string;
}

interface TabProps {
  dealData: DealData;
  onDataChange?: (data: DealData) => void;
  mockBankStatements?: MockBankStatementLike[];
  mockTransferClassifications?: Map<string, TransferTotals>;
}

export function ProofOfCashTab({ dealData, mockBankStatements, mockTransferClassifications }: TabProps) {
  const isMock = !!mockBankStatements;
  const { bankStatements: liveBankStatements, isLoading } = useProofOfCashData(isMock ? undefined : dealData.deal.projectId);
  const { classifications: liveClassifications, approvedClassifications: liveApproved, rawData, isLoading: classLoading, classify, isClassifying, updateClassifications, cases: transferCases, pendingCaseCount, excludedOperatingCount } = useTransferClassification(isMock ? undefined : dealData.deal.projectId);

  const bankStatements = isMock ? (mockBankStatements ?? []) : liveBankStatements;
  const classifications = isMock ? (mockTransferClassifications ?? null) : (liveApproved && liveApproved.size > 0 ? liveApproved : null);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Build lookup: periodId (e.g. "2022-01") -> aggregated BankSummary
  const bankByPeriod = useMemo(() => {
    const map = new Map<string, BankSummary>();
    for (const stmt of bankStatements) {
      if (!stmt.periodStart) continue;
      const key = stmt.periodStart.substring(0, 7);
      const existing = map.get(key);
      if (existing) {
        existing.openingBalance += stmt.summary.openingBalance ?? 0;
        existing.closingBalance += stmt.summary.closingBalance ?? 0;
        existing.totalCredits += stmt.summary.totalCredits ?? 0;
        existing.totalDebits += stmt.summary.totalDebits ?? 0;
      } else {
        map.set(key, {
          openingBalance: stmt.summary.openingBalance ?? 0,
          closingBalance: stmt.summary.closingBalance ?? 0,
          totalCredits: stmt.summary.totalCredits ?? 0,
          totalDebits: stmt.summary.totalDebits ?? 0,
        });
      }
    }
    return map;
  }, [bankStatements]);

  const gridData = useMemo((): GridData => {
    const tb = dealData.trialBalance;
    const bc = (fn: (p: string) => number) => bsEndingBalanceCells(dealData, fn);
    const pc = (fn: (p: string) => number) => periodCells(dealData, fn);
    const npc = (fn: (p: string) => number) => negatedPeriodCells(dealData, fn);
    const { periods, aggregatePeriods } = dealData.deal;

    const columns = buildStandardColumns(dealData, "Proof of Cash", { labelWidth: 280 });

    // ── Helper: bank field for all periods ──
    const bankCells = (field: keyof BankSummary): Record<string, number> => {
      const cells: Record<string, number> = {};
      for (const p of periods) {
        cells[p.id] = bankByPeriod.get(p.id)?.[field] ?? 0;
      }
      for (const ap of aggregatePeriods) {
        if (field === "openingBalance") {
          const firstId = ap.monthPeriodIds[0];
          cells[ap.id] = firstId ? (bankByPeriod.get(firstId)?.[field] ?? 0) : 0;
        } else if (field === "closingBalance") {
          const lastId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
          cells[ap.id] = lastId ? (bankByPeriod.get(lastId)?.[field] ?? 0) : 0;
        } else {
          let sum = 0;
          for (const mpid of ap.monthPeriodIds) {
            sum += bankByPeriod.get(mpid)?.[field] ?? 0;
          }
          cells[ap.id] = sum;
        }
      }
      return cells;
    };

    // ── Helper: classification field for all periods ──
    const classificationCells = (field: "interbank" | "interbankIn" | "interbankOut" | "owner" | "debt_service" | "capex" | "tax_payments"): Record<string, number> => {
      if (!classifications) return {};
      const cells: Record<string, number> = {};
      for (const p of periods) {
        cells[p.id] = (classifications.get(p.id) as any)?.[field] ?? 0;
      }
      for (const ap of aggregatePeriods) {
        let sum = 0;
        for (const mpid of ap.monthPeriodIds) {
          sum += (classifications.get(mpid) as any)?.[field] ?? 0;
        }
        cells[ap.id] = sum;
      }
      return cells;
    };

    // ── Helper: BS change (current - previous period) ──
    const bsChangeCells = (calcFn: (tb: typeof dealData.trialBalance, p: string) => number): Record<string, number> => {
      const cells: Record<string, number> = {};
      for (let i = 0; i < periods.length; i++) {
        const curr = calcFn(tb, periods[i].id);
        const prev = i > 0 ? calcFn(tb, periods[i - 1].id) : 0;
        cells[periods[i].id] = curr - prev;
      }
      for (const ap of aggregatePeriods) {
        const firstPid = ap.monthPeriodIds[0];
        const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
        const idx = periods.findIndex(pp => pp.id === firstPid);
        const beginVal = idx > 0 ? calcFn(tb, periods[idx - 1].id) : 0;
        const endVal = lastPid ? calcFn(tb, lastPid) : 0;
        cells[ap.id] = endVal - beginVal;
      }
      return cells;
    };

    // ── Computed cell blocks ──
    const totalCredits = bankCells("totalCredits");
    const totalDebits = bankCells("totalDebits");
    const interbankNet = classificationCells("interbank");
    const interbankIn = classificationCells("interbankIn");
    const interbankOut = classificationCells("interbankOut");
    const ownerOut = classificationCells("owner");
    const debtOut = classificationCells("debt_service");
    const capexOut = classificationCells("capex");
    const taxOut = classificationCells("tax_payments");

    // Operating Cash Receipts = Total Credits - Interbank Transfers In (credit-side)
    const opReceiptsCells: Record<string, number> = {};
    for (const key of Object.keys(totalCredits)) {
      opReceiptsCells[key] = (totalCredits[key] ?? 0) - (interbankIn[key] ?? 0);
    }

    // Operating Cash Disbursements = Total Debits - Interbank Out (debit-side) - Owner - Debt - Tax - CapEx
    const opDisbursementsCells: Record<string, number> = {};
    for (const key of Object.keys(totalDebits)) {
      opDisbursementsCells[key] = (totalDebits[key] ?? 0)
        - (interbankOut[key] ?? 0) - (ownerOut[key] ?? 0) - (debtOut[key] ?? 0) - (taxOut[key] ?? 0) - (capexOut[key] ?? 0);
    }

    // Revenue per IS (display-positive)
    const revenueCells = npc(p => calc.calcRevenue(tb, p));
    // Expenses per IS — operating only (COGS + OpEx + Payroll), excludes Other Expense
    const expensesCells = pc(p =>
      calc.calcCOGS(tb, p) + calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p)
    );

    // Receipts Variance = Revenue - Operating Cash Receipts
    const receiptsVarianceCells: Record<string, number> = {};
    for (const key of Object.keys(revenueCells)) {
      if (key === "label") continue;
      receiptsVarianceCells[key] = (revenueCells[key] as number) - (opReceiptsCells[key] ?? 0);
    }

    // AR Change (current AR - previous AR)
    let arChangeCells = bsChangeCells((tb, p) => calc.sumByLineItem(tb, "Accounts receivable", p));

    // Fallback: if local TB has no AR data, try backend _cash_to_accrual
    const arAllZero = Object.values(arChangeCells).every(v => v === 0);
    if (arAllZero && !isMock) {
      const c2aRaw = (rawData as any)?._cash_to_accrual;
      if (c2aRaw) {
        const c2aPeriods: any[] = Array.isArray(c2aRaw.periods) ? c2aRaw.periods : [];
        const backendAr: Record<string, number> = {};
        let hasBackendAr = false;
        for (const p of c2aPeriods) {
          const key = p.period_key ?? p.period;
          const arVal = p.receipts?.ar_change ?? p.ar_change;
          if (key && arVal != null) {
            backendAr[key] = arVal;
            hasBackendAr = true;
          }
        }
        if (hasBackendAr) {
          // Overlay backend values and compute aggregates
          for (const p of periods) {
            if (backendAr[p.id] != null) arChangeCells[p.id] = backendAr[p.id];
          }
          for (const ap of aggregatePeriods) {
            let sum = 0;
            for (const mpid of ap.monthPeriodIds) sum += arChangeCells[mpid] ?? 0;
            arChangeCells[ap.id] = sum;
          }
        }
      }
    }

    // Change in Undeposited Funds (clearing accounts)
    const undepChangeCells = bsChangeCells((tb, p) => calc.calcUndepositedFunds(tb, p));

    // Change in Other Current Assets (prepaid, inventory)
    const ocaChangeCells = bsChangeCells((tb, p) => calc.sumByLineItem(tb, "Other current assets", p));

    // Receipts Residual = Receipts Variance - AR Change - Undeposited Funds Change - OCA Change
    const receiptsResidualCells: Record<string, number> = {};
    let receiptsAllTied = true;
    for (const key of Object.keys(receiptsVarianceCells)) {
      const residual = (receiptsVarianceCells[key] ?? 0) - (arChangeCells[key] ?? 0) - (undepChangeCells[key] ?? 0) - (ocaChangeCells[key] ?? 0);
      receiptsResidualCells[key] = residual;
      if (Math.abs(residual) > 0.5) receiptsAllTied = false;
    }

    // Disbursements Variance = Expenses - Operating Cash Disbursements
    const disbVarianceCells: Record<string, number> = {};
    for (const key of Object.keys(expensesCells)) {
      if (key === "label") continue;
      disbVarianceCells[key] = (expensesCells[key] as number) - (opDisbursementsCells[key] ?? 0);
    }

    // AP/CL Change (current CL - previous CL, negated for display: decrease in CL = cash outflow)
    const apChangeCells = bsChangeCells((tb, p) => calc.calcTotalCurrentLiabilities(tb, p));
    const negApChangeCells: Record<string, number> = {};
    for (const key of Object.keys(apChangeCells)) {
      negApChangeCells[key] = -(apChangeCells[key] ?? 0);
    }

    // D&A (non-cash expense in IS but not in bank)
    const daCells = pc(p => calc.calcDepreciationExpense(tb, p, dealData.addbacks?.depreciation));

    // Other expense (income) — non-operating items in IS not flowing through bank
    const otherExpCells = pc(p => calc.calcOtherExpense(tb, p));

    // Disbursements Residual = DisbVariance - (-AP Change) - D&A - Other Expense
    const disbResidualCells: Record<string, number> = {};
    let disbAllTied = true;
    for (const key of Object.keys(disbVarianceCells)) {
      const residual = (disbVarianceCells[key] ?? 0) - (negApChangeCells[key] ?? 0) - (daCells[key] ?? 0) - (otherExpCells[key] ?? 0);
      disbResidualCells[key] = residual;
      if (Math.abs(residual) > 0.5) disbAllTied = false;
    }

    // GL ending cash & bank ending for legacy variance
    const glEndingCells = bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p));
    const bankEndingCells = bankCells("closingBalance");

    // Undeposited funds ending balance (for GL vs Bank reconciliation)
    const undepEndingCells = bc(p => calc.calcUndepositedFunds(tb, p));

    // Adjusted GL Cash = GL Cash - Undeposited Funds
    const adjustedGlCells: Record<string, number> = {};
    for (const key of Object.keys(glEndingCells)) {
      if (key === "label") continue;
      adjustedGlCells[key] = (glEndingCells[key] as number) - (undepEndingCells[key] as number);
    }

    const legacyVarianceCells: Record<string, number> = {};
    let legacyAllZero = true;
    for (const key of Object.keys(glEndingCells)) {
      if (key === "label") continue;
      const v = (glEndingCells[key] as number) - (bankEndingCells[key] as number);
      legacyVarianceCells[key] = v;
      if (Math.abs(v) > 0.01) legacyAllZero = false;
    }

    // Adjusted Variance = Adjusted GL Cash - Bank Ending
    const adjustedVarianceCells: Record<string, number> = {};
    let adjustedAllZero = true;
    for (const key of Object.keys(adjustedGlCells)) {
      const v = (adjustedGlCells[key] ?? 0) - (bankEndingCells[key] ?? 0);
      adjustedVarianceCells[key] = v;
      if (Math.abs(v) > 0.01) adjustedAllZero = false;
    }

    // Non-operating totals
    const nonOpTotalCells: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(interbankNet), ...Object.keys(ownerOut), ...Object.keys(debtOut), ...Object.keys(capexOut), ...Object.keys(taxOut)]);
    for (const key of allKeys) {
      nonOpTotalCells[key] = (interbankNet[key] ?? 0) + (ownerOut[key] ?? 0) + (debtOut[key] ?? 0) + (capexOut[key] ?? 0) + (taxOut[key] ?? 0);
    }

    const rows: GridRow[] = [
      // ══════ Section 1: Bank Activity — Receipts ══════
      { id: "hdr-receipts-bank", type: "section-header", label: "Bank Activity — Receipts", cells: { label: "Bank Activity — Receipts" } },
      { id: "dep-total", type: "data", cells: { label: "Total Deposits (Credits)", ...totalCredits } },
      { id: "less-interbank-in", type: "data", indent: 1, cells: { label: "Less: Interbank transfers in", ...interbankIn } },
      { id: "op-receipts", type: "subtotal", cells: { label: "Operating Cash Receipts", ...opReceiptsCells } },
      { id: "s1", type: "spacer", cells: {} },

      // ══════ Section 2: Receipts Reconciliation ══════
      { id: "hdr-receipts-recon", type: "section-header", label: "Receipts Reconciliation (Cash vs Accrual)", cells: { label: "Receipts Reconciliation (Cash vs Accrual)" } },
      { id: "recon-op-receipts", type: "data", cells: { label: "Operating Cash Receipts (Bank)", ...opReceiptsCells } },
      { id: "recon-revenue", type: "data", cells: { label: "Revenue per Income Statement", ...revenueCells } },
      { id: "recon-receipts-var", type: "subtotal", cells: { label: "Receipts Variance (Revenue − Receipts)", ...receiptsVarianceCells } },
      { id: "hdr-explained-r", type: "data", indent: 1, cells: { label: "Explained by:" } },
      { id: "recon-ar-change", type: "data", indent: 2, cells: { label: "Change in Accounts Receivable", ...arChangeCells } },
      { id: "recon-undep-change", type: "data", indent: 2, cells: { label: "Change in Undeposited Funds", ...undepChangeCells } },
      { id: "recon-oca-change", type: "data", indent: 2, cells: { label: "Change in Other Current Assets", ...ocaChangeCells } },
      { id: "recon-receipts-residual", type: "check", checkPassed: receiptsAllTied, cells: { label: "Receipts Residual", ...receiptsResidualCells } },
      { id: "s2", type: "spacer", cells: {} },

      // ══════ Section 3: Bank Activity — Disbursements ══════
      { id: "hdr-disb-bank", type: "section-header", label: "Bank Activity — Disbursements", cells: { label: "Bank Activity — Disbursements" } },
      { id: "disb-total", type: "data", cells: { label: "Total Withdrawals (Debits)", ...totalDebits } },
      { id: "less-interbank-out", type: "data", indent: 1, cells: { label: "Less: Interbank transfers out", ...interbankOut } },
      { id: "less-owner", type: "data", indent: 1, cells: { label: "Less: Owner draws", ...ownerOut } },
      { id: "less-debt", type: "data", indent: 1, cells: { label: "Less: Debt service", ...debtOut } },
      { id: "less-tax", type: "data", indent: 1, cells: { label: "Less: Tax payments", ...taxOut } },
      { id: "less-capex", type: "data", indent: 1, cells: { label: "Less: Capital expenditures", ...capexOut } },
      { id: "op-disbursements", type: "subtotal", cells: { label: "Operating Cash Disbursements", ...opDisbursementsCells } },
      { id: "s3", type: "spacer", cells: {} },

      // ══════ Section 4: Disbursements Reconciliation ══════
      { id: "hdr-disb-recon", type: "section-header", label: "Disbursements Reconciliation (Cash vs Accrual)", cells: { label: "Disbursements Reconciliation (Cash vs Accrual)" } },
      { id: "recon-op-disb", type: "data", cells: { label: "Operating Cash Disbursements (Bank)", ...opDisbursementsCells } },
      { id: "recon-expenses", type: "data", cells: { label: "Expenses per Income Statement", ...expensesCells } },
      { id: "recon-disb-var", type: "subtotal", cells: { label: "Disbursements Variance (Expenses − Disbursements)", ...disbVarianceCells } },
      { id: "hdr-explained-d", type: "data", indent: 1, cells: { label: "Explained by:" } },
      { id: "recon-ap-change", type: "data", indent: 2, cells: { label: "Change in Current Liabilities (AP)", ...negApChangeCells } },
      { id: "recon-da", type: "data", indent: 2, cells: { label: "Depreciation & Amortization (non-cash)", ...daCells } },
      { id: "recon-other-exp", type: "data", indent: 2, cells: { label: "Other Income / Non-operating Items", ...otherExpCells } },
      { id: "recon-disb-residual", type: "check", checkPassed: disbAllTied, cells: { label: "Disbursements Residual", ...disbResidualCells } },
      { id: "s4", type: "spacer", cells: {} },

      // ══════ Section 5: Non-Operating Flows (Reference) ══════
      { id: "hdr-nonop", type: "section-header", label: "Non-Operating Flows (Reference)", cells: { label: "Non-Operating Flows (Reference)" } },
      { id: "nonop-interbank", type: "data", indent: 1, cells: { label: "Interbank transfers (net)", ...interbankNet } },
      { id: "nonop-owner", type: "data", indent: 1, cells: { label: "Owner draws", ...ownerOut } },
      { id: "nonop-debt", type: "data", indent: 1, cells: { label: "Debt service", ...debtOut } },
      { id: "nonop-tax", type: "data", indent: 1, cells: { label: "Tax payments", ...taxOut } },
      { id: "nonop-capex", type: "data", indent: 1, cells: { label: "Capital expenditures", ...capexOut } },
      { id: "nonop-total", type: "subtotal", cells: { label: "Total non-operating flows", ...nonOpTotalCells } },
      { id: "s5", type: "spacer", cells: {} },

      // ══════ Section 6: GL vs Bank Variance ══════
      { id: "hdr-legacy", type: "section-header", label: "GL vs Bank Variance", cells: { label: "GL vs Bank Variance" } },
      { id: "gl-ending", type: "data", cells: { label: "GL Ending Cash", ...glEndingCells } },
      { id: "less-undep-bal", type: "data", indent: 1, cells: { label: "Less: Undeposited Funds Balance", ...undepEndingCells } },
      { id: "adjusted-gl", type: "subtotal", cells: { label: "Adjusted GL Cash", ...adjustedGlCells } },
      { id: "bank-ending-var", type: "data", cells: { label: "Bank Ending Balance", ...bankEndingCells } },
      { id: "legacy-variance", type: "data", cells: { label: "Unadjusted Variance (GL − Bank)", ...legacyVarianceCells } },
      { id: "adjusted-variance", type: "check", checkPassed: adjustedAllZero, cells: { label: "Adjusted Variance", ...adjustedVarianceCells } },
      { id: "net-income", type: "data", cells: { label: "Net Income per IS", ...npc(p => calc.calcNetIncome(tb, p)) } },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData, bankByPeriod, classifications, rawData, isMock]);

  if (!isMock && (isLoading || classLoading)) {
    return <div className="p-4 text-muted-foreground">Loading bank statement data…</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {!isMock && !classifications && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">
            AI can classify interbank and owner transfers from your bank transactions.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Classification started" })); classify().catch((e) => { import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Classification failed", description: e?.message || "Unknown error", variant: "destructive" })); }); }}
            disabled={isClassifying}
          >
            {isClassifying ? (
              <>
                <Spinner className="mr-2 h-3 w-3" />
                Classifying…
              </>
            ) : (
              "Classify Transfers"
            )}
          </Button>
        </div>
      )}
      {!isMock && (classifications || liveClassifications) && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-accent/30">
          <Badge variant="secondary" className="gap-1 shrink-0">
            <CheckCircle className="w-3 h-3" />
            Classified
          </Badge>
          <span className="text-sm text-muted-foreground flex-1">
            AI transfer classification complete.
            {pendingCaseCount > 0 && (
              <span className="text-destructive font-medium ml-1">
                {pendingCaseCount} case{pendingCaseCount !== 1 ? "s" : ""} pending review — excluded from totals.
              </span>
            )}
            {pendingCaseCount === 0 && excludedOperatingCount > 0 && (
              <span className="ml-1">{excludedOperatingCount} operating cluster{excludedOperatingCount !== 1 ? "s" : ""} auto-excluded.</span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Re-run started" })); classify().catch((e) => { import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Re-run failed", description: e?.message || "Unknown error", variant: "destructive" })); }); }}
            disabled={isClassifying}
            className="gap-1.5"
          >
            {isClassifying ? (
              <>
                <Spinner className="h-3 w-3" />
                Classifying…
              </>
            ) : (
              "Re-run"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReviewOpen(true)}
            className="gap-1.5"
          >
            Review & Approve
            {pendingCaseCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-[18px] text-[10px] px-1">
                {pendingCaseCount}
              </Badge>
            )}
          </Button>
        </div>
      )}
      {isMock && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">
            Demo mode — mock bank statement data. Owner transfers: $3,500/mo.
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <SpreadsheetGrid data={gridData} />
      </div>
      {!isMock && (
        <TransferReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          rawData={rawData ?? null}
          cases={transferCases}
          onSave={updateClassifications}
        />
      )}
    </div>
  );
}
