import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .single();

    if (profile?.app_role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tables to export (the ones with missing data in NEW database)
    const tablesToExport = [
      "processed_data",
      "canonical_transactions",
      "workflows",
      "analysis_jobs",
      "adjustment_proposals",
      "chat_messages",
      "reclassification_jobs",
      "qoe_rag_chunks",
      "project_embeddings",
    ];

    let sqlOutput = "-- Data Export from Lovable Cloud (sqwohcvobfnymsbzlfqr)\n";
    sqlOutput += "-- Generated: " + new Date().toISOString() + "\n";
    sqlOutput += "-- Target: mdgmessqbfebrbvjtndz\n\n";
    sqlOutput += "-- Disable triggers during import for faster loading\n";
    sqlOutput += "SET session_replication_role = replica;\n\n";

    let totalRows = 0;
    const tableStats: Record<string, number> = {};

    for (const tableName of tablesToExport) {
      console.log(`Exporting table: ${tableName}`);
      
      try {
        // Get all rows from the table
        const { data: rows, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(10000); // Adjust if tables are larger

        if (error) {
          console.error(`Error reading ${tableName}:`, error);
          sqlOutput += `-- ERROR reading ${tableName}: ${error.message}\n\n`;
          continue;
        }

        if (!rows || rows.length === 0) {
          sqlOutput += `-- ${tableName}: 0 rows (skipping)\n\n`;
          tableStats[tableName] = 0;
          continue;
        }

        tableStats[tableName] = rows.length;
        totalRows += rows.length;
        
        sqlOutput += `-- ${tableName}: ${rows.length} rows\n`;
        sqlOutput += `DELETE FROM ${tableName}; -- Clear existing data if any\n`;

        // Generate INSERT statements
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return "NULL";
            if (typeof val === "string") {
              // Escape single quotes
              return "'" + val.replace(/'/g, "''") + "'";
            }
            if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
            if (typeof val === "object") {
              // Handle JSON/JSONB columns
              return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
            }
            return val;
          });

          sqlOutput += `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
        }

        sqlOutput += "\n";
      } catch (err) {
        console.error(`Exception exporting ${tableName}:`, err);
        sqlOutput += `-- EXCEPTION exporting ${tableName}: ${err.message}\n\n`;
      }
    }

    sqlOutput += "-- Re-enable triggers\n";
    sqlOutput += "SET session_replication_role = DEFAULT;\n\n";
    sqlOutput += `-- Export complete. Total rows: ${totalRows}\n`;
    sqlOutput += "-- Table breakdown:\n";
    for (const [table, count] of Object.entries(tableStats)) {
      sqlOutput += `--   ${table}: ${count}\n`;
    }

    return new Response(sqlOutput, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="missing-data-export-${Date.now()}.sql"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
