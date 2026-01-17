## Visão Geral
- Implantar assinaturas Premium via Stripe com planos mensal e anual.
- Usar Stripe Checkout e Customer Portal para reduzir escopo PCI.
- Persistir status da assinatura no Supabase e integrar com o app para liberar recursos Premium.

## Componentes Técnicos
- `Stripe`: Products/Prices (mensal e anual), Checkout, Customer Portal, Webhooks.
- `Supabase`: Edge Functions para criar sessões e receber webhooks; tabela `subscriptions` para status.
- `Frontend`: Botões “Assinar Premium” e “Gerenciar Assinatura”, gating de funcionalidades.
- `Segurança`: uso de chaves via variáveis de ambiente; nenhum dado de cartão trafega pelo nosso app.

## Criar Produtos e Prices no Stripe
- No Dashboard Stripe, criar um `Product` "Monely Premium".
- Criar 2 `Prices` recorrentes:
  - Mensal (ex.: BRL 19,90) → guardar `price_id` em `STRIPE_PRICE_MONTHLY`.
  - Anual (ex.: BRL 199,00) → guardar `price_id` em `STRIPE_PRICE_YEARLY`.
- Definir `STRIPE_SECRET_KEY` (server) e `VITE_STRIPE_PUBLISHABLE_KEY` (client).

## Supabase Edge Functions
- `create-checkout-session`:
  - Entrada: `{ priceId }` e usuário autenticado.
  - Usa `stripe` (server-side) para criar `checkout.session` com `success_url` e `cancel_url` (URLs do app).
  - Retorna `url` para redirecionar.
- `create-portal-session`:
  - Recebe `customer_id` do usuário (guardado no DB), cria Customer Portal Session e retorna `url`.
- `webhook-stripe`:
  - Recebe eventos: `customer.subscription.created|updated|deleted`, `checkout.session.completed`.
  - Atualiza tabela `subscriptions` com: `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`.
  - Em `subscription.status === 'active'`, marca usuário como Premium (ex.: `profiles.is_premium = true` ou `auth.user_metadata.is_premium`).
- Env vars (no Supabase): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`.

## Banco de Dados (Supabase)
- Tabela `subscriptions`:
  - `id (uuid)`, `user_id (uuid)`, `stripe_customer_id (text)`, `stripe_subscription_id (text)`, `status (text)`, `current_period_end (timestamptz)`, `updated_at`.
  - Índice em `user_id`.
  - RLS: usuário pode ver somente sua linha.
- Opcional: tabela `profiles` com `is_premium boolean` para leitura rápida no app.

## Frontend (App)
- `Settings` → nova seção "Assinatura":
  - Botões: “Assinar Mensal” e “Assinar Anual” chamam Edge Function `create-checkout-session` com `priceId`.
  - "Gerenciar Assinatura" chama `create-portal-session`.
- `AuthContext`: na carga, buscar status Premium (via `profiles` ou `subscriptions`) e expor `isPremium`.
- Gating:
  - Mostrar selo Premium quando `isPremium === true` (já existe um badge; alinhar com status real).
  - Liberar recursos Premium (ex.: relatórios avançados, exportações, etc.).

## Fluxo de Usuário
1. Usuário clica em “Assinar Mensal/Anual” → redireciona para Stripe Checkout.
2. Conclui pagamento → Stripe envia webhook → atualiza Supabase.
3. App detecta `isPremium` atualizando estado e exibe recursos.
4. "Gerenciar Assinatura" abre Customer Portal para troca/cancelamento.

## Boas Práticas de Segurança
- Nunca expor `STRIPE_SECRET_KEY` no client; usar Edge Functions para chamadas Stripe.
- Validar `Stripe-Signature` nos webhooks com `STRIPE_WEBHOOK_SECRET`.
- Sanitizar e validar `priceId` permitido (mensal/anual) no servidor.

## Testes e Verificação
- Modo de teste Stripe: usar cartões de teste e preços de teste.
- Testar eventos localmente com Stripe CLI (`stripe listen --forward-to webhook`).
- Cenários: compra, upgrade/downgrade, cancelamento, reativação.

## Entregáveis
- Edge Functions: `create-checkout-session`, `create-portal-session`, `webhook-stripe`.
- Tabela `subscriptions` e (opcional) `profiles.is_premium`.
- UI de assinatura em `Settings` e integração em `AuthContext`.
- Documentação breve de env vars e deploy.

## Próximo Passo
- Confirmar os valores e moeda dos planos e criar os `Prices` no Stripe.
- Depois, implementarei as Edge Functions, tabela e UI conforme descrito.