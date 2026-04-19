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
    // Get the authorization header for JWT auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", code: "NO_AUTH" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", code: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing project_id", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to check project access and fetch company_info
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user has access to this project
    const { data: project, error: projectError } = await serviceClient
      .from("projects")
      .select("id, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ success: false, error: "Project not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user owns the project or has shared access
    const hasAccess = project.user_id === user.id;
    if (!hasAccess) {
      // Check project_shares
      const { data: share } = await serviceClient
        .from("project_shares")
        .select("id")
        .eq("project_id", project_id)
        .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`)
        .limit(1)
        .single();
      
      if (!share) {
        return new Response(
          JSON.stringify({ success: false, error: "Access denied", code: "FORBIDDEN" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch current company_info to verify we have a refresh token
    const { data: companyInfo, error: companyError } = await serviceClient
      .from("company_info")
      .select("refresh_token, realm_id, company_name")
      .eq("project_id", project_id)
      .single();

    if (companyError || !companyInfo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "QuickBooks not connected", 
          code: "NOT_CONNECTED" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!companyInfo.refresh_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No refresh token available. Please reconnect QuickBooks.", 
          code: "NO_REFRESH_TOKEN" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call qbAuth service to refresh the token (hardcoded URL matching frontend)
    const qbAuthUrl = "https://shepi-qbauth-1067170156712.us-central1.run.app";

    console.log(`Refreshing token for project ${project_id} (${companyInfo.company_name})`);

    const refreshResponse = await fetch(
      `${qbAuthUrl}/get_credentials?project_id=${project_id}`,
      { 
        method: "GET", 
        headers: { "Content-Type": "application/json" }
      }
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error(`qbAuth refresh failed: ${refreshResponse.status} - ${errorText}`);
      
      // Check for specific error conditions
      if (refreshResponse.status === 401 || errorText.includes("refresh_token") || errorText.includes("expired")) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "QuickBooks authorization has fully expired. Please reconnect QuickBooks.", 
            code: "REFRESH_TOKEN_EXPIRED" 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to refresh token", 
          code: "REFRESH_FAILED",
          details: errorText 
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const freshCredentials = await refreshResponse.json();
    console.log(`Token refreshed successfully for project ${project_id}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Token refreshed successfully",
        company_name: companyInfo.company_name,
        refreshed: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("refresh-qb-token error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
