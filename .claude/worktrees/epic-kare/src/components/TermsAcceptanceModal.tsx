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
          <DialogTitle className="text-xl font-serif">Shepi Terms of Service</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Effective Date: {CURRENT_TOS_VERSION} &nbsp;·&nbsp; Please read carefully before purchasing.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto max-h-[55vh] border border-border rounded-md p-4">
          <div className="space-y-5 text-sm leading-relaxed">
            <p>
              These Terms of Service ("Terms") govern access to and use of the Shepi platform and related services (the "Service") operated by SMB EDGE, located in Herndon, Virginia ("Shepi," "we," "us," or "our").
            </p>
            <p>
              By accessing or using the Service, you ("you" or "User") agree to these Terms. If you do not agree, do not use the Service.
            </p>

            <section>
              <h3 className="font-semibold mb-2">1. Description of the Service</h3>
              <p>Shepi provides a cloud-based software platform designed to assist users in organizing, analyzing, and transforming financial and business information supplied by the user.</p>
              <p className="mt-2">The Service may include automated logic, data extraction tools, and artificial intelligence ("AI") systems to assist with processing and generating analytical outputs.</p>
              <p className="mt-2">Shepi may offer: Self-service subscription access; and Optional paid service enhancements or assisted engagements, as described within the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. No Professional Advice</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Shepi is a software provider.</li>
                <li>The Service does not provide accounting, auditing, tax, legal, investment, valuation, or other professional advice.</li>
                <li>Outputs are informational and analytical only.</li>
                <li>Shepi does not verify the completeness or accuracy of user-submitted data.</li>
                <li>Use of the Service does not create a fiduciary, advisory, or professional relationship.</li>
                <li>You are solely responsible for decisions, filings, negotiations, transactions, and representations made using the Service.</li>
                <li>You should consult qualified professionals before relying on outputs for business or financial decisions.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Artificial Intelligence Disclosure</h3>
              <p>The Service may use AI or machine-learning systems to assist with data extraction, classification, normalization, or summarization. You acknowledge and agree:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>AI-generated outputs may be incomplete, inaccurate, or non-deterministic.</li>
                <li>Outputs are generated based on patterns and probabilities, not verified facts.</li>
                <li>AI outputs must be independently reviewed and validated before use.</li>
                <li>Shepi disclaims liability for reliance on AI-assisted outputs.</li>
              </ul>
              <p className="mt-2 font-medium">No Model Training on Customer Data</p>
              <p>Shepi does not use Customer Data to train generalized AI models for use outside your use of the Service. Customer Data is processed solely for the purpose of providing the Service.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. User Responsibilities</h3>
              <p>You represent and warrant that:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>You have the legal right to upload and process all data submitted.</li>
                <li>Customer Data is accurate and complete to the best of your knowledge.</li>
                <li>You are responsible for reviewing and validating all outputs.</li>
                <li>You will not use the Service for unlawful, deceptive, or fraudulent purposes.</li>
                <li>Outputs depend on the quality and completeness of your inputs.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Accounts and Security</h3>
              <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>
              <p className="mt-2">Shepi may suspend or terminate access if: These Terms are violated; Use poses security, legal, or operational risk; or Required by law.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Data Ownership</h3>
              <p className="font-medium">Customer Data</p>
              <p className="mt-1">You retain ownership of all data and documents you upload ("Customer Data"). You grant Shepi a limited, non-exclusive license to host, process, and analyze Customer Data solely to provide the Service.</p>
              <p className="font-medium mt-3">Outputs</p>
              <p className="mt-1">You may use outputs generated by the Service for lawful internal or commercial purposes. Outputs are not certified, audited, or guaranteed.</p>
              <p className="font-medium mt-3">Platform Intellectual Property</p>
              <p className="mt-1">Shepi retains all rights to: The Service; Software, workflows, models, and underlying systems; All improvements and derivatives. You may not reverse engineer, copy, or attempt to replicate the Service.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Acceptable Use</h3>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Attempt to access non-public portions of the Service</li>
                <li>Interfere with platform integrity</li>
                <li>Use the Service to develop a competing product</li>
                <li>Misrepresent outputs as audited, certified, or independently verified</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Payments and Subscriptions</h3>
              <p>If you purchase a subscription:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Fees are billed in advance as described at checkout.</li>
                <li>Fees are non-refundable unless required by law.</li>
                <li>Shepi may modify pricing with reasonable notice.</li>
                <li>Optional service enhancements may be subject to separate terms or written agreements.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">9. Service Availability</h3>
              <p>The Service is provided "as-is" and "as-available." Shepi does not guarantee uninterrupted or error-free operation and may modify or discontinue features at any time.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">10. Disclaimers</h3>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>The Service and all outputs are provided without warranties of any kind.</li>
                <li>Shepi disclaims warranties of accuracy, merchantability, fitness for a particular purpose, and non-infringement.</li>
                <li>Shepi does not guarantee that outputs will meet your expectations or regulatory requirements.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">11. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Shepi shall not be liable for indirect, incidental, consequential, special, or punitive damages.</li>
                <li>Shepi shall not be liable for lost profits, lost transactions, or reliance damages.</li>
                <li>Shepi's total liability shall not exceed the amount you paid to Shepi in the twelve (12) months preceding the claim.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">12. Indemnification</h3>
              <p>You agree to indemnify and hold harmless Shepi from claims arising out of: Your use of the Service; Your Customer Data; Your reliance on outputs; Your violation of these Terms.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">13. Governing Law</h3>
              <p>These Terms are governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles. Any disputes shall be resolved in the state or federal courts located in Virginia.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">14. Changes to Terms</h3>
              <p>Shepi may update these Terms from time to time. Continued use of the Service after updates constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">15. Contact</h3>
              <p>SMB EDGE<br />Herndon, Virginia<br />Email: hello@shepi.ai</p>
            </section>
          </div>
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
