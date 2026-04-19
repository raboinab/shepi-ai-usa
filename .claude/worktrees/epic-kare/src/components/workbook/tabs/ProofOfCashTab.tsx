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
import { Spinner } from "@/components/ui/spinner";

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
  // Only call hooks when not in mock mode (hooks must always be called — pass "demo" to skip DB queries)
  const { bankStatements: liveBankStatements, isLoading } = useProofOfCashData(isMock ? undefined : dealData.deal.projectId);
  const { classifications: liveClassifications, rawData, isLoading: classLoading, classify, isClassifying, updateClassifications } = useTransferClassification(isMock ? undefined : dealData.deal.projectId);

  const bankStatements = isMock ? (mockBankStatements ?? []) : liveBankStatements;
  const classifications = isMock ? (mockTransferClassifications ?? null) : liveClassifications;
  const [reviewOpen, setReviewOpen] = useState(false);

  // Build lookup: periodId (e.g. "2022-01") -> aggregated BankSummary
  const bankByPeriod = useMemo(() => {
    const map = new Map<string, BankSummary>();
    for (const stmt of bankStatements) {
      if (!stmt.periodStart) continue;
      const key = stmt.periodStart.substring(0, 7); // "2022-01"
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

    // Helper: get bank field for all periods
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
          // sum for credits/debits
          let sum = 0;
          for (const mpid of ap.monthPeriodIds) {
            sum += bankByPeriod.get(mpid)?.[field] ?? 0;
          }
          cells[ap.id] = sum;
        }
      }
      return cells;
    };

    // Helper: get classification field for all periods
    const classificationCells = (field: "interbank" | "owner"): Record<string, number> => {
      if (!classifications) return {};
      const cells: Record<string, number> = {};
      for (const p of periods) {
        cells[p.id] = classifications.get(p.id)?.[field] ?? 0;
      }
      for (const ap of aggregatePeriods) {
        let sum = 0;
        for (const mpid of ap.monthPeriodIds) {
          sum += classifications.get(mpid)?.[field] ?? 0;
        }
        cells[ap.id] = sum;
      }
      return cells;
    };

    // Bank change = closing - opening per period
    const bankChangeCells = (): Record<string, number> => {
      const cells: Record<string, number> = {};
      for (const p of periods) {
        const s = bankByPeriod.get(p.id);
        cells[p.id] = s ? s.closingBalance - s.openingBalance : 0;
      }
      for (const ap of aggregatePeriods) {
        const firstId = ap.monthPeriodIds[0];
        const lastId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
        const open = firstId ? (bankByPeriod.get(firstId)?.openingBalance ?? 0) : 0;
        const close = lastId ? (bankByPeriod.get(lastId)?.closingBalance ?? 0) : 0;
        cells[ap.id] = close - open;
      }
      return cells;
    };

    // Variance: GL ending cash - bank ending balance
    const glEndingCells = bc(p => calc.sumByLineItem(tb, "Cash and cash equivalents", p));
    const bankEndingCells = bankCells("closingBalance");
    const varianceCells: Record<string, number> = {};
    let allZero = true;
    for (const key of Object.keys(glEndingCells)) {
      if (key === "label") continue;
      const v = (glEndingCells[key] as number) - (bankEndingCells[key] as number);
      varianceCells[key] = v;
      if (Math.abs(v) > 0.01) allZero = false;
    }

    const rows: GridRow[] = [
      // ── Cash per GL ──
      { id: "hdr-gl", type: "section-header", label: "Cash per General Ledger", cells: { label: "Cash per General Ledger" } },
      { id: "cash-begin", type: "data", cells: { label: "Beginning Cash Balance", ...(() => {
        const cells: Record<string, number> = {};
        for (let i = 0; i < periods.length; i++) {
          cells[periods[i].id] = i === 0 ? 0 : calc.sumByLineItem(tb, "Cash and cash equivalents", periods[i - 1].id);
        }
        for (const ap of aggregatePeriods) {
          const firstPid = ap.monthPeriodIds[0];
          const idx = periods.findIndex(pp => pp.id === firstPid);
          cells[ap.id] = idx > 0 ? calc.sumByLineItem(tb, "Cash and cash equivalents", periods[idx - 1].id) : 0;
        }
        return cells;
      })() } },
      { id: "cash-end", type: "data", cells: { label: "Ending Cash Balance", ...glEndingCells } },
      { id: "cash-change", type: "subtotal", cells: { label: "Change in Cash (GL)", ...(() => {
        const cells: Record<string, number> = {};
        for (let i = 0; i < periods.length; i++) {
          const begin = i === 0 ? 0 : calc.sumByLineItem(tb, "Cash and cash equivalents", periods[i - 1].id);
          const end = calc.sumByLineItem(tb, "Cash and cash equivalents", periods[i].id);
          cells[periods[i].id] = end - begin;
        }
        for (const ap of aggregatePeriods) {
          const firstPid = ap.monthPeriodIds[0];
          const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
          const idx = periods.findIndex(pp => pp.id === firstPid);
          const beginCash = idx > 0 ? calc.sumByLineItem(tb, "Cash and cash equivalents", periods[idx - 1].id) : 0;
          const endCash = lastPid ? calc.sumByLineItem(tb, "Cash and cash equivalents", lastPid) : 0;
          cells[ap.id] = endCash - beginCash;
        }
        return cells;
      })() } },
      { id: "s1", type: "spacer", cells: {} },

      // ── Cash per Bank Statement ──
      { id: "hdr-bank", type: "section-header", label: "Cash per Bank Statement", cells: { label: "Cash per Bank Statement" } },
      { id: "bank-begin", type: "data", cells: { label: "Beginning Bank Balance", ...bankCells("openingBalance") } },
      { id: "bank-end", type: "data", cells: { label: "Ending Bank Balance", ...bankEndingCells } },
      { id: "bank-change", type: "subtotal", cells: { label: "Change in Cash (Bank)", ...bankChangeCells() } },
      { id: "s1b", type: "spacer", cells: {} },

      // ── Deposits ──
      { id: "hdr-deposits", type: "section-header", label: "Deposits per Bank Statement", cells: { label: "Deposits per Bank Statement" } },
      { id: "dep-total", type: "data", editable: true, cells: { label: "Total Deposits (Credits)", ...bankCells("totalCredits") } },
      { id: "s2", type: "spacer", cells: {} },

      // ── Transfers ──
      { id: "hdr-transfers", type: "section-header", label: "Less: Transfers", cells: { label: "Less: Transfers" } },
      { id: "xfer-interbank", type: "data", editable: true, indent: 1, cells: { label: "Interbank transfers", ...classificationCells("interbank") } },
      { id: "xfer-owner", type: "data", editable: true, indent: 1, cells: { label: "Owner transfers", ...classificationCells("owner") } },
      { id: "xfer-total", type: "subtotal", cells: { label: "Total transfers" } },
      { id: "s3", type: "spacer", cells: {} },

      // ── Operating cash receipts ──
      { id: "hdr-receipts", type: "section-header", label: "Operating Cash Receipts", cells: { label: "Operating Cash Receipts" } },
      { id: "op-receipts", type: "total", cells: { label: "Operating cash receipts" } },
      { id: "s4", type: "spacer", cells: {} },

      // ── Revenue per IS ──
      { id: "hdr-rev", type: "section-header", label: "Revenue per IS", cells: { label: "Revenue per IS" } },
      { id: "rev-is", type: "data", cells: { label: "Revenue per Income Statement", ...npc(p => calc.calcRevenue(tb, p)) } },
      { id: "s5", type: "spacer", cells: {} },

      // ── Disbursements ──
      { id: "hdr-disbursements", type: "section-header", label: "Disbursements per Bank Statement", cells: { label: "Disbursements per Bank Statement" } },
      { id: "disb-total", type: "data", editable: true, cells: { label: "Total Disbursements (Debits)", ...bankCells("totalDebits") } },
      { id: "s6", type: "spacer", cells: {} },

      // ── Expenses per IS ──
      { id: "hdr-exp", type: "section-header", label: "Expenses per IS", cells: { label: "Expenses per IS" } },
      { id: "exp-is", type: "data", cells: { label: "Expenses per Income Statement", ...pc(p =>
        calc.calcCOGS(tb, p) + calc.calcOpEx(tb, p) + calc.calcPayroll(tb, p) + calc.calcOtherExpense(tb, p)
      ) } },
      { id: "s7", type: "spacer", cells: {} },

      // ── Variance Analysis ──
      { id: "hdr-var", type: "section-header", label: "Variance Analysis", cells: { label: "Variance Analysis" } },
      { id: "gl-ending", type: "data", cells: { label: "GL Ending Cash", ...glEndingCells } },
      { id: "bank-ending-var", type: "data", cells: { label: "Bank Ending Balance", ...bankEndingCells } },
      { id: "variance", type: "check", checkPassed: allZero, cells: { label: "Variance (GL − Bank)", ...varianceCells } },
      { id: "net-income", type: "data", cells: { label: "Net Income per IS", ...npc(p => calc.calcNetIncome(tb, p)) } },
    ];

    return { columns, rows, frozenColumns: 1 };
  }, [dealData, bankByPeriod, classifications]);

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
            onClick={() => classify().catch(() => {})}
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
      {!isMock && classifications && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">
            Transfers classified by AI.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReviewOpen(true)}
          >
            Review Classifications
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
          bankStatements={liveBankStatements}
          onSave={updateClassifications}
        />
      )}
    </div>
  );
}
