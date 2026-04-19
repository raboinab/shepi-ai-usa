import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Trigger QuickBooks Sync Workflow
 * 
 * This lightweight edge function:
 * 1. Validates the request
 * 2. Creates a workflow record in the workflows table
 * 3. Triggers QuickBooks Java service asynchronously (fire-and-forget)
 * 4. Returns immediately with the workflow_id
 * 
 * This ensures the sync continues even if the user navigates away.
 */
Deno.serve(async (req) => {
  console.log("=== TRIGGER-QB-SYNC CALLED ===", {
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userAuthClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userAuthClient.auth.getUser();
    if (userError || !user) {
      console.error("[trigger-qb-sync] Auth failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[trigger-qb-sync] Auth successful - user:", user.id);

    // Parse request body
    const { project_id, realm_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify project access and get periods
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("id, user_id, periods")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (project.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date range from project periods
    interface Period {
      year: number;
      month: number;
      isStub?: boolean;
      startDate?: string;
      endDate?: string;
    }

    const projectPeriods = (project.periods || []) as Period[];
    const regularPeriods = projectPeriods.filter(p => !p.isStub);
    const stubPeriods = projectPeriods.filter(p => p.isStub);

    if (regularPeriods.length === 0) {
      console.error("[trigger-qb-sync] No financial periods configured");
      return new Response(
        JSON.stringify({ 
          error: "Financial periods not configured", 
          code: "NO_PERIODS",
          message: "Please configure your analysis periods in Project Setup before syncing."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort periods by year and month to find date range
    const sorted = [...regularPeriods].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Start of first period (first day of the month)
    const startDate = `${sorted[0].year}-${String(sorted[0].month).padStart(2, '0')}-01`;

    // End of last period (last day of the month)
    const lastPeriod = sorted[sorted.length - 1];
    const lastDay = new Date(lastPeriod.year, lastPeriod.month, 0).getDate();
    let endDate = `${lastPeriod.year}-${String(lastPeriod.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Extend end date if stub period has a specific end date
    if (stubPeriods.length > 0 && stubPeriods[0].endDate) {
      endDate = stubPeriods[0].endDate;
    }

    console.log("[trigger-qb-sync] Date range calculated:", { 
      startDate, 
      endDate, 
      periodsCount: regularPeriods.length,
      hasStub: stubPeriods.length > 0 
    });

    // Create workflow record
    const workflowId = crypto.randomUUID();
    const steps = [
      { id: "validate", name: "Validating connection", status: "pending" },
      { id: "fetch_qb", name: "Fetching QuickBooks data", status: "pending" },
      { id: "transform", name: "Transforming data", status: "pending" },
      { id: "save_data", name: "Saving data", status: "pending" },
      { id: "update_wizard", name: "Updating wizard data", status: "pending" },
    ];

    const { error: insertError } = await supabaseClient
      .from("workflows")
      .insert({
        id: workflowId,
        project_id,
        user_id: user.id,
        workflow_type: "SYNC_TO_SHEET",
        status: "pending",
        progress_percent: 0,
        current_step: "validate",
        steps,
        input_payload: {
          direction: "qb-push",
          realm_id: realm_id || null,
          start_date: startDate,
          end_date: endDate,
          triggered_at: new Date().toISOString(),
        },
      });

    if (insertError) {
      console.error("[trigger-qb-sync] Failed to create workflow:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create workflow", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[trigger-qb-sync] Workflow created:", workflowId);

    // Get QuickBooks API configuration
    const quickbooksApiUrl = Deno.env.get("QUICKBOOKS_API_URL");
    const quickbooksApiKey = Deno.env.get("QUICKBOOKS_API_KEY");
    
    if (!quickbooksApiUrl || !quickbooksApiKey) {
      console.error("[trigger-qb-sync] QUICKBOOKS_API_URL or QUICKBOOKS_API_KEY not configured");
      // Update workflow to failed state
      await supabaseClient
        .from("workflows")
        .update({
          status: "failed",
          error_message: "QuickBooks API not configured",
          error_details: { code: "QB_NOT_CONFIGURED" },
          completed_at: new Date().toISOString(),
        })
        .eq("id", workflowId);
      
      return new Response(
        JSON.stringify({ error: "QuickBooks API not configured", code: "QB_NOT_CONFIGURED" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fire-and-forget: Call QuickBooks Java service with callback headers
    // Java service will call back to qb-sync-complete when done
    const qbSyncUrl = `${quickbooksApiUrl}/api/sync/${project_id}?startDate=${startDate}&endDate=${endDate}`;
    console.log("[trigger-qb-sync] Calling QB API:", qbSyncUrl);
    
    fetch(qbSyncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": quickbooksApiKey,
        // Callback headers for async execution
        "X-Callback-Url": `${supabaseUrl}/functions/v1/qb-sync-complete`,
        "X-Workflow-Id": workflowId,
        "X-Project-Id": project_id,
      },
      body: JSON.stringify({
        realm_id: realm_id || null,
      }),
    }).then(async (response) => {
      // With async execution, we expect 202 Accepted
      if (response.status === 202) {
        console.log("[trigger-qb-sync] QB API accepted request (202 Accepted)");
        
        // Update workflow to running status immediately
        const now = new Date().toISOString();
        const updatedSteps = steps.map(s => {
          if (s.id === "validate") {
            return { ...s, status: "completed", started_at: now, completed_at: now };
          }
          if (s.id === "fetch_qb") {
            return { ...s, status: "running", started_at: now };
          }
          return s;
        });
        
        await supabaseClient
          .from("workflows")
          .update({
            status: "running",
            started_at: now,
            progress_percent: 15,
            current_step: "fetch_qb",
            steps: updatedSteps,
          })
          .eq("id", workflowId);
          
        console.log("[trigger-qb-sync] Workflow updated to running status");
      } else if (!response.ok) {
        const errorText = await response.text();
        console.error("[trigger-qb-sync] QB API returned error:", response.status, errorText);
        
        // Mark workflow as failed
        await supabaseClient
          .from("workflows")
          .update({
            status: "failed",
            error_message: `QB API error: ${response.status}`,
            error_details: { code: "QB_API_ERROR", status: response.status, body: errorText },
            completed_at: new Date().toISOString(),
            current_step: "fetch_qb",
            steps: steps.map(s => {
              if (s.id === "validate") return { ...s, status: "completed" };
              if (s.id === "fetch_qb") return { ...s, status: "failed", error_message: `QB API error: ${response.status}` };
              return s;
            }),
          })
          .eq("id", workflowId);
      } else {
        // 200 response means sync completed synchronously (fallback mode)
        // The callback will still be sent by Java service, so just log it
        console.log("[trigger-qb-sync] QB API returned 200 (synchronous fallback mode)");
        
        // Update workflow to running - callback will complete it
        const now = new Date().toISOString();
        const updatedSteps = steps.map(s => {
          if (s.id === "validate") {
            return { ...s, status: "completed", started_at: now, completed_at: now };
          }
          if (s.id === "fetch_qb") {
            return { ...s, status: "running", started_at: now };
          }
          return s;
        });
        
        await supabaseClient
          .from("workflows")
          .update({
            status: "running",
            started_at: now,
            progress_percent: 15,
            current_step: "fetch_qb",
            steps: updatedSteps,
          })
          .eq("id", workflowId);
      }
    }).catch(async (err) => {
      console.error("[trigger-qb-sync] Failed to call QB API:", err);
      
      // Mark workflow as failed
      await supabaseClient
        .from("workflows")
        .update({
          status: "failed",
          error_message: `Failed to call QB API: ${err.message || String(err)}`,
          error_details: { code: "QB_API_UNREACHABLE", error: String(err) },
          completed_at: new Date().toISOString(),
        })
        .eq("id", workflowId);
    });

    console.log("[trigger-qb-sync] QB sync triggered with callback headers");

    // Return immediately with workflow ID
    return new Response(
      JSON.stringify({
        workflow_id: workflowId,
        status: "pending",
        message: "QuickBooks sync started. Progress will be tracked in real-time.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[trigger-qb-sync] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
