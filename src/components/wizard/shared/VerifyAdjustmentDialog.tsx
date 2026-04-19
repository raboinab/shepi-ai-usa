import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getProofHint } from "@/lib/qoeAdjustmentTaxonomy";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProofValidationBadge } from "./ProofValidationBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useVerificationJob, getProgressLabel } from "@/hooks/useVerificationJob";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  ShieldAlert,
  FileQuestion,
  Clock,
  Paperclip,
} from "lucide-react";

interface VerifyAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  adjustmentId: string;
  jobId?: string;
  viewOnly?: boolean;
  adjustment: {
    description: string;
    category: string;
    intent?: string;
    linkedAccountName?: string;
    amount: number;
    periodRange?: string;
    periodValues?: Record<string, number>;
  };
  onVerificationComplete?: (action: "accepted" | "proposed" | "rejected", notes?: string, verifiedAmount?: number) => void;
  onAttachProof?: () => void;
}

interface MatchingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account_name: string;
  account_number: string;
  vendor: string;
}

interface Contradiction {
  description: string;
  severity: "high" | "medium" | "low";
}

interface DataGap {
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
}

interface MethodologyAudit {
  method: string;
  confidence: number;
  limitations: string[];
}

interface CrossSourceValidation {
  source: string;
  status: "confirmed" | "conflict" | "missing";
  detail: string;
}

interface ComprehensiveAccount {
  account_number: string;
  account_name: string;
  gl_total: number;
  matched_total: number;
  variance: number;
}

interface VerificationReport {
  status: "verified" | "partial_match" | "not_found";
  summary: string | null;
  variance: { seller_amount: number; actual_amount: number; difference: number };
  matching_transactions: MatchingTransaction[];
  total_matched: number;
  match_count: number;
  auto_detected_proposal_id: string | null;
  contradictions?: Contradiction[];
  data_gaps?: DataGap[];
  methodology_audit?: MethodologyAudit;
  cross_source_validation?: CrossSourceValidation[];
  comprehensive_accounts?: ComprehensiveAccount[];
}

type Phase = "idle" | "loading" | "polling" | "complete" | "cached" | "error";

const STATUS_MAP: Record<VerificationReport["status"], "validated" | "partial" | "insufficient"> = {
  verified: "validated",
  partial_match: "partial",
  not_found: "insufficient",
};

const SEVERITY_CLASSES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

