-- Create investments table if it doesn't exist (idempotent)
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'renda_fixa', 'acoes', 'fiis', 'cripto', 'outros'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    initial_amount NUMERIC(15, 2),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add support for automation fields
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS ticker TEXT,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Add index for faster syncing lookups
CREATE INDEX IF NOT EXISTS idx_investments_ticker ON public.investments(ticker);

-- Enable RLS if not already enabled
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies exist (re-declaring with IF NOT EXISTS logic handled by drop/create pattern in other files, 
-- but here we just ensure basic access if the table was just created)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'investments_select_own'
    ) THEN
        CREATE POLICY investments_select_own ON public.investments FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'investments_insert_own'
    ) THEN
        CREATE POLICY investments_insert_own ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'investments_update_own'
    ) THEN
        CREATE POLICY investments_update_own ON public.investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'investments_delete_own'
    ) THEN
        CREATE POLICY investments_delete_own ON public.investments FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
