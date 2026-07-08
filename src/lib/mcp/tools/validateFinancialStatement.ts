import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, invokeEdgeFunction } from "./supabase";

export default defineTool({
  name: "validate_financial_statement",
  title: "Validate financial statement",
  description:
    "Validate an already-uploaded balance sheet, income statement, or cash flow document against the project's trial balance — returns line-item totals and variances. The document must already exist in the project (upload happens in the Shepi app).",
  inputSchema: {
    project_id: z.string().uuid().describe("The project ID (UUID)."),
    document_id: z.string().uuid().describe("The uploaded document ID (UUID) to validate."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, document_id }, ctx) => {
    const { error, client } = supabaseForUser(ctx);
    if (error || !client) {
      return { content: [{ type: "text", text: error ?? "Not authenticated" }], isError: true };
    }

    const { data: doc, error: docErr } = await client
      .from("documents")
      .select("id, account_type, period_start, period_end, name")
      .eq("id", document_id)
      .eq("project_id", project_id)
      .maybeSingle();
    if (docErr) {
      return { content: [{ type: "text", text: docErr.message }], isError: true };
    }
    if (!doc) {
      return { content: [{ type: "text", text: "Document not found or access denied." }], isError: true };
    }

    const { ok, status, data } = await invokeEdgeFunction(ctx, "validate-financial-statement", {
      projectId: project_id,
      documentId: document_id,
      documentType: doc.account_type,
      periodStart: doc.period_start ?? null,
      periodEnd: doc.period_end ?? null,
    });
    if (!ok) {
      const msg = (data as { error?: string })?.error ?? `HTTP ${status}`;
      return { content: [{ type: "text", text: `Validation failed: ${msg}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { validation: data },
    };
  },
});
