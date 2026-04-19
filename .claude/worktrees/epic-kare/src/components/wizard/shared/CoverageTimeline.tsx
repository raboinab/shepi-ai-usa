import { Period, CoverageResult, CoverageType } from "@/lib/periodUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, FileText, Calendar } from "lucide-react";

interface CoverageTimelineProps {
  periods: Period[];
  coverage: CoverageResult;
  coverageType?: CoverageType;
  documentCount?: number;
  hasQBCoverage?: boolean;
}

export const CoverageTimeline = ({ 
  periods, 
  coverage, 
  coverageType = 'monthly',
  documentCount = 0,
  hasQBCoverage = false 
}: CoverageTimelineProps) => {
  // Point-in-time: simple uploaded/not uploaded UI
  if (coverageType === 'point-in-time') {
    return (
      <TooltipProvider>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            {coverage.status === 'full' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Document uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    {documentCount} {documentCount === 1 ? 'snapshot' : 'snapshots'} available
                  </p>
                </div>
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No document uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a point-in-time snapshot
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Full-period: single bar showing if entire period is covered
  if (coverageType === 'full-period') {
    const periodLabel = periods[0]?.label || 'Full Period';
    return (
      <TooltipProvider>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            {coverage.status === 'full' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Full period covered</p>
                  <p className="text-xs text-muted-foreground">{periodLabel}</p>
                </div>
              </>
            ) : coverage.status === 'partial' ? (
              <>
                <FileText className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Partial coverage</p>
                  <p className="text-xs text-muted-foreground">
                    Document uploaded but doesn't span {periodLabel}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No document uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a document covering {periodLabel}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Annual coverage: wider year blocks
  if (coverageType === 'annual') {
    if (periods.length === 0) {
      return (
        <div className="text-sm text-muted-foreground text-center py-4">
          No years defined for this project
        </div>
      );
    }

    const coveredIds = new Set(coverage.coveredPeriods.map(p => p.id));

    return (
      <TooltipProvider>
        <div className="space-y-3">
          {/* Annual timeline bar */}
          <div className="flex gap-1">
            {periods.map((period) => {
              const isCovered = coveredIds.has(period.id);
              return (
                <Tooltip key={period.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-10 flex-1 rounded-md transition-colors cursor-pointer min-w-[60px] flex items-center justify-center",
                        isCovered 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "bg-muted hover:bg-muted-foreground/30"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium",
                        isCovered ? "text-white" : "text-muted-foreground"
                      )}>
                        {period.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <p className="font-medium">Tax Year {period.label}</p>
                    </div>
                    <p className={cn(
                      "text-xs mt-1",
                      isCovered ? "text-green-400" : "text-destructive"
                    )}>
                      {isCovered ? "✓ Return uploaded" : "✗ Missing return"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>Return Uploaded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span>Missing</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Monthly coverage (default): current visual with small segments
  if (periods.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No periods defined for this project
      </div>
    );
  }

  const coveredIds = new Set(coverage.coveredPeriods.map(p => p.id));

  // Show a maximum of 36 periods, sampling if necessary
  const displayPeriods = periods.length > 36 
    ? periods.filter((_, i) => i % Math.ceil(periods.length / 36) === 0)
    : periods;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Timeline bar */}
        <div className="flex gap-0.5">
          {displayPeriods.map((period) => {
            const isCovered = coveredIds.has(period.id);
            return (
              <Tooltip key={period.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "h-6 flex-1 rounded-sm transition-colors cursor-pointer min-w-[8px]",
                      isCovered 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-muted hover:bg-muted-foreground/30"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{period.label}</p>
                  <p className={cn(
                    "text-xs",
                    isCovered ? "text-green-400" : "text-destructive"
                  )}>
                    {isCovered ? "✓ Covered" : "✗ Missing"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{periods[0]?.label}</span>
          {periods.length > 1 && <span>{periods[periods.length - 1]?.label}</span>}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Missing</span>
          </div>
          {hasQBCoverage && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">QB</Badge>
              <span>Synced from QuickBooks</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
