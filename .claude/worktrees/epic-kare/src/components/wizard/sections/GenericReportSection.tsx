import { Card, CardContent } from "@/components/ui/card";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { AlertCircle, FileSpreadsheet } from "lucide-react";

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
}

/**
 * Generic report section that displays spreadsheet data using SpreadsheetReportViewer.
 * Used for all formula-calculated report tabs.
 */
export const GenericReportSection = ({
  title,
  description,
  data,
  emptyMessage = "This report requires trial balance data. Complete the Core Data Entry steps to populate this report.",
}: GenericReportSectionProps) => {
  const reportData = data as ReportData;
  const hasRawData = reportData?.rawData && reportData.rawData.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

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
