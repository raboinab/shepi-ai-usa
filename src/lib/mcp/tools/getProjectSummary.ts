import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "get_project_summary",
  title: "Get project summary",
  description: "Read a project's metadata, current wizard phase/section, and service tier.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data, error: dbError } = await client
      .from("projects")
      .select("id, name, client_name, target_company, industry, transaction_type, status, service_tier, fiscal_year_end, current_phase, current_section, created_at, updated_at")
      .eq("id", project_id)
      .maybeSingle();

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Project not found or access denied." }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { project: data },
    };
  },
});
