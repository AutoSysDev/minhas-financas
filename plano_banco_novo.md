# Plano — criação do banco `axgoixqbddofetcxitho` (DB monely 1)

> Alvo: projeto Supabase novo, conta separada, `us-east-1`, hoje com **0 tabelas** e **0 migrations**.
> Fonte da verdade do schema: `python/local_db.py` (17 tabelas, espelho fiel do que o app usa),
> `types.ts` (interfaces) e as 147 chamadas `.from(...)` em 19 arquivos TS/TSX.

## Status da execução — CONCLUÍDO (opção A)

| Fase | Migration aplicada | Resultado |
|---|---|---|
| 1 | `001_nucleo_financeiro` | 8 tabelas + índices |
| 2 | `002_rls_nucleo` | RLS + 32 políticas |
| 3 | `003_investimentos_e_extras` | 6 tabelas, `updated_at` automático |
| 4 | `004_compartilhamento_e_listas` | 5 tabelas + RPC `accept_shared_account_invite` |
| 5 | `005_categorias_globais` | 23 categorias com acentuação correta |
| 6 | `006_views_portugues` | 19 views `security_invoker` |
| 7 | `007_storage_avatars` | bucket + 4 políticas |
| 8 | `008` / `009` / `010` | grants, search_path, índices e reescrita das 76 políticas |

Estado final: **19 tabelas, 19 views, 76 políticas, 23 categorias, 0 usuários, 0 linhas**.
`VITE_USE_LOCAL_DB=false` — o app já aponta para o banco novo.
Edge functions ainda não publicadas (convite por e-mail, notificações, checkout, push, Nuvem Fiscal).

---

## 0. Decisão que trava o resto: nomes

O código fala inglês. Renomear as tabelas para português custa caro e tem risco silencioso.

| Opção | O que é | Custo | Risco |
|---|---|---|---|
| **A (recomendada)** | Tabelas em inglês (como o código espera) + **views em português** para leitura | ~1 fase extra, zero mudança de código | baixo |
| B | Tabelas em português (`contas`, `transacoes`…) | 147 chamadas em 19 arquivos + 17 tabelas do SQLite + `ALLOWED_TABLES` + endpoints Python | alto: um rename esquecido = tela vazia sem erro |
| C | Inglês puro + este documento como mapa | nenhum | nenhum |

**Por que A resolve o seu pedido:** você abre o SQL Editor e roda `select * from v_transacoes`, vendo
`descricao`, `valor`, `data`, `tipo`, `conta` em vez de `description`, `amount`, `date`. O app continua
usando `transactions`. As views usam `security_invoker = true`, então **respeitam o RLS** — não são um
buraco de segurança.

---

## 1. Inventário: o que cada tabela guarda

| Tabela técnica | Leitura (view) | Guarda |
|---|---|---|
| `profiles` | `v_perfis` | flag de premium por usuário |
| `user_profiles` | `v_perfil_investidor` | nível de investidor, preferências, onboarding |
| `notification_settings` | `v_config_notificacoes` | preferências de aviso |
| `accounts` | `v_contas` | contas bancárias, saldo, limite de cheque especial |
| `cards` | `v_cartoes` | cartões de crédito, limite, fatura, fechamento/vencimento |
| `transactions` | `v_transacoes` | receitas, despesas, transferências, parcelas |
| `categories` | `v_categorias` | categorias do usuário + globais (`user_id` nulo) |
| `budgets` | `v_orcamentos` | orçamento por categoria |
| `goals` | `v_metas` | metas de economia |
| `goal_transactions` | `v_movimentacoes_meta` | depósitos/retiradas de cada meta |
| `investments` | `v_investimentos` | posições, rendimento, projeção |
| `notifications` | `v_notificacoes` | central de avisos |
| `fiscal_notes` | `v_notas_fiscais` | NF-e via Nuvem Fiscal |
| `user_push_tokens` | `v_tokens_push` | tokens FCM por dispositivo |
| `shared_accounts` | `v_contas_compartilhadas` | conta compartilhada (dono) |
| `shared_account_members` | `v_membros` | quem participa e com qual papel |
| `shared_account_invites` | `v_convites` | convites pendentes |
| `shopping_lists` | `v_listas_compras` | listas de supermercado |
| `shopping_list_items` | `v_itens_lista` | itens da lista |
| `app_settings`, `subscriptions` | — | **só se usar Stripe**; hoje o app não consulta nenhuma (0 chamadas) |

Bucket de storage: `avatars` (o código usa `getPublicUrl`).

---

