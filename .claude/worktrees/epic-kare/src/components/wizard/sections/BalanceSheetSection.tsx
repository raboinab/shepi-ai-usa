import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";

interface BalanceSheetData {
  rawData?: string[][];
  syncedAt?: string;
  source?: string;
}

interface BalanceSheetSectionProps {
  data: BalanceSheetData;
  periods?: Period[];
  fiscalYearEnd?: number;
}

export const BalanceSheetSection = ({ 
  data, 
  periods = [],
  fiscalYearEnd = 12,
}: BalanceSheetSectionProps) => {
  const hasRawData = data?.rawData && data.rawData.length > 0;
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

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

  if (!hasRawData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Balance Sheet</h2>
          <p className="text-muted-foreground">Assets, liabilities, and equity positions by period</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No data available</p>
            <p className="text-sm mt-1">Sync data from your spreadsheet to view the Balance Sheet report.</p>
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

      <SpreadsheetReportViewer
        rawData={data.rawData!}
        title="Balance Sheet"
        syncedAt={data.syncedAt}
        skipEmptyRows
      />
    </div>
  );
};
