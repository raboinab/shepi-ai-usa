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

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "healthy", service: "proactive-qb-refresh" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Authenticate with API key (for cron) or service role or anon key (for pg_cron)
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("authorization");
    
    const validApiKeys = [
      Deno.env.get("QUICKBOOKS_API_KEY"),
      Deno.env.get("QB_AUTH_API_KEY"),
    ].filter(Boolean);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const isValidApiKey = apiKey && validApiKeys.includes(apiKey);
    const isServiceRole = authHeader && serviceRoleKey && authHeader.includes(serviceRoleKey);
    const isAnonKey = authHeader && anonKey && authHeader.includes(anonKey);

    if (!isValidApiKey && !isServiceRole && !isAnonKey) {
      console.log("Unauthorized request to proactive-qb-refresh");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find ALL projects with active QuickBooks connections
    // Refresh every 10 minutes to ensure tokens never expire
    console.log("Proactive refresh: checking ALL active QuickBooks connections");

    const { data: activeConnections, error: queryError } = await supabase
      .from("company_info")
      .select("project_id, company_name, token_expires_at, refresh_token")
      .not("refresh_token", "is", null)
      .not("bearer_token", "is", null);

    if (queryError) {
      console.error("Failed to query expiring connections:", queryError);
      return new Response(
        JSON.stringify({ error: "Query failed", details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      checked: activeConnections?.length || 0,
      refreshed: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log(`Proactive refresh: found ${results.checked} connections expiring soon`);

    if (results.checked === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No tokens expiring soon", ...results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // qbAuth service URL (no API key needed per qb-auth-service-security-pattern)
    const qbAuthUrl = "https://shepi-qbauth-1067170156712.us-central1.run.app";

    // Refresh each expiring token
    for (const conn of activeConnections || []) {
      try {
        console.log(`Proactive refresh for project ${conn.project_id} (${conn.company_name})`);
        
        const response = await fetch(
          `${qbAuthUrl}/get_credentials?project_id=${conn.project_id}`,
          { 
            method: "GET", 
            headers: { "Content-Type": "application/json" }
          }
        );

        if (response.ok) {
          results.refreshed++;
          console.log(`Refreshed token for ${conn.company_name}`);
        } else {
          results.failed++;
          const errorText = await response.text();
          results.errors.push(`${conn.company_name}: ${response.status}`);
          console.error(`Failed to refresh ${conn.company_name}: ${errorText}`);
        }
      } catch (err) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`${conn.company_name}: ${errorMessage}`);
        console.error(`Error refreshing ${conn.company_name}:`, err);
      }
    }

    console.log(`Proactive refresh complete: ${results.refreshed}/${results.checked} refreshed`);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("proactive-qb-refresh error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
