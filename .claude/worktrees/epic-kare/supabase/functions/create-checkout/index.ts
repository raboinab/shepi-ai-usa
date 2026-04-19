import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ⚠️ STRIPE ACTION REQUIRED:
// 1. Create new Stripe Prices:
//    - $2,000 one-time  (Per Project)       → replace MONTHLY_PRICE_ID
//    - $4,000 recurring monthly             → replace PER_PROJECT_PRICE_ID
//    - $3,500 one-time  (Done-For-You)      → add DFY_PRICE_ID when ready
// 2. Archive previous $1,000 / $5,000 Stripe prices (do NOT delete for historical invoices).
// 3. Confirm webhook handling for new price IDs.
const MONTHLY_PRICE_ID = "price_1T35qZP5elf35CKlO3JJ0NsM";       // TODO: replace with $4,000/mo price
const PER_PROJECT_PRICE_ID = "price_1T35qSP5elf35CKlyrWw4lwb";    // TODO: replace with $2,000 one-time price
const MONTHLY_OVERAGE_PRICE_ID = "price_1T5upBP5elf35CKlGmuXJwkt"; // $1,000 one-time overage slot

// Promo codes blocked for monthly plan (case-insensitive check)
const MONTHLY_BLOCKED_CODES = ["BETA100"];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started (v3 – 2026-02-21)");

    const stripeKey = Deno.env.get("STRIPE_SK");
    if (!stripeKey) throw new Error("STRIPE_SK is not configured");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header");
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication error", { message: userError.message });
      return new Response(JSON.stringify({ error: "Authentication error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = data.user;
    if (!user?.email) {
      logStep("User not authenticated or email not available");
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType, projectId, promoCode } = await req.json();
    logStep("Request body", { planType, projectId });

    if (!planType || !["monthly", "per_project", "monthly_overage"].includes(planType)) {
      throw new Error("Invalid plan type. Must be 'monthly', 'per_project', or 'monthly_overage'");
    }

    // NOTE: projectId is optional for per_project — when absent, the webhook
    // grants a user_credits row so the user can create a project later.

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const priceId = planType === "monthly" ? MONTHLY_PRICE_ID : planType === "monthly_overage" ? MONTHLY_OVERAGE_PRICE_ID : PER_PROJECT_PRICE_ID;
    const mode = planType === "monthly" ? "subscription" : "payment";

    const metadata: Record<string, string> = {
      user_id: user.id,
      plan_type: planType,
    };
    if (projectId) {
      metadata.project_id = projectId;
    }

    // Determine the origin — fallback to production URL if header is missing
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "https://shepi.ai";
    logStep("Origin resolved", { origin });

    // Server-side promo code validation for monthly plans
    let discounts: { promotion_code: string }[] | undefined;
    if (planType === "monthly" && promoCode) {
      const upperCode = promoCode.trim().toUpperCase();
      logStep("Validating promo code for monthly", { code: upperCode });

      if (MONTHLY_BLOCKED_CODES.includes(upperCode)) {
        logStep("Blocked promo code attempted", { code: upperCode });
        return new Response(JSON.stringify({ error: "This promo code is not valid for the monthly plan" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const promos = await stripe.promotionCodes.list({ code: promoCode.trim(), active: true, limit: 1 });
      if (promos.data.length === 0) {
        logStep("Invalid promo code", { code: promoCode });
        return new Response(JSON.stringify({ error: "Invalid promo code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      discounts = [{ promotion_code: promos.data[0].id }];
      logStep("Promo code validated", { promoId: promos.data[0].id });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      // customer_creation is only valid in payment mode, not subscription
      ...(mode === "payment" && !customerId ? { customer_creation: "always" } : {}),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      // per_project: Stripe's built-in promo UI; monthly: server-validated discounts; overage: none
      ...(planType === "per_project" ? { allow_promotion_codes: true } : {}),
      ...(discounts ? { discounts } : {}),
      success_url: `${origin}/payment-success?plan=${planType}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
