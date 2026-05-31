import { SummaryCard } from "../shared/SummaryCard";
import { PayrollClassificationHelper, TrialBalanceAccount } from "../shared/PayrollClassificationHelper";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { Users, DollarSign, Briefcase, TrendingUp, Info } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import type { DealData, PayrollFallbackData } from "@/lib/workbook-types";

interface PayrollSectionProps {
  data?: { rawData?: string[][]; syncedAt?: string };
  periods?: Period[];
  fiscalYearEnd?: number;
  projectId: string;
  trialBalanceAccounts?: TrialBalanceAccount[];
  onTrialBalanceChange?: (accounts: TrialBalanceAccount[]) => void;
  dealData?: DealData | null;
}

const parseSheetNumber = (value: string | undefined | null): number => {
  if (!value || typeof value !== 'string') return 0;
  const clean = value.replace(/[$,]/g, '').trim();
  const isNegative = clean.includes('(') || clean.startsWith('-');
  const num = parseFloat(clean.replace(/[()$-]/g, ''));
  return isNaN(num) ? 0 : (isNegative ? -num : num);
};

const extractMetricsFromRawData = (rawData: string[][] | undefined) => {
  if (!rawData || rawData.length === 0) {
    return { totalPayroll: 0, payrollTaxRate: 0, benefitRate: 0, ownerComp: 0 };
  }
  let totalPayroll = 0, salaryWages = 0, payrollTaxes = 0, benefits = 0, ownerComp = 0;
  for (const row of rawData) {
    const label = (row[0] || '').toLowerCase();
    const lastValue = row.length > 1 ? parseSheetNumber(row[row.length - 1]) : 0;
    if (label.includes('total payroll') || label.includes('total salary') || label === 'total') totalPayroll = lastValue;
    if (label.includes('salary') || label.includes('wages')) salaryWages += lastValue;
    if (label.includes('payroll tax') || label.includes('fica') || label.includes('medicare') || label.includes('futa') || label.includes('suta')) payrollTaxes += lastValue;
    if (label.includes('benefit') || label.includes('health') || label.includes('401k') || label.includes('retirement')) benefits += lastValue;
    if (label.includes('officer') || label.includes('owner')) ownerComp += lastValue;
  }
  const base = salaryWages || totalPayroll;
  return {
    totalPayroll: totalPayroll || (salaryWages + payrollTaxes + benefits),
    payrollTaxRate: base > 0 ? (payrollTaxes / base) * 100 : 0,
    benefitRate: base > 0 ? (benefits / base) * 100 : 0,
    ownerComp,
  };
};

const sumItems = (items: Array<{ monthlyValues: Record<string, number> }> | undefined) =>
  (items || []).reduce(
    (s, it) => s + Object.values(it.monthlyValues || {}).reduce((a, b) => a + (b || 0), 0),
    0
  );

const extractMetricsFromFallback = (fb: PayrollFallbackData) => {
  const salaryWages = sumItems(fb.salaryWages);
  const payrollTaxes = sumItems(fb.payrollTaxes);
  const benefits = sumItems(fb.benefits);
  const ownerComp = sumItems(fb.ownerCompensation);
  const totalPayroll = salaryWages + payrollTaxes + benefits + ownerComp;
  const base = salaryWages + ownerComp;
  return {
    totalPayroll,
    payrollTaxRate: base > 0 ? (payrollTaxes / base) * 100 : 0,
    benefitRate: base > 0 ? (benefits / base) * 100 : 0,
    ownerComp,
  };
};

export const PayrollSection = ({
  data,
  trialBalanceAccounts = [],
  onTrialBalanceChange,
  dealData,
}: PayrollSectionProps) => {
  const hasRawData = !!(data?.rawData && data.rawData.length > 0);
  const fallback = dealData?.payrollFallback;
  const usingFallback = !hasRawData && !!fallback;

  const metrics = hasRawData
    ? extractMetricsFromRawData(data!.rawData)
    : fallback
    ? extractMetricsFromFallback(fallback)
    : { totalPayroll: 0, payrollTaxRate: 0, benefitRate: 0, ownerComp: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Payroll & Related</h2>
        <p className="text-muted-foreground">
          Payroll expenses aggregated from Trial Balance accounts classified as "Payroll & Related"
        </p>
      </div>

      {usingFallback && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-muted-foreground">
            Showing extracted payroll from your uploaded payroll register.
            Classify Trial Balance accounts as "Payroll & Related" below to use TB data instead.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Payroll (LTM)" value={metrics.totalPayroll} icon={DollarSign} />
        <SummaryCard title="Payroll Tax Rate" value={`${metrics.payrollTaxRate.toFixed(1)}%`} icon={Briefcase} subtitle="% of wages" />
        <SummaryCard title="Benefit Rate" value={`${metrics.benefitRate.toFixed(1)}%`} icon={Users} subtitle="% of wages" />
        <SummaryCard title="Owner Compensation" value={metrics.ownerComp} icon={TrendingUp} />
      </div>

      {trialBalanceAccounts.length > 0 && onTrialBalanceChange && (
        <PayrollClassificationHelper
          trialBalanceAccounts={trialBalanceAccounts}
          onTrialBalanceChange={onTrialBalanceChange}
        />
      )}

      <WorkbookTabView tabId="payroll" dealData={dealData ?? null} />

      <p className="text-xs text-muted-foreground">
        The Payroll grid above is the same one rendered in the Workbook. Use the classification helper to add Trial Balance accounts to "Payroll & Related" — they will flow into the grid automatically.
      </p>
    </div>
  );
};
