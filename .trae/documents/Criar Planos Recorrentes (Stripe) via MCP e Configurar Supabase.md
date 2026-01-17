## Objetivo
Criar planos recorrentes no Stripe (R$ 19,90/mensal e R$ 199,00/anual) usando MCP, e configurar o projeto Supabase para usá‑los, sem alterar arquivos locais.

## Etapas Stripe (MCP)
1. Verificar/Cria Product "Monely Premium".
2. Criar Prices recorrentes:
   - Mensal: BRL 1990 centavos, recurring: month
   - Anual: BRL 19900 centavos, recurring: year
3. Retornar `product_id` e `price_id` dos dois planos.

## Etapas Supabase (MCP)
1. Confirmar projeto "Minhas Finanças" e obter `project_id`.
2. Criar/Atualizar tabela `app_settings` com:
   - `stripe_product_id`, `stripe_price_monthly_id`, `stripe_price_yearly_id`, `currency`, `amount_monthly`, `amount_yearly`.
3. Definir variáveis de ambiente no projeto:
   - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_SECRET_KEY`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
4. Publicar Edge Functions pela plataforma (sem editar arquivos locais):
   - `create-checkout-session`, `create-portal-session`, `get-stripe-prices`, `setup-stripe-plans` (opcional), `webhook-stripe`.
5. Validar chamadas e logs das funções.

## Validação
- Invocar `get-stripe-prices` e verificar IDs/valores.
- Iniciar Checkout para mensal/anual sem `net::ERR_FAILED`.
- Confirmar webhook e `profiles.is_premium` após pagamento teste.

## Segurança
- Somente server armazena/usa `price_id` e segredos (Stripe/Supabase).
- RLS em tabelas e CORS habilitado nas funções.

## Resultado
Planos recorrentes ativos no Stripe, Supabase configurado e app funcionando com checkout/portal sem erros.