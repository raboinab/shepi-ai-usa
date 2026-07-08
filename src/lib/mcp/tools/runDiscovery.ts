import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { invokeEdgeFunction } from "./supabase";

export default defineTool({
  name: "run_discovery",
  title: "Run adjustment discovery",
  description:
    "Start Shepi's AI adjustment-discovery analysis for a project. Runs asynchronously — returns a job id immediately. Poll get_discovery_status until status is 'completed', then use list_adjustments to read the proposals.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    const { ok, status, data } = await invokeEdgeFunction(ctx, "trigger-discovery", { project_id });
    if (!ok) {
      const msg = (data as { error?: string })?.error ?? `HTTP ${status}`;
      return { content: [{ type: "text", text: `Failed to start discovery: ${msg}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { discovery: data },
    };
  },
});
