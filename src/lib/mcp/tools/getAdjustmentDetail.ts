import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "get_adjustment_detail",
  title: "Get adjustment detail",
  description: "Read a single adjustment proposal with rationale, evidence, and period values.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
    adjustment_id: z.string().uuid().describe("The adjustment proposal ID (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, adjustment_id }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data, error: dbError } = await client
      .from("adjustment_proposals")
      .select("*")
      .eq("id", adjustment_id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Adjustment not found or access denied." }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { adjustment: data },
    };
  },
});
