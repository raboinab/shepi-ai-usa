/**
 * WIP Schedule Tab - Job-level contract tracking for construction/project-based businesses.
 * Includes:
 *  - Job entry table (existing)
 *  - TB tie-out footer when WIP accounts mapped
 *  - "Run AI Analysis" panel surfacing findings from analyze-wip edge function
 */
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, Loader2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DealData, WIPJobEntry } from "@/lib/workbook-types";
import { resolveMappedAccount } from "@/lib/wipAccountUtils";

interface WIPScheduleTabProps {
  dealData: DealData;
  onDataChange?: (data: DealData) => void;
}

interface WIPFinding {
  category: string;
  severity: "high" | "medium" | "low";
  title: string;
  narrative: string;
  affectedJobIds: string[];
  estimatedImpact: number;
}

interface WIPAnalysisResult {
  findings: WIPFinding[];
  summary: string;
  portfolioMetrics: {
    totalContract: number;
    totalOverBilled: number;
    totalUnderBilled: number;
    netOverUnder: number;
    jobCount: number;
  };
  analyzedAt: string;
}

function createEmptyJob(): WIPJobEntry {
  return {
    id: crypto.randomUUID(),
    jobName: "",
    contractValue: 0,
    costsToDate: 0,
    billingsToDate: 0,
    status: "active",
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  if (!isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

const SEVERITY_STYLES: Record<WIPFinding["severity"], string> = {
  high: "border-destructive/50 bg-destructive/10",
  medium: "border-amber-500/50 bg-amber-500/10",
  low: "border-muted bg-muted/30",
};

export function WIPScheduleTab({ dealData, onDataChange }: WIPScheduleTabProps) {
  const jobs: WIPJobEntry[] = dealData.wipSchedule?.jobs ?? [];
  const mapping = dealData.wipAccountMapping;

  const updateJobs = useCallback((updatedJobs: WIPJobEntry[]) => {
    onDataChange?.({
      ...dealData,
      wipSchedule: { jobs: updatedJobs },
    });
  }, [dealData, onDataChange]);

  const addJob = () => updateJobs([...jobs, createEmptyJob()]);
  const removeJob = (id: string) => updateJobs(jobs.filter(j => j.id !== id));
  const updateJob = (id: string, field: keyof WIPJobEntry, value: string | number) => {
    updateJobs(jobs.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  // Totals
  const totals = jobs.reduce(
    (acc, j) => ({
      contractValue: acc.contractValue + j.contractValue,
      costsToDate: acc.costsToDate + j.costsToDate,
      billingsToDate: acc.billingsToDate + j.billingsToDate,
    }),
    { contractValue: 0, costsToDate: 0, billingsToDate: 0 }
  );
  const totalPctComplete = totals.contractValue > 0 ? totals.costsToDate / totals.contractValue : 0;
  const totalOverUnder = totals.billingsToDate - (totals.contractValue * totalPctComplete);

  const totalOverBilled = jobs.reduce((s, j) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    const ou = j.billingsToDate - j.contractValue * pct;
    return ou > 0 ? s + ou : s;
  }, 0);
  const totalUnderBilled = jobs.reduce((s, j) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    const ou = j.billingsToDate - j.contractValue * pct;
    return ou < 0 ? s + Math.abs(ou) : s;
  }, 0);

  // TB tie-out: latest period balances for mapped accounts
  const tbTieOut = useMemo(() => {
    if (!mapping || jobs.length === 0) return null;
    const periods = dealData.deal.periods;
    if (periods.length === 0) return null;
    const lastP = periods[periods.length - 1].id;
    const tb = dealData.trialBalance;
    const rc = dealData.reclassifications ?? [];

    const balanceFor = (key: string | undefined) => {
      const acc = resolveMappedAccount(
        // Build CoaAccount-like shape from accounts array (uses accountId as both number & name fallback)
        dealData.accounts.map(a => ({
          id: 0,
          accountNumber: a.accountId || "",
          accountName: a.accountName,
          fsType: a.fsType,
          category: a.fsLineItem || "",
        })),
        key
      );
      if (!acc) return null;
      // Match TB entries by accountName + BS type
      const matchEntries = tb.filter(e => e.accountName === acc.accountName && e.fsType === "BS");
      let bal = 0;
      for (const e of matchEntries) {
        bal += e.balances?.[lastP] ?? 0;
      }
      // Apply reclassifications targeting this account name
      for (const r of rc) {
        if (r.toAccount === acc.accountName) bal += r.amounts?.[lastP] ?? 0;
        if (r.fromAccount === acc.accountName) bal -= r.amounts?.[lastP] ?? 0;
      }
      return { accountName: acc.accountName, balance: bal };
    };

    return {
      contractAssets: balanceFor(mapping.contractAssets),
      contractLiabilities: balanceFor(mapping.contractLiabilities),
      jobCostsInProcess: balanceFor(mapping.jobCostsInProcess),
      lastPeriodId: lastP,
    };
  }, [mapping, jobs.length, dealData]);

  // AI Analysis — hydrate from persisted dealData.wipAnalysis so findings survive reload
  // and remain available to the Attention Areas / PDF builders.
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WIPAnalysisResult | null>(
    (dealData.wipAnalysis as WIPAnalysisResult | undefined) ?? null
  );

  const runAnalysis = async () => {
    if (jobs.length === 0) return;
    setAnalyzing(true);
    try {
      const tbBalances: Record<string, { accountName: string; balance: number }> = {};
      if (tbTieOut?.contractAssets) tbBalances.contractAssets = tbTieOut.contractAssets;
      if (tbTieOut?.contractLiabilities) tbBalances.contractLiabilities = tbTieOut.contractLiabilities;
      if (tbTieOut?.jobCostsInProcess) tbBalances.jobCostsInProcess = tbTieOut.jobCostsInProcess;

      const { data, error } = await supabase.functions.invoke("analyze-wip", {
        body: {
          jobs: jobs.map(j => ({
            id: j.id, jobName: j.jobName, contractValue: j.contractValue,
            costsToDate: j.costsToDate, billingsToDate: j.billingsToDate, status: j.status,
          })),
          tbBalances: Object.keys(tbBalances).length > 0 ? tbBalances : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data as WIPAnalysisResult;
      setAnalysis(result);
      // Persist to dealData so Attention Areas / PDF can surface findings
      onDataChange?.({ ...dealData, wipAnalysis: result });
      toast({ title: "WIP analysis complete", description: `${result.findings.length} finding(s) surfaced.` });
    } catch (err) {
      toast({
        title: "Analysis failed",
        description: (err as Error).message || "Could not analyze WIP.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const renderTieOutRow = (
    label: string,
    schedTotal: number,
    tb: { accountName: string; balance: number } | null | undefined
  ) => {
    if (!tb) {
      return (
        <tr className="border-b last:border-b-0">
          <td className="px-3 py-2 text-muted-foreground">{label}</td>
          <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(schedTotal)}</td>
          <td className="px-3 py-2 text-right text-xs text-muted-foreground italic">Not mapped</td>
          <td className="px-3 py-2 text-right text-xs text-muted-foreground">—</td>
        </tr>
      );
    }
    const variance = tb.balance - schedTotal;
    const variancePct = schedTotal !== 0 ? Math.abs(variance / schedTotal) : 0;
    const material = variancePct > 0.1;
    return (
      <tr className="border-b last:border-b-0">
        <td className="px-3 py-2">
          <div>{label}</div>
          <div className="text-xs text-muted-foreground">{tb.accountName}</div>
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(schedTotal)}</td>
        <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(tb.balance)}</td>
        <td className={cn(
          "px-3 py-2 text-right font-mono text-xs",
          material ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {formatCurrency(variance)}
          {material && <Badge variant="destructive" className="ml-2 text-[10px]">{(variancePct * 100).toFixed(0)}%</Badge>}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">WIP Schedule</h2>
          <p className="text-sm text-muted-foreground">Job-level contract tracking — over/under billing analysis</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={runAnalysis}
            disabled={analyzing || jobs.length === 0}
            className="gap-1"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Run AI Analysis
          </Button>
          <Button size="sm" variant="outline" onClick={addJob} className="gap-1">
            <Plus className="w-3 h-3" /> Add Job
          </Button>
        </div>
      </div>

      {!mapping?.contractAssets && !mapping?.contractLiabilities && jobs.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>WIP accounts not mapped.</strong> Map your Contract Assets / Liabilities accounts in
            Project Setup to enable Trial Balance tie-out and Balance Sheet integration.
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[200px]">Job Name</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]">Contract Value</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]">Costs to Date</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]">Billings to Date</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground min-w-[90px]">% Complete</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]">Over/(Under)</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const pctComplete = job.contractValue > 0 ? job.costsToDate / job.contractValue : 0;
              const overUnder = job.billingsToDate - (job.contractValue * pctComplete);
              return (
                <tr key={job.id} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-1.5">
                    <Input
                      value={job.jobName}
                      onChange={(e) => updateJob(job.id, "jobName", e.target.value)}
                      placeholder="Job / Project name"
                      className="h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      value={job.contractValue || ""}
                      onChange={(e) => updateJob(job.id, "contractValue", parseFloat(e.target.value) || 0)}
                      className="h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      value={job.costsToDate || ""}
                      onChange={(e) => updateJob(job.id, "costsToDate", parseFloat(e.target.value) || 0)}
                      className="h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      value={job.billingsToDate || ""}
                      onChange={(e) => updateJob(job.id, "billingsToDate", parseFloat(e.target.value) || 0)}
                      className="h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">
                    {formatPercent(pctComplete)}
                  </td>
                  <td className={cn(
                    "px-3 py-1.5 text-right font-mono text-xs font-medium",
                    overUnder > 0 ? "text-destructive" : overUnder < 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {formatCurrency(overUnder)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeJob(job.id)}>
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No jobs added. Click "Add Job" to begin tracking WIP.
                </td>
              </tr>
            )}
          </tbody>
          {jobs.length > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-semibold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(totals.contractValue)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(totals.costsToDate)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(totals.billingsToDate)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatPercent(totalPctComplete)}</td>
                <td className={cn(
                  "px-3 py-2 text-right font-mono text-xs",
                  totalOverUnder > 0 ? "text-destructive" : totalOverUnder < 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {formatCurrency(totalOverUnder)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Trial Balance Tie-Out */}
      {tbTieOut && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Trial Balance Tie-Out</h3>
          <p className="text-xs text-muted-foreground">
            Compares WIP schedule totals against mapped Trial Balance accounts (latest period: {tbTieOut.lastPeriodId}).
            Variances &gt;10% are flagged.
          </p>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Slot</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Schedule Total</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">TB Balance</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Variance</th>
                </tr>
              </thead>
              <tbody>
                {renderTieOutRow("Contract Assets (Under-Billed)", totalUnderBilled, tbTieOut.contractAssets)}
                {renderTieOutRow("Contract Liabilities (Over-Billed)", totalOverBilled, tbTieOut.contractLiabilities)}
                {renderTieOutRow("Job Costs in Process", totals.costsToDate, tbTieOut.jobCostsInProcess)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Analysis Findings */}
      {analysis && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Findings
            </h3>
            <span className="text-xs text-muted-foreground">
              Analyzed {new Date(analysis.analyzedAt).toLocaleString()}
            </span>
          </div>
          <Alert>
            <AlertDescription className="text-sm">{analysis.summary}</AlertDescription>
          </Alert>
          {analysis.findings.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3">No material findings — schedule is clean.</p>
          ) : (
            <div className="space-y-2">
              {analysis.findings.map((f, i) => (
                <div key={i} className={cn("rounded-lg border p-3", SEVERITY_STYLES[f.severity])}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium">{f.title}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase">{f.severity}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{f.category.replace(/_/g, " ")}</Badge>
                        {f.estimatedImpact !== 0 && (
                          <span className="text-xs font-mono text-muted-foreground">
                            Impact: {formatCurrency(f.estimatedImpact)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{f.narrative}</p>
                      {f.affectedJobIds.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Affected: {f.affectedJobIds.map(id => jobs.find(j => j.id === id)?.jobName || id).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <strong>% Complete</strong> = Costs to Date ÷ Contract Value &nbsp;|&nbsp;
        <strong>Over/(Under)</strong> = Billings to Date − (Contract Value × % Complete).
        Positive = over-billed, Negative = under-billed.
      </p>
    </div>
  );
}
