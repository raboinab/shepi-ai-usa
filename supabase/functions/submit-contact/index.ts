import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  company?: string;
  role?: string;
  interest?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message, company, role, interest }: ContactRequest = await req.json();

    // Validate input
    if (!name || !email || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store submission in database
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: name.trim().substring(0, 100),
        email: email.trim().substring(0, 255),
        message: message.trim().substring(0, 5000),
        company: company?.trim().substring(0, 200) || null,
        role: role?.trim().substring(0, 100) || null,
        interest: interest?.trim().substring(0, 100) || null,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store submission" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Contact submission stored in database");

    // Helper function to escape HTML to prevent injection
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Send email notification using Resend API directly
    try {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
      const safeCompany = company ? escapeHtml(company) : null;
      const safeRole = role ? escapeHtml(role) : null;
      const safeInterest = interest ? escapeHtml(interest) : null;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "shepi Contact <notifications@shepi.ai>",
          to: ["hello@shepi.ai"],
          subject: `New Contact Form Submission from ${safeName}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            ${safeCompany ? `<p><strong>Company:</strong> ${safeCompany}</p>` : ''}
            ${safeRole ? `<p><strong>Role:</strong> ${safeRole}</p>` : ''}
            ${safeInterest ? `<p><strong>Interest:</strong> ${safeInterest}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This email was sent from the shepi.ai contact form.</p>
          `,
        }),
      });
      const emailData = await emailResponse.json();
      console.log("Email notification sent:", emailData);
    } catch (emailError) {
      // Log email error but don't fail the request - submission is already stored
      console.error("Email sending error:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Thank you for your message!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in submit-contact function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