export const VerifyAdjustmentDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  jobId: discoveryJobId,
  viewOnly = false,
  adjustment,
  onVerificationComplete,
  onAttachProof,
}: VerifyAdjustmentDialogProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { status: jobStatus, progressPercent, result: jobResult, error: jobError, isRunning } = useVerificationJob({
    jobId: activeJobId,
    adjustmentId,
    projectId,
    onComplete: useCallback((result) => {
      setReport(result as unknown as VerificationReport);
      setLastVerifiedAt(new Date().toISOString());
      setPhase("complete");
      setActiveJobId(null);
      toast.success(`Verification complete — ${(result as unknown as VerificationReport).status}`);
    }, []),
  });

  // React to job failure
  useEffect(() => {
    if (jobError && phase === "polling") {
      setError(jobError);
      setPhase("error");
      setActiveJobId(null);
    }
  }, [jobError, phase]);

  const loadCachedResult = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from("adjustment_proofs")
        .select("traceability_data, validated_at")
        .eq("adjustment_id", adjustmentId)
        .eq("verification_type", "ai_verification")
        .maybeSingle();

      if (queryError) {
        console.error("Failed to load cached proof:", queryError.message);
        return null;
      }

      if (data?.traceability_data && typeof data.traceability_data === "object") {
        return data as unknown as { traceability_data: VerificationReport; validated_at: string | null };
      }
      return null;
    } catch {
      return null;
    }
  }, [adjustmentId]);

  const runVerification = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setReport(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "verify-management-adjustment",
        {
          body: { adjustmentId, adjustment, projectId, jobId: discoveryJobId },
        }
      );

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.jobId) {
        setActiveJobId(data.jobId);
        setPhase("polling");
      } else {
        // Fallback: if somehow we get a full result (shouldn't happen with new backend)
        setReport(data as VerificationReport);
        setLastVerifiedAt(new Date().toISOString());
        setPhase("complete");
        toast.success(`Verification complete — ${data.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setPhase("error");
      toast.error(msg);
    }
  }, [adjustmentId, adjustment, projectId, discoveryJobId]);

  // On open: load cached result only — do NOT auto-run verification
  useEffect(() => {
    if (open && phase === "idle") {
      loadCachedResult().then((cached) => {
        if (cached) {
          setReport(cached.traceability_data as VerificationReport);
          setLastVerifiedAt(cached.validated_at);
          setPhase("cached");
        }
        // No cached result — stay in idle state, user clicks "Run Verification"
      });
    }
    if (!open) {
      setPhase("idle");
      setReport(null);
      setError(null);
      setLastVerifiedAt(null);
      setActiveJobId(null);
    }
  }, [open, phase, loadCachedResult]);

  const formatCurrency = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(n)
      : "N/A";

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const buildSummaryNote = (r: VerificationReport): string => {
    const parts: string[] = [];
    parts.push(`Verification: ${r.status}`);
    parts.push(`${r.match_count} matches, ${formatCurrency(r.total_matched)} total`);
    if (r.variance.difference !== 0) {
      parts.push(`Variance: ${formatCurrency(r.variance.difference)}`);
    }
    if ((r.contradictions?.length ?? 0) > 0) {
      parts.push(`${r.contradictions!.length} contradiction(s)`);
    }
    if ((r.data_gaps?.length ?? 0) > 0) {
      parts.push(`${r.data_gaps!.length} data gap(s)`);
    }
    return parts.join(" · ");
  };

  const showResults = (phase === "complete" || phase === "cached" || (phase === "polling" && report)) && report;
  const isPolling = phase === "polling";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verify Adjustment
          </DialogTitle>
        </DialogHeader>

        {/* Adjustment context */}
        <div className="rounded-lg border p-3 bg-muted/30">
          <p className="font-medium text-sm">
            {adjustment.description || "Untitled adjustment"}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>Category: {adjustment.category}</span>
            <span>Amount: {formatCurrency(adjustment.amount)}</span>
          </div>
        </div>

        {/* Idle state — no cached result, waiting for user to click */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Run verification to trace this adjustment against your project's GL, bank statements, and uploaded documents.
            </p>
            <Button onClick={runVerification} className="gap-2 mt-1">
              <Search className="h-4 w-4" />
              Run Verification
            </Button>
          </div>
        )}

        {/* Initial loading (before polling starts) */}
        {phase === "loading" && (
          <div className="flex items-center gap-3 py-6 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Starting verification…
          </div>
        )}

        {/* Polling progress */}
        {isPolling && (
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{getProgressLabel(progressPercent)}</span>
              <span className="font-mono text-xs text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {report && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Refreshing — previous result shown below
              </p>
            )}
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This can happen if the project is missing GL or Trial Balance data. Make sure financial data has been uploaded and processed before verifying.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={runVerification} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Verification
            </Button>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            {/* Cached indicator */}
            {(phase === "cached" || (phase === "polling" && lastVerifiedAt)) && lastVerifiedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last verified {formatTimestamp(lastVerifiedAt)}
              </div>
            )}

            {/* Status badge */}
            <div className="flex items-center justify-between">
              <ProofValidationBadge
                score={null}
                status={STATUS_MAP[report.status]}
                keyFindings={report.matching_transactions
                  .slice(0, 3)
                  .map((t) => t.description || "Transaction")}
                redFlags={(report.contradictions ?? []).map((c) => c.description)}
              />
            </div>

            {/* Variance summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Seller Amount</div>
                <div className="font-mono font-medium text-sm mt-1">
                  {formatCurrency(report.variance.seller_amount)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Actual Amount</div>
                <div className="font-mono font-medium text-sm mt-1">
                  {formatCurrency(report.variance.actual_amount)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Difference</div>
                <div
                  className={`font-mono font-medium text-sm mt-1 ${
                    report.variance.difference !== 0 ? "text-destructive" : "text-primary"
                  }`}
                >
                  {formatCurrency(report.variance.difference)}
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {report.summary && <p className="text-sm">{report.summary}</p>}

            {/* Matching transactions */}
            {report.matching_transactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Matching Transactions
                  <span className="text-muted-foreground font-normal ml-1">
                    ({report.match_count} matches · {formatCurrency(report.total_matched)} total)
                  </span>
                </h4>
                <div className="space-y-1.5">
                  {report.matching_transactions.map((t) => (
                    <div
                      key={t.id}
                      className="rounded border p-2 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Receipt className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{t.description || "—"}</span>
                        {t.vendor && (
                          <span className="text-muted-foreground shrink-0">· {t.vendor}</span>
                        )}
                        {t.date && (
                          <span className="text-muted-foreground shrink-0">{t.date}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">{t.account_name}</span>
                        <span className="font-mono">{formatCurrency(t.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.matching_transactions.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-3">
                No matching transactions found in project data.
              </div>
            )}

            {/* Contradictions & Data Gaps */}
            {((report.contradictions?.length ?? 0) > 0 || (report.data_gaps?.length ?? 0) > 0) && (
              <Accordion type="multiple" className="w-full">
                {(report.contradictions?.length ?? 0) > 0 && (
                  <AccordionItem value="contradictions">
                    <AccordionTrigger className="text-sm py-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        Contradictions ({report.contradictions!.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {report.contradictions!.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] px-1.5 ${SEVERITY_CLASSES[c.severity]}`}
                            >
                              {c.severity}
                            </Badge>
                            <span>{c.description}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {(report.data_gaps?.length ?? 0) > 0 && (
                  <AccordionItem value="data-gaps">
                    <AccordionTrigger className="text-sm py-2">
                      <span className="flex items-center gap-1.5">
                        <FileQuestion className="h-4 w-4 text-amber-500" />
                        Data Gaps ({report.data_gaps!.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {report.data_gaps!.map((g, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-start gap-2 text-xs">
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] px-1.5 ${SEVERITY_CLASSES[g.severity]}`}
                              >
                                {g.severity}
                              </Badge>
                              <span>{g.description}</span>
                            </div>
                            {g.recommendation && (
                              <p className="text-[11px] text-muted-foreground ml-12">
                                → {g.recommendation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
            </Accordion>
            )}

            {/* Methodology Audit */}
            {report.methodology_audit && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-primary" />
                  Methodology
                </h4>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{report.methodology_audit.method}</span>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      report.methodology_audit.confidence >= 0.8 ? "text-green-600 border-green-500/30" :
                      report.methodology_audit.confidence >= 0.5 ? "text-amber-600 border-amber-500/30" :
                      "text-destructive border-destructive/30"
                    )}>
                      {Math.round(report.methodology_audit.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  {report.methodology_audit.limitations.length > 0 && (
                    <ul className="space-y-1">
                      {report.methodology_audit.limitations.map((l, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Cross-Source Validation */}
            {report.cross_source_validation && report.cross_source_validation.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Cross-Source Validation
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.cross_source_validation.map((v, i) => {
                    const statusConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
                      confirmed: { bg: "bg-green-500/10 border-green-500/30 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
                      verified: { bg: "bg-green-500/10 border-green-500/30 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
                      partial_match: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
                      conflict: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
                      not_found: { bg: "bg-destructive/10 border-destructive/30 text-destructive", icon: <XCircle className="h-3 w-3" /> },
                      missing: { bg: "bg-destructive/10 border-destructive/30 text-destructive", icon: <XCircle className="h-3 w-3" /> },
                    };
                    const cfg = statusConfig[v.status] || { bg: "bg-muted border-muted-foreground/20 text-muted-foreground", icon: <AlertTriangle className="h-3 w-3" /> };
                    return (
                      <div key={i} className={cn("rounded-md border px-2.5 py-1.5 text-xs flex items-center gap-1.5", cfg.bg)}>
                        {cfg.icon}
                        <span className="font-medium">{v.source}</span>
                        <span className="opacity-75">— {v.detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account Comparison */}
            {report.comprehensive_accounts && report.comprehensive_accounts.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="accounts">
                  <AccordionTrigger className="text-sm py-2">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-primary" />
                      Account Comparison ({report.comprehensive_accounts.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md border overflow-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">Account</th>
                            <th className="text-right p-2 font-medium">GL Total</th>
                            <th className="text-right p-2 font-medium">Matched</th>
                            <th className="text-right p-2 font-medium">Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.comprehensive_accounts.map((a, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="p-2">
                                <span className="font-mono text-muted-foreground">#{a.account_number}</span>{" "}
                                {a.account_name}
                              </td>
                              <td className="p-2 text-right font-mono">{formatCurrency(a.gl_total)}</td>
                              <td className="p-2 text-right font-mono">{formatCurrency(a.matched_total)}</td>
                              <td className={cn("p-2 text-right font-mono", Math.abs(a.variance) > 0.01 ? "text-destructive" : "text-primary")}>
                                {formatCurrency(a.variance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Auto-detected proposal link */}
            {report.auto_detected_proposal_id && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span>
                  This adjustment was also detected by AI Discovery (proposal{" "}
                  <code className="font-mono text-primary">
                    {report.auto_detected_proposal_id.slice(0, 8)}
                  </code>
                  )
                </span>
              </div>
            )}

            {/* Action footer */}
            {!isPolling && (
              <div className="flex items-center justify-between pt-3 border-t gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runVerification}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-verify
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const notes = buildSummaryNote(report);
                      onVerificationComplete?.("rejected", notes);
                      onOpenChange(false);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    onClick={() => {
                      const notes = buildSummaryNote(report);
                      onVerificationComplete?.("proposed", notes);
                      onOpenChange(false);
                    }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Flag for Review
                  </Button>
                  {report.variance.difference !== 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => {
                        const notes = buildSummaryNote(report) + ` · Amount reconciled to ${formatCurrency(report.variance.actual_amount)}`;
                        onVerificationComplete?.("accepted", notes, report.variance.actual_amount);
                        onOpenChange(false);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Accept at {formatCurrency(report.variance.actual_amount)}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const notes = buildSummaryNote(report);
                      onVerificationComplete?.("accepted", notes);
                      onOpenChange(false);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                </div>
              </div>
            )}

            {/* Post-verification nudge when score is weak */}
            {!isPolling && report.status !== "verified" && onAttachProof && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                <p className="text-sm text-foreground">
                  {getProofHint(adjustment.description).hint}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    onOpenChange(false);
                    onAttachProof();
                  }}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach Proof Documents
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
