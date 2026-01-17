import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json"
};

const normalize = (s: string) => s.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: cors });
  }
  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400, headers: cors });
    }
    const username = (payload?.username ?? "").toString();
    if (!username) {
      return new Response(JSON.stringify({ error: "Nome de usuário é obrigatório" }), { status: 400, headers: cors });
    }

    if (username.includes("@")) {
      return new Response(JSON.stringify({ email: username }), { status: 200, headers: cors });
    }

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "Configuração ausente" }), { status: 500, headers: cors });
    }
    const supabaseClient = createClient(url, key);

    let page = 1;
    const perPage = 200;
    let foundEmail: string | null = null;
    const target = normalize(username);

    while (page < 50) {
      const { data: usersResp, error: listErr } = await supabaseClient.auth.admin.listUsers({ page, perPage });
      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: cors });
      }
      const users = usersResp?.users ?? [];
      for (const u of users) {
        const meta = (u.user_metadata ?? {}) as Record<string, any>;
        const uname = normalize((meta.username ?? meta.full_name ?? "") as string);
        if (uname && uname === target) {
          foundEmail = u.email ?? null;
          break;
        }
      }
      if (foundEmail || (usersResp?.users?.length ?? 0) < perPage) break;
      page += 1;
    }

    if (!foundEmail) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404, headers: cors });
    }
    return new Response(JSON.stringify({ email: foundEmail }), { status: 200, headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as any)?.message ?? "Erro interno" }), { status: 500, headers: cors });
  }
});
