import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALL_TABLES = [
  "profiles", "user_roles", "promo_config", "contact_submissions",
  "demo_views", "nudge_log", "tos_acceptances", "processed_webhook_events",
  "rag_chunks", "user_credits", "subscriptions", "projects",
  "project_shares", "project_payments", "company_info", "documents",
  "processed_data", "project_data_chunks", "qb_sync_requests",
  "analysis_jobs", "chat_messages", "flagged_transactions",
  "adjustment_proofs", "docuclipper_jobs", "canonical_transactions",
  "detector_runs", "observations", "tensions", "hypotheses", "findings",
  "adjustment_proposals", "proposal_evidence", "claim_ledger",
  "entity_nodes", "business_profiles", "verification_attempts",
  "verification_transaction_snapshots", "reclassification_jobs",
  "admin_notes", "workflows",
];

const REDACTED_COLUMNS: Record<string, string[]> = {
  company_info: ["bearer_token", "refresh_token", "auth_code"],
  rag_chunks: ["embedding"],
  project_data_chunks: ["embedding"],
};

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const json = JSON.stringify(val);
    return `'${json.replace(/'/g, "''")}'::jsonb`;
  }
  const s = String(val);
  return `'${s.replace(/'/g, "''")}'`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const tableName = url.searchParams.get("table");
    const mode = url.searchParams.get("mode");

    // Mode: list tables with row counts
    if (mode === "list") {
      const counts: { table: string; count: number }[] = [];
      for (const t of ALL_TABLES) {
        const { count, error } = await adminClient
          .from(t)
          .select("*", { count: "exact", head: true });
        counts.push({ table: t, count: error ? -1 : (count ?? 0) });
      }
      return new Response(JSON.stringify(counts), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Must specify a table
    if (!tableName || !ALL_TABLES.includes(tableName)) {
      return new Response(
        JSON.stringify({ error: "Specify ?table=<name>", tables: ALL_TABLES }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "5000", 10);
    const redactCols = REDACTED_COLUMNS[tableName] || [];

    // Single chunk fetch
    const { data, error, count } = await adminClient
      .from(tableName)
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(
        JSON.stringify({ error: `Fetch error: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCount = count ?? 0;
    const rowCount = data?.length ?? 0;
    const hasMore = offset + limit < totalCount;

    const sqlParts: string[] = [];
    if (offset === 0) {
      sqlParts.push(`-- Table: ${tableName}`);
      sqlParts.push(`-- Exported at: ${new Date().toISOString()}`);
      sqlParts.push(`-- Total rows: ${totalCount}`);
      sqlParts.push("");
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]).filter((c) => !redactCols.includes(c));
      const colList = columns.map((c) => `"${c}"`).join(", ");

      for (const row of data) {
        const vals = columns.map((col) => escapeSqlValue(row[col]));
        sqlParts.push(
          `INSERT INTO public."${tableName}" (${colList}) VALUES (${vals.join(", ")});`
        );
      }
    }

    if (!hasMore) {
      sqlParts.push("");
      sqlParts.push(`-- ${tableName}: ${totalCount} rows exported`);
      sqlParts.push("");
    }

    return new Response(sqlParts.join("\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "X-Total-Count": String(totalCount),
        "X-Row-Count": String(rowCount),
        "X-Offset": String(offset),
        "X-Has-More": String(hasMore),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
