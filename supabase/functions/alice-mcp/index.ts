// Alice MCP Server — read-only admin data access for Shepi's autonomous CEO
// Streamable HTTP transport via mcp-lite

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

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Constant-time comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function checkAuth(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  return timingSafeEqual(auth.slice(7), ALICE_API_KEY!);
}

const ok = (obj: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
});

const mcpServer = new McpServer({ name: "shepi-alice", version: "1.0.0" });

mcpServer.tool("get_overview_stats", {
  description: "High-level business totals: users, projects, active subscriptions, contact submissions, and current early-adopter promo spots.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const [profiles, projects, subscriptions, contacts, promo] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("contact_submissions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("promo_config").select("value").eq("key", "early_adopter_spots").maybeSingle(),
    ]);
    return ok({
      users: profiles.count ?? 0,
      projects: projects.count ?? 0,
      activeSubscriptions: subscriptions.count ?? 0,
      contactSubmissions: contacts.count ?? 0,
      earlyAdopterSpots: promo.data?.value ?? null,
    });
  },
});

mcpServer.tool("list_users", {
  description: "Paginated list of all users with engagement stats (signup date, last sign-in, project/doc counts, QB connected, onboarding done).",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Max rows (default 50, max 200)" },
      offset: { type: "integer", description: "Offset for pagination" },
    },
  },
  handler: async (args: { limit?: number; offset?: number }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    const { data, error } = await supabaseAdmin.rpc("get_user_engagement_stats");
    if (error) throw new Error(error.message);
    const all = (data ?? []) as unknown[];
    return ok({ total: all.length, limit, offset, results: all.slice(offset, offset + limit) });
  },
});

mcpServer.tool("get_user_detail", {
  description: "Profile, projects, and subscription for a single user by UUID.",
  inputSchema: {
    type: "object",
    properties: { user_id: { type: "string", description: "UUID of the user" } },
    required: ["user_id"],
  },
  handler: async (args: { user_id: string }) => {
    const userId = args.user_id;
    const [profile, projects, subscription] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("projects").select("id,name,status,service_tier,current_phase,industry,created_at").eq("user_id", userId),
      supabaseAdmin.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);
    return ok({
      profile: profile.data,
      projects: projects.data ?? [],
      subscription: subscription.data?.[0] ?? null,
    });
  },
});

mcpServer.tool("list_projects", {
  description: "Paginated list of all projects with owner, tier, phase, status, industry, and created date.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer" },
      offset: { type: "integer" },
      status: { type: "string", description: "Optional status filter" },
      service_tier: { type: "string", description: "Optional tier filter (e.g. 'done_for_you')" },
    },
  },
  handler: async (args: { limit?: number; offset?: number; status?: string; service_tier?: string }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    let q = supabaseAdmin
      .from("projects")
      .select("id,name,client_name,target_company,user_id,status,service_tier,current_phase,current_section,industry,transaction_type,created_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (args?.status) q = q.eq("status", args.status);
    if (args?.service_tier) q = q.eq("service_tier", args.service_tier);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return ok({ total: count ?? data?.length ?? 0, limit, offset, results: data });
  },
});

mcpServer.tool("get_project_detail", {
  description: "Detailed view of a single project: wizard state, documents, processed_data summary, CPA claim, chat message count.",
  inputSchema: {
    type: "object",
    properties: { project_id: { type: "string", description: "UUID of the project" } },
    required: ["project_id"],
  },
  handler: async (args: { project_id: string }) => {
    const pid = args.project_id;
    const [project, docs, processed, claim, chatCount] = await Promise.all([
      supabaseAdmin.from("projects").select("*").eq("id", pid).maybeSingle(),
      supabaseAdmin.from("documents").select("id,name,status,processing_status,category,created_at").eq("project_id", pid),
      supabaseAdmin.from("processed_data").select("id,data_type,period_start,period_end,source_type,record_count").eq("project_id", pid),
      supabaseAdmin.from("cpa_claims").select("*").eq("project_id", pid).maybeSingle(),
      supabaseAdmin.from("chat_messages").select("id", { count: "exact", head: true }).eq("project_id", pid),
    ]);
    return ok({
      project: project.data,
      documents: docs.data ?? [],
      processedData: processed.data ?? [],
      cpaClaim: claim.data ?? null,
      chatMessageCount: chatCount.count ?? 0,
    });
  },
});

