import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@15.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Validate Environment Variables
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:4173";

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables.");
      throw new Error("Server configuration error: Missing environment variables.");
    }

    // 3. Initialize Stripe & Supabase
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Authenticate User
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.warn("Unauthorized access attempt:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Parse Request Body
    const body = await req.json().catch(() => ({}));
    if (!body || !body.plan) {
      return new Response(JSON.stringify({ error: "Missing 'plan' in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, skipTrial, uiMode } = body;
    const origin = req.headers.get("origin") || APP_URL;

    // 6. Fetch Plans from DB (Using Service Role for Admin Access)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("app_settings")
      .select("*")
      .eq("key", "stripe")
      .maybeSingle();

    if (settingsError || !settings) {
      console.error("Failed to fetch app_settings:", settingsError);
      throw new Error("Stripe settings not configured in database.");
    }

    let priceId: string | undefined;
    if (plan === "monthly") priceId = settings.stripe_price_monthly_id;
    else if (plan === "yearly") priceId = settings.stripe_price_yearly_id;

    if (!priceId) {
      console.error(`Price ID not found for plan: ${plan}`);
      return new Response(JSON.stringify({ error: "Invalid plan or price not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Get or Create Stripe Customer
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;
    let customerValid = false;

    // Verify existing customer in Stripe
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) {
          customerValid = true;
        }
      } catch (error) {
        console.warn(`Could not retrieve customer ${customerId}, creating new one. Error:`, error);
      }
    }

    // Create new customer if missing or invalid
    if (!customerValid) {
      console.log(`Creating new Stripe customer for user ${user.id}`);
      try {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = newCustomer.id;

        // Save new customer ID to DB
        const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Failed to save new customer ID:", upsertError);
          // Continue anyway, checkout will work but next time we might create another customer
        }
      } catch (stripeError: any) {
        console.error("Failed to create Stripe customer:", stripeError);
        throw new Error("Failed to create billing profile.");
      }
    }

    // 8. Configure Session
    const sessionConfig: any = {
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: user.id }
      }
    };

    if (uiMode === 'embedded') {
      sessionConfig.ui_mode = 'embedded';
      sessionConfig.return_url = `${origin}/#/settings?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionConfig.success_url = `${origin}/#/settings?subscribe=success`;
      sessionConfig.cancel_url = `${origin}/#/settings?subscribe=cancel`;
    }

    // 9. Handle Trial Logic
    // If skipTrial is false, we try to apply a 3-day trial.
    // Note: If the Price in Stripe ALREADY has a trial, Stripe uses that.
    // Setting trial_period_days overrides the Price's default trial.
    if (!skipTrial) {
      sessionConfig.subscription_data!.trial_period_days = 3;
    }

    console.log(`Creating checkout session. Customer: ${customerId}, Plan: ${plan}, Trial: ${!skipTrial}`);

    // 10. Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (uiMode === 'embedded' && session.client_secret) {
      return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!session.url) {
      throw new Error("Stripe failed to return a checkout URL.");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    // Return structured error response
    return new Response(JSON.stringify({
      error: error.message || "Internal Server Error",
      details: error.code ? `Stripe Error: ${error.code}` : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
