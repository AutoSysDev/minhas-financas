import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const STRIPE_PRICE_MONTHLY = Deno.env.get("STRIPE_PRICE_MONTHLY") || null;
    const STRIPE_PRICE_YEARLY = Deno.env.get("STRIPE_PRICE_YEARLY") || null;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase configuration");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to get from DB first
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "stripe")
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
      // Don't crash, try to return env vars if available, or just empty
    }

    const result = { 
      envMonthly: STRIPE_PRICE_MONTHLY, 
      envYearly: STRIPE_PRICE_YEARLY, 
      db: data || null 
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200 
    });

  } catch (error: any) {
    console.error("Error in get-stripe-prices:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
