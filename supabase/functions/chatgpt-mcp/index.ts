/**
 * ChatGPT MCP App server for shepi.
 *
 * Uses the official @modelcontextprotocol/sdk with WebStandard Streamable HTTP
 * transport so it runs on Supabase Edge Functions (Deno). Widgets are registered
 * via @modelcontextprotocol/ext-apps/server.
 */

import { McpServer } from "npm:@modelcontextprotocol/sdk@^1.29.0/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@^1.29.0/server/webStandardStreamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "npm:@modelcontextprotocol/ext-apps@^1.7.4/server";
import { createClient } from "npm:@supabase/supabase-js@^2.87.1";
import { z } from "npm:zod@^4.4.3";
import { projectToDealData } from "../_shared/qoe/projectToDealAdapter.ts";
import { computeQoEMetrics } from "../_shared/qoe/qoeMetrics.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// ── Environment ──
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
const PROJECT_REF = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : "project-ref-unset";
const OAUTH_ISSUER = `https://${PROJECT_REF}.supabase.co/auth/v1`;

const WIDGET_HTML = "__WIDGET_HTML_PLACEHOLDER__";

// ── Types ──
interface AuthedContext {
  userId: string;
  token: string;
  email?: string;
  clientId?: string;
}

type AuthResult =
  | { ok: true; ctx: AuthedContext }
  | { ok: false; response: Response };

// ── Auth helpers ──
function jsonResponse(status: number, body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    headers.set(k, v);
  }
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

function mcpUnauthorizedResponse(): Response {
  return jsonResponse(401, { error: "unauthorized" }, {
    headers: {
      "WWW-Authenticate": `Bearer resource_metadata="https://${PROJECT_REF}.supabase.co/functions/v1/chatgpt-mcp/.well-known/oauth-protected-resource"`,
    },
  });
}

async function verifyAuth(req: Request): Promise<AuthResult> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return { ok: false, response: mcpUnauthorizedResponse() };
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return { ok: false, response: mcpUnauthorizedResponse() };
  }

  const client = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, response: mcpUnauthorizedResponse() };
  }

  const user = data.user;
  return {
    ok: true,
    ctx: {
      userId: user.id,
      token,
      email: user.email,
    },
  };
}

