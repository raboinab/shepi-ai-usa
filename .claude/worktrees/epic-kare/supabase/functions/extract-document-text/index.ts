import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing document: ${documentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document record from Supabase
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

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine MIME type
    const fileType = document.file_type?.toLowerCase() || '';
    let mimeType = 'application/octet-stream';
    if (fileType === 'pdf') mimeType = 'application/pdf';
    else if (['jpg', 'jpeg'].includes(fileType)) mimeType = 'image/jpeg';
    else if (fileType === 'png') mimeType = 'image/png';
    else if (fileType === 'webp') mimeType = 'image/webp';

    console.log(`File type: ${fileType}, MIME: ${mimeType}`);

    // Build the AI request with vision capabilities
    const systemPrompt = `You are a document text extraction specialist. Your task is to extract ALL text content from the provided document/image.

For financial documents, pay special attention to:
- Dollar amounts and currency values
- Dates and time periods
- Company/vendor names
- Invoice/reference numbers
- Account numbers (partial)
- Transaction descriptions
- Totals and subtotals

Return your response as a JSON object with this structure:
{
  "extractedText": "Full text content from the document",
  "keyInfo": {
    "amounts": ["$100.00", "$250.50"],
    "dates": ["2024-01-15", "Jan 15, 2024"],
    "parties": ["ABC Company", "John Smith"],
    "referenceNumbers": ["INV-12345", "PO-67890"],
    "documentType": "invoice" | "receipt" | "contract" | "bank_statement" | "letter" | "other"
  },
  "summary": "A brief 1-2 sentence summary of what this document is about"
}

Extract everything you can see. If the document is unclear or has limited content, extract what's available and note any limitations in the summary.`;

    const userContent: unknown[] = [];
    
    // Add the document as an image/file for vision processing
    if (['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`
        }
      });
      userContent.push({
        type: 'text',
        text: `Please extract all text and key information from this ${fileType.toUpperCase()} document named "${document.name}".`
      });
    } else {
      // For non-image files, try to decode as text
      try {
        const textContent = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        userContent.push({
          type: 'text',
          text: `Please extract and structure the key information from this document named "${document.name}":\n\n${textContent.substring(0, 50000)}`
        });
      } catch {
        userContent.push({
          type: 'text',
          text: `Unable to read document "${document.name}" as text. File type: ${fileType}`
        });
      }
    }

    console.log('Calling Lovable AI for text extraction...');

    // Call Lovable AI with Gemini (vision-capable)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
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
    let extractedData = {
      extractedText: '',
      keyInfo: {} as Record<string, unknown>,
      summary: ''
    };

    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData.extractedText = aiContent;
        extractedData.summary = aiContent.substring(0, 200);
      }
    } catch (parseError) {
      console.log('Could not parse as JSON, using raw content');
      extractedData.extractedText = aiContent;
      extractedData.summary = aiContent.substring(0, 200);
    }

    // Determine data_type from extracted keyInfo
    const detectedType = (extractedData.keyInfo as { documentType?: string })?.documentType || 'document_text';

    // Insert into processed_data table
    const { error: processedDataError } = await supabase
      .from('processed_data')
      .insert({
        project_id: document.project_id,
        user_id: document.user_id,
        source_type: 'ai_extraction',
        data_type: detectedType,
        source_document_id: documentId,
        data: {
          extractedText: extractedData.extractedText,
          keyInfo: extractedData.keyInfo,
          summary: extractedData.summary,
          extractedAt: new Date().toISOString(),
        },
        record_count: 1,
        validation_status: 'pending',
      });

    if (processedDataError) {
      console.error('Failed to insert processed_data:', processedDataError);
      // Don't throw - we still want to update the document
    } else {
      console.log('Successfully inserted processed_data record');
    }

    // Build the parsed_summary to store (for backward compatibility)
    const parsedSummary = {
      ...extractedData,
      extractedAt: new Date().toISOString()
    };

    console.log(`Extraction complete. Summary length: ${JSON.stringify(parsedSummary).length}`);

    // Update document with extracted text
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        parsed_summary: parsedSummary,
        processing_status: 'completed'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save extracted text' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Document updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        extractedText: extractedData.extractedText?.substring(0, 500) + '...',
        summary: extractedData.summary,
        keyInfo: extractedData.keyInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Extraction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
