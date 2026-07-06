import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";

export default defineTool({
  name: "create_project",
  title: "Create project",
  description: "Create a new Shepi project. The project is owned by the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).max(255).describe("Project name."),
    target_company: z.string().trim().max(255).optional().describe("Target company name."),
    client_name: z.string().trim().max(255).optional().describe("Client name."),
    industry: z.string().trim().max(255).optional().describe("Industry."),
    transaction_type: z.string().trim().max(255).optional().describe("Transaction type (e.g. buy-side, sell-side)."),
    service_tier: z.enum(["diy", "done_for_you"]).default("diy").describe("Service tier for the project."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name, target_company, client_name, industry, transaction_type, service_tier }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "User ID not available." }], isError: true };
    }

    const { data, error: dbError } = await client
      .from("projects")
      .insert({
        user_id: userId,
        name,
        target_company: target_company ?? null,
        client_name: client_name ?? null,
        industry: industry ?? null,
        transaction_type: transaction_type ?? null,
        service_tier: service_tier ?? "diy",
        status: "draft",
        current_phase: 1,
        current_section: 1,
        revision: 0,
      })
      .select("id, name, target_company, client_name, industry, transaction_type, service_tier, status, created_at")
      .single();

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { project: data },
    };
  },
});
