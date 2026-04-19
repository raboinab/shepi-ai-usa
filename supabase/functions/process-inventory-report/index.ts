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

    const systemPrompt = `You are a financial analyst specializing in inventory valuation for M&A due diligence. Extract structured inventory data from this document.

Extract the following:
- asOfDate: The date this inventory report is as of, in YYYY-MM-DD format, or null
- totalInventoryValue: Total inventory value in dollars
- categories: Array of inventory categories, each with:
  - category: Name/type of inventory (e.g., "Raw Materials", "Work in Progress", "Finished Goods")
  - value: Dollar value of this category
  - quantity: Number of units if available, or null
  - method: Valuation method if stated: "FIFO" | "LIFO" | "weighted_avg" | "specific_id" | "other" | null
- obsoleteReserve: Dollar amount of obsolescence or slow-moving reserve, or null
- turnoverDays: Inventory turnover in days if calculable, or null
- warnings: Array of concerns (e.g., "Large obsolescence reserve relative to total", "Concentration in single category", "No valuation method stated")
- confidence: "high" | "medium" | "low"
- summary: 2-3 sentence summary

Return as JSON:
{
  "asOfDate": "...",
  "totalInventoryValue": ...,
  "categories": [...],
  "obsoleteReserve": ...,
  "turnoverDays": ...,
  "warnings": [...],
  "confidence": "...",
  "summary": "..."
}

Pay special attention to:
1. Obsolescence reserves (can indicate stale inventory)
2. Concentration in a single category
3. Valuation method consistency
4. Significant changes in inventory levels if comparative data is present
5. Related-party inventory transactions`;

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
              { type: "text", text: `Please analyze this inventory report (${fileName}) and extract all relevant data.` },
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
              data_type: "inventory",
              data: result,
              validation_status: result.confidence === "high" ? "validated" : "pending",
            }),
          });
        }
      }
    }

    if (projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ project_id: projectId, data_types: ["inventory"], source: "upload" }),
        }).catch((e) => console.error("[process-inventory-report] embed error:", e));
      } catch (e) { console.error("[process-inventory-report] embed trigger error:", e); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-inventory-report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
