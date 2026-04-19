import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";

interface IncomeStatementData {
  rawData?: string[][];
  syncedAt?: string;
  source?: string;
}

interface IncomeStatementSectionProps {
  data: IncomeStatementData;
  periods?: Period[];
  fiscalYearEnd?: number;
}

export const IncomeStatementSection = ({ 
  data, 
  periods = [], 
  fiscalYearEnd = 12 
}: IncomeStatementSectionProps) => {
  const hasRawData = data?.rawData && data.rawData.length > 0;
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

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

  if (!hasRawData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Income Statement</h2>
          <p className="text-muted-foreground">Revenue, expenses, and profitability metrics by period</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No data available</p>
            <p className="text-sm mt-1">Sync data from your spreadsheet to view the Income Statement report.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Income Statement</h2>
        <p className="text-muted-foreground">Revenue, expenses, and profitability metrics by period</p>
      </div>

      <SpreadsheetReportViewer
        rawData={data.rawData!}
        title="Income Statement"
        syncedAt={data.syncedAt}
        skipEmptyRows
      />
    </div>
  );
};
