-- Migration: Add new fields to accounts table
-- Location: supabase/migrations/20260125_add_account_fields.sql

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Corrente',
ADD COLUMN IF NOT EXISTS is_default_for_debit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_summary BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ignore_in_total BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overdraft_limit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS overdraft_interest_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS overdraft_used NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;
