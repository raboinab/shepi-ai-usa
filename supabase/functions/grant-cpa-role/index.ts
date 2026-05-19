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
    const userId = typeof body.user_id === "string" ? body.user_id : null;
    if (!userId) return json({ error: "user_id required" }, 400);
    const sendEmail = body.send_email !== false; // default true

    // 3. Look up auth user (need email + name)
    const { data: authUserResp, error: authErr } =
      await admin.auth.admin.getUserById(userId);
    if (authErr || !authUserResp.user) {
      return json({ error: "User not found" }, 404);
    }
    const authUser = authUserResp.user;
    const email = authUser.email ?? "";
    const metaName =
      (authUser.user_metadata as Record<string, unknown> | null)?.full_name as
        | string
        | undefined;

    // Fallback to profiles table
    let fullName = metaName ?? "";
    if (!fullName) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      fullName = (prof?.full_name as string | undefined) ?? email ?? "CPA";
    }

    // 4. Grant cpa role
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "cpa" }, { onConflict: "user_id,role" });
    if (roleErr) return json({ error: "Could not grant CPA role" }, 500);

    // 5. Ensure cpa_profiles row exists (don't overwrite if present)
    const { data: existingProfile } = await admin
      .from("cpa_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let createdProfile = false;
    if (!existingProfile) {
      const { error: profileErr } = await admin.from("cpa_profiles").insert({
        user_id: userId,
        full_name: fullName,
        email,
        license_number: "",
        state_of_licensure: "",
        states_served: [],
        industries: [],
        active: true,
      });
      if (profileErr) {
        console.error("[grant-cpa-role] profile error", profileErr);
        return json({ error: "Could not create CPA profile" }, 500);
      }
      createdProfile = true;
    }

    // 6. Welcome email (Resend)
    let sentEmail = false;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (sendEmail && resendKey && email) {
      const firstName = (fullName || email).split(" ")[0];
      const html = `
        <div style="font-family:sans-serif;max-width:520px">
          <h2 style="color:#4a7c94">Welcome to the shepi Network</h2>
          <p>Hi ${firstName},</p>
          <p>You've been added as a reviewer on shepi. Sign in to
            <a href="https://shepi.ai/cpa/onboarding">complete your onboarding</a>
            — confirm your license, upload your W-9 and proof of liability
            coverage, and pick your industries and states. It takes about 10 minutes.</p>
          <p>Once you're set up, head to
            <a href="https://shepi.ai/cpa">your queue</a> to claim engagements.</p>
          <p style="color:#888;font-size:12px;margin-top:24px">— The shepi team</p>
        </div>`;
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "shepi Partners <partners@shepi.ai>",
          to: [email],
          subject: "Welcome to the shepi Network",
          html,
        }),
      });
      sentEmail = resp.ok;
      if (!resp.ok) {
        console.warn("[grant-cpa-role] resend non-ok", resp.status, await resp.text());
      }
    }

    return json({ ok: true, user_id: userId, created_profile: createdProfile, sent_email: sentEmail });
  } catch (e) {
    console.error("[grant-cpa-role] error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
