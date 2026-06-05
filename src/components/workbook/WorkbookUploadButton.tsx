/**
 * WorkbookUploadButton — lets a user re-upload an XLSX workbook they edited
 * offline. Validates the hidden meta sheet via the parse-workbook-upload edge
 * function, shows a review dialog summarizing changes + revision drift, then
 * commits via commit-workbook-upload.
 *
 * Phase 1 scope: adjustment amount changes. TB cells and supplementary tabs
 * land in Phase 2.
 */
import { useRef, useState } from "react";
import { Upload, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdjustmentDiff {
  id: string;
  label: string;
  type: string;
  changes: { periodId: string; oldValue: number | null; newValue: number }[];
}

interface ParseResult {
  ok: true;
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  currentRevision: number;
  revisionDrifted: boolean;
  summary: {
    adjustmentsChanged: number;
    adjustmentsAdded: number;
    adjustmentsDeleted: number;
    tbCellsChanged: number;
    supplementaryChanged: number;
  };
  adjustmentDiffs: AdjustmentDiff[];
  warnings: string[];
}

interface Props {
  projectId: string;
  onCommitted?: () => void;
  className?: string;
}

const fmt = (n: number | null): string => {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

export function WorkbookUploadButton({ projectId, onCommitted, className }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleFileChosen = async (file: File) => {
    setParsing(true);
    try {
      // Read file as base64
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const fileBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("parse-workbook-upload", {
        body: { fileBase64 },
      });

      if (error) {
        const errMsg = (data as { error?: string })?.error || error.message || "Upload failed";
        toast({ title: "Could not parse workbook", description: errMsg, variant: "destructive" });
        return;
      }

      const result = data as ParseResult | { ok: false; error: string };
      if (!result.ok) {
        const errMsg = (result as { error?: string }).error || "Could not parse workbook";
        toast({ title: "Could not parse workbook", description: errMsg, variant: "destructive" });
        return;
      }


      if (result.projectId !== projectId) {
        toast({
          title: "Wrong project",
          description: "This workbook was exported from a different project.",
          variant: "destructive",
        });
        return;
      }

      setParseResult(result);
      setOpen(true);
    } catch (err) {
      console.error("Upload parse failed:", err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCommit = async (force: boolean) => {
    if (!parseResult) return;
    setCommitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("commit-workbook-upload", {
        body: {
          projectId: parseResult.projectId,
          exportedFromRevision: parseResult.exportedFromRevision,
          adjustmentDiffs: parseResult.adjustmentDiffs.map(d => ({
            id: d.id,
            changes: d.changes.map(c => ({ periodId: c.periodId, newValue: c.newValue })),
          })),
          force,
        },
      });

      if (error || !(data as { ok?: boolean })?.ok) {
        const errMsg = (data as { error?: string; message?: string })?.message
          || (data as { error?: string })?.error
          || error?.message
          || "Commit failed";
        toast({ title: "Could not save changes", description: errMsg, variant: "destructive" });
        return;
      }

      toast({
        title: "Workbook updated",
        description: `Applied ${(data as { adjustmentChangesApplied: number }).adjustmentChangesApplied} adjustment edits.`,
      });
      setOpen(false);
      setParseResult(null);
      onCommitted?.();
    } catch (err) {
      toast({
        title: "Commit failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCommitting(false);
    }
  };

  const totalChanges = parseResult
    ? parseResult.summary.adjustmentsChanged
      + parseResult.summary.adjustmentsAdded
      + parseResult.summary.adjustmentsDeleted
    : 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFileChosen(f);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={parsing}
        className={className}
      >
        {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload XLSX
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review workbook changes</DialogTitle>
            <DialogDescription>
              We compared your edited workbook against the current project data. Confirm to apply.
            </DialogDescription>
          </DialogHeader>

          {parseResult && (
            <div className="space-y-3">
              {parseResult.revisionDrifted && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Online changes detected</AlertTitle>
                  <AlertDescription>
                    The workbook was modified online (revision {parseResult.currentRevision})
                    after you exported it (revision {parseResult.exportedFromRevision}).
                    Choosing "Apply anyway" will overwrite those online changes with your offline edits.
                  </AlertDescription>
                </Alert>
              )}

              {totalChanges === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No changes detected</AlertTitle>
                  <AlertDescription>Your uploaded workbook matches what's already saved.</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="font-medium mb-1">Summary</div>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• {parseResult.summary.adjustmentsChanged} adjustments with amount edits</li>
                      <li className="text-xs italic">
                        Trial Balance, supplementary tabs, and added/deleted adjustments will be supported in Phase 2.
                      </li>
                    </ul>
                  </div>

                  {parseResult.adjustmentDiffs.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Adjustment changes</div>
                      <ScrollArea className="h-64 rounded-md border">
                        <div className="p-2 space-y-2">
                          {parseResult.adjustmentDiffs.map(d => (
                            <div key={d.id} className="rounded border bg-card p-2 text-xs">
                              <div className="font-medium">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground mr-2">
                                  {d.type}
                                </span>
                                {d.label}
                              </div>
                              <table className="mt-1 w-full">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="text-left font-normal">Period</th>
                                    <th className="text-right font-normal">Old</th>
                                    <th className="text-right font-normal">New</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.changes.map(c => (
                                    <tr key={c.periodId}>
                                      <td>{c.periodId}</td>
                                      <td className="text-right">{fmt(c.oldValue)}</td>
                                      <td className="text-right font-semibold">{fmt(c.newValue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              )}

              {parseResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Parser warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="text-xs list-disc list-inside">
                      {parseResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={committing}>
              Cancel
            </Button>
            {parseResult && totalChanges > 0 && (
              <Button
                onClick={() => handleCommit(parseResult.revisionDrifted)}
                disabled={committing}
              >
                {committing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                {parseResult.revisionDrifted ? "Apply anyway (overwrite)" : "Apply changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
