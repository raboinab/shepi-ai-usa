import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NudgeCandidate {
  user_id: string;
  email: string;
  full_name: string | null;
  days_since_signup: number;
  nudge_type: string;
}

function buildNudgeEmail(candidate: NudgeCandidate): { subject: string; html: string } {
  const name = candidate.full_name?.split(' ')[0] || 'there';

  if (candidate.nudge_type === 'day_3') {
    return {
      subject: `Need help getting started, ${name}?`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #4a7c94;">Hey ${name} 👋</h2>
          <p>We noticed you signed up for shepi a few days ago but haven't created a project yet.</p>
          <p>Setting up your first Quality of Earnings analysis takes just a few minutes. We can help you:</p>
          <ul>
            <li>Connect your QuickBooks data automatically</li>
            <li>Upload financial statements and CIMs</li>
            <li>Generate your first QoE report</li>
          </ul>
          <p><a href="https://shepi-ai.lovable.app/dashboard" style="display: inline-block; background: #4a7c94; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Get Started →</a></p>
          <p style="color: #888; font-size: 13px;">Need help? Just reply to this email — we're happy to walk you through it.</p>
          <p style="color: #888; font-size: 12px;">— The shepi Team</p>
        </div>
      `,
    };
  }

  if (candidate.nudge_type === 'day_7') {
    return {
      subject: `Your deal data is waiting, ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #4a7c94;">Hi ${name} 👋</h2>
          <p>It's been about a week since you signed up for shepi. We wanted to make sure you know about some powerful features:</p>
          <ul>
            <li><strong>QuickBooks Integration</strong> — Pull trial balances and financial data automatically</li>
            <li><strong>CIM Upload</strong> — Our AI extracts key deal metrics from your CIM</li>
            <li><strong>Automated QoE</strong> — Generate a Quality of Earnings report in minutes</li>
          </ul>
          <p><a href="https://shepi-ai.lovable.app/dashboard" style="display: inline-block; background: #4a7c94; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Create Your First Project →</a></p>
          <p style="color: #888; font-size: 13px;">Questions? Reply to this email or book a quick call with our team.</p>
          <p style="color: #888; font-size: 12px;">— The shepi Team</p>
        </div>
      `,
    };
  }

  // day_14
  return {
    subject: `Still interested in shepi, ${name}?`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #4a7c94;">Hi ${name} 👋</h2>
        <p>We haven't seen you on shepi in a while. We understand — deal diligence is busy work.</p>
        <p>If you'd like a quick walkthrough of how shepi can save you hours on your next QoE analysis, we'd love to show you.</p>
        <p><a href="https://shepi-ai.lovable.app/dashboard" style="display: inline-block; background: #4a7c94; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log Back In →</a></p>
        <p>Or simply reply to schedule a 15-minute call with our team.</p>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get engagement stats
    const { data: users, error: statsError } = await supabaseAdmin.rpc('get_user_engagement_stats');
    if (statsError) throw statsError;

    // Get existing nudges
    const { data: existingNudges } = await supabaseAdmin.from('nudge_log').select('user_id, nudge_type').limit(1000000);
    const nudgeSet = new Set((existingNudges || []).map((n: any) => `${n.user_id}:${n.nudge_type}`));

    const now = new Date();
    const candidates: NudgeCandidate[] = [];

    for (const user of (users || [])) {
      // Skip users who have completed onboarding and uploaded docs (Active)
      if (user.has_completed_onboarding && user.document_count > 0) continue;

      const daysSinceSignup = Math.floor((now.getTime() - new Date(user.signed_up_at).getTime()) / (1000 * 60 * 60 * 24));

      // Determine which nudge to send
      let nudgeType: string | null = null;
      if (daysSinceSignup >= 14 && !nudgeSet.has(`${user.user_id}:day_14`)) {
        nudgeType = 'day_14';
      } else if (daysSinceSignup >= 7 && !nudgeSet.has(`${user.user_id}:day_7`)) {
        nudgeType = 'day_7';
      } else if (daysSinceSignup >= 3 && !nudgeSet.has(`${user.user_id}:day_3`)) {
        nudgeType = 'day_3';
      }

      if (nudgeType && user.email) {
        candidates.push({
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          days_since_signup: daysSinceSignup,
          nudge_type: nudgeType,
        });
      }
    }

    console.log(`[ENGAGEMENT] Found ${candidates.length} nudge candidates`);

    let sentCount = 0;
    const results: any[] = [];

    for (const candidate of candidates) {
      const { subject, html } = buildNudgeEmail(candidate);

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "shepi <notifications@shepi.ai>",
            to: [candidate.email],
            subject,
            html,
          }),
        });

        const result = await res.json();
        console.log(`[ENGAGEMENT] Sent ${candidate.nudge_type} to ${candidate.email}: ${res.status}`);

        // Log the nudge
        await supabaseAdmin.from('nudge_log').insert({
          user_id: candidate.user_id,
          nudge_type: candidate.nudge_type,
          email_id: result.id || null,
        });

        sentCount++;
        results.push({ email: candidate.email, nudge_type: candidate.nudge_type, status: 'sent' });
      } catch (err) {
        console.error(`[ENGAGEMENT] Failed to send to ${candidate.email}:`, err);
        results.push({ email: candidate.email, nudge_type: candidate.nudge_type, status: 'failed' });
      }
    }

    return new Response(
      JSON.stringify({ sent_count: sentCount, total_candidates: candidates.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ENGAGEMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
