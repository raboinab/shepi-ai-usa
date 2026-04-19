import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  console.log('[PROCESSED-DATA-LIST] Request received');

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
      console.error('[PROCESSED-DATA-LIST] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters from URL or body
    const url = new URL(req.url);
    let projectId = url.searchParams.get('project_id');
    let dataType = url.searchParams.get('data_type');
    let sourceType = url.searchParams.get('source_type');
    let periodStart = url.searchParams.get('period_start');
    let periodEnd = url.searchParams.get('period_end');
    let limit = url.searchParams.get('limit');

    // Also accept POST body for filters
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        projectId = body.project_id || projectId;
        dataType = body.data_type || dataType;
        sourceType = body.source_type || sourceType;
        periodStart = body.period_start || periodStart;
        periodEnd = body.period_end || periodEnd;
        limit = body.limit || limit;
      } catch {
        // Ignore JSON parse errors for GET requests
      }
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (projectError || !project) {
      console.error('[PROCESSED-DATA-LIST] Project access denied:', projectError);
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-LIST] Querying for project: ${projectId}`);

    // Build the query
    let query = supabase
      .from('processed_data')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Apply optional filters
    if (dataType) {
      query = query.eq('data_type', dataType);
    }
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    if (periodStart) {
      query = query.gte('period_start', periodStart);
    }
    if (periodEnd) {
      query = query.lte('period_end', periodEnd);
    }
    query = query.limit(limit ? parseInt(limit, 10) : 1000000);

    const { data: processedData, error: queryError } = await query;

    if (queryError) {
      console.error('[PROCESSED-DATA-LIST] Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch processed data', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESSED-DATA-LIST] Found ${processedData?.length || 0} records`);

    return new Response(
      JSON.stringify({ success: true, data: processedData || [], count: processedData?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESSED-DATA-LIST] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
