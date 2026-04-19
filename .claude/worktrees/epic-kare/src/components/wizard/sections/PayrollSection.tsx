import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { PayrollClassificationHelper, TrialBalanceAccount } from "../shared/PayrollClassificationHelper";
import { Users, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { Period } from "@/lib/periodUtils";

interface PayrollData {
  rawData?: string[][];
  syncedAt?: string;
  source?: string;
}

interface PayrollSectionProps {
  data: PayrollData;
  periods?: Period[];
  fiscalYearEnd?: number;
  projectId: string;
  // Classification helper props
  trialBalanceAccounts?: TrialBalanceAccount[];
  onTrialBalanceChange?: (accounts: TrialBalanceAccount[]) => void;
}

/**
 * Parse numeric value from sheet cell (handles currency, parens for negative)
 */
const parseSheetNumber = (value: string | undefined | null): number => {
  if (!value || typeof value !== 'string') return 0;
  const clean = value.replace(/[$,]/g, '').trim();
  const isNegative = clean.includes('(') || clean.startsWith('-');
  const num = parseFloat(clean.replace(/[()$-]/g, ''));
  return isNaN(num) ? 0 : (isNegative ? -num : num);
};

/**
 * Extract summary metrics from rawData
 * Looks for rows containing "Total" or specific labels
 */
const extractMetrics = (rawData: string[][] | undefined) => {
  if (!rawData || rawData.length === 0) {
    return { totalPayroll: 0, payrollTaxRate: 0, benefitRate: 0, ownerComp: 0 };
  }

  let totalPayroll = 0;
  let salaryWages = 0;
  let payrollTaxes = 0;
  let benefits = 0;
  let ownerComp = 0;

  for (const row of rawData) {
    const label = (row[0] || '').toLowerCase();
    // Get the last numeric column (usually LTM or total)
    const lastValue = row.length > 1 ? parseSheetNumber(row[row.length - 1]) : 0;
    
    if (label.includes('total payroll') || label.includes('total salary') || label === 'total') {
      totalPayroll = lastValue;
    }
    if (label.includes('salary') || label.includes('wages')) {
      salaryWages += lastValue;
    }
    if (label.includes('payroll tax') || label.includes('fica') || label.includes('medicare') || label.includes('futa') || label.includes('suta')) {
      payrollTaxes += lastValue;
    }
    if (label.includes('benefit') || label.includes('health') || label.includes('401k') || label.includes('retirement')) {
      benefits += lastValue;
    }
    if (label.includes('officer') || label.includes('owner')) {
      ownerComp += lastValue;
    }
  }

  // Calculate rates
  const base = salaryWages || totalPayroll;
  const payrollTaxRate = base > 0 ? (payrollTaxes / base) * 100 : 0;
  const benefitRate = base > 0 ? (benefits / base) * 100 : 0;

  return {
    totalPayroll: totalPayroll || (salaryWages + payrollTaxes + benefits),
    payrollTaxRate,
    benefitRate,
    ownerComp,
  };
};

export const PayrollSection = ({
  data,
  periods = [],
  fiscalYearEnd = 12,
  projectId,
  trialBalanceAccounts = [],
  onTrialBalanceChange,
}: PayrollSectionProps) => {
  const hasRawData = data?.rawData && data.rawData.length > 0;
  const metrics = extractMetrics(data?.rawData);

  // Count how many TB accounts are classified as Payroll & Related
  const classifiedCount = trialBalanceAccounts.filter(
    acc => acc.subAccount1 === 'Payroll & Related'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Payroll & Related</h2>
        <p className="text-muted-foreground">
          Payroll expenses aggregated from Trial Balance accounts classified as "Payroll & Related"
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Payroll (LTM)"
          value={metrics.totalPayroll}
          icon={DollarSign}
        />
        <SummaryCard
          title="Payroll Tax Rate"
          value={`${metrics.payrollTaxRate.toFixed(1)}%`}
          icon={Briefcase}
          subtitle="% of wages"
        />
        <SummaryCard
          title="Benefit Rate"
          value={`${metrics.benefitRate.toFixed(1)}%`}
          icon={Users}
          subtitle="% of wages"
        />
        <SummaryCard
          title="Owner Compensation"
          value={metrics.ownerComp}
          icon={TrendingUp}
        />
      </div>

      {/* Classification Helper - only show if we have TB data and a handler */}
      {trialBalanceAccounts.length > 0 && onTrialBalanceChange && (
        <PayrollClassificationHelper
          trialBalanceAccounts={trialBalanceAccounts}
          onTrialBalanceChange={onTrialBalanceChange}
        />
      )}

      {/* Payroll Report from Sheet */}
      {hasRawData ? (
        <SpreadsheetReportViewer
          rawData={data.rawData!}
          title="Payroll & Related Report"
          syncedAt={data.syncedAt}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Report</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {classifiedCount > 0
                ? `${classifiedCount} account(s) classified as "Payroll & Related". Sync from the spreadsheet to view the aggregated report.`
                : 'No payroll data available. Classify Trial Balance accounts above, then sync from the spreadsheet.'}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        The Payroll report is calculated by the spreadsheet from Trial Balance accounts where subAccount1 = "Payroll & Related".
        Use the classification helper above to ensure all payroll-related accounts are included.
      </p>
    </div>
  );
};
