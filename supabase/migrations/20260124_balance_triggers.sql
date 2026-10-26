-- MIGRATION: Automatic Balance and Invoice Management
-- Location: supabase/migrations/20260124_balance_triggers.sql

-- 1. Function to update account balance based on transactions
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    impact NUMERIC;
BEGIN
    -- Only affect logic if transaction is paid and not a credit card transaction
    -- If it's a transfer, we might need more logic, but for simple income/expense:

    IF TG_OP = 'INSERT' THEN
        IF NEW.is_paid AND NEW.account_id IS NOT NULL AND NEW.card_id IS NULL THEN
            impact := CASE WHEN NEW.type = 'INCOME' THEN NEW.amount ELSE -NEW.amount END;
            UPDATE public.accounts SET balance = balance + impact WHERE id = NEW.account_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old impact
        IF OLD.is_paid AND OLD.account_id IS NOT NULL AND OLD.card_id IS NULL THEN
            impact := CASE WHEN OLD.type = 'INCOME' THEN -OLD.amount ELSE OLD.amount END;
            UPDATE public.accounts SET balance = balance + impact WHERE id = OLD.account_id;
        END IF;
        
        -- Apply new impact
        IF NEW.is_paid AND NEW.account_id IS NOT NULL AND NEW.card_id IS NULL THEN
            impact := CASE WHEN NEW.type = 'INCOME' THEN NEW.amount ELSE -NEW.amount END;
            UPDATE public.accounts SET balance = balance + impact WHERE id = NEW.account_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_paid AND OLD.account_id IS NOT NULL AND OLD.card_id IS NULL THEN
            impact := CASE WHEN OLD.type = 'INCOME' THEN -OLD.amount ELSE OLD.amount END;
            UPDATE public.accounts SET balance = balance + impact WHERE id = OLD.account_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to update card invoice
CREATE OR REPLACE FUNCTION public.update_card_invoice()
RETURNS TRIGGER AS $$
DECLARE
    impact NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.card_id IS NOT NULL AND NEW.type = 'EXPENSE' THEN
            UPDATE public.cards SET current_invoice = current_invoice + NEW.amount WHERE id = NEW.card_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old
        IF OLD.card_id IS NOT NULL AND OLD.type = 'EXPENSE' THEN
            UPDATE public.cards SET current_invoice = current_invoice - OLD.amount WHERE id = OLD.card_id;
        END IF;
        
        -- Apply new
        IF NEW.card_id IS NOT NULL AND NEW.type = 'EXPENSE' THEN
            UPDATE public.cards SET current_invoice = current_invoice + NEW.amount WHERE id = NEW.card_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.card_id IS NOT NULL AND OLD.type = 'EXPENSE' THEN
            UPDATE public.cards SET current_invoice = current_invoice - OLD.amount WHERE id = OLD.card_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers
DROP TRIGGER IF EXISTS tr_update_account_balance ON public.transactions;
CREATE TRIGGER tr_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

DROP TRIGGER IF EXISTS tr_update_card_invoice ON public.transactions;
CREATE TRIGGER tr_update_card_invoice
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_card_invoice();
