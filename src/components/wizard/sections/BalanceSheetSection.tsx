import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Period } from "@/lib/periodUtils";
import { ReportDashboardHeader } from "../shared/ReportDashboardHeader";
import { RerunFinancialStatementButton } from "../shared/RerunFinancialStatementButton";
import type { DealData } from "@/lib/workbook-types";
import { getReportDashboard } from "@/lib/reportDashboardMetrics";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";

interface BalanceSheetSectionProps {
  data?: unknown; // legacy, unused
  periods?: Period[];
  fiscalYearEnd?: number;
  dealData?: DealData | null;
  projectId?: string;
}

export const BalanceSheetSection = ({ periods = [], dealData, projectId }: BalanceSheetSectionProps) => {
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  const dashboard = useMemo(() => {
    if (!dealData) return null;
    return getReportDashboard("balanceSheet", dealData);
  }, [dealData]);

  if (!hasPeriods) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Balance Sheet</h2>
          <p className="text-muted-foreground">Assets, liabilities, and equity positions by period</p>
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
      <div>
        <h2 className="text-2xl font-serif font-bold">Balance Sheet</h2>
        <p className="text-muted-foreground">Assets, liabilities, and equity positions by period</p>
      </div>

      {dashboard && <ReportDashboardHeader config={dashboard} />}

      <WorkbookTabView tabId="balance-sheet" dealData={dealData ?? null} />
    </div>
  );
};
