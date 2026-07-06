import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "list_adjustments",
  title: "List adjustments",
  description: "List adjustment proposals for a project with category, status, and total proposed amount.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
    status: z.enum(["pending", "accepted", "accepted_with_edits", "rejected", "dismissed"]).optional().describe("Optional status filter."),
    limit: z.number().int().min(1).max(200).default(100).describe("Maximum number of adjustments to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, status, limit }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    let query = client
      .from("adjustment_proposals")
      .select("id, title, description, block, adjustment_class, intent, status, proposed_amount, proposed_period_values, evidence_strength, review_priority, ai_rationale, created_at, updated_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { adjustments: data ?? [] },
    };
  },
});
