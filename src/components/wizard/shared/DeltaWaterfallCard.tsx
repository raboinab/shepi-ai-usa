import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import type { DeltaReconciliation, WaterfallStep } from "@/hooks/useTransferClassification";
import { WaterfallDrilldownDialog, type EmbeddedTransaction } from "./WaterfallDrilldownDialog";

interface DeltaWaterfallCardProps {
  delta: DeltaReconciliation;
  projectId: string;
  selectedPeriod?: string;
  /** Full classification rawData for in-memory transaction lookup */
  classificationRawData?: Record<string, any>;
  /** Whether cases are still pending approval (affects visual treatment) */
  hasPendingCases?: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const confidenceIcon = (c: number) => {
  if (c >= 0.8) return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
  if (c >= 0.6) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />;
  return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
};

const confidenceLabel = (c: number) => {
  if (c >= 0.8) return "High";
  if (c >= 0.6) return "Medium";
  return "Low";
};

/** Look up transaction details from the embedded classification data */
function findEmbeddedTransactions(
  rawData: Record<string, any> | undefined,
  ids: string[]
): EmbeddedTransaction[] {
  if (!rawData || ids.length === 0) return [];
  const idSet = new Set(ids);
  const results: EmbeddedTransaction[] = [];
  for (const [key, period] of Object.entries(rawData)) {
    if (key.startsWith("_")) continue;
    if (!period || typeof period !== "object") continue;
    for (const txn of (period as any).transactions ?? []) {
      if (idSet.has(txn.id)) {
        results.push({
          id: txn.id,
          date: txn.date,
          memo: txn.memo,
          amount: txn.amount,
          category: txn.category,
        });
      }
    }
  }
  return results;
}

export function DeltaWaterfallCard({ delta, projectId, selectedPeriod, classificationRawData, hasPendingCases }: DeltaWaterfallCardProps) {
  const [drilldown, setDrilldown] = useState<{ txns: EmbeddedTransaction[]; title: string } | null>(null);

  const isDegraded = delta.delta_source === "bank_internal";

  // Derive available periods sorted chronologically
  const availablePeriods = useMemo(
    () => Object.keys(delta.periods).sort(),
    [delta.periods]
  );

  // Fall back to latest available period if selectedPeriod isn't in the data
  const effectivePeriod = useMemo(() => {
    if (selectedPeriod && delta.periods[selectedPeriod]) return selectedPeriod;
    return availablePeriods[availablePeriods.length - 1] ?? null;
  }, [selectedPeriod, delta.periods, availablePeriods]);

  const [overridePeriod, setOverridePeriod] = useState<string | null>(null);
  const activePeriod = overridePeriod && delta.periods[overridePeriod] ? overridePeriod : effectivePeriod;

  const periodData = activePeriod ? delta.periods[activePeriod] : null;
  const steps = periodData?.waterfall_steps ?? [];
  const unexplained = periodData?.unexplained_remainder ?? 0;
  const startingDelta = periodData?.starting_delta ?? 0;

  // Period-scoped explained total
  const periodExplained = steps.reduce((s, st) => s + st.amount, 0);

  // Compute max bar width relative to starting delta
  const maxAmount = Math.max(Math.abs(startingDelta), ...steps.map(s => Math.abs(s.amount)), Math.abs(unexplained), 1);

  // Count leakage periods across all periods (aggregate stat)
  const leakagePeriodCount = delta.cash_leakage_periods.length;

  return (
    <>
      <Card className="border-dashed">
        <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {isDegraded ? "Bank Internal Analysis" : `Non-Operating Flows: ${formatCurrency(Math.abs(startingDelta))}`}
            </CardTitle>
            {availablePeriods.length > 0 && (
              <Select value={activePeriod ?? ""} onValueChange={setOverridePeriod}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isDegraded && (
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                No GL data available — showing bank-only breakdown. Upload a trial balance for full reconciliation.
              </AlertDescription>
            </Alert>
          )}

          {/* Period-scoped summary badges */}
          {activePeriod && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="text-muted-foreground">{activePeriod}</Badge>
              <Badge variant="secondary">Explained: {formatCurrency(Math.abs(periodExplained))}</Badge>
              {Math.abs(unexplained) > 0.01 && (
                <Badge variant="destructive">Unexplained: {formatCurrency(Math.abs(unexplained))}</Badge>
              )}
            </div>
          )}

          {/* Aggregate leakage note (separate from period data) */}
          {leakagePeriodCount > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              {leakagePeriodCount} period{leakagePeriodCount > 1 ? "s" : ""} with potential cash leakage across all periods
            </p>
          )}

          {/* Waterfall steps */}
          {steps.length > 0 ? (
            <div className="space-y-1.5">
              {steps.map((step, i) => (
                <WaterfallStepRow
                  key={i}
                  step={step}
                  maxAmount={maxAmount}
                  isPending={hasPendingCases}
                  onDrilldown={() => {
                    if (step.transaction_ids.length === 0) return;
                    const txns = findEmbeddedTransactions(classificationRawData, step.transaction_ids);
                    setDrilldown({ txns, title: `${step.label} — ${activePeriod}` });
                  }}
                />
              ))}

              {/* Unexplained remainder */}
              {Math.abs(unexplained) > 0.01 && (
                <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-destructive flex-1">
                    Unexplained: {formatCurrency(Math.abs(unexplained))}
                  </span>
                  <span className="text-xs text-destructive/70">Investigate</span>
                </div>
              )}
            </div>
          ) : !activePeriod ? (
            <p className="text-sm text-muted-foreground">
              Select a period to see the waterfall breakdown.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No classification data for this period.
            </p>
          )}
        </CardContent>
      </Card>

      {drilldown && (
        <WaterfallDrilldownDialog
          open={!!drilldown}
          onOpenChange={(open) => !open && setDrilldown(null)}
          embeddedTransactions={drilldown.txns}
          projectId={projectId}
          title={drilldown.title}
        />
      )}
    </>
  );
}

function WaterfallStepRow({
  step,
  maxAmount,
  isPending,
  onDrilldown,
}: {
  step: WaterfallStep;
  maxAmount: number;
  isPending?: boolean;
  onDrilldown: () => void;
}) {
  const barWidth = Math.max((Math.abs(step.amount) / maxAmount) * 100, 2);
  const hasTransactions = step.transaction_ids.length > 0;

  return (
    <button
      onClick={onDrilldown}
      disabled={!hasTransactions}
      className={`flex items-center gap-2 w-full py-1.5 px-2 rounded hover:bg-muted/50 transition-colors text-left group disabled:cursor-default ${isPending ? "opacity-50 border border-dashed border-muted-foreground/30" : ""}`}
    >
      {confidenceIcon(step.confidence)}
      <span className="text-sm flex-1 min-w-0 truncate">{step.label}</span>
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
        <div
          className="h-full bg-primary/60 rounded-full transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-sm font-mono w-20 text-right shrink-0">{formatCurrency(Math.abs(step.amount))}</span>
      <Badge variant="outline" className="text-[10px] shrink-0">
        {confidenceLabel(step.confidence)} · {step.transaction_count}
      </Badge>
      {hasTransactions && (
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}
