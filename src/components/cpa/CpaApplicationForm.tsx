import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(200),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(64).optional().or(z.literal("")),
  state_of_licensure: z.string().trim().min(2, "Required").max(64),
  license_number: z.string().trim().min(1, "Required").max(100),
  years_experience: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 80), "0-80"),
  firm_affiliation: z.string().trim().max(200).optional().or(z.literal("")),
  side_work_permitted: z.boolean().optional(),
  qoe_background: z.string().trim().max(4000).optional().or(z.literal("")),
  conflicts_disclosure: z.string().trim().max(4000).optional().or(z.literal("")),
  linkedin_url: z.string().trim().max(500).optional().or(z.literal("")),
  referral_source: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormState = z.infer<typeof schema>;

const initial: FormState = {
  full_name: "",
  email: "",
  phone: "",
  state_of_licensure: "",
  license_number: "",
  years_experience: "",
  firm_affiliation: "",
  side_work_permitted: false,
  qoe_background: "",
  conflicts_disclosure: "",
  linkedin_url: "",
  referral_source: "",
};

export function CpaApplicationForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) e[String(issue.path[0])] = issue.message;
      }
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...parsed.data,
        years_experience: parsed.data.years_experience
          ? Number(parsed.data.years_experience)
          : null,
      };
      const { data, error } = await supabase.functions.invoke(
        "submit-cpa-application",
        { body: payload },
      );
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error || error?.message || "Submission failed");
      }
      setDone(true);
      toast({
        title: "Application received",
        description: "We'll come back within 3 business days.",
      });
    } catch (err: any) {
      toast({
        title: "Couldn't submit",
        description: err?.message ?? "Please try again or email partners@shepi.ai.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="not-prose rounded-lg border border-border bg-muted/30 p-6 flex gap-4">
        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-semibold mb-1">Application received</h3>
          <p className="text-muted-foreground">
            Thanks. We'll review and come back within 3 business days. If you have anything to add,
            just reply to the confirmation email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="not-prose space-y-5 rounded-lg border border-border bg-card p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.full_name}>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={200} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
        </Field>
        <Field label="State of licensure" required error={errors.state_of_licensure}>
          <Input placeholder="e.g. TX" value={form.state_of_licensure} onChange={(e) => set("state_of_licensure", e.target.value)} maxLength={64} />
        </Field>
        <Field label="License number" required error={errors.license_number}>
          <Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} maxLength={100} />
        </Field>
        <Field label="Years of experience" error={errors.years_experience}>
          <Input inputMode="numeric" value={form.years_experience ?? ""} onChange={(e) => set("years_experience", e.target.value)} maxLength={2} />
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={64} />
        </Field>
        <Field label="Current firm (if any)" error={errors.firm_affiliation}>
          <Input value={form.firm_affiliation ?? ""} onChange={(e) => set("firm_affiliation", e.target.value)} maxLength={200} />
        </Field>
        <Field label="LinkedIn URL" error={errors.linkedin_url}>
          <Input placeholder="https://linkedin.com/in/…" value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} maxLength={500} />
        </Field>
      </div>

      <Field label="Short note on your QoE / transaction-services background" error={errors.qoe_background}>
        <Textarea
          rows={4}
          value={form.qoe_background ?? ""}
          onChange={(e) => set("qoe_background", e.target.value)}
          maxLength={4000}
          placeholder="A few sentences on the kind of QoE work you've done — deal sizes, industries, sell-side vs buy-side."
        />
      </Field>

      <Field label="Independence conflicts you'd want to flag" error={errors.conflicts_disclosure}>
        <Textarea
          rows={3}
          value={form.conflicts_disclosure ?? ""}
          onChange={(e) => set("conflicts_disclosure", e.target.value)}
          maxLength={4000}
          placeholder="Industries, firms, or types of engagements you'd need to decline."
        />
      </Field>

      <Field label="How did you hear about us? (optional)" error={errors.referral_source}>
        <Input value={form.referral_source ?? ""} onChange={(e) => set("referral_source", e.target.value)} maxLength={500} />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox
          checked={!!form.side_work_permitted}
          onCheckedChange={(v) => set("side_work_permitted", v === true)}
          className="mt-0.5"
        />
        <span>
          I've confirmed that side work through shepi is permitted by my current employer, or I'm
          independent.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit application"}
        </Button>
        <span className="text-xs text-muted-foreground">
          We respond within 3 business days.
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
