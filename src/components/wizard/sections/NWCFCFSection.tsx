import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { GenericReportSection } from "./GenericReportSection";
import { DealParametersCard } from "../shared/DealParametersCard";
import { TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Period } from "@/lib/periodUtils";
import * as calc from "@/lib/calculations";
import type { DealData } from "@/lib/workbook-types";
import type { DealParameters, NWCExtractedMetrics } from "@/lib/nwcDataUtils";

interface NWCFCFSectionProps {
  nwcAnalysisData: {
    rawData?: string[][];
    syncedAt?: string;
  };
  fcfData: {
    rawData?: string[][];
    syncedAt?: string;
  };
  periods?: Period[];
  fiscalYearEnd?: number;
  dealData?: DealData;
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
  fiscalYearEnd = 12,
  dealData,
  dealParameters = defaultDealParameters,
  onUpdateDealParameters,
}: NWCFCFSectionProps) => {
  const regularPeriods = periods.filter(p => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;

  // Compute metrics live from DealData (matching WorkingCapitalSection & FreeCashFlowTab)
  const metrics = useMemo((): NWCExtractedMetrics => {
    const defaults: NWCExtractedMetrics = {
      currentNWC: 0, t3mAvg: 0, t6mAvg: 0, t12mAvg: 0,
      ltmEBITDA: 0, ltmCapEx: 0, ltmFCF: 0,
    };

    if (!dealData || regularPeriods.length === 0) return defaults;

    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const activePeriods = dealData.deal.periods.filter(p => !p.isStub);

    if (activePeriods.length === 0) return defaults;

    // NWC values per period
    const nwcValues = activePeriods.map(p => calc.calcNWCExCash(tb, p.id));
    const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const currentNWC = nwcValues[nwcValues.length - 1] ?? 0;
    const t3mAvg = avg(nwcValues.slice(-3));
    const t6mAvg = avg(nwcValues.slice(-6));
    const t12mAvg = avg(nwcValues.slice(-12));

    // LTM periods (last 12)
    const ltmPeriods = activePeriods.slice(-12);

    // LTM Adjusted EBITDA — stored negative in TB when profitable, negate for display
    const ltmEBITDA = -ltmPeriods.reduce(
      (sum, p) => sum + calc.calcAdjustedEBITDA(tb, adj, p.id, ab), 0
    );

    // LTM CapEx — no TB-derived CapEx exists (manual/editable), matches FreeCashFlowTab
    const ltmCapEx = 0;

    // LTM FCF = Adj EBITDA - ΔNWC - Taxes (matching FreeCashFlowTab formula)
    const ltmFCF = ltmPeriods.reduce((sum, p, i) => {
      const pIdx = activePeriods.indexOf(p);
      const nwcChange = pIdx > 0
        ? calc.calcNWCExCash(tb, p.id) - calc.calcNWCExCash(tb, activePeriods[pIdx - 1].id)
        : 0;
      const adjEbitda = -calc.calcAdjustedEBITDA(tb, adj, p.id, ab);
      const taxes = calc.calcIncomeTaxExpense(tb, p.id, ab.taxes);
      return sum + adjEbitda - nwcChange - taxes;
    }, 0);

    return { currentNWC, t3mAvg, t6mAvg, t12mAvg, ltmEBITDA, ltmCapEx, ltmFCF };
  }, [dealData, regularPeriods]);

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

      {/* Summary Cards with live-computed data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Current NWC" 
          value={metrics.currentNWC} 
          icon={DollarSign}
        />
        <SummaryCard 
          title="LTM EBITDA" 
          value={metrics.ltmEBITDA} 
          icon={TrendingUp}
        />
        <SummaryCard 
          title="LTM CapEx" 
          value={metrics.ltmCapEx} 
          icon={Calculator}
          subtitle="Manual entry in workbook"
        />
        <SummaryCard 
          title="LTM Free Cash Flow" 
          value={metrics.ltmFCF} 
          icon={DollarSign}
        />
      </div>

      {/* Deal Parameters Card */}
      <DealParametersCard
        metrics={metrics}
        dealParameters={dealParameters}
        onUpdateDealParameters={handleUpdateDealParameters}
      />

      {/* Reports via GenericReportSection */}
      <GenericReportSection
        title="Net Working Capital Analysis"
        description="NWC trends and trailing averages across periods"
        data={nwcAnalysisData}
      />
      <GenericReportSection
        title="Free Cash Flow Analysis"
        description="Adjusted EBITDA less changes in NWC, CapEx, and taxes"
        data={fcfData}
      />
    </div>
  );
};
