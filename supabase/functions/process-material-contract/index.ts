import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ContractItem {
  contractType: string;
  counterparty: string;
  description: string;
  effectiveDate?: string;
  expirationDate?: string;
  contractValue?: number;
  annualValue?: number;
  renewalTerms?: string;
  terminationTerms?: string;
  changeOfControl?: string;
  keyObligations?: string[];
  concerns?: string[];
}

interface ContractSummary {
  totalContracts: number;
  byType: Record<string, number>;
  upcomingExpirations: number;
  hasChangeOfControlRisk: boolean;
}

interface ExtractionResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  contracts: ContractItem[];
  summary: ContractSummary;
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

    const systemPrompt = `You are a legal analyst specializing in M&A due diligence. Your task is to analyze a material contract and extract key terms relevant to a transaction.

Extract the following information:
- contractType: Category (e.g., "Customer", "Vendor/Supplier", "Lease", "Employment", "Service Agreement", "License", "Loan/Credit", "Other")
- counterparty: Name of the other party to the contract
- description: Brief summary of the contract purpose (1-2 sentences)
- effectiveDate: Start date in YYYY-MM-DD format if available
- expirationDate: End date in YYYY-MM-DD format if available
- contractValue: Total contract value in dollars if applicable
- annualValue: Annual value in dollars if applicable
- renewalTerms: How the contract renews (e.g., "Auto-renews annually", "Month-to-month", "Fixed term - no renewal")
- terminationTerms: Termination provisions and notice requirements
- changeOfControl: Any change of control provisions (CRITICAL for M&A - extract verbatim if found)
- keyObligations: Array of key obligations or requirements
- concerns: Array of M&A-relevant concerns or risks identified

Also provide a summary with:
- totalContracts: Number of contracts found (usually 1 per document)
- byType: Count by contract type
- upcomingExpirations: Count of contracts expiring within 12 months from today
- hasChangeOfControlRisk: true if there are concerning change of control provisions

Return your response as a JSON object:
{
  "contracts": [...],
  "summary": {...},
  "confidence": "high" | "medium" | "low",
  "warnings": ["any issues or assumptions made"]
}

Set confidence to:
- "high" if contract terms are clear and complete
- "medium" if some interpretation was needed
- "low" if significant terms are unclear or document quality is poor

Pay special attention to:
1. Change of control clauses (can kill deals)
2. Assignment restrictions
3. Key person provisions
4. Exclusivity clauses
5. Termination for convenience rights
6. Material adverse change provisions`;

    const userPrompt = `Please analyze this contract document (${fileName}) and extract all material terms relevant to M&A due diligence.`;

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

    if (!content) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON from the response
    let extracted;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extraction results");
    }

    // Build summary if not provided
    const contracts = extracted.contracts || [];
    const summary: ContractSummary = extracted.summary || {
      totalContracts: contracts.length,
      byType: contracts.reduce((acc: Record<string, number>, c: ContractItem) => {
        acc[c.contractType] = (acc[c.contractType] || 0) + 1;
        return acc;
      }, {}),
      upcomingExpirations: contracts.filter((c: ContractItem) => {
        if (!c.expirationDate) return false;
        const expDate = new Date(c.expirationDate);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return expDate <= oneYearFromNow;
      }).length,
      hasChangeOfControlRisk: contracts.some((c: ContractItem) => 
        c.changeOfControl && c.changeOfControl.toLowerCase() !== 'none'
      ),
    };

    const result: ExtractionResult = {
      success: true,
      confidence: extracted.confidence || 'medium',
      contracts,
      summary,
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
              data_type: "material_contract",
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
          body: JSON.stringify({ project_id: projectId, data_types: ["material_contract"], source: "upload" }),
        }).catch((e) => console.error("[process-material-contract] embed error:", e));
      } catch (e) { console.error("[process-material-contract] embed trigger error:", e); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-material-contract:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
