import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Mirror of src/lib/pricing.ts — keep in sync when prices change.
// Stripe LIVE price IDs – validated 2026-03-01.
const PRICING = {
  perProject:     { amount: 2000, stripePriceId: "price_1T5toZP5elf35CKlGuxS6JKU" },
  doneForYou:     { amount: 4000, stripePriceId: "price_1TO31eP5elf35CKlvFWoVrUk" },
  monthly:        { amount: 5000, stripePriceId: "price_1TO33aP5elf35CKlC4eFMpm2" },
  monthlyOverage: { amount: 1000, stripePriceId: "price_1T6FKzP5elf35CKl5F1XyETh" },
} as const;

const DFY_UPGRADE_DELTA_CENTS = (PRICING.doneForYou.amount - PRICING.perProject.amount) * 100;
const DFY_UPGRADE_CREDIT_DOLLARS = String(PRICING.perProject.amount);

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

    if (!planType || !["monthly", "per_project", "monthly_overage", "done_for_you"].includes(planType)) {
      throw new Error("Invalid plan type. Must be 'monthly', 'per_project', 'monthly_overage', or 'done_for_you'");
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

    // Detect DFY upgrade: project already paid via per_project (or funded by monthly credit) → charge delta only
    let isUpgrade = false;
    let upgradeFromTier: string | null = null;
    if (planType === "done_for_you" && projectId) {
      const { data: project } = await supabaseClient
        .from("projects")
        .select("service_tier, funded_by_credit")
        .eq("id", projectId)
        .maybeSingle();

      if (project && project.service_tier !== "done_for_you") {
        // Check if project has a paid per_project payment OR was funded by a monthly credit
        const { data: payment } = await supabaseClient
          .from("project_payments")
          .select("status, amount")
          .eq("project_id", projectId)
          .eq("status", "paid")
          .maybeSingle();

        if (payment || project.funded_by_credit) {
          isUpgrade = true;
          upgradeFromTier = project.funded_by_credit ? "monthly_credit" : "per_project";
          logStep("DFY upgrade detected", { projectId, upgradeFromTier, paidAmount: payment?.amount });
        }
      }
    }

    const priceId = planType === "monthly" ? PRICING.monthly.stripePriceId : planType === "monthly_overage" ? PRICING.monthlyOverage.stripePriceId : planType === "done_for_you" ? PRICING.doneForYou.stripePriceId : PRICING.perProject.stripePriceId;
    const mode = planType === "monthly" ? "subscription" : "payment";

    const metadata: Record<string, string> = {
      user_id: user.id,
      plan_type: planType,
    };
    if (projectId) {
      metadata.project_id = projectId;
    }
    if (isUpgrade) {
      metadata.upgrade_from = upgradeFromTier!;
      metadata.credit_applied = DFY_UPGRADE_CREDIT_DOLLARS;
    }

    // Build line items: use price_data for upgrade delta, otherwise standard price ID
    const lineItems = isUpgrade
      ? [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Done-For-You Upgrade",
              description: `Upgrade existing project to Done-For-You ($${DFY_UPGRADE_CREDIT_DOLLARS} credit applied from prior payment)`,
            },
            unit_amount: DFY_UPGRADE_DELTA_CENTS,
          },
          quantity: 1,
        }]
      : [{ price: priceId, quantity: 1 }];

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
      line_items: lineItems,
      mode: mode,
      // per_project: Stripe's built-in promo UI; monthly: server-validated discounts; overage/upgrade: none
      ...((planType === "per_project" || (planType === "done_for_you" && !isUpgrade)) ? { allow_promotion_codes: true } : {}),
      ...(discounts ? { discounts } : {}),
      success_url: planType === "done_for_you" && projectId
        ? `${origin}/project/${projectId}?upgraded=true`
        : `${origin}/payment-success?plan=${planType}`,
      cancel_url: planType === "done_for_you" && projectId
        ? `${origin}/project/${projectId}`
        : `${origin}/pricing?payment=cancelled`,
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
