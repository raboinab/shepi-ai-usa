import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface BackfillDoc {
  id: string;
  name: string;
  institution: string | null;
  account_label: string | null;
  period_start: string | null;
  period_end: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docs: BackfillDoc[];
  onSaved: () => void;
}

export const AccountLabelBackfillDialog = ({ open, onOpenChange, docs, onSaved }: Props) => {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const next: Record<string, string> = {};
      for (const d of docs) next[d.id] = d.account_label || "";
      setLabels(next);
    }
  }, [open, docs]);

  const handleSave = async () => {
    const updates = docs
      .map((d) => ({ id: d.id, label: (labels[d.id] || "").trim() }))
      .filter((u) => u.label.length > 0);

    if (updates.length === 0) {
      toast.error("Enter a label for at least one document");
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("documents").update({ account_label: u.label }).eq("id", u.id)
        )
      );
      const failed = results.filter((r) => r.error).length;
      if (failed > 0) {
        toast.error(`Failed to update ${failed} document(s)`);
      } else {
        toast.success(`Labeled ${updates.length} document(s)`);
        onSaved();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save labels");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Label accounts</DialogTitle>
          <DialogDescription>
            Per-account coverage needs a distinct label per account (e.g. "Operating ·&nbsp;…4521",
            "Payroll ·&nbsp;…8830"). Same label = same account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {docs.map((d) => (
            <div key={d.id} className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 items-start p-3 rounded-md border">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.institution || "Unknown institution"} · {fmt(d.period_start)}&nbsp;–&nbsp;{fmt(d.period_end)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Account label</Label>
                <Input
                  value={labels[d.id] ?? ""}
                  onChange={(e) => setLabels((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="e.g., Operating ·…4521"
                  maxLength={80}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Save labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
