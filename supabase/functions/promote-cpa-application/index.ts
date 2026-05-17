import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // 1. Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResp, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userResp.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userResp.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const applicationId = typeof body.application_id === "string" ? body.application_id : null;
    if (!applicationId) return json({ error: "application_id required" }, 400);

    // 3. Load application
    const { data: app, error: appErr } = await admin
      .from("cpa_applications")
      .select("*")
      .eq("id", applicationId)
      .single();
    if (appErr || !app) return json({ error: "Application not found" }, 404);

    // 4. Find or invite the user
    let cpaUserId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === app.email.toLowerCase(),
    );

    if (existing) {
      cpaUserId = existing.id;
    } else {
      const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
        app.email,
        {
          data: { full_name: app.full_name, source: "cpa_network" },
          redirectTo: "https://shepi.ai/cpa/onboarding",
        },
      );
      if (inviteErr || !invite.user) {
        console.error("[promote-cpa-application] invite error", inviteErr);
        return json({ error: inviteErr?.message ?? "Could not invite user" }, 500);
      }
      cpaUserId = invite.user.id;
    }

    if (!cpaUserId) return json({ error: "User id missing" }, 500);

    // 5. Grant cpa role
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: cpaUserId, role: "cpa" }, { onConflict: "user_id,role" });
    if (roleErr) {
      console.error("[promote-cpa-application] role error", roleErr);
      return json({ error: "Could not grant CPA role" }, 500);
    }

    // 6. Create cpa_profile (or fetch existing)
    const { error: profileErr } = await admin.from("cpa_profiles").upsert(
      {
        user_id: cpaUserId,
        application_id: app.id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        state_of_licensure: app.state_of_licensure,
        license_number: app.license_number,
        years_experience: app.years_experience,
        linkedin_url: app.linkedin_url,
        states_served: [app.state_of_licensure],
      },
      { onConflict: "user_id" },
    );
    if (profileErr) {
      console.error("[promote-cpa-application] profile error", profileErr);
      return json({ error: "Could not create CPA profile" }, 500);
    }

    // 7. Mark application approved
    await admin
      .from("cpa_applications")
      .update({
        status: "approved",
        reviewer_user_id: userResp.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    // 8. Welcome email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const html = `
        <div style="font-family:sans-serif;max-width:520px">
          <h2 style="color:#4a7c94">Welcome to the shepi Network</h2>
          <p>Hi ${app.full_name.split(" ")[0]},</p>
          <p>Your application has been approved. ${
            existing
              ? "Sign in to <a href=\"https://shepi.ai/cpa/onboarding\">complete your onboarding</a>."
              : "Check your email for an invite link to set your password — it will land you on your onboarding page."
          }</p>
          <p>Onboarding takes about 10 minutes: confirm your license, upload your W-9 and proof of liability coverage, pick your industries and states.</p>
          <p style="color:#888;font-size:12px;margin-top:24px">— The shepi team</p>
        </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "shepi Network <partners@shepi.ai>",
          to: [app.email],
          subject: "Welcome to the shepi Network",
          html,
        }),
      }).catch((e) => console.error("[promote-cpa-application] email failed", e));
    }

    return json({ ok: true, cpa_user_id: cpaUserId, invited: !existing });
  } catch (err) {
    console.error("[promote-cpa-application] error", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
