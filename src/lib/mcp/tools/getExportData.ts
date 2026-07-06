import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./supabase";
import { projectToDealData } from "../../projectToDealAdapter";
import { computeQoEMetrics } from "../../qoeMetrics";

export default defineTool({
  name: "get_export_data",
  title: "Get export data",
  description: "Return the structured workbook and QoE data for a project as JSON, suitable for AI analysis. For actual PDF/XLSX file downloads, use the in-app Export Center at the returned URL.",
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
      .select("id, name, client_name, target_company, industry, transaction_type, fiscal_year_end, periods, wizard_data, service_tier, revision")
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

      const result = {
        project_id: data.id,
        project_name: data.name,
        target_company: data.target_company,
        service_tier: data.service_tier,
        qoe_metrics: metrics,
        export_url: `https://shepi.ai/project/${project_id}/workbook`,
        // Wizard data is the source of truth for the project. It is returned so the
        // connected AI can analyze the deal setup, trial balance, adjustments, and
        // supplementary schedules without requiring a full workbook rebuild.
        wizard_data: data.wizard_data,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { exportData: result },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Failed to build export data: ${message}` }], isError: true };
    }
  },
});
