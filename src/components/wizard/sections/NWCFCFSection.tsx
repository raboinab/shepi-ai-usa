import { Card, CardContent } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { DealParametersCard } from "../shared/DealParametersCard";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { TrendingUp, DollarSign, Calculator, FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  extractNWCMetrics,
  extractFCFMetrics,
  DealParameters,
  NWCExtractedMetrics,
} from "@/lib/nwcDataUtils";
import type { DealData } from "@/lib/workbook-types";

interface NWCFCFSectionProps {
  /** Legacy raw NWC analysis cache — kept only for the summary cards. */
  nwcAnalysisData?: { rawData?: string[][]; syncedAt?: string };
  /** Legacy raw FCF cache — kept only for the summary cards. */
  fcfData?: { rawData?: string[][] };
  periods?: Period[];
  fiscalYearEnd?: number;
  dealData?: DealData | null;
  dealParameters?: DealParameters;
  onUpdateDealParameters?: (params: DealParameters) => void;
}

const defaultDealParameters: DealParameters = {
  pegMethod: 't12m',
  customPegAmount: null,
  estimatedNWCAtClose: null,
};

export const NWCFCFSection = ({
  nwcAnalysisData,
  fcfData,
  periods = [],
  dealData,
  dealParameters = defaultDealParameters,
  onUpdateDealParameters,
}: NWCFCFSectionProps) => {
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  // Summary cards: derive from legacy caches if present (cheap visual hint);
  // the authoritative grids below come from the workbook builders.
  const nwcMetrics = extractNWCMetrics(nwcAnalysisData?.rawData);
  const fcfMetrics = extractFCFMetrics(fcfData?.rawData);
  const metrics: NWCExtractedMetrics = {
    ...nwcMetrics,
    ltmEBITDA: fcfMetrics.ltmEBITDA || nwcMetrics.ltmEBITDA,
    ltmCapEx: fcfMetrics.ltmCapEx || nwcMetrics.ltmCapEx,
    ltmFCF: fcfMetrics.ltmFCF || nwcMetrics.ltmFCF,
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
          Grids below render the exact same workbook tabs (Working Capital, NWC Analysis, Free Cash Flow). Edits to Trial Balance or Due Diligence Adjustments flow through automatically.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Current NWC" value={metrics.currentNWC} icon={DollarSign} subtitle={metrics.currentNWC === 0 ? "Sync to populate" : undefined} />
        <SummaryCard title="LTM EBITDA" value={metrics.ltmEBITDA} icon={TrendingUp} subtitle={metrics.ltmEBITDA === 0 ? "Sync to populate" : undefined} />
        <SummaryCard title="LTM CapEx" value={metrics.ltmCapEx} icon={Calculator} subtitle={metrics.ltmCapEx === 0 ? "Sync to populate" : undefined} />
        <SummaryCard title="LTM Free Cash Flow" value={metrics.ltmFCF} icon={DollarSign} subtitle={metrics.ltmFCF === 0 ? "Sync to populate" : undefined} />
      </div>

      <DealParametersCard
        metrics={metrics}
        dealParameters={dealParameters}
        onUpdateDealParameters={(params) => onUpdateDealParameters?.(params)}
      />

      {/* Workbook-equivalent grids — single source of truth */}
      <section className="space-y-3">
        <h3 className="text-lg font-serif font-semibold">Working Capital</h3>
        <WorkbookTabView tabId="working-capital" dealData={dealData ?? null} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-semibold">NWC Analysis</h3>
        <WorkbookTabView tabId="nwc-analysis" dealData={dealData ?? null} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-semibold">Free Cash Flow</h3>
        <WorkbookTabView tabId="free-cash-flow" dealData={dealData ?? null} />
      </section>
    </div>
  );
};
