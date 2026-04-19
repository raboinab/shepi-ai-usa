import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate with API key (same pattern as db-proxy)
    const apiKey = req.headers.get("x-api-key");
    const validApiKeys = [
      Deno.env.get("QUICKBOOKS_API_KEY"),
      Deno.env.get("QB_AUTH_API_KEY"),
    ].filter(Boolean);

    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Missing project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch current token from company_info
    const { data: companyInfo, error } = await supabase
      .from("company_info")
      .select("bearer_token, refresh_token, token_expires_at, realm_id, company_name")
      .eq("project_id", project_id)
      .single();

    if (error || !companyInfo) {
      console.error(`Company info not found for project ${project_id}:`, error?.message);
      return new Response(
        JSON.stringify({ 
          error: "Not Found", 
          message: "Company info not found for project",
          details: error?.message 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we have tokens at all
    if (!companyInfo.bearer_token) {
      return new Response(
        JSON.stringify({ 
          error: "Not Found", 
          message: "No QuickBooks tokens found for project. User needs to connect QuickBooks first." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if token expires within 5 minutes
    const expiresAt = companyInfo.token_expires_at ? new Date(companyInfo.token_expires_at) : new Date(0);
    const threshold = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const now = new Date();

    console.log(`Token check for project ${project_id} (${companyInfo.company_name}): expires=${expiresAt.toISOString()}, threshold=${threshold.toISOString()}`);

    if (expiresAt < threshold) {
      // 3. Token expiring soon or already expired - call qbAuth to refresh
      console.log(`Token for project ${project_id} expires at ${expiresAt.toISOString()}, refreshing via qbAuth...`);
      
      // Hardcoded URL matching frontend QUICKBOOKS_CLOUD_RUN_URL
      const qbAuthUrl = "https://shepi-qbauth-1067170156712.us-central1.run.app";

      const refreshResponse = await fetch(
        `${qbAuthUrl}/get_credentials?project_id=${project_id}`,
        { 
          method: "GET", 
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error(`qbAuth refresh failed for project ${project_id}: ${refreshResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            error: "Token Refresh Failed", 
            message: "Failed to refresh QuickBooks token",
            details: errorText,
            status_code: refreshResponse.status 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const freshCredentials = await refreshResponse.json();
      console.log(`Token refreshed successfully for project ${project_id}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          access_token: freshCredentials.access_token,
          realm_id: companyInfo.realm_id,
          refreshed: true,
          expires_in_seconds: 3600 // QB tokens last 1 hour after refresh
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Token still valid - return current token
    const expiresInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    console.log(`Token valid for project ${project_id}, expires in ${expiresInSeconds}s`);
    
    return new Response(
      JSON.stringify({
        success: true,
        access_token: companyInfo.bearer_token,
        realm_id: companyInfo.realm_id,
        refreshed: false,
        expires_in_seconds: expiresInSeconds
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("get-qb-credentials error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
