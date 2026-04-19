import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_COUNTRIES = new Set(["US", "AU", "NZ", "GB", "PH", "CA", "MX"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer Cloudflare's built-in country header (no external API call needed)
    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      "";

    if (!country) {
      // No country header available — fail open
      console.log("Geo-check: no country header found, failing open");
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upperCountry = country.trim().toUpperCase();
    const allowed = ALLOWED_COUNTRIES.has(upperCountry);

    console.log(`Geo-check: country=${upperCountry}, allowed=${allowed}`);

    return new Response(JSON.stringify({ allowed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Any error — fail open
    console.error("Geo-check error:", err);
    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
