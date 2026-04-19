import { Card, CardContent } from "@/components/ui/card";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { ReportDashboardHeader } from "../shared/ReportDashboardHeader";
import { FileSpreadsheet } from "lucide-react";
import type { DealData } from "@/lib/workbook-types";
import { getReportDashboard } from "@/lib/reportDashboardMetrics";
import { useMemo } from "react";

interface ReportData {
  rawData?: string[][];
  syncedAt?: string;
  source?: string;
}

interface GenericReportSectionProps {
  title: string;
  description?: string;
  data: ReportData | Record<string, unknown>;
  emptyMessage?: string;
  dealData?: DealData | null;
  reportType?: string;
}

/**
 * Generic report section that displays spreadsheet data using SpreadsheetReportViewer.
 * When dealData and reportType are provided, renders a dashboard header with summary cards + charts.
 */
export const GenericReportSection = ({
  title,
  description,
  data,
  emptyMessage = "This report requires trial balance data. Complete the Core Data Entry steps to populate this report.",
  dealData,
  reportType,
}: GenericReportSectionProps) => {
  const reportData = data as ReportData;
  const hasRawData = reportData?.rawData && reportData.rawData.length > 0;

  const dashboard = useMemo(() => {
    if (!dealData || !reportType) return null;
    return getReportDashboard(reportType as any, dealData);
  }, [dealData, reportType]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-serif font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {dashboard && <ReportDashboardHeader config={dashboard} />}

      {hasRawData ? (
        <SpreadsheetReportViewer
          rawData={reportData.rawData!}
          syncedAt={reportData.syncedAt}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Enter your Chart of Accounts and Trial Balance to generate this report automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
