import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@15.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
  throw new Error("Server configuration error: Missing environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient() });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature") || "";
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET);
  } catch (_err) {
    console.error(`Webhook signature verification failed.`, _err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const customerId = session.customer as string;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;

        const { data: rows } = await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).limit(1);
        const userId = rows?.[0]?.user_id;

        if (userId) {
          const updateData: any = {
            stripe_customer_id: customerId,
            status: "active",
            updated_at: new Date().toISOString()
          };

          if (subscriptionId) updateData.stripe_subscription_id = subscriptionId;

          await supabase.from("subscriptions").upsert({
            user_id: userId,
            ...updateData
          }, { onConflict: "user_id" });

          await supabase.from("profiles").upsert({
            user_id: userId,
            is_premium: true,
            updated_at: new Date().toISOString()
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as any;
        const customerId = sub.customer as string;
        const status = sub.status;
        const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

        const { data: rows } = await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).limit(1);
        const userId = rows?.[0]?.user_id;

        if (userId) {
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            status,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });

          await supabase.from("profiles").upsert({
            user_id: userId,
            is_premium: status === "active" || status === "trialing",
            updated_at: new Date().toISOString()
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer as string;
        const { data: rows } = await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).limit(1);
        const userId = rows?.[0]?.user_id;

        if (userId) {
          await supabase.from("subscriptions").update({
            status: "canceled",
            updated_at: new Date().toISOString()
          }).eq("user_id", userId);

          await supabase.from("profiles").upsert({
            user_id: userId,
            is_premium: false,
            updated_at: new Date().toISOString()
          });
        }
        break;
      }
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("error", { status: 500 });
  }
});
