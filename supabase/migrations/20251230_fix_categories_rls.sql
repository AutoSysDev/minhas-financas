-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS categories_select_own ON public.categories;
DROP POLICY IF EXISTS categories_insert_own ON public.categories;
DROP POLICY IF EXISTS categories_update_own ON public.categories;
DROP POLICY IF EXISTS categories_delete_own ON public.categories;

-- Create policies

-- SELECT: Allow users to see their own categories (user_id matches uid)
-- OR see global categories (user_id is NULL)
CREATE POLICY categories_select_own ON public.categories FOR SELECT
USING (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- INSERT: Users can only insert for themselves
CREATE POLICY categories_insert_own ON public.categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own categories (and not global ones)
CREATE POLICY categories_update_own ON public.categories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own categories (and not global ones)
CREATE POLICY categories_delete_own ON public.categories FOR DELETE
USING (auth.uid() = user_id);