## 2. Convenções

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- dinheiro: `numeric(14,2)` — **não** `real`/`float`. O SQLite local usa `REAL` e por isso acumula erro de centavo.
- valores categóricos: `text` + `check (...)` em vez de `enum` nativo (evolui sem `alter type`)
- datas de negócio: `date`; carimbos: `timestamptz default now()`
- colunas opcionais no app ficam **nuláveis** (ex.: `cards.image_url`, `accounts.account_number`)
- `on delete cascade` para filhos dependentes; `set null` para referências opcionais (cartão → conta)

---

## 3. Fase 1 — Núcleo financeiro (8 tabelas)

```sql
create extension if not exists pgcrypto;

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean default false,
  updated_at timestamptz default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank_name text not null,
  type text not null check (type in ('checking','investment','savings','cash')),
  balance numeric(14,2) not null default 0,
  color text,
  logo_text text,
  account_number text,
  icon text,
  default_card_id uuid,                      -- sem FK: referência circular com cards
  category text,
  is_default_for_debit boolean default false,
  show_in_summary boolean default true,
  ignore_in_total boolean default false,
  overdraft_limit numeric(14,2) default 0,
  overdraft_interest_rate numeric(6,4) default 0,
  overdraft_used numeric(14,2) default 0,
  notes text,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  last_digits text,
  brand text check (brand in ('visa','mastercard','amex','other')),
  limit_amount numeric(14,2) default 0,
  current_invoice numeric(14,2) default 0,
  closing_day int check (closing_day between 1 and 31),
  due_day int check (due_day between 1 and 31),
  status text default 'active' check (status in ('active','blocked')),
  image_url text,
  color text,
  account_id uuid references accounts(id) on delete set null,
  linked_account_id uuid references accounts(id) on delete set null,
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null,
  date date not null,
  type text not null check (type in ('INCOME','EXPENSE','TRANSFER')),
  category text,
  card_id uuid references cards(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  is_paid boolean default true,
  installments int,
  installment_number int,
  original_transaction_id uuid,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,   -- nulo = global
  name text not null,
  icon text,
  color text,
  type text not null check (type in ('income','expense')),
  is_default boolean default false,
  created_at timestamptz default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  spent numeric(14,2) default 0,
  limit_amount numeric(14,2) default 0,      -- "limit" é palavra reservada
  period text default 'monthly' check (period in ('monthly','weekly','yearly')),
  color text,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  current_amount numeric(14,2) default 0,
  target_amount numeric(14,2) default 0,
  deadline date,
  icon text,
  color_class text,
  text_class text,
  archived boolean default false,
  created_at timestamptz default now()
);

create table goal_transactions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  amount numeric(14,2) not null,
  type text not null check (type in ('deposit','withdraw')),
  date date not null default current_date,
  description text,
  related_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz default now()
);
```

Índices desta fase:

```sql
create index on accounts (user_id);
create index on cards (user_id);
create index on transactions (user_id, date desc);
create index on transactions (account_id);
create index on transactions (card_id);
create index on transactions (original_transaction_id);
create index on budgets (user_id);
create index on goals (user_id);
create index on goal_transactions (goal_id, date desc);
create unique index unique_global_categories on categories (name, type) where user_id is null;
create index on categories (user_id, type);
```

---

## 4. Fase 2 — RLS do núcleo

Padrão para toda tabela com `user_id` (4 políticas):

```sql
alter table transactions enable row level security;

create policy "own_select" on transactions for select using (auth.uid() = user_id);
create policy "own_insert" on transactions for insert with check (auth.uid() = user_id);
create policy "own_update" on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on transactions for delete using (auth.uid() = user_id);
```

Exceções:

- `categories`: leitura libera as globais —
  `using (auth.uid() = user_id or user_id is null)`; escrita só `auth.uid() = user_id`.
- `goal_transactions` (não tem `user_id`): herda a posse da meta —
  `using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()))`
  nas quatro operações.
- `profiles` / `user_profiles` / `notification_settings`: chave é `user_id`, mesmo padrão.
- `app_settings`: `select using (true)`, escrita negada ao cliente (só service_role).

**Não** criar política para o papel `anon`. Sem `select` liberado, visitante não lê nada.

---

## 5. Fase 3 — Investimentos e extras

- `investments` (colunas de `types.ts`: `type`, `amount`, `initial_amount`, `quantity`, `date`,
  `account_id`, `ticker`, `yield_rate`, `yield_type`, `duration`, `duration_unit`, `tax_type`,
  `maturity_date`, `projected_gross_yield`, `projected_tax_amount`, `projected_net_total`,
  `projected_net_yield`, `current_price`, `last_sync`) + RLS padrão.
