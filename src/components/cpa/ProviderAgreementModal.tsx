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
import { useProviderAgreement, CURRENT_PROVIDER_AGREEMENT_VERSION } from "@/hooks/useProviderAgreement";
import { toast } from "@/hooks/use-toast";
import { ProviderAgreementContent } from "@/components/cpa/ProviderAgreementContent";

interface ProviderAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}

export function ProviderAgreementModal({ open, onOpenChange, onAccepted }: ProviderAgreementModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { recordAcceptance } = useProviderAgreement();

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
          <DialogTitle className="text-xl font-serif">DFY Provider Agreement</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Version: {CURRENT_PROVIDER_AGREEMENT_VERSION} &nbsp;·&nbsp; Please read carefully before accepting.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto max-h-[55vh] border border-border rounded-md p-4">
          <ProviderAgreementContent />
        </ScrollArea>

        <DialogFooter className="flex-col gap-3 sm:flex-col mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="provider-agree"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <label htmlFor="provider-agree" className="text-sm cursor-pointer">
              I have read and agree to the DFY Provider Agreement
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
