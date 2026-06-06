/**
 * WorkbookUploadButton — handles the full offline round-trip:
 * 1. User picks XLSX → parse-workbook-upload extracts base + mine
 * 2. Review dialog shows summary of TB cell edits + adjustment add/edit/delete
 * 3. Commit invokes commit-workbook-upload; on 409 CONFLICTS, opens ConflictResolutionDialog
 * 4. User resolves per-field, commits again with resolutions
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
import { ConflictResolutionDialog, type FieldConflict } from "./ConflictResolutionDialog";

interface BaseAdjustment {
  id: string;
  type: string;
  label: string;
  tbAccountNumber?: string;
  intent?: string;
  notes?: string;
  periodValues: Record<string, number>;
}

interface BaseFixedAsset {
  description: string;
  category: string;
  acquisitionDate: string;
  cost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

interface ParseResult {
  ok: true;
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  currentRevision: number;
  revisionDrifted: boolean;
  mine: {
    trialBalance: Record<string, Record<string, number>>;
    adjustmentsChanged: Record<string, Record<string, number>>;
    adjustmentsDeleted: string[];
    adjustmentsAdded: BaseAdjustment[];
    fixedAssetsChanged: Record<string, Partial<BaseFixedAsset>>;
    fixedAssetsDeleted: string[];
    fixedAssetsAdded: BaseFixedAsset[];
  };
  base: {
    trialBalance: Record<string, Record<string, number>>;
    adjustments: Record<string, BaseAdjustment>;
    fixedAssets: Record<string, BaseFixedAsset>;
  };
  summary: {
    tbCellsChanged: number;
    adjustmentsChanged: number;
    adjustmentsAdded: number;
    adjustmentsDeleted: number;
    fixedAssetsChanged: number;
    fixedAssetsAdded: number;
    fixedAssetsDeleted: number;
    deferredTabsSeen: string[];
  };
  warnings: string[];
}

interface Props {
  projectId: string;
  onCommitted?: () => void;
  className?: string;
}

export function WorkbookUploadButton({ projectId, onCommitted, className }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [conflicts, setConflicts] = useState<FieldConflict[] | null>(null);

  const handleFileChosen = async (file: File) => {
    setParsing(true);
    try {
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
        toast({ title: "Could not parse workbook", description: (result as { error?: string }).error || "Unknown error", variant: "destructive" });
        return;
      }
      if (result.projectId !== projectId) {
        toast({ title: "Wrong project", description: "This workbook was exported from a different project.", variant: "destructive" });
        return;
      }
      setParseResult(result);
      setReviewOpen(true);
    } catch (err) {
      console.error("Upload parse failed:", err);
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitCommit = async (resolutions?: Record<string, "mine" | "theirs">, force = false) => {
    if (!parseResult) return;
    setCommitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("commit-workbook-upload", {
        body: {
          projectId: parseResult.projectId,
          exportedFromRevision: parseResult.exportedFromRevision,
          base: parseResult.base,
          mine: parseResult.mine,
          resolutions,
          force,
        },
      });

      // supabase-js wraps non-2xx (e.g. 409 CONFLICTS) in error; body is in error.context
      let payload: { ok?: boolean; error?: string; message?: string; conflicts?: FieldConflict[]; applied?: Record<string, number>; autoMerged?: boolean } | null =
        (data as typeof payload) ?? null;
      if (error && (error as { context?: Response }).context) {
        try {
          payload = await (error as { context: Response }).context.clone().json();
        } catch {
          // fall through
        }
      }

      if (payload?.error === "CONFLICTS" && Array.isArray(payload.conflicts)) {
        setReviewOpen(false);
        setConflicts(payload.conflicts);
        return;
      }

      if (error || !payload?.ok) {
        toast({
          title: "Could not save changes",
          description: payload?.message || payload?.error || error?.message || "Commit failed",
          variant: "destructive",
        });
        return;
      }

      const a = payload.applied ?? { tbCells: 0, adjustmentsChanged: 0, adjustmentsAdded: 0, adjustmentsDeleted: 0 };
      const parts: string[] = [];
      if (a.tbCells) parts.push(`${a.tbCells} TB cells`);
      if (a.adjustmentsChanged) parts.push(`${a.adjustmentsChanged} adjustments edited`);
      if (a.adjustmentsAdded) parts.push(`${a.adjustmentsAdded} added`);
      if (a.adjustmentsDeleted) parts.push(`${a.adjustmentsDeleted} deleted`);
      toast({
        title: payload.autoMerged ? "Workbook updated (auto-merged)" : "Workbook updated",
        description: parts.join(" · ") || "No changes applied.",
      });
      setReviewOpen(false);
      setConflicts(null);
      setParseResult(null);
      onCommitted?.();
    } catch (err) {
      toast({ title: "Commit failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  };

  const summary = parseResult?.summary;
  const totalChanges = summary
    ? summary.tbCellsChanged + summary.adjustmentsChanged + summary.adjustmentsAdded + summary.adjustmentsDeleted
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

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review workbook changes</DialogTitle>
            <DialogDescription>
              Detected edits in your offline workbook. Confirm to apply.
            </DialogDescription>
          </DialogHeader>

          {parseResult && summary && (
            <div className="space-y-3">
              {parseResult.revisionDrifted && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Online changes detected</AlertTitle>
                  <AlertDescription>
                    Workbook was modified online (revision {parseResult.currentRevision}) after you exported
                    (revision {parseResult.exportedFromRevision}). Non-overlapping edits will be auto-merged;
                    overlaps will prompt for resolution.
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
                <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                  <div className="font-medium">Summary</div>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {summary.tbCellsChanged > 0 && <li>• {summary.tbCellsChanged} Trial Balance cell edits</li>}
                    {summary.adjustmentsChanged > 0 && <li>• {summary.adjustmentsChanged} adjustments with amount changes</li>}
                    {summary.adjustmentsAdded > 0 && <li>• {summary.adjustmentsAdded} new adjustments added</li>}
                    {summary.adjustmentsDeleted > 0 && <li>• {summary.adjustmentsDeleted} adjustments deleted</li>}
                  </ul>
                </div>
              )}

              {summary.deferredTabsSeen.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Some tabs not yet round-trippable</AlertTitle>
                  <AlertDescription className="text-xs">
                    Edits in these tabs will be ignored on import:&nbsp;
                    {summary.deferredTabsSeen.join(", ")}. Coming in the next release.
                  </AlertDescription>
                </Alert>
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

              {totalChanges > 0 && (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-2 space-y-1 text-xs">
                    {Object.entries(parseResult.mine.adjustmentsChanged).map(([id, cells]) => {
                      const baseAdj = parseResult.base.adjustments[id];
                      return (
                        <div key={id} className="border-b pb-1">
                          <div className="font-medium">{baseAdj?.type} · {baseAdj?.label}</div>
                          <div className="text-muted-foreground">{Object.keys(cells).length} period(s) changed</div>
                        </div>
                      );
                    })}
                    {parseResult.mine.adjustmentsAdded.map(a => (
                      <div key={a.id} className="border-b pb-1">
                        <span className="inline-block px-1 rounded bg-primary/10 text-primary mr-1">NEW</span>
                        {a.type} · {a.label}
                      </div>
                    ))}
                    {parseResult.mine.adjustmentsDeleted.map(id => (
                      <div key={id} className="border-b pb-1">
                        <span className="inline-block px-1 rounded bg-destructive/10 text-destructive mr-1">DEL</span>
                        {parseResult.base.adjustments[id]?.label ?? id}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)} disabled={committing}>Cancel</Button>
            {parseResult && totalChanges > 0 && (
              <Button onClick={() => submitCommit()} disabled={committing}>
                {committing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Apply changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {conflicts && (
        <ConflictResolutionDialog
          open={conflicts !== null}
          conflicts={conflicts}
          submitting={committing}
          onCancel={() => setConflicts(null)}
          onResolve={(r) => submitCommit(r)}
        />
      )}
    </>
  );
}
