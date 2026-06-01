import { Card, CardContent } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { DealParametersCard } from "../shared/DealParametersCard";
import { NWCMethodSelector } from "../shared/NWCMethodSelector";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { TrendingUp, DollarSign, Calculator, FileSpreadsheet } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DealParameters,
  NWCExtractedMetrics,
  DEFAULT_NWC_METHOD,
} from "@/lib/nwcDataUtils";
import type { DealData, NWCMethod } from "@/lib/workbook-types";
import * as calc from "@/lib/calculations";


interface NWCFCFSectionProps {
  /** Legacy raw NWC analysis cache — kept for prop compatibility, no longer used for cards. */
  nwcAnalysisData?: { rawData?: string[][]; syncedAt?: string };
  /** Legacy raw FCF cache — kept for prop compatibility, no longer used for cards. */
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
  nwcMethod: DEFAULT_NWC_METHOD,
};


export const NWCFCFSection = ({
  periods = [],
  dealData,
  dealParameters = defaultDealParameters,
  onUpdateDealParameters,
}: NWCFCFSectionProps) => {
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  // Live metrics — computed from dealData using the selected NWC method so
  // toggling the selector updates the headline numbers along with the grids.
  const metrics: NWCExtractedMetrics = (() => {
    const empty: NWCExtractedMetrics = {
      currentNWC: 0, t3mAvg: 0, t6mAvg: 0, t12mAvg: 0,
      ltmEBITDA: 0, ltmCapEx: 0, ltmFCF: 0,
    };
    if (!dealData || regularPeriods.length === 0) return empty;

    const tb = dealData.trialBalance;
    const adj = dealData.adjustments ?? [];
    const ab = dealData.addbacks;
    const cfg = dealData.deal.nwcConfig;

    // Use the project's actual periods (sorted by deal config) so NWC at each
    // period and the prior period (for change-in-NWC) line up with the grids.
    const dealPeriods = dealData.deal.periods.filter(p => !p.isStub);
    if (dealPeriods.length === 0) return empty;

    const nwcValues = dealPeriods.map(p => calc.calcNWCByMethod(tb, p.id, cfg));
    const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
    const currentNWC = nwcValues[nwcValues.length - 1] ?? 0;
    const t3mAvg = avg(nwcValues.slice(-3));
    const t6mAvg = avg(nwcValues.slice(-6));
    const t12mAvg = avg(nwcValues.slice(-12));

    const ltmPeriods = dealPeriods.slice(-12);
    // TB convention: income lines are stored negative. Negate to display as a positive number,
    // matching the Free Cash Flow / EBITDA Bridge grids which wrap this in negatedPeriodCells().
    const ltmEBITDA = ltmPeriods.reduce((s, p) => s - calc.calcAdjustedEBITDA(tb, adj, p.id, ab), 0);

    // FCF mirrors the workbook FCF tab: -AdjEBITDA - ΔNWC - taxes. CapEx is
    // sourced from bank classifications (Proof of Cash) and not available here,
    // so we omit it from the operating-FCF approximation shown in the headline.
    let ltmFCF = 0;
    for (let i = 0; i < ltmPeriods.length; i++) {
      const p = ltmPeriods[i];
      const idxInAll = dealPeriods.findIndex(x => x.id === p.id);
      const prev = idxInAll > 0 ? dealPeriods[idxInAll - 1] : null;
      const nwcChange = prev
        ? calc.calcNWCByMethod(tb, p.id, cfg) - calc.calcNWCByMethod(tb, prev.id, cfg)
        : 0;
      ltmFCF +=
        -calc.calcAdjustedEBITDA(tb, adj, p.id, ab)
        - nwcChange
        - calc.calcIncomeTaxExpense(tb, p.id, ab?.taxes);
    }

    return { currentNWC, t3mAvg, t6mAvg, t12mAvg, ltmEBITDA, ltmCapEx: 0, ltmFCF };
  })();

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

      <NWCMethodSelector
        method={(dealParameters.nwcMethod ?? DEFAULT_NWC_METHOD) as NWCMethod}
        onChange={(m) => onUpdateDealParameters?.({ ...dealParameters, nwcMethod: m })}
      />


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Current NWC" value={metrics.currentNWC} icon={DollarSign} subtitle={metrics.currentNWC === 0 ? "Sync to populate" : undefined} />
        <SummaryCard title="LTM EBITDA" value={metrics.ltmEBITDA} icon={TrendingUp} subtitle={metrics.ltmEBITDA === 0 ? "Sync to populate" : undefined} />
        <SummaryCard title="LTM CapEx" value={metrics.ltmCapEx} icon={Calculator} subtitle="From Proof of Cash classifications" />
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
