import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileBase64, fileName, projectId } = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a commercial real estate analyst specializing in M&A due diligence lease reviews. Extract structured lease terms from the document.

Extract the following:
- leaseType: "operating" | "finance" | "capital" | "other"
- premises: Address or description of the leased property
- landlord: Name of the landlord/lessor
- tenant: Name of the tenant/lessee
- commencementDate: Start date in YYYY-MM-DD format if available, or null
- expirationDate: End date in YYYY-MM-DD format if available, or null
- monthlyRent: Monthly base rent in dollars, or null
- annualRent: Annual base rent in dollars, or null
- escalationTerms: Description of rent escalation provisions (e.g., "3% annual increase"), or null
- cam_nnn: Monthly CAM/NNN/operating expense charges in dollars, or null
- securityDeposit: Security deposit amount in dollars, or null
- renewalOptions: Description of renewal options, or null
- terminationTerms: Early termination provisions and notice requirements, or null
- personalGuarantee: true if a personal guarantee exists, false if explicitly none, null if unclear
- relatedParty: true if landlord appears to be an owner/insider/related party, false if clearly arm's length, null if unclear
- keyTerms: Array of other notable lease terms relevant to M&A
- warnings: Array of concerns or risks (e.g., above-market rent, short remaining term, related-party indicators)
- summary: 2-3 sentence summary of the lease

Return as JSON:
{
  "leaseType": "...",
  "premises": "...",
  "landlord": "...",
  "tenant": "...",
  "commencementDate": "...",
  "expirationDate": "...",
  "monthlyRent": ...,
  "annualRent": ...,
  "escalationTerms": "...",
  "cam_nnn": ...,
  "securityDeposit": ...,
  "renewalOptions": "...",
  "terminationTerms": "...",
  "personalGuarantee": ...,
  "relatedParty": ...,
  "keyTerms": [...],
  "warnings": [...],
  "confidence": "high" | "medium" | "low",
  "summary": "..."
}

Pay special attention to:
1. Related-party indicators (landlord sharing name/address with business owner)
2. Above-market rent (flag if rent seems high for the premises type)
3. Personal guarantees
4. Change of control or assignment restrictions
5. Remaining term vs. typical market terms`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Please analyze this lease agreement (${fileName}) and extract all relevant terms.` },
              { type: "image_url", image_url: { url: fileBase64 } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI model");

    let extracted;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extraction results");
    }

    const result = {
      success: true,
      confidence: extracted.confidence || "medium",
      ...extracted,
      documentName: fileName,
      extractedAt: new Date().toISOString(),
    };

    // Store in documents.parsed_summary via service role
    if (projectId && documentId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
          const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { Authorization: authHeader, apikey: supabaseKey },
          });
          if (tokenResponse.ok) {
            const user = await tokenResponse.json();
            userId = user.id;
          }
        }
        if (userId) {
          await fetch(`${supabaseUrl}/rest/v1/processed_data`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              project_id: projectId,
              user_id: userId,
              source_document_id: documentId,
              source_type: "ai_extraction",
              data_type: "lease_agreement",
              data: result,
              validation_status: result.confidence === "high" ? "validated" : "pending",
            }),
          });
        }
      }
    }

    // Fire-and-forget: embed for RAG
    if (projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ project_id: projectId, data_types: ["lease_agreement"], source: "upload" }),
        }).catch((e) => console.error("[process-lease-agreement] embed error:", e));
      } catch (e) { console.error("[process-lease-agreement] embed trigger error:", e); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-lease-agreement:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
