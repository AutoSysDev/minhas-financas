import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get all users who have bill reminders enabled
        const { data: allSettings, error: settingsError } = await supabaseClient
            .from('notification_settings')
            .select('user_id, bill_reminder_enabled, bill_reminder_days')
            .eq('bill_reminder_enabled', true)

        if (settingsError) throw settingsError
        if (!allSettings || allSettings.length === 0) {
            return new Response(JSON.stringify({ message: 'No users with reminders enabled' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const notificationsToSend: any[] = []
        const pushNotificationsQueue: any[] = []

        // Process each user
        for (const settings of allSettings) {
            const userId = settings.user_id;
            const days = settings.bill_reminder_days || 2;

            // Datas para verificação
            const today = new Date();
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + days);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const targetDay = targetDate.getDate(); // Dia do mês (1-31)

            // --- 1. Contas a Pagar/Receber (Transactions) ---
            const { data: transactions } = await supabaseClient
                .from('transactions')
                .select('id, description, amount, date, type')
                .eq('user_id', userId)
                .in('type', ['EXPENSE', 'INCOME'])
                .eq('is_paid', false)
                .eq('date', targetDateStr)

            if (transactions) {
                for (const trans of transactions) {
                    const isExpense = trans.type === 'EXPENSE';
                    const typeLabel = isExpense ? 'Conta' : 'Receita';
                    const actionVerb = isExpense ? 'vence' : 'está prevista';

                    const title = `${typeLabel} próxima do vencimento`;
                    const message = `${typeLabel} "${trans.description}" de R$ ${trans.amount} ${actionVerb} em ${days} dia(s).`;

                    await addNotificationIfUnique(
                        supabaseClient,
                        notificationsToSend,
                        pushNotificationsQueue,
                        userId,
                        'bill_reminder',
                        title,
                        message,
                        isExpense ? 'receipt_long' : 'payments',
                        isExpense ? '#ef4444' : '#22c55e',
                        '/transactions'
                    );
                }
            }

            // --- 2. Faturas de Cartão (Credit Cards) ---
            // Assumindo que a tabela 'cards' tem 'due_day' (dia do vencimento)
            const { data: cards } = await supabaseClient
                .from('cards')
                .select('id, name, due_day, current_invoice')
                .eq('user_id', userId)
                .eq('due_day', targetDay) // Vence no dia alvo (ex: daqui a 2 dias)

            if (cards) {
                for (const card of cards) {
                    const title = 'Fatura de Cartão vencendo';
                    const message = `A fatura do cartão ${card.name} vence em ${days} dias.`;

                    await addNotificationIfUnique(
                        supabaseClient,
                        notificationsToSend,
                        pushNotificationsQueue,
                        userId,
                        'bill_reminder',
                        title,
                        message,
                        'credit_card',
                        '#f59e0b', // Orange/Yellow
                        '/cards'
                    );
                }
            }

            // --- 3. Orçamentos (Budgets) > 80% ---
            const { data: budgets } = await supabaseClient
                .from('budgets')
                .select('id, category, spent, limit_amount')
                .eq('user_id', userId)

            if (budgets) {
                for (const budget of budgets) {
                    const limit = budget.limit_amount || 0;
                    const spent = budget.spent || 0;

                    if (limit > 0 && spent >= (limit * 0.8) && spent < limit) {
                        const percentage = Math.round((spent / limit) * 100);
                        const title = 'Alerta de Orçamento';
                        const message = `Você já consumiu ${percentage}% do orçamento de ${budget.category}.`;

                        // Verificar deduplicação com janela maior (3 dias) para não spammar
                        await addNotificationIfUnique(
                            supabaseClient,
                            notificationsToSend,
                            pushNotificationsQueue,
                            userId,
                            'budget_alert',
                            title,
                            message,
                            'pie_chart',
                            '#ef4444',
                            '/budgets',
                            3 // 3 dias de intervalo
                        );
                    } else if (limit > 0 && spent >= limit) {
                        const title = 'Orçamento Estourado';
                        const message = `Você atingiu 100% do limite de ${budget.category}!`;
                        await addNotificationIfUnique(
                            supabaseClient,
                            notificationsToSend,
                            pushNotificationsQueue,
                            userId,
                            'budget_alert',
                            title,
                            message,
                            'warning',
                            '#ef4444',
                            '/budgets',
                            3
                        );
                    }
                }
            }
        }

        // Insert notifications into DB (Internal In-App Notifications)
        if (notificationsToSend.length > 0) {
            const { error } = await supabaseClient
                .from('notifications')
                .insert(notificationsToSend)

            if (error) console.error('Error inserting notifications:', error)
        }

        // Send Push Notifications (Firebase FCM)
        // We call the 'send-push' Edge Function for each notification
        const pushResults = [];
        for (const push of pushNotificationsQueue) {
            try {
                // Invoca a função send-push
                const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: push.userId,
                        title: push.title,
                        body: push.body,
                        data: { url: push.url }
                    })
                });

                if (res.ok) {
                    const json = await res.json();
                    pushResults.push(json);
                } else {
                    const text = await res.text();
                    console.error(`Failed to send push: ${text}`);
                    pushResults.push({ error: text });
                }
            } catch (e) {
                console.error('Error sending push:', e);
                pushResults.push({ error: e.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            notificationsCreated: notificationsToSend.length,
            pushSent: pushResults.length,
            results: pushResults
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// Helper para deduplicação e montagem das listas
async function addNotificationIfUnique(
    supabase: any,
    dbList: any[],
    pushList: any[],
    userId: string,
    type: string,
    title: string,
    message: string,
    icon: string,
    color: string,
    url: string,
    dedupDays: number = 1
) {
    // Check if similar notification exists recently
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - dedupDays);

    const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .ilike('message', message) // Exact message match to differentiate items
        .gte('created_at', dateLimit.toISOString())
        .maybeSingle()

    if (!existing) {
        // Add to DB list
        dbList.push({
            user_id: userId,
            type: type,
            title: title,
            message: message,
            icon: icon,
            color: color,
            priority: 'high',
            action_url: url,
            is_read: false
        })

        // Add to Push list
        pushList.push({
            userId: userId,
            title: title,
            body: message,
            url: url
        })
    }
}
