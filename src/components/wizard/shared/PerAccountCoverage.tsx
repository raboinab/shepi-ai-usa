import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertTriangle, Pencil } from "lucide-react";
import {
  Period,
  calculatePeriodCoverage,
  DocumentWithPeriod,
} from "@/lib/periodUtils";
import {
  bankAccountGroupKey,
  normalizeAccountLabel,
  normalizeInstitution,
} from "@/lib/bankAccountNormalization";

export interface AccountDoc extends DocumentWithPeriod {
  id: string;
  institution: string | null;
  account_label: string | null;
}

interface PerAccountCoverageProps {
  docs: AccountDoc[];
  periods: Period[];
  onBackfill?: (docIds: string[]) => void;
  /** Used to strip the company name out of institution strings when grouping. */
  targetCompany?: string | null;
}

interface Group {
  key: string;
  institution: string;
  accountLabel: string;
  docs: AccountDoc[];
  unlabeled: boolean;
  rawVariants: Set<string>;
}

export const PerAccountCoverage = ({ docs, periods, onBackfill, targetCompany }: PerAccountCoverageProps) => {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const d of docs) {
      const institution = normalizeInstitution(d.institution, targetCompany);
      const labelNorm = normalizeAccountLabel(d.account_label);
      const unlabeled = labelNorm === "";
      const accountLabel = unlabeled ? "Unlabeled account" : labelNorm;
      const key = bankAccountGroupKey(d.institution, d.account_label, targetCompany);
      const rawVariant = `${(d.institution || "Unknown").trim()} · ${(d.account_label || "—").trim()}`;
      const g = map.get(key);
      if (g) {
        g.docs.push(d);
        g.rawVariants.add(rawVariant);
      } else {
        map.set(key, {
          key,
          institution,
          accountLabel,
          docs: [d],
          unlabeled,
          rawVariants: new Set([rawVariant]),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.unlabeled !== b.unlabeled) return a.unlabeled ? -1 : 1;
      return `${a.institution} ${a.accountLabel}`.localeCompare(`${b.institution} ${b.accountLabel}`);
    });
  }, [docs, targetCompany]);

  if (periods.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No periods defined for this project
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Upload a statement to see per-account coverage.
      </div>
    );
  }

  // Sample periods to a maximum of 36 segments (mirrors CoverageTimeline behavior)
  const displayPeriods =
    periods.length > 36
      ? periods.filter((_, i) => i % Math.ceil(periods.length / 36) === 0)
      : periods;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {groups.map((g) => {
          const coverage = calculatePeriodCoverage(periods, g.docs);
          const coveredIds = new Set(coverage.coveredPeriods.map((p) => p.id));
          const pct = coverage.coveragePercentage;
          const tone =
            coverage.status === "full"
              ? "default"
              : coverage.status === "partial"
              ? "secondary"
              : "destructive";

          return (
            <div
              key={g.key}
              className={cn(
                "grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 items-center p-3 rounded-md border bg-card",
                g.unlabeled && "border-yellow-400/60 bg-yellow-50/40 dark:bg-yellow-900/10"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {g.rawVariants.size > 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium truncate underline decoration-dotted decoration-muted-foreground/50 cursor-help">
                          {g.institution}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-medium mb-1">Merged from {g.rawVariants.size} parsed variants:</p>
                        <ul className="text-[11px] list-disc pl-4 space-y-0.5">
                          {Array.from(g.rawVariants).map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <p className="text-sm font-medium truncate">{g.institution}</p>
                  )}
                  {g.unlabeled && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="w-3 h-3" /> Needs label
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{g.accountLabel}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={tone as any} className="text-[10px]">{pct}%</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {g.docs.length} {g.docs.length === 1 ? "doc" : "docs"}
                  </span>
                  {g.unlabeled && onBackfill && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] gap-1"
                      onClick={() => onBackfill(g.docs.map((d) => d.id))}
                    >
                      <Pencil className="w-3 h-3" /> Label
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-0.5">
                {displayPeriods.map((period) => {
                  const isCovered = coveredIds.has(period.id);
                  return (
                    <Tooltip key={period.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-5 flex-1 rounded-sm transition-colors cursor-pointer min-w-[6px]",
                            isCovered
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-muted hover:bg-muted-foreground/30"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{period.label}</p>
                        <p className={cn("text-xs", isCovered ? "text-green-400" : "text-destructive")}>
                          {isCovered ? "✓ Covered" : "✗ Missing"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex gap-4 text-xs flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Missing</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
