import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

const VALID_STATUSES = ["pending", "accepted", "accepted_with_edits", "rejected", "dismissed"] as const;

export default defineTool({
  name: "update_adjustment_status",
  title: "Update adjustment status",
  description: "Change the status of an adjustment proposal on a project (e.g. accept or reject an AI-suggested adjustment).",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
    adjustment_id: z.string().uuid().describe("The adjustment proposal ID (UUID)."),
    status: z.enum(VALID_STATUSES).describe("New status for the adjustment."),
    reviewer_notes: z.string().max(2000).optional().describe("Optional notes explaining the decision."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ project_id, adjustment_id, status, reviewer_notes }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const update: Record<string, unknown> = { status };
    if (reviewer_notes !== undefined) {
      update.reviewer_notes = reviewer_notes;
      update.reviewed_at = new Date().toISOString();
    }

    const { data, error: dbError } = await client
      .from("adjustment_proposals")
      .update(update)
      .eq("id", adjustment_id)
      .eq("project_id", project_id)
      .select("id, title, status, reviewer_notes, reviewed_at, updated_at")
      .single();

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { adjustment: data },
    };
  },
});