- `notifications` (`type`, `title`, `message`, `icon`, `color`, `action_url`, `priority`,
  `timestamp timestamptz default now()`, `created_at`, `is_read boolean default false`) + RLS padrão
  + índice `(user_id, timestamp desc)` e `(user_id, is_read)`.
- `fiscal_notes` — copiar de `20260102_add_fiscal_notes.sql` (já está correta, com FK para
  `transactions` e `auth.users`, RLS e índices).
- `user_push_tokens` — copiar de `20260105_create_push_tokens.sql`.
- `user_profiles` (`user_id` PK, `investor_level text`, `investor_preferences jsonb`,
  `onboarding_completed boolean default false`, `profile_version int default 1`, `updated_at`) + RLS.
- `notification_settings` (as 9 colunas de `local_db.py`) + RLS.

---

## 6. Fase 4 — Compartilhamento e listas

- `shared_accounts` (`owner_user_id` → `auth.users`), `shared_account_members`
  (`role check ('owner','member')`, `email`), `shared_account_invites`
  (`status check ('pending','accepted','rejected')`).
- `shopping_lists` (`status check ('open','completed')`), `shopping_list_items`
  (`quantity numeric default 1`, `is_checked boolean`, `assigned_user_id`).
- RLS de membro (o dono e os membros veem a mesma conta):

```sql
create policy "membro_select" on shopping_list_items for select using (
  exists (
    select 1 from shopping_lists l
    left join shared_account_members m on m.shared_account_id = l.shared_account_id
    where l.id = shopping_list_id
      and (l.owner_user_id = auth.uid() or l.user_id = auth.uid() or m.user_id = auth.uid())
  )
);
```

Mesma ideia para `INSERT/UPDATE/DELETE`. `shared_account_members` permite que o usuário veja as
próprias linhas **ou** as linhas de contas das quais participa.

---

## 7. Fase 5 — Seed de categorias (com cuidado)

A migration `20251230_global_categories.sql` está com **encoding corrompido**
(`Alimenta��ǜo`, `Saǧde`). Não copiar. Reescrever as 23 categorias com acentuação correta:

```sql
insert into categories (name, icon, color, type, is_default, user_id) values
  ('Alimentação','cat_food','#f59e0b','expense',true,null),
  ('Transporte','cat_car','#3b82f6','expense',true,null),
  ('Saúde','cat_health','#ef4444','expense',true,null),
  ('Educação','cat_education','#8b5cf6','expense',true,null),
  ('Lazer','cat_leisure','#ec4899','expense',true,null),
  ('Moradia','cat_home','#10b981','expense',true,null),
  ('Vestuário','cat_clothing','#6366f1','expense',true,null),
  ('Compras','cat_shopping','#ff7a00','expense',true,null),
  ('Supermercado','cat_grocery','#22c55e','expense',true,null),
  ('Viagem','cat_travel','#0ea5e9','expense',true,null),
  ('Pets','cat_pets','#f97316','expense',true,null),
  ('Academia','cat_gym','#22c55e','expense',true,null),
  ('Café','cat_coffee','#a16207','expense',true,null),
  ('Cinema','cat_movie','#334155','expense',true,null),
  ('Música','cat_music','#64748b','expense',true,null),
  ('Livros','cat_books','#6b7280','expense',true,null),
  ('Pagamentos','cat_bill','#14b8a6','expense',true,null),
  ('Trabalho','cat_work','#374151','expense',true,null),
  ('Outros','cat_others','#6b7280','expense',true,null),
  ('Investimentos','cat_invest','#0ea5e9','income',true,null),
  ('Poupança','cat_savings','#22c55e','income',true,null),
  ('Salário','cat_salary','#16a34a','income',true,null),
  ('Freelance','cat_freelance','#3b82f6','income',true,null)
on conflict (name, type) where user_id is null do nothing;
```

---

## 8. Fase 6 — Views em português (opcional recomendado)

```sql
create view v_transacoes with (security_invoker = true) as
select
  t.id,
  t.date            as data,
  t.description     as descricao,
  t.amount          as valor,
  t.type            as tipo,
  t.category        as categoria,
  t.is_paid         as pago,
  t.installments    as parcelas,
  t.installment_number as parcela_atual,
  a.name            as conta,
  c.name            as cartao,
  t.created_at      as criado_em
from transactions t
left join accounts a on a.id = t.account_id
left join cards    c on c.id = t.card_id;
```

