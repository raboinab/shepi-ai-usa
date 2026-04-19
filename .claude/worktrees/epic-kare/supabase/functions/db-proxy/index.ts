import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Connection": "keep-alive",
  "Keep-Alive": "timeout=120, max=100",
};

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests as health check (allows warming up the edge function)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`[db-proxy] Incoming ${req.method} request, content-length: ${req.headers.get('content-length') || 'unknown'}`);

    // Verify API key authentication - support multiple service-specific keys
    const apiKey = req.headers.get("x-api-key");
    const serviceName = req.headers.get("x-service-name") || "unknown-service";

    // Support multiple service-specific API keys
  const validApiKeys = [
    Deno.env.get("QB_AUTH_API_KEY"),
    Deno.env.get("SHEPI_SHEETS_API_KEY"),
    Deno.env.get("DOCUCLIPPER_API_KEY"),
    Deno.env.get("QBTOJSON_API_KEY"),
    Deno.env.get("QUICKBOOKS_API_KEY"),
  ].filter(Boolean) as string[];

  if (validApiKeys.length === 0) {
    console.error("No API keys configured - check QB_AUTH_API_KEY, SHEPI_SHEETS_API_KEY, DOCUCLIPPER_API_KEY, or QBTOJSON_API_KEY");
      return new Response(
        JSON.stringify({ error: "Configuration Error", message: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey || !validApiKeys.includes(apiKey)) {
      console.error(`[${serviceName}] Unauthorized: Invalid or missing API key`);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${serviceName}] Authenticated successfully with valid API key`);

    // Parse request body
    const body = await req.json();
    const { action } = body;

    console.log(`[${serviceName}] Request: action=${action}`);

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Missing 'action' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for full database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Configuration Error", message: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different actions
    switch (action) {
      case "query": {
        // Support both 'select' and 'columns' keys for backward compatibility with Java service
        const { table, operation, filters, data, select, columns, order, limit, offset } = body;
        const selectColumns = select || columns || "*";
        
        console.log(`[${serviceName}] Query: ${operation} on ${table}`, { 
          filters: filters ? Object.keys(filters) : null,
          hasData: !!data,
          select: selectColumns
        });

        if (!table || !operation) {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "Missing 'table' or 'operation'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build query based on operation - use any to avoid complex type issues
        let query: any;
        const tableRef = supabase.from(table);

        // Handle operations
        switch (operation) {
          case "select":
            query = tableRef.select(selectColumns);
            break;
          
          case "insert":
            if (!data) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Data required for insert" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            query = tableRef.insert(data).select();
            break;
          
          case "update":
            if (!data) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Data required for update" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            query = tableRef.update(data).select();
            break;
          
          case "delete":
            query = tableRef.delete();
            break;
          
          case "upsert":
            if (!data) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Data required for upsert" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            query = tableRef.upsert(data).select();
            break;
          
          default:
            return new Response(
              JSON.stringify({ 
                error: "Bad Request", 
                message: `Invalid operation: ${operation}. Valid: select, insert, update, delete, upsert` 
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Apply filters
        if (filters && typeof filters === 'object') {
          for (const [key, value] of Object.entries(filters)) {
            if (value === null) {
              query = query.is(key, null);
            } else if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value !== null) {
              // Support advanced filters like {operator: 'gt', value: 10}
              const { operator, value: filterValue } = value as { operator: string; value: any };
              switch (operator) {
                case 'gt': query = query.gt(key, filterValue); break;
                case 'gte': query = query.gte(key, filterValue); break;
                case 'lt': query = query.lt(key, filterValue); break;
                case 'lte': query = query.lte(key, filterValue); break;
                case 'neq': query = query.neq(key, filterValue); break;
                case 'like': query = query.like(key, filterValue); break;
                case 'ilike': query = query.ilike(key, filterValue); break;
                default: query = query.eq(key, value);
              }
            } else {
              query = query.eq(key, value);
            }
          }
        }

        // Apply ordering
        if (order && typeof order === 'object') {
          const { column, ascending = true } = order as { column: string; ascending?: boolean };
          query = query.order(column, { ascending });
        }

        // Apply limit
        if (typeof limit === 'number') {
          query = query.limit(limit);
        }

        // Apply offset
        if (typeof offset === 'number') {
          query = query.range(offset, offset + (limit || 100) - 1);
        }

        const { data: result, error, count } = await query;

        if (error) {
          console.error(`[${serviceName}] Query error:`, error);
          return new Response(
            JSON.stringify({ error: "Database Error", message: error.message, details: error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const duration = Date.now() - startTime;
        console.log(`[${serviceName}] Success: ${Array.isArray(result) ? result.length : 'single'} record(s) in ${duration}ms`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: result,
            count: count !== null ? count : (Array.isArray(result) ? result.length : null)
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "rpc": {
        // Call stored procedures/functions
        const { function_name, params } = body;
        
        if (!function_name) {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "Missing 'function_name'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[${serviceName}] RPC: ${function_name}`, params);

        const { data: result, error } = await supabase.rpc(function_name, params || {});

        if (error) {
          console.error(`[${serviceName}] RPC error:`, error);
          return new Response(
            JSON.stringify({ error: "Database Error", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const duration = Date.now() - startTime;
        console.log(`[${serviceName}] RPC success in ${duration}ms`);
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "storage": {
        // Handle Supabase Storage operations
        const { operation, bucket, path, content, content_type, options } = body;
        
        console.log(`[${serviceName}] Storage: ${operation} on ${bucket}/${path || ''}`);
        
        if (!bucket) {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "Missing 'bucket'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        switch (operation) {
          case "get_signed_url": {
            if (!path) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Missing 'path'" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            const expiresIn = options?.expires_in || 3600;
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(path, expiresIn);
            
            if (error) {
              console.error(`[${serviceName}] Storage error:`, error);
              return new Response(
                JSON.stringify({ error: "Storage Error", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            console.log(`[${serviceName}] Signed URL created, expires in ${expiresIn}s`);
            return new Response(
              JSON.stringify({ 
                success: true, 
                signed_url: data.signedUrl,
                expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          case "upload": {
            if (!path || !content) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Missing 'path' or 'content'" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            // Decode base64 content
            const fileContent = Uint8Array.from(atob(content), c => c.charCodeAt(0));
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(path, fileContent, {
                contentType: content_type || 'application/octet-stream',
                upsert: options?.upsert || false
              });
            
            if (error) {
              console.error(`[${serviceName}] Upload error:`, error);
              return new Response(
                JSON.stringify({ error: "Storage Error", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            console.log(`[${serviceName}] File uploaded successfully: ${data.path}`);
            return new Response(
              JSON.stringify({ success: true, path: data.path }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          case "list": {
            const { data, error } = await supabase.storage
              .from(bucket)
              .list(path || '', {
                limit: options?.limit || 100,
                offset: options?.offset || 0
              });
            
            if (error) {
              console.error(`[${serviceName}] List error:`, error);
              return new Response(
                JSON.stringify({ error: "Storage Error", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            console.log(`[${serviceName}] Listed ${data.length} files`);
            return new Response(
              JSON.stringify({ success: true, files: data }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          case "delete": {
            if (!path) {
              return new Response(
                JSON.stringify({ error: "Bad Request", message: "Missing 'path'" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            const { error } = await supabase.storage
              .from(bucket)
              .remove([path]);
            
            if (error) {
              console.error(`[${serviceName}] Delete error:`, error);
              return new Response(
                JSON.stringify({ error: "Storage Error", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            console.log(`[${serviceName}] File deleted: ${path}`);
            return new Response(
              JSON.stringify({ success: true, message: "File deleted" }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          default:
            return new Response(
              JSON.stringify({ 
                error: "Bad Request", 
                message: `Invalid storage operation: ${operation}. Valid: get_signed_url, upload, list, delete` 
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: "Bad Request", 
            message: `Unknown action: ${action}. Valid actions: query, rpc, storage` 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Unexpected error in db-proxy:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});