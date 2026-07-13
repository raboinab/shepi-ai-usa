import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Period } from "@/lib/periodUtils";
import { ReportDashboardHeader } from "../shared/ReportDashboardHeader";
import { RerunFinancialStatementButton } from "../shared/RerunFinancialStatementButton";
import type { DealData } from "@/lib/workbook-types";
import { getReportDashboard } from "@/lib/reportDashboardMetrics";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";

interface IncomeStatementSectionProps {
  data?: unknown; // legacy, unused
  periods?: Period[];
  fiscalYearEnd?: number;
  dealData?: DealData | null;
  projectId?: string;
}

export const IncomeStatementSection = ({ periods = [], dealData, projectId }: IncomeStatementSectionProps) => {
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  const dashboard = useMemo(() => {
    if (!dealData) return null;
    return getReportDashboard("incomeStatement", dealData);
  }, [dealData]);

  if (!hasPeriods) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Income Statement</h2>
          <p className="text-muted-foreground">Revenue, expenses, and profitability metrics by period</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Please configure periods in the Company Info section first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Income Statement</h2>
          <p className="text-muted-foreground">Revenue, expenses, and profitability metrics by period</p>
        </div>
        {projectId && (
          <RerunFinancialStatementButton projectId={projectId} docType="income_statement" />
        )}
      </div>

      {dashboard && <ReportDashboardHeader config={dashboard} />}

      <WorkbookTabView tabId="income-statement" dealData={dealData ?? null} />
    </div>
  );
};
