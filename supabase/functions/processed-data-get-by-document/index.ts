import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  console.log('[PROCESSED-DATA-GET-BY-DOCUMENT] Request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[PROCESSED-DATA-GET-BY-DOCUMENT] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse document_id from URL or body
    const url = new URL(req.url);
    let documentId = url.searchParams.get('document_id');

    // Also accept POST body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        documentId = body.document_id || documentId;
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First verify the document belongs to the user
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id, project_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (docError || !document) {
      console.error('[PROCESSED-DATA-GET-BY-DOCUMENT] Document access denied:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-GET-BY-DOCUMENT] Querying for document: ${documentId}`);

    // Query processed_data for this document
    const { data: processedData, error: queryError } = await supabase
      .from('processed_data')
      .select('*')
      .eq('source_document_id', documentId)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[PROCESSED-DATA-GET-BY-DOCUMENT] Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch processed data', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-GET-BY-DOCUMENT] Found ${processedData?.length || 0} records for document`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        document_id: documentId,
        data: processedData || [], 
        count: processedData?.length || 0 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESSED-DATA-GET-BY-DOCUMENT] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
