## Visão Geral
- Tabelas usadas no projeto: `accounts`, `transactions`, `cards`, `budgets`, `goals`, `categories`, `investments`, `notifications`, `notification_settings`, `profiles`, `subscriptions`, `app_settings`.
- Onde aparecem (exemplos):
  - `subscriptions` e `profiles` em funções Stripe: supabase/functions/webhook-stripe/index.ts:1, supabase/functions/create-checkout-session/index.ts:1.
  - `app_settings` em leitura/escrita dos preços: supabase/functions/get-stripe-prices/index.ts:12, supabase/functions/setup-stripe-plans/index.ts:29.
  - CRUD financeiro em `FinanceContext`: context/FinanceContext.tsx (vários trechos para `accounts`, `transactions`, `cards`, etc.).
  - Notificações: context/NotificationContext.tsx (listagem, configurações e marcação como lidas).

## Melhorias Transversais
- Chaves e relações:
  - Adicionar `PRIMARY KEY` claro (UUID v4) e `FOREIGN KEY (user_id)` para todas tabelas de usuário, referenciando `auth.users`.
  - Garantir `ON DELETE CASCADE` onde for seguro (ex.: `transactions`, `budgets`, `goals`, `investments`, `notifications`).
- Índices:
  - Índice em `user_id` para todas as tabelas multi-usuário.
  - Índices compostos em consultas frequentes: `transactions(user_id, date)`, `transactions(user_id, is_paid)`, `notifications(user_id, is_read, timestamp)`.
- Restrições e tipos:
  - Usar enums (Postgres) para campos categóricos: `transactions.type` (INCOME/EXPENSE), `cards.brand`, `cards.status`, `subscriptions.status`, `notifications.priority`.
  - `amount` e valores monetários como `integer` em centavos, com `CHECK (amount >= 0)`.
  - `closing_day`/`due_day` com `CHECK (1 <= day <= 31)`.
  - Padrões seguros: `balance DEFAULT 0`, `current_invoice DEFAULT 0`, `is_read DEFAULT false`, timestamps com `DEFAULT now()`.
- RLS (Row Level Security):
  - Ativar RLS e políticas: `SELECT/INSERT/UPDATE/DELETE` apenas quando `user_id = auth.uid()` para tabelas do usuário.
  - Exceções administrativas: `app_settings` e manutenção (somente service role).
- Auditoria e metadados:
  - Colunas `created_at` e `updated_at` com trigger para `updated_at`.
  - Tabela `audit_log` opcional para ações críticas (assinatura, exclusões em massa).

## Melhorias por Tabela
- `accounts`
  - UNIQUE `(user_id, name)` para evitar duplicatas.
  - `default_card_id` como FK para `cards(id)` com `ON DELETE SET NULL`.
  - Índice em `user_id` e `type`.
- `transactions`
  - FKs: `account_id`→`accounts(id)`, `card_id`→`cards(id)`, `category`→`categories(id ou name)` (idealmente `category_id`).
  - Índices: `(user_id, date)`, `(user_id, is_paid)`, `(account_id)`, `(card_id)`, `(category_id)`.
  - Constraints: `CHECK (amount >= 0)`, `NOT NULL` para `date`, `type`, `amount`.
  - Opcional: trigger para atualizar saldos/`current_invoice` para consistência em tempo real.
- `cards`
  - UNIQUE `(user_id, name)` e `(user_id, last_digits)`.
  - `current_invoice DEFAULT 0`, `status` enum, `closing_day/due_day` com `CHECK`.
  - FK `linked_account_id`→`accounts(id)`.
- `budgets`
  - UNIQUE `(user_id, category, period)`.
  - `limit_amount` em centavos, `CHECK (limit_amount > 0)`; `spent DEFAULT 0`.
  - Índices por `user_id` e `period`.
- `goals`
  - `target_amount > 0`, `current_amount >= 0` (centavos).
  - Índice por `user_id`, `deadline`.
- `categories`
  - UNIQUE `(user_id, name, type)`.
  - `is_default` com regra: impedir DELETE/UPDATE de padrão via política/trigger.
  - Considerar `id` próprio para vínculo em `transactions` (evitar usar nome).
- `investments`
  - Enum para `type` (ex.: stock, fund, savings).
  - `amount`/`initial_amount` em centavos, `CHECK (>= 0)`.
  - Índices por `user_id`, `date`.
- `notifications`
  - Índices: `(user_id, timestamp DESC)`, `(user_id, is_read)`.
  - Enum `priority` (low, normal, high), retenção (ex.: TTL ou job para limpeza > N dias).
- `notification_settings`
  - `PRIMARY KEY (user_id)` (uma linha por usuário), defaults razoáveis.
  - `updated_at DEFAULT now()`.
- `profiles`
  - `PRIMARY KEY (user_id)`, `is_premium DEFAULT false`, `updated_at DEFAULT now()`.
  - Política RLS estrita.
- `subscriptions`
  - `PRIMARY KEY (user_id)`, `UNIQUE (stripe_customer_id)`, índice em `status` e `current_period_end`.
  - Enum `status` (active, past_due, canceled, trialing, etc.).
  - `updated_at DEFAULT now()`.
- `app_settings`
  - `PRIMARY KEY (key)`; apenas service role pode ler/gravar.
  - Colunas `created_at/updated_at` e validação de currency (`BRL`, etc.).

## Observabilidade e Qualidade de Dados
- Views úteis: agregados de transações por mês/categoria; saldos por conta; evolução de metas.
- Jobs agendados: limpeza de notificações antigas; recalcular métricas derivadas (se não usar triggers).
- Consistência: migrar `category` textual em `transactions` para `category_id` (FK) com migração de dados.

## Plano de Implementação
1. Criar enums para campos categóricos (`transactions.type`, `cards.brand/status`, `subscriptions.status`, `notifications.priority`).
2. Adicionar FKs e `NOT NULL` onde aplicável; migrar `transactions.category` para `category_id`.
3. Criar índices prioritários (`transactions`, `notifications`) e UNIQUEs por usuário (`accounts`, `cards`, `budgets`, `categories`).
4. Ativar/ajustar RLS e políticas por tabela; restringir `app_settings` a service role; bloquear alterações em `categories.is_default`.
5. Adicionar `created_at/updated_at` com triggers de atualização.
6. Opcional: triggers de consistência para saldos e faturas de cartão; ou jobs noturnos para reconciliação.
7. Migrações de dados: normalizar valores monetários para centavos e garantir integridade referencial.

## Validação
- Testes de consulta: verificar planos de execução (EXPLAIN) para consultas principais.
- Testes RLS: garantir que um usuário não acessa dados de outro.
- Testes Stripe: confirmar `subscriptions` e `profiles` atualizados via webhook.

Confirma estas diretrizes para eu preparar as migrações SQL (sem executar nada) e detalhar os comandos por tabela.