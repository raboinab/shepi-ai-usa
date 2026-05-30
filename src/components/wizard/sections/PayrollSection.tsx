import { SummaryCard } from "../shared/SummaryCard";
import { PayrollClassificationHelper, TrialBalanceAccount } from "../shared/PayrollClassificationHelper";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { Users, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import type { DealData } from "@/lib/workbook-types";

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

const extractMetrics = (rawData: string[][] | undefined) => {
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

export const PayrollSection = ({
  data,
  trialBalanceAccounts = [],
  onTrialBalanceChange,
  dealData,
}: PayrollSectionProps) => {
  const metrics = extractMetrics(data?.rawData);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Payroll & Related</h2>
        <p className="text-muted-foreground">
          Payroll expenses aggregated from Trial Balance accounts classified as "Payroll & Related"
        </p>
      </div>

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
