import { useMemo } from "react";
import type { DealData } from "@/lib/workbook-types";
import { getReportDashboard } from "@/lib/reportDashboardMetrics";
import { ReportDashboardHeader } from "../shared/ReportDashboardHeader";
import { WorkbookTabView, REPORT_TYPE_TO_TAB_ID } from "@/components/workbook/WorkbookTabView";

interface GenericReportSectionProps {
  title: string;
  description?: string;
  data?: unknown; // legacy, unused — kept for callsite compatibility
  emptyMessage?: string;
  dealData?: DealData | null;
  reportType?: string;
}

/**
 * Generic report section — renders the corresponding workbook tab so the
 * wizard and workbook always show identical numbers. Wizard-only chrome
 * (title, description, dashboard cards) is preserved.
 */
export const GenericReportSection = ({
  title,
  description,
  dealData,
  reportType,
}: GenericReportSectionProps) => {
  const dashboard = useMemo(() => {
    if (!dealData || !reportType) return null;
    return getReportDashboard(reportType as any, dealData);
  }, [dealData, reportType]);

  const tabId = reportType ? REPORT_TYPE_TO_TAB_ID[reportType] : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-serif font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {dashboard && <ReportDashboardHeader config={dashboard} />}

      {tabId ? (
        <WorkbookTabView tabId={tabId} dealData={dealData ?? null} />
      ) : (
        <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          No workbook tab is configured for this report.
        </div>
      )}
    </div>
  );
};