Mesmo padrão para as demais (`v_contas`, `v_cartoes`, `v_metas`, `v_orcamentos`, `v_categorias`,
`v_investimentos`, `v_notificacoes`, `v_notas_fiscais`, `v_movimentacoes_meta`, `v_listas_compras`,
`v_itens_lista`, `v_perfis`, `v_perfil_investidor`, `v_config_notificacoes`, `v_contas_compartilhadas`,
`v_membros`, `v_convites`, `v_tokens_push`).

As views são **somente leitura** — para escrever, o app usa as tabelas base. Isso é intencional: evita
que uma escrita passe por uma view sem passar pelos triggers/constraints corretos.

---

## 9. O que NÃO criar

- ❌ **Triggers de saldo e fatura** (`20260124_balance_triggers.sql`). O app já recalcula
  (`FinanceContext.tsx:292, 828, 855`). Com o trigger ligado, `createAccount` insere a conta com
  `balance` **e** uma transação "Saldo Inicial" com `is_paid: true` → saldo dobrado.
  Se um dia quiser trigger, o app precisa parar de atualizar saldo na mão. Hoje: **um dono só, o app**.
- ❌ Cron / `pg_net` com a URL e a `service_role` do projeto antigo (`20251227`, `20260105`).
- ❌ `investments_automations` — nenhum código usa.
- ❌ `security_audit_log`, `app_settings`, `subscriptions` — sem uso atual (Stripe fica para quando houver).
- ❌ As migrations de "fix RLS" como estão — já nascem corretas neste plano.

---

## 10. Storage `avatars`

```sql
insert into storage.buckets (id, name, public) values ('avatars','avatars',true)
on conflict (id) do nothing;

create policy "avatar_leitura" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatar_escrita" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 11. Ordem de execução e verificação

| Fase | Ação | Como verifico |
|---|---|---|
| 0 | Você escolhe A, B ou C | — |
| 1 | Núcleo (8 tabelas + índices) | `list_tables` mostra 8; `get_advisors('performance')` sem crítico |
| 2 | RLS + políticas | `get_advisors('security')` sem "RLS disabled" |
| 3 | Investimentos + extras (5 tabelas) | `list_tables` = 13 |
| 4 | Compartilhamento + listas (6 tabelas) | `list_tables` = 19 |
| 5 | Seed de 23 categorias | `select count(*) from categories where user_id is null` = 23 |
| 6 | Views em português | `select * from v_transacoes limit 1` sem erro |
| 7 | Bucket `avatars` | upload de teste com usuário autenticado |
| 8 | Smoke test | criar usuário de teste, `VITE_USE_LOCAL_DB=false`, abrir Dashboard/Contas/Transações |
| 9 | Dados do SQLite (opcional) | script de import de `python/monely.db` → tabelas novas |

Cada fase usa `apply_migration` via MCP (fica registrada em `supabase_migrations.schema_migrations`),
então dá para auditar e reaplicar.

**Rollback:** o banco não tem dado nenhum, então reverter = `drop table ... cascade` em ordem inversa
das FKs (ou recriar o projeto). O `.env` atual aponta para o projeto novo, mas `VITE_USE_LOCAL_DB=true`
mantém o app no SQLite local até a fase 8 — **nenhum dado de produção corre risco**.

---

## 12. Riscos conhecidos

1. **Contagem dupla de saldo** se o trigger do repo for aplicado — mitigado por não criá-lo (§9).
2. **Mojibake**: arquivos do repo estão em CP1252/UTF-8 misturado (`Educa��o`). Copiar SQL deles
   corrompe dados — por isso a Fase 5 é reescrita à mão.
3. **Coluna faltando = tela vazia sem erro.** O app faz `select('*')` e mapeia; se a coluna não existir,
   o campo vira `undefined`. Checklist de smoke test (fase 8) existe por isso.
4. **`numeric` vs `real`**: o SQLite usa float; o Postgres vai usar `numeric`. Divergência de centavo
   aparece só na virada para a fase 9 (import).
5. **`transactions.date` como `date`**: o app envia `YYYY-MM-DD`. Se algum ponto enviar data com hora,
   o insert falha — validar no smoke test.
6. **RLS sem política = 0 linhas** (não erro). Sempre rodar `get_advisors('security')` após a Fase 2.

---

## 13. Estimativa

| Fase | Esforço |
|---|---|
| 1–2 (núcleo + RLS) | ~25 min |
| 3–4 (extras + compartilhamento) | ~20 min |
| 5 (seed) | ~5 min |
| 6 (views em português) | ~20 min |
| 7 (storage) | ~5 min |
| 8 (smoke test) | ~20 min + seu teste manual nas telas |
| 9 (import SQLite) | ~30 min, opcional |

Total: **1 sessão de trabalho**, chegando em app funcional no banco novo (fases 1–8).
