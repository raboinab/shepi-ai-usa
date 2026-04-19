import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CIMInsights {
  businessOverview: {
    description: string;
    foundedYear: string | null;
    headquarters: string | null;
    employeeCount: string | null;
  };
  productsAndServices: Array<{
    name: string;
    description: string;
    revenuePercentage: number | null;
  }>;
  marketPosition: {
    industry: string;
    competitiveAdvantages: string[];
    marketSize: string | null;
  };
  managementTeam: Array<{
    name: string;
    title: string;
    tenure: string | null;
  }>;
  customerInsights: {
    topCustomerConcentration: string | null;
    retentionRate: string | null;
    geographicDistribution: string | null;
  };
  growthDrivers: string[];
  keyRisks: string[];
  financialHighlights: {
    revenueGrowth: string | null;
    ebitdaMargin: string | null;
    notes: string[];
  };
  dealContext: {
    reasonForSale: string | null;
    timeline: string | null;
    sellerExpectations: string | null;
  };
  rawSummary: string;
  extractedAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId, documentText } = await req.json();
    
    if (!documentId || !projectId) {
      return new Response(
        JSON.stringify({ error: "documentId and projectId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the document to find the file and user
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("Document not found:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", documentId);

    // Download file from storage for vision-based extraction
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error("Failed to download file:", downloadError);
      throw new Error("Failed to download CIM document");
    }

    console.log(`Downloaded CIM file, size: ${fileData.size} bytes`);

    // Convert file to base64 for vision API (chunked to avoid stack overflow on large files)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64Data = btoa(binary);

    // Determine MIME type from file extension
    const fileExtension = document.name?.split('.').pop()?.toLowerCase() || 'pdf';
    let mimeType = 'application/pdf';
    if (['jpg', 'jpeg'].includes(fileExtension)) mimeType = 'image/jpeg';
    else if (fileExtension === 'png') mimeType = 'image/png';
    else if (fileExtension === 'webp') mimeType = 'image/webp';

    console.log(`File type: ${fileExtension}, MIME: ${mimeType}, base64 length: ${base64Data.length}`);

    const extractionPrompt = `You are an expert M&A analyst. Analyze this Confidential Information Memorandum (CIM) document and extract structured business insights.

CRITICAL INSTRUCTIONS:
- Only extract information that is EXPLICITLY stated in the document
- Do NOT infer, guess, or fabricate any details
- If specific information is not clearly stated in the document, use null for that field
- Read ALL pages of the document carefully

Extract the following information and return it as valid JSON:

{
  "businessOverview": {
    "description": "Brief company description (2-3 sentences) - ONLY from document text",
    "foundedYear": "Year founded or null if not stated",
    "headquarters": "Location or null if not stated",
    "employeeCount": "Number or range like '50-100' or null if not stated"
  },
  "productsAndServices": [
    {
      "name": "Product/Service name",
      "description": "Brief description",
      "revenuePercentage": number or null
    }
  ],
  "marketPosition": {
    "industry": "Primary industry - ONLY from document, not inferred",
    "competitiveAdvantages": ["List of key advantages stated in document"],
    "marketSize": "Market size estimate or null if not stated"
  },
  "managementTeam": [
    {
      "name": "Executive name",
      "title": "Title",
      "tenure": "Years or null"
    }
  ],
  "customerInsights": {
    "topCustomerConcentration": "e.g., 'Top 10 = 45%' or null",
    "retentionRate": "Percentage or null",
    "geographicDistribution": "Geographic breakdown or null"
  },
  "growthDrivers": ["List of growth opportunities from document"],
  "keyRisks": ["List of identified risks from document"],
  "financialHighlights": {
    "revenueGrowth": "YoY growth rate or null",
    "ebitdaMargin": "EBITDA margin % or null",
    "notes": ["Key financial observations from document"]
  },
  "dealContext": {
    "reasonForSale": "Reason for sale or null",
    "timeline": "Expected timeline or null",
    "sellerExpectations": "Seller expectations or null"
  },
  "rawSummary": "A 3-5 sentence executive summary based ONLY on information in the document"
}

Return ONLY valid JSON, no markdown code blocks or additional text.`;

    console.log("Sending CIM to AI for vision-based extraction...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: extractionPrompt
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      await supabase
        .from("documents")
        .update({ processing_status: "failed" })
        .eq("id", documentId);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let insights: CIMInsights;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      insights = JSON.parse(cleanedContent);
      insights.extractedAt = new Date().toISOString();
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      
      // Create a minimal valid response
      insights = {
        businessOverview: {
          description: "Unable to parse CIM. Please upload a text-readable document.",
          foundedYear: null,
          headquarters: null,
          employeeCount: null,
        },
        productsAndServices: [],
        marketPosition: {
          industry: "Unknown",
          competitiveAdvantages: [],
          marketSize: null,
        },
        managementTeam: [],
        customerInsights: {
          topCustomerConcentration: null,
          retentionRate: null,
          geographicDistribution: null,
        },
        growthDrivers: [],
        keyRisks: [],
        financialHighlights: {
          revenueGrowth: null,
          ebitdaMargin: null,
          notes: [],
        },
        dealContext: {
          reasonForSale: null,
          timeline: null,
          sellerExpectations: null,
        },
        rawSummary: "CIM parsing encountered an issue. Please ensure the document is text-readable.",
        extractedAt: new Date().toISOString(),
      };
    }

    // Store in processed_data table
    const { error: insertError } = await supabase
      .from("processed_data")
      .insert({
        project_id: projectId,
        user_id: document.user_id,
        source_document_id: documentId,
        source_type: "ai_extraction",
        data_type: "cim_insights",
        data: insights,
        validation_status: "completed",
      });

    if (insertError) {
      console.error("Failed to store CIM insights:", insertError);
    }

    // Update document status
    await supabase
      .from("documents")
      .update({ 
        processing_status: "completed",
        parsed_summary: { type: "cim_insights", extractedAt: insights.extractedAt }
      })
      .eq("id", documentId);

    console.log("CIM parsing completed successfully");

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in parse-cim function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
