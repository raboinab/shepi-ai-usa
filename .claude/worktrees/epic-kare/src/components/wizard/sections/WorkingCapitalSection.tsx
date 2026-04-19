import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { Wallet, Calculator, FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as calc from "@/lib/calculations";
import type { DealData } from "@/lib/workbook-types";

interface WorkingCapitalSectionProps {
  data: {
    rawData?: string[][];
    syncedAt?: string;
  };
  periods?: Period[];
  fiscalYearEnd?: number;
  dealData?: DealData;
}

export const WorkingCapitalSection = ({
  data,
  periods = [],
  fiscalYearEnd = 12,
  dealData,
}: WorkingCapitalSectionProps) => {
  const hasRawData = data?.rawData && Array.isArray(data.rawData) && data.rawData.length > 0;
  const hasPeriods = periods.filter(p => !p.isStub).length > 0;

  const extractMetrics = () => {
    if (!dealData) return { currentNWC: 0, t3mAvg: 0, t6mAvg: 0, t12mAvg: 0 };

    const tb = dealData.trialBalance;
    const activePeriods = periods.filter(p => !p.isStub);
    if (activePeriods.length === 0) return { currentNWC: 0, t3mAvg: 0, t6mAvg: 0, t12mAvg: 0 };

    const nwcValues = activePeriods.map(p => calc.calcNWCExCash(tb, p.id));

    const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const currentNWC = nwcValues[nwcValues.length - 1] ?? 0;
    const t3mAvg = avg(nwcValues.slice(-3));
    const t6mAvg = avg(nwcValues.slice(-6));
    const t12mAvg = avg(nwcValues.slice(-12));

    return { currentNWC, t3mAvg, t6mAvg, t12mAvg };
  };

  const { currentNWC, t3mAvg, t6mAvg, t12mAvg } = extractMetrics();

  if (!hasPeriods) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Working Capital</h2>
          <p className="text-muted-foreground">Analyze current assets and liabilities for working capital calculation</p>
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
        <h2 className="text-2xl font-serif font-bold">Working Capital</h2>
        <p className="text-muted-foreground">Current assets and liabilities analysis (excluding cash and debt)</p>
      </div>

      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          This report is calculated from the spreadsheet. Edit the Trial Balance to change underlying values.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="NWC ex. Cash (Latest)" value={currentNWC} icon={Wallet} />
        <SummaryCard title="T3M Average" value={t3mAvg} icon={Calculator} />
        <SummaryCard title="T6M Average" value={t6mAvg} icon={Calculator} />
        <SummaryCard title="T12M Average" value={t12mAvg} icon={Calculator} />
      </div>

      {hasRawData ? (
        <SpreadsheetReportViewer
          rawData={data.rawData!}
          title="Working Capital Analysis"
          syncedAt={data.syncedAt}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Working Capital Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No Working Capital data synced yet</p>
              <p className="text-sm text-muted-foreground">
                Sync from the spreadsheet to view the calculated working capital analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
