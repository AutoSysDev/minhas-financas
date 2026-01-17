import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) throw new Error('Missing Authorization header');

    // Client for verifying the user
    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado: ' + (authError?.message || ''));

    // Client for administrative tasks (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { email } = await req.json();
    if (!email) throw new Error('O e-mail do convidado é obrigatório.');

    console.log(`User ${user.email} (ID: ${user.id}) inviting ${email}`);

    // 1. Get or Create Shared Account (using Admin client to ensure we can create it)
    let { data: sharedAccount, error: fetchError } = await supabaseAdmin
      .from('shared_accounts')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (fetchError) throw new Error('Erro ao buscar conta compartilhada: ' + fetchError.message);

    if (!sharedAccount) {
      console.log('Creating new shared account for owner:', user.id);
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('shared_accounts')
        .insert({ owner_user_id: user.id })
        .select()
        .single();

      if (createError) throw new Error('Erro ao criar conta compartilhada: ' + createError.message);
      sharedAccount = newAccount;

      // Add owner as member automatically
      await supabaseAdmin
        .from('shared_account_members')
        .insert({
          shared_account_id: sharedAccount.id,
          user_id: user.id,
          role: 'owner',
          email: user.email // Store owner email for display
        });
    }

    // 2. Check if already invited
    const { data: existingInvite, error: checkInviteError } = await supabaseAdmin
      .from('shared_account_invites')
      .select('id')
      .eq('shared_account_id', sharedAccount.id)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkInviteError) throw new Error('Erro ao verificar convites existentes: ' + checkInviteError.message);
    if (existingInvite) throw new Error('Já existe um convite pendente para este e-mail.');

    // 3. Create Invite Record
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('shared_account_invites')
      .insert({
        shared_account_id: sharedAccount.id,
        email: email,
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) throw new Error('Erro ao criar convite: ' + inviteError.message);

    console.log(`Invite created successfully: ${invite.id}`);

    return new Response(
      JSON.stringify({ message: 'Convite enviado com sucesso!', invite }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Invite Edge Function Error:', error.message);
    let status = 400;
    if (error.message.includes('autenticado')) status = 401;

    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    );
  }
});
