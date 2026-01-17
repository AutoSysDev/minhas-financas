-- Migration: Create fiscal_notes table
-- Date: 2026-01-02

CREATE TABLE IF NOT EXISTS public.fiscal_notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nuvem_fiscal_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    nfe_number TEXT,
    nfe_series TEXT,
    xml_url TEXT,
    pdf_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own fiscal notes"
    ON public.fiscal_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fiscal notes"
    ON public.fiscal_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiscal notes"
    ON public.fiscal_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fiscal notes"
    ON public.fiscal_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fiscal_notes_updated_at
    BEFORE UPDATE ON public.fiscal_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_transaction_id ON public.fiscal_notes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_user_id ON public.fiscal_notes(user_id);
