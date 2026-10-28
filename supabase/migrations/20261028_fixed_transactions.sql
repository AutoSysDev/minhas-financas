-- Séries fixas para qualquer tipo de transação (despesa, receita e transferência).
-- Renomeia fixed_expenses -> fixed_transactions e adiciona tipo, conta de destino,
-- status de pagamento padrão e a perna da ocorrência (transferência tem duas).
-- Idempotente: pode ser reaplicada com segurança.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fixed_expenses'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fixed_transactions'
  ) then
    alter table public.fixed_expenses rename to fixed_transactions;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fixed_expense_skips'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fixed_transaction_skips'
  ) then
    alter table public.fixed_expense_skips rename to fixed_transaction_skips;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'fixed_expense_id'
  ) then
    alter table public.transactions rename column fixed_expense_id to fixed_transaction_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fixed_transaction_skips' and column_name = 'fixed_expense_id'
  ) then
    alter table public.fixed_transaction_skips rename column fixed_expense_id to fixed_transaction_id;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'fixed_expenses_pkey' and conrelid = to_regclass('public.fixed_transactions')
  ) then
    alter table public.fixed_transactions rename constraint fixed_expenses_pkey to fixed_transactions_pkey;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'fixed_expense_skips_pkey' and conrelid = to_regclass('public.fixed_transaction_skips')
  ) then
    alter table public.fixed_transaction_skips rename constraint fixed_expense_skips_pkey to fixed_transaction_skips_pkey;
  end if;

  if to_regclass('public.fixed_transactions') is null then
    raise exception 'Tabela public.fixed_transactions não existe. Aplique a migration 20261027_fixed_expenses.sql antes desta.';
  end if;
end $$;

alter table public.fixed_transactions
  add column if not exists type text not null default 'EXPENSE'
    check (type in ('INCOME', 'EXPENSE', 'TRANSFER')),
  add column if not exists destination_account_id uuid
    references public.accounts(id) on delete set null,
  add column if not exists is_paid_default boolean not null default false;

alter table public.transactions
  add column if not exists fixed_leg text not null default 'single'
    check (fixed_leg in ('single', 'out', 'in'));

-- Transferência fixa gera duas pernas no mesmo mês: o índice único passa a
-- considerar a perna para não colidir.
drop index if exists public.transactions_fixed_expense_month_uidx;
create unique index if not exists transactions_fixed_transaction_month_uidx
  on public.transactions (fixed_transaction_id, fixed_month, fixed_leg);

alter index if exists public.fixed_expenses_user_active_idx
  rename to fixed_transactions_user_active_idx;
alter index if exists public.transactions_fixed_expense_idx
  rename to transactions_fixed_transaction_idx;

create index if not exists fixed_transactions_destination_idx
  on public.fixed_transactions(destination_account_id);

-- Recarrega o cache de schema do PostgREST após o rename.
notify pgrst, 'reload schema';
