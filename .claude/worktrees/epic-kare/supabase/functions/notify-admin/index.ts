import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Shepi Notifications <notifications@shepi.ai>",
        to: ["hello@shepi.ai"],
        subject,
        html,
      }),
    });

    const result = await res.text();
    console.log("[NOTIFY-ADMIN]", payload.event_type, "email sent, status:", res.status, result);

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