function supabaseForUser(ctx: AuthedContext) {
  return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── MCP Server factory ──
function createServer(): McpServer {
  const server = new McpServer({
    name: "shepi-chatgpt",
    version: "0.1.0",
  });

  // Widget resource URI used by multiple tools.
  const projectSummaryResourceUri = "ui://project-summary/mcp-app.html";

  registerAppTool(
    server,
    "echo",
    {
      title: "Echo",
      description: "Echo the input text back to the caller. Useful for verifying MCP connectivity to the shepi app.",
      inputSchema: z.object({
        text: z.string().min(1).describe("Text to echo back."),
      }),
    },
    async ({ text }: { text: string }) => {
      return { content: [{ type: "text" as const, text }] };
    },
  );

  registerAppTool(
    server,
    "list_projects",
    {
      title: "List projects",
      description: "List the signed-in user's Shepi projects with basic metadata.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(50).describe("Maximum number of projects to return."),
      }),
      _meta: { ui: { resourceUri: projectSummaryResourceUri } },
    },
    async ({ limit }: { limit: number }, extra: { authInfo?: AuthedContext }) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      const { data, error } = await supabaseForUser(ctx)
        .from("projects")
        .select("id, name, client_name, target_company, industry, transaction_type, status, service_tier, current_phase, current_section, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
        structuredContent: { projects: data ?? [] },
      };
    },
  );

  registerAppTool(
    server,
    "get_project_summary",
    {
      title: "Get project summary",
      description: "Read a project's metadata, current wizard phase/section, and service tier.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("The project ID (UUID)."),
      }),
      _meta: { ui: { resourceUri: projectSummaryResourceUri } },
    },
    async ({ project_id }: { project_id: string }, extra: { authInfo?: AuthedContext }) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      const { data, error } = await supabaseForUser(ctx)
        .from("projects")
        .select("id, name, client_name, target_company, industry, transaction_type, status, service_tier, fiscal_year_end, current_phase, current_section, created_at, updated_at")
        .eq("id", project_id)
        .maybeSingle();
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      if (!data) {
        return { content: [{ type: "text" as const, text: "Project not found or access denied." }], isError: true };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
        structuredContent: { project: data },
      };
    },
  );

  registerAppTool(
    server,
    "get_quality_of_earnings_summary",
    {
      title: "Get Quality of Earnings summary",
      description: "Compute a structured LTM QoE summary for a project: revenue, gross profit, net income, reported EBITDA, total adjustments, and adjusted EBITDA.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("The project ID (UUID)."),
      }),
      _meta: { ui: { resourceUri: projectSummaryResourceUri } },
    },
    async ({ project_id }: { project_id: string }, extra: { authInfo?: AuthedContext }) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      const { data, error } = await supabaseForUser(ctx)
        .from("projects")
        .select("id, name, client_name, target_company, industry, transaction_type, fiscal_year_end, periods, wizard_data")
        .eq("id", project_id)
        .maybeSingle();
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      if (!data) {
        return { content: [{ type: "text" as const, text: "Project not found or access denied." }], isError: true };
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
          content: [{ type: "text" as const, text: JSON.stringify(summary) }],
          structuredContent: { summary },
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { content: [{ type: "text" as const, text: `Failed to compute QoE summary: ${message}` }], isError: true };
      }
    },
  );

  registerAppTool(
    server,
    "create_project",
    {
      title: "Create project",
      description: "Create a new Shepi project. The project is owned by the signed-in user.",
      inputSchema: z.object({
        name: z.string().trim().min(1).max(255).describe("Project name."),
        target_company: z.string().trim().max(255).optional().describe("Target company name."),
        client_name: z.string().trim().max(255).optional().describe("Client name."),
        industry: z.string().trim().max(255).optional().describe("Industry."),
        transaction_type: z.string().trim().max(255).optional().describe("Transaction type (e.g. buy-side, sell-side)."),
        service_tier: z.enum(["diy", "done_for_you"]).default("diy").describe("Service tier for the project."),
      }),
    },
    async (
      { name, target_company, client_name, industry, transaction_type, service_tier }: {
        name: string;
        target_company?: string;
        client_name?: string;
        industry?: string;
        transaction_type?: string;
        service_tier: "diy" | "done_for_you";
      },
      extra: { authInfo?: AuthedContext },
    ) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      const { data, error } = await supabaseForUser(ctx)
        .from("projects")
        .insert({
          user_id: ctx.userId,
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
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
        structuredContent: { project: data },
      };
    },
  );

  registerAppTool(
    server,
    "list_adjustments",
    {
      title: "List adjustments",
      description: "List adjustment proposals for a project with category, status, and total proposed amount.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("The project ID (UUID)."),
        status: z.enum(["pending", "accepted", "accepted_with_edits", "rejected", "dismissed"]).optional().describe("Optional status filter."),
        limit: z.number().int().min(1).max(200).default(100).describe("Maximum number of adjustments to return."),
      }),
    },
    async ({ project_id, status, limit }: { project_id: string; status?: string; limit: number }, extra: { authInfo?: AuthedContext }) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      let q = supabaseForUser(ctx)
        .from("adjustment_proposals")
        .select("id, title, description, block, adjustment_class, intent, status, proposed_amount, proposed_period_values, evidence_strength, review_priority, ai_rationale, created_at, updated_at")
        .eq("project_id", project_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status) {
        q = q.eq("status", status);
      }
      const { data, error } = await q;
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
        structuredContent: { adjustments: data ?? [] },
      };
    },
  );

  registerAppTool(
    server,
    "update_adjustment_status",
    {
      title: "Update adjustment status",
      description: "Change the status of an adjustment proposal on a project (e.g. accept or reject an AI-suggested adjustment).",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("The project ID (UUID)."),
        adjustment_id: z.string().uuid().describe("The adjustment proposal ID (UUID)."),
        status: z.enum(["pending", "accepted", "accepted_with_edits", "rejected", "dismissed"]).describe("New status for the adjustment."),
        reviewer_notes: z.string().max(2000).optional().describe("Optional notes explaining the decision."),
      }),
    },
    async (
      { project_id, adjustment_id, status, reviewer_notes }: {
        project_id: string;
        adjustment_id: string;
        status: string;
        reviewer_notes?: string;
      },
      extra: { authInfo?: AuthedContext },
    ) => {
      const ctx = extra?.authInfo;
      if (!ctx) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
      const update: Record<string, unknown> = { status };
      if (reviewer_notes !== undefined) {
        update.reviewer_notes = reviewer_notes;
        update.reviewed_at = new Date().toISOString();
      }
      const { data, error } = await supabaseForUser(ctx)
        .from("adjustment_proposals")
        .update(update)
        .eq("id", adjustment_id)
        .eq("project_id", project_id)
        .select("id, title, status, reviewer_notes, reviewed_at, updated_at")
        .single();
      if (error) {
        return { content: [{ type: "text" as const, text: error.message }], isError: true };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
        structuredContent: { adjustment: data },
      };
    },
  );

  registerAppResource(
    server,
    projectSummaryResourceUri,
    projectSummaryResourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      return {
        contents: [
          {
            uri: projectSummaryResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: WIDGET_HTML,
            _meta: {
              ui: {
                prefersBorder: true,
                csp: {
                  connectDomains: ["https://mdgmessqbfebrbvjtndz.supabase.co"],
                },
              },
            },
          },
        ],
      };
    },
  );

  return server;
}

// ── HTTP handler ──
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // OAuth protected-resource metadata is public.
  if (url.pathname === "/.well-known/oauth-protected-resource" && req.method === "GET") {
    return jsonResponse(200, {
      resource: `https://${PROJECT_REF}.supabase.co/functions/v1/chatgpt-mcp`,
      authorization_servers: [OAUTH_ISSUER],
      resource_name: "shepi",
      resource_documentation: "https://shepi.ai/for-ai-agents",
    });
  }

  // Health check.
  if (url.pathname === "/health" && req.method === "GET") {
    return jsonResponse(200, { ok: true });
  }

  // MCP protocol is at the function root.
  if (url.pathname !== "/") {
    return jsonResponse(404, { error: "Not found" });
  }

  // Auth gate for MCP requests.
  const auth = await verifyAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Patch Accept header for MCP Streamable HTTP compliance if missing.
  let working = req;
  const accept = req.headers.get("Accept") ?? "";
  if (req.method === "POST" && (!accept.includes("text/event-stream") || !accept.includes("application/json"))) {
    const headers = new Headers(req.headers);
    headers.set("Accept", "application/json, text/event-stream");
    working = new Request(req.url, { method: req.method, headers, body: req.body });
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // Attach auth info to the transport context so tool handlers can access it.
  (transport as any).authInfo = auth.ctx;

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(working, {
      authInfo: { userId: auth.ctx.userId, email: auth.ctx.email },
    });
    // Merge CORS headers.
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      headers.set(k, v);
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[chatgpt-mcp] error:", message);
    return jsonResponse(500, { error: message });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
});
