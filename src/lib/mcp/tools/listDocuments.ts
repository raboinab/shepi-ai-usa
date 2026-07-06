import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "list_documents",
  title: "List documents",
  description: "List documents uploaded to a project with processing status and category.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
    limit: z.number().int().min(1).max(200).default(100).describe("Maximum number of documents to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, limit }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data, error: dbError } = await client
      .from("documents")
      .select("id, name, file_type, category, processing_status, status, coverage_validated, institution, account_label, period_start, period_end, created_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { documents: data ?? [] },
    };
  },
});
