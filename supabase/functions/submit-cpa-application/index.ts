import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  full_name: string;
  email: string;
  phone?: string;
  state_of_licensure: string;
  license_number: string;
  years_experience?: number | null;
  qoe_background?: string;
  firm_affiliation?: string;
  side_work_permitted?: boolean | null;
  conflicts_disclosure?: string;
  linkedin_url?: string;
  referral_source?: string;
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function validate(p: any): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!p || typeof p !== "object") return { ok: false, error: "Invalid payload" };
  const full_name = clean(p.full_name, 200);
  const email = clean(p.email, 255);
  const state_of_licensure = clean(p.state_of_licensure, 64);
  const license_number = clean(p.license_number, 100);
  if (!full_name) return { ok: false, error: "Full name required" };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "Valid email required" };
  if (!state_of_licensure) return { ok: false, error: "State of licensure required" };
  if (!license_number) return { ok: false, error: "License number required" };

  const years = p.years_experience == null || p.years_experience === ""
    ? null
    : Number(p.years_experience);
  if (years != null && (!Number.isFinite(years) || years < 0 || years > 80))
    return { ok: false, error: "Years of experience must be 0-80" };

  return {
    ok: true,
    data: {
      full_name,
      email,
      phone: clean(p.phone, 64) ?? undefined,
      state_of_licensure,
      license_number,
      years_experience: years,
      qoe_background: clean(p.qoe_background, 4000) ?? undefined,
      firm_affiliation: clean(p.firm_affiliation, 200) ?? undefined,
      side_work_permitted:
        typeof p.side_work_permitted === "boolean" ? p.side_work_permitted : null,
      conflicts_disclosure: clean(p.conflicts_disclosure, 4000) ?? undefined,
      linkedin_url: clean(p.linkedin_url, 500) ?? undefined,
      referral_source: clean(p.referral_source, 500) ?? undefined,
    },
  };
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const raw = await req.json();
    const v = validate(raw);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: inserted, error } = await supabase
      .from("cpa_applications")
      .insert(v.data)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[submit-cpa-application] insert error", error);
      return new Response(JSON.stringify({ error: "Could not save application" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget emails
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const d = v.data;
      const adminHtml = `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#1a1a2e">New CPA Network application</h2>
          <p><strong>${esc(d.full_name)}</strong> &lt;${esc(d.email)}&gt;</p>
          <p>State: <strong>${esc(d.state_of_licensure)}</strong> · License: ${esc(d.license_number)}</p>
          ${d.firm_affiliation ? `<p>Firm: ${esc(d.firm_affiliation)}</p>` : ""}
          ${d.years_experience != null ? `<p>Experience: ${d.years_experience} years</p>` : ""}
          ${d.phone ? `<p>Phone: ${esc(d.phone)}</p>` : ""}
          ${d.linkedin_url ? `<p>LinkedIn: <a href="${esc(d.linkedin_url)}">${esc(d.linkedin_url)}</a></p>` : ""}
          ${d.qoe_background ? `<p><strong>QoE background</strong><br>${esc(d.qoe_background).replace(/\n/g, "<br>")}</p>` : ""}
          ${d.conflicts_disclosure ? `<p><strong>Conflicts disclosure</strong><br>${esc(d.conflicts_disclosure).replace(/\n/g, "<br>")}</p>` : ""}
          <p><a href="https://shepi.ai/admin/cpa-applications">Review in admin →</a></p>
        </div>`;

      const confirmHtml = `
        <div style="font-family:sans-serif;max-width:520px">
          <h2 style="color:#4a7c94">Thanks for applying to the shepi Network</h2>
          <p>Hi ${esc(d.full_name.split(" ")[0])},</p>
          <p>We received your application. A member of the team will review it and come back to you within <strong>3 business days</strong>.</p>
          <p>If you have anything to add — a recent QoE engagement, a sample workpaper, or a question — just reply to this email.</p>
          <p style="color:#888;font-size:12px;margin-top:24px">— The shepi team</p>
        </div>`;

      const sends = [
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "shepi Network <partners@shepi.ai>",
            to: ["partners@shepi.ai"],
            reply_to: d.email,
            subject: `CPA application: ${d.full_name} (${d.state_of_licensure})`,
            html: adminHtml,
          }),
        }).catch((e) => console.error("[submit-cpa-application] admin email failed", e)),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "shepi Network <partners@shepi.ai>",
            to: [d.email],
            subject: "We received your shepi Network application",
            html: confirmHtml,
          }),
        }).catch((e) => console.error("[submit-cpa-application] confirm email failed", e)),
      ];
      await Promise.all(sends);
    } else {
      console.warn("[submit-cpa-application] RESEND_API_KEY not set; skipping emails");
    }

    return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[submit-cpa-application] error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
