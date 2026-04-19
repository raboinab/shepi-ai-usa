import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface DebtItem {
  lender: string;
  facilityType: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  maturityDate: string;
  monthlyPayment?: number;
  collateral?: string;
  covenants?: string[];
}

interface ExtractionResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  debts: DebtItem[];
  asOfDate: string;
  totalOutstanding: number;
  warnings: string[];
  documentName: string;
  extractedAt: string;
}

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

    const systemPrompt = `You are a financial document analyst specializing in M&A due diligence. Your task is to extract debt schedule information from the provided document.

Extract the following for each debt facility found:
- lender: Name of the lending institution
- facilityType: Type of facility (e.g., "Term Loan", "Revolver", "Line of Credit", "Equipment Loan", "SBA Loan", "Mortgage", "Other")
- originalAmount: Original principal amount (number)
- currentBalance: Current outstanding balance (number)
- interestRate: Annual interest rate as a percentage (e.g., 5.25 for 5.25%)
- maturityDate: Maturity date in YYYY-MM-DD format
- monthlyPayment: Monthly payment amount if available (number, optional)
- collateral: Description of collateral if secured (optional)
- covenants: Array of key covenant descriptions if available (optional)

Also determine:
- asOfDate: The "as of" date of the debt schedule in YYYY-MM-DD format
- totalOutstanding: Sum of all current balances

Return your response as a JSON object with the following structure:
{
  "debts": [...],
  "asOfDate": "YYYY-MM-DD",
  "totalOutstanding": number,
  "confidence": "high" | "medium" | "low",
  "warnings": ["any issues or assumptions made"]
}

Set confidence to:
- "high" if all fields are clearly visible and unambiguous
- "medium" if some interpretation was needed or minor fields are missing
- "low" if significant assumptions were made or data quality is poor`;

    const userPrompt = `Please analyze this debt schedule document (${fileName}) and extract all debt facilities and their terms.`;

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
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: fileBase64 } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON from the response
    let extracted;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extraction results");
    }

    const result: ExtractionResult = {
      success: true,
      confidence: extracted.confidence || 'medium',
      debts: extracted.debts || [],
      asOfDate: extracted.asOfDate || new Date().toISOString().split('T')[0],
      totalOutstanding: extracted.totalOutstanding || 0,
      warnings: extracted.warnings || [],
      documentName: fileName,
      extractedAt: new Date().toISOString(),
    };

    // If projectId and documentId provided, store in processed_data
    if (projectId && documentId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        const authHeader = req.headers.get("Authorization");
        let userId = null;

        if (authHeader) {
          // Get user from token
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
              data_type: "debt_schedule",
              data: result,
              validation_status: result.confidence === 'high' ? 'validated' : 'pending',
            }),
          });
        }
      }
    }

    // Fire-and-forget: embed project data for RAG
    if (projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ project_id: projectId, data_types: ["debt_schedule"], source: "upload" }),
        }).catch((e) => console.error("[process-debt-schedule] embed error:", e));
      } catch (e) { console.error("[process-debt-schedule] embed trigger error:", e); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-debt-schedule:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
