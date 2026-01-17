-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS investments_select_own ON public.investments;
DROP POLICY IF EXISTS investments_insert_own ON public.investments;
DROP POLICY IF EXISTS investments_update_own ON public.investments;
DROP POLICY IF EXISTS investments_delete_own ON public.investments;

-- Create policies
CREATE POLICY investments_select_own ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investments_insert_own ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investments_update_own ON public.investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investments_delete_own ON public.investments FOR DELETE USING (auth.uid() = user_id);
