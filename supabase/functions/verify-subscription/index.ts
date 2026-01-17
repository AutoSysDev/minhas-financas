import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@15.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables.");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 1. Authenticate User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get Customer ID from DB
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      // No customer ID means no subscription
      // Ensure profiles is false
      await supabaseAdmin.from("profiles").upsert({
        user_id: user.id,
        is_premium: false,
        updated_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({ isPremium: false, message: "No subscription record found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = subscription.stripe_customer_id;

    // 3. Fetch Subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    // 4. Determine Status
    // We consider 'active' or 'trialing' as premium.
    const activeSub = subscriptions.data.find(
      (sub: any) => sub.status === 'active' || sub.status === 'trialing'
    );

    const isPremium = !!activeSub;

    // 5. Update Database
    if (activeSub) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: activeSub.id,
        status: activeSub.status,
        current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } else {
      // If no active subscription found, update status to canceled or whatever the last one was
      // Or just update profiles.
      // Let's find the most recent one to update status if possible
      const mostRecent = subscriptions.data[0];
      if (mostRecent) {
        await supabaseAdmin.from("subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: mostRecent.id,
          status: mostRecent.status,
          current_period_end: new Date(mostRecent.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
      }
    }

    await supabaseAdmin.from("profiles").upsert({
      user_id: user.id,
      is_premium: isPremium,
      updated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      isPremium,
      status: activeSub?.status || 'inactive',
      message: "Subscription status verified and synced"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error verifying subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
