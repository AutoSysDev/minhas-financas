-- Enums (criados se não existirem)
DO $$ BEGIN
  CREATE TYPE transactions_type_enum AS ENUM ('INCOME','EXPENSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cards_brand_enum AS ENUM ('visa','mastercard','amex','elo','hipercard','discover','others');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cards_status_enum AS ENUM ('active','blocked','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscriptions_status_enum AS ENUM ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notifications_priority_enum AS ENUM ('low','normal','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ajustes de colunas para usar enums quando seguro (NOT VALID para evitar falhas imediatas)
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_enum_chk CHECK (type::text = ANY (ARRAY['INCOME','EXPENSE'])) NOT VALID;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS status cards_status_enum DEFAULT 'active',
  ADD CONSTRAINT cards_status_enum_chk CHECK (status IS NOT NULL) NOT VALID;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_brand_text_chk CHECK (brand IS NULL OR lower(brand) = ANY (ARRAY['visa','mastercard','amex','elo','hipercard','discover','others'])) NOT VALID;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_enum_chk CHECK (status::text = ANY (ARRAY['incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid'])) NOT VALID;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_priority_enum_chk CHECK (priority IN ('low','normal','high','medium')) NOT VALID;

-- FKs essenciais e NOT NULL (onde aplicável)
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_card_fk FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_linked_account_fk FOREIGN KEY (linked_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_default_card_fk FOREIGN KEY (default_card_id) REFERENCES public.cards(id) ON DELETE SET NULL;

-- Migrar category_id em transactions (adiciona coluna e preenche a partir de categories.name)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS category_id UUID;

UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE t.category_id IS NULL
  AND c.user_id = t.user_id
  AND c.name = t.category;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_category_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Índices e UNIQUEs por usuário
DO $$ BEGIN
  ALTER TABLE public.accounts
    ADD CONSTRAINT accounts_unique_user_name UNIQUE (user_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.cards
    ADD CONSTRAINT cards_unique_user_name UNIQUE (user_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.cards
    ADD CONSTRAINT cards_unique_user_last_digits UNIQUE (user_id, last_digits);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_unique_user_category_period UNIQUE (user_id, category, period);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_unique_user_name_type UNIQUE (user_id, name, type);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_unique_customer UNIQUE (stripe_customer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_paid ON public.transactions(user_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_ts ON public.notifications(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON public.subscriptions(current_period_end);

-- RLS: garantir ativação nas tabelas (se existirem e ainda não ativadas)
DO $$ BEGIN
  ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- Políticas simples: usuário só acessa seus próprios dados
CREATE POLICY IF NOT EXISTS accounts_select_own ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS accounts_insert_own ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS accounts_update_own ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS accounts_delete_own ON public.accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS transactions_select_own ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS transactions_insert_own ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS transactions_update_own ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS transactions_delete_own ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS cards_select_own ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_insert_own ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_update_own ON public.cards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_delete_own ON public.cards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS categories_select_own ON public.categories FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY IF NOT EXISTS categories_insert_own ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS categories_update_own ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY IF NOT EXISTS categories_delete_own ON public.categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY IF NOT EXISTS goals_select_own ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS goals_insert_own ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS goals_update_own ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS goals_delete_own ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS budgets_select_own ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS budgets_insert_own ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS budgets_update_own ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS budgets_delete_own ON public.budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS investments_select_own ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS investments_insert_own ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS investments_update_own ON public.investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS investments_delete_own ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Timestamps e triggers de updated_at
DO $$ BEGIN
  ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER accounts_set_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER cards_set_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Triggers de consistência (saldos e faturas)
CREATE OR REPLACE FUNCTION recompute_account_balance(p_account_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.accounts a
  SET balance = COALESCE((
    SELECT SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END)
    FROM public.transactions t
    WHERE t.account_id = a.id AND t.is_paid = true
  ), 0)
  WHERE a.id = p_account_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recompute_card_invoice(p_card_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.cards c
  SET current_invoice = COALESCE((
    SELECT SUM(t.amount)
    FROM public.transactions t
    WHERE t.card_id = c.id AND (t.type = 'EXPENSE' OR t.type = 'expense')
  ), 0)
  WHERE c.id = p_card_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION transactions_consistency_trg()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.account_id IS NOT NULL THEN PERFORM recompute_account_balance(NEW.account_id); END IF;
    IF NEW.card_id IS NOT NULL THEN PERFORM recompute_card_invoice(NEW.card_id); END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.account_id IS NOT NULL THEN PERFORM recompute_account_balance(OLD.account_id); END IF;
    IF OLD.card_id IS NOT NULL THEN PERFORM recompute_card_invoice(OLD.card_id); END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER transactions_consistency_after
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION transactions_consistency_trg();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Observações:\n-- - Constraints marcadas como NOT VALID: depois de sanity check em dados, pode-se VALIDATE CONSTRAINT.\n-- - Migração de category_id preserva coluna textual `category` para compatibilidade; futura remoção pode ser planejada.\n
