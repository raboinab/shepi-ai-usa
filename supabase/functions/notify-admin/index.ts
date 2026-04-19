import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotifyPayload {
  event_type: "signup" | "demo_view";
  user_email?: string;
  user_name?: string;
  page?: string;
}

function buildEmail(payload: NotifyPayload): { subject: string; html: string } {
  const name = payload.user_name || "Unknown";
  const email = payload.user_email || "Unknown";

  if (payload.event_type === "signup") {
    return {
      subject: `New Signup: ${email} (${name})`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2 style="color: #1a1a2e;">🎉 New User Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    };
  }

  return {
    subject: `Demo Viewed: ${email} viewed ${payload.page || "unknown page"}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #1a1a2e;">👀 Demo Page Viewed</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Page:</strong> ${payload.page || "N/A"}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      </div>
    `,
  };
}

function buildWelcomeEmail(name: string): { subject: string; html: string } {
  const firstName = name?.split(' ')[0] || 'there';
  return {
    subject: "Welcome to shepi — let's get started",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #4a7c94;">Welcome to shepi, ${firstName}! 🎉</h2>
        <p>We're excited to have you on board. shepi helps you run Quality of Earnings analyses faster and more accurately.</p>
        <p>Here's how to get started:</p>
        <ul>
          <li><strong>Create a project</strong> — set up your first deal in under a minute</li>
          <li><strong>Connect QuickBooks or upload files</strong> — we'll pull in trial balances, financial statements, and more</li>
          <li><strong>Generate your QoE report</strong> — our AI helps you identify adjustments and build your analysis</li>
        </ul>
        <p>
          <a href="https://shepi-ai.lovable.app/dashboard"
             style="display: inline-block; background: #4a7c94; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Create Your First Project →
          </a>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">
          Questions? Just reply to this email — we're happy to help you get set up.
        </p>
        <p style="color: #888; font-size: 12px;">— The shepi Team</p>
      </div>
    `,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotifyPayload = await req.json();

    if (!payload.event_type) {
      return new Response(
        JSON.stringify({ error: "event_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[NOTIFY-ADMIN] RESEND_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = buildEmail(payload);

    // Build list of email sends
    const sends: Promise<any>[] = [];

    // 1. Admin notification (always)
    sends.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "shepi Notifications <notifications@shepi.ai>",
          to: ["hello@shepi.ai"],
          subject,
          html,
        }),
      }).then(async (res) => {
        const result = await res.text();
        console.log("[NOTIFY-ADMIN] admin email sent, status:", res.status, result);
        return { type: "admin", status: res.status };
      })
    );

    // 2. Welcome email to user (only on signup with valid email)
    if (payload.event_type === "signup" && payload.user_email && payload.user_email !== "Unknown") {
      const welcome = buildWelcomeEmail(payload.user_name || "");

      sends.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "shepi <notifications@shepi.ai>",
            to: [payload.user_email],
            subject: welcome.subject,
            html: welcome.html,
          }),
        }).then(async (res) => {
          const result = await res.json();
          console.log("[NOTIFY-ADMIN] welcome email sent to", payload.user_email, "status:", res.status);

          // Log to nudge_log as day_0
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

            // Look up user_id from email
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const user = usersData?.users?.find((u: any) => u.email === payload.user_email);

            if (user) {
              await supabaseAdmin.from("nudge_log").insert({
                user_id: user.id,
                nudge_type: "day_0",
                email_id: result.id || null,
              });
              console.log("[NOTIFY-ADMIN] day_0 nudge logged for user", user.id);
            }
          } catch (logErr) {
            console.error("[NOTIFY-ADMIN] Failed to log day_0 nudge:", logErr);
          }

          return { type: "welcome", status: res.status };
        })
      );
    }

    await Promise.all(sends);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[NOTIFY-ADMIN] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