mcpServer.tool("list_subscriptions", {
  description: "Subscriptions with plan, status, Stripe IDs. Optionally filter by status.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer" },
      offset: { type: "integer" },
      status: { type: "string", description: "Filter (active, canceled, past_due, etc.)" },
    },
  },
  handler: async (args: { limit?: number; offset?: number; status?: string }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    let q = supabaseAdmin.from("subscriptions").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (args?.status) q = q.eq("status", args.status);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return ok({ total: count ?? data?.length ?? 0, limit, offset, results: data });
  },
});

mcpServer.tool("list_contact_submissions", {
  description: "Contact form submissions, newest first.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  },
  handler: async (args: { limit?: number; offset?: number }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    const { data, error, count } = await supabaseAdmin
      .from("contact_submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return ok({ total: count ?? data?.length ?? 0, limit, offset, results: data });
  },
});

mcpServer.tool("list_cpa_applications", {
  description: "CPA onboarding applications with status and contact info.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer" },
      offset: { type: "integer" },
      status: { type: "string", description: "Filter by status (submitted, approved, rejected, etc.)" },
    },
  },
  handler: async (args: { limit?: number; offset?: number; status?: string }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    let q = supabaseAdmin.from("cpa_applications").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (args?.status) q = q.eq("status", args.status);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return ok({ total: count ?? data?.length ?? 0, limit, offset, results: data });
  },
});

mcpServer.tool("list_dfy_engagements", {
  description: "Done-for-you projects with their CPA claims (assigned CPA, status, timestamps).",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  },
  handler: async (args: { limit?: number; offset?: number }) => {
    const limit = Math.min(args?.limit ?? 50, 200);
    const offset = args?.offset ?? 0;
    const { data, error, count } = await supabaseAdmin
      .from("projects")
      .select("id,name,client_name,target_company,status,current_phase,industry,created_at,cpa_claims(*)", { count: "exact" })
      .eq("service_tier", "done_for_you")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return ok({ total: count ?? data?.length ?? 0, limit, offset, results: data });
  },
});

mcpServer.tool("get_demo_views", {
  description: "Demo page view analytics for the last N days (default 30), grouped by page with unique-user counts.",
  inputSchema: {
    type: "object",
    properties: {
      days: { type: "integer", description: "Number of days back (default 30)" },
    },
  },
  handler: async (args: { days?: number }) => {
    const days = args?.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabaseAdmin
      .from("demo_views")
      .select("page,user_id,viewed_at")
      .gte("viewed_at", since.toISOString());
    if (error) throw new Error(error.message);
    const grouped: Record<string, { views: number; users: Set<string> }> = {};
    for (const row of (data ?? []) as Array<{ page: string; user_id: string }>) {
      if (!grouped[row.page]) grouped[row.page] = { views: 0, users: new Set() };
      grouped[row.page].views++;
      grouped[row.page].users.add(row.user_id);
    }
    const byPage = Object.entries(grouped)
      .map(([page, s]) => ({ page, views: s.views, uniqueUsers: s.users.size }))
      .sort((a, b) => b.views - a.views);
    const allUsers = new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
    return ok({ days, totalViews: data?.length ?? 0, totalUniqueUsers: allUsers.size, byPage });
  },
});

mcpServer.tool("get_promo_config", {
  description: "Current promotional configuration values (e.g. early-adopter spots).",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await supabaseAdmin.from("promo_config").select("key,value,updated_at");
    if (error) throw new Error(error.message);
    return ok({ config: data ?? [] });
  },
});

mcpServer.tool("get_recent_signups", {
  description: "Most recent user signups with profile info.",
  inputSchema: {
    type: "object",
    properties: { limit: { type: "integer", description: "Default 20, max 100" } },
  },
  handler: async (args: { limit?: number }) => {
    const limit = Math.min(args?.limit ?? 20, 100);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id,full_name,company,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ok({ results: data ?? [] });
  },
});

// ── HTTP server ──
const transport = new StreamableHttpTransport();
const handleMcp = transport.bind(mcpServer);

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth gate
  if (!checkAuth(req)) {
    console.log(`[alice-mcp] 401 unauthorized from ${req.headers.get("user-agent") ?? "unknown"}`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Patch Accept header for MCP-spec compliance if missing
  let working = req;
  if (req.method === "POST") {
    const accept = req.headers.get("Accept") ?? "";
    if (!accept.includes("text/event-stream") || !accept.includes("application/json")) {
      const headers = new Headers(req.headers);
      headers.set("Accept", "application/json, text/event-stream");
      working = new Request(req.url, { method: req.method, headers, body: req.body });
    }
  }

  const start = Date.now();
  try {
    const res = await handleMcp(working);
    console.log(`[alice-mcp] ${req.method} ${new URL(req.url).pathname} → ${res.status} (${Date.now() - start}ms)`);
    // Merge CORS headers into response
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[alice-mcp] error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
