CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON public.investments(date);
