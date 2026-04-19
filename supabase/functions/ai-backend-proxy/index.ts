import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BACKEND_URL = Deno.env.get("DISCOVERY_SERVICE_URL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Endpoint = "classify" | "classify-status" | "reclassify" | "reclassify-status";

const ROUTE_MAP: Record<Endpoint, { method: string; path: (p: Record<string, string>) => string }> = {
  classify: {
    method: "POST",
    path: () => "/api/v1/classify",
  },
  "classify-status": {
    method: "GET",
    path: (p) => `/api/v1/classify/status/${p.project_id}`,
  },
  reclassify: {
    method: "POST",
    path: () => "/api/v1/reclassification/analyze",
  },
  "reclassify-status": {
    method: "GET",
    path: (p) => `/api/v1/reclassification/jobs/${p.job_id}`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, payload } = (await req.json()) as {
      endpoint: Endpoint;
      payload: Record<string, string>;
    };

    const route = ROUTE_MAP[endpoint];
    if (!route) {
      return new Response(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate the caller via JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build backend request
    const backendPath = route.path(payload);
    let backendResponse: Response;

    if (route.method === "POST") {
      backendResponse = await fetch(`${BACKEND_URL}${backendPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          user_id: user.id,
          supabase_url: SUPABASE_URL,
          supabase_service_role_key: SERVICE_ROLE_KEY,
        }),
      });
    } else {
      // GET — pass credentials as query params
      const params = new URLSearchParams({
        supabase_url: SUPABASE_URL,
        supabase_service_role_key: SERVICE_ROLE_KEY,
      });
      backendResponse = await fetch(`${BACKEND_URL}${backendPath}?${params}`);
    }

    const responseBody = await backendResponse.text();

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-backend-proxy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Proxy error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
