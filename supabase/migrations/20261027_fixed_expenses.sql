-- Despesas fixas: modelo mensal, vínculo com a ocorrência e exceções por mês.
-- Idempotente para poder ser reaplicado com segurança.

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null check (amount > 0),
  category text,
  account_id uuid references public.accounts(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists fixed_expense_id uuid references public.fixed_expenses(id) on delete set null;
alter table public.transactions add column if not exists fixed_month date;

create unique index if not exists transactions_fixed_expense_month_uidx
  on public.transactions (fixed_expense_id, fixed_month);

create index if not exists fixed_expenses_user_active_idx on public.fixed_expenses(user_id, is_active);
create index if not exists transactions_fixed_expense_idx on public.transactions(fixed_expense_id);

create table if not exists public.fixed_expense_skips (
  fixed_expense_id uuid not null references public.fixed_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  created_at timestamptz not null default now(),
  primary key (fixed_expense_id, month)
);

alter table public.fixed_expenses enable row level security;
alter table public.fixed_expense_skips enable row level security;

drop policy if exists ler_proprias on public.fixed_expenses;
drop policy if exists inserir_proprias on public.fixed_expenses;
drop policy if exists atualizar_proprias on public.fixed_expenses;
drop policy if exists excluir_proprias on public.fixed_expenses;
create policy ler_proprias on public.fixed_expenses for select using (auth.uid() = user_id);
create policy inserir_proprias on public.fixed_expenses for insert with check (auth.uid() = user_id);
create policy atualizar_proprias on public.fixed_expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy excluir_proprias on public.fixed_expenses for delete using (auth.uid() = user_id);

drop policy if exists ler_proprias on public.fixed_expense_skips;
drop policy if exists inserir_proprias on public.fixed_expense_skips;
drop policy if exists excluir_proprias on public.fixed_expense_skips;
create policy ler_proprias on public.fixed_expense_skips for select using (auth.uid() = user_id);
create policy inserir_proprias on public.fixed_expense_skips for insert with check (auth.uid() = user_id);
create policy excluir_proprias on public.fixed_expense_skips for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.fixed_expenses to authenticated;
grant select, insert, delete on public.fixed_expense_skips to authenticated;
