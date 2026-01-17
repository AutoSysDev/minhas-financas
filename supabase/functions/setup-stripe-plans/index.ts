import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@15.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || '').split(',').map(s => s.trim()).filter(Boolean);

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
  throw new Error("Server configuration error: Missing environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient() });
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace('Bearer ', '');
  const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY;

  const supabaseUser = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData } = await supabaseUser.auth.getUser();
  const userRole = userData?.user?.role;
  const userEmail = userData?.user?.email || '';

  if (!isServiceRole && userRole !== 'service_role' && (!userEmail || (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes(userEmail)))) {
    return new Response(JSON.stringify({ error: 'Forbidden', debug_role: userRole, debug_email: userEmail }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const currency = (body.currency || 'BRL').toUpperCase();
    const amountMonthly = Number(body.amountMonthly ?? 1599);
    const amountYearly = Number(body.amountYearly ?? 9990);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing } = await supabase.from('app_settings').select('*').eq('key', 'stripe').maybeSingle();
    let productId = existing?.stripe_product_id as string | undefined;

    if (productId) {
      try {
        await stripe.products.retrieve(productId);
      } catch (e) {
        console.log(`Product ${productId} not found in Stripe, creating new one.`);
        productId = undefined;
      }
    }

    if (!productId) {
      const product = await stripe.products.create({ name: 'Monely Premium' });
      productId = product.id;
    }
    const monthly = await stripe.prices.create({
      unit_amount: amountMonthly,
      currency,
      product: productId,
      recurring: { interval: 'month' }
    });
    const yearly = await stripe.prices.create({
      unit_amount: amountYearly,
      currency,
      product: productId,
      recurring: { interval: 'year' }
    });

    const { error: dbError } = await supabase.from('app_settings').upsert({
      key: 'stripe',
      stripe_product_id: productId,
      stripe_price_monthly_id: monthly.id,
      stripe_price_yearly_id: yearly.id,
      currency,
      amount_monthly: amountMonthly,
      amount_yearly: amountYearly,
      updated_at: new Date().toISOString()
    });

    if (dbError) throw new Error(`Supabase DB Error: ${dbError.message}`);

    return new Response(JSON.stringify({ productId, monthly: monthly.id, yearly: yearly.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
