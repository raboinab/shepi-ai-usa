import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// In-memory cache: survives across invocations within the same Deno isolate
const responseCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SK");
    if (!stripeKey) throw new Error("STRIPE_SK is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header");
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication error", { message: userError.message });
      return new Response(JSON.stringify({ error: "Authentication error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("User not authenticated or email not available");
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check in-memory cache
    const cached = responseCache.get(user.id);
    if (cached && Date.now() < cached.expiresAt) {
      logStep("Cache hit, returning cached response", { userId: user.id });
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Helper: fetch shared projects for user (viewer or editor shares)
    const getSharedProjects = async (): Promise<string[]> => {
      const { data } = await supabaseClient
        .from('project_shares')
        .select('project_id')
        .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email!.toLowerCase()}`);
      return (data || []).map(s => s.project_id);
    };

    // Helper: fetch project credits from DB
    const getUserCredits = async (): Promise<{ credits_remaining: number; total_credits_purchased: number }> => {
      const { data } = await supabaseClient
        .from('user_credits')
        .select('credits_remaining, total_credits_purchased')
        .eq('user_id', user.id)
        .single();
      return {
        credits_remaining: data?.credits_remaining ?? 0,
        total_credits_purchased: data?.total_credits_purchased ?? 0,
      };
    };

    // Check whitelist from database before any Stripe calls
    const { data: whitelistEntry } = await supabaseClient
      .from('whitelisted_users')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .single();

    if (whitelistEntry) {
      logStep("User is whitelisted, granting full access");
      const sharedProjects = await getSharedProjects();
      const result = {
        subscribed: true,
        hasActiveSubscription: true,
        subscriptionEnd: null,
        paidProjects: [],
        projectCredits: 0,
        sharedProjects,
        activeProjectCount: 0,
        monthlyProjectLimit: 999,
      };
      responseCache.set(user.id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, checking database for project payments and credits");
      
      const now = new Date().toISOString();
      const [dbPaymentsResult, creditFundedResult, userCredits, sharedProjects] = await Promise.all([
        supabaseClient
          .from("project_payments")
          .select("project_id, expires_at")
          .eq("user_id", user.id)
          .eq("status", "paid"),
        supabaseClient
          .from("projects")
          .select("id, credit_expires_at")
          .eq("user_id", user.id)
          .eq("funded_by_credit", true),
        getUserCredits(),
        getSharedProjects(),
      ]);
      const projectCredits = userCredits.credits_remaining;
      
      // Grandfather: if expires_at is null, treat as non-expiring (legacy)
      const paidProjects = (dbPaymentsResult.data || [])
        .filter(p => !p.expires_at || p.expires_at > now)
        .map(p => p.project_id);

      // Add credit-funded projects that haven't expired (null = non-expiring legacy)
      for (const p of (creditFundedResult.data || [])) {
        if (!p.credit_expires_at || p.credit_expires_at > now) {
          if (!paidProjects.includes(p.id)) paidProjects.push(p.id);
        }
      }

      logStep("Database project payments found", { count: paidProjects.length, projectCredits });
      
      const result = { 
        subscribed: false, 
        hasActiveSubscription: false,
        paidProjects,
        projectCredits,
        sharedProjects,
        activeProjectCount: 0,
        monthlyProjectLimit: 3,
      };
      responseCache.set(user.id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSubscription = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSubscription) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
    }

    // Check for completed one-time payments (per-project) + project credits in parallel
    // Primary source of truth: DB project_payments (has expires_at)
    // Stripe API scan used as supplemental fallback for older records
    const now = new Date().toISOString();
    const [payments, sessions, dbPayments, creditFundedProjects, userCredits, sharedProjects] = await Promise.all([
      stripe.paymentIntents.list({ customer: customerId, limit: 100 }),
      stripe.checkout.sessions.list({ customer: customerId, status: "complete", limit: 100 }),
      supabaseClient
        .from("project_payments")
        .select("project_id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "paid"),
      supabaseClient
        .from("projects")
        .select("id, credit_expires_at")
        .eq("user_id", user.id)
        .eq("funded_by_credit", true),
      getUserCredits(),
      getSharedProjects(),
    ]);

    const projectCredits = userCredits.credits_remaining;
    const totalCreditsPurchased = userCredits.total_credits_purchased;
    const paidProjects: string[] = [];

    // DB project_payments — primary source with expiry enforcement
    for (const p of (dbPayments.data || [])) {
      if (!p.expires_at || p.expires_at > now) {
        if (!paidProjects.includes(p.project_id)) paidProjects.push(p.project_id);
      }
    }

    // Credit-funded projects — enforce credit_expires_at
    for (const p of (creditFundedProjects.data || [])) {
      if (!p.credit_expires_at || p.credit_expires_at > now) {
        if (!paidProjects.includes(p.id)) paidProjects.push(p.id);
      }
    }

    // Stripe fallback for records not yet in DB (e.g. webhook delay)
    for (const payment of payments.data) {
      if (payment.status === "succeeded" && payment.metadata?.project_id) {
        if (!paidProjects.includes(payment.metadata.project_id)) {
          paidProjects.push(payment.metadata.project_id);
        }
      }
    }

    // Count all per_project sessions (with and without project_id)
    let creditSessionCount = 0;
    for (const session of sessions.data) {
      if (session.metadata?.plan_type === "per_project") {
        if (session.metadata?.project_id) {
          if (!paidProjects.includes(session.metadata.project_id)) {
            paidProjects.push(session.metadata.project_id);
          }
        } else {
          creditSessionCount++;
        }
      }
    }

    // Self-healing: compare Stripe sessions against total_credits_purchased (immutable counter)
    // Only grant credits if Stripe shows more purchases than we've ever recorded
    let updatedProjectCredits = projectCredits;

    if (creditSessionCount > totalCreditsPurchased) {
      const shortfall = creditSessionCount - totalCreditsPurchased;
      const newCredits = projectCredits + shortfall;
      const newPurchased = totalCreditsPurchased + shortfall;
      logStep("Self-healing: granting missing credits", { creditSessionCount, totalCreditsPurchased, shortfall, newCredits });

      await supabaseClient
        .from("user_credits")
        .upsert({ user_id: user.id, credits_remaining: newCredits, total_credits_purchased: newPurchased }, { onConflict: "user_id" });

      updatedProjectCredits = newCredits;
    }

    // Count active (non-credit-funded) projects owned by this user for monthly limit enforcement
    const { count: ownedProjectCount } = await supabaseClient
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("funded_by_credit", false);

    const activeProjectCount = ownedProjectCount ?? 0;

    logStep("Final result", { paidProjects: paidProjects.length, projectCredits: updatedProjectCredits, hasActiveSubscription, activeProjectCount });

    const result = {
      subscribed: hasActiveSubscription,
      hasActiveSubscription,
      subscriptionEnd,
      paidProjects,
      projectCredits: updatedProjectCredits,
      sharedProjects,
      activeProjectCount,
      monthlyProjectLimit: 3,
    };
    responseCache.set(user.id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return new Response(JSON.stringify(result), {
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
