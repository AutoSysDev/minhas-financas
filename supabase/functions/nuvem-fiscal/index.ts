import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NUVEM_FISCAL_CLIENT_ID = Deno.env.get("NUVEM_FISCAL_CLIENT_ID");
const NUVEM_FISCAL_CLIENT_SECRET = Deno.env.get("NUVEM_FISCAL_CLIENT_SECRET");
const NUVEM_FISCAL_AUTH_URL = "https://auth.nuvemfiscal.com.br/oauth/token";
const NUVEM_FISCAL_API_URL = "https://api.nuvemfiscal.com.br";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NuvemFiscalToken {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

async function getAccessToken(): Promise<string> {
    if (!NUVEM_FISCAL_CLIENT_ID || !NUVEM_FISCAL_CLIENT_SECRET) {
        throw new Error("Missing Nuvem Fiscal credentials in environment variables.");
    }

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", NUVEM_FISCAL_CLIENT_ID);
    params.append("client_secret", NUVEM_FISCAL_CLIENT_SECRET);
    params.append("scope", "nfe");

    const response = await fetch(NUVEM_FISCAL_AUTH_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get Nuvem Fiscal token: ${errorText}`);
    }

    const data: NuvemFiscalToken = await response.json();
    return data.access_token;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization")!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Check user auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const { action, method = 'GET', endpoint, payload } = await req.json();

        if (!endpoint) {
            return new Response(JSON.stringify({ error: "Missing endpoint" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const token = await getAccessToken();

        const nfResponse = await fetch(`${NUVEM_FISCAL_API_URL}${endpoint}`, {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        const nfData = await nfResponse.json();

        return new Response(JSON.stringify(nfData), {
            status: nfResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
