import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { DealParametersCard } from "../shared/DealParametersCard";
import { TrendingUp, DollarSign, Calculator, FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  extractNWCMetrics,
  extractFCFMetrics,
  DealParameters,
  NWCExtractedMetrics,
} from "@/lib/nwcDataUtils";

interface NWCFCFSectionProps {
  data: {
    rawData?: string[][];
    syncedAt?: string;
  };
  fcfData?: {
    rawData?: string[][];
  };
  periods?: Period[];
  fiscalYearEnd?: number;
  dealParameters?: DealParameters;
  onUpdateDealParameters?: (params: DealParameters) => void;
}

const defaultDealParameters: DealParameters = {
  pegMethod: 't12m',
  customPegAmount: null,
  estimatedNWCAtClose: null,
};

export const NWCFCFSection = ({ 
  data, 
  fcfData,
  periods = [],
  fiscalYearEnd = 12,
  dealParameters = defaultDealParameters,
  onUpdateDealParameters,
}: NWCFCFSectionProps) => {
  const hasRawData = data?.rawData && Array.isArray(data.rawData) && data.rawData.length > 0;
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  // Extract metrics from raw data
  const nwcMetrics = extractNWCMetrics(data?.rawData);
  const fcfMetrics = extractFCFMetrics(fcfData?.rawData);
  
  // Combine metrics - prefer FCF tab for EBITDA/CapEx/FCF if available
  const metrics: NWCExtractedMetrics = {
    ...nwcMetrics,
    ltmEBITDA: fcfMetrics.ltmEBITDA || nwcMetrics.ltmEBITDA,
    ltmCapEx: fcfMetrics.ltmCapEx || nwcMetrics.ltmCapEx,
    ltmFCF: fcfMetrics.ltmFCF || nwcMetrics.ltmFCF,
  };

  const handleUpdateDealParameters = (params: DealParameters) => {
    if (onUpdateDealParameters) {
      onUpdateDealParameters(params);
    }
  };

  if (!hasPeriods) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">NWC & FCF Analysis</h2>
          <p className="text-muted-foreground">Analyze net working capital trends and free cash flow</p>
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
        <h2 className="text-2xl font-serif font-bold">NWC & FCF Analysis</h2>
        <p className="text-muted-foreground">Net working capital trends and free cash flow analysis</p>
      </div>

      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          This report is calculated from the spreadsheet. Edit the Trial Balance or Due Diligence Adjustments to change underlying values.
        </AlertDescription>
      </Alert>

      {/* Summary Cards with actual data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Current NWC" 
          value={metrics.currentNWC} 
          icon={DollarSign}
          subtitle={metrics.currentNWC === 0 ? "Sync to populate" : undefined}
        />
        <SummaryCard 
          title="LTM EBITDA" 
          value={metrics.ltmEBITDA} 
          icon={TrendingUp}
          subtitle={metrics.ltmEBITDA === 0 ? "Sync to populate" : undefined}
        />
        <SummaryCard 
          title="LTM CapEx" 
          value={metrics.ltmCapEx} 
          icon={Calculator}
          subtitle={metrics.ltmCapEx === 0 ? "Sync to populate" : undefined}
        />
        <SummaryCard 
          title="LTM Free Cash Flow" 
          value={metrics.ltmFCF} 
          icon={DollarSign}
          subtitle={metrics.ltmFCF === 0 ? "Sync to populate" : undefined}
        />
      </div>

      {/* Deal Parameters Card */}
      <DealParametersCard
        metrics={metrics}
        dealParameters={dealParameters}
        onUpdateDealParameters={handleUpdateDealParameters}
      />

      {/* Spreadsheet Report */}
      {hasRawData ? (
        <SpreadsheetReportViewer
          rawData={data.rawData!}
          title="NWC & Free Cash Flow Analysis"
          syncedAt={data.syncedAt}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>NWC & FCF Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No NWC & FCF data synced yet</p>
              <p className="text-sm text-muted-foreground">
                Sync from the spreadsheet to view the calculated NWC and free cash flow analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
