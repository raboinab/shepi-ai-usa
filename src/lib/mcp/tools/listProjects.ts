import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description: "List the signed-in user's Shepi projects with basic metadata.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum number of projects to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data, error: dbError } = await client
      .from("projects")
      .select("id, name, client_name, target_company, industry, transaction_type, status, service_tier, current_phase, current_section, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
