import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface AdjustmentDetails {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  notes: string;
}

interface ValidationResult {
  score: number;
  status: 'validated' | 'supported' | 'partial' | 'insufficient' | 'contradictory';
  keyFindings: string[];
  redFlags: string[];
  analysis: {
    amountMatch: { score: number; explanation: string };
    timingValidation: { score: number; explanation: string };
    categoryMatch: { score: number; explanation: string };
    documentQuality: { score: number; explanation: string };
  };
  recommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adjustmentId, adjustment, documentIds, projectId } = await req.json();
    
    console.log('Validating adjustment:', adjustmentId, 'with documents:', documentIds);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch documents from Supabase
    console.log('Fetching documents:', documentIds);
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No documents found",
          score: 0,
          status: 'insufficient',
          keyFindings: [],
          redFlags: ['No supporting documents provided']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build document context for AI analysis
    const documentContext = documents.map(doc => {
      let content = `Document: ${doc.name} (${doc.file_type || 'unknown type'})`;
      if (doc.category) content += ` | Category: ${doc.category}`;
      if (doc.parsed_summary) {
        content += `\nParsed Content: ${JSON.stringify(doc.parsed_summary).slice(0, 2000)}`;
      }
      return content;
    }).join('\n\n---\n\n');

    const adjustmentContext = `
ADJUSTMENT DETAILS:
- Description: ${adjustment.description}
- Category: ${adjustment.category}
- Amount: $${adjustment.amount?.toLocaleString() || 0}
- Current Status: ${adjustment.status}
- Notes: ${adjustment.notes || 'None'}
`;

    const systemPrompt = `You are a senior Quality of Earnings (QoE) analyst validating due diligence adjustments. 
Your task is to evaluate whether the provided supporting documents adequately substantiate the claimed adjustment.

EVALUATION CRITERIA:
1. Amount Match (0-25 points): Does the documentation support the exact dollar amount claimed?
2. Timing Validation (0-25 points): Does the evidence show this is truly one-time/non-recurring?
3. Category Appropriateness (0-25 points): Does the adjustment properly fit the claimed category?
4. Document Quality (0-25 points): Are the documents credible, complete, and relevant?

SCORING GUIDE:
- 90-100: Validated - Strong documentation fully supports the adjustment
- 70-89: Supported - Good documentation with minor gaps
- 50-69: Partial - Some support but significant gaps exist
- 0-49: Insufficient - Documentation does not adequately support the claim
- Contradictory: Documentation contradicts the claimed adjustment

Respond with ONLY valid JSON matching this structure:
{
  "score": <number 0-100>,
  "status": "<validated|supported|partial|insufficient|contradictory>",
  "keyFindings": ["<finding1>", "<finding2>", ...],
  "redFlags": ["<flag1>", "<flag2>", ...],
  "analysis": {
    "amountMatch": { "score": <0-25>, "explanation": "<text>" },
    "timingValidation": { "score": <0-25>, "explanation": "<text>" },
    "categoryMatch": { "score": <0-25>, "explanation": "<text>" },
    "documentQuality": { "score": <0-25>, "explanation": "<text>" }
  },
  "recommendation": "<brief professional recommendation>"
}`;

    const userPrompt = `${adjustmentContext}

SUPPORTING DOCUMENTS:
${documentContext}

Analyze the above adjustment and supporting documentation. Provide your validation assessment as JSON.`;

    console.log('Sending to AI for validation...');
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received:', content.slice(0, 200));

    // Parse the JSON response
    let validationResult: ValidationResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      validationResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      validationResult = {
        score: 50,
        status: 'partial',
        keyFindings: ['AI analysis completed but response format was unexpected'],
        redFlags: ['Manual review recommended'],
        analysis: {
          amountMatch: { score: 12, explanation: 'Unable to parse detailed analysis' },
          timingValidation: { score: 12, explanation: 'Unable to parse detailed analysis' },
          categoryMatch: { score: 13, explanation: 'Unable to parse detailed analysis' },
          documentQuality: { score: 13, explanation: 'Unable to parse detailed analysis' },
        },
        recommendation: 'Manual review recommended due to parsing issues'
      };
    }

    // Check if a proof record exists for this adjustment
    const { data: existingProofs } = await supabase
      .from('adjustment_proofs')
      .select('*')
      .eq('adjustment_id', adjustmentId)
      .eq('project_id', projectId);

    const proofData = {
      project_id: projectId,
      user_id: userId,
      adjustment_id: adjustmentId,
      document_id: documentIds[0],
      validation_score: validationResult.score,
      validation_status: validationResult.status,
      ai_analysis: validationResult.analysis,
      key_findings: validationResult.keyFindings,
      red_flags: validationResult.redFlags,
      validated_at: new Date().toISOString(),
    };

    const existingProof = existingProofs?.[0];
    
    if (existingProof) {
      await supabase
        .from('adjustment_proofs')
        .update(proofData)
        .eq('id', existingProof.id);
    } else {
      await supabase
        .from('adjustment_proofs')
        .insert(proofData);
    }

    console.log('Validation complete, score:', validationResult.score);

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in validate-adjustment-proof:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
