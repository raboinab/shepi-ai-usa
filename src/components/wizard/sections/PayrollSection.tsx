import { SummaryCard } from "../shared/SummaryCard";
import { PayrollClassificationHelper, TrialBalanceAccount } from "../shared/PayrollClassificationHelper";
import { PayrollSourceBadges } from "../shared/PayrollSourceBadges";
import { PayrollReconciliationCard } from "../shared/PayrollReconciliationCard";
import { PayrollRegisterDetail } from "../shared/PayrollRegisterDetail";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { Users, DollarSign, Briefcase, TrendingUp, AlertTriangle, FileUp } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import type { DealData } from "@/lib/workbook-types";
import {
  sumTbPayrollByCategory,
  sumRegisterByCategory,
  computeVariances,
  registerHasData,
  tbHasPayroll,
} from "@/lib/payrollReconciliation";

interface PayrollSectionProps {
  data?: { rawData?: string[][]; syncedAt?: string };
  periods?: Period[];
  fiscalYearEnd?: number;
  projectId: string;
  trialBalanceAccounts?: TrialBalanceAccount[];
  onTrialBalanceChange?: (accounts: TrialBalanceAccount[]) => void;
  dealData?: DealData | null;
}

const PAYROLL_KEYWORDS = ["salar", "wage", "payroll", "fica", "medicare", "futa", "suta", "401k", "benefit", "officer", "owner comp"];

export const PayrollSection = ({
  trialBalanceAccounts = [],
  onTrialBalanceChange,
  dealData,
}: PayrollSectionProps) => {
  const fallback = dealData?.payrollFallback ?? null;

  // ── source state ──────────────────────────────────────────────
  const tbPresent = tbHasPayroll(dealData);
  const regPresent = registerHasData(fallback);

  const tbTotals = sumTbPayrollByCategory(dealData);
  const regTotals = sumRegisterByCategory(fallback, dealData);

  const classifiedAccounts = trialBalanceAccounts.filter(
    a => a.subAccount1 === "Payroll & Related"
  );

  // Unclassified TB accounts that look payroll-related
  const unclassifiedSuspects = trialBalanceAccounts.filter(a => {
    if (a.fsType !== "IS") return false;
    if (a.subAccount1 === "Payroll & Related") return false;
    const n = (a.accountName || "").toLowerCase();
    return PAYROLL_KEYWORDS.some(kw => n.includes(kw));
  });

  const registerItemCount =
    (fallback?.salaryWages?.length || 0) +
    (fallback?.ownerCompensation?.length || 0) +
    (fallback?.payrollTaxes?.length || 0) +
    (fallback?.benefits?.length || 0);

  // ── summary metrics (prefer register since it's the more granular source) ──
  const primary = regPresent ? regTotals : tbTotals;
  const base = primary.salaryWages + primary.ownerCompensation;
  const metrics = {
    totalPayroll: primary.total,
    payrollTaxRate: base > 0 ? (primary.payrollTaxes / base) * 100 : 0,
    benefitRate: base > 0 ? (primary.benefits / base) * 100 : 0,
    ownerComp: primary.ownerCompensation,
  };

  const showReconciliation = tbPresent && regPresent;
  const showEmptyState = !tbPresent && !regPresent;

  // LTM period ids for the register detail
  const ltmAgg = (dealData?.deal.aggregatePeriods || []).find(
    a => a.id.startsWith("agg-ltm-") || /LTM/i.test(a.label)
  );
  const ltmPeriodIds = ltmAgg?.monthPeriodIds || dealData?.deal.periods.map(p => p.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Payroll & Related</h2>
        <p className="text-muted-foreground">
          Two sources can feed payroll: classified Trial Balance accounts (the books) and an uploaded
          payroll register (the detail). When both are present, we reconcile them below.
        </p>
      </div>

      {/* Source pills */}
      <PayrollSourceBadges
        tbAccountCount={classifiedAccounts.length}
        tbLtmTotal={tbTotals.total}
        registerDocName={null}
        registerLtmTotal={regTotals.total}
        registerItemCount={registerItemCount}
      />

      {/* Empty state */}
      {showEmptyState && (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-2 bg-muted/30">
          <FileUp className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">No payroll data yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Either classify Trial Balance accounts as "Payroll &amp; Related" below, or upload a
            payroll register from <span className="font-mono">Documents → Payroll Reports</span>.
            Doing both lets us reconcile the two.
          </p>
        </div>
      )}

      {/* Suggestion: unclassified suspects */}
      {!showEmptyState && unclassifiedSuspects.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30 dark:border-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-900 dark:text-amber-100">
            <strong>{unclassifiedSuspects.length}</strong> TB account
            {unclassifiedSuspects.length === 1 ? "" : "s"} may be payroll-related but
            {unclassifiedSuspects.length === 1 ? " isn't" : " aren't"} classified yet:{" "}
            <span className="font-medium">
              {unclassifiedSuspects.slice(0, 3).map(a => a.accountName).join(", ")}
              {unclassifiedSuspects.length > 3 ? `, +${unclassifiedSuspects.length - 3} more` : ""}
            </span>
            . Review the classification helper below.
          </p>
        </div>
      )}

      {/* Register-only hint */}
      {regPresent && !tbPresent && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-muted-foreground">
            No TB accounts are classified as "Payroll &amp; Related". The workbook is using your
            uploaded register as the source — classify TB accounts below to enable side-by-side
            reconciliation against the books.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Payroll (LTM)" value={metrics.totalPayroll} icon={DollarSign} />
        <SummaryCard title="Payroll Tax Rate" value={`${metrics.payrollTaxRate.toFixed(1)}%`} icon={Briefcase} subtitle="% of wages" />
        <SummaryCard title="Benefit Rate" value={`${metrics.benefitRate.toFixed(1)}%`} icon={Users} subtitle="% of wages" />
        <SummaryCard title="Owner Compensation" value={metrics.ownerComp} icon={TrendingUp} />
      </div>

      {/* Reconciliation card */}
      {showReconciliation && (
        <PayrollReconciliationCard rows={computeVariances(regTotals, tbTotals)} />
      )}

      {/* TB classification helper */}
      {trialBalanceAccounts.length > 0 && onTrialBalanceChange && (
        <PayrollClassificationHelper
          trialBalanceAccounts={trialBalanceAccounts}
          onTrialBalanceChange={onTrialBalanceChange}
        />
      )}

      {/* Workbook grid */}
      <WorkbookTabView tabId="payroll" dealData={dealData ?? null} />
      <p className="text-xs text-muted-foreground -mt-2">
        The Workbook grid above shows the Trial Balance roll-up when payroll accounts are classified;
        otherwise it falls back to the uploaded register. The reconciliation above compares the two
        independently.
      </p>

      {/* Detailed register breakdown */}
      {regPresent && fallback && (
        <PayrollRegisterDetail fallback={fallback} periodIds={ltmPeriodIds} />
      )}
    </div>
  );
};
