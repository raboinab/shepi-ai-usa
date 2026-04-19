import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface FixedAsset {
  id: string;
  description: string;
  category: string;
  dateAcquired: string | null;
  cost: number;
  accumDepreciation: number;
  usefulLife: string | null;
  method: string | null;
}

interface FixedAssetsExtractionResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  extractedData: {
    assets: FixedAsset[];
    asOfDate: string | null;
    totalCost: number;
    totalAccumDepreciation: number;
    totalNBV: number;
  };
  warnings: string[];
  rawFindings: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId } = await req.json() as {
      documentId: string;
      projectId: string;
    };

    if (!documentId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'documentId and projectId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing fixed assets document: ${documentId} for project: ${projectId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found document: ${document.name}, file_path: ${document.file_path}`);

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Downloaded file, size: ${fileData.size} bytes`);

    // Convert file to base64 for PDFs/images or text for CSV/Excel
    const arrayBuffer = await fileData.arrayBuffer();
    const fileType = document.file_type?.toLowerCase() || '';
    
    let fileContent: string;
    let contentType: 'image' | 'text' = 'text';
    
    if (['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      let mimeType = 'application/pdf';
      if (['jpg', 'jpeg'].includes(fileType)) mimeType = 'image/jpeg';
      else if (fileType === 'png') mimeType = 'image/png';
      else if (fileType === 'webp') mimeType = 'image/webp';
      
      fileContent = `data:${mimeType};base64,${base64Data}`;
      contentType = 'image';
    } else {
      // For CSV/Excel, decode as text
      try {
        fileContent = new TextDecoder().decode(new Uint8Array(arrayBuffer));
      } catch {
        fileContent = 'Unable to decode file as text';
      }
    }

    // Build the AI prompt for fixed assets extraction
    const systemPrompt = `You are a fixed assets / depreciation schedule extraction specialist for Quality of Earnings (QoE) analysis in M&A due diligence.

Your task is to extract fixed asset data from the uploaded document (depreciation schedule, fixed asset register, or similar).

**ASSET CATEGORIES TO USE:**
- Land (not depreciated)
- Buildings & Improvements
- Machinery & Equipment
- Furniture & Fixtures
- Vehicles
- Computer Equipment
- Leasehold Improvements
- Other Fixed Assets

**EXTRACTION GOALS:**
1. Extract each individual asset line or asset class summary
2. Capture: Description, Category, Date Acquired, Cost/Basis, Accumulated Depreciation
3. If useful life or depreciation method is shown, include it
4. Calculate Net Book Value = Cost - Accumulated Depreciation
5. Determine the "as of date" for the schedule (often in the header or title)

**IMPORTANT:**
- Group similar small items if they appear grouped in the source
- If the document shows multiple locations or departments, still extract all assets
- Watch for negative values which may indicate disposals or adjustments
- If land is included, note it should have $0 accumulated depreciation
- Flag any unusual items (negative NBV, future acquisition dates, etc.)

Return your response as a valid JSON object with this exact structure:
{
  "success": true,
  "confidence": "high" | "medium" | "low",
  "extractedData": {
    "assets": [
      {
        "id": "uuid",
        "description": "Asset description",
        "category": "Category from list above",
        "dateAcquired": "YYYY-MM-DD or null",
        "cost": 50000,
        "accumDepreciation": 25000,
        "usefulLife": "5 years" or null,
        "method": "Straight-line" or "MACRS" or null
      }
    ],
    "asOfDate": "YYYY-MM-DD or null",
    "totalCost": 0,
    "totalAccumDepreciation": 0,
    "totalNBV": 0
  },
  "warnings": ["Any issues or uncertainties"],
  "rawFindings": "Brief summary of what was found in the document"
}

- Use unique UUIDs for each asset id (generate random ones)
- All monetary values should be numbers (not strings)
- Include totals calculated from the extracted assets`;

    // Build user content based on file type
    const userContent: unknown[] = [];
    
    if (contentType === 'image') {
      userContent.push({
        type: 'image_url',
        image_url: { url: fileContent }
      });
      userContent.push({
        type: 'text',
        text: `Extract all fixed asset data from this ${fileType.toUpperCase()} depreciation schedule named "${document.name}".`
      });
    } else {
      // Truncate very long text files
      const truncatedContent = fileContent.length > 100000 
        ? fileContent.substring(0, 100000) + '\n\n[TRUNCATED - Document exceeds 100KB]'
        : fileContent;
      
      userContent.push({
        type: 'text',
        text: `Extract all fixed asset data from this depreciation schedule/fixed asset register named "${document.name}":\n\n${truncatedContent}`
      });
    }

    console.log('Calling OpenAI for fixed assets extraction...');

    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Handle rate limiting
      if (aiResponse.status === 429) {
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId);
        
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId);
        
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ error: 'AI extraction failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    // Parse the AI response
    let extractionResult: FixedAssetsExtractionResult = {
      success: false,
      confidence: 'low',
      extractedData: {
        assets: [],
        asOfDate: null,
        totalCost: 0,
        totalAccumDepreciation: 0,
        totalNBV: 0,
      },
      warnings: ['Failed to parse AI response'],
      rawFindings: '',
    };

    try {
      // Find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and clean assets
        const assets: FixedAsset[] = (parsed.extractedData?.assets || []).map((a: any) => ({
          id: a.id || crypto.randomUUID(),
          description: a.description || 'Unknown Asset',
          category: a.category || 'Other Fixed Assets',
          dateAcquired: a.dateAcquired || null,
          cost: typeof a.cost === 'number' ? a.cost : parseFloat(a.cost) || 0,
          accumDepreciation: typeof a.accumDepreciation === 'number' ? a.accumDepreciation : parseFloat(a.accumDepreciation) || 0,
          usefulLife: a.usefulLife || null,
          method: a.method || null,
        }));

        // Calculate totals
        const totalCost = assets.reduce((sum, a) => sum + a.cost, 0);
        const totalAccumDepreciation = assets.reduce((sum, a) => sum + a.accumDepreciation, 0);
        const totalNBV = totalCost - totalAccumDepreciation;

        extractionResult = {
          success: parsed.success ?? true,
          confidence: parsed.confidence || 'medium',
          extractedData: {
            assets,
            asOfDate: parsed.extractedData?.asOfDate || null,
            totalCost,
            totalAccumDepreciation,
            totalNBV,
          },
          warnings: parsed.warnings || [],
          rawFindings: parsed.rawFindings || '',
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      extractionResult.warnings = [`JSON parse error: ${parseError}`];
      extractionResult.rawFindings = aiContent.substring(0, 500);
    }

    const assetCount = extractionResult.extractedData.assets.length;
    console.log(`Extracted ${assetCount} fixed assets with ${extractionResult.confidence} confidence`);

    // Store in processed_data
    const { error: insertError } = await supabase
      .from('processed_data')
      .insert({
        project_id: projectId,
        user_id: document.user_id,
        source_type: 'ai_fixed_assets_extraction',
        data_type: 'fixed_assets',
        source_document_id: documentId,
        data: {
          ...extractionResult,
          documentName: document.name,
          extractedAt: new Date().toISOString(),
        },
        record_count: assetCount,
        validation_status: extractionResult.confidence === 'high' ? 'validated' : 'pending',
      });

    if (insertError) {
      console.error('Failed to insert processed_data:', insertError);
    } else {
      console.log('Successfully stored fixed assets extraction in processed_data');
    }

    // Update document status
    await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        parsed_summary: {
          type: 'fixed_assets_extraction',
          confidence: extractionResult.confidence,
          assetCount,
          totalCost: extractionResult.extractedData.totalCost,
          totalNBV: extractionResult.extractedData.totalNBV,
          warnings: extractionResult.warnings,
          extractedAt: new Date().toISOString(),
        },
      })
      .eq('id', documentId);

    // Fire-and-forget: embed project data for RAG
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ project_id: projectId, data_types: ["fixed_assets"], source: "upload" }),
      }).catch((e) => console.error("[process-fixed-assets] embed error:", e));
    } catch (e) { console.error("[process-fixed-assets] embed trigger error:", e); }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        confidence: extractionResult.confidence,
        extractedData: extractionResult.extractedData,
        warnings: extractionResult.warnings,
        assetCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fixed assets extraction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
