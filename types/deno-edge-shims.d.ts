declare const Deno: any;

declare module "https://esm.sh/stripe@15.11.0?target=deno" {
  const Stripe: any;
  export default Stripe;
}

declare module "https://esm.sh/@supabase/supabase-js@2.83.0" {
  export const createClient: any;
}

declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {}
