import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

function safeTimestamp(value: unknown): string | null {
  if (typeof value === "number" && value > 0) {
    return new Date(value * 1000).toISOString();
  }
  return null;
}

function normalizePlanType(_subscription: Stripe.Subscription): string {
  // All current subscriptions are monthly recurring plans.
  // When adding annual/team plans, map by price or product ID here.
  return "monthly";
}

function normalizeSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return "inactive";
  }
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") return val.toString();
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  });
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string" && e.message.length > 0) {
      return e.message;
    }
    try {
      return safeStringify(error);
    } catch {
      // ignore
    }
  }
  return String(error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SK");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SK or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-12-15.clover" });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("ERROR", { message: "No stripe-signature header" });
      return new Response(JSON.stringify({ error: "No signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("ERROR", { message: `Webhook signature verification failed: ${message}` });
      return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id, mode: session.mode });

        const metadataUserId = session.metadata?.user_id;
        let userId = metadataUserId ?? null;

        if (!userId) {
          const customerEmail = session.customer_email || session.customer_details?.email;
          if (!customerEmail) {
            logStep("WARNING", { message: "No customer email in session and no metadata user_id" });
            break;
          }

          // Fallback: find user by email
          const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (userError) {
            logStep("ERROR", { message: `Failed to list users: ${userError.message}` });
            break;
          }

          const user = users.users.find(u => u.email === customerEmail);
          if (!user) {
            logStep("WARNING", { message: `No user found for email: ${customerEmail}` });
            break;
          }

          userId = user.id;
        }

        if (session.mode === "subscription") {
          // Handle subscription checkout
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          await upsertSubscription(supabaseClient, userId, session.customer as string, subscription);
          logStep("Subscription created/updated", { userId, subscriptionId });
        } else if (session.mode === "payment") {
          const projectId = session.metadata?.project_id;
          const planType = session.metadata?.plan_type;

        if (projectId) {
            // Per-project payment for a specific existing project
            const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
            const { error: paymentError } = await supabaseClient
              .from("project_payments")
                .upsert({
                  user_id: userId,
                  project_id: projectId,
                  amount: session.amount_total || 0,
                  status: "paid",
                stripe_payment_intent_id: session.payment_intent as string,
                paid_at: new Date().toISOString(),
                expires_at: expiresAt,
              }, { onConflict: "project_id,user_id" });

            if (paymentError) {
              logStep("ERROR", { message: `Failed to record project payment: ${paymentError.message}` });
            } else {
              logStep("Project payment recorded", { userId, projectId });
            }
          } else if (planType === "per_project" || planType === "monthly_overage") {
            // Per-project payment or monthly overage — grant a credit
            logStep(`${planType} payment without project_id — granting credit`, { userId });
            
            // Always fetch current value first to avoid resetting on conflict
            const { data: existingCredits } = await supabaseClient
              .from("user_credits")
              .select("credits_remaining, total_credits_purchased")
              .eq("user_id", userId)
              .single();

            const currentCredits = existingCredits?.credits_remaining ?? 0;
            const currentPurchased = existingCredits?.total_credits_purchased ?? 0;
            const newCredits = currentCredits + 1;
            const newPurchased = currentPurchased + 1;

            const { error: creditError } = await supabaseClient
              .from("user_credits")
              .upsert({ user_id: userId, credits_remaining: newCredits, total_credits_purchased: newPurchased }, { onConflict: "user_id" });

            if (creditError) {
              logStep("ERROR granting credit", { error: creditError.message });
            } else {
              logStep("Project credit granted", { userId, newCredits, planType });
            }
          }
        }
        // --- Early adopter spot decrement ---
        try {
          const sessionExpanded = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["total_details.breakdown"],
          });
          const discounts = (sessionExpanded as any).total_details?.breakdown?.discounts;
          if (discounts && Array.isArray(discounts)) {
            for (const d of discounts) {
              const promoCodeId = d.discount?.promotion_code;
              if (promoCodeId && typeof promoCodeId === "string") {
                const promoCode = await stripe.promotionCodes.retrieve(promoCodeId);
                const codeName = promoCode.code?.toUpperCase();
                if (codeName === "EARLY250" || codeName === "EARLY2500" || codeName === "EARLY50") {
                  logStep("Early adopter promo code used", { code: codeName });
                  const { data: current } = await supabaseClient
                    .from("promo_config" as any)
                    .select("value")
                    .eq("key", "early_adopter_spots")
                    .single();
                  if (current) {
                    const newVal = Math.max(0, ((current as any).value as number) - 1);
                    await supabaseClient
                      .from("promo_config" as any)
                      .update({ value: newVal } as any)
                      .eq("key", "early_adopter_spots");
                    logStep("Early adopter spots decremented", { remaining: newVal });
                  }
                  break; // Only decrement once per checkout
                }
              }
            }
          }
        } catch (promoErr) {
          logStep("WARNING", { message: `Failed to check promo code: ${serializeError(promoErr)}` });
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription event", { type: event.type, subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          logStep("WARNING", { message: "Customer was deleted" });
          break;
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("WARNING", { message: "No email on customer" });
          break;
        }

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users.find(u => u.email === customerEmail);
        
        if (!user) {
          logStep("WARNING", { message: `No user found for email: ${customerEmail}` });
          break;
        }

        await upsertSubscription(supabaseClient, user.id, subscription.customer as string, subscription);
        logStep("Subscription upserted", { userId: user.id, status: subscription.status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from("subscriptions")
          .update({ status: normalizeSubscriptionStatus("canceled") })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("ERROR", { message: `Failed to update subscription: ${error.message}` });
        } else {
          logStep("Subscription marked as canceled");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          const { error } = await supabaseClient
            .from("subscriptions")
            .update({
              status: normalizeSubscriptionStatus(subscription.status),
              current_period_start: safeTimestamp(subscription.current_period_start),
              current_period_end: safeTimestamp(subscription.current_period_end),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (error) {
            logStep("ERROR", { message: `Failed to update subscription period: ${error.message}` });
          } else {
            logStep("Subscription period updated");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from("subscriptions")
            .update({ status: normalizeSubscriptionStatus("past_due") })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            logStep("ERROR", { message: `Failed to update subscription status: ${error.message}` });
          } else {
            logStep("Subscription marked as past_due");
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = serializeError(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function upsertSubscription(
  supabase: any,
  userId: string,
  stripeCustomerId: string,
  subscription: Stripe.Subscription
) {
  const planType = normalizePlanType(subscription);
  
  const periodStart = safeTimestamp(subscription.current_period_start);
  const periodEnd = safeTimestamp(subscription.current_period_end);
  
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      status: normalizeSubscriptionStatus(subscription.status),
      plan_type: planType,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    }, { onConflict: "user_id" });

  if (error) {
    logStep("ERROR", { message: `Failed to upsert subscription: ${serializeError(error)}`, code: (error as any).code, constraint: (error as any).constraint });
    return;
  }
}
