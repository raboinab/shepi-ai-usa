import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";
import { projectToDealData } from "../../projectToDealAdapter";
import { computeQoEMetrics } from "../../qoeMetrics";

export default defineTool({
  name: "get_quality_of_earnings_summary",
  title: "Get Quality of Earnings summary",
  description: "Compute a structured LTM QoE summary for a project: revenue, gross profit, net income, reported EBITDA, total adjustments, and adjusted EBITDA.",
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
      .select("id, name, client_name, target_company, industry, transaction_type, fiscal_year_end, periods, wizard_data")
      .eq("id", project_id)
      .maybeSingle();

    if (dbError) {
      return { content: [{ type: "text", text: dbError.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Project not found or access denied." }], isError: true };
    }

    try {
      const dealData = projectToDealData(data as any);
      const metrics = computeQoEMetrics(dealData);
      const summary = {
        project_id: data.id,
        project_name: data.name,
        target_company: data.target_company,
        ...metrics,
        currency: "USD",
        scope: "LTM (last 12 non-stub periods)",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary) }],
        structuredContent: { summary },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Failed to compute QoE summary: ${message}` }], isError: true };
    }
  },
});
