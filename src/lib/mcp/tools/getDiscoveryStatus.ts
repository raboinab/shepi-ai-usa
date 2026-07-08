import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "get_discovery_status",
  title: "Get discovery status",
  description:
    "Check the status of adjustment discovery for a project (queued / running / completed / failed) and how many adjustment proposals exist so far. Use to poll after run_discovery.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data: job, error: jobErr } = await client
      .from("analysis_jobs")
      .select("id, status, progress_percent, error_message, requested_at, completed_at")
      .eq("project_id", project_id)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (jobErr) {
      return { content: [{ type: "text", text: jobErr.message }], isError: true };
    }

    const { count } = await client
      .from("adjustment_proposals")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project_id);

    const result = {
      project_id,
      status: job?.status ?? "no_job",
      progress_percent: job?.progress_percent ?? null,
      error_message: job?.error_message ?? null,
      adjustments_found: count ?? 0,
      job_id: job?.id ?? null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { status: result },
    };
  },
});
