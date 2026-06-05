/**
 * ConflictResolutionDialog — shown when commit-workbook-upload returns CONFLICTS.
 * User picks "Keep mine" or "Keep theirs" for each conflicting field, then resubmits.
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export interface FieldConflict {
  kind: "tb" | "adjustment_amount" | "adjustment_deleted_vs_edited";
  label: string;
  conflictId: string;
  base: number | string | null;
  mine: number | string | null;
  theirs: number | string | null;
}

interface Props {
  open: boolean;
  conflicts: FieldConflict[];
  onCancel: () => void;
  onResolve: (resolutions: Record<string, "mine" | "theirs">) => void;
  submitting?: boolean;
}

const fmt = (v: number | string | null): string => {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return v;
};

export function ConflictResolutionDialog({ open, conflicts, onCancel, onResolve, submitting }: Props) {
  const [picks, setPicks] = useState<Record<string, "mine" | "theirs">>({});

  const allResolved = conflicts.every(c => picks[c.conflictId]);
  const setAll = (pick: "mine" | "theirs") => {
    const next: Record<string, "mine" | "theirs"> = {};
    for (const c of conflicts) next[c.conflictId] = pick;
    setPicks(next);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Resolve conflicts
          </DialogTitle>
          <DialogDescription>
            The same fields were edited both online and in your offline workbook. Pick which version to keep for each.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-xs">
          <Button size="sm" variant="outline" onClick={() => setAll("mine")} disabled={submitting}>Keep all mine</Button>
          <Button size="sm" variant="outline" onClick={() => setAll("theirs")} disabled={submitting}>Keep all theirs</Button>
          <div className="ml-auto text-muted-foreground self-center">
            {Object.keys(picks).length} of {conflicts.length} resolved
          </div>
        </div>

        <ScrollArea className="h-[420px] rounded-md border">
          <div className="p-2 space-y-2">
            {conflicts.map(c => (
              <div key={c.conflictId} className="rounded border bg-card p-3">
                <div className="text-sm font-medium mb-2">{c.label}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Original: <span className="font-mono">{fmt(c.base)}</span>
                </div>
                <RadioGroup
                  value={picks[c.conflictId] ?? ""}
                  onValueChange={(v) => setPicks(p => ({ ...p, [c.conflictId]: v as "mine" | "theirs" }))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Label className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-accent/30">
                      <RadioGroupItem value="mine" id={`${c.conflictId}-mine`} />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Your offline edit</div>
                        <div className="font-mono text-sm">{fmt(c.mine)}</div>
                      </div>
                    </Label>
                    <Label className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-accent/30">
                      <RadioGroupItem value="theirs" id={`${c.conflictId}-theirs`} />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Current online value</div>
                        <div className="font-mono text-sm">{fmt(c.theirs)}</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={() => onResolve(picks)} disabled={!allResolved || submitting}>
            Apply resolutions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
