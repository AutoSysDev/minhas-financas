import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9.1/mod.ts"

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  try {
    const { userId, title, body, data } = await req.json() as NotificationPayload

    // 1. Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Buscar tokens do usuário
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', userId)

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum token encontrado' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Obter Access Token do Google via JWT
    const accessToken = await getAccessToken();

    const results = []

    for (const t of tokens) {
      const message = {
        message: {
          token: t.token,
          notification: { title, body },
          data: data || {},
        },
      }

      // Envia para API HTTP v1 do FCM
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${Deno.env.get('FCM_PROJECT_ID')}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        }
      )

      const json = await res.json()
      results.push(json)
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function getAccessToken() {
  const serviceAccountEmail = Deno.env.get('FCM_CLIENT_EMAIL')
  // Suporta tanto newlines reais quanto literais '\n'
  const privateKeyPem = Deno.env.get('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKeyPem) {
    throw new Error('Missing FCM credentials (FCM_CLIENT_EMAIL or FCM_PRIVATE_KEY)')
  }

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccountEmail,
      sub: serviceAccountEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600), // 1 hora de validade
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    },
    await importKey(privateKeyPem)
  )

  const params = new URLSearchParams()
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  params.append('assertion', jwt)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: params,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get access token: ${err}`)
  }

  const data = await res.json()
  return data.access_token
}

async function importKey(pem: string): Promise<CryptoKey> {
  // Remove headers e footers se existirem e limpa espaços/newlines
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["sign"]
  );
}
