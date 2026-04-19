import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface HealthCheckResponse {
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'stuck' | 'timeout';
  actual_progress: number;
  reported_progress: number;
  records_synced: number;
  expected_records: number;
  last_activity_minutes_ago: number;
  is_stuck: boolean;
  recommended_action: 'wait' | 'retry' | 'cancel';
  current_step: string | null;
  error_message: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workflow_id, project_id, auto_fail_after_minutes } = await req.json();

    if (!workflow_id && !project_id) {
      return new Response(
        JSON.stringify({ error: "workflow_id or project_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch workflow - by ID or latest for project
    let query = supabase.from("workflows").select("*");
    
    if (workflow_id) {
      query = query.eq("id", workflow_id);
    } else {
      query = query
        .eq("project_id", project_id)
        .eq("workflow_type", "SYNC_TO_SHEET")
        .order("created_at", { ascending: false })
        .limit(1);
    }

    const { data: workflows, error: workflowError } = await query;

    if (workflowError || !workflows || workflows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Workflow not found", details: workflowError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const workflow = workflows[0];
    const now = new Date();
    const updatedAt = new Date(workflow.updated_at);
    const startedAt = workflow.started_at ? new Date(workflow.started_at) : null;
    const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

    // Count actual processed_data records for this workflow
    let recordsQuery = supabase
      .from("processed_data")
      .select("id", { count: "exact" })
      .eq("project_id", workflow.project_id)
      .eq("source_type", "quickbooks_api")
      .eq("data_type", "trial_balance");

    if (startedAt) {
      recordsQuery = recordsQuery.gte("created_at", startedAt.toISOString());
    }

    const { count: recordCount } = await recordsQuery;
    const recordsSynced = recordCount || 0;

    // Calculate expected records from input payload date range
    let expectedRecords = 36; // Default 3 years
    const inputPayload = workflow.input_payload as Record<string, unknown>;
    if (inputPayload?.start_date && inputPayload?.end_date) {
      try {
        const startDate = new Date(inputPayload.start_date as string);
        const endDate = new Date(inputPayload.end_date as string);
        const diffMonths = 
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth()) + 1;
        expectedRecords = Math.max(1, diffMonths);
      } catch {
        // Keep default
      }
    }

    // Calculate actual progress based on records
    const actualProgress = Math.min(80, 15 + Math.round((recordsSynced / expectedRecords) * 65));
    
    // Determine if workflow is stuck
    // Stuck = running for >15 min with no updates, or >45 min total
    const isRunning = workflow.status === "running";
    const totalMinutes = startedAt ? (now.getTime() - startedAt.getTime()) / (1000 * 60) : 0;
    
    const isStuck = isRunning && (
      (minutesSinceUpdate > 15 && recordsSynced < expectedRecords) ||
      totalMinutes > 60
    );

    // Determine recommended action
    let recommendedAction: 'wait' | 'retry' | 'cancel' = 'wait';
    if (isStuck) {
      recommendedAction = totalMinutes > 45 ? 'retry' : 'wait';
    } else if (workflow.status === 'failed') {
      recommendedAction = 'retry';
    }

    // Auto-fail if requested and conditions met
    const autoFailThreshold = auto_fail_after_minutes || 60;
    if (isRunning && totalMinutes > autoFailThreshold) {
      await supabase
        .from("workflows")
        .update({
          status: "failed",
          error_message: `Sync timed out after ${Math.round(totalMinutes)} minutes of inactivity`,
          error_details: {
            code: "SYNC_TIMEOUT",
            step: workflow.current_step,
            recoverable: true,
            suggested_action: "Retry the sync or check QuickBooks connection",
            records_synced: recordsSynced,
            expected_records: expectedRecords
          },
          completed_at: now.toISOString()
        })
        .eq("id", workflow.id);

      const response: HealthCheckResponse = {
        workflow_id: workflow.id,
        status: "timeout",
        actual_progress: actualProgress,
        reported_progress: workflow.progress_percent,
        records_synced: recordsSynced,
        expected_records: expectedRecords,
        last_activity_minutes_ago: Math.round(minutesSinceUpdate),
        is_stuck: true,
        recommended_action: "retry",
        current_step: workflow.current_step,
        error_message: `Sync timed out after ${Math.round(totalMinutes)} minutes`
      };

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response: HealthCheckResponse = {
      workflow_id: workflow.id,
      status: isStuck ? "stuck" : workflow.status,
      actual_progress: actualProgress,
      reported_progress: workflow.progress_percent,
      records_synced: recordsSynced,
      expected_records: expectedRecords,
      last_activity_minutes_ago: Math.round(minutesSinceUpdate),
      is_stuck: isStuck,
      recommended_action: recommendedAction,
      current_step: workflow.current_step,
      error_message: workflow.error_message
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Health check error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
