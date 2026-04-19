import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useTosAcceptance, CURRENT_TOS_VERSION } from "@/hooks/useTosAcceptance";
import { toast } from "@/hooks/use-toast";
import { TermsContent } from "@/components/terms/TermsContent";

interface TermsAcceptanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}

export function TermsAcceptanceModal({ open, onOpenChange, onAccepted }: TermsAcceptanceModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { recordAcceptance } = useTosAcceptance();

  const handleAccept = async () => {
    if (!checked) return;
    setSubmitting(true);
    const ok = await recordAcceptance();
    setSubmitting(false);

    if (!ok) {
      toast({
        title: "Error",
        description: "Failed to record your acceptance. Please try again.",
        variant: "destructive",
      });
      return;
    }

    onOpenChange(false);
    onAccepted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">shepi Unified Terms of Service</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Effective Date: {CURRENT_TOS_VERSION} &nbsp;·&nbsp; Please read carefully before using the Service.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto max-h-[55vh] border border-border rounded-md p-4">
          <TermsContent />
        </ScrollArea>

        <DialogFooter className="flex-col gap-3 sm:flex-col mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="tos-agree"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <label htmlFor="tos-agree" className="text-sm cursor-pointer">
              I have read and agree to the Terms of Service
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={!checked || submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept &amp; Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
