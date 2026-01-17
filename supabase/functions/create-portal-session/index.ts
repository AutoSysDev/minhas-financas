import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:4173";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20" });
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const user = userData.user;
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (error || !sub?.stripe_customer_id) return new Response(JSON.stringify({ error: "No customer" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const origin = req.headers.get("origin") || APP_URL;
    const session = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${origin}/#/settings` });
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Failed to create portal session" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
