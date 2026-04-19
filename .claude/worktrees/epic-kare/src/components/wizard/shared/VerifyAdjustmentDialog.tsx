import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProofValidationBadge } from "./ProofValidationBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Brain,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  RefreshCw,
  Clock,
  Loader2,
} from "lucide-react";

interface VerifyAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  adjustmentId: string;
  adjustment: {
    description: string;
    category: string;
    intent?: string;
    linkedAccountName?: string;
    amount: number;
    periodRange?: string;
  };
  onVerificationComplete?: () => void;
}

type Phase = "idle" | "search_strategy" | "scanning" | "analyzing" | "complete" | "error";

interface TraceabilityReport {
  score: number;
  status: "validated" | "supported" | "partial" | "insufficient" | "contradictory";
  summary: string;
  supportedAmount: number | null;
  claimedAmount: number;
  corroboratingEvidence: Array<{
    source: string;
    sourceName: string;
    excerpt: string;
    amount: number | null;
    date: string | null;
  }>;
  contradictions: Array<{ description: string; severity: "high" | "medium" | "low" }>;
  dataGaps: Array<{ description: string; severity: "high" | "medium" | "low"; recommendation: string }>;
  scanStats: {
    documentsSearched: number;
    dataRecordsSearched: number;
    flaggedTransactionsSearched: number;
    matchesFound: number;
  };
}

export const VerifyAdjustmentDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  adjustment,
  onVerificationComplete,
}: VerifyAdjustmentDialogProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<TraceabilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = useCallback(async () => {
    setPhase("search_strategy");
    setError(null);
    setReport(null);

    // Simulate phase transitions for UX (the edge function does all 3 steps)
    const phaseTimer1 = setTimeout(() => setPhase("scanning"), 3000);
    const phaseTimer2 = setTimeout(() => setPhase("analyzing"), 7000);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-management-adjustment", {
        body: { adjustmentId, adjustment, projectId },
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setReport(data as TraceabilityReport);
      setPhase("complete");
      toast.success(`Verification complete — Score: ${data.score}/100`);
      onVerificationComplete?.();
    } catch (err) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setPhase("error");
      toast.error(msg);
    }
  }, [adjustmentId, adjustment, projectId, onVerificationComplete]);

  useEffect(() => {
    if (open && phase === "idle") {
      runVerification();
    }
    if (!open) {
      setPhase("idle");
      setReport(null);
      setError(null);
    }
  }, [open, phase, runVerification]);

  const formatCurrency = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
      : "N/A";

  const getPhaseProgress = () => {
    switch (phase) {
      case "search_strategy": return 15;
      case "scanning": return 45;
      case "analyzing": return 75;
      case "complete": return 100;
      default: return 0;
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "search_strategy": return "Generating search strategy...";
      case "scanning": return "Scanning documents and data records...";
      case "analyzing": return "Analyzing matched evidence...";
      case "complete": return "Verification complete";
      case "error": return "Verification failed";
      default: return "";
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "search_strategy": return <Brain className="h-4 w-4 animate-pulse" />;
      case "scanning": return <Database className="h-4 w-4 animate-pulse" />;
      case "analyzing": return <Search className="h-4 w-4 animate-pulse" />;
      case "complete": return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-destructive";
      case "medium": return "text-amber-600";
      case "low": return "text-muted-foreground";
      default: return "";
    }
  };

  const isLoading = phase === "search_strategy" || phase === "scanning" || phase === "analyzing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verify Adjustment
          </DialogTitle>
        </DialogHeader>

        {/* Adjustment context */}
        <div className="rounded-lg border p-3 bg-muted/30">
          <p className="font-medium text-sm">{adjustment.description || "Untitled adjustment"}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>Category: {adjustment.category}</span>
            <span>Amount: {formatCurrency(adjustment.amount)}</span>
          </div>
        </div>

        {/* Progress */}
        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {getPhaseIcon()}
              <span>{getPhaseLabel()}</span>
            </div>
            <Progress value={getPhaseProgress()} className="h-2" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              This typically takes 15–20 seconds
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="outline" onClick={runVerification} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Results */}
        {phase === "complete" && report && (
          <div className="space-y-4">
            {/* Score + status */}
            <div className="flex items-center justify-between">
              <ProofValidationBadge
                score={report.score}
                status={report.status}
                keyFindings={report.corroboratingEvidence.map((e) => e.sourceName).slice(0, 3)}
                redFlags={report.contradictions.map((c) => c.description).slice(0, 3)}
              />
              {report.supportedAmount != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Supported: </span>
                  <span className="font-mono font-medium">{formatCurrency(report.supportedAmount)}</span>
                  <span className="text-muted-foreground"> / {formatCurrency(report.claimedAmount)}</span>
                </div>
              )}
            </div>

            {/* Scan stats */}
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
              Searched {report.scanStats.documentsSearched} documents, {report.scanStats.dataRecordsSearched} data records,
              {" "}{report.scanStats.flaggedTransactionsSearched} flagged transactions — found {report.scanStats.matchesFound} matches
            </div>

            {/* Summary */}
            <p className="text-sm">{report.summary}</p>

            {/* Expandable sections */}
            <Accordion type="multiple" className="w-full">
              {/* Corroborating Evidence */}
              {report.corroboratingEvidence.length > 0 && (
                <AccordionItem value="evidence">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Corroborating Evidence ({report.corroboratingEvidence.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {report.corroboratingEvidence.map((e, i) => (
                        <div key={i} className="rounded border p-2 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-medium">
                              {e.source === "document" && <FileText className="h-3 w-3" />}
                              {e.source === "processed_data" && <Database className="h-3 w-3" />}
                              {e.source === "flagged_transaction" && <AlertTriangle className="h-3 w-3" />}
                              {e.sourceName}
                            </div>
                            {e.amount != null && (
                              <span className="font-mono">{formatCurrency(e.amount)}</span>
                            )}
                          </div>
                          {e.date && <div className="text-muted-foreground">Date: {e.date}</div>}
                          <p className="text-muted-foreground line-clamp-2">{e.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Contradictions */}
              {report.contradictions.length > 0 && (
                <AccordionItem value="contradictions">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Contradictions ({report.contradictions.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {report.contradictions.map((c, i) => (
                        <div key={i} className="rounded border border-destructive/20 bg-destructive/5 p-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[10px] ${getSeverityColor(c.severity)}`}>
                              {c.severity}
                            </Badge>
                            <span>{c.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Data Gaps */}
              {report.dataGaps.length > 0 && (
                <AccordionItem value="gaps">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Data Gaps ({report.dataGaps.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {report.dataGaps.map((g, i) => (
                        <div key={i} className="rounded border p-2 text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[10px] ${getSeverityColor(g.severity)}`}>
                              {g.severity}
                            </Badge>
                            <span>{g.description}</span>
                          </div>
                          <p className="text-muted-foreground italic">{g.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Re-verify button */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={runVerification} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Re-verify
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
