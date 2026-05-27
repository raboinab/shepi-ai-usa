// Alice MCP Server — read-only admin data access for Shepi's autonomous CEO
// Streamable HTTP transport via mcp-lite + Hono

import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// ── Environment ──
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ALICE_API_KEY = Deno.env.get("ALICE_API_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}
if (!ALICE_API_KEY) {
  throw new Error("ALICE_API_KEY must be set");
}

// ── Supabase client (service role, server-side only) ──
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Constant-time comparison ──
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── Auth middleware ──
function checkAuth(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  return timingSafeEqual(token, ALICE_API_KEY!);
}

// ── MCP Server ──
const mcpServer = new McpServer({
  name: "shepi-alice",
  version: "1.0.0",
});

// ── Helpers ──
async function adminQuery(table: string, options?: { limit?: number; order?: string; select?: string }) {
  const { limit = 100, order = "created_at.desc", select = "*" } = options ?? {};
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(select)
    .order(order.split(".")[0], { ascending: order.endsWith(".asc") })
    .limit(limit);
  if (error) throw new Error(`DB error [${table}]: ${error.message}`);
  return data;
}

async function adminRpc(functionName: string, params?: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.rpc(functionName, params);
  if (error) throw new Error(`RPC error [${functionName}]: ${error.message}`);
  return data;
}

// ── Tools ──

mcpServer.tool({
  name: "get_overview_stats",
  description: "High-level business totals: users, projects, active subscriptions, contact submissions, and promo spots.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const [profiles, projects, subscriptions, contacts, promo] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("contact_submissions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("promo_config").select("value").eq("key", "early_adopter_spots").single(),
    ]);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          users: profiles.count ?? 0,
          projects: projects.count ?? 0,
          activeSubscriptions: subscriptions.count ?? 0,
          contacts: contacts.count ?? 0,
          earlyAdopterSpots: promo.data?.value ?? null,
        }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_users",
  description: "Paginated list of all users with engagement stats (signup date, last sign-in, project/doc counts, QB connected, onboarding done).",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Max rows (default 50, max 200)", default: 50 },
      offset: { type: "integer", description: "Offset for pagination", default: 0 },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    const data = await adminRpc("get_user_engagement_stats");
    const all = Array.isArray(data) ? data : [];
    const page = all.slice(offset, offset + limit);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: all.length, limit, offset, results: page }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "get_user_detail",
  description: "Detailed profile for a single user by UUID, including their projects and subscription.",
  inputSchema: {
    type: "object",
    properties: {
      user_id: { type: "string", description: "UUID of the user" },
    },
    required: ["user_id"],
  },
  handler: async (args: any) => {
    const userId = args.user_id;
    const [profile, projects, subscription] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("user_id", userId).single(),
      supabaseAdmin.from("projects").select("id,name,status,service_tier,current_phase,industry,created_at").eq("user_id", userId),
      supabaseAdmin.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          profile: profile.data,
          projects: projects.data ?? [],
          subscription: subscription.data?.[0] ?? null,
        }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_projects",
  description: "Paginated list of all projects with owner, tier, phase, status, industry, and created date.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Max rows (default 50, max 200)", default: 50 },
      offset: { type: "integer", description: "Offset for pagination", default: 0 },
      status: { type: "string", description: "Filter by status (optional)" },
      service_tier: { type: "string", description: "Filter by tier (optional)" },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    let q = supabaseAdmin.from("projects").select("id,name,client_name,target_company,user_id,status,service_tier,current_phase,current_section,industry,transaction_type,created_at").order("created_at", { ascending: false });
    if (args.status) q = q.eq("status", args.status);
    if (args.service_tier) q = q.eq("service_tier", args.service_tier);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`DB error [projects]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, limit, offset, results: data }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "get_project_detail",
  description: "Detailed view of a single project: wizard state, document counts, processed_data summary, and CPA claim if any.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: { type: "string", description: "UUID of the project" },
    },
    required: ["project_id"],
  },
  handler: async (args: any) => {
    const pid = args.project_id;
    const [project, docs, processed, claim, chatCount] = await Promise.all([
      supabaseAdmin.from("projects").select("*").eq("id", pid).single(),
      supabaseAdmin.from("documents").select("id,status,processing_status,category,created_at").eq("project_id", pid),
      supabaseAdmin.from("processed_data").select("id,data_type,period_start,period_end,source_type,record_count").eq("project_id", pid),
      supabaseAdmin.from("cpa_claims").select("*").eq("project_id", pid).maybeSingle(),
      supabaseAdmin.from("chat_messages").select("id", { count: "exact", head: true }).eq("project_id", pid),
    ]);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          project: project.data,
          documents: docs.data ?? [],
          processedData: processed.data ?? [],
          cpaClaim: claim.data ?? null,
          chatMessageCount: chatCount.count ?? 0,
        }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_subscriptions",
  description: "Active and past subscriptions with plan, status, Stripe IDs, and user email.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 50 },
      offset: { type: "integer", default: 0 },
      status: { type: "string", description: "Filter by status (active, canceled, past_due, etc.)" },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    let q = supabaseAdmin.from("subscriptions").select("*,profiles:user_id(email,full_name)").order("created_at", { ascending: false });
    if (args.status) q = q.eq("status", args.status);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`DB error [subscriptions]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, limit, offset, results: data }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_contact_submissions",
  description: "All contact form submissions, newest first.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 50 },
      offset: { type: "integer", default: 0 },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    const { data, error, count } = await supabaseAdmin
      .from("contact_submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`DB error [contact_submissions]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, limit, offset, results: data }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_cpa_applications",
  description: "CPA onboarding applications with status, review state, and contact info.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 50 },
      offset: { type: "integer", default: 0 },
      status: { type: "string", description: "Filter by status (submitted, approved, rejected, pending_review)" },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    let q = supabaseAdmin.from("cpa_applications").select("*").order("created_at", { ascending: false });
    if (args.status) q = q.eq("status", args.status);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`DB error [cpa_applications]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, limit, offset, results: data }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "list_dfy_engagements",
  description: "Done-for-you projects with claim status and assigned CPA.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 50 },
      offset: { type: "integer", default: 0 },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;
    const { data, error, count } = await supabaseAdmin
      .from("projects")
      .select("id,name,client_name,target_company,status,current_phase,industry,created_at,cpa_claims!left(*)").eq("service_tier", "done_for_you")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`DB error [projects/dfy]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, limit, offset, results: data }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "get_demo_views",
  description: "Demo page view analytics for the last N days (default 30), grouped by page with unique user counts.",
  inputSchema: {
    type: "object",
    properties: {
      days: { type: "integer", description: "Number of days back (default 30)", default: 30 },
    },
  },
  handler: async (args: any) => {
    const days = args.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabaseAdmin
      .from("demo_views")
      .select("page,user_id,viewed_at")
      .gte("viewed_at", since.toISOString());
    if (error) throw new Error(`DB error [demo_views]: ${error.message}`);

    const grouped: Record<string, { views: number; users: Set<string> }> = {};
    for (const row of data ?? []) {
      if (!grouped[row.page]) grouped[row.page] = { views: 0, users: new Set() };
      grouped[row.page].views++;
      grouped[row.page].users.add(row.user_id);
    }
    const results = Object.entries(grouped)
      .map(([page, s]) => ({ page, views: s.views, uniqueUsers: s.users.size }))
      .sort((a, b) => b.views - a.views);
    const allUsers = new Set(data?.map((r: any) => r.user_id));
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ days, totalViews: data?.length ?? 0, totalUniqueUsers: allUsers.size, byPage: results }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "get_promo_config",
  description: "Current promotional configuration values (e.g. early-adopter spots).",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await supabaseAdmin.from("promo_config").select("key,value,updated_at");
    if (error) throw new Error(`DB error [promo_config]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ config: data ?? [] }, null, 2),
      }],
    };
  },
});

mcpServer.tool({
  name: "get_diagnostics",
  description: "Recent edge function health diagnostics (latest 50 rows).",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 50 },
    },
  },
  handler: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const { data, error, count } = await supabaseAdmin
      .from("function_diagnostics")
      .select("*", { count: "exact" })
      .order("checked_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`DB error [function_diagnostics]: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ total: count ?? data?.length ?? 0, results: data }, null, 2),
      }],
    };
  },
});

// ── Hono app + MCP HTTP transport ──
const app = new Hono();
const transport = new StreamableHttpTransport();

app.use("/*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (!checkAuth(c.req.raw)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  await next();
});

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

// Required Accept header per MCP Streamable HTTP spec for POST requests
// Hono handles the raw request; transport expects proper headers on the incoming Request.
Deno.serve(async (req) => {
  // Ensure the Accept header is present for MCP compliance
  if (req.method === "POST") {
    const headers = new Headers(req.headers);
    if (!headers.get("Accept")?.includes("text/event-stream")) {
      // Some MCP clients don't send the full Accept header; patch it in before passing to Hono
      headers.set("Accept", "application/json, text/event-stream");
    }
    const patchedReq = new Request(req.url, { method: req.method, headers, body: req.body });
    return app.fetch(patchedReq);
  }
  return app.fetch(req);
});
