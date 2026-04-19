import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CreateProcessedDataRequest {
  project_id: string;
  source_type: string; // 'docuclipper' | 'qbtojson' | 'quickbooks_api' | 'ai_extraction'
  data_type: string; // 'bank_transactions' | 'trial_balance' | 'chart_of_accounts' | etc.
  data: Record<string, unknown>;
  source_document_id?: string;
  qb_realm_id?: string;
  period_start?: string;
  period_end?: string;
  record_count?: number;
  validation_status?: string;
}

serve(async (req) => {
  console.log('[PROCESSED-DATA-CREATE] Request received');

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
      console.error('[PROCESSED-DATA-CREATE] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateProcessedDataRequest = await req.json();

    // Validate required fields
    if (!body.project_id || !body.source_type || !body.data_type || !body.data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id, source_type, data_type, data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (projectError || !project) {
      console.error('[PROCESSED-DATA-CREATE] Project access denied:', projectError);
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-CREATE] Creating record for project: ${body.project_id}, type: ${body.data_type}`);

    // Insert the processed data record
    const { data: processedData, error: insertError } = await supabase
      .from('processed_data')
      .insert({
        project_id: body.project_id,
        user_id: user.id,
        source_type: body.source_type,
        data_type: body.data_type,
        source_document_id: body.source_document_id || null,
        qb_realm_id: body.qb_realm_id || null,
        period_start: body.period_start || null,
        period_end: body.period_end || null,
        data: body.data,
        record_count: body.record_count || null,
        validation_status: body.validation_status || 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PROCESSED-DATA-CREATE] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create processed data record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-CREATE] Successfully created record: ${processedData.id}`);

    return new Response(
      JSON.stringify({ success: true, data: processedData }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESSED-DATA-CREATE] Unexpected error:', error);
    console.error('[PROCESSED-DATA-CREATE] Full error:', error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
